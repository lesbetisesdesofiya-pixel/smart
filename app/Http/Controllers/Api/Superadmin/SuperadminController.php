<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\AiProvider;
use App\Models\School;
use App\Models\User;
use App\Services\SchoolImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperadminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $totalEcoles = School::count();
        $ecolesActives = School::where('active', true)->count();
        $totalEleves = \App\Models\Eleve::count();
        $totalProfs = \App\Models\Prof::count();
        $totalRevenus = \App\Models\SchoolPayment::where('annule', false)->sum('montant');
        $reversementsEnAttente = \App\Models\SchoolPayment::where('annule', false)
            ->with('school:id,nom')
            ->get();

        $ecoles = School::withCount(['eleves', 'profs', 'classes'])
            ->orderBy('nom')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'nom' => $s->nom,
                'code' => $s->code ?? '',
                'eleves_count' => $s->eleves_count,
                'profs_count' => $s->profs_count,
                'classes_count' => $s->classes_count,
            ]);

        $revenues = \App\Models\SchoolPayment::with('school:id,nom')
            ->where('annule', false)
            ->orderByDesc('date_paiement')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'ecole' => $p->school->nom ?? '',
                'montant' => (float) $p->montant,
                'statut' => 'paye',
                'periodicite' => $p->mois_couverts ? implode(', ', $p->mois_couverts) : '',
            ]);

        $elevesEvolution = \App\Models\Eleve::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->whereYear('created_at', now()->year)
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderBy('month')
            ->get();

        $revenusEvolution = \App\Models\SchoolPayment::where('annule', false)
            ->selectRaw("DATE_FORMAT(date_paiement, '%Y-%m') as month, SUM(montant) as total")
            ->whereYear('date_paiement', now()->year)
            ->groupByRaw("DATE_FORMAT(date_paiement, '%Y-%m')")
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_ecoles' => $totalEcoles,
                'ecoles_actives' => $ecolesActives,
                'total_eleves' => $totalEleves,
                'total_profs' => $totalProfs,
                'total_revenus' => (float) $totalRevenus,
                'reversements_en_attente' => $reversementsEnAttente,
                'ecoles' => $ecoles,
                'revenues' => $revenues,
                'eleves_evolution' => $elevesEvolution,
                'revenus_evolution' => $revenusEvolution,
            ],
        ]);
    }

    public function schools(): JsonResponse
    {
        $schools = School::withCount(['profs', 'eleves', 'classes'])
            ->with(['admins:id,name,email,role,active'])
            ->get();

        $blockedParentsBySchool = \App\Models\ParentModel::selectRaw('eleves.school_id, COUNT(DISTINCT parents.id) as blocked_parents_count')
            ->join('parent_eleve', 'parents.id', '=', 'parent_eleve.parent_id')
            ->join('eleves', 'parent_eleve.eleve_id', '=', 'eleves.id')
            ->where('eleves.access_locked', true)
            ->groupBy('eleves.school_id')
            ->pluck('blocked_parents_count', 'school_id');

        return response()->json($schools->map(function ($school) use ($blockedParentsBySchool) {
            $data = $school->toArray();
            $data['blocked_parents_count'] = (int) ($blockedParentsBySchool[$school->id] ?? 0);
            return $data;
        }));
    }

    public function storeSchool(Request $request): JsonResponse
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string',
            'email' => 'nullable|email',
            'ville' => 'nullable|string',
            'admin_email' => 'required|email',
        ]);

        $school = School::create($request->only(['nom', 'adresse', 'telephone', 'email', 'ville']));

        $adminPassword = \Illuminate\Support\Str::random(16);
        $admin = new User([
            'name' => 'Admin ' . $school->nom,
            'email' => $request->admin_email,
        ]);
        $admin->password = Hash::make($adminPassword);
        $admin->forceFill(['role' => 'admin', 'force_password_reset' => true])->save();

        $admin->schools()->attach($school->id);

        return response()->json([
            'school' => $school,
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
            ],
            'temporary_password' => $adminPassword,
            'message' => 'École créée avec succès.',
        ], 201);
    }

    public function importSchoolData(Request $request, School $school): JsonResponse
    {
        $request->validate([
            'data' => 'required|array',
        ]);

        $service = new SchoolImportService();
        $result = $service->import($school, $request->data);

        return response()->json($result);
    }

    public function updateSchool(Request $request, School $school): JsonResponse
    {
        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string',
            'email' => 'nullable|email',
            'ville' => 'nullable|string',
            'active' => 'sometimes|boolean',
            'ai_notes_enabled' => 'sometimes|boolean',
        ]);

        $school->update($request->only(['nom', 'adresse', 'telephone', 'email', 'ville', 'active', 'ai_notes_enabled']));
        return response()->json($school);
    }

    public function toggleAiNotes(School $school): JsonResponse
    {
        $school->update(['ai_notes_enabled' => !$school->ai_notes_enabled]);
        return response()->json($school);
    }

    public function resetAdminPin(User $user): JsonResponse
    {
        $tempPin = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $user->forceFill([
            'pin_hash' => \Hash::make($tempPin),
            'pin_must_change' => true,
        ])->save();

        return response()->json([
            'message' => 'PIN réinitialisé.',
            'temporary_pin' => $tempPin,
        ]);
    }

    public function deleteSchool(School $school): JsonResponse
    {
        $school->delete();
        return response()->json(['message' => 'École supprimée']);
    }

    public function resetAdminPassword(User $user): JsonResponse
    {
        $newPassword = \Illuminate\Support\Str::random(16);
        $user->password = Hash::make($newPassword);
        $user->forceFill(['force_password_reset' => true])->save();

        return response()->json([
            'message' => 'Mot de passe réinitialisé.',
            'temporary_password' => $newPassword,
        ]);
    }

    public function forcePasswordReset(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->forceFill(['force_password_reset' => false])->save();

        return response()->json(['message' => 'Mot de passe mis à jour']);
    }

    public function aiProviders(): JsonResponse
    {
        $providers = AiProvider::all()->map(function ($provider) {
            $provider->api_keys = array_map(fn($key) => substr($key, 0, 4) . '****' . substr($key, -2), $provider->api_keys ?? []);
            return $provider;
        });

        return response()->json($providers);
    }

    public function toggleAiProvider(AiProvider $provider): JsonResponse
    {
        $provider->update(['actif' => !$provider->actif]);
        return response()->json($provider);
    }

    public function updateAiProviderKeys(Request $request, AiProvider $provider): JsonResponse
    {
        $request->validate([
            'keys' => 'required|array',
        ]);

        $existingKeys = $provider->api_keys ?? [];
        $mergedKeys = array_merge($existingKeys, $request->keys);
        $provider->forceFill(['api_keys' => array_unique($mergedKeys)])->save();

        return response()->json([
            'message' => 'Clés mises à jour.',
        ]);
    }

    public function deleteAiProviderKey(AiProvider $provider, string $key): JsonResponse
    {
        $keys = $provider->api_keys ?? [];
        $keys = array_filter($keys, fn($k) => $k !== $key);
        $provider->forceFill(['api_keys' => array_values($keys)])->save();

        return response()->json([
            'message' => 'Clé supprimée.',
        ]);
    }

    public function generateAdminLink(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'pin' => 'required|digits:6',
        ]);

        $superadmin = $request->user();

        if (!$superadmin->hasPin() || !$superadmin->verifyPin($request->pin)) {
            return response()->json(['message' => 'PIN incorrect'], 422);
        }

        $admin = User::find($userId);

        if (!$admin) {
            return response()->json(['message' => 'Admin introuvable'], 404);
        }

        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Utilisateur non admin'], 403);
        }

        $token = \Illuminate\Support\Str::random(64);

        \Illuminate\Support\Facades\Cache::put(
            "admin_magic_link:{$token}",
            ['admin_id' => $admin->id, 'superadmin_id' => $superadmin->id],
            now()->addMinutes(10)
        );

        \App\Models\ActivityLog::log([
            'school_id' => $admin->schools()->first()?->id,
            'user_type' => get_class($superadmin),
            'user_id' => $superadmin->id,
            'user_name' => $superadmin->name ?? $superadmin->email,
            'user_role' => $superadmin->role ?? 'unknown',
            'action' => 'generate_admin_link',
            'subject_type' => get_class($admin),
            'subject_id' => $admin->id,
            'description' => "Superadmin {$superadmin->email} a généré un magic link pour l'admin {$admin->email}",
        ]);

        $url = url("/app/admin/?magic_token={$token}");

        return response()->json([
            'success' => true,
            'url' => $url,
            'expires_in' => 10,
        ]);
    }
}
