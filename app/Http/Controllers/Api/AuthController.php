<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ThrottlePinAttempts;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    private function jsonResponseWithCookie(array $data, string $token, string $name = 'classinote_token'): JsonResponse
    {
        $secure = env('SESSION_SECURE_COOKIE', true);
        return response()->json($data)->withCookie(
            cookie($name, $token, 60 * 24 * 300, '/', null, $secure, true, false, 'lax')
        );
    }
    public function loginSuperadmin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->where('role', 'superadmin')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        $token = $user->createToken('superadmin-token')->plainTextToken;

        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ])->withCookie(
            cookie('classinote_token', $token, 60, '/', null, $secure, true, false, 'lax')
        );
    }

    public function loginGeneric(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'mot_de_passe' => 'required|string',
            'role' => 'required|string|in:superadmin,admin,prof,parent',
        ]);

        $password = $request->mot_de_passe;
        $role = $request->role;

        if ($role === 'superadmin') {
            $user = User::where('email', $request->email)->where('role', 'superadmin')->first();
            if (!$user || !Hash::check($password, $user->password)) {
                throw ValidationException::withMessages(['email' => ['Identifiants incorrects.']]);
            }
            if (!$user->active) {
                return response()->json(['message' => 'Compte désactivé'], 403);
            }
            $token = $user->createToken('superadmin-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'success' => true,
                'token' => $token,
                'role' => $user->role,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'force_password_reset' => $user->force_password_reset,
                ],
            ], $token);
        }

        if ($role === 'admin') {
            $user = User::where('email', $request->email)->where('role', 'admin')->first();
            if (!$user || !Hash::check($password, $user->password)) {
                throw ValidationException::withMessages(['email' => ['Identifiants incorrects.']]);
            }
            if (!$user->active) {
                return response()->json(['message' => 'Compte désactivé'], 403);
            }
            $token = $user->createToken('admin-token')->plainTextToken;
            $schools = $user->schools()->get()->map(fn($s) => ['id' => $s->id, 'nom' => $s->nom]);
            return $this->jsonResponseWithCookie([
                'success' => true,
                'token' => $token,
                'role' => $user->role,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'has_pin' => $user->hasPin(),
                    'force_password_reset' => $user->force_password_reset,
                ],
                'schools' => $schools,
            ], $token);
        }

        return response()->json(['message' => 'Rôle non supporté pour cette connexion.'], 422);
    }

    public function loginAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->where('role', 'admin')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        $schools = $user->schools()->get()->map(fn($s) => [
            'id' => $s->id,
            'nom' => $s->nom,
        ]);

        return $this->jsonResponseWithCookie([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'has_pin' => $user->hasPin(),
                'force_password_reset' => $user->force_password_reset,
            ],
            'schools' => $schools,
        ], $token);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:9',
        ]);

        $code = strtoupper($request->code);

        $prof = \App\Models\Prof::where('code', $code)->where('code_used', false)->first();
        $parent = \App\Models\ParentModel::where('code', $code)->where('code_used', false)->first();
        $eleve = \App\Models\Eleve::where('code', $code)->where('code_used', false)->first();

        if ($prof) {
            $response = [
                'type' => 'prof',
                'id' => $prof->id,
                'nom_complet' => $prof->nom_complet,
                'requires_pin' => !$prof->pin_hash,
            ];

            if ($prof->hasPin()) {
                $tempToken = $prof->createToken('prof-temp-token')->plainTextToken;
                return $this->jsonResponseWithCookie($response, $tempToken);
            }

            return response()->json($response);
        }

        // Check returning users (code already used, has PIN)
        $profUsed = \App\Models\Prof::where('code', $code)->where('code_used', true)->first();
        if ($profUsed && $profUsed->hasPin()) {
            $tempToken = $profUsed->createToken('prof-temp-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'type' => 'prof',
                'id' => $profUsed->id,
                'nom_complet' => $profUsed->nom_complet,
                'requires_pin' => false,
            ], $tempToken);
        }

        if ($parent) {
            $response = [
                'type' => 'parent',
                'id' => $parent->id,
                'requires_pin' => !$parent->pin_hash,
            ];

            if ($parent->hasPin()) {
                $tempToken = $parent->createToken('parent-temp-token')->plainTextToken;
                return $this->jsonResponseWithCookie($response, $tempToken);
            }

            return response()->json($response);
        }

        // Check returning parents (code already used, has PIN)
        $parentUsed = \App\Models\ParentModel::where('code', $code)->where('code_used', true)->first();
        if ($parentUsed && $parentUsed->hasPin()) {
            $tempToken = $parentUsed->createToken('parent-temp-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'type' => 'parent',
                'id' => $parentUsed->id,
                'requires_pin' => false,
            ], $tempToken);
        }

        if ($eleve) {
            return response()->json([
                'type' => 'eleve',
                'id' => $eleve->id,
                'nom_complet' => $eleve->nom_complet,
                'classe' => $eleve->classe->libelle ?? null,
            ]);
        }

        return response()->json(['message' => 'Code invalide ou déjà utilisé'], 404);
    }

    public function setupPin(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:9',
            'pin' => 'required|digits:4',
            'type' => 'required|in:prof,parent,eleve',
        ]);

        $code = strtoupper($request->code);

        if ($request->type === 'prof') {
            $prof = \App\Models\Prof::where('code', $code)->where('code_used', false)->first();
            if (!$prof) {
                return response()->json(['message' => 'Code invalide'], 404);
            }

            $prof->forceFill([
                'code_used' => true,
                'pin_hash' => Hash::make($request->pin),
            ])->save();

            $token = $prof->createToken('prof-token')->plainTextToken;

            return $this->jsonResponseWithCookie([
                'type' => 'prof',
                'id' => $prof->id,
                'nom_complet' => $prof->nom_complet,
            ], $token);
        }

        if ($request->type === 'eleve') {
            $eleve = \App\Models\Eleve::where('code', $code)->where('code_used', false)->first();
            if (!$eleve) {
                return response()->json(['message' => 'Code invalide'], 404);
            }

            $eleve->forceFill([
                'pin_hash' => Hash::make($request->pin),
                'code_used' => true,
            ])->save();

            $token = $eleve->createToken('eleve-token')->plainTextToken;

            return $this->jsonResponseWithCookie([
                'type' => 'eleve',
                'id' => $eleve->id,
                'nom_complet' => $eleve->nom_complet,
            ], $token);
        }

        $parent = \App\Models\ParentModel::where('code', $code)->where('code_used', false)->first();
        if (!$parent) {
            return response()->json(['message' => 'Code invalide'], 404);
        }

        $parent->forceFill([
            'code_used' => true,
            'pin_hash' => Hash::make($request->pin),
        ])->save();

        $token = $parent->createToken('parent-token')->plainTextToken;

        return $this->jsonResponseWithCookie([
            'type' => 'parent',
            'id' => $parent->id,
            'enfants' => $parent->getEnfantsInfo(),
        ], $token);
    }

    public function loginPin(Request $request): JsonResponse
    {
        $request->validate([
            'pin' => 'required|digits:4',
            'type' => 'required|in:prof,parent,eleve',
        ]);

        $accessToken = PersonalAccessToken::findToken($request->bearerToken());

        if (!$accessToken) {
            return response()->json(['message' => 'Token invalide'], 401);
        }

        $tokenable = $accessToken->tokenable;
        $pinKey = 'pin_attempts:' . $request->ip();

        if ($request->type === 'prof' && $tokenable instanceof \App\Models\Prof) {
            if (!$tokenable->verifyPin($request->pin)) {
                ThrottlePinAttempts::increment($pinKey);
                return response()->json(['message' => 'PIN incorrect'], 422);
            }
            ThrottlePinAttempts::reset($pinKey);
            if ($tokenable->pin_must_change) {
                return response()->json([
                    'success' => true,
                    'must_change_pin' => true,
                    'nom_complet' => $tokenable->nom_complet,
                ]);
            }
            return response()->json([
                'success' => true,
                'nom_complet' => $tokenable->nom_complet,
                'user' => [
                    'id' => $tokenable->id,
                    'nom' => $tokenable->nom,
                    'prenom' => $tokenable->prenom,
                    'nom_complet' => $tokenable->nom_complet,
                    'type' => 'prof',
                ],
            ]);
        }

        if ($request->type === 'eleve' && $tokenable instanceof \App\Models\Eleve) {
            if (!$tokenable->verifyPin($request->pin)) {
                ThrottlePinAttempts::increment($pinKey);
                return response()->json(['message' => 'PIN incorrect'], 422);
            }
            ThrottlePinAttempts::reset($pinKey);
            return response()->json(['success' => true, 'nom_complet' => $tokenable->nom_complet, 'classe' => $tokenable->classe->libelle ?? null]);
        }

        if ($request->type === 'parent' && $tokenable instanceof \App\Models\ParentModel) {
            if (!$tokenable->verifyPin($request->pin)) {
                ThrottlePinAttempts::increment($pinKey);
                return response()->json(['message' => 'PIN incorrect'], 422);
            }
            ThrottlePinAttempts::reset($pinKey);
            if ($tokenable->pin_must_change) {
                return response()->json([
                    'success' => true,
                    'must_change_pin' => true,
                    'enfants' => $tokenable->getEnfantsInfo(),
                ]);
            }
            return response()->json([
                'success' => true,
                'enfants' => $tokenable->getEnfantsInfo(),
                'user' => [
                    'id' => $tokenable->id,
                    'telephone' => $tokenable->telephone,
                    'type' => 'parent',
                ],
            ]);
        }

        return response()->json(['message' => 'Type invalide'], 400);
    }

    public function changePin(Request $request): JsonResponse
    {
        $request->validate([
            'current_pin' => 'required|string|size:4',
            'new_pin' => 'required|string|size:4|different:current_pin',
            'type' => 'required|in:prof,parent',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($request->type === 'prof' && $user instanceof \App\Models\Prof) {
            if (!$user->verifyPin($request->current_pin)) {
                return response()->json(['message' => 'Ancien PIN incorrect'], 422);
            }
            $user->forceFill([
                'pin_hash' => \Hash::make($request->new_pin),
                'pin_must_change' => false,
            ])->save();
            return response()->json(['success' => true, 'message' => 'PIN modifié avec succès']);
        }

        if ($request->type === 'parent' && $user instanceof \App\Models\ParentModel) {
            if (!$user->verifyPin($request->current_pin)) {
                return response()->json(['message' => 'Ancien PIN incorrect'], 422);
            }
            $user->forceFill([
                'pin_hash' => \Hash::make($request->new_pin),
                'pin_must_change' => false,
            ])->save();
            return response()->json(['success' => true, 'message' => 'PIN modifié avec succès']);
        }

        return response()->json(['message' => 'Type invalide'], 400);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? $user->nom_complet ?? '',
                'role' => $user->role,
            ],
        ]);
    }

    public function unlock(Request $request): JsonResponse
    {
        $request->validate([
            'pin' => 'required',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $pinKey = 'pin_attempts:unlock:' . ($user->email ?? $user->id);
        $attempts = cache()->get($pinKey, 0);

        if ($attempts >= 5) {
            return response()->json([
                'message' => 'Trop de tentatives. Réessayez dans 5 minutes.',
            ], 429);
        }

        if (!$user->hasPin() || !$user->verifyPin($request->pin)) {
            cache()->put($pinKey, $attempts + 1, 300);
            return response()->json(['message' => 'PIN incorrect'], 422);
        }

        cache()->forget($pinKey);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? $user->nom_complet ?? '',
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
        }

        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json(['success' => true])->withCookie(
            cookie('classinote_token', '', -60, '/', null, $secure, true, false, 'lax')
        );
    }

    public function setupAdminPin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'pin' => 'required|digits:6',
        ]);

        $user = User::where('email', $request->email)->whereIn('role', ['admin', 'superadmin'])->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 422);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        $user->forceFill(['pin_hash' => Hash::make($request->pin)])->save();

        $token = $user->createToken('admin-token')->plainTextToken;

        $schools = $user->schools()->get()->map(fn($s) => [
            'id' => $s->id,
            'nom' => $s->nom,
        ]);

        return $this->jsonResponseWithCookie([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'has_pin' => true,
            ],
            'schools' => $schools,
        ], $token);
    }

    public function loginAdminPin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'pin' => 'required|digits:6',
        ]);

        $user = User::where('email', $request->email)->whereIn('role', ['admin', 'superadmin'])->first();

        $pinKey = 'pin_attempts:admin:' . $request->email;

        if (!$user || !$user->hasPin() || !$user->verifyPin($request->pin)) {
            ThrottlePinAttempts::increment($pinKey);
            return response()->json(['message' => 'Email ou PIN incorrect'], 422);
        }

        ThrottlePinAttempts::reset($pinKey);

        if (!$user->active) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        if ($user->pin_must_change) {
            $token = $user->createToken('admin-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'success' => true,
                'must_change_pin' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'has_pin' => true,
                    'force_password_reset' => $user->force_password_reset,
                ],
            ], $token);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        $schools = $user->schools()->get()->map(fn($s) => [
            'id' => $s->id,
            'nom' => $s->nom,
        ]);

        return $this->jsonResponseWithCookie([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'has_pin' => true,
                'force_password_reset' => $user->force_password_reset,
            ],
            'schools' => $schools,
        ], $token);
    }

    public function changeAdminPin(Request $request): JsonResponse
    {
        $request->validate([
            'current_pin' => 'required|string|size:6',
            'new_pin' => 'required|string|size:6|different:current_pin',
        ]);

        $user = $request->user();
        if (!$user || !$user instanceof User) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!$user->verifyPin($request->current_pin)) {
            return response()->json(['message' => 'Ancien PIN incorrect'], 422);
        }

        $user->forceFill([
            'pin_hash' => \Hash::make($request->new_pin),
            'pin_must_change' => false,
        ])->save();

        return response()->json(['success' => true, 'message' => 'PIN modifié avec succès']);
    }

    public function checkAdminPin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->where('role', 'admin')->first();

        if (!$user || !$user->hasPin()) {
            return response()->json([
                'message' => 'Aucun PIN configuré pour ce compte.',
            ], 404);
        }

        $token = $user->createToken('admin-pin-token')->plainTextToken;

        return $this->jsonResponseWithCookie([
            'message' => 'PIN vérifié.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], $token);
    }

    public function magicActivate(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $prof = \App\Models\Prof::where('magic_token', $request->token)->first();
        if ($prof) {
            if (!$prof->hasPin()) {
                return response()->json([
                    'message' => 'Vous devez d\'abord configurer votre PIN.',
                    'requires_pin' => true,
                ], 403);
            }
            $prof->forceFill(['magic_token' => null])->save();
            $token = $prof->createToken('prof-auth-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'type' => 'prof',
                'id' => $prof->id,
                'nom_complet' => $prof->nom_complet,
                'requires_pin' => false,
            ], $token);
        }

        $parent = \App\Models\ParentModel::where('magic_token', $request->token)->first();
        if ($parent) {
            if (!$parent->hasPin()) {
                return response()->json([
                    'message' => 'Vous devez d\'abord configurer votre PIN.',
                    'requires_pin' => true,
                ], 403);
            }
            $parent->forceFill(['magic_token' => null])->save();
            $token = $parent->createToken('parent-auth-token')->plainTextToken;
            return $this->jsonResponseWithCookie([
                'type' => 'parent',
                'id' => $parent->id,
                'requires_pin' => false,
            ], $token);
        }

        return response()->json(['message' => 'Lien magique invalide'], 404);
    }

    public function adminMagicLink(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $data = \Illuminate\Support\Facades\Cache::get("admin_magic_link:{$request->token}");

        if (!$data) {
            return response()->json(['message' => 'Lien invalide ou expiré'], 404);
        }

        \Illuminate\Support\Facades\Cache::forget("admin_magic_link:{$request->token}");

        $admin = User::find($data['admin_id']);
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Admin introuvable'], 404);
        }

        $token = $admin->createToken('admin-magic-token')->plainTextToken;

        $schools = $admin->schools()->get()->map(fn($s) => [
            'id' => $s->id,
            'nom' => $s->nom,
        ]);

        return $this->jsonResponseWithCookie([
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'has_pin' => $admin->hasPin(),
            ],
            'schools' => $schools,
        ], $token);
    }
}
