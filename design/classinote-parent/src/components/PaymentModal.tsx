import React, { useState } from 'react';
import { PaymentItem } from '../types';
import { apiFetch } from '../api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingPayment?: PaymentItem | null;
  remainingAmount: number;
  onPaymentSuccess: (amountPaid: number, paymentTitle: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  pendingPayment,
  remainingAmount,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'wave' | 'orange' | 'free' | 'card'>('wave');
  const [phoneNumber, setPhoneNumber] = useState('77 000 00 00');
  const [customAmount, setCustomAmount] = useState<number>(
    pendingPayment ? pendingPayment.amount : remainingAmount
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{
    id: string;
    amount: number;
    title: string;
    date: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const res = await apiFetch('/parent/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode_paiement: method }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors du paiement');
      }

      const data = await res.json();

      const newReceipt = {
        id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: customAmount,
        title: pendingPayment ? pendingPayment.title : "Abonnement Mensuel",
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setReceipt(newReceipt);
      onPaymentSuccess(customAmount, newReceipt.title);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {receipt ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-[#00113a]">Paiement Effectué avec Succès !</h3>
            <p className="text-xs text-slate-500">Un reçu numérique vous a été émis.</p>

            <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-dashed border-slate-300 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Numéro de Reçu :</span>
                <span className="font-mono font-bold text-[#00113a]">{receipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motif :</span>
                <span className="font-semibold">{receipt.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span>{receipt.date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-[#00113a]">Montant Réglé :</span>
                <span className="font-bold text-emerald-600">{receipt.amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(`Téléchargement du reçu ${receipt.id}.pdf en cours...`);
                }}
                className="flex-1 py-3 bg-[#e5eeff] text-[#002366] font-bold text-xs rounded-xl hover:bg-[#8dafff]/40 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Télécharger Reçu
              </button>
              <button
                onClick={() => {
                  setReceipt(null);
                  onClose();
                }}
                className="flex-1 py-3 bg-[#002366] text-white font-bold text-xs rounded-xl hover:bg-[#00113a] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#00113a]">Paiement Scolaire ClassiNote</h3>
                <p className="text-xs text-[#757682]">Paiement sécurisé instantané</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Montant à régler (FCFA)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                min={1000}
                max={remainingAmount}
                className="w-full h-12 px-4 bg-[#f8f9ff] border border-slate-200 rounded-xl font-bold text-lg text-[#00113a] focus:outline-none focus:border-[#375ca6]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Reste à payer total : {remainingAmount.toLocaleString('fr-FR')} FCFA</p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Méthode de Paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'wave', label: 'Wave', color: 'border-sky-400 bg-sky-50 text-sky-800' },
                  { id: 'orange', label: 'Orange Money', color: 'border-orange-400 bg-orange-50 text-orange-800' },
                  { id: 'free', label: 'Free Money', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
                  { id: 'card', label: 'Carte Bancaire', color: 'border-indigo-400 bg-indigo-50 text-indigo-800' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      method === m.id
                        ? `${m.color} ring-2 ring-offset-1 ring-[#002366]`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.label}</span>
                    {method === m.id && (
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile / Card details */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {method === 'card' ? 'Numéro de Carte' : 'Numéro de Téléphone (Mobile Money)'}
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={method === 'card' ? '4000 1234 5678 9010' : '77 000 00 00'}
                className="w-full h-11 px-4 bg-[#f8f9ff] border border-slate-200 rounded-xl text-sm font-semibold text-[#00113a] focus:outline-none focus:border-[#375ca6]"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full h-12 bg-[#002366] text-white font-bold text-sm rounded-xl shadow-lg hover:bg-[#00113a] transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock</span>
                  <span>Payer {customAmount.toLocaleString('fr-FR')} FCFA</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
