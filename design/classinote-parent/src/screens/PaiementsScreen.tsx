import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

interface FraisItem {
  id: number;
  libelle: string;
  montant: number;
  description: string | null;
  paye: boolean;
}

interface FraisData {
  eleve_id: number;
  eleve_nom: string;
  classe: string;
  scolarite: {
    montant_mensuel: number;
    total: number;
    paye: number;
    reste: number;
    mois_payes: string[];
    mois_restants: string[];
  };
  frais: {
    total: number;
    paye: number;
    reste: number;
    items: FraisItem[];
  };
  abonnement: {
    paye: boolean;
  };
  total_general: number;
  total_paye: number;
  reste_general: number;
  historique: {
    id: number;
    montant: number;
    type: string;
    methode: string;
    reference: string;
    date: string;
  }[];
}

export const PaiementsScreen: React.FC = () => {
  const [fraisData, setFraisData] = useState<FraisData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFrais = useCallback(async () => {
    try {
      const res = await apiFetch('/parent/frais');
      const data = await res.json();
      console.log('[Paiements] API response:', data);
      if (data.success && Array.isArray(data.frais)) {
        setFraisData(data.frais);
      }
    } catch (err) {
      console.error('[Paiements] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFrais();
  }, [loadFrais]);

  const activeChildData = fraisData[0] || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#375ca6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeChildData) {
    return (
      <div className="space-y-5 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
        <section className="bg-white rounded-[24px] p-8 shadow-card border border-slate-100 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">receipt_long</span>
          <p className="text-sm font-semibold text-slate-500">Aucune information de paiement</p>
          <p className="text-xs text-slate-400 mt-1">Les informations apparaîtront ici une fois disponibles.</p>
        </section>
      </div>
    );
  }

  const { scolarite, frais, abonnement, reste_general, total_general, total_paye, historique } = activeChildData;
  const moisPayesCount = scolarite.mois_payes.length;
  const moisRestantsCount = scolarite.mois_restants.length;
  const totalMois = 10;

  const allMonths = ['septembre', 'octobre', 'novembre', 'decembre', 'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin'];

  return (
    <div className="space-y-5 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">

      {/* ─── Hero Balance Card ─── */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#002366] text-white p-6 shadow-xl">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-[#375ca6]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold opacity-80 uppercase tracking-widest text-[#758dd5]">
            ÉCOLAGE RESTANT À PAYER
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-white">
            {scolarite.reste.toLocaleString('fr-FR')} FCFA
          </h1>
          <p className="text-xs text-white/60 mt-1">
            {activeChildData.eleve_nom} — {activeChildData.classe}
          </p>

          {/* Mois abonnement */}
          <div className="mt-4 bg-white/10 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-white/80 mb-2">
              Mois d'abonnement à SmartyClass restants ({moisRestantsCount})
            </p>
            <div className="flex flex-wrap gap-1">
              {allMonths.map((m) => {
                const isPaye = scolarite.mois_payes.includes(m);
                return (
                  <span
                    key={m}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPaye
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                        : 'bg-white/10 text-white/50 border border-white/10'
                    }`}
                  >
                    {m.substring(0, 3)}. {isPaye && '✓'}
                  </span>
                );
              })}
            </div>
            <p className="text-[10px] text-white/50 mt-2">
              {moisPayesCount}/{totalMois} mois payés
            </p>
          </div>
        </div>
      </section>

      {/* ─── FRAIS ANNEXES ─── */}
      <section className="bg-white rounded-[20px] shadow-card border border-slate-100 overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#002366] text-xl">receipt_long</span>
            <h2 className="text-sm font-bold text-[#0b1c30]">Frais Scolaires</h2>
          </div>
          <div className="flex gap-2">
            {frais.paye > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                {frais.paye.toLocaleString('fr-FR')} F payé
              </span>
            )}
            {frais.reste > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                {frais.reste.toLocaleString('fr-FR')} F reste
              </span>
            )}
          </div>
        </div>

        {frais.items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-400">Aucun frais défini pour votre classe</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {frais.items.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.paye ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <span className="material-symbols-outlined text-base">
                      {item.paye ? 'check_circle' : 'pending'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0b1c30]">{item.libelle}</p>
                    {item.description && (
                      <p className="text-[10px] text-slate-400">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0b1c30]">{item.montant.toLocaleString('fr-FR')} F</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.paye
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.paye ? 'PAYÉ' : 'À PAYER'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── ABONNEMENT ─── */}
      <section className="bg-white rounded-[20px] shadow-card border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              abonnement.paye ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {abonnement.paye ? 'check_circle' : 'cancel'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">Abonnement ClassiNote</h3>
              <p className="text-[11px] text-slate-400">
                {abonnement.paye ? 'Actif — Accès débloqué' : 'Inactif — Accès verrouillé'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
            abonnement.paye ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {abonnement.paye ? 'ACTIF' : 'IMPAYÉ'}
          </span>
        </div>
      </section>

      {/* ─── HISTORIQUE ─── */}
      {historique.length > 0 && (
        <section className="bg-white rounded-[20px] shadow-card border border-slate-100 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#002366] text-xl">history</span>
              <h2 className="text-sm font-bold text-[#0b1c30]">Historique des paiements</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {historique.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#8dafff]/20 flex items-center justify-center text-[#375ca6]">
                    <span className="material-symbols-outlined text-lg">
                      {p.type === 'scolarite' ? 'school' : p.type === 'frais' ? 'receipt_long' : 'card_membership'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0b1c30] capitalize">{p.type}</p>
                    <p className="text-[10px] text-slate-400">{p.date} — {p.methode}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-600">
                  +{p.montant.toLocaleString('fr-FR')} F
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── INFO ─── */}
      <section className="bg-[#eff4ff] rounded-[20px] p-4 border border-dashed border-[#8dafff] flex items-start gap-3">
        <span className="material-symbols-outlined text-[#002366] text-xl shrink-0 mt-0.5">info</span>
        <div>
          <p className="text-xs font-bold text-[#00113a]">Besoin d'aide ?</p>
          <p className="text-[11px] text-[#757682] mt-0.5">Contactez l'administration pour toute question sur vos paiements.</p>
        </div>
      </section>
    </div>
  );
};
