import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Activity, BookOpen, CreditCard, MessageSquareText, MessageCircle, Calendar, AlertTriangle, Filter } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'

type FeedFilter = 'all' | 'notes' | 'examens' | 'absences' | 'remarques' | 'paiements' | 'conversations'

const typeConfig: Record<string, { Icon: typeof BookOpen; label: string; color: string; badgeColor: 'blue' | 'amber' | 'rose' | 'emerald' | 'violet' }> = {
  note: { Icon: BookOpen, label: 'Note', color: '#dbeafe', badgeColor: 'blue' },
  examen: { Icon: Calendar, label: 'Examen', color: '#fef3c7', badgeColor: 'amber' },
  absence: { Icon: AlertTriangle, label: 'Absence', color: '#ffe4e6', badgeColor: 'rose' },
  remarque: { Icon: MessageSquareText, label: 'Observation', color: '#ffedd5', badgeColor: 'amber' },
  paiement: { Icon: CreditCard, label: 'Paiement', color: '#d1fae5', badgeColor: 'emerald' },
  conversation: { Icon: MessageCircle, label: 'Message', color: '#ede9fe', badgeColor: 'violet' },
}

export const FeedPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [filter, setFilter] = useState<FeedFilter>('all')

  if (isLoading)
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 24 }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 14, color: '#ef4444' }}>Impossible de charger le fil d'actualite</p>
      </div>
    )

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
      case 'note': return `${item.matiere || 'Matiere'} — ${item.valeur ?? item.note ?? '---'}/20`
      case 'examen': return `${item.matiere || ''} — ${item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}`
      case 'absence': return `${item.matiere || 'Cours'} — ${item.justifiee !== undefined ? (item.justifiee ? 'Justifiee' : 'Non justifiee') : ''}`
      case 'remarque': return item.contenu || item.message || item.texte || 'Observation'
      case 'paiement': return `${item.libelle || 'Paiement'} — ${item.montant ? `${item.montant} DH` : ''}`
      case 'conversation': return item.lastMessage || item.dernierMessage || 'Nouveau message'
      default: return ''
    }
  }

  if (!feedItems.length)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Activity size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucune activite</p>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Aucune activite recente</p>
      </div>
    )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1642' }}>Fil d'actualite</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>{feedItems.length} activite{feedItems.length > 1 ? 's' : ''} recente{feedItems.length > 1 ? 's' : ''}</p>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 9999,
              fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              background: filter === f.key ? '#0a1642' : '#f3f4f6',
              color: filter === f.key ? '#fff' : '#4b5563',
              boxShadow: filter === f.key ? '0 4px 12px rgba(10,22,66,0.3)' : 'none',
              border: 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Filter size={40} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucun resultat</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Aucune activite pour ce filtre</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((item: any, i: number) => {
            const config = typeConfig[item._type] || typeConfig.note
            return (
              <Card key={i} style={{ padding: 20, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, background: config.color,
                  }}>
                    <config.Icon size={16} style={{ color: '#374151' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge color={config.badgeColor}>{config.label}</Badge>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {item._date ? new Date(item._date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#0a1642', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.matiere || item.prof || item.libelle || item.nom || ''}
                    </p>
                    <p style={{ fontSize: 14, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDescription(item)}</p>
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
