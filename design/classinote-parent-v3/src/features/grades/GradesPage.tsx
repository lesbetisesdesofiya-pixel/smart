import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Sparkline } from '@/shared/components/ui/Sparkline';
import { GraduationCap, X } from 'lucide-react';
import { useDashboard } from '@/shared/stores/stores';

export const GradesPage: React.FC = () => {
  const { data, isLoading } = useDashboard();
  const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null);
  const [detailNote, setDetailNote] = useState<any>(null);

  if (isLoading || !data)
    return (
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 112, maxWidth: 512, margin: '0 auto', paddingTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-shimmer" style={{ background: '#fff', borderRadius: 24, padding: 20, height: 80 }} />
          ))}
        </div>
      </div>
    );

  const notesList = data.notes || [];
  const matieres = [...new Set(notesList.map((n: any) => n.evaluation?.matiere?.libelle).filter(Boolean))];
  const filtered = selectedMatiere ? notesList.filter((n: any) => n.evaluation?.matiere?.libelle === selectedMatiere) : notesList;
  const moyenne = notesList.length > 0 ? (notesList.reduce((s: number, n: any) => s + (n.note / (n.evaluation?.note_sur || 20)) * 20, 0) / notesList.length).toFixed(1) : '—';
  const tendance = notesList.slice(0, 10).reverse().map((n: any) => n.note);

  return (
    <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 112, maxWidth: 512, margin: '0 auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card variant="highlight" style={{ padding: 20 }} delay={0}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moyenne générale</p>
            <p style={{ fontSize: 36, fontWeight: 800, marginTop: 4, background: 'linear-gradient(135deg, #002366, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{moyenne}<span style={{ fontSize: 18, color: '#d1d5db', WebkitTextFillColor: '#d1d5db' }}>/20</span></p>
          </div>
          {tendance.length > 1 && <div style={{ width: 112 }}><Sparkline data={tendance} color="#3b82f6" height={40} /></div>}
        </div>
      </Card>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setSelectedMatiere(null)}
          style={{
            flexShrink: 0, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6, borderRadius: 16,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            background: !selectedMatiere ? '#0a1642' : '#fff', color: !selectedMatiere ? '#fff' : '#6b7280',
            border: !selectedMatiere ? '1px solid #0a1642' : '1px solid #f3f4f6',
          }}
        >
          Toutes
        </button>
        {matieres.map((m: any) => (
          <button
            key={m}
            onClick={() => setSelectedMatiere(m)}
            style={{
              flexShrink: 0, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6, borderRadius: 16,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: selectedMatiere === m ? '#0a1642' : '#fff', color: selectedMatiere === m ? '#fff' : '#6b7280',
              border: selectedMatiere === m ? '1px solid #0a1642' : '1px solid #f3f4f6',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <GraduationCap size={32} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: 14, color: '#6b7280' }}>Aucune note</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((note: any, i: number) => {
            const pct = (note.note / (note.evaluation?.note_sur || 20)) * 100;
            const color = pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
            return (
              <Card key={note.id} style={{ padding: 16 }} delay={0.05 + i * 0.03} onClick={() => setDetailNote(note)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: color === 'emerald' ? '#ecfdf5' : color === 'amber' ? '#fffbeb' : '#fff1f2',
                  }}>
                    <span style={{
                      fontSize: 18, fontWeight: 800,
                      color: color === 'emerald' ? '#059669' : color === 'amber' ? '#d97706' : '#e11d48',
                    }}>{note.note}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.evaluation?.titre || 'Évaluation'}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{note.evaluation?.matiere?.libelle} · Coeff. {note.evaluation?.coefficient || 1}</p>
                  </div>
                  <Badge color={color} size="md">{note.note}/{note.evaluation?.note_sur || 20}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {detailNote && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setDetailNote(null)}>
          <div style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', maxWidth: 512, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{detailNote.evaluation?.titre}</p>
                <p style={{ fontSize: 14, color: '#9ca3af' }}>{detailNote.evaluation?.matiere?.libelle}</p>
              </div>
              <button onClick={() => setDetailNote(null)} style={{ padding: 8, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: 'none' }}>
                <X size={20} style={{ color: '#9ca3af' }} />
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg, #002366, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {detailNote.note}<span style={{ fontSize: 20, color: '#d1d5db', WebkitTextFillColor: '#d1d5db' }}>/{detailNote.evaluation?.note_sur || 20}</span>
              </p>
            </div>
            {detailNote.appreciation && <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>"{detailNote.appreciation}"</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 12 }}>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>Coefficient</p>
                <p style={{ fontSize: 18, fontWeight: 800 }}>{detailNote.evaluation?.coefficient || 1}</p>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 12 }}>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>Date</p>
                <p style={{ fontSize: 18, fontWeight: 800 }}>{detailNote.evaluation?.date ? new Date(detailNote.evaluation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
