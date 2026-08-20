import React, { useState } from 'react';
import { changeMyPin } from '../api';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNext = () => {
    setError(null);
    if (step === 'current') {
      if (currentPin.length !== 4) {
        setError('Le PIN doit contenir 4 chiffres');
        return;
      }
      setStep('new');
    } else if (step === 'new') {
      if (newPin.length !== 4) {
        setError('Le PIN doit contenir 4 chiffres');
        return;
      }
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (confirmPin.length !== 4) {
      setError('Le PIN doit contenir 4 chiffres');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Les PINs ne correspondent pas');
      setStep('new');
      setNewPin('');
      setConfirmPin('');
      return;
    }
    setLoading(true);
    try {
      const data = await changeMyPin(currentPin, newPin);
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Erreur lors du changement de PIN');
        setStep('current');
        setCurrentPin('');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const titles = {
    current: 'PIN actuel',
    new: 'Nouveau PIN',
    confirm: 'Confirmer le PIN',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Changer le PIN</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">PIN modifié avec succès</p>
              <p className="text-xs text-slate-500 mt-1">Votre nouveau PIN est maintenant actif.</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
              {(['current', 'new', 'confirm'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s ? 'bg-blue-600 text-white' :
                    (['current', 'new', 'confirm'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')
                  }`}>
                    {['current', 'new', 'confirm'].indexOf(step) > i ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : i + 1}
                  </div>
                  {i < 2 && <div className={`w-6 h-0.5 ${['current', 'new', 'confirm'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 text-center font-medium">{titles[step]}</p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (step === 'current') setCurrentPin(val);
                else if (step === 'new') setNewPin(val);
                else setConfirmPin(val);
              }}
              placeholder="• • • •"
              className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />

            {error && (
              <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2 rounded-xl border border-red-200">{error}</p>
            )}

            {step === 'confirm' ? (
              <button
                onClick={handleSubmit}
                disabled={loading || confirmPin.length !== 4}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span>Changer le PIN</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={(step === 'current' ? currentPin : newPin).length !== 4}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer transition-all"
              >
                <span>Continuer</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
