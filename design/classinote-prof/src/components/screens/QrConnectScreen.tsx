import React, { useState } from 'react';
import { School, ScreenType } from '../../types';
import { apiFetch } from '../../api';

interface QrConnectScreenProps {
  onScanSuccess: (newSchool: School) => void;
  onNavigate: (screen: ScreenType) => void;
}

export const QrConnectScreen: React.FC<QrConnectScreenProps> = ({
  onScanSuccess,
  onNavigate,
}) => {
  const [code, setCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setErrorMessage('Veuillez entrer un code valide (8 caractères).');
      return;
    }
    setIsLinking(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch('/teacher/link-by-code', {
        method: 'POST',
        body: JSON.stringify({ code: trimmed }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('✓ Établissement lié avec succès !');
        setTimeout(() => {
          onScanSuccess({
            id: `s_${data.ecole.id}`,
            name: data.ecole.nom,
            location: data.ecole.adresse || 'Sénégal',
            role: 'Enseignant',
            iconName: 'school',
            bgColor: 'bg-primary-fixed',
          });
        }, 1200);
      } else {
        setErrorMessage(data.message || 'Code invalide.');
      }
    } catch (err) {
      setErrorMessage('Erreur de connexion. Veuillez réessayer.');
    }
    setIsLinking(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(val);
    setErrorMessage(null);
  };

  return (
    <main className="max-w-[1000px] mx-auto px-4 md:px-10 py-8 pb-32">
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-outline-variant max-w-2xl mx-auto space-y-8 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner mb-3">
            <span className="material-symbols-outlined text-3xl">vpn_key</span>
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-primary">
            Connecter votre établissement
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Saisissez le code à 8 caractères fourni par votre école pour lier votre compte.
          </p>
        </div>

        {successMessage && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl font-bold text-xs md:text-sm text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-xl text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-3">
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="EX : A3B7X9K2"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] p-4 rounded-xl border-2 border-primary/30 bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
              maxLength={8}
              disabled={isLinking}
              autoFocus
            />
            <p className="text-xs text-on-surface-variant">
              {code.length}/8 caractères
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLinking || code.length < 4}
            className="w-full py-3.5 px-6 bg-primary text-on-primary rounded-xl font-label-md text-sm font-bold shadow-md hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? (
              <>
                <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">link</span>
                <span>Lier l'établissement</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-secondary-container/40 rounded-2xl border border-secondary-container flex items-start gap-3 text-xs text-on-secondary-container">
          <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">help</span>
          <div>
            <p className="font-bold text-primary mb-0.5">Où trouver votre code ?</p>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Le code à 8 caractères est fourni par la direction de votre école. Il peut être transmis par email, SMS ou sur votre fiche d'accueil enseignant.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};