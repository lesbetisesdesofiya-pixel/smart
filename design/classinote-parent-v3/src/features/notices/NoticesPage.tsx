import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { MessageSquare, Award, AlertTriangle, Info } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'

const typeConfig: Record<string, { icon: typeof Award; color: string; badge: 'emerald' | 'amber' | 'blue' }> = {
  Felicitations: { icon: Award, color: '#059669', badge: 'emerald' },
  Attention: { icon: AlertTriangle, color: '#d97706', badge: 'amber' },
  Information: { icon: Info, color: '#2563eb', badge: 'blue' },
}

export const NoticesPage: React.FC = () => {
  const { data, isLoading } = useDashboard()
  const [filter, setFilter] = useState<string | null>(null)

  if (isLoading || !data)
    return (
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 112, maxWidth: 512, margin: '0 auto', paddingTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-shimmer" style={{ background: '#fff', borderRadius: 24, padding: 20, height: 80 }} />
          ))}
        </div>
      </div>
    )

  const remarques = data.remarques || []
  const types = [...new Set(remarques.map((r: any) => r.type).filter(Boolean))]
  const filtered = filter ? remarques.filter((r: any) => r.type === filter) : remarques

  return (
    <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 112, maxWidth: 512, margin: '0 auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            flexShrink: 0, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6, borderRadius: 16,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            background: !filter ? '#0a1642' : '#fff', color: !filter ? '#fff' : '#6b7280',
            border: !filter ? '1px solid #0a1642' : '1px solid #f3f4f6',
          }}
        >
          Tous
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              flexShrink: 0, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6, borderRadius: 16,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: filter === t ? '#0a1642' : '#fff', color: filter === t ? '#fff' : '#6b7280',
              border: filter === t ? '1px solid #0a1642' : '1px solid #f3f4f6',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <MessageSquare size={32} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: 14, color: '#6b7280' }}>Aucun avis</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((remarque: any, i: number) => {
            const config = typeConfig[remarque.type] || typeConfig['Information']
            const Icon = config.icon
            const profNom = remarque.prof ? `${remarque.prof.prenom} ${remarque.prof.nom}` : 'Professeur'
            return (
              <Card key={remarque.id || i} style={{ padding: 16 }} delay={0.05 + i * 0.03}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{profNom}</p>
                      <Badge color={config.badge}>{remarque.type || 'Info'}</Badge>
                    </div>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{remarque.contenu}</p>
                    <p style={{ fontSize: 12, color: '#d1d5db', marginTop: 8 }}>{remarque.created_at || remarque.date || ''}</p>
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
