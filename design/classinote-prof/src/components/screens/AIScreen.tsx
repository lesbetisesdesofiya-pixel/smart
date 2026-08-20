import React, { useState } from 'react';
import { Sparkles, Loader2, Send, Settings2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { apiFetch } from '../../api';
import { ScreenType } from '../../types';

function sanitizeHtml(dirty: string): string {
  const temp = document.createElement('div');
  temp.textContent = dirty;
  const text = temp.innerHTML;
  return text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

interface AIScreenProps {
  onNavigate: (screen: ScreenType) => void;
  currentSchool: { id: string; name: string };
}

export const AIScreen: React.FC<AIScreenProps> = ({ onNavigate, currentSchool }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'summary' | 'providers'>('notes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [analysis, setAnalysis] = useState('');

  const [profileStudentName, setProfileStudentName] = useState('');
  const [profileClassName, setProfileClassName] = useState('');
  const [grades, setGrades] = useState<{ matiere: string; valeur: number; max: number; type_evaluation: string }[]>([]);
  const [profileResult, setProfileResult] = useState<string | null>(null);

  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [loadingProviders, setLoadingProviders] = useState(false);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const res = await apiFetch('/ai/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setProviders(data.providers);
      }
    } catch (e) {
      setError('Impossible de charger les providers.');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !className || !subject || !analysis) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch('/ai/teacher-notes', {
        method: 'POST',
        body: JSON.stringify({
          student_name: studentName,
          class_name: className,
          subject,
          analysis,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erreur de génération');
      }

      setResult(data.note);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileStudentName || !profileClassName || grades.length === 0) return;

    setLoading(true);
    setError(null);
    setProfileResult(null);

    try {
      const res = await apiFetch('/ai/student-summary', {
        method: 'POST',
        body: JSON.stringify({
          student_name: profileStudentName,
          class_name: profileClassName,
          grades,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erreur de génération');
      }

      setProfileResult(data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addGrade = () => {
    setGrades([...grades, { matiere: '', valeur: 0, max: 20, type_evaluation: 'interrogation' }]);
  };

  const updateGrade = (index: number, field: string, value: string | number) => {
    const updated = [...grades];
    updated[index] = { ...updated[index], [field]: value };
    setGrades(updated);
  };

  const removeGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-5 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <h1 className="text-lg font-bold">Assistant IA</h1>
            <p className="text-xs opacity-80">{currentSchool.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { id: 'notes' as const, label: 'Notes', icon: 'edit' },
            { id: 'summary' as const, label: 'Profil', icon: 'person' },
            { id: 'providers' as const, label: 'Config', icon: 'tune' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400">&times;</button>
          </div>
        )}

        {activeTab === 'notes' && (
          <form onSubmit={handleGenerateNotes} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nom de l'élève *</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ex: Koné Amadou"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Classe *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex: 6ème A"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Matière *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Mathématiques"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Analyse / observations *</label>
              <textarea
                required
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="Décrivz le comportement, les points forts, les difficultés, etc."
                rows={5}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer la note pédagogique
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'summary' && (
          <form onSubmit={handleGenerateSummary} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nom de l'élève *</label>
                <input
                  type="text"
                  required
                  value={profileStudentName}
                  onChange={(e) => setProfileStudentName(e.target.value)}
                  placeholder="Ex: Koné Amadou"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Classe *</label>
                <input
                  type="text"
                  required
                  value={profileClassName}
                  onChange={(e) => setProfileClassName(e.target.value)}
                  placeholder="Ex: 6ème A"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600">Notes</label>
                <button
                  type="button"
                  onClick={addGrade}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  + Ajouter une note
                </button>
              </div>

              <div className="space-y-2">
                {grades.map((grade, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={grade.matiere}
                      onChange={(e) => updateGrade(idx, 'matiere', e.target.value)}
                      placeholder="Matière"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={grade.valeur}
                      onChange={(e) => updateGrade(idx, 'valeur', parseFloat(e.target.value) || 0)}
                      placeholder="Note"
                      className="w-16 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                    <select
                      value={grade.type_evaluation}
                      onChange={(e) => updateGrade(idx, 'type_evaluation', e.target.value)}
                      className="w-28 px-2 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="devoir">Devoir</option>
                      <option value="interrogation">Interro</option>
                      <option value="composition">Composition</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeGrade(idx)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer le résumé
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'providers' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Choisissez un provider IA actif pour générer vos notes.</p>
            {loadingProviders ? (
              <div className="text-center py-4 text-slate-400 text-xs">Chargement...</div>
            ) : providers.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">Aucun provider disponible.</div>
            ) : (
              providers.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    selectedProvider === p.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${p.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.code}</p>
                  </div>
                  {selectedProvider === p.code && (
                    <span className="ml-auto text-xs text-blue-600 font-semibold">Sélectionné</span>
                  )}
                </button>
              ))
            )}
            <button
              onClick={fetchProviders}
              className="w-full py-2 text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Rafraîchir la liste
            </button>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-blue-800">Note pédagogique générée</h4>
              <button
                onClick={() => setResult(null)}
                className="text-blue-400 hover:text-blue-600 text-xs"
              >
                Fermer
              </button>
            </div>
            <div
              className="text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(result) }}
            />
          </div>
        )}

        {profileResult && (
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-blue-800">Résumé du profil élève</h4>
              <button
                onClick={() => setProfileResult(null)}
                className="text-blue-400 hover:text-blue-600 text-xs"
              >
                Fermer
              </button>
            </div>
            <div
              className="text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(profileResult) }}
            />
          </div>
        )}
      </div>
    </div>
  );
};