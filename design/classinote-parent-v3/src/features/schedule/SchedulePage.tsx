import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { Clock, MapPin, User, CalendarDays } from 'lucide-react'

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

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger l'emploi du temps" />

  const emploi = data?.emploi ?? []
  const daySchedule = emploi.filter((c: any) => c.jour === selectedDay || c.day === selectedDay)

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Emploi du temps</h1>
        <p className="text-gray-500 text-sm">Planning de la semaine</p>
      </div>

      <div className="flex gap-2">
        {days.map(d => (
          <button
            key={d.key}
            onClick={() => setSelectedDay(d.key)}
            className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all text-center ${selectedDay === d.key ? 'bg-navy-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {emploi.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-12 h-12" />} title="Aucun cours" description="Pas d'emploi du temps disponible" />
      ) : daySchedule.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-10 h-10" />} title="Journée libre" description="Aucun cours prévu ce jour" />
      ) : (
        <div className="space-y-3">
          {daySchedule.map((cours: any, i: number) => (
            <Card key={i} className="p-5 rounded-3xl shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-lg font-bold text-navy-800">{cours.heure || cours.debut || '—'}</span>
                  {cours.fin && <span className="text-xs text-gray-400">à {cours.fin}</span>}
                </div>
                <div className="w-px h-12 bg-gray-200 self-center" />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-navy-800 text-lg">{cours.matiere}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    {cours.prof && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {cours.prof}
                      </span>
                    )}
                    {cours.salle && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
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
