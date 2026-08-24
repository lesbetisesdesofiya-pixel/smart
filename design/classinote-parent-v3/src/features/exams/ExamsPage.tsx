import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { BookOpen, Calendar, Clock, X, Filter } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'

type FilterType = 'all' | 'upcoming' | 'past'

export const ExamsPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedExam, setSelectedExam] = useState<any>(null)

  if (isLoading)
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ height: 128, background: '#f3f4f6', borderRadius: 24 }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 14, color: '#ef4444' }}>Impossible de charger les examens</p>
      </div>
    )

  if (!data?.examens?.length)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <BookOpen size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucun examen</p>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Aucun examen prévu pour le moment</p>
      </div>
    )

  const now = new Date()
  const filtered = data.examens.filter((exam: any) => {
    const examDate = new Date(exam.date)
    if (filter === 'upcoming') return examDate >= now
    if (filter === 'past') return examDate < now
    return true
  })

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'past', label: 'Passés' },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1642' }}>Examens</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>{data.examens.length} examen{data.examens.length > 1 ? 's' : ''} au total</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 9999,
              fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
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
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucun résultat</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Aucun examen {filter === 'upcoming' ? 'à venir' : filter === 'past' ? 'passé' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((exam: any, i: number) => (
            <Card
              key={i}
              style={{ padding: 20, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)', cursor: 'pointer' }}
              onClick={() => setSelectedExam(exam)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontWeight: 600, color: '#0a1642', fontSize: 18 }}>{exam.matiere?.libelle || exam.titre}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={16} />
                      {new Date(exam.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {exam.heure && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={16} />
                        {exam.heure}
                      </span>
                    )}
                  </div>
                </div>
                {exam.coefficient && (
                  <Badge color="navy" size="md">Coeff. {exam.coefficient}</Badge>
                )}
              </div>
              {exam.salle && <p style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>Salle : {exam.salle}</p>}
            </Card>
          ))}
        </div>
      )}

      {selectedExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedExam(null)}>
          <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', maxWidth: 512, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0a1642' }}>{selectedExam.matiere?.libelle || selectedExam.titre}</h2>
              <button onClick={() => setSelectedExam(null)} style={{ padding: 8, borderRadius: 9999, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Date</span>
                <span style={{ fontWeight: 500, color: '#0a1642' }}>{new Date(selectedExam.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {selectedExam.heure && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Heure</span>
                  <span style={{ fontWeight: 500, color: '#0a1642' }}>{selectedExam.heure}</span>
                </div>
              )}
              {selectedExam.salle && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Salle</span>
                  <span style={{ fontWeight: 500, color: '#0a1642' }}>{selectedExam.salle}</span>
                </div>
              )}
              {selectedExam.coefficient && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Coefficient</span>
                  <span style={{ fontWeight: 500, color: '#0a1642' }}>{selectedExam.coefficient}</span>
                </div>
              )}
              {selectedExam.prof && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Professeur</span>
                  <span style={{ fontWeight: 500, color: '#0a1642' }}>{selectedExam.prof}</span>
                </div>
              )}
              {selectedExam.description && (
                <div style={{ paddingTop: 8 }}>
                  <span style={{ color: '#6b7280', display: 'block', marginBottom: 4 }}>Description</span>
                  <p style={{ color: '#0a1642' }}>{selectedExam.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
