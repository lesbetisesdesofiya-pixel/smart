import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

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
  const [step, setStep] = useState<'consuming' | 'set-pin' | 'done' | 'error'>('consuming');
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [debug, setDebug] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log('[PROF-V3]', msg);
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    if (!magic) {
      log('Pas de token magique trouvé');
      setStep('error');
      setError('Lien invalide.');
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
          log(`ERREUR consume: ${json.message}`);
          setStep('error');
          setError(json.message || 'Lien invalide ou expiré.');
          return;
        }
        setUserData(json);
        log(`Type utilisateur: ${json.type}`);

        // Étape 3: Vérifier si appareil enregistré
        if (json.type === 'prof') {
          log('Étape 3: Vérification appareil /auth/device/check...');
          fetch('/api/v1/auth/device/check', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }).then(r => {
            log(`Réponse /auth/device/check: status=${r.status}`);
            return r.json();
          }).then(deviceData => {
            log(`Données device check: ${JSON.stringify(deviceData)}`);
            if (deviceData.trusted) {
              log('Appareil déjà enregistré → rechargement');
              window.location.href = window.location.pathname;
            } else {
              log('Premier fois → demande PIN');
              setStep('set-pin');
            }
          }).catch(err => {
            log(`ERREUR device check: ${err.message}`);
            setStep('set-pin');
          });
        } else {
          log('Parent → rechargement');
          window.location.href = window.location.pathname;
        }
      }).catch(err => {
        log(`ERREUR fetch /magic/consume: ${err.message}`);
        if (!cancelled) {
          setStep('error');
          setError('Erreur. Réessayez.');
        }
      });
    }).catch(err => {
      log(`ERREUR fetch /auth/me: ${err.message}`);
      if (!cancelled) {
        setStep('error');
        setError('Erreur. Réessayez.');
      }
    });

    return () => { cancelled = true; };
  }, []);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setPinLoading(true);
    log(`Enregistrement PIN...`);
    try {
      const res = await fetch('/api/v1/auth/device/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          code: userData?.code || '',
          telephone: userData?.telephone || '',
          pin,
        }),
      });

      const data = await res.json();
      log(`Réponse register: ${JSON.stringify(data)}`);
      if (res.ok && data.success) {
        log('PIN enregistré avec succès!');
        setStep('done');
        setTimeout(() => onSuccess(), 1500);
      } else {
        log(`ERREUR register: ${data.message}`);
        setError(data.message || 'Erreur');
      }
    } catch (err: any) {
      log(`ERREUR réseau register: ${err.message}`);
      setError('Erreur réseau');
    } finally {
      setPinLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400">Demandez un nouveau lien via WhatsApp.</p>
          <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 overflow-auto max-h-60">
            {debug.join('\n')}
          </pre>
        </div>
      </div>
    );
  }

  if (step === 'set-pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002366] to-[#0a1e3d] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-400/20">
              <CheckCircle className="w-8 h-8 text-emerald-300" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Bienvenue !</h1>
            <p className="text-sm text-blue-200 mt-2">
              Créez un PIN pour sécuriser votre accès.
              <br />
              <span className="text-blue-200/60">Vous le utiliserez pour vous reconnecter.</span>
            </p>
          </div>

          <form onSubmit={handleSetPin} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
            <div>
              <label className="text-xs font-semibold text-blue-200 block mb-2">Créez votre PIN (4-6 chiffres)</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="• • • •"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-mono font-bold tracking-[0.5em] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-300 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pinLoading || pin.length < 4}
              className="w-full py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-400 disabled:opacity-40 transition-all cursor-pointer"
            >
              {pinLoading ? 'Enregistrement...' : 'Enregistrer mon appareil'}
            </button>
          </form>

          <pre className="text-xs text-left bg-white/5 text-blue-200/60 p-3 rounded-lg mt-4 overflow-auto max-h-40">
            {debug.join('\n')}
          </pre>
        </motion.div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-gray-900">Appareil enregistré !</p>
          <p className="text-xs text-gray-400">Redirection...</p>
          <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 overflow-auto max-h-60">
            {debug.join('\n')}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Connexion...</p>
        <pre className="text-xs text-left bg-gray-100 p-3 rounded-lg mt-4 overflow-auto max-h-60">
          {debug.join('\n')}
        </pre>
      </div>
    </div>
  );
};
