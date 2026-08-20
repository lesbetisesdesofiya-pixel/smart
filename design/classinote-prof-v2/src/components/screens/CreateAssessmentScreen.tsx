import React, { useState } from 'react';
import { ScreenType, Classe, Matiere } from '../../types';

interface Props { classes: Classe[]; matieres: Matiere[]; onNavigate: (screen: ScreenType) => void; onCreateAssessment: (assessment: any) => void; }

export const CreateAssessmentScreen: React.FC<Props> = ({ classes, matieres, onNavigate, onCreateAssessment }) => {
  const [selectedClassId, setSelectedClassId] = useState<number>(classes[0]?.id || 0);
  const [selectedMatiereId, setSelectedMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [selectedType, setSelectedType] = useState<'Interrogation' | 'Devoir' | 'Composition'>('Interrogation');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [titre, setTitre] = useState('');
  const [coefficient, setCoefficient] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoTitle = () => { const m = matieres.find(m => m.id === selectedMatiereId); const n = m?.libelle || 'Matiere'; if (selectedType === 'Devoir') return `Devoir Surveille de ${n}`; if (selectedType === 'Composition') return `Composition de ${n}`; return `Interrogation de ${n}`; };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setIsSubmitting(true); setTimeout(() => { onCreateAssessment({ titre: titre || autoTitle(), type: selectedType, classe_id: selectedClassId, matiere_id: selectedMatiereId, date, coefficient }); setIsSubmitting(false); }, 500); };

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6 max-w-2xl mx-auto">
      <div><button onClick={() => onNavigate('dashboard')} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour</button><h2 className="text-xl font-bold text-gray-900">Creer une evaluation</h2></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm">
          <label className="text-xs font-bold text-gray-500 mb-3 block">Type d'evaluation</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'Interrogation' as const, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', c: 'from-navy-800 to-navy-500' }, { id: 'Devoir' as const, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', c: 'from-blue-600 to-blue-400' }, { id: 'Composition' as const, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', c: 'from-emerald-600 to-emerald-400' }].map(t => (
              <button key={t.id} type="button" onClick={() => setSelectedType(t.id)} className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-2 ${selectedType === t.id ? 'border-navy-300 bg-navy-50 text-navy-800' : 'border-gray-200 text-gray-400 hover:border-navy-200'}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.c} flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg></div>{t.id}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm space-y-4">
          <div><label className="text-xs font-bold text-gray-500 mb-2 block">Titre</label><input type="text" value={titre} onChange={e => setTitre(e.target.value)} placeholder={autoTitle()} className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 mb-2 block">Classe</label><select value={selectedClassId} onChange={e => setSelectedClassId(parseInt(e.target.value))} className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 mb-2 block">Matiere</label><select value={selectedMatiereId} onChange={e => setSelectedMatiereId(parseInt(e.target.value))} className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 mb-2 block">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400" /></div>
            <div><label className="text-xs font-bold text-gray-500 mb-2 block">Coefficient</label><select value={coefficient} onChange={e => setCoefficient(parseInt(e.target.value))} className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{[1,2,3,4,5].map(c => <option key={c} value={c}>x{c}</option>)}</select></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('dashboard')} className="flex-1 h-12 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all cursor-pointer">Annuler</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer">{isSubmitting ? 'Creation...' : "Creer l'evaluation"}</button>
        </div>
      </form>
    </div>
  );
};

