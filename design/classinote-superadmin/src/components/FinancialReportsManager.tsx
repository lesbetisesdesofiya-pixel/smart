import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  XCircle,
  X,
  Plus,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────

interface School {
  id: number;
  nom: string;
}

interface SchoolDetail {
  school_id: number;
  nom: string;
  statut: string;
  total_eleves: number;
  active_eleves: number;
  blocked_eleves: number;
  total_mois_dus: number;
  total_mois_actifs: number;
  mois_neutralises: number;
  revenu_theorique: number;
  revenu_du_reel: number;
  montant_verse: number;
  reste_a_payer: number;
}

interface Payment {
  id: number;
  school_id: number;
  school_nom: string;
  montant: number;
  date_paiement: string;
  periode_debut: string | null;
  periode_fin: string | null;
  mois_couverts: string[];
  mois_couverts_label: string;
  methode_paiement: string;
  reference: string | null;
  commentaire: string | null;
  annule: boolean;
  created_by_name: string | null;
  created_at: string;
}

interface MonthlyRevenue {
  mois: string;
  label: string;
  revenu_theorique: number;
  revenu_du_reel: number;
  montant_verse: number;
}

interface PaymentsByMonth {
  mois: string;
  label: string;
  total: number;
}

interface EvolutionEleves {
  mois: string;
  label: string;
  actifs: number;
  bloques: number;
}

interface ReportData {
  rate_per_month: number;
  period: { start: string; end: string };
  summary: {
    total_eleves: number;
    active_eleves: number;
    blocked_eleves: number;
    total_mois_dus: number;
    total_mois_actifs: number;
    mois_neutralises: number;
    revenu_theorique: number;
    revenu_du_reel: number;
    montant_verse: number;
    reste_a_percevoir: number;
  };
  schools: SchoolDetail[];
  payments: Payment[];
  monthly_revenue: MonthlyRevenue[];
  revenue_by_school: { school_id: number; nom: string; revenu_theorique: number; revenu_du_reel: number; montant_verse: number; reste_a_payer: number }[];
  payments_by_month: PaymentsByMonth[];
  evolution_eleves: EvolutionEleves[];
}

