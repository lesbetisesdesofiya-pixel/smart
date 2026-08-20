import React, { useState } from "react";
import { Tag, Plus, Trash2, Edit2, X, Check, School, Loader2 } from "lucide-react";
import { FeeItem, SchoolClass } from "../types";
import { apiFetch } from "../api";

interface FeeItemsManagerProps {
  feeItems: FeeItem[];
  setFeeItems: React.Dispatch<React.SetStateAction<FeeItem[]>>;
  classes: SchoolClass[];
}

export const FeeItemsManager: React.FC<FeeItemsManagerProps> = ({
  feeItems,
  setFeeItems,
  classes
}) => {
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    type: "annexe" as "inscription" | "annexe",
    amountFCFA: 10000,
    isMandatory: true,
    targetAllClasses: true,
    selectedClassIds: [] as string[]
  });

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amountFCFA <= 0 || isSavingFee) return;
    setIsSavingFee(true);
    setFeeError(null);

    if (editingFee) {
      setFeeItems(
        feeItems.map((f) =>
          f.id === editingFee.id
            ? {
                ...f,
                title: formData.title,
                amountFCFA: Number(formData.amountFCFA),
                isMandatory: formData.isMandatory,
                targetClassIds: formData.targetAllClasses ? ["all"] : formData.selectedClassIds,
                targetClassNames: formData.targetAllClasses
                  ? ["Toutes les classes"]
                  : classes.filter((c) => formData.selectedClassIds.includes(c.id)).map((c) => c.name)
              }
            : f
        )
      );
      setEditingFee(null);
    } else {
      try {
        const res = await apiFetch('/school-admin/frais', {
          method: 'POST',
          body: JSON.stringify({
            libelle: formData.title,
            type: formData.type,
            montant: Number(formData.amountFCFA),
            classes: formData.targetAllClasses ? null : formData.selectedClassIds,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Erreur lors de la création du frais.');
        }
        const saved = data.frais;
        const newFee: FeeItem = {
          id: String(saved.id),
          title: saved.libelle,
          amountFCFA: Number(saved.montant),
          isMandatory: formData.isMandatory,
          targetClassIds: formData.targetAllClasses ? ["all"] : formData.selectedClassIds,
          targetClassNames: formData.targetAllClasses
            ? ["Toutes les classes"]
            : classes.filter((c) => formData.selectedClassIds.includes(c.id)).map((c) => c.name)
        };
        setFeeItems([...feeItems, newFee]);
      } catch (err: any) {
        setFeeError(err.message || 'Erreur réseau.');
        return;
      }
    }

    setIsAddingFee(false);
    setIsSavingFee(false);
    setFormData({
      title: "",
      amountFCFA: 10000,
      isMandatory: true,
      targetAllClasses: true,
      selectedClassIds: []
    });
  };

  const handleStartEdit = (fee: FeeItem) => {
    setEditingFee(fee);
    const isAll = fee.targetClassIds.includes("all");
    setFormData({
      title: fee.title,
      amountFCFA: fee.amountFCFA,
      isMandatory: fee.isMandatory,
      targetAllClasses: isAll,
      selectedClassIds: isAll ? [] : fee.targetClassIds
    });
    setIsAddingFee(true);
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce frais scolaire ?")) return;
    try {
      await apiFetch(`/school-admin/frais/${id}`, { method: 'DELETE' });
    } catch {
      // Proceed with local removal even if API fails
    }
    setFeeItems(feeItems.filter((f) => f.id !== id));
  };

  const toggleClassSelection = (classId: string) => {
    if (formData.selectedClassIds.includes(classId)) {
      setFormData({
        ...formData,
        selectedClassIds: formData.selectedClassIds.filter((id) => id !== classId)
      });
    } else {
      setFormData({
        ...formData,
        selectedClassIds: [...formData.selectedClassIds, classId]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            <span>Gestion des Frais & Tarifs Scolaires ({feeItems.length})</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Définir les frais annexes (tenues, fournitures, examen, cantine) avec leur caractère obligatoire ou facultatif
          </p>
        </div>

        <button
          id="btn-add-fee-item"
          onClick={() => {
            setEditingFee(null);
            setFormData({
              title: "",
              amountFCFA: 10000,
              isMandatory: true,
              targetAllClasses: true,
              selectedClassIds: []
            });
            setIsAddingFee(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Frais</span>
        </button>
      </div>

      {/* Grid of Fee Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {feeItems.map((fee) => (
          <div
            key={fee.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      fee.isMandatory
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {fee.isMandatory ? "• Obligatoire" : "• Facultatif"}
                  </span>
                  <span className="inline-block ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Inscription
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2">{fee.title}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(fee)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFee(fee.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount Display */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Montant fixe</span>
                <span className="text-lg font-black text-blue-700">
                  {fee.amountFCFA.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              {/* Targeted Classes */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold block text-[11px]">Classes concernées :</span>
                <div className="flex flex-wrap gap-1">
                  {fee.targetClassNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Fee Modal */}
      {isAddingFee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingFee ? "Modifier le Frais Scolaire" : "Nouveau Frais Scolaire"}
              </h3>
              <button
                onClick={() => setIsAddingFee(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFee} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Type de Frais</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "inscription" })}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all ${
                      formData.type === "inscription"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Inscription
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "annexe" })}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all ${
                      formData.type === "annexe"
                        ? "bg-blue-50 border-blue-300 text-blue-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Annexe
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {formData.type === "inscription" 
                    ? "Le paiement sera automatiquement créé à l'ajout d'un élève dans cette classe"
                    : "Frais standard (tenues, fournitures, etc.)"
                  }
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre du Frais</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Tenue scolaire, Rame de papier, Cantine"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  min={100}
                  step={1}
                  required
                  value={formData.amountFCFA}
                  onChange={(e) => setFormData({ ...formData, amountFCFA: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Caractère du Frais</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isMandatory: true })}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all ${
                      formData.isMandatory
                        ? "bg-rose-50 border-rose-300 text-rose-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    • Obligatoire
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isMandatory: false })}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all ${
                      !formData.isMandatory
                        ? "bg-amber-50 border-amber-300 text-amber-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    • Facultatif
                  </button>
                </div>
              </div>

              {/* Classes Concernées */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Classes Concernées</label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.targetAllClasses}
                    onChange={(e) => setFormData({ ...formData, targetAllClasses: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Toutes les classes de l'établissement</span>
                </label>

                {!formData.targetAllClasses && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-36 overflow-y-auto">
                    <span className="text-[11px] text-slate-500 font-bold block">
                      Sélectionnez les classes spécifiques :
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {classes.map((c) => {
                        const isChecked = formData.selectedClassIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleClassSelection(c.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-bold border transition-all flex items-center justify-between ${
                              isChecked
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{c.name}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFee(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingFee}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSavingFee && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingFee ? "Modifier le Frais" : "Enregistrer le Frais"}</span>
                </button>
              </div>
              {feeError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">{feeError}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
