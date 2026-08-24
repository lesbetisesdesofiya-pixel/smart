import React from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  paid: { label: 'Payé', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  pending: { label: 'En attente', variant: 'warning', icon: <Clock className="w-4 h-4" /> },
  overdue: { label: 'En retard', variant: 'danger', icon: <AlertCircle className="w-4 h-4" /> },
}

const ProgressRing: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? (paid / total) * 100 : 0
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="white" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        <span className="text-xs opacity-80">payé</span>
      </div>
    </div>
  )
}

export const PaymentsPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger les paiements" />

  const paiements = data?.paiements ?? []
  const total = paiements.reduce((sum: number, p: any) => sum + (p.montant || 0), 0)
  const paid = paiements.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + (p.montant || 0), 0)

  if (!paiements.length) return <EmptyState icon={<CreditCard className="w-12 h-12" />} title="Aucun paiement" description="Aucun paiement enregistré" />

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white font-inter">Paiements</h1>
        <p className="text-white/70 text-sm">Suivi de vos paiements scolaires</p>
      </div>

      <Card className="p-6 rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 shadow-card text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-white/70 text-sm">Progression</p>
            <p className="text-3xl font-bold">{paid.toLocaleString('fr-FR')} DH</p>
            <p className="text-white/60 text-sm">sur {total.toLocaleString('fr-FR')} DH</p>
          </div>
          <ProgressRing paid={paid} total={total} />
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-800">Historique</h2>
        {paiements.map((paiement: any, i: number) => {
          const status = statusConfig[paiement.status] || statusConfig.pending
          return (
            <Card key={i} className="p-5 rounded-3xl shadow-card">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-navy-800">{paiement.libelle || `Trimestre ${i + 1}`}</h3>
                  <p className="text-sm text-gray-500">
                    {paiement.date ? new Date(paiement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold text-navy-800">{(paiement.montant || 0).toLocaleString('fr-FR')} DH</p>
                  <Badge variant={status.variant as any} className="inline-flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
