import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import {
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  RefreshCcw,
  Download,
  Loader2,
  AlertCircle,
  Check,
  CalendarDays,
  X,
} from "lucide-react";

const SCHOOL_MONTHS = [
  "septembre",
  "octobre",
  "novembre",
  "decembre",
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
] as const;

const MONTH_LABELS: Record<string, string> = {
  septembre: "Sept",
  octobre: "Oct",
  novembre: "Nov",
  decembre: "Déc",
  janvier: "Jan",
  fevrier: "Fév",
  mars: "Mars",
  avril: "Avr",
  mai: "Mai",
  juin: "Juin",
};

interface Student {
  id: number;
  eleve_id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  classe: string;
  classe_id: number;
  niveau: string;
  niveau_label: string;
  numero_parent: string;
  statut_abonnement: string;
  statut_abonnement_label: string;
  montant_mensuel: number;
  mois_payes: string[];
  mois_payes_count: number;
  mois_restants_count: number;
  total_paye: number;
  total_restant: number;
  cles_mois_regles: string[];
  acces_parent_verrouille: boolean;
  message_verrouillage: string | null;
}

interface Classe {
  id: number;
  libelle: string;
  niveau: string;
  niveau_label: string;
}

interface Stats {
  total: number;
  a_jour: number;
  en_attente: number;
  expire: number;
  locked: number;
}

interface PaymentModalStudent {
  student: Student;
}

interface LockModalStudent {
  student: Student;
  action: "lock" | "unlock";
}

const formatMontant = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " F";

