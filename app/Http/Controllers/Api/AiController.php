<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Eleve;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Presence;
use App\Models\Prof;
use App\Models\Remarque;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    private function callGemini(string $apiKey, array $payload): \Illuminate\Http\Client\Response
    {
        return Http::timeout(60)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $apiKey,
            ])
            ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', $payload);
    }

    private function parseGeminiResponse(\Illuminate\Http\Client\Response $response): ?array
    {
        if (!$response->successful()) {
            Log::error('Gemini API error', ['status' => $response->status()]);
            return null;
        }

        $data = $response->json();
        $text = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');

        if (str_starts_with($text, '```')) {
            $text = preg_replace('/^```json\s*/', '', $text);
            $text = preg_replace('/\s*```$/', '', $text);
        }

        $parsed = json_decode($text, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Gemini parse error', ['text' => substr($text, 0, 200)]);
            return null;
        }

        return $parsed;
    }

    public function extractGrades(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 401);
        }

        $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'column' => 'required|integer|min:1|max:8',
            'photos' => 'required|array|min:1|max:10',
            'photos.*' => 'file|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Clé API Gemini non configurée',
            ], 400);
        }

        $evaluation = Evaluation::with(['classe.eleves', 'matiere', 'periode'])->findOrFail($request->evaluation_id);

        // Verify school ownership
        if (method_exists($user, 'school_id')) {
            if ($evaluation->school_id !== $user->school_id) {
                return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
            }
        } elseif (method_exists($user, 'schools')) {
            $schoolIds = $user->schools()->pluck('schools.id')->toArray();
            if (!in_array($evaluation->school_id, $schoolIds)) {
                return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
            }
        }

        $school = School::find($evaluation->school_id);
        if ($school && !$school->ai_notes_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'La fonction Notes IA n\'est pas activée pour cette école',
            ], 403);
        }

        // For group parent evaluations, use the child evaluation's class
        if ($evaluation->is_group_parent) {
            $children = Evaluation::where('evaluation_group_id', $evaluation->id)->with('classe.eleves')->get();
            $students = $children->flatMap(fn($c) => $c->classe?->eleves ?? collect())->unique('id')->values();
            $classLibelle = $children->map(fn($c) => $c->classe?->libelle)->filter()->implode(', ');
        } else {
            $students = $evaluation->classe->eleves ?? collect();
            $classLibelle = $evaluation->classe?->libelle ?? '';
        }

        $studentNames = $students->map(fn($s) => trim($s->prenom . ' ' . $s->nom))->toArray();
        $column = (int) $request->column;
        $matiereLibelle = $evaluation->matiere->libelle ?? 'N/A';

        $parts = [];

        $parts[] = [
            'text' => "Tu es un assistant OCR spécialisé dans l'analyse de tableaux de notes scolaires.

CONTEXTE :
- Évaluation : {$evaluation->titre} ({$matiereLibelle})
- Classe : {$classLibelle}
- COLONNE À EXTRAIRE : colonne numéro {$column}

ÉLÈVES :
" . implode("\n", array_map(fn($name, $i) => ($i + 1) . ". {$name}", $studentNames, array_keys($studentNames))) . "

INSTRUCTIONS IMPORTANTES :
1. Analyse chaque image une par une, dans l'ordre envoyé
2. Pour chaque image, identifie le tableau de notes
3. Repère la colonne numéro {$column} en partant de la gauche
4. Ne compte PAS le numéro d'ordre de l'élève (première colonne à l'extrême gauche)
5. Commence à compter les colonnes de notes à partir de la première colonne de notes
6. Extrait la valeur de la colonne {$column} pour CHAQUE ligne (chaque élève)
7. Traite TOUTES les lignes de la première à la dernière
8. Si l'image contient le nom de l'élève, associe-le à la note

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT avec un JSON minifié sur une seule ligne, sans texte avant ni après.

Pour une seule image :
{\"eleves\":[{\"nom\":\"Nom Prénom\",\"note\":14.5}]}

Pour plusieurs images, combine les résultats de toutes les images :
{\"eleves\":[{\"nom\":\"Nom1 Prénom1\",\"note\":14.5},{\"nom\":\"Nom2 Prénom2\",\"note\":12.0}]}

RÈGLES :
- Les notes sont en décimal (ex: 14.5, 12, 17.25, 8)
- Si une note est vide ou illisible, mets null
- Si tu ne trouves pas de nom, mets le numéro d'ordre comme nom (\"Élève 1\", \"Élève 2\", etc.)
- NE RETOURNE QUE LE JSON, rien d'autre
- PAS de markdown, PAS de backticks, PAS de commentaire"
        ];

        foreach ($request->file('photos') as $photo) {
            $mimeType = $photo->getMimeType();
            $base64 = base64_encode(file_get_contents($photo->getRealPath()));
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => $base64,
                ],
            ];
        }

        $payload = [
            'contents' => [
                ['parts' => $parts],
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'maxOutputTokens' => 8192,
                'responseMimeType' => 'application/json',
            ],
        ];

        try {
            $response = $this->callGemini($apiKey, $payload);

            $parsed = $this->parseGeminiResponse($response);
            if ($parsed === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse IA non parsable. Veuillez réessayer.',
                ], 500);
            }

            $eleves = $parsed['eleves'] ?? $parsed['grades'] ?? [];

            $matchedGrades = [];
            foreach ($eleves as $e) {
                $note = $e['note'] ?? null;
                $foundName = $e['nom'] ?? $e['eleve_nom'] ?? '';
                $eleveId = $e['eleve_id'] ?? null;

                if ($note === null) continue;

                if ($eleveId === null && $foundName) {
                    $normalizedName = strtolower(trim($foundName));
                    $match = $students->first(function ($s) use ($normalizedName) {
                        $fullName = strtolower(trim($s->prenom . ' ' . $s->nom));
                        return str_contains($fullName, $normalizedName)
                            || str_contains($normalizedName, $fullName);
                    });
                    if ($match) $eleveId = $match->id;
                }

                if ($eleveId) {
                    $note = min(20, max(0, (float) $note));
                    $matchedGrades[] = [
                        'eleve_id' => (int) $eleveId,
                        'note' => $note,
                        'eleve_nom' => $foundName,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'grades' => $matchedGrades,
                'total' => count($matchedGrades),
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini extraction error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'analyse. Veuillez réessayer.',
            ], 500);
        }
    }

    public function studentSummary(Request $request): JsonResponse
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
        ]);

        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Clé API Gemini non configurée',
            ], 400);
        }

        $eleve = Eleve::with(['classe', 'notes.evaluation.matiere', 'notes.evaluation.periode', 'parents'])->findOrFail($request->eleve_id);

        // Verify school ownership
        $user = $request->user();
        if ($user) {
            if (method_exists($user, 'school_id')) {
                if ($eleve->school_id !== $user->school_id) {
                    return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
                }
            } elseif (method_exists($user, 'schools')) {
                $schoolIds = $user->schools()->pluck('schools.id')->toArray();
                if (!in_array($eleve->school_id, $schoolIds)) {
                    return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
                }
            } elseif ($user->role === 'parent') {
                $hasChild = $eleve->parents()->where('parent_id', $user->id)->exists();
                if (!$hasChild) {
                    return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
                }
            }
        }

        $notes = $eleve->notes()->with(['evaluation.matiere', 'evaluation.periode'])->get();

        $notesData = $notes->map(fn($n) => [
            'matiere' => $n->evaluation->matiere->libelle ?? 'N/A',
            'evaluation' => $n->evaluation->titre ?? 'N/A',
            'periode' => $n->evaluation->periode->libelle ?? 'N/A',
            'note' => $n->note,
            'note_sur' => $n->evaluation->note_sur ?? 20,
            'coefficient' => $n->evaluation->coefficient ?? 1,
            'appreciation' => $n->appreciation,
        ])->toArray();

        $presences = Presence::where('eleve_id', $eleve->id)
            ->selectRaw('COUNT(*) as total, SUM(est_present = 1) as presents, SUM(est_present = 0) as absents')
            ->first();

        $remarques = Remarque::where('eleve_id', $eleve->id)
            ->with('prof:id,nom,prenom')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'type' => $r->type,
                'contenu' => $r->contenu,
                'prof' => trim($r->prof->prenom . ' ' . $r->prof->nom),
                'date' => $r->created_at->format('d/m/Y'),
            ])->toArray();

        $notesJson = json_encode($notesData, JSON_UNESCAPED_UNICODE);
        $presencesJson = json_encode([
            'total' => $presences->total ?? 0,
            'presents' => $presences->presents ?? 0,
            'absents' => $presences->absents ?? 0,
        ]);
        $remarquesJson = json_encode($remarques, JSON_UNESCAPED_UNICODE);

        $classeLibelle = $eleve->classe->libelle ?? 'N/A';

        $prompt = "Tu es un assistant pédagogique spécialisé dans l'analyse de données scolaires.

