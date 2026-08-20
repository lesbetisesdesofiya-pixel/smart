import React, { useState } from 'react';
import { changeMyPin } from '../api';

interface ChangePinModalProps { isOpen: boolean; onClose: () => void; }

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => { setStep('current'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(null); setSuccess(false); setLoading(false); };
  const handleClose = () => { reset(); onClose(); };
  const handleNext = () => { setError(null); if (step === 'current') { if (currentPin.length !== 4) { setError('Le PIN doit contenir 4 chiffres'); return; } setStep('new'); } else if (step === 'new') { if (newPin.length !== 4) { setError('Le PIN doit contenir 4 chiffres'); return; } setStep('confirm'); } };
  const handleSubmit = async () => { setError(null); if (confirmPin.length !== 4) { setError('Le PIN doit contenir 4 chiffres'); return; } if (newPin !== confirmPin) { setError('Les PINs ne correspondent pas'); setStep('new'); setNewPin(''); setConfirmPin(''); return; } setLoading(true); try { const data = await changeMyPin(currentPin, newPin); if (data.success) setSuccess(true); else { setError(data.message || 'Erreur'); setStep('current'); setCurrentPin(''); } } catch { setError('Erreur reseau'); } finally { setLoading(false); } };

  if (!isOpen) return null;
  const titles = { current: 'PIN actuel', new: 'Nouveau PIN', confirm: 'Confirmer le PIN' };

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-5 border border-navy-100 animate-scaleIn">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Changer le PIN</h3>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-50 text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div><p className="text-sm font-bold text-gray-900">PIN modifie avec succes</p><p className="text-xs text-gray-400 mt-1">Votre nouveau PIN est maintenant actif.</p></div>
            <button onClick={handleClose} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer">Fermer</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {(['current', 'new', 'confirm'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-navy-800 text-white' : (['current', 'new', 'confirm'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400')}`}>
                    {['current', 'new', 'confirm'].indexOf(step) > i ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : i + 1}
                  </div>
                  {i < 2 && <div className={`w-6 h-0.5 ${['current', 'new', 'confirm'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center font-medium">{titles[step]}</p>
            <input type="password" inputMode="numeric" maxLength={4} autoFocus value={step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); if (step === 'current') setCurrentPin(val); else if (step === 'new') setNewPin(val); else setConfirmPin(val); }} placeholder="&bull; &bull; &bull; &bull;"
              className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] bg-navy-50 border border-navy-200 rounded-xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-navy-400 transition-all" />
            {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">{error}</p>}
            {step === 'confirm' ? (
              <button onClick={handleSubmit} disabled={loading || confirmPin.length !== 4} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Changer le PIN'}</button>
            ) : (
              <button onClick={handleNext} disabled={(step === 'current' ? currentPin : newPin).length !== 4} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">Continuer <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

