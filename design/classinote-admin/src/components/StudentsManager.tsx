import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  Phone,
  X,
  CreditCard,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Download,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Copy,
  KeyRound
} from "lucide-react";
import { Student, SchoolClass, FeeItem, PaymentRecord } from "../types";
import { StudentDrawer } from "./StudentDrawer";
import { StudentPaymentModal } from "./StudentPaymentModal";
import { apiFetch } from "../api";

interface StudentsManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: SchoolClass[];
  feeItems: FeeItem[];
  onGenerateReportCard: (student: Student) => void;
  onRecordTuitionPayment: (
    studentId: string,
    amountFCFA: number,
    method: PaymentRecord["method"],
    provider?: PaymentRecord["provider"]
  ) => void;
  onRecordFeePayment: (
    studentId: string,
    feeItem: FeeItem,
    method: PaymentRecord["method"],
    provider?: PaymentRecord["provider"]
  ) => void;
  onRecordSubscriptionPayment: (
    studentId: string,
    selectedMonths: string[],
    totalFCFA: number,
    method: PaymentRecord["method"],
    provider?: PaymentRecord["provider"]
  ) => void;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  students,
  setStudents,
  classes,
  feeItems,
  onGenerateReportCard,
  onRecordTuitionPayment,
  onRecordFeePayment,
  onRecordSubscriptionPayment
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedAbonnementMonth, setSelectedAbonnementMonth] = useState("all");
  const [minRemaining, setMinRemaining] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [activeDrawerStudent, setActiveDrawerStudent] = useState<Student | null>(null);
  const [paymentModalStudent, setPaymentModalStudent] = useState<Student | null>(null);
  const [lockModalStudent, setLockModalStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", classId: "", parentPhone: "" });
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [bulkLockModal, setBulkLockModal] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLockMessage, setBulkLockMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    classId: classes[0]?.id || "C1",
    parentPhone: "",
    parentEmail: "",
    parentAddress: "",
    tuitionPaid: 250000,
    tuitionTotal: 250000
  });

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        `${s.firstName} ${s.lastName} ${s.matricule} ${s.parentPhone}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === "all" || s.classId === selectedClass;

      const sub = (s as any).subscription;
      const dette = (s as any).dette;

      let matchesPayment = true;
      if (selectedPayment === "scolarite") {
        matchesPayment = dette && dette.scolarite > 0;
      } else if (selectedPayment === "abonnement") {
        if (selectedAbonnementMonth !== "all") {
          matchesPayment = sub && sub.mois_payes && !sub.mois_payes.includes(selectedAbonnementMonth);
        } else {
          matchesPayment = dette && dette.abonnement > 0;
        }
      } else if (selectedPayment.startsWith("frais_")) {
        const feeId = Number(selectedPayment.replace("frais_", ""));
        matchesPayment = sub ? !(sub.frais_payes_ids || []).includes(feeId) : true;
      }

      let matchesMinRemaining = true;
      if (minRemaining) {
        const min = parseFloat(minRemaining);
        const totalReste = (dette?.scolarite || 0) + (dette?.frais || 0);
        matchesMinRemaining = totalReste >= min;
      }

      return matchesSearch && matchesClass && matchesPayment && matchesMinRemaining;
    });
  }, [students, searchTerm, selectedClass, selectedPayment, selectedAbonnementMonth, minRemaining]);

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkLock = async (lock: boolean) => {
    if (selectedIds.size === 0) return;
    setIsTogglingLock(true);
    try {
      const numericIds = Array.from(selectedIds).map(id => parseInt(id.replace(/^S/, ''), 10));
      const res = await apiFetch('/school-admin/eleves/bulk-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_ids: numericIds,
          lock,
          message: bulkLockMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev: any[]) => prev.map(s =>
          selectedIds.has(s.id)
            ? { ...s, access_locked: lock }
            : s
        ));
        setSelectedIds(new Set());
        setBulkLockModal(false);
        setBulkLockMessage("");
        alert(data.message);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err: any) {
      alert("Erreur: " + (err.message || "Erreur réseau"));
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleToggleLock = async (student: Student) => {
    const isLocked = (student as any).access_locked;
    const action = isLocked ? "déverrouiller" : "verrouiller";
    if (!confirm(`Voulez-vous ${action} l'accès pour ${student.firstName} ${student.lastName} ?`)) return;

    setIsTogglingLock(true);
    try {
      const numericId = parseInt(student.id.replace(/^S/, ''), 10);
      const res = await apiFetch('/school-admin/eleves/bulk-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_ids: [numericId],
          lock: !isLocked,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev: any[]) => prev.map(s =>
          s.id === student.id ? { ...s, access_locked: !isLocked } : s
        ));
        alert(data.message);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (error) {
      alert(`Erreur lors du ${action}`);
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await apiFetch('/school-admin/eleves/export/csv');
      const data = await res.json();
      if (!data.success) return alert("Erreur export");

      const headers = Object.keys(data.data[0] || {});
      const csvContent = [
        headers.join(';'),
        ...data.data.map((row: any) => headers.map(h => `"${row[h] ?? ''}"`).join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eleves_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent || !deletePin || deletePin.length !== 6) return;
    setDeleteError("");
    try {
      const res = await apiFetch(`/school-admin/eleves/${deleteConfirmStudent.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: deletePin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.message || "PIN incorrect ou erreur.");
        return;
      }
      setStudents(students.filter((s) => s.id !== deleteConfirmStudent.id));
      setDeleteConfirmStudent(null);
      setDeletePin("");
    } catch {
      setDeleteError("Erreur réseau.");
    }
  };

  const openEditModal = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      classId: student.classId,
      parentPhone: student.parentPhone,
    });
  };

  const handleSaveEdit = async () => {
    if (!editStudent) return;
    try {
      const classIdNumeric = editForm.classId.replace(/^C/, '');
      const res = await apiFetch(`/school-admin/eleves/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editForm.lastName,
          prenom: editForm.firstName,
          classe_id: classIdNumeric,
          parent_telephone: editForm.parentPhone,
        }),
      });
      if (res.ok) {
        setStudents(students.map((s) =>
          s.id === editStudent.id
            ? { ...s, firstName: editForm.firstName, lastName: editForm.lastName, classId: editForm.classId, parentPhone: editForm.parentPhone }
            : s
        ));
        setEditStudent(null);
      }
    } catch {}
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || isSavingStudent) return;
    setIsSavingStudent(true);

    const targetClass = classes.find((c) => c.id === formData.classId);
    const classIdNumeric = formData.classId.replace(/^C/, '');

    try {
      const res = await apiFetch('/school-admin/eleves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricule: `EL-${Date.now()}`,
          nom: formData.lastName,
          prenom: formData.firstName,
          classe_id: classIdNumeric,
          parent_telephone: formData.parentPhone || '+225 00 00 00 00',
          date_naissance: '2011-06-15',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const saved = data;
      const newStudent: Student = {
        id: `S${saved.id}`,
        matricule: saved.matricule,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: "2011-06-15",
        level: targetClass?.level || "college",
        classId: formData.classId,
        className: targetClass?.name || "6ème A",
        parentPhone: formData.parentPhone || "+225 07 00 00 00 00",
        parentEmail: "",
        parentAddress: "",
        paymentStatus: "a_jour",
        tuitionPaid: 0,
        tuitionTotal: 0,
        attendanceRate: 98,
        status: "actif",
        registrationDate: new Date().toISOString().split('T')[0]
      };

      setStudents([newStudent, ...students]);
    } catch (err: any) {
      alert(`Erreur : ${err.message || "Erreur réseau."}`);
    }

    setIsAddingStudent(false);
    setIsSavingStudent(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Gestion des Élèves ({students.length})</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Répertoire des élèves, blocage, filtres et export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrire</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedPayment}
              onChange={(e) => { setSelectedPayment(e.target.value); setSelectedFeeId("all"); setSelectedAbonnementMonth("all"); }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">Tous paiements</option>
              <option value="scolarite">Scolarité</option>
              <option value="abonnement">Abonnement</option>
              <optgroup label="Frais">
                {feeItems.map((f) => (
                  <option key={f.id} value={`frais_${f.id}`}>{f.title} — {Number(f.amountFCFA).toLocaleString("fr-FR")} F</option>
                ))}
              </optgroup>
            </select>

            {selectedPayment === "abonnement" && (
              <select
                value={selectedAbonnementMonth}
                onChange={(e) => setSelectedAbonnementMonth(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">Tous mois impayés</option>
                <option value="septembre">Septembre</option>
                <option value="octobre">Octobre</option>
                <option value="novembre">Novembre</option>
                <option value="décembre">Décembre</option>
                <option value="janvier">Janvier</option>
                <option value="février">Février</option>
                <option value="mars">Mars</option>
                <option value="avril">Avril</option>
                <option value="mai">Mai</option>
                <option value="juin">Juin</option>
              </select>
            )}

            <div className="relative">
              <input
                type="number"
                placeholder="Montant min. restant"
                value={minRemaining}
                onChange={(e) => setMinRemaining(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>


          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-blue-800">
            {selectedIds.size} élève(s) sélectionné(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkLockModal(true); }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Bloquer
            </button>
            <button
              onClick={() => handleBulkLock(false)}
              disabled={isTogglingLock}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTogglingLock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
              Débloquer
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <button onClick={toggleSelectAll} className="cursor-pointer">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                  </button>
                </th>
                <th className="px-5 py-3.5">Élève</th>
                <th className="px-5 py-3.5">Classe</th>
                <th className="px-5 py-3.5">Parent</th>
                <th className="px-5 py-3.5">Restant</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map((s) => {
                const dette = (s as any).dette;
                const remaining = (dette?.scolarite || 0) + (dette?.frais || 0);
                const isLocked = (s as any).access_locked;
                return (
                  <tr key={s.id} className={`transition-colors ${isLocked ? 'bg-rose-50/50' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleSelect(s.id)} className="cursor-pointer">
                        {selectedIds.has(s.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4 text-slate-300" />
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                          isLocked ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-slate-400">{s.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                        {s.className}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {s.parentPhone}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {remaining === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          Soldé
                        </span>
                      ) : (
                        <span className="font-black text-rose-600 text-xs bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                          {remaining.toLocaleString("fr-FR")} F
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {isLocked ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> Bloqué
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Unlock className="w-3 h-3" /> Libre
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPaymentModalStudent(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Payer"
                        >
                          <CreditCard className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setActiveDrawerStudent(s)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Voir fiche"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(s)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLocked
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={isLocked ? "Débloquer" : "Bloquer"}
                        >
                          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmStudent(s); setDeletePin(""); setDeleteError(""); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            Aucun élève trouvé avec les filtres actuels.
          </div>
        )}
      </div>

      {/* Bulk Lock Modal */}
      {bulkLockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 mb-1">
                  Bloquer {selectedIds.size} élève(s)
                </h3>
                <p className="text-xs text-slate-600">
                  Les parents ne pourront plus voir les informations de ces élèves.
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Message (optionnel)</label>
              <input
                type="text"
                value={bulkLockMessage}
                onChange={(e) => setBulkLockMessage(e.target.value)}
                placeholder="Accès verrouillé par l'administration"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setBulkLockModal(false); setBulkLockMessage(""); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => handleBulkLock(true)}
                disabled={isTogglingLock}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isTogglingLock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Bloquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Lock Modal */}
      {lockModalStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${(lockModalStudent as any).access_locked ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {(lockModalStudent as any).access_locked ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 mb-1">
                  {(lockModalStudent as any).access_locked ? "Débloquer" : "Bloquer"} l'accès
                </h3>
                <p className="text-xs text-slate-600">
                  {(lockModalStudent as any).access_locked
                    ? <>Restaurer l'accès pour <strong>{lockModalStudent.firstName} {lockModalStudent.lastName}</strong> ?</>
                    : <>Bloquer l'accès pour <strong>{lockModalStudent.firstName} {lockModalStudent.lastName}</strong> ?</>
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setLockModalStudent(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Annuler</button>
              <button
                onClick={() => { handleToggleLock(lockModalStudent); setLockModalStudent(null); }}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer ${
                  (lockModalStudent as any).access_locked ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {(lockModalStudent as any).access_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{(lockModalStudent as any).access_locked ? "Débloquer" : "Bloquer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Inscrire un Élève</h3>
              <button onClick={() => setIsAddingStudent(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom</label>
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Classe</label>
                <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone Parent</label>
                <input type="text" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} placeholder="+225 07 00 00 00 00" className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingStudent(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer">
                  <Plus className="w-4 h-4" /> Inscrire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentDrawer student={activeDrawerStudent} onClose={() => setActiveDrawerStudent(null)} onOpenPaymentModal={(student) => setPaymentModalStudent(student)} />
      {paymentModalStudent && (
        <StudentPaymentModal student={paymentModalStudent} feeItems={feeItems} onClose={() => setPaymentModalStudent(null)} onRecordTuitionPayment={onRecordTuitionPayment} onRecordFeePayment={onRecordFeePayment} onRecordSubscriptionPayment={onRecordSubscriptionPayment} />
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Modifier l'élève</h3>
              <button onClick={() => setEditStudent(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                  <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom</label>
                  <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Classe</label>
                <select value={editForm.classId} onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone Parent</label>
                <input type="text" value={editForm.parentPhone} onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setEditStudent(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Annuler</button>
                <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with PIN */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600"><Trash2 className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Supprimer l'élève</h3>
                <p className="text-xs text-slate-500">
                  {deleteConfirmStudent.firstName} {deleteConfirmStudent.lastName} — {deleteConfirmStudent.className}
                </p>
              </div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
              Cette action est irréversible. L'élève sera désinscrit de l'école.
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Entrez votre code PIN pour confirmer</label>
              <input
                type="password"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                inputMode="numeric"
                className="w-full px-3 py-3 text-center text-xl font-mono tracking-[0.3em] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            {deleteError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setDeleteConfirmStudent(null); setDeletePin(""); }} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Annuler</button>
              <button
                onClick={handleDeleteStudent}
                disabled={deletePin.length !== 6}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
