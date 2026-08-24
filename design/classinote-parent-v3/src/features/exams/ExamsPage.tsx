import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { BookOpen, Calendar, Clock, X, Filter } from 'lucide-react'

type FilterType = 'all' | 'upcoming' | 'past'

export const ExamsPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedExam, setSelectedExam] = useState<any>(null)

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger les examens" />
  if (!data?.examens?.length) return <EmptyState icon={<BookOpen className="w-12 h-12" />} title="Aucun examen" description="Aucun examen prévu pour le moment" />

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
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Examens</h1>
        <p className="text-gray-500 text-sm">{data.examens.length} examen{data.examens.length > 1 ? 's' : ''} au total</p>
      </div>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.key ? 'bg-navy-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter className="w-10 h-10" />} title="Aucun résultat" description={`Aucun examen ${filter === 'upcoming' ? 'à venir' : filter === 'past' ? 'passé' : ''}`} />
      ) : (
        <div className="space-y-3">
          {filtered.map((exam: any, i: number) => (
            <Card
              key={i}
              className="p-5 rounded-3xl shadow-card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedExam(exam)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-navy-800 text-lg">{exam.matiere?.libelle || exam.titre}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(exam.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {exam.heure && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.heure}
                      </span>
                    )}
                  </div>
                </div>
                {exam.coefficient && (
                  <Badge color="navy" size="md" className="ml-3">
                    Coeff. {exam.coefficient}
                  </Badge>
                )}
              </div>
              {exam.salle && <p className="mt-2 text-sm text-gray-400">Salle : {exam.salle}</p>}
            </Card>
          ))}
        </div>
      )}

      {selectedExam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setSelectedExam(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-800">{selectedExam.matiere?.libelle || selectedExam.titre}</h2>
              <button onClick={() => setSelectedExam(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-navy-800">{new Date(selectedExam.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {selectedExam.heure && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Heure</span>
                  <span className="font-medium text-navy-800">{selectedExam.heure}</span>
                </div>
              )}
              {selectedExam.salle && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Salle</span>
                  <span className="font-medium text-navy-800">{selectedExam.salle}</span>
                </div>
              )}
              {selectedExam.coefficient && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Coefficient</span>
                  <span className="font-medium text-navy-800">{selectedExam.coefficient}</span>
                </div>
              )}
              {selectedExam.prof && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Professeur</span>
                  <span className="font-medium text-navy-800">{selectedExam.prof}</span>
                </div>
              )}
              {selectedExam.description && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Description</span>
                  <p className="text-navy-800">{selectedExam.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
