import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { MessageSquareText, Filter } from 'lucide-react'

type TypeFilter = 'all' | 'comportement' | 'academique' | 'absence' | 'autre'

const typeLabels: Record<string, { label: string; variant: string }> = {
  comportement: { label: 'Comportement', variant: 'warning' },
  academique: { label: 'Académique', variant: 'primary' },
  absence: { label: 'Absence', variant: 'danger' },
  autre: { label: 'Autre', variant: 'default' },
}

export const NoticesPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [filter, setFilter] = useState<TypeFilter>('all')

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger les observations" />
  if (!data?.remarques?.length) return <EmptyState icon={<MessageSquareText className="w-12 h-12" />} title="Aucune observation" description="Aucune observation pour le moment" />

  const remarques = data.remarques
  const types: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'comportement', label: 'Comportement' },
    { key: 'academique', label: 'Académique' },
    { key: 'absence', label: 'Absence' },
    { key: 'autre', label: 'Autre' },
  ]

  const filtered = filter === 'all' ? remarques : remarques.filter((r: any) => r.type === filter)

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Observations</h1>
        <p className="text-gray-500 text-sm">{remarques.length} observation{remarques.length > 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {types.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === t.key ? 'bg-navy-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter className="w-10 h-10" />} title="Aucun résultat" description="Aucune observation pour ce filtre" />
      ) : (
        <div className="space-y-3">
          {filtered.map((remarque: any, i: number) => {
            const typeInfo = typeLabels[remarque.type] || typeLabels.autre
            return (
              <Card key={i} className="p-5 rounded-3xl shadow-card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-800/10 flex items-center justify-center text-navy-800 font-bold text-sm">
                      {(remarque.prof || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800">{remarque.prof || 'Professeur'}</h3>
                      {remarque.matiere && <p className="text-xs text-gray-400">{remarque.matiere}</p>}
                    </div>
                  </div>
                  <Badge variant={typeInfo.variant as any}>{typeInfo.label}</Badge>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{remarque.contenu || remarque.message || remarque.texte}</p>
                <p className="text-xs text-gray-400">
                  {remarque.date ? new Date(remarque.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
