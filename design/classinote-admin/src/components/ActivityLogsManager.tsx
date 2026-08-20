import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import { ScrollText, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface ActivityLog {
  id: number;
  school_id: number | null;
  user_type: string;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  created_at: string;
}

interface PaginatedLogs {
  data: ActivityLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const ActivityLogsManager: React.FC = () => {
  const [logs, setLogs] = useState<PaginatedLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "50");
      if (search) params.set("search", search);
      if (filterRole) params.set("user_role", filterRole);
      if (filterAction) params.set("action", filterAction);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await apiFetch(`/superadmin/activity-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
    }
    setLoading(false);
  }, [page, search, filterRole, filterAction, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const actionColors: Record<string, string> = {
    created: "bg-emerald-100 text-emerald-700",
    updated: "bg-blue-100 text-blue-700",
    deleted: "bg-red-100 text-red-700",
    login: "bg-amber-100 text-amber-700",
    logout: "bg-slate-100 text-slate-600",
    pin_setup: "bg-purple-100 text-purple-700",
    pin_login: "bg-indigo-100 text-indigo-700",
  };

  const roleColors: Record<string, string> = {
    superadmin: "bg-amber-100 text-amber-700 border-amber-200",
    admin: "bg-blue-100 text-blue-700 border-blue-200",
    prof: "bg-emerald-100 text-emerald-700 border-emerald-200",
    parent: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-lg">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Journal d'activités</h1>
            <p className="text-sm text-slate-500">Toutes les actions sur la plateforme</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, action, description..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            Chercher
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
              showFilters ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Rôle</label>
              <select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              >
                <option value="">Tous</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="prof">Professeur</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Action</label>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              >
                <option value="">Toutes</option>
                <option value="created">Création</option>
                <option value="updated">Modification</option>
                <option value="deleted">Suppression</option>
                <option value="login">Connexion</option>
                <option value="logout">Déconnexion</option>
                <option value="pin_setup">Config PIN</option>
                <option value="pin_login">Connexion PIN</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Chargement...</p>
          </div>
        ) : !logs || logs.data.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Aucune activité enregistrée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Rôle</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.data.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 text-xs">{log.user_name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleColors[log.user_role] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {log.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${actionColors[log.action] || "bg-slate-100 text-slate-500"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[300px] truncate">
                        {log.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {log.ip_address || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400">
                  Page {logs.current_page} / {logs.last_page} — {logs.total} entrées
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, logs.last_page) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, logs.last_page - 4));
                    const p = start + i;
                    if (p > logs.last_page) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(logs.last_page, page + 1))}
                    disabled={page >= logs.last_page}
                    className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
