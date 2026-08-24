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

    log('Vérification session /auth/me...');
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

      log('Consommation du lien magique...');
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
          setError(json.message || 'Lien invalide ou expiré.');
          return;
        }
        log('Succès! Redirection dans 1s...');
        setDone(true);
        setTimeout(() => {
          window.location.href = window.location.pathname;
        }, 1000);
      }).catch(err => {
        log(`ERREUR /magic/consume: ${err.message}`);
        if (!cancelled) setError('Erreur. Réessayez.');
      });
    }).catch(err => {
      log(`ERREUR /auth/me: ${err.message}`);
      if (!cancelled) setError('Erreur. Réessayez.');
    });

    return () => { cancelled = true; };
  }, []);

  if (!magic) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '14px', color: '#374151', marginTop: '12px' }}>Lien invalide.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <Link2 size={48} color="#f87171" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '14px', color: '#374151', marginTop: '12px' }}>{error}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Demandez un nouveau lien.</p>
          <pre style={{ fontSize: '10px', textAlign: 'left', background: '#f3f4f6', padding: '12px', borderRadius: '12px', marginTop: '16px', maxWidth: '320px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{debug.join('\n')}</pre>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginTop: '12px' }}>Connexion réussie !</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #dbe3f4', borderTopColor: '#002366', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '12px' }}>Connexion...</p>
        <pre style={{ fontSize: '10px', textAlign: 'left', background: '#f3f4f6', padding: '12px', borderRadius: '12px', marginTop: '16px', maxWidth: '320px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{debug.join('\n')}</pre>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export const LandingPage: React.FC = () => (
  <div style={{ minHeight: '100dvh', background: 'linear-gradient(135deg, #002366, #0a1e3d)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%', maxWidth: '384px', display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'center' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>CN</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>ClassiNote</h1>
        <p style={{ fontSize: '14px', color: '#93c5fd' }}>Espace Parent</p>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Link2 size={32} color="#fbbf24" />
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Lien d'accès requis</h2>
          <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.8)', marginTop: '8px', lineHeight: 1.6 }}>
            Demandez un lien d'accès à l'administration de l'école via WhatsApp.
          </p>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.4)' }}>ClassiNote {new Date().getFullYear()}</p>
    </motion.div>
  </div>
);
