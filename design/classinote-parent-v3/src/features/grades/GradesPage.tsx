import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Sparkline } from '@/shared/components/ui/Sparkline';
import { EmptyState } from '@/shared/components/ui/Feedback';
import { GraduationCap, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useDashboard } from '@/shared/stores/stores';

export const GradesPage: React.FC = () => {
  const { data, isLoading } = useDashboard();
  const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null);
  const [detailNote, setDetailNote] = useState<any>(null);

  if (isLoading || !data) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl p-5 animate-shimmer h-20" />)}</div></div>;

  const notesList = data.notes || [];
  const matieres = [...new Set(notesList.map((n: any) => n.evaluation?.matiere?.libelle).filter(Boolean))];
  const filtered = selectedMatiere ? notesList.filter((n: any) => n.evaluation?.matiere?.libelle === selectedMatiere) : notesList;
  const moyenne = notesList.length > 0 ? (notesList.reduce((s: number, n: any) => s + (n.note / (n.evaluation?.note_sur || 20)) * 20, 0) / notesList.length).toFixed(1) : '—';
  const tendance = notesList.slice(0, 10).reverse().map((n: any) => n.note);

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      <Card variant="highlight" className="p-5" delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Moyenne générale</p>
            <p className="text-4xl font-extrabold gradient-text mt-1">{moyenne}<span className="text-lg text-gray-300">/20</span></p>
          </div>
          {tendance.length > 1 && <Sparkline data={tendance} color="#3b82f6" height={40} className="w-28" />}
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setSelectedMatiere(null)} className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${!selectedMatiere ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>Toutes</button>
        {matieres.map((m: any) => <button key={m} onClick={() => setSelectedMatiere(m)} className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${selectedMatiere === m ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>{m}</button>)}
      </div>

      {filtered.length === 0 ? <EmptyState icon={<GraduationCap className="w-8 h-8" />} title="Aucune note" /> : (
        <div className="space-y-2.5">
          {filtered.map((note: any, i: number) => {
            const pct = (note.note / (note.evaluation?.note_sur || 20)) * 100;
            const color = pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
            return (
              <Card key={note.id} className="p-4" delay={0.05 + i * 0.03} onClick={() => setDetailNote(note)}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color === 'emerald' ? 'bg-emerald-50' : color === 'amber' ? 'bg-amber-50' : 'bg-rose-50'}`}>
                    <span className={`text-lg font-extrabold ${color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-rose-600'}`}>{note.note}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{note.evaluation?.titre || 'Évaluation'}</p>
                    <p className="text-xs text-gray-400">{note.evaluation?.matiere?.libelle} · Coeff. {note.evaluation?.coefficient || 1}</p>
                  </div>
                  <Badge color={color} size="md">{note.note}/{note.evaluation?.note_sur || 20}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {detailNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setDetailNote(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div><p className="text-lg font-extrabold text-gray-900">{detailNote.evaluation?.titre}</p><p className="text-sm text-gray-400">{detailNote.evaluation?.matiere?.libelle}</p></div>
              <button onClick={() => setDetailNote(null)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="text-center py-4"><p className="text-5xl font-extrabold gradient-text">{detailNote.note}<span className="text-xl text-gray-300">/{detailNote.evaluation?.note_sur || 20}</span></p></div>
            {detailNote.appreciation && <p className="text-sm text-gray-500 italic text-center">"{detailNote.appreciation}"</p>}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 rounded-2xl p-3"><p className="text-xs text-gray-400">Coefficient</p><p className="text-lg font-extrabold">{detailNote.evaluation?.coefficient || 1}</p></div>
              <div className="bg-gray-50 rounded-2xl p-3"><p className="text-xs text-gray-400">Date</p><p className="text-lg font-extrabold">{detailNote.evaluation?.date ? new Date(detailNote.evaluation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
