import React, { useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Receipt,
  Check,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Student, FeeItem, PaymentRecord } from "../types";

interface StudentPaymentModalProps {
  student: Student;
  feeItems: FeeItem[];
  onClose: () => void;
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

const SCHOOL_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre"
];

export const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  student,
  feeItems,
  onClose,
  onRecordTuitionPayment,
  onRecordFeePayment,
  onRecordSubscriptionPayment
}) => {
  const [activeTab, setActiveTab] = useState<"scolarite" | "frais" | "abonnement">("scolarite");

  // Scolarité Form State
  const remainingTuition = Math.max(0, student.tuitionTotal - student.tuitionPaid);
  const [tuitionAmount, setTuitionAmount] = useState<number>(remainingTuition > 0 ? remainingTuition : 25000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord["method"]>("especes");

  // Frais Form State
  const [selectedFeeId, setSelectedFeeId] = useState<string>("");

  // Abonnement Form State
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Filter fees applicable to student
  const applicableFees = feeItems.filter(
    (fee) =>
      fee.targetClassIds.includes("all") ||
      fee.targetClassIds.includes(student.classId)
  );

  const handleTuitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tuitionAmount <= 0) return;
    onRecordTuitionPayment(student.id, Number(tuitionAmount), paymentMethod);
    onClose();
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = applicableFees.find((f) => f.id === selectedFeeId);
    if (!fee) return;
    onRecordFeePayment(student.id, fee, paymentMethod);
    onClose();
  };

  const handleSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) return;
    const totalFCFA = selectedMonths.length * 1000;
    onRecordSubscriptionPayment(student.id, selectedMonths, totalFCFA, paymentMethod);
    onClose();
  };

  const toggleMonthSelection = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900">
                {student.firstName} {student.lastName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                {student.className}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Matricule : {student.matricule} • Parent : {student.parentPhone}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Payment Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("scolarite")}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "scolarite"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Scolarité
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("frais")}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "frais"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Frais Scolaires
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("abonnement")}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "abonnement"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Abonnement (1 000 F)
          </button>
        </div>

        {/* TAB 1: SCOLARITÉ */}
        {activeTab === "scolarite" && (
          <form onSubmit={handleTuitionSubmit} className="space-y-4 text-xs">
            {/* Tuition Balance Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Scolarité totale annuelle :</span>
                <span className="font-bold">{student.tuitionTotal.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Déjà versé à ce jour :</span>
                <span className="font-bold text-emerald-400">{student.tuitionPaid.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-extrabold text-amber-300">Reste à Payer (Scolarité) :</span>
                <span className="text-xl font-black text-amber-300">
                  {remainingTuition.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Montant du Versement de Scolarité (FCFA)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={tuitionAmount}
                onChange={(e) => setTuitionAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-black text-slate-900 text-base"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Valider le Paiement Scolarité</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: FRAIS SCOLAIRES */}
        {activeTab === "frais" && (
          <form onSubmit={handleFeeSubmit} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Sélectionnez le Frais à Régler</label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {applicableFees.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 font-medium bg-slate-50 rounded-xl">
                    Aucun frais spécifique défini pour cette classe.
                  </p>
                ) : (
                  applicableFees.map((fee) => {
                    const isPaid = student.paidFeeIds?.includes(fee.id);
                    const isSelected = selectedFeeId === fee.id;
                    return (
                      <div
                        key={fee.id}
                        onClick={() => !isPaid && setSelectedFeeId(fee.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isPaid
                            ? "bg-emerald-50/50 border-emerald-200 opacity-80 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-50 border-blue-600 ring-2 ring-blue-600/20"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{fee.title}</span>
                            <span
                              className={`px-2 py-0.2 rounded-md text-[9px] font-extrabold uppercase ${
                                fee.isMandatory
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {fee.isMandatory ? "Obligatoire" : "Facultatif"}
                            </span>
                          </div>
                          <span className="text-xs font-black text-blue-700 block">
                            {fee.amountFCFA.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>

                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Déjà Payé
                          </span>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!selectedFeeId}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer le Paiement du Frais</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ABONNEMENT */}
        {activeTab === "abonnement" && (
          <form onSubmit={handleSubscriptionSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
              <div className="flex items-center justify-between font-extrabold text-blue-900">
                <span>Tarif Abonnement SMS & Plateforme :</span>
                <span>1 000 FCFA / mois</span>
              </div>
              <p className="text-[11px] text-blue-700">
                Cochez les mois d'abonnement que le parent souhaite régler.
              </p>
            </div>

            {/* Months Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {SCHOOL_MONTHS.map((month) => {
                const isPaid = student.paidSubscriptionMonths?.includes(month);
                const isSelected = selectedMonths.includes(month);
                return (
                  <button
                    key={month}
                    type="button"
                    disabled={isPaid}
                    onClick={() => toggleMonthSelection(month)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                      isPaid
                        ? "bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{month}</span>
                    {isPaid ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">1000 F</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Total Calculation Display */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-300">
                Total sélectionné ({selectedMonths.length} mois) :
              </span>
              <span className="text-lg font-black text-amber-300">
                {(selectedMonths.length * 1000).toLocaleString("fr-FR")} FCFA
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={selectedMonths.length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Valider l'Abonnement</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
