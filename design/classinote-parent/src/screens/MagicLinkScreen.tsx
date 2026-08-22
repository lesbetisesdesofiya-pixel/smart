import React, { useEffect, useState } from 'react';

const API_BASE = '/api/v1';

type MagicPurpose = 'news' | 'dashboard' | 'notes' | 'absences' | 'frais' | 'emploi' | 'annonces' | 'profs' | 'paiements';

interface MagicLinkScreenProps {
  purpose: MagicPurpose;
  token: string;
}

export const MagicLinkScreen: React.FC<MagicLinkScreenProps> = ({ purpose, token }) => {
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/magic/consume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token, purpose }),
        });
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || !json.success) {
          setError(json.message || 'Ce lien est invalide ou a expiré.');
          setState('error');
          return;
        }

        if (json.auth) {
          localStorage.setItem('classinote_parent_user', JSON.stringify({ type: 'parent', id: json.id }));
          sessionStorage.setItem('classinote_magic_dashboard', '1');
        }

        if (json.tab) {
          sessionStorage.setItem('classinote_magic_tab', json.tab);
        }

        const appBase = window.location.pathname.endsWith('/')
          ? window.location.pathname
          : window.location.pathname + '/';
        window.location.replace(appBase);
      } catch {
        if (!cancelled) {
          setError('Une erreur est survenue. Veuillez réessayer.');
          setState('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token, purpose]);

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-[24px] p-8 shadow-card border border-slate-100 text-center space-y-4 animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-rose-500">link_off</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0b1c30]">Lien invalide ou expiré</h2>
            <p className="text-xs text-[#757682] mt-2 leading-relaxed">
              {error}
              <br /><br />
              Pour obtenir un nouveau lien, écrivez « menu » à l'école sur WhatsApp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-[#375ca6] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#757682] font-medium">Connexion en cours...</p>
      </div>
    </div>
  );
};
