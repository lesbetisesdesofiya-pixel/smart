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

  useEffect(() => {
    if (!magic) {
      setStep('error');
      setError('Lien invalide.');
      return;
    }

    let cancelled = false;

    // D'abord vérifier si déjà connecté
    fetch('/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then(res => res.json()).then(data => {
      if (data.authenticated) {
        // Déjà connecté → recharger sans le token
        window.location.href = window.location.pathname;
        return;
      }

      // Pas connecté → consommer le lien magique
      fetch('/api/v1/magic/consume', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token: magic.token }),
      }).then(res => res.json()).then(json => {
        if (cancelled) return;
        if (!json.success) {
          setStep('error');
          setError(json.message || 'Lien invalide ou expiré.');
          return;
        }
        setUserData(json);
        // Vérifier si le prof a déjà un PIN
        if (json.type === 'prof') {
          // Vérifier si PIN existe déjà
          fetch('/api/v1/auth/device/check', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }).then(r => r.json()).then(deviceData => {
            if (deviceData.trusted) {
              // Appareil déjà enregistré → recharger
              window.location.href = window.location.pathname;
            } else {
              // Premier fois → demander PIN
              setStep('set-pin');
            }
          }).catch(() => setStep('set-pin'));
        } else {
          // Parent → recharger
          window.location.href = window.location.pathname;
        }
      }).catch(() => {
        if (!cancelled) {
          setStep('error');
          setError('Erreur. Réessayez.');
        }
      });
    }).catch(() => {
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
      if (res.ok && data.success) {
        setStep('done');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(data.message || 'Erreur');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setPinLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400">Demandez un nouveau lien via WhatsApp.</p>
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
        </motion.div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-gray-900">Appareil enregistré !</p>
          <p className="text-xs text-gray-400">Redirection...</p>
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
