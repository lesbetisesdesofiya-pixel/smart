import React, { useEffect, useState } from "react";
import { Link2, Loader2, Save, Copy, Check } from "lucide-react";
import { getSettings, updateZernioPublicUrl } from "../api";

interface SettingsData {
  zernio_public_url?: string;
  fallback_public_url?: string;
  magic_link_base?: string;
}

export const PublicUrlSection: React.FC = () => {
  const [url, setUrl] = useState("");
  const [fallback, setFallback] = useState("");
  const [magicLinkBase, setMagicLinkBase] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = (await getSettings()) as { success: boolean; data?: SettingsData };
      if (data.success && data.data) {
        setUrl(data.data.zernio_public_url || "");
        setFallback(data.data.fallback_public_url || "");
        setMagicLinkBase(data.data.magic_link_base || "");
      }
    } catch (e) {
      setMessage({ ok: false, text: "Impossible de charger les paramètres." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!url.trim()) {
      setMessage({ ok: false, text: "L'URL ne peut pas être vide." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const data = (await updateZernioPublicUrl(url.trim())) as {
        success: boolean;
        errors?: Record<string, string[]>;
        data?: { magic_link_base?: string };
      };
      if (data.success) {
        setMagicLinkBase(data.data?.magic_link_base || "");
        setMessage({ ok: true, text: "URL enregistrée avec succès." });
      } else {
        const err = data.errors?.url?.[0] || "URL invalide.";
        setMessage({ ok: false, text: err });
      }
    } catch (e) {
      setMessage({ ok: false, text: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(magicLinkBase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Link2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900">Lien de l'application (liens magiques)</h3>
          <p className="text-xs text-slate-500">
            URL publique utilisée pour les boutons « Nouveautés » et « Tableau de bord » envoyés sur WhatsApp.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement...
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                URL publique de base
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-domaine.example"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Valeur par défaut (si non renseignée) : {fallback || "—"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
              {message && (
                <span className={`text-xs font-medium ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
                  {message.text}
                </span>
              )}
            </div>

            {magicLinkBase && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Aperçu du lien envoyé
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-slate-700 break-all bg-white border border-slate-200 rounded px-2 py-1.5">
                    {magicLinkBase}/app/parent/#/magic/…
                  </code>
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copié" : "Copier"}
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
