import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { ProgressRing } from '@/shared/components/ui/ProgressRing';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useChildrenStore } from '@/shared/stores/stores';
import { formatMoney } from '@/shared/utils/format';

export const PaymentsPage: React.FC = () => {
  const { activeChildId } = useChildrenStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-payments', activeChildId],
    queryFn: async () => {
      const res = await apiFetch('/parent/paiements');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const payments = Array.isArray(data) ? data : [];
  const totalPaye = payments.filter((p: any) => p.statut === 'paye').reduce((s: number, p: any) => s + (p.montant || 0), 0);
  const totalDu = payments.reduce((s: number, p: any) => s + (p.montant || 0), 0);
  const pct = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      {/* Hero solde */}
      <Card variant="hero" className="p-6" delay={0}>
        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-5">
          <ProgressRing value={pct} size={72} stroke={6} color="#34d399" bgColor="rgba(255,255,255,0.15)">
            <span className="text-sm font-extrabold text-white">{pct}%</span>
          </ProgressRing>
          <div>
            <p className="text-sm text-blue-200/80">Solde payé</p>
            <p className="text-2xl font-extrabold">{formatMoney(totalPaye)} <span className="text-sm text-blue-200/60">FCFA</span></p>
            <p className="text-xs text-blue-200/50 mt-0.5">Reste : {formatMoney(Math.max(0, totalDu - totalPaye))} FCFA</p>
          </div>
        </div>
      </Card>

      {/* Liste */}
      {payments.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-8 h-8" />} title="Aucun paiement" />
      ) : (
        <div className="space-y-2.5">
          {payments.map((p: any, i: number) => {
            const isPaye = p.statut === 'paye';
            return (
              <Card key={p.id || i} className="p-4" delay={0.05 + i * 0.03}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPaye ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}>
                    {isPaye ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.libelle || 'Frais'}</p>
                    <p className="text-xs text-gray-400">{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-gray-900">{formatMoney(p.montant || 0)}</p>
                    <Badge color={isPaye ? 'emerald' : 'amber'}>{isPaye ? 'Payé' : 'En attente'}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
