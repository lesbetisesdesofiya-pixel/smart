<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Eleve;
use App\Models\EleveBlockHistory;
use App\Models\School;
use App\Models\SchoolPayment;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class FinancialReportController extends Controller
{
    private const RATE_PER_MONTH = 1000;

    private const MONTHS_FR = [
        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
        5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
        9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
    ];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', Rule::exists('schools', 'id')],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'year' => ['nullable', 'integer', 'min:2020', 'max:2100'],
            'start_date' => ['nullable', 'date', 'required_with:end_date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date', 'required_with:start_date'],
        ]);

        $period = $this->resolvePeriod($validated);
        $start = $period['start'];
        $end = $period['end'];

        $schoolsQuery = School::query();
        if (!empty($validated['school_id'])) {
            $schoolsQuery->where('id', $validated['school_id']);
        }
        $schools = $schoolsQuery->orderBy('nom')->get();

        if ($schools->isEmpty()) {
            return response()->json([
                'period' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
                'summary' => $this->emptySummary(),
                'schools' => [],
                'payments' => [],
                'monthly_revenue' => [],
                'revenue_by_school' => [],
                'payments_by_month' => [],
                'evolution_eleves' => [],
            ]);
        }

        $schoolIds = $schools->pluck('id')->toArray();
        $eleves = Eleve::whereIn('school_id', $schoolIds)
            ->whereDate('created_at', '<=', $end)
            ->get();

        $blockHistories = EleveBlockHistory::whereIn('school_id', $schoolIds)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('blocked_at', [$start->startOfDay(), $end->endOfDay()])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->whereNotNull('unblocked_at')
                         ->whereBetween('unblocked_at', [$start->startOfDay(), $end->endOfDay()]);
                  })
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('blocked_at', '<=', $end->endOfDay())
                         ->whereNull('unblocked_at');
                  });
            })
            ->get();

        $payments = SchoolPayment::with(['school', 'creator'])
            ->whereIn('school_id', $schoolIds)
            ->where('annule', false)
            ->whereBetween('date_paiement', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('date_paiement')
            ->get();

        $schoolDetails = [];
        $summary = $this->emptySummary();

        $monthlyRevenue = [];
        $revenueBySchool = [];
        $paymentsByMonth = [];
        $evolutionEleves = [];

        foreach ($schools as $school) {
            $schoolEleves = $eleves->where('school_id', $school->id);
            $schoolBlocks = $blockHistories->where('school_id', $school->id);
            $schoolPayments = $payments->where('school_id', $school->id);

            $detail = $this->buildSchoolDetail($school, $schoolEleves, $schoolBlocks, $schoolPayments, $start, $end);
            $schoolDetails[] = $detail;

            $summary['total_eleves'] += $detail['total_eleves'];
            $summary['active_eleves'] += $detail['active_eleves'];
            $summary['blocked_eleves'] += $detail['blocked_eleves'];
            $summary['total_mois_dus'] += $detail['total_mois_dus'];
            $summary['total_mois_actifs'] += $detail['total_mois_actifs'];
            $summary['mois_neutralises'] += $detail['mois_neutralises'];
            $summary['revenu_theorique'] += $detail['revenu_theorique'];
            $summary['revenu_du_reel'] += $detail['revenu_du_reel'];
            $summary['montant_verse'] += $detail['montant_verse'];
            $summary['reste_a_percevoir'] += $detail['reste_a_payer'];

            $revenueBySchool[] = [
                'school_id' => $school->id,
                'nom' => $school->nom,
                'revenu_theorique' => $detail['revenu_theorique'],
                'revenu_du_reel' => $detail['revenu_du_reel'],
                'montant_verse' => $detail['montant_verse'],
                'reste_a_payer' => $detail['reste_a_payer'],
            ];
        }

        $monthlyRevenue = $this->buildMonthlyRevenue($schoolIds, $eleves, $blockHistories, $payments, $start, $end);
        $paymentsByMonth = $this->buildPaymentsByMonth($payments, $start, $end);
        $evolutionEleves = $this->buildEvolutionEleves($schoolIds, $eleves, $blockHistories, $start, $end);

        $summary['total_eleves'] = (int) $summary['total_eleves'];
        $summary['active_eleves'] = (int) $summary['active_eleves'];
        $summary['blocked_eleves'] = (int) $summary['blocked_eleves'];

        return response()->json([
            'rate_per_month' => self::RATE_PER_MONTH,
            'period' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'summary' => $summary,
            'schools' => $schoolDetails,
            'payments' => $payments->map(fn ($p) => $this->serializePayment($p)),
            'monthly_revenue' => $monthlyRevenue,
            'revenue_by_school' => $revenueBySchool,
            'payments_by_month' => $paymentsByMonth,
            'evolution_eleves' => $evolutionEleves,
        ]);
    }

    public function storePayment(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['required', 'integer', Rule::exists('schools', 'id')],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'date_paiement' => ['required', 'date'],
            'mois_couverts' => ['nullable', 'array'],
            'mois_couverts.*' => ['string', 'regex:/^\d{4}-\d{2}$/'],
            'methode_paiement' => ['required', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:255'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['created_by'] = Auth::id();
        $validated['montant'] = round($validated['montant'], 2);

        if (!empty($validated['mois_couverts'])) {
            sort($validated['mois_couverts']);
            $first = $validated['mois_couverts'][0];
            $last = $validated['mois_couverts'][count($validated['mois_couverts']) - 1];
            $validated['periode_debut'] = $first . '-01';
            $validated['periode_fin'] = Carbon::parse($last . '-01')->endOfMonth()->toDateString();
        }

        $payment = DB::transaction(function () use ($validated) {
            $payment = SchoolPayment::create($validated);

            ActivityLog::log([
                'school_id' => $payment->school_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name,
                'user_role' => Auth::user()?->role,
                'action' => 'paiement_superadmin_cree',
                'subject_type' => School::class,
                'subject_id' => $payment->school_id,
                'description' => "Paiement de {$payment->montant} FCFA enregistré pour l'école #{$payment->school_id}.",
                'new_values' => [
                    'payment_id' => $payment->id,
                    'montant' => $payment->montant,
                    'date_paiement' => $payment->date_paiement->toDateString(),
                    'methode_paiement' => $payment->methode_paiement,
                    'reference' => $payment->reference,
                    'mois_couverts' => $payment->mois_couverts,
                ],
            ]);

            return $payment;
        });

        return response()->json($this->serializePayment($payment->load(['school', 'creator'])), 201);
    }

    public function cancelPayment(Request $request, int $id)
    {
        $payment = SchoolPayment::findOrFail($id);

        if ($payment->annule) {
            return response()->json(['message' => 'Paiement déjà annulé.'], 422);
        }

        $oldAmount = $payment->montant;

        DB::transaction(function () use ($payment, $oldAmount) {
            $payment->update([
                'annule' => true,
                'annule_at' => now(),
                'annule_par' => Auth::id(),
            ]);

            ActivityLog::log([
                'school_id' => $payment->school_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name,
                'user_role' => Auth::user()?->role,
                'action' => 'paiement_superadmin_annule',
                'subject_type' => School::class,
                'subject_id' => $payment->school_id,
                'description' => "Paiement #{$payment->id} de {$oldAmount} FCFA annulé.",
                'old_values' => ['montant' => $oldAmount, 'annule' => false],
                'new_values' => ['montant' => 0, 'annule' => true],
            ]);
        });

        return response()->json($this->serializePayment($payment->load(['school', 'creator'])));
    }

    public function exportPdf(Request $request)
    {
        $data = $this->getExportData($request);

        $pdf = Pdf::loadView('financial-report-pdf', $data);
        $pdf->setPaper('a4', 'landscape');

        $filename = 'rapport-financier-' . now()->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        $data = $this->getExportData($request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headerFont = ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']];
        $headerFill = ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '1E293B']];
        $headerAlignment = ['horizontal' => Alignment::HORIZONTAL_CENTER];
        $borderStyle = ['borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]];

        // Title
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'Rapport Financier ClassiNote');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Period
        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Période : ' . $data['period']['start'] . ' au ' . $data['period']['end']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 11, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Summary
        $row = 4;
        $sheet->setCellValue('A' . $row, 'RÉCAPITULATIF');
        $sheet->getStyle('A' . $row)->applyFromArray(['font' => ['bold' => true, 'size' => 13]]);

        $row = 5;
        $summaryLabels = [
            'Total élèves' => $data['summary']['total_eleves'],
            'Élèves actifs' => $data['summary']['active_eleves'],
            'Élèves bloqués' => $data['summary']['blocked_eleves'],
            'Mois d\'abonnement dus' => $data['summary']['total_mois_dus'],
            'Mois d\'abonnement actifs' => $data['summary']['total_mois_actifs'],
            'Mois neutralisés' => $data['summary']['mois_neutralises'],
            'Revenu théorique (FCFA)' => number_format($data['summary']['revenu_theorique'], 0, ',', ' '),
            'Revenu dû réel (FCFA)' => number_format($data['summary']['revenu_du_reel'], 0, ',', ' '),
            'Montant versé (FCFA)' => number_format($data['summary']['montant_verse'], 0, ',', ' '),
            'Reste à percevoir (FCFA)' => number_format($data['summary']['reste_a_percevoir'], 0, ',', ' '),
        ];

        foreach ($summaryLabels as $label => $value) {
            $sheet->setCellValue('A' . $row, $label);
            $sheet->setCellValue('B' . $row, $value);
            $sheet->getStyle('A' . $row)->applyFromArray(['font' => ['bold' => true]]);
            $row++;
        }

        // Schools detail
        $row += 2;
        $sheet->setCellValue('A' . $row, 'DÉTAIL PAR ÉCOLE');
        $sheet->getStyle('A' . $row)->applyFromArray(['font' => ['bold' => true, 'size' => 13]]);
        $row++;

        $schoolHeaders = ['École', 'Élèves', 'Actifs', 'Bloqués', 'Mois facturables', 'Revenu théorique', 'Revenu dû', 'Versé', 'Reste à payer', 'Statut'];
        foreach ($schoolHeaders as $col => $header) {
            $sheet->setCellValueByColumnAndRow($col + 1, $row, $header);
        }
        $sheet->getStyle('A' . $row . ':J' . $row)->applyFromArray([
            'font' => $headerFont,
            'fill' => $headerFill,
            'alignment' => $headerAlignment,
            'borders' => $borderStyle['borders'],
        ]);

        $row++;
        foreach ($data['schools'] as $school) {
            $sheet->setCellValueByColumnAndRow(1, $row, $school['nom']);
            $sheet->setCellValueByColumnAndRow(2, $row, $school['total_eleves']);
            $sheet->setCellValueByColumnAndRow(3, $row, $school['active_eleves']);
            $sheet->setCellValueByColumnAndRow(4, $row, $school['blocked_eleves']);
            $sheet->setCellValueByColumnAndRow(5, $row, $school['total_mois_actifs']);
            $sheet->setCellValueByColumnAndRow(6, $row, $school['revenu_theorique']);
            $sheet->setCellValueByColumnAndRow(7, $row, $school['revenu_du_reel']);
            $sheet->setCellValueByColumnAndRow(8, $row, $school['montant_verse']);
            $sheet->setCellValueByColumnAndRow(9, $row, $school['reste_a_payer']);
            $sheet->setCellValueByColumnAndRow(10, $row, $school['statut']);
            $sheet->getStyle('A' . $row . ':J' . $row)->applyFromArray($borderStyle);
            $row++;
        }

        // Payments
        $row += 2;
        $sheet->setCellValue('A' . $row, 'HISTORIQUE DES PAIEMENTS');
        $sheet->getStyle('A' . $row)->applyFromArray(['font' => ['bold' => true, 'size' => 13]]);
        $row++;

        $paymentHeaders = ['École', 'Montant (FCFA)', 'Date', 'Mois couverts', 'Moyen', 'Référence', 'Enregistré par', 'Commentaire', 'Statut'];
        foreach ($paymentHeaders as $col => $header) {
            $sheet->setCellValueByColumnAndRow($col + 1, $row, $header);
        }
        $sheet->getStyle('A' . $row . ':I' . $row)->applyFromArray([
            'font' => $headerFont,
            'fill' => $headerFill,
            'alignment' => $headerAlignment,
            'borders' => $borderStyle['borders'],
        ]);

        $row++;
        foreach ($data['payments'] as $payment) {
            $sheet->setCellValueByColumnAndRow(1, $row, $payment['school_nom']);
            $sheet->setCellValueByColumnAndRow(2, $row, $payment['montant']);
            $sheet->setCellValueByColumnAndRow(3, $row, $payment['date_paiement']);
            $sheet->setCellValueByColumnAndRow(4, $row, $payment['mois_couverts_label'] ?? '—');
            $sheet->setCellValueByColumnAndRow(5, $row, $payment['methode_paiement']);
            $sheet->setCellValueByColumnAndRow(6, $row, $payment['reference'] ?? '—');
            $sheet->setCellValueByColumnAndRow(7, $row, $payment['created_by_name'] ?? '—');
            $sheet->setCellValueByColumnAndRow(8, $row, $payment['commentaire'] ?? '—');
            $sheet->setCellValueByColumnAndRow(9, $row, $payment['annule'] ? 'Annulé' : 'Actif');
            $sheet->getStyle('A' . $row . ':I' . $row)->applyFromArray($borderStyle);
            $row++;
        }

        // Auto-size columns
        for ($col = 1; $col <= 10; $col++) {
            $sheet->getColumnByColumn($col)->setAutoSize(true);
        }

        $filename = 'rapport-financier-' . now()->format('Y-m-d') . '.xlsx';

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────

    private function getExportData(Request $request): array
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', Rule::exists('schools', 'id')],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'year' => ['nullable', 'integer', 'min:2020', 'max:2100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $period = $this->resolvePeriod($validated);
        $start = $period['start'];
        $end = $period['end'];

        $schoolsQuery = School::query();
        if (!empty($validated['school_id'])) {
            $schoolsQuery->where('id', $validated['school_id']);
        }
        $schools = $schoolsQuery->orderBy('nom')->get();

        $schoolIds = $schools->pluck('id')->toArray();
        $eleves = Eleve::whereIn('school_id', $schoolIds)
            ->whereDate('created_at', '<=', $end)
            ->get();

        $blockHistories = EleveBlockHistory::whereIn('school_id', $schoolIds)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('blocked_at', [$start->startOfDay(), $end->endOfDay()])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->whereNotNull('unblocked_at')
                         ->whereBetween('unblocked_at', [$start->startOfDay(), $end->endOfDay()]);
                  })
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('blocked_at', '<=', $end->endOfDay())
                         ->whereNull('unblocked_at');
                  });
            })
            ->get();

        $payments = SchoolPayment::with(['school', 'creator'])
            ->whereIn('school_id', $schoolIds)
            ->where('annule', false)
            ->whereBetween('date_paiement', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('date_paiement')
            ->get();

        $schoolDetails = [];
        $summary = $this->emptySummary();

        foreach ($schools as $school) {
            $schoolEleves = $eleves->where('school_id', $school->id);
            $schoolBlocks = $blockHistories->where('school_id', $school->id);
            $schoolPayments = $payments->where('school_id', $school->id);

            $detail = $this->buildSchoolDetail($school, $schoolEleves, $schoolBlocks, $schoolPayments, $start, $end);
            $schoolDetails[] = $detail;

            $summary['total_eleves'] += $detail['total_eleves'];
            $summary['active_eleves'] += $detail['active_eleves'];
            $summary['blocked_eleves'] += $detail['blocked_eleves'];
            $summary['total_mois_dus'] += $detail['total_mois_dus'];
            $summary['total_mois_actifs'] += $detail['total_mois_actifs'];
            $summary['mois_neutralises'] += $detail['mois_neutralises'];
            $summary['revenu_theorique'] += $detail['revenu_theorique'];
            $summary['revenu_du_reel'] += $detail['revenu_du_reel'];
            $summary['montant_verse'] += $detail['montant_verse'];
            $summary['reste_a_percevoir'] += $detail['reste_a_payer'];
        }

        return [
            'period' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'summary' => $summary,
            'schools' => $schoolDetails,
            'payments' => $payments->map(fn ($p) => $this->serializePayment($p))->toArray(),
            'generated_at' => now()->format('d/m/Y H:i'),
        ];
    }

    private function resolvePeriod(array $filters): array
    {
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            return [
                'start' => Carbon::parse($filters['start_date'])->startOfDay(),
                'end' => Carbon::parse($filters['end_date'])->endOfDay(),
            ];
        }

        $year = $filters['year'] ?? now()->year;
        $month = $filters['month'] ?? now()->month;

        return [
            'start' => Carbon::create($year, $month, 1)->startOfDay(),
            'end' => Carbon::create($year, $month, 1)->endOfMonth()->endOfDay(),
        ];
    }

    private function emptySummary(): array
    {
        return [
            'total_eleves' => 0,
            'active_eleves' => 0,
            'blocked_eleves' => 0,
            'total_mois_dus' => 0,
            'total_mois_actifs' => 0,
            'mois_neutralises' => 0,
            'revenu_theorique' => 0,
            'revenu_du_reel' => 0,
            'montant_verse' => 0,
            'reste_a_percevoir' => 0,
        ];
    }

    private function buildSchoolDetail($school, $schoolEleves, $schoolBlocks, $schoolPayments, Carbon $start, Carbon $end): array
    {
        $totalEleves = $schoolEleves->count();
        $activeEleves = $schoolEleves->where('access_locked', false)->count();
        $blockedEleves = $schoolEleves->where('access_locked', true)->count();

        $theoreticalMonths = 0;
        $activeMonths = 0;

        $months = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->startOfMonth());

        foreach ($schoolEleves as $eleve) {
            $enrolledAt = $eleve->created_at;

            foreach ($months as $monthDate) {
                $monthStart = $monthDate->copy()->startOfDay()->max($start)->max($enrolledAt->startOfDay());
                $monthEnd = $monthDate->copy()->endOfMonth()->endOfDay()->min($end);

                if ($enrolledAt->startOfDay()->greaterThan($monthEnd)) {
                    continue;
                }

                $daysInSegment = $monthStart->copy()->startOfDay()->diffInDays($monthEnd->copy()->startOfDay()) + 1;
                $theoreticalMonths += $daysInSegment / $monthDate->daysInMonth;

                $blockedDays = $this->calculateBlockedDaysInRange(
                    $eleve->id,
                    $schoolBlocks,
                    $monthStart,
                    $monthEnd
                );

                $activeDays = max(0, $daysInSegment - $blockedDays);
                $activeMonths += ($activeDays / $monthDate->daysInMonth);
            }
        }

        $theoreticalMonths = round($theoreticalMonths, 2);
        $activeMonths = round($activeMonths, 2);
        $neutralizedMonths = round($theoreticalMonths - $activeMonths, 2);

        $montantVerse = $schoolPayments->sum('montant');
        $revenuTheorique = round($theoreticalMonths * self::RATE_PER_MONTH, 2);
        $revenuDuReel = round($activeMonths * self::RATE_PER_MONTH, 2);
        $reste = round($revenuDuReel - $montantVerse, 2);

        return [
            'school_id' => $school->id,
            'nom' => $school->nom,
            'statut' => $school->active ? 'Actif' : 'Inactif',
            'total_eleves' => $totalEleves,
            'active_eleves' => $activeEleves,
            'blocked_eleves' => $blockedEleves,
            'total_mois_dus' => $theoreticalMonths,
            'total_mois_actifs' => $activeMonths,
            'mois_neutralises' => $neutralizedMonths,
            'revenu_theorique' => $revenuTheorique,
            'revenu_du_reel' => $revenuDuReel,
            'montant_verse' => round($montantVerse, 2),
            'reste_a_payer' => $reste,
        ];
    }

    private function calculateBlockedDaysInRange(int $eleveId, $blockHistories, Carbon $rangeStart, Carbon $rangeEnd): int
    {
        $relevantBlocks = $blockHistories->where('eleve_id', $eleveId);
        $totalBlockedDays = 0;

        foreach ($relevantBlocks as $block) {
            $blockStart = $block->blocked_at->copy()->startOfDay()->max($rangeStart->copy()->startOfDay());
            $blockEnd = ($block->unblocked_at ? $block->unblocked_at->copy()->startOfDay() : now()->copy()->startOfDay())->min($rangeEnd->copy()->startOfDay());

            if ($blockStart->lessThanOrEqualTo($blockEnd)) {
                $totalBlockedDays += $blockStart->diffInDays($blockEnd) + 1;
            }
        }

        return $totalBlockedDays;
    }

    private function buildMonthlyRevenue(array $schoolIds, $eleves, $blockHistories, $payments, Carbon $start, Carbon $end): array
    {
        $result = [];
        $months = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->startOfMonth());

        foreach ($months as $monthDate) {
            $monthKey = $monthDate->format('Y-m');
            $monthLabel = self::MONTHS_FR[(int) $monthDate->format('m')] . ' ' . $monthDate->format('Y');

            $theoreticalMonths = 0;
            $activeMonths = 0;

            foreach ($eleves as $eleve) {
                $enrolledAt = $eleve->created_at;
                $monthStart = $monthDate->copy()->startOfDay()->max($start)->max($enrolledAt->startOfDay());
                $monthEnd = $monthDate->copy()->endOfMonth()->endOfDay()->min($end);

                if ($enrolledAt->startOfDay()->greaterThan($monthEnd)) {
                    continue;
                }

                $daysInSegment = $monthStart->copy()->startOfDay()->diffInDays($monthEnd->copy()->startOfDay()) + 1;
                $theoreticalMonths += $daysInSegment / $monthDate->daysInMonth;

                $blockedDays = $this->calculateBlockedDaysInRange($eleve->id, $blockHistories, $monthStart, $monthEnd);
                $activeDays = max(0, $daysInSegment - $blockedDays);
                $activeMonths += ($activeDays / $monthDate->daysInMonth);
            }

            $monthPaymentsTotal = $payments->filter(function ($p) use ($monthDate) {
                return $p->date_paiement && $p->date_paiement->format('Y-m') === $monthDate->format('Y-m');
            })->sum('montant');

            $theoreticalMonths = round($theoreticalMonths, 2);
            $activeMonths = round($activeMonths, 2);

            $result[] = [
                'mois' => $monthKey,
                'label' => $monthLabel,
                'revenu_theorique' => round($theoreticalMonths * self::RATE_PER_MONTH, 2),
                'revenu_du_reel' => round($activeMonths * self::RATE_PER_MONTH, 2),
                'montant_verse' => round($monthPaymentsTotal, 2),
            ];
        }

        return $result;
    }

    private function buildPaymentsByMonth($payments, Carbon $start, Carbon $end): array
    {
        $result = [];
        $months = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->startOfMonth());

        foreach ($months as $monthDate) {
            $monthKey = $monthDate->format('Y-m');
            $monthLabel = self::MONTHS_FR[(int) $monthDate->format('m')] . ' ' . $monthDate->format('Y');

            $total = $payments->filter(function ($p) use ($monthDate) {
                return $p->date_paiement && $p->date_paiement->format('Y-m') === $monthDate->format('Y-m');
            })->sum('montant');

            $result[] = [
                'mois' => $monthKey,
                'label' => $monthLabel,
                'total' => round($total, 2),
            ];
        }

        return $result;
    }

    private function buildEvolutionEleves(array $schoolIds, $eleves, $blockHistories, Carbon $start, Carbon $end): array
    {
        $result = [];
        $months = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->startOfMonth());

        foreach ($months as $monthDate) {
            $monthKey = $monthDate->format('Y-m');
            $monthLabel = self::MONTHS_FR[(int) $monthDate->format('m')] . ' ' . $monthDate->format('Y');
            $monthEnd = $monthDate->copy()->endOfMonth()->endOfDay()->min($end);

            $active = 0;
            $blocked = 0;

            foreach ($eleves as $eleve) {
                if ($eleve->created_at->startOfDay()->greaterThan($monthEnd)) {
                    continue;
                }

                $isBlockedOnMonth = false;
                $eleveBlocks = $blockHistories->where('eleve_id', $eleve->id);

                foreach ($eleveBlocks as $block) {
                    $blockStart = $block->blocked_at->copy()->startOfDay();
                    $blockEnd = $block->unblocked_at ? $block->unblocked_at->copy()->endOfDay() : now()->copy()->endOfDay();

                    if ($blockStart->lessThanOrEqualTo($monthEnd) && $blockEnd->greaterThanOrEqualTo($monthDate->copy()->startOfDay())) {
                        $isBlockedOnMonth = true;
                        break;
                    }
                }

                if ($isBlockedOnMonth) {
                    $blocked++;
                } else {
                    $active++;
                }
            }

            $result[] = [
                'mois' => $monthKey,
                'label' => $monthLabel,
                'actifs' => $active,
                'bloques' => $blocked,
            ];
        }

        return $result;
    }

    private function serializePayment(SchoolPayment $payment): array
    {
        $moisCouvertsLabel = '—';
        if (!empty($payment->mois_couverts)) {
            $labels = [];
            foreach ($payment->mois_couverts as $mk) {
                $parts = explode('-', $mk);
                if (count($parts) === 2) {
                    $monthNum = (int) $parts[1];
                    $labels[] = (self::MONTHS_FR[$monthNum] ?? $mk) . ' ' . $parts[0];
                }
            }
            $moisCouvertsLabel = implode(', ', $labels);
        }

        return [
            'id' => $payment->id,
            'school_id' => $payment->school_id,
            'school_nom' => $payment->school?->nom,
            'montant' => $payment->montant,
            'date_paiement' => $payment->date_paiement?->toDateString(),
            'periode_debut' => $payment->periode_debut?->toDateString(),
            'periode_fin' => $payment->periode_fin?->toDateString(),
            'mois_couverts' => $payment->mois_couverts ?? [],
            'mois_couverts_label' => $moisCouvertsLabel,
            'methode_paiement' => $payment->methode_paiement,
            'reference' => $payment->reference,
            'commentaire' => $payment->commentaire,
            'annule' => $payment->annule,
            'created_by_name' => $payment->creator?->name,
            'created_at' => $payment->created_at?->toDateTimeString(),
        ];
    }
}
