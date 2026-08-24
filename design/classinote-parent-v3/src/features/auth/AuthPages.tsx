import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link2, AlertCircle, CheckCircle } from 'lucide-react';

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

interface MagicConsumePageProps {
  onSuccess: () => void;
}

export const MagicConsumePage: React.FC<MagicConsumePageProps> = ({ onSuccess }) => {
  const magic = parseMagicToken();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log('[PARENT-V3]', msg);
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    if (!magic) {
      log('Pas de token magique trouvé');
      return;
    }
    let cancelled = false;
    log(`Token trouvé: ${magic.token.substring(0, 16)}...`);

    // Étape 1: Vérifier session
    log('Étape 1: Vérification session /auth/me...');
    fetch('/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then(res => {
      log(`Réponse /auth/me: status=${res.status}`);
      return res.json();
    }).then(data => {
      log(`Données /auth/me: ${JSON.stringify(data)}`);
      if (data.authenticated) {
        log('Déjà connecté → rechargement');
        window.location.href = window.location.pathname;
        return;
      }

      // Étape 2: Consommer le lien
      log('Étape 2: Consommation du lien magique...');
      fetch('/api/v1/magic/consume', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token: magic.token }),
      }).then(res => {
        log(`Réponse /magic/consume: status=${res.status}`);
        return res.json();
      }).then(json => {
        if (cancelled) return;
        log(`Données /magic/consume: ${JSON.stringify(json)}`);
        if (!json.success) {
          log(`ERREUR: ${json.message}`);
          setError(json.message || 'Lien invalide ou expiré.');
          return;
        }
        log('Succès! Redirection dans 1s...');
        setDone(true);
        setTimeout(() => {
          log('Redirection maintenant...');
          window.location.href = window.location.pathname;
        }, 1000);
      }).catch(err => {
        log(`ERREUR fetch /magic/consume: ${err.message}`);
        if (!cancelled) setError('Erreur. Réessayez.');
      });
    }).catch(err => {
      log(`ERREUR fetch /auth/me: ${err.message}`);
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
          <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 max-w-sm overflow-auto">
            {debug.join('\n')}
          </pre>
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
          <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 max-w-sm overflow-auto">
            {debug.join('\n')}
          </pre>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-gray-900">Connexion réussie !</p>
          <p className="text-xs text-gray-400">Redirection...</p>
          <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 max-w-sm overflow-auto">
            {debug.join('\n')}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Connexion...</p>
        <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 max-w-sm overflow-auto">
          {debug.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm space-y-8 text-center"
    >
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
            <br /><br />
            Le lien sera utilisé une seule fois pour enregistrer votre appareil.
          </p>
        </div>
      </div>
      <p className="text-xs text-blue-200/40">ClassiNote {new Date().getFullYear()}</p>
    </motion.div>
  </div>
);