DONNÉES DE L'ÉLÈVE :
- Nom : {$eleve->prenom} {$eleve->nom}
- Classe : {$classeLibelle}

NOTES :
{$notesJson}

PRÉSENCES :
{$presencesJson}

REMARQUES :
{$remarquesJson}

INSTRUCTIONS :
1. Analyse les notes de l'élève par matière et par période
2. Identifie les forces et les faiblesses
3. Calcule la moyenne générale
4. Analyse l'assiduité
5. Prend en compte les remarques des professeurs
6. Rédige un résumé clair et constructif en 3-5 paragraphes
7. Termine par des recommandations concrètes

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT avec un JSON minifié sur une seule ligne :
{\"resume\":\"Texte du résumé\",\"moyenne_generale\":14.5,\"forces\":[\"Matière1\",\"Matière2\"],\"faiblesses\":[\"Matière3\"],\"assiduité\":\"description\",\"recommandations\":\"texte des recommandations\"}

NE RETOURNE QUE LE JSON, rien d'autre.";

        $payload = [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 4096,
                'responseMimeType' => 'application/json',
            ],
        ];

        try {
            $response = $this->callGemini($apiKey, $payload);

            $parsed = $this->parseGeminiResponse($response);
            if ($parsed === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse IA non parsable. Veuillez réessayer.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'summary' => $parsed,
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini studentSummary error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération. Veuillez réessayer.',
            ], 500);
        }
    }

    public function teacherNotes(Request $request): JsonResponse
    {
        $request->validate([
            'sujet' => 'required|string',
            'eleve_id' => 'nullable|exists:eleves,id',
        ]);

        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Clé API Gemini non configurée',
            ], 400);
        }

        $context = "Sujet demandé : {$request->sujet}";

        if ($request->eleve_id) {
            $eleve = Eleve::with(['classe', 'notes.evaluation.matiere'])->findOrFail($request->eleve_id);

            // Verify school ownership
            $user = $request->user();
            if ($user) {
                if (method_exists($user, 'school_id')) {
                    if ($eleve->school_id !== $user->school_id) {
                        return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
                    }
                } elseif (method_exists($user, 'schools')) {
                    $schoolIds = $user->schools()->pluck('schools.id')->toArray();
                    if (!in_array($eleve->school_id, $schoolIds)) {
                        return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
                    }
                }
            }

            $notes = $eleve->notes()->with(['evaluation.matiere'])->get()->map(fn($n) => [
                'matiere' => $n->evaluation->matiere->libelle ?? 'N/A',
                'note' => $n->note,
                'note_sur' => $n->evaluation->note_sur ?? 20,
            ])->toArray();

            $classeLibelle2 = $eleve->classe->libelle ?? 'N/A';
            $context .= "\n\nÉlève : {$eleve->prenom} {$eleve->nom} (Classe : {$classeLibelle2})";
            $context .= "\nNotes : " . json_encode($notes, JSON_UNESCAPED_UNICODE);
        }

        $prompt = "Tu es un assistant pédagogique pour enseignants.

