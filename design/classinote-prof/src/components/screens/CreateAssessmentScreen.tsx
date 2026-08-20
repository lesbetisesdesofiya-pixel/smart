import React, { useState } from 'react';
import { ScreenType } from '../../types';

interface Classe {
  id: number;
  libelle: string;
  section?: { libelle: string };
}

interface Matiere {
  id: number;
  libelle: string;
}

interface CreateAssessmentScreenProps {
  classes: Classe[];
  matieres: Matiere[];
  onNavigate: (screen: ScreenType) => void;
  onCreateAssessment: (assessment: any) => void;
}

export const CreateAssessmentScreen: React.FC<CreateAssessmentScreenProps> = ({
  classes,
  matieres,
  onNavigate,
  onCreateAssessment,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<number>(classes[0]?.id || 0);
  const [selectedMatiereId, setSelectedMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [selectedType, setSelectedType] = useState<'Interrogation' | 'Devoir' | 'Composition'>('Interrogation');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [titre, setTitre] = useState('');
  const [coefficient, setCoefficient] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoTitle = () => {
    const matiere = matieres.find(m => m.id === selectedMatiereId);
    const name = matiere?.libelle || 'Matière';
    if (selectedType === 'Devoir') return `Devoir Surveillé de ${name}`;
    if (selectedType === 'Composition') return `Composition de ${name}`;
    return `Interrogation de ${name}`;
  };

  const currentTitle = titre || autoTitle();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onCreateAssessment({
        titre: currentTitle,
        type: selectedType,
        classe_id: selectedClassId,
        matiere_id: selectedMatiereId,
        date,
        coefficient,
      });
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <main className="max-w-[800px] mx-auto px-4 md:px-10 pt-6 pb-32">
      <section className="mb-8">
        <nav className="flex items-center text-xs font-medium text-on-surface-variant mb-1">
          <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
          <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
          <span className="text-primary font-bold">Nouvelle Évaluation</span>
        </nav>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mt-2">Créer une Évaluation</h2>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant">
          <label className="text-xs font-bold text-on-surface mb-2 block">Type d'évaluation</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Interrogation', 'Devoir', 'Composition'] as const).map(type => (
              <button key={type} type="button" onClick={() => setSelectedType(type)}
                className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-variant/50 text-on-surface-variant border-outline-variant hover:border-primary/40'
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant space-y-5">
          <div>
            <label className="text-xs font-bold text-on-surface mb-2 block">Titre</label>
            <input type="text" value={titre} onChange={e => setTitre(e.target.value)} placeholder={autoTitle()}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface mb-2 block">Classe</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface mb-2 block">Matière</label>
              <select value={selectedMatiereId} onChange={e => setSelectedMatiereId(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface mb-2 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface mb-2 block">Coefficient</label>
              <select value={coefficient} onChange={e => setCoefficient(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>×{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('dashboard')}
            className="flex-1 h-13 bg-surface-variant text-on-surface-variant font-bold text-sm rounded-2xl hover:bg-surface-variant/80 transition-all cursor-pointer">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 h-13 bg-primary text-white font-bold text-sm rounded-2xl shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer">
            {isSubmitting ? 'Création...' : 'Créer l\'évaluation'}
          </button>
        </div>
      </form>
    </main>
  );
};
