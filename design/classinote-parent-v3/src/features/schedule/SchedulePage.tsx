import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Clock, MapPin, User, CalendarDays } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'

const days = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mer', label: 'Mer' },
  { key: 'jeu', label: 'Jeu' },
  { key: 'ven', label: 'Ven' },
  { key: 'sam', label: 'Sam' },
]

export const SchedulePage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()

  const today = new Date().getDay()
  const dayMap = [6, 0, 1, 2, 3, 4, 5]
  const [selectedDay, setSelectedDay] = useState(days[dayMap[today]]?.key || 'lun')

  if (isLoading)
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 96, background: '#f3f4f6', borderRadius: 24 }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 14, color: '#ef4444' }}>Impossible de charger l'emploi du temps</p>
      </div>
    )

  const emploi = data?.emploi ?? []
  const daySchedule = emploi.filter((c: any) => c.jour === selectedDay || c.day === selectedDay)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1642' }}>Emploi du temps</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Planning de la semaine</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {days.map(d => (
          <button
            key={d.key}
            onClick={() => setSelectedDay(d.key)}
            style={{
              flex: 1, paddingTop: 12, paddingBottom: 12, borderRadius: 16,
              fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              background: selectedDay === d.key ? '#0a1642' : '#f3f4f6',
              color: selectedDay === d.key ? '#fff' : '#4b5563',
              boxShadow: selectedDay === d.key ? '0 4px 12px rgba(10,22,66,0.3)' : 'none',
              border: 'none',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {emploi.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <CalendarDays size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucun cours</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Pas d'emploi du temps disponible</p>
        </div>
      ) : daySchedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Journee libre</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Aucun cours prevu ce jour</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {daySchedule.map((cours: any, i: number) => (
            <Card key={i} style={{ padding: 20, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0a1642' }}>{cours.heure || cours.debut || '---'}</span>
                  {cours.fin && <span style={{ fontSize: 12, color: '#9ca3af' }}>a {cours.fin}</span>}
                </div>
                <div style={{ width: 1, height: 48, background: '#e5e7eb', alignSelf: 'center' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontWeight: 600, color: '#0a1642', fontSize: 18 }}>{cours.matiere}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14, color: '#6b7280' }}>
                    {cours.prof && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={16} />
                        {cours.prof}
                      </span>
                    )}
                    {cours.salle && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={16} />
                        {cours.salle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
