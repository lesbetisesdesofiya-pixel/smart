import React from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'

const statusConfig: Record<string, { label: string; color: 'emerald' | 'amber' | 'rose' }> = {
  paid: { label: 'Paye', color: 'emerald' },
  pending: { label: 'En attente', color: 'amber' },
  overdue: { label: 'En retard', color: 'rose' },
}

const ProgressRing: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? (paid / total) * 100 : 0
  const offset = circumference - (progress / 100) * circumference

  return (
    <div style={{ position: 'relative', width: 128, height: 128 }}>
      <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="white" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'all 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>{Math.round(progress)}%</span>
        <span style={{ fontSize: 12, opacity: 0.8 }}>paye</span>
      </div>
    </div>
  )
}

export const PaymentsPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()

  if (isLoading)
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ height: 96, background: '#f3f4f6', borderRadius: 24 }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 14, color: '#ef4444' }}>Impossible de charger les paiements</p>
      </div>
    )

  const paiements = data?.paiements ?? []
  const total = paiements.reduce((sum: number, p: any) => sum + (p.montant || 0), 0)
  const paid = paiements.filter((p: any) => p.statut === 'paye' || p.status === 'paid').reduce((sum: number, p: any) => sum + (p.montant || 0), 0)

  if (!paiements.length)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <CreditCard size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucun paiement</p>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Aucun paiement enregistre</p>
      </div>
    )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Paiements</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Suivi de vos paiements scolaires</p>
      </div>

      <Card
        variant="hero"
        style={{
          padding: 24, borderRadius: 24,
          background: 'linear-gradient(135deg, #0a1642, #1a2a5e)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Progression</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>{paid.toLocaleString('fr-FR')} DH</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>sur {total.toLocaleString('fr-FR')} DH</p>
          </div>
          <ProgressRing paid={paid} total={total} />
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0a1642' }}>Historique</h2>
        {paiements.map((paiement: any, i: number) => {
          const status = statusConfig[paiement.statut || paiement.status] || statusConfig.pending
          return (
            <Card key={i} style={{ padding: 20, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3 style={{ fontWeight: 600, color: '#0a1642' }}>{paiement.libelle || `Trimestre ${i + 1}`}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280' }}>
                    {paiement.date ? new Date(paiement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#0a1642' }}>{(paiement.montant || 0).toLocaleString('fr-FR')} DH</p>
                  <Badge color={status.color} size="sm">{status.label}</Badge>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
