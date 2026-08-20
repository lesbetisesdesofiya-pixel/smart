<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Eleve;
use App\Models\Evaluation;
use App\Models\GradeSubmission;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeSubmissionController extends Controller
{
    public function index(): JsonResponse
    {
        $submissions = GradeSubmission::with(['prof', 'classe', 'matiere', 'school'])
            ->latest()
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'prof' => $s->prof ? "{$s->prof->prenom} {$s->prof->nom}" : '—',
                'school' => $s->school?->nom ?? '—',
                'classe' => $s->classe?->libelle ?? '—',
                'matiere' => $s->matiere?->libelle ?? '—',
                'image_url' => $s->image_url,
                'status' => $s->status,
                'json_data' => $s->json_data,
                'created_at' => $s->created_at->format('d/m/Y H:i'),
            ]);

        return response()->json($submissions);
    }

    public function process(Request $request, GradeSubmission $submission): JsonResponse
    {
        $request->validate([
            'notes' => 'required|array|min:1',
            'notes.*.eleve_id' => 'required|integer|exists:eleves,id',
            'notes.*.note' => 'required|numeric|min:0|max:20',
            'notes.*.appreciation' => 'nullable|string|max:255',
            'evaluation_id' => 'required|integer|exists:evaluations,id',
        ]);

        $evaluation = Evaluation::findOrFail($request->evaluation_id);
        $created = 0;

        foreach ($request->notes as $item) {
            Note::updateOrCreate(
                ['evaluation_id' => $evaluation->id, 'eleve_id' => $item['eleve_id']],
                ['note' => $item['note'], 'appreciation' => $item['appreciation'] ?? null]
            );
            $created++;
        }

        $submission->update([
            'status' => 'processed',
            'json_data' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$created} note(s) enregistrée(s).",
        ]);
    }
}
