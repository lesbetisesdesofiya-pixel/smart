import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'code' | 'phone' | 'pin'>('code');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'code') {
        const res = await fetch('/api/v1/auth/device/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ code, telephone: '' }),
        });
        const data = await res.json();
        if (res.ok) {
          setStep('phone');
        } else {
          setError(data.message || 'Code invalide');
        }
      } else if (step === 'phone') {
        const res = await fetch('/api/v1/auth/device/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ code, telephone: phone }),
        });
        const data = await res.json();
        if (res.ok) {
          setStep('pin');
        } else {
          setError(data.message || 'Téléphone invalide');
        }
      } else {
        const res = await fetch('/api/v1/auth/device/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ code, telephone: phone, pin }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          onLoginSuccess();
        } else {
          setError(data.message || 'Erreur de connexion');
        }
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002366] to-[#0a1e3d] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">ClassiNote</h1>
          <p className="text-sm text-blue-200 mt-1">Espace Professeur</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
          {step === 'code' && (
            <div>
              <label className="text-xs font-semibold text-blue-200 block mb-2">Code d'accès</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXX-XXXX"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-lg font-mono font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
            </div>
          )}

          {step === 'phone' && (
            <div>
              <label className="text-xs font-semibold text-blue-200 block mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
            </div>
          )}

          {step === 'pin' && (
            <div>
              <label className="text-xs font-semibold text-blue-200 block mb-2">Créez votre PIN (4 chiffres)</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • • •"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-mono font-bold tracking-[0.5em] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          )}

          {error && (
            <p className="text-xs text-rose-300 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || (step === 'code' && code.length < 3) || (step === 'phone' && phone.length < 8) || (step === 'pin' && pin.length !== 4)}
            className="w-full py-3 bg-white text-[#002366] font-bold text-sm rounded-xl hover:bg-blue-50 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? 'Chargement...' : step === 'pin' ? 'Connexion' : 'Continuer'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