const PAYMENT_METHODS = [
  { value: "virement", label: "Virement bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "free_money", label: "Free Money" },
  { value: "carte_bancaire", label: "Carte bancaire" },
];

const MONTHS_FR = [
  { key: "01", label: "Janvier" },
  { key: "02", label: "Février" },
  { key: "03", label: "Mars" },
  { key: "04", label: "Avril" },
  { key: "05", label: "Mai" },
  { key: "06", label: "Juin" },
  { key: "07", label: "Juillet" },
  { key: "08", label: "Août" },
  { key: "09", label: "Septembre" },
  { key: "10", label: "Octobre" },
  { key: "11", label: "Novembre" },
  { key: "12", label: "Décembre" },
];

function formatFCFA(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function formatShortFCFA(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

// ─── Component ──────────────────────────────────────────────

export const FinancialReportsManager: React.FC = () => {
  // Filters
  const [schools, setSchools] = useState<School[]>([]);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterMode, setFilterMode] = useState<"month" | "custom">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    school_id: "",
    montant: "",
    date_paiement: new Date().toISOString().split("T")[0],
    mois_couverts: [] as string[],
    methode_paiement: "virement",
    reference: "",
    commentaire: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cancel confirmation
  const [cancelId, setCancelId] = useState<number | null>(null);

  // Chart tab
  const [chartTab, setChartTab] = useState<"revenue" | "payments" | "eleves" | "comparison">("revenue");

  // Fetch schools list
  useEffect(() => {
    apiFetch("/superadmin/schools").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setSchools(d);
    }).catch(() => {});
  }, []);

  // Fetch report
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSchool) params.set("school_id", filterSchool);

      if (filterMode === "custom" && startDate && endDate) {
        params.set("start_date", startDate);
        params.set("end_date", endDate);
      } else {
        params.set("month", filterMonth);
        params.set("year", filterYear);
      }

      const res = await apiFetch(`/superadmin/financial-reports?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {}
    setLoading(false);
  }, [filterSchool, filterMonth, filterYear, filterMode, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Submit payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.school_id || !paymentForm.montant || paymentForm.mois_couverts.length === 0) {
      setPaymentError("Veuillez remplir tous les champs obligatoires et sélectionner au moins un mois.");
      return;
    }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const res = await apiFetch("/superadmin/financial-reports/payments", {
        method: "POST",
        body: JSON.stringify({
          school_id: Number(paymentForm.school_id),
          montant: parseFloat(paymentForm.montant),
          date_paiement: paymentForm.date_paiement,
          mois_couverts: paymentForm.mois_couverts,
          methode_paiement: paymentForm.methode_paiement,
          reference: paymentForm.reference || null,
          commentaire: paymentForm.commentaire || null,
        }),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentForm({
          school_id: "",
          montant: "",
          date_paiement: new Date().toISOString().split("T")[0],
          mois_couverts: [],
          methode_paiement: "virement",
          reference: "",
          commentaire: "",
        });
        fetchReport();
      } else {
        const d = await res.json();
        setPaymentError(d.message || "Erreur lors de l'enregistrement.");
      }
    } catch {
      setPaymentError("Erreur réseau.");
    }
    setPaymentLoading(false);
  };

  // Cancel payment
  const handleCancelPayment = async (id: number) => {
    try {
      const res = await apiFetch(`/superadmin/financial-reports/payments/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setCancelId(null);
        fetchReport();
      }
    } catch {}
  };

  // Export
  const handleExport = async (format: "pdf" | "excel") => {
    const params = new URLSearchParams();
    if (filterSchool) params.set("school_id", filterSchool);
    if (filterMode === "custom" && startDate && endDate) {
      params.set("start_date", startDate);
      params.set("end_date", endDate);
    } else {
      params.set("month", filterMonth);
      params.set("year", filterYear);
    }
            const url = `/api/v1/superadmin/financial-reports/export/${format}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Export error:", res.status, errText);
        alert(`Erreur lors de l'export (${res.status}). Vérifiez la console.`);
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = format === "pdf" ? "rapport-financier.pdf" : "rapport-financier.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Erreur réseau lors de l'export.");
    }
  };

  // Toggle month in payment form
  const toggleMonth = (mk: string) => {
    setPaymentForm((prev) => ({
      ...prev,
      mois_couverts: prev.mois_couverts.includes(mk)
        ? prev.mois_couverts.filter((m) => m !== mk)
        : [...prev.mois_couverts, mk].sort(),
    }));
  };

  // Generate month options for current school year (Sep → Jul)
  const getMonthOptions = () => {
    const yearNum = parseInt(filterYear);
    const options: { key: string; label: string }[] = [];
    // Sep to Dec of previous year
    for (let m = 9; m <= 12; m++) {
      options.push({ key: `${yearNum - 1}-${String(m).padStart(2, "0")}`, label: `${MONTHS_FR[m - 1].label} ${yearNum - 1}` });
    }
    // Jan to Jul of current year
    for (let m = 1; m <= 7; m++) {
      options.push({ key: `${yearNum}-${String(m).padStart(2, "0")}`, label: `${MONTHS_FR[m - 1].label} ${yearNum}` });
    }
    return options;
  };

  // ─── Render ──────────────────────────────────────────────

  const summary = data?.summary;
  const chartColors = {
    theorique: "#94a3b8",
    du: "#f59e0b",
    verse: "#10b981",
    reste: "#ef4444",
    actifs: "#10b981",
    bloques: "#ef4444",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-600 text-white shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports Financiers</h1>
            <p className="text-sm text-slate-500">Suivi des abonnements, revenus et paiements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un paiement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">École</label>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
            >
              <option value="">Toutes les écoles</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Mode de période</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as "month" | "custom")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
            >
              <option value="month">Mois / Année</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>
          {filterMode === "month" ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Mois</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                >
                  {MONTHS_FR.map((m, i) => (
                    <option key={i} value={i + 1}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Année</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Date début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          {data?.period && (
            <span className="text-xs text-slate-400 ml-2">
              Période : {data.period.start} → {data.period.end}
            </span>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Chargement du rapport...</p>
        </div>
      ) : data ? (
        <>
          {/* ─── Summary Cards ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total élèves" value={String(summary!.total_eleves)} color="slate" />
            <StatCard icon={<UserCheck className="w-5 h-5" />} label="Élèves actifs" value={String(summary!.active_eleves)} color="emerald" />
            <StatCard icon={<UserX className="w-5 h-5" />} label="Élèves bloqués" value={String(summary!.blocked_eleves)} color="red" />
            <StatCard icon={<Calendar className="w-5 h-5" />} label="Mois dus" value={summary!.total_mois_dus.toFixed(1)} color="blue" />
            <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Mois actifs" value={summary!.total_mois_actifs.toFixed(1)} color="emerald" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Mois neutralisés" value={summary!.mois_neutralises.toFixed(1)} color="amber" />
          </div>

          {/* ─── Revenue Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Revenu théorique" value={formatFCFA(summary!.revenu_theorique)} color="slate" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenu dû réel" value={formatFCFA(summary!.revenu_du_reel)} color="amber" />
            <StatCard icon={<CreditCard className="w-5 h-5" />} label="Encaissé" value={formatFCFA(summary!.montant_verse)} color="emerald" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Reste à percevoir" value={formatFCFA(summary!.reste_a_percevoir)} color="red" />
          </div>

          {/* ─── Charts ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {([
                { id: "revenue", label: "Évolution CA" },
                { id: "payments", label: "Paiements reçus" },
                { id: "eleves", label: "Élèves actifs/bloqués" },
                { id: "comparison", label: "Comparaison revenus" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    chartTab === tab.id
                      ? "text-amber-700 border-b-2 border-amber-600 bg-amber-50/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {chartTab === "revenue" && data.monthly_revenue.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={data.monthly_revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShortFCFA} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenu_theorique" name="Théorique" stroke={chartColors.theorique} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="revenu_du_reel" name="Dû réel" stroke={chartColors.du} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="montant_verse" name="Encaissé" stroke={chartColors.verse} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {chartTab === "payments" && data.payments_by_month.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.payments_by_month}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShortFCFA} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} />
                    <Bar dataKey="total" name="Paiements reçus" fill={chartColors.verse} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {chartTab === "eleves" && data.evolution_eleves.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.evolution_eleves}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actifs" name="Actifs" fill={chartColors.actifs} stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="bloques" name="Bloqués" fill={chartColors.bloques} stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {chartTab === "comparison" && data.monthly_revenue.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.monthly_revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShortFCFA} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} />
                    <Legend />
                    <Bar dataKey="revenu_theorique" name="Théorique" fill={chartColors.theorique} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenu_du_reel" name="Dû réel" fill={chartColors.du} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="montant_verse" name="Encaissé" fill={chartColors.verse} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {((chartTab === "revenue" && data.monthly_revenue.length === 0) ||
                (chartTab === "payments" && data.payments_by_month.length === 0) ||
                (chartTab === "eleves" && data.evolution_eleves.length === 0) ||
                (chartTab === "comparison" && data.monthly_revenue.length === 0)) && (
                <div className="p-8 text-center text-sm text-slate-400">Aucune donnée pour ce graphique.</div>
              )}
            </div>
          </div>

          {/* ─── Schools Detail Table ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Détail par école</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">École</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Élèves</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Actifs</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Bloqués</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Mois fact.</th>
                    <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Revenu théorique</th>
                    <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Revenu dû</th>
                    <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Versé</th>
                    <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Reste</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schools.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-400">Aucune école.</td></tr>
                  ) : (
                    data.schools.map((s) => (
                      <tr key={s.school_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{s.nom}</td>
                        <td className="px-3 py-3 text-center text-xs">{s.total_eleves}</td>
                        <td className="px-3 py-3 text-center text-xs text-emerald-600 font-semibold">{s.active_eleves}</td>
                        <td className="px-3 py-3 text-center text-xs text-red-600 font-semibold">{s.blocked_eleves}</td>
                        <td className="px-3 py-3 text-center text-xs">{s.total_mois_actifs.toFixed(1)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatFCFA(s.revenu_theorique)}</td>
                        <td className="px-3 py-3 text-right text-xs font-semibold">{formatFCFA(s.revenu_du_reel)}</td>
                        <td className="px-3 py-3 text-right text-xs text-emerald-600">{formatFCFA(s.montant_verse)}</td>
                        <td className={`px-3 py-3 text-right text-xs font-bold ${s.reste_a_payer > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {formatFCFA(s.reste_a_payer)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            s.statut === "Actif" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {s.statut}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Payments History ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Historique des paiements</h2>
              <span className="text-xs text-slate-400">{data.payments.length} paiement(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">École</th>
                    <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Montant</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Date</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Mois couverts</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Moyen</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Référence</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Enregistré par</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Statut</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">Aucun paiement enregistré.</td></tr>
                  ) : (
                    data.payments.map((p) => (
                      <tr key={p.id} className={`border-b border-slate-50 transition-colors ${p.annule ? "opacity-60 bg-red-50/30" : "hover:bg-slate-50/50"}`}>
                        <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{p.school_nom}</td>
                        <td className="px-3 py-3 text-right text-xs font-semibold">{formatFCFA(p.montant)}</td>
                        <td className="px-3 py-3 text-center text-xs text-slate-500">{p.date_paiement}</td>
                        <td className="px-3 py-3 text-xs text-slate-600 max-w-[200px]">{p.mois_couverts_label}</td>
                        <td className="px-3 py-3 text-xs text-slate-600">
                          {PAYMENT_METHODS.find((m) => m.value === p.methode_paiement)?.label || p.methode_paiement}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 font-mono">{p.reference || "—"}</td>
                        <td className="px-3 py-3 text-xs text-slate-600">{p.created_by_name || "—"}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            p.annule ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {p.annule ? "Annulé" : "Actif"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {!p.annule && (
                            cancelId === p.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleCancelPayment(p.id)}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setCancelId(null)}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCancelId(p.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Annuler ce paiement"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* ─── Add Payment Modal ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Ajouter un paiement</h2>
              <button onClick={() => { setShowPaymentModal(false); setPaymentError(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">École *</label>
                <select
                  value={paymentForm.school_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, school_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                  required
                >
                  <option value="">Sélectionner une école</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={paymentForm.montant}
                    onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                    placeholder="500 000"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Date du paiement *</label>
                  <input
                    type="date"
                    value={paymentForm.date_paiement}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date_paiement: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Mois couverts *</label>
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {getMonthOptions().map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        paymentForm.mois_couverts.includes(opt.key)
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={paymentForm.mois_couverts.includes(opt.key)}
                        onChange={() => toggleMonth(opt.key)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        paymentForm.mois_couverts.includes(opt.key)
                          ? "bg-amber-600 border-amber-600"
                          : "border-slate-300"
                      }`}>
                        {paymentForm.mois_couverts.includes(opt.key) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {paymentForm.mois_couverts.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1.5 font-medium">
                    {paymentForm.mois_couverts.length} mois sélectionné(s)
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Moyen de paiement *</label>
                <select
                  value={paymentForm.methode_paiement}
                  onChange={(e) => setPaymentForm({ ...paymentForm, methode_paiement: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Référence</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="VIR-2026-00125"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Commentaire</label>
                <textarea
                  value={paymentForm.commentaire}
                  onChange={(e) => setPaymentForm({ ...paymentForm, commentaire: e.target.value })}
                  placeholder="Note optionnelle..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 resize-none"
                />
              </div>

              {paymentError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-200">
                  {paymentError}
                </p>
              )}

              <button
                type="submit"
                disabled={paymentLoading || !paymentForm.school_id || !paymentForm.montant || paymentForm.mois_couverts.length === 0}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer transition-colors"
              >
                {paymentLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Enregistrer le paiement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ──────────────────────────────────────────────

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
  slate: { bg: "bg-slate-50", icon: "text-slate-500", text: "text-slate-900" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-800" },
  red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-800" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-700" },
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`${c.bg} rounded-xl border border-slate-200/60 p-3.5`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={c.icon}>{icon}</div>
        <span className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</span>
      </div>
      <p className={`text-lg font-black ${c.text} tracking-tight`}>{value}</p>
    </div>
  );
}
