import React, { useState, useEffect } from "react";
import { BookOpen, Save, FileText, Download, Search, Loader2, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { apiFetch } from "../api";

interface Affectation {
  id: string;
  prof: string;
  matiere: string;
  classe: string;
  classe_id: string;
  matiere_id: string;
  prof_id: string;
  has_notes: boolean;
}

interface StudentNote {
  eleve_id: string;
  nom_complet: string;
  notes: {
    i1: { evaluation_id: string; note_id: string | null; note: number | null };
    i2: { evaluation_id: string; note_id: string | null; note: number | null };
    ds: { evaluation_id: string; note_id: string | null; note: number | null };
    com: { evaluation_id: string; note_id: string | null; note: number | null };
  };
}

interface BulletinStatus {
  eleve_id: string;
  nom_complet: string;
  bulletin_generated: boolean;
  bulletin_downloaded: boolean;
}

export const BulletinManager: React.FC = () => {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Saisie state
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedAff, setSelectedAff] = useState<Affectation | null>(null);
  const [selectedPeriode, setSelectedPeriode] = useState<string>("");
  const [students, setStudents] = useState<StudentNote[]>([]);
  const [loadingSaisie, setLoadingSaisie] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Bulletin state
  const [bulletinClasse, setBulletinClasse] = useState<string>("");
  const [bulletinPeriode, setBulletinPeriode] = useState<string>("");
  const [bulletinStatus, setBulletinStatus] = useState<BulletinStatus[]>([]);
  const [allNoted, setAllNoted] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAff, resClasses, resPeriodes] = await Promise.all([
        apiFetch("/school-admin/bulletins/affectations"),
        apiFetch("/school-admin/classes"),
        apiFetch("/school-admin/periodes"),
      ]);

      if (resAff.ok) {
        const data = await resAff.json();
        setAffectations(data.affectations || []);
      }
      if (resClasses.ok) {
        const data = await resClasses.json();
        setClasses(data.classes || []);
      }
      if (resPeriodes.ok) {
        const data = await resPeriodes.json();
        setPeriodes(Array.isArray(data) ? data : data.periodes || []);
      }
    } catch {}
    setLoading(false);
  };

  const loadSaisie = async (aff: Affectation, periodeId: string) => {
    setLoadingSaisie(true);
    try {
      const res = await apiFetch(
        `/school-admin/bulletins/saisie?classe_id=${aff.classe_id}&matiere_id=${aff.matiere_id}&periode_id=${periodeId}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {}
    setLoadingSaisie(false);
  };

  const handleSelectAffectation = (aff: Affectation) => {
    setSelectedAff(aff);
    if (selectedPeriode) {
      loadSaisie(aff, selectedPeriode);
    }
  };

  const handleSelectClasse = (classeId: string) => {
    setSelectedClasse(classeId);
    setSelectedAff(null);
    setStudents([]);
  };

  const filteredAffectations = selectedClasse
    ? affectations.filter((a) => String(a.classe_id) === selectedClasse)
    : [];

  const handleSelectPeriode = (periodeId: string) => {
    setSelectedPeriode(periodeId);
    if (selectedAff) {
      loadSaisie(selectedAff, periodeId);
    }
  };

  const handleNoteChange = (eleveId: string, type: string, value: string) => {
    const numVal = value === "" ? null : Number(value);
    if (numVal !== null && (numVal < 0 || numVal > 20)) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.eleve_id === eleveId
          ? { ...s, notes: { ...s.notes, [type]: { ...s.notes[type as keyof typeof s.notes], note: numVal } } }
          : s
      )
    );
  };

  const handleSaveNotes = async () => {
    if (!selectedAff || !selectedPeriode || students.length === 0) return;
    setSaving(true);
    setSaveMsg(null);

    const notes = students.map((s) => ({
      eleve_id: s.eleve_id,
      i1: s.notes.i1.note,
      i2: s.notes.i2.note,
      ds: s.notes.ds.note,
      com: s.notes.com.note,
    }));

    try {
      const res = await apiFetch("/school-admin/bulletins/saisie", {
        method: "POST",
        body: JSON.stringify({
          notes,
          i1_evaluation_id: students[0]?.notes.i1.evaluation_id,
          i2_evaluation_id: students[0]?.notes.i2.evaluation_id,
          ds_evaluation_id: students[0]?.notes.ds.evaluation_id,
          com_evaluation_id: students[0]?.notes.com.evaluation_id,
        }),
      });

      if (res.ok) {
        setSaveMsg("Notes enregistrées avec succès !");
        setTimeout(() => setSaveMsg(null), 3000);
        loadData();
      } else {
        setSaveMsg("Erreur lors de l'enregistrement.");
      }
    } catch {
      setSaveMsg("Erreur réseau.");
    }
    setSaving(false);
  };

  const loadBulletinsClasse = async () => {
    if (!bulletinClasse || !bulletinPeriode) return;
    try {
      const res = await apiFetch(
        `/school-admin/bulletins/classe?classe_id=${bulletinClasse}&periode_id=${bulletinPeriode}`
      );
      if (res.ok) {
        const data = await res.json();
        setBulletinStatus(data.students || []);
        setAllNoted(data.all_noted || false);
      }
    } catch {}
  };

  const handleGenerateAll = async () => {
    if (!bulletinClasse || !bulletinPeriode) return;
    setGenerating(true);
    try {
      const res = await apiFetch("/school-admin/bulletins/generate-classe", {
        method: "POST",
        body: JSON.stringify({ classe_id: bulletinClasse, periode_id: bulletinPeriode }),
      });
      if (res.ok) {
        loadBulletinsClasse();
      }
    } catch {}
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>Gestion des Bulletins</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Saisie des notes (I1, I2, DS, COM) et génération des bulletins
        </p>
      </div>

      {/* Saisie Notes Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-black">1</span>
          Saisie des Notes
        </h3>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Classe</label>
            <select
              value={selectedClasse}
              onChange={(e) => handleSelectClasse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Choisir une classe</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.libelle || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Période</label>
            <select
              value={selectedPeriode}
              onChange={(e) => handleSelectPeriode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Choisir une période</option>
              {periodes.map((p: any) => (
                <option key={p.id} value={p.id}>{p.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Affectation (Prof - Matière)</label>
            <select
              value={selectedAff?.id || ""}
              onChange={(e) => {
                const aff = filteredAffectations.find((a) => a.id === e.target.value);
                if (aff) handleSelectAffectation(aff);
              }}
              disabled={!selectedClasse}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm disabled:opacity-50"
            >
              <option value="">{selectedClasse ? "Choisir une affectation" : "Sélectionnez d'abord une classe"}</option>
              {filteredAffectations.map((aff) => (
                <option key={aff.id} value={aff.id}>
                  {aff.prof} • {aff.matiere}
                  {aff.has_notes ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        {selectedAff && selectedPeriode && (
          <>
            {loadingSaisie ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Élève</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-blue-700 w-24">I1</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-blue-700 w-24">I2</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-purple-700 w-24">DS</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-rose-700 w-24">COM</th>
                        <th className="text-center py-2 px-3 text-xs font-bold text-slate-600 w-28">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const validNotes = [s.notes.i1.note, s.notes.i2.note, s.notes.ds.note, s.notes.com.note].filter(
                          (n) => n !== null
                        ) as number[];
                        const avg = validNotes.length > 0 ? (validNotes.reduce((a, b) => a + b, 0) / validNotes.length).toFixed(1) : "—";

                        return (
                          <tr key={s.eleve_id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{s.nom_complet}</td>
                            {(["i1", "i2", "ds", "com"] as const).map((type) => (
                              <td key={type} className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  value={s.notes[type].note ?? ""}
                                  onChange={(e) => handleNoteChange(s.eleve_id, type, e.target.value)}
                                  placeholder="—"
                                  className="w-16 px-2 py-1 text-center border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                            <td className="py-2 px-3 text-center font-black text-slate-900">{avg}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  {saveMsg && (
                    <span className={`text-xs font-bold ${saveMsg.includes("succès") ? "text-emerald-600" : "text-rose-600"}`}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer les notes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Aucun élève dans cette classe.</p>
            )}
          </>
        )}
      </div>

      {/* Bulletin Generation Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-black">2</span>
          Génération des Bulletins
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Classe</label>
            <select
              value={bulletinClasse}
              onChange={(e) => setBulletinClasse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Choisir une classe</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.libelle || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Période</label>
            <select
              value={bulletinPeriode}
              onChange={(e) => setBulletinPeriode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Choisir une période</option>
              {periodes.map((p: any) => (
                <option key={p.id} value={p.id}>{p.libelle}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={loadBulletinsClasse}
              disabled={!bulletinClasse || !bulletinPeriode}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              Vérifier
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={!bulletinClasse || !bulletinPeriode || !allNoted || generating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Générer tous
            </button>
          </div>
        </div>

        {!allNoted && bulletinStatus.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold">
            <AlertCircle className="w-4 h-4" />
            Toutes les affectations doivent avoir des notes avant de pouvoir générer les bulletins.
          </div>
        )}

        {bulletinStatus.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Élève</th>
                  <th className="text-center py-2 px-3 text-xs font-bold text-slate-600">Bulletin</th>
                  <th className="text-center py-2 px-3 text-xs font-bold text-slate-600">Téléchargé</th>
                </tr>
              </thead>
              <tbody>
                {bulletinStatus.map((s) => (
                  <tr key={s.eleve_id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-900">{s.nom_complet}</td>
                    <td className="py-2 px-3 text-center">
                      {s.bulletin_generated ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {s.bulletin_downloaded ? (
                        <CheckCircle className="w-4 h-4 text-blue-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
