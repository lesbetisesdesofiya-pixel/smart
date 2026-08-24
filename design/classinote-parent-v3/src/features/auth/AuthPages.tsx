import React, { useEffect, useState } from 'react';
import { consumeMagicLink } from '@/shared/api/client';
import { Link2, AlertCircle } from 'lucide-react';

function parseMagicToken(): { purpose: string; token: string } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
    const pathParts = window.location.pathname.split('/');
    const purpose = pathParts[pathParts.length - 1] || 'dashboard';
    return { purpose, token };
  }
  return null;
}

export const MagicConsumePage: React.FC = () => {
  const magic = parseMagicToken();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!magic) return;
    let cancelled = false;

    consumeMagicLink(magic.token).then((json) => {
      if (cancelled) return;
      if (!json.success) {
        setError(json.message || 'Lien invalide ou expiré.');
        return;
      }
      window.location.replace(window.location.pathname);
    }).catch(() => {
      if (!cancelled) setError('Erreur. Réessayez.');
    });

    return () => { cancelled = true; };
  }, []);

  if (!magic) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <p className="text-sm text-gray-600">Lien invalide.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Link2 className="w-12 h-12 text-rose-400 mx-auto" />
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400">Demandez un nouveau lien via WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Connexion...</p>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-sm space-y-8 text-center">
      <div className="space-y-3">
        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
          <span className="text-2xl font-bold text-white">CN</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">ClassiNote</h1>
        <p className="text-sm text-blue-200">Espace Parent</p>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
        <Link2 className="w-8 h-8 text-amber-300 mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-white">Lien d'accès requis</h2>
          <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
            Demandez un lien d'accès à l'administration de l'école via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  </div>
);
