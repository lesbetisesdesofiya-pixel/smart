import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

export const PaiementsScreenV2: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/parent/frais');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.frais) && json.frais.length > 0) {
          setData(json.frais[0]);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!data) {
    return <div className="px-5 py-12 text-center text-gray-400 text-sm">Aucune information de paiement.</div>;
  }

  const scolarite = {
    reste: Number(data.scolarite?.reste) || 0,
    montant: Number(data.scolarite?.montant) || 0,
    paye: Number(data.scolarite?.paye) || 0,
  };
  const frais = {
    total: Number(data.frais?.total) || 0,
    paye: Number(data.frais?.paye) || 0,
    reste: Number(data.frais?.reste) || 0,
    items: Array.isArray(data.frais?.items) ? data.frais.items : [],
  };
  const abonnement = { paye: !!data.abonnement?.paye };
  const historique = Array.isArray(data.historique) ? data.historique : [];

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-5">
      <div className="pt-2">
        <h1 className="text-lg font-bold text-[#00113a]">Paiements</h1>
        <p className="text-xs text-gray-400">{data.eleve_nom} — {data.classe}</p>
      </div>

      {/* Hero balance */}
      <div className="bg-gradient-to-br from-[#002366] to-[#1a3a7a] text-white rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-[#375ca6]/20 rounded-full" />
        <div className="relative z-10">
          <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Reste a payer</p>
          <h2 className="text-3xl font-extrabold mt-1">{scolarite.reste.toLocaleString('fr-FR')} FCFA</h2>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div>
              <p className="text-blue-200/60">Montant</p>
              <p className="font-bold">{scolarite.montant.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <p className="text-blue-200/60">Deja paye</p>
              <p className="font-bold text-emerald-300">{scolarite.paye.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Frais annexes */}
      {Array.isArray(frais.items) && frais.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#002366] text-lg">receipt_long</span>
              <p className="text-sm font-bold text-[#00113a]">Frais Scolaires</p>
            </div>
            <div className="flex gap-2">
              {frais.paye > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{frais.paye.toLocaleString('fr-FR')} F paye</span>}
              {frais.reste > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{frais.reste.toLocaleString('fr-FR')} F reste</span>}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {frais.items.map((item: any) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.paye ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    <span className="material-symbols-outlined text-base">{item.paye ? 'check_circle' : 'pending'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.libelle}</p>
                    {item.description && <p className="text-[10px] text-gray-400">{item.description}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{item.montant.toLocaleString('fr-FR')} F</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.paye ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {item.paye ? 'PAYE' : 'A PAYER'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abonnement */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${abonnement.paye ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            <span className="material-symbols-outlined text-xl">{abonnement.paye ? 'check_circle' : 'cancel'}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Abonnement ClassiNote</p>
            <p className="text-[11px] text-gray-400">{abonnement.paye ? 'Actif — Acces debloque' : 'Inactif — Acces verrouille'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${abonnement.paye ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {abonnement.paye ? 'ACTIF' : 'IMPAYE'}
        </span>
      </div>

      {/* Historique */}
      {Array.isArray(historique) && historique.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Historique</p>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {historique.map((p: any) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#002366]/10 flex items-center justify-center text-[#002366]">
                    <span className="material-symbols-outlined text-sm">
                      {p.type === 'scolarite' ? 'school' : p.type === 'frais' ? 'receipt_long' : 'card_membership'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 capitalize">{p.type}</p>
                    <p className="text-[10px] text-gray-400">{p.date} — {p.methode}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">+{p.montant.toLocaleString('fr-FR')} F</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-[#002366]/5 rounded-2xl p-4 border border-[#002366]/10 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#002366] text-lg mt-0.5">info</span>
        <div>
          <p className="text-xs font-bold text-[#00113a]">Besoin d'aide ?</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Contactez l'administration pour toute question.</p>
        </div>
      </div>
    </div>
  );
};
