import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Eye, EyeOff, LogOut } from 'lucide-react';

interface PinEntryScreenProps {
  onSuccess: (user: { id: number; nom_complet: string }) => void;
  onLogout: () => void;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({ onSuccess, onLogout }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/device/pin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess({
          id: data.user.id,
          nom_complet: data.user.nom_complet || `${data.user.prenom} ${data.user.nom}`,
        });
      } else {
        setError(data.message || 'PIN incorrect');
        setPin('');
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
          <p className="text-sm text-blue-200 mt-1">Entrez votre PIN pour accéder</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
          <div>
            <label className="text-xs font-semibold text-blue-200 block mb-2">Code PIN</label>
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

          {error && (
            <p className="text-xs text-rose-300 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3 bg-white text-[#002366] font-bold text-sm rounded-xl hover:bg-blue-50 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? 'Vérification...' : 'Se connecter'}
          </button>
        </form>

        <button
          onClick={onLogout}
          className="w-full mt-4 py-3 text-blue-200/60 hover:text-blue-200 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-3 h-3" />
          Changer de compte
        </button>
      </motion.div>
    </div>
  );
};
