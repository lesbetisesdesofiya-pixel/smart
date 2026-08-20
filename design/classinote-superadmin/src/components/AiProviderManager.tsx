import React, { useState, useEffect, useCallback } from "react";
import { Brain, Save, RotateCcw, Plus, Trash2, Power, PowerOff, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { apiFetch } from "../api";
import { AiProvider as AiProviderType, AiSetting as AiSettingType } from "../types";

export const AiProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<AiProviderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{[key: string]: string}>({});
  const [newModel, setNewModel] = useState<{[key: string]: string}>({});
  const [newScope, setNewScope] = useState<{[key: string]: "global" | "ecole"}>({});
  const [newEcoleId, setNewEcoleId] = useState<{[key: string]: string}>({});
  const [saveStatus, setSaveStatus] = useState<{[key: string]: string}>({});

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/superadmin/ai-providers");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProviders(data.providers);
        }
      }
    } catch (err) {
      setError("Impossible de charger les providers IA.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggle = async (id: string) => {
    try {
      const res = await apiFetch(`/superadmin/ai-providers/${id}/toggle`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchProviders();
      }
    } catch (err) {
      setError("Erreur lors du basculement du provider.");
    }
  };

  const handleSaveKey = async (providerId: string) => {
    const apiKey = newKey[providerId];
    if (!apiKey) return;

    const scope = newScope[providerId] || "global";
    const ecoleIdVal = scope === "ecole" ? newEcoleId[providerId] : undefined;
    const model = newModel[providerId] || "";

    try {
      setSaveStatus((prev) => ({ ...prev, [providerId]: "saving" }));
      const res = await apiFetch(`/superadmin/ai-providers/${providerId}/keys`, {
        method: "POST",
        body: JSON.stringify({
          api_key: apiKey,
          scope_type: scope,
          scope_id: scope === "ecole" ? parseInt(ecoleIdVal) : undefined,
          model: model || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus((prev) => ({ ...prev, [providerId]: "saved" }));
        setNewKey((prev) => ({ ...prev, [providerId]: "" }));
        setNewModel((prev) => ({ ...prev, [providerId]: "" }));
        setNewScope((prev) => ({ ...prev, [providerId]: "global" }));
        setNewEcoleId((prev) => ({ ...prev, [providerId]: "" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [providerId]: "" }));
          fetchProviders();
        }, 1500);
      } else {
        setError(data.message || "Erreur lors de la sauvegarde de la clé.");
      }
    } catch (err) {
      setError("Erreur réseau lors de la sauvegarde.");
    }
  };

  const handleDeleteKey = async (providerId: string, settingId: string) => {
    try {
      const res = await apiFetch(`/superadmin/ai-providers/${providerId}/keys/${settingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchProviders();
      }
    } catch (err) {
      setError("Erreur lors de la suppression de la clé.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestion des Providers IA</h2>
          <p className="text-xs text-slate-500">Activez les fournisseurs, configurez les clés API globales ou par école</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs">&times;</button>
        </div>
      )}

      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${provider.is_active ? 'bg-emerald-400 ring-2 ring-emerald-100' : 'bg-slate-300'}`} />
                <span className="font-semibold text-slate-800">{provider.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">{provider.code}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(provider.id); }}
                  className={`p-2 rounded-lg transition-colors ${provider.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                  title={provider.is_active ? "Désactiver" : "Activer"}
                >
                  {provider.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                {expandedProvider === provider.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {expandedProvider === provider.id && (
              <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <span className="text-slate-400">Base URL</span>
                    <p className="font-mono text-slate-700 mt-0.5 truncate">{provider.base_url}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <span className="text-slate-400">Modèle par défaut</span>
                    <p className="font-mono text-slate-700 mt-0.5">{provider.default_model || '—'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Ajouter une clé API
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Portée</label>
                      <select
                        value={newScope[provider.id] || "global"}
                        onChange={(e) => setNewScope((prev) => ({ ...prev, [provider.id]: e.target.value as "global" | "ecole" }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="global">Globale</option>
                        <option value="ecole">Par école</option>
                      </select>
                    </div>
                    {(newScope[provider.id] || "global") === "ecole" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">ID École</label>
                        <input
                          type="number"
                          value={newEcoleId[provider.id] || ""}
                          onChange={(e) => setNewEcoleId((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder="Ex: 1"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Modèle (optionnel)</label>
                      <input
                        type="text"
                        value={newModel[provider.id] || ""}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                        placeholder="Ex: openai/gpt-4o"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newKey[provider.id] || ""}
                      onChange={(e) => setNewKey((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder="Sk-... ou votre clé API"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => handleSaveKey(provider.id)}
                      disabled={!newKey[provider.id] || saveStatus[provider.id] === "saving"}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {saveStatus[provider.id] === "saving" ? (
                        <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>) : (
                        <><Save className="w-3.5 h-3.5" /> Sauvegarder</>
                      )}
                    </button>
                  </div>
                </div>

                {provider.settings && provider.settings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Clés configurées</h4>
                    <div className="space-y-2">
                      {provider.settings.map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100 text-xs">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${setting.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                            <span className="font-mono text-slate-600">{setting.api_key_preview}</span>
                            {setting.scope_type && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                {setting.scope_type === 'global' ? 'Globale' : `École #${setting.scope_id}`}
                              </span>
                            )}
                            {setting.model && (
                              <span className="font-mono text-slate-400">{setting.model}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteKey(provider.id, setting.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {providers.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aucun provider IA configuré. Ajoutez des providers dans la base de données.
          </div>
        )}
      </div>
    </div>
  );
};
