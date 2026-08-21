import React, { useState } from "react";
import {
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Table,
} from "lucide-react";

interface ImportPreviewProps {
  data: Record<string, any[]>;
  schoolId: number;
  schoolName: string;
  onImported: (result: any) => void;
  onClose: () => void;
}

const ENTITY_CONFIG: Record<string, { label: string; fields: string[]; colors: string }> = {
  sections: { label: "Sections", fields: ["libelle"], colors: "bg-purple-50 text-purple-700 border-purple-200" },
  classes: { label: "Classes", fields: ["section", "libelle", "ecolage"], colors: "bg-blue-50 text-blue-700 border-blue-200" },
  matieres: { label: "Matières", fields: ["libelle", "categorie"], colors: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  profs: { label: "Professeurs", fields: ["nom", "prenom", "email", "telephone"], colors: "bg-amber-50 text-amber-700 border-amber-200" },
  eleves: { label: "Élèves", fields: ["nom", "prenom", "classe", "date_naissance", "matricule", "parent_telephone"], colors: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  affectations: { label: "Affectations", fields: ["prof", "matiere", "classe", "coefficient"], colors: "bg-rose-50 text-rose-700 border-rose-200" },
  periodes: { label: "Périodes", fields: ["libelle", "type", "numero"], colors: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  emploi_du_temps: { label: "Emploi du Temps", fields: ["jour", "heure_debut", "heure_fin", "classe", "matiere", "prof"], colors: "bg-orange-50 text-orange-700 border-orange-200" },
  evaluations: { label: "Évaluations", fields: ["titre", "type", "classe", "matiere", "periode", "date", "coefficient", "note_sur"], colors: "bg-teal-50 text-teal-700 border-teal-200" },
  notes: { label: "Notes", fields: ["eleve_nom", "eleve_prenom", "evaluation_titre", "note", "appreciation"], colors: "bg-violet-50 text-violet-700 border-violet-200" },
  frais: { label: "Frais", fields: ["libelle", "description", "montant", "classes"], colors: "bg-lime-50 text-lime-700 border-lime-200" },
};

const FIELD_LABELS: Record<string, string> = {
  libelle: "Libellé",
  section: "Section",
  categorie: "Catégorie",
  nom: "Nom",
  prenom: "Prénom",
  email: "Email",
  telephone: "Téléphone",
  classe: "Classe",
  date_naissance: "Date naiss.",
  matricule: "Matricule",
  parent_telephone: "Tél. parent",
  prof: "Professeur",
  matiere: "Matière",
  jour: "Jour",
  heure_debut: "Début",
  heure_fin: "Fin",
  type: "Type",
  numero: "N°",
  titre: "Titre",
  date: "Date",
  coefficient: "Coeff.",
  ecolage: "Écolage (FCFA)",
  note_sur: "Note /",
  note: "Note",
  appreciation: "Appréciation",
  eleve_nom: "Nom élève",
  eleve_prenom: "Prénom élève",
  evaluation_titre: "Évaluation",
  description: "Description",
  montant: "Montant",
  classes: "Classes",
};

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  data,
  schoolId,
  schoolName,
  onImported,
  onClose,
}) => {
  const [importData, setImportData] = useState<Record<string, any[]>>(data);
  const [activeTab, setActiveTab] = useState(Object.keys(data)[0] || "");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = Object.keys(importData).filter((k) => ENTITY_CONFIG[k] && importData[k]?.length > 0);

  const updateCell = (entity: string, rowIndex: number, field: string, value: string) => {
    setImportData((prev) => {
      const updated = { ...prev };
      const rows = [...(updated[entity] || [])];
      rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      updated[entity] = rows;
      return updated;
    });
  };

  const addRow = (entity: string) => {
    setImportData((prev) => {
      const updated = { ...prev };
      const config = ENTITY_CONFIG[entity];
      const newRow: any = {};
      config.fields.forEach((f) => (newRow[f] = ""));
      updated[entity] = [...(updated[entity] || []), newRow];
      return updated;
    });
  };

  const removeRow = (entity: string, rowIndex: number) => {
    setImportData((prev) => {
      const updated = { ...prev };
      const rows = [...(updated[entity] || [])];
      rows.splice(rowIndex, 1);
      updated[entity] = rows;
      return updated;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/superadmin/schools/${schoolId}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ data: importData }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json);
      } else {
        setError(json.message || "Erreur lors de l'import");
      }
    } catch {
      setError("Erreur réseau");
    }
    setImporting(false);
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Import Réussi</h2>
          <p className="text-sm text-slate-500 mb-4">Données importées pour {schoolName}</p>

          {result.report && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {Object.entries(result.report).map(([key, val]) => {
                const count = typeof val === 'object' && val !== null ? ((val as any).created || 0) : (val as number);
                return (
                  <span key={key} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {ENTITY_CONFIG[key]?.label || key}: {count}
                  </span>
                );
              })}
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
              <p className="text-xs font-bold text-amber-700 mb-1">Erreurs:</p>
              {result.errors.map((err: string, i: number) => (
                <p key={i} className="text-[11px] text-amber-600">• {err}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => onImported(result)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Aperçu des Données</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              École: <span className="font-semibold">{schoolName}</span> — Modifiez les données avant d'importer
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-1 overflow-x-auto shrink-0">
          {tabs.map((key) => {
            const config = ENTITY_CONFIG[key];
            const count = importData[key]?.length || 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === key
                    ? `${config.colors} border border-b-0`
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {config.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab && ENTITY_CONFIG[activeTab] && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">
                  {ENTITY_CONFIG[activeTab].label}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {importData[activeTab]?.length || 0} ligne(s)
                  </span>
                </h3>
                <button
                  onClick={() => addRow(activeTab)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Ajouter une ligne
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500 w-10">#</th>
                      {ENTITY_CONFIG[activeTab].fields.map((field) => (
                        <th key={field} className="px-3 py-2.5 text-left font-bold text-slate-500 min-w-[120px]">
                          {FIELD_LABELS[field] || field}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(importData[activeTab] || []).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 text-[10px] text-slate-400 font-mono">{rowIndex + 1}</td>
                        {ENTITY_CONFIG[activeTab].fields.map((field) => (
                          <td key={field} className="px-1 py-1">
                            <input
                              type="text"
                              value={row[field] ?? ""}
                              onChange={(e) => updateCell(activeTab, rowIndex, field, e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border border-transparent rounded-lg focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200 transition-colors"
                              placeholder={field}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeRow(activeTab, rowIndex)}
                            className="p-1 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(importData[activeTab] || []).length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Table className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Aucune donnée pour cette entité</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirmer l'import ({tabs.reduce((sum, t) => sum + (importData[t]?.length || 0), 0)} lignes)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
