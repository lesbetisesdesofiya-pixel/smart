import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { Activity, BookOpen, CreditCard, MessageSquareText, MessageCircle, Calendar, AlertTriangle, Filter } from 'lucide-react'

type FeedFilter = 'all' | 'notes' | 'examens' | 'absences' | 'remarques' | 'paiements' | 'conversations'

const typeConfig: Record<string, { icon: React.ReactNode; label: string; variant: string; color: string }> = {
  note: { icon: <BookOpen className="w-4 h-4" />, label: 'Note', variant: 'primary', color: 'bg-blue-100 text-blue-600' },
  examen: { icon: <Calendar className="w-4 h-4" />, label: 'Examen', variant: 'warning', color: 'bg-amber-100 text-amber-600' },
  absence: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Absence', variant: 'danger', color: 'bg-red-100 text-red-600' },
  remarque: { icon: <MessageSquareText className="w-4 h-4" />, label: 'Observation', variant: 'warning', color: 'bg-orange-100 text-orange-600' },
  paiement: { icon: <CreditCard className="w-4 h-4" />, label: 'Paiement', variant: 'success', color: 'bg-green-100 text-green-600' },
  conversation: { icon: <MessageCircle className="w-4 h-4" />, label: 'Message', variant: 'primary', color: 'bg-purple-100 text-purple-600' },
}

export const FeedPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [filter, setFilter] = useState<FeedFilter>('all')

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger le fil d'actualité" />

  const feedItems: any[] = []

  if (data?.notes) data.notes.forEach((n: any) => feedItems.push({ ...n, _type: 'note', _date: n.date || n.created_at }))
  if (data?.examens) data.examens.forEach((e: any) => feedItems.push({ ...e, _type: 'examen', _date: e.date }))
  if (data?.absences) data.absences.forEach((a: any) => feedItems.push({ ...a, _type: 'absence', _date: a.date }))
  if (data?.remarques) data.remarques.forEach((r: any) => feedItems.push({ ...r, _type: 'remarque', _date: r.date }))
  if (data?.paiements) data.paiements.forEach((p: any) => feedItems.push({ ...p, _type: 'paiement', _date: p.date }))
  if (data?.conversations) data.conversations.forEach((c: any) => feedItems.push({ ...c, _type: 'conversation', _date: c.lastDate || c.date }))

  feedItems.sort((a, b) => new Date(b._date || 0).getTime() - new Date(a._date || 0).getTime())

  const filters: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'notes', label: 'Notes' },
    { key: 'examens', label: 'Examens' },
    { key: 'absences', label: 'Absences' },
    { key: 'remarques', label: 'Obs.' },
    { key: 'paiements', label: 'Paiements' },
    { key: 'conversations', label: 'Messages' },
  ]

  const filterMap: Record<string, string> = {
    notes: 'note', examens: 'examen', absences: 'absence', remarques: 'remarque', paiements: 'paiement', conversations: 'conversation',
  }

  const filtered = filter === 'all' ? feedItems : feedItems.filter(item => item._type === filterMap[filter])

  const getDescription = (item: any): string => {
    switch (item._type) {
      case 'note': return `${item.matiere || 'Matière'} — ${item.valeur ?? item.note ?? '—'}/20`
      case 'examen': return `${item.matiere || ''} — ${item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}`
      case 'absence': return `${item.matiere || 'Cours'} — ${item.justifiee !== undefined ? (item.justifiee ? 'Justifiée' : 'Non justifiée') : ''}`
      case 'remarque': return item.contenu || item.message || item.texte || 'Observation'
      case 'paiement': return `${item.libelle || 'Paiement'} — ${item.montant ? `${item.montant} DH` : ''}`
      case 'conversation': return item.lastMessage || item.dernierMessage || 'Nouveau message'
      default: return ''
    }
  }

  if (!feedItems.length) return <EmptyState icon={<Activity className="w-12 h-12" />} title="Aucune activité" description="Aucune activité récente" />

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Fil d'actualité</h1>
        <p className="text-gray-500 text-sm">{feedItems.length} activité{feedItems.length > 1 ? 's' : ''} récente{feedItems.length > 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === f.key ? 'bg-navy-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter className="w-10 h-10" />} title="Aucun résultat" description="Aucune activité pour ce filtre" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any, i: number) => {
            const config = typeConfig[item._type] || typeConfig.note
            return (
              <Card key={i} className="p-5 rounded-3xl shadow-card">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={config.variant as any}>{config.label}</Badge>
                      <span className="text-xs text-gray-400">
                        {item._date ? new Date(item._date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-navy-800 font-medium truncate">
                      {item.matiere || item.prof || item.libelle || item.nom || ''}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{getDescription(item)}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