{$context}

INSTRUCTIONS :
1. Génère des notes pédagogiques détaillées sur le sujet demandé
2. Si un élève est spécifié, analyse ses performances
3. Propose des conseils et stratégies d'amélioration
4. Sois précis et actionnable

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT avec un JSON minifié :
{\"notes\":\"Texte détaillé des notes pédagogiques\",\"conseils\":[\"Conseil 1\",\"Conseil 2\"],\"strategie\":\"Stratégie d'amélioration recommandée\"}

NE RETOURNE QUE LE JSON.";

        $payload = [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 2048,
                'responseMimeType' => 'application/json',
            ],
        ];

        try {
            $response = $this->callGemini($apiKey, $payload);

            $parsed = $this->parseGeminiResponse($response);
            if ($parsed === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse IA non parsable. Veuillez réessayer.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'notes' => $parsed,
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini teacherNotes error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération. Veuillez réessayer.',
            ], 500);
        }
    }

    public function generateNotice(Request $request): JsonResponse
    {
        $request->validate([
            'sujet' => 'required|string',
            'public' => 'required|string',
            'ton' => 'nullable|string|in:formel,amical,urgent,informatif',
        ]);

        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Clé API Gemini non configurée',
            ], 400);
        }

        $ton = $request->ton ?? 'formel';

        $prompt = "Tu es un rédacteur de communications scolaires professionnel.

