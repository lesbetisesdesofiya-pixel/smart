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