export const SubscriptionManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    a_jour: 0,
    en_attente: 0,
    expire: 0,
    locked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  // Payment modal
  const [paymentModal, setPaymentModal] = useState<PaymentModalStudent | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Lock modal
  const [lockModal, setLockModal] = useState<LockModalStudent | null>(null);
  const [lockMessage, setLockMessage] = useState("");

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/school-admin/subscriptions");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setClasses(data.classes || []);
        setStats(
          data.stats || { total: 0, a_jour: 0, en_attente: 0, expire: 0, locked: 0 }
        );
      } else {
        setError("Erreur lors du chargement des données.");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Filtered students
  const filtered = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.nom_complet.toLowerCase().includes(q) &&
        !s.nom.toLowerCase().includes(q) &&
        !s.prenom.toLowerCase().includes(q)
      )
        return false;
    }
    if (filterClasse && String(s.classe_id) !== filterClasse) return false;
    if (filterNiveau && s.niveau !== filterNiveau) return false;
    if (filterStatut && s.statut_abonnement !== filterStatut) return false;
    return true;
  });

  // Unique niveaux
  const niveaux = Array.from(
    new Map(classes.map((c) => [c.niveau, c.niveau_label])).entries()
  );

  // Stats cards
  const statCards: { label: string; value: number; color: string; icon: React.ReactNode }[] = [
    {
      label: "Total élèves",
      value: stats.total,
      color: "bg-blue-600",
      icon: <ShieldCheck size={20} />,
    },
    {
      label: "À jour",
      value: stats.a_jour,
      color: "bg-green-600",
      icon: <Check size={20} />,
    },
    {
      label: "En attente",
      value: stats.en_attente,
      color: "bg-yellow-500",
      icon: <AlertCircle size={20} />,
    },
    {
      label: "Bloqués",
      value: stats.locked,
      color: "bg-red-600",
      icon: <Lock size={20} />,
    },
  ];

  // Payment modal
  const openPaymentModal = (student: Student) => {
    setPaymentModal({ student });
    setSelectedMonths([]);
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const submitPayment = async () => {
    if (!paymentModal || selectedMonths.length === 0) return;
    setSubmitting(true);
    try {
      const montant = selectedMonths.length * 1000;
      const res = await apiFetch(
        `/school-admin/subscriptions/pay-by-eleve/${paymentModal.student.eleve_id}`,
        {
          method: "POST",
          body: JSON.stringify({
            months: selectedMonths,
            montant,
            methode_paiement: "especes",
            type: "abonnement",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors du paiement.");
      }
      setPaymentModal(null);
      setSelectedMonths([]);
      setSuccessMsg("Paiement enregistré avec succès.");
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Lock modal
  const openLockModal = (student: Student) => {
    const action = student.acces_parent_verrouille ? "unlock" : "lock";
    setLockModal({ student, action });
    setLockMessage("");
  };

  const submitLock = async () => {
    if (!lockModal) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(
        `/school-admin/subscriptions/${lockModal.student.id}/toggle-lock`,
        {
          method: "POST",
          body: JSON.stringify({ message: lockMessage || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors du verrouillage.");
      }
      setLockModal(null);
      setSuccessMsg(
        lockModal.action === "lock"
          ? "Accès parent verrouillé."
          : "Accès parent déverrouillé."
      );
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors du verrouillage.");
    } finally {
      setSubmitting(false);
    }
  };

  // PDF download
  const downloadPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (filterClasse) params.set("classe_id", filterClasse);
      if (filterNiveau) params.set("niveau", filterNiveau);
      if (filterStatut) params.set("statut", filterStatut);
      const qs = params.toString();
      const url = `/school-admin/subscriptions/pdf${qs ? "?" + qs : ""}`;
      const res = await apiFetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "abonnements.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Erreur lors du téléchargement du PDF.");
    }
  };

  const statutBadge = (s: Student) => {
    const map: Record<string, string> = {
      a_jour: "bg-green-100 text-green-800",
      en_attente: "bg-yellow-100 text-yellow-800",
      expire: "bg-red-100 text-red-800",
    };
    const cls = map[s.statut_abonnement] || "bg-gray-100 text-gray-700";
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
      >
        {s.statut_abonnement_label}
      </span>
    );
  };

  // Render month pills for a student row
  const renderMonthPills = (s: Student) => {
    return (
      <div className="flex flex-wrap gap-1">
        {SCHOOL_MONTHS.map((m) => {
          const paid = s.mois_payes.includes(m);
          return (
            <span
              key={m}
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight ${
                paid
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {MONTH_LABELS[m]}
            </span>
          );
        })}
      </div>
    );
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Abonnements ClassiNote
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            1 000 F/mois · Septembre à Juin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={16} /> Actualiser
          </button>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un élève…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
        <select
          value={filterNiveau}
          onChange={(e) => setFilterNiveau(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Tous les niveaux</option>
          {niveaux.map(([val, lbl]) => (
            <option key={val} value={val}>
              {lbl}
            </option>
          ))}
        </select>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="a_jour">À jour</option>
          <option value="en_attente">En attente</option>
          <option value="expire">Expiré</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Élève</th>
              <th className="px-4 py-3 font-semibold">Classe</th>
              <th className="px-4 py-3 font-semibold">Mois payés</th>
              <th className="px-4 py-3 font-semibold text-center">
                Mois restants
              </th>
              <th className="px-4 py-3 font-semibold text-right">
                Montant payé
              </th>
              <th className="px-4 py-3 font-semibold text-right">Restant</th>
              <th className="px-4 py-3 font-semibold text-center">Statut</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  Aucun élève trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {s.nom_complet}
                    </div>
                    {s.acces_parent_verrouille && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-0.5">
                        <Lock size={12} /> Verrouillé
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.classe}
                    <span className="block text-xs text-gray-400">
                      {s.niveau_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {s.mois_payes_count}/10
                      </span>
                      {renderMonthPills(s)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        s.mois_restants_count > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {s.mois_restants_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">
                    {formatMontant(s.total_paye)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        s.total_restant > 0
                          ? "text-red-600 font-semibold"
                          : "text-gray-500"
                      }
                    >
                      {formatMontant(s.total_restant)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{statutBadge(s)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {s.mois_restants_count > 0 && (
                        <button
                          title="Enregistrer un paiement"
                          onClick={() => openPaymentModal(s)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          <CreditCard size={18} />
                        </button>
                      )}
                      <button
                        title={
                          s.acces_parent_verrouille
                            ? "Déverrouiller"
                            : "Verrouiller"
                        }
                        onClick={() => openLockModal(s)}
                        className={`p-1.5 rounded-lg ${
                          s.acces_parent_verrouille
                            ? "text-green-600 hover:bg-green-50"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {s.acces_parent_verrouille ? (
                          <Unlock size={18} />
                        ) : (
                          <Lock size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Payment Modal ─────────────────────────────── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Paiement abonnement
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {paymentModal.student.nom_complet} ·{" "}
                  {paymentModal.student.classe}
                </p>
              </div>
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setSelectedMonths([]);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current status */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                Payés :{" "}
                <span className="font-semibold text-green-700">
                  {paymentModal.student.mois_payes_count}
                </span>
              </span>
              <span className="text-gray-500">
                Restants :{" "}
                <span className="font-semibold text-orange-600">
                  {paymentModal.student.mois_restants_count}
                </span>
              </span>
              <span className="text-gray-500">
                Restant à payer :{" "}
                <span className="font-semibold text-red-600">
                  {formatMontant(paymentModal.student.total_restant)}
                </span>
              </span>
            </div>

            {/* Month selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDays size={14} className="inline mr-1" />
                Sélectionner les mois à payer
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SCHOOL_MONTHS.map((month) => {
                  const isPaid =
                    paymentModal.student.mois_payes.includes(month);
                  const isSelected = selectedMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={isPaid}
                      onClick={() => toggleMonth(month)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        isPaid
                          ? "bg-green-50 border-green-200 text-green-600 cursor-not-allowed"
                          : isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {MONTH_LABELS[month]}
                      {isPaid && (
                        <Check size={10} className="inline ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mois sélectionnés</span>
                <span className="font-medium text-gray-900">
                  {selectedMonths.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prix unitaire</span>
                <span className="font-medium text-gray-900">1 000 F</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1 mt-1">
                <span className="text-gray-800">Total à payer</span>
                <span className="text-blue-700">
                  {formatMontant(selectedMonths.length * 1000)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setSelectedMonths([]);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={submitPayment}
                disabled={submitting || selectedMonths.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                Valider ({formatMontant(selectedMonths.length * 1000)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lock Modal ────────────────────────────────── */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {lockModal.action === "lock"
                  ? "Verrouiller l'accès parent"
                  : "Déverrouiller l'accès parent"}
              </h2>
              <button
                onClick={() => setLockModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {lockModal.action === "lock"
                ? `L'accès du parent de ${lockModal.student.nom_complet} sera verrouillé. Le parent ne pourra plus consulter les informations.`
                : `L'accès du parent de ${lockModal.student.nom_complet} sera rétabli.`}
            </p>
            {lockModal.student.message_verrouillage &&
              lockModal.action === "unlock" && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                  Message actuel : {lockModal.student.message_verrouillage}
                </div>
              )}
            {lockModal.action === "lock" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={lockMessage}
                  onChange={(e) => setLockMessage(e.target.value)}
                  placeholder="Motif du verrouillage…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setLockModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={submitLock}
                disabled={submitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  lockModal.action === "lock"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : lockModal.action === "lock" ? (
                  <Lock size={16} />
                ) : (
                  <Unlock size={16} />
                )}
                {lockModal.action === "lock" ? "Verrouiller" : "Déverrouiller"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
