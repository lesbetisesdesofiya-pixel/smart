<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Financier ClassiNote</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #f59e0b; }
        .header h1 { font-size: 22px; color: #1e293b; margin-bottom: 5px; }
        .header p { font-size: 11px; color: #64748b; }
        .section-title { font-size: 14px; font-weight: bold; color: #1e293b; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; }
        .summary-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
        .summary-card { flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
        .summary-card .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .summary-card .value { font-size: 16px; font-weight: bold; color: #1e293b; }
        .summary-card .value.green { color: #059669; }
        .summary-card .value.red { color: #dc2626; }
        .summary-card .value.amber { color: #d97706; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #1e293b; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 9px; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8px; font-weight: bold; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-gray { background: #f1f5f9; color: #475569; }
        .footer { margin-top: 30px; padding-top: 10px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport Financier ClassiNote</h1>
        <p>Période : {{ $period['start'] }} au {{ $period['end'] }} — Généré le {{ $generated_at }}</p>
    </div>

    <div class="section-title">Récapitulatif</div>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="label">Total élèves</div>
            <div class="value">{{ number_format($summary['total_eleves'], 0, ',', ' ') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Élèves actifs</div>
            <div class="value green">{{ number_format($summary['active_eleves'], 0, ',', ' ') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Élèves bloqués</div>
            <div class="value red">{{ number_format($summary['blocked_eleves'], 0, ',', ' ') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Mois dus</div>
            <div class="value">{{ number_format($summary['total_mois_dus'], 2, ',', ' ') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Mois actifs</div>
            <div class="value green">{{ number_format($summary['total_mois_actifs'], 2, ',', ' ') }}</div>
        </div>
        <div class="summary-card">
            <div class="label">Mois neutralisés</div>
            <div class="value amber">{{ number_format($summary['mois_neutralises'], 2, ',', ' ') }}</div>
        </div>
    </div>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="label">Revenu théorique</div>
            <div class="value">{{ number_format($summary['revenu_theorique'], 0, ',', ' ') }} FCFA</div>
        </div>
        <div class="summary-card">
            <div class="label">Revenu dû réel</div>
            <div class="value amber">{{ number_format($summary['revenu_du_reel'], 0, ',', ' ') }} FCFA</div>
        </div>
        <div class="summary-card">
            <div class="label">Montant versé</div>
            <div class="value green">{{ number_format($summary['montant_verse'], 0, ',', ' ') }} FCFA</div>
        </div>
        <div class="summary-card">
            <div class="label">Reste à percevoir</div>
            <div class="value red">{{ number_format($summary['reste_a_percevoir'], 0, ',', ' ') }} FCFA</div>
        </div>
    </div>

    <div class="section-title">Détail par école</div>
    <table>
        <thead>
            <tr>
                <th>École</th>
                <th class="text-center">Élèves</th>
                <th class="text-center">Actifs</th>
                <th class="text-center">Bloqués</th>
                <th class="text-center">Mois fact.</th>
                <th class="text-right">Revenu théorique</th>
                <th class="text-right">Revenu dû</th>
                <th class="text-right">Versé</th>
                <th class="text-right">Reste</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($schools as $school)
            <tr>
                <td><strong>{{ $school['nom'] }}</strong></td>
                <td class="text-center">{{ $school['total_eleves'] }}</td>
                <td class="text-center">{{ $school['active_eleves'] }}</td>
                <td class="text-center">{{ $school['blocked_eleves'] }}</td>
                <td class="text-center">{{ number_format($school['total_mois_actifs'], 2, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($school['revenu_theorique'], 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($school['revenu_du_reel'], 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($school['montant_verse'], 0, ',', ' ') }}</td>
                <td class="text-right"><strong>{{ number_format($school['reste_a_payer'], 0, ',', ' ') }}</strong></td>
                <td class="text-center">
                    <span class="badge {{ $school['statut'] === 'Actif' ? 'badge-green' : 'badge-red' }}">{{ $school['statut'] }}</span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="section-title">Historique des paiements</div>
    @if(count($payments) > 0)
    <table>
        <thead>
            <tr>
                <th>École</th>
                <th class="text-right">Montant</th>
                <th class="text-center">Date</th>
                <th>Mois couverts</th>
                <th>Moyen</th>
                <th>Référence</th>
                <th>Enregistré par</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $payment)
            <tr>
                <td>{{ $payment['school_nom'] }}</td>
                <td class="text-right">{{ number_format($payment['montant'], 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $payment['date_paiement'] }}</td>
                <td>{{ $payment['mois_couverts_label'] ?? '—' }}</td>
                <td>{{ $payment['methode_paiement'] }}</td>
                <td>{{ $payment['reference'] ?? '—' }}</td>
                <td>{{ $payment['created_by_name'] ?? '—' }}</td>
                <td class="text-center">
                    <span class="badge {{ $payment['annule'] ? 'badge-red' : 'badge-green' }}">{{ $payment['annule'] ? 'Annulé' : 'Actif' }}</span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p style="text-align: center; color: #94a3b8; padding: 20px;">Aucun paiement enregistré sur cette période.</p>
    @endif

    <div class="footer">
        <p>ClassiNote — Rapport généré automatiquement le {{ $generated_at }}</p>
    </div>
</body>
</html>
