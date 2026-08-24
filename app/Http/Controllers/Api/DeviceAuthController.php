<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prof;
use App\Models\ParentModel;
use App\Models\Eleve;
use App\Models\TrustedDevice;
use App\Services\PhoneNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DeviceAuthController extends Controller
{
    /**
     * Étape 1 : Vérifier le code d'accès ET le numéro de téléphone
     * POST /auth/device/verify
     * Body: { code, telephone }
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|min:8|max:9',
            'telephone' => 'required|string',
        ]);

        $code = strtoupper(preg_replace('/[^A-Z0-9]/', '', $request->code));
        $telephone = $request->telephone;

        $prof = Prof::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();
        $parent = ParentModel::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();
        $eleve = Eleve::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();

        $user = $prof ?? $parent ?? $eleve;

        if (!$user) {
            return response()->json(['valid' => false, 'message' => 'Code ou numéro incorrect'], 422);
        }

        // Pour les élèves, pas de vérification de téléphone
        if (!$eleve && !PhoneNormalizer::userInputMatches($telephone, $user->telephone)) {
            return response()->json(['valid' => false, 'message' => 'Code ou numéro incorrect'], 422);
        }

        $type = $prof ? 'prof' : ($parent ? 'parent' : 'eleve');

        return response()->json([
            'valid' => true,
            'type' => $type,
            'id' => $user->id,
        ]);
    }

    /**
     * Étape 3 : Enregistrer l'appareil (code + téléphone + PIN)
     * POST /auth/device/register
     * Body: { code, telephone, pin }
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|min:8|max:9',
            'telephone' => 'required|string',
            'pin' => 'required|string|min:4|max:6',
        ]);

        $code = strtoupper(preg_replace('/[^A-Z0-9]/', '', $request->code));
        $telephone = $request->telephone;

        // Chercher le profil par code (avec ou sans tiret)
        $prof = Prof::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();
        $parent = ParentModel::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();
        $eleve = Eleve::whereRaw("REPLACE(UPPER(code), '-', '') = ?", [$code])->first();

        $user = null;
        $type = null;

        if ($prof) {
            if (!PhoneNormalizer::userInputMatches($telephone, $prof->telephone)) {
                return response()->json(['message' => 'Numéro de téléphone incorrect'], 422);
            }
            $user = $prof;
            $type = 'prof';
        } elseif ($parent) {
            if (!PhoneNormalizer::userInputMatches($telephone, $parent->telephone)) {
                return response()->json(['message' => 'Numéro de téléphone incorrect'], 422);
            }
            $user = $parent;
            $type = 'parent';
        } elseif ($eleve) {
            $user = $eleve;
            $type = 'eleve';
        }

        if (!$user) {
            return response()->json(['message' => 'Code invalide'], 404);
        }

        // Empêcher l'écrasement du PIN existant
        if ($user->hasPin()) {
            return response()->json(['message' => 'Ce compte a déjà un PIN. Utilisez la connexion par téléphone et PIN.'], 422);
        }

        // Définir le PIN
        $user->forceFill([
            'pin_hash' => Hash::make($request->pin),
            'code_used' => true,
        ])->save();

        // Créer l'appareil de confiance
        $deviceToken = TrustedDevice::generateToken();
        TrustedDevice::create([
            'device_token' => $deviceToken,
            'user_type' => $type,
            'user_id' => $user->id,
            'device_name' => $request->header('User-Agent'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'last_used_at' => now(),
            'expires_at' => now()->addDays(180),
        ]);

        // Créer le token Sanctum
        $sanctumToken = $user->createToken('device-auth')->plainTextToken;

        // Définir les cookies
        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'success' => true,
            'type' => $type,
            'user' => $this->getUserData($user, $type),
        ])
        ->withCookie(cookie('classinote_token', $sanctumToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'))
        ->withCookie(cookie('classinote_device', $deviceToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'));
    }

    /**
     * Reconnexion sur un appareil connu (session expirée)
     * POST /auth/device/login
     * Body: { telephone, pin, type }
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'telephone' => 'required|string',
            'pin' => 'required|string|min:4|max:6',
            'type' => 'required|in:prof,parent,eleve',
        ]);

        $telephone = $request->telephone;

        // Chercher l'utilisateur par téléphone (avec normalisation)
        $user = null;
        $type = $request->type;

        if ($type === 'prof') {
            $profs = Prof::whereNotNull('telephone')->get();
            foreach ($profs as $p) {
                if (PhoneNormalizer::userInputMatches($telephone, $p->telephone)) {
                    $user = $p;
                    break;
                }
            }
        } elseif ($type === 'parent') {
            $parents = ParentModel::whereNotNull('telephone')->get();
            foreach ($parents as $p) {
                if (PhoneNormalizer::userInputMatches($telephone, $p->telephone)) {
                    $user = $p;
                    break;
                }
            }
        } elseif ($type === 'eleve') {
            $eleves = Eleve::whereNotNull('telephone')->get();
            foreach ($eleves as $e) {
                if (PhoneNormalizer::userInputMatches($telephone, $e->telephone)) {
                    $user = $e;
                    break;
                }
            }
        }

        if (!$user) {
            return response()->json(['message' => 'Numéro de téléphone incorrect'], 422);
        }

        if (!$user->hasPin() || !$user->verifyPin($request->pin)) {
            return response()->json(['message' => 'PIN incorrect'], 422);
        }

        // Créer ou mettre à jour l'appareil de confiance
        $deviceToken = $request->cookie('classinote_device');
        if ($deviceToken) {
            $device = TrustedDevice::where('device_token', $deviceToken)
                ->where('user_type', $type)
                ->where('user_id', $user->id)
                ->first();

            if ($device) {
                $device->update([
                    'last_used_at' => now(),
                    'expires_at' => now()->addDays(180),
                ]);
            }
        }

        // Créer le token Sanctum
        $sanctumToken = $user->createToken('device-auth')->plainTextToken;

        // Définir les cookies
        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'success' => true,
            'type' => $type,
            'user' => $this->getUserData($user, $type),
        ])
        ->withCookie(cookie('classinote_token', $sanctumToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'));
    }

    /**
     * Vérifier si l'appareil est de confiance
     * GET /auth/device/check
     */
    public function check(Request $request): JsonResponse
    {
        $deviceToken = $request->cookie('classinote_device');

        if (!$deviceToken) {
            return response()->json(['trusted' => false]);
        }

        $device = TrustedDevice::where('device_token', $deviceToken)->first();

        if (!$device || $device->isExpired()) {
            return response()->json(['trusted' => false]);
        }

        return response()->json([
            'trusted' => true,
            'user_type' => $device->user_type,
            'user_id' => $device->user_id,
        ]);
    }

    /**
     * Connexion par PIN seul (appareil déjà enregistré)
     * POST /auth/device/pin-login
     * Body: { pin }
     */
    public function pinLogin(Request $request): JsonResponse
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:6',
        ]);

        $deviceToken = $request->cookie('classinote_device');

        if (!$deviceToken) {
            return response()->json(['message' => 'Appareil non reconnu'], 401);
        }

        $device = TrustedDevice::where('device_token', $deviceToken)
            ->where('expires_at', '>', now())
            ->first();

        if (!$device) {
            return response()->json(['message' => 'Appareil expiré'], 401);
        }

        $user = null;
        $type = $device->user_type;

        if ($type === 'prof') {
            $user = Prof::find($device->user_id);
        } elseif ($type === 'parent') {
            $user = ParentModel::find($device->user_id);
        }

        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        if (!$user->hasPin() || !$user->verifyPin($request->pin)) {
            return response()->json(['message' => 'PIN incorrect'], 422);
        }

        // Mettre à jour l'appareil
        $device->update([
            'last_used_at' => now(),
            'expires_at' => now()->addDays(180),
        ]);

        // Créer le token Sanctum
        $sanctumToken = $user->createToken('device-auth')->plainTextToken;

        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'success' => true,
            'type' => $type,
            'user' => $this->getUserData($user, $type),
        ])
        ->withCookie(cookie('classinote_token', $sanctumToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'));
    }

    private function getUserData($user, string $type): array
    {
        if ($type === 'prof') {
            return [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'nom_complet' => $user->nom_complet,
                'type' => 'prof',
            ];
        } elseif ($type === 'parent') {
            return [
                'id' => $user->id,
                'telephone' => $user->telephone,
                'type' => 'parent',
                'enfants' => $user->getEnfantsInfo(),
            ];
        } elseif ($type === 'eleve') {
            return [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'nom_complet' => $user->nom_complet,
                'type' => 'eleve',
            ];
        }
        return [];
    }

    /**
     * Enregistrer PIN après authentification par lien magique (session-based)
     * POST /auth/device/setup-pin
     * Body: { pin }
     */
    public function setupPin(Request $request): JsonResponse
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:6',
        ]);

        // Get user from session (prof or parent guard)
        $user = Auth::guard('prof')->user();
        $type = 'prof';

        if (!$user) {
            $user = Auth::guard('parent')->user();
            $type = 'parent';
        }

        if (!$user) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        // Set PIN
        $user->forceFill([
            'pin_hash' => Hash::make($request->pin),
            'code_used' => true,
        ])->save();

        // Create trusted device
        $deviceToken = TrustedDevice::generateToken();
        TrustedDevice::create([
            'device_token' => $deviceToken,
            'user_type' => $type,
            'user_id' => $user->id,
            'device_name' => $request->header('User-Agent'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'last_used_at' => now(),
            'expires_at' => now()->addDays(180),
        ]);

        // Create Sanctum token
        $sanctumToken = $user->createToken('device-auth')->plainTextToken;

        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'success' => true,
            'type' => $type,
            'user' => $this->getUserData($user, $type),
        ])
        ->withCookie(cookie('classinote_token', $sanctumToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'))
        ->withCookie(cookie('classinote_device', $deviceToken, 60 * 24 * 180, '/', null, $secure, true, false, 'lax'));
    }
}