CONTEXTE :
- Sujet : {$request->sujet}
- Public cible : {$request->public}
- Ton : {$ton}

INSTRUCTIONS :
1. Rédige un avis/annonce scolaire clair et structuré
2. Adapte le ton au public cible
3. Utilise un format professionnel avec titre et paragraphs
4. Inclus les informations essentielles
5. Termine par une formule de politesse appropriée

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT avec un JSON minifié :
{\"titre\":\"Titre de l'annonce\",\"contenu\":\"Texte complet de l'annonce\",\"ton\":\"{$ton}\",\"public\":\"{$request->public}\"}

NE RETOURNE QUE LE JSON.";

        $payload = [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.5,
                'maxOutputTokens' => 2048,
                'responseMimeType' => 'application/json',
            ],
        ];

        try {
            $response = $this->callGemini($apiKey, $payload);

            $parsed = $this->parseGeminiResponse($response);
            if ($parsed === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse IA non parsable. Veuillez réessayer.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'notice' => $parsed,
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini generateNotice error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération. Veuillez réessayer.',
            ], 500);
        }
    }

    public function generateNoticeMistral(Request $request): JsonResponse
    {
        $request->validate([
            'sujet' => 'required|string|max:500',
            'public' => 'nullable|string|max:200',
            'ton' => 'nullable|string|in:formel,amical,urgent,informatif',
        ]);

        $apiKey = 'Mjjr5iecFaJry4tura725kletpY247Wq';
        $ton = $request->ton ?? 'formel';
        $public = $request->public ?? 'Toutes les classes';

        $prompt = "Tu es un directeur d'école qui rédige une communication aux parents d'élèves.

Sujet : {$request->sujet}
Public cible : {$public}
Ton : {$ton}

Règles :
- L'avis doit être professionnel, clair et bien structuré
- Pas trop long (5-8 lignes max), pas trop court (au moins 3 lignes)
- Inclure les informations essentielles
- Ne pas inventer de détails qui ne sont pas dans le sujet
- TOUJOURS terminer par : « Cordialement, l'Administration »

Réponds UNIQUEMENT avec ce format JSON (pas de texte avant ou après) :
{\"titre\":\"Titre court et clair\",\"contenu\":\"Texte complet de l'avis se terminant par Cordialement, l'Administration\"}";

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $apiKey,
                ])
                ->post('https://api.mistral.ai/v1/chat/completions', [
                    'model' => 'mistral-small-latest',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.6,
                    'max_tokens' => 500,
                ]);

            if (!$response->successful()) {
                Log::error('Mistral API error', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur API Mistral: ' . $response->status(),
                ], 500);
            }

            $content = $response->json('choices.0.message.content', '');

            // Extract JSON from response
            $jsonMatch = null;
            if (preg_match('/\{.*\}/s', $content, $jsonMatch)) {
                $parsed = json_decode($jsonMatch[0], true);
            } else {
                $parsed = json_decode($content, true);
            }

            if (!$parsed || !isset($parsed['titre']) || !isset($parsed['contenu'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse IA non parsable. Veuillez réessayer.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'notice' => [
                    'titre' => $parsed['titre'],
                    'contenu' => $parsed['contenu'],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Mistral generateNotice error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération. Veuillez réessayer.',
            ], 500);
        }
    }
}
