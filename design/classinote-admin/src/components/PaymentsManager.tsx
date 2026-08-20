import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  X,
  CreditCard,
  Building2,
  Smartphone
} from "lucide-react";
import { PaymentRecord, Student, SchoolClass, FeeItem } from "../types";

interface PaymentsManagerProps {
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  students: Student[];
  classes: SchoolClass[];
  feeItems: FeeItem[];
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({
  payments,
  setPayments,
  students,
  classes,
  feeItems
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<PaymentRecord | null>(null);

  const [newPaymentForm, setNewPaymentForm] = useState({
    studentId: students[0]?.id || "S101",
    amountFCFA: 100000,
    category: "scolarite" as PaymentRecord["category"],
    feeItemId: feeItems[0]?.id,
    feeTitle: feeItems[0]?.title || "Scolarité",
    method: "mobile_money" as PaymentRecord["method"],
    provider: "Orange Money" as PaymentRecord["provider"]
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amountFCFA, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      `${p.studentName} ${p.receiptNumber} ${p.reference || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
      (selectedCategory === "abonnement" && p.category === "abonnement") ||
      (selectedCategory !== "abonnement" && (p.feeTitle === selectedCategory || p.category === selectedCategory));
    const matchesMethod = selectedMethod === "all" || p.method === selectedMethod;
    return matchesSearch && matchesCategory && matchesMethod;
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === newPaymentForm.studentId);
    if (!student) return;

    const newPay: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNumber: `REC-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      className: student.className,
      date: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      amountFCFA: Number(newPaymentForm.amountFCFA),
      category: newPaymentForm.category,
      feeItemId: newPaymentForm.feeItemId,
      feeTitle: newPaymentForm.feeTitle,
      method: newPaymentForm.method,
      provider: newPaymentForm.provider,
      reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      receivedBy: "Caisse Principale - ClassiNote",
      status: "valide"
    };

    setPayments([newPay, ...payments]);
    setIsRecordingPayment(false);
    setActiveReceiptPayment(newPay);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Paiements & Scolarité (Finance)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Historique des encaissements de scolarité, cantine, transport et reçus de caisse
          </p>
        </div>
      </div>

      {/* Financial Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Encaissé</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {totalCollected.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-slate-500 mt-1">Année académique 2024-2025</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Encaissements aujourd'hui</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {payments.slice(0, 2).reduce((sum, p) => sum + p.amountFCFA, 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">• Caisse ouverte</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Volume de transactions</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{payments.length} reçus émis</p>
          <p className="text-xs text-slate-500 mt-1">Mobile Money & Espèces</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher élève, numéro de reçu ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Tous les frais</option>
            <option value="abonnement">Abonnements</option>
            {feeItems.map((f) => (
              <option key={f.id} value={f.title}>{f.title}</option>
            ))}
          </select>

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Tous modes de paiement</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="especes">Espèces</option>
            <option value="virement">Virement</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Reçu N°</th>
                <th className="px-5 py-3.5">Élève & Classe</th>
                <th className="px-5 py-3.5">Frais</th>
                <th className="px-5 py-3.5">Date & Heure</th>
                <th className="px-5 py-3.5">Mode & Fournisseur</th>
                <th className="px-5 py-3.5">Montant Encaissé</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-black text-slate-900">{p.receiptNumber}</td>

                  <td className="px-5 py-4 space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{p.studentName}</p>
                    <p className="text-[11px] text-blue-600 font-semibold">{p.className}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] capitalize">
                      {p.feeTitle || p.category}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">{p.date}</td>

                  <td className="px-5 py-4 space-y-0.5">
                    <span className="font-bold text-slate-800">{p.provider || p.method}</span>
                    <p className="text-[10px] text-slate-400">Ref: {p.reference || "N/A"}</p>
                  </td>

                  <td className="px-5 py-4 font-black text-emerald-600 text-sm">
                    {p.amountFCFA.toLocaleString("fr-FR")} FCFA
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setActiveReceiptPayment(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Reçu</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Form Modal */}
      {isRecordingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enregistrer un Encaissement</h3>
              <button onClick={() => setIsRecordingPayment(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sélectionner l'Élève</label>
                <select
                  value={newPaymentForm.studentId}
                  onChange={(e) => setNewPaymentForm({ ...newPaymentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant Encaissé (FCFA)</label>
                <input
                  type="number"
                  required
                  value={newPaymentForm.amountFCFA}
                  onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amountFCFA: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={newPaymentForm.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      const fee = feeItems.find(f => f.title === val);
                      setNewPaymentForm({
                        ...newPaymentForm,
                        category: (fee ? (fee.title.toLowerCase().includes('scolar') ? 'scolarite' : fee.title.toLowerCase().includes('cantine') ? 'cantine' : fee.title.toLowerCase().includes('transport') ? 'transport' : fee.title.toLowerCase().includes('tenue') || fee.title.toLowerCase().includes('uniforme') ? 'uniforme' : 'frais') : val) as PaymentRecord["category"],
                        feeItemId: fee?.id,
                        feeTitle: fee?.title || val,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    {feeItems.map((f) => (
                      <option key={f.id} value={f.title}>{f.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mode de règlement</label>
                  <select
                    value={newPaymentForm.provider}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, provider: e.target.value as PaymentRecord["provider"] })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN MoMo">MTN MoMo</option>
                    <option value="Wave">Wave</option>
                    <option value="Caisse École">Espèces (Caisse)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordingPayment(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Valider & Générer Reçu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceiptPayment && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-bold text-sm text-slate-900">Reçu de Caisse Officiel - ClassiNote</span>
              <button onClick={() => setActiveReceiptPayment(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-800">
              <div className="flex justify-between font-bold">
                <span>N° Reçu: {activeReceiptPayment.receiptNumber}</span>
                <span>{activeReceiptPayment.date}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p>Élève: <strong className="text-slate-900">{activeReceiptPayment.studentName}</strong></p>
                <p>Classe: <strong className="text-blue-700">{activeReceiptPayment.className}</strong></p>
                <p>Motif: <strong className="uppercase">{activeReceiptPayment.feeTitle || activeReceiptPayment.category}</strong></p>
                <p>Mode: <strong>{activeReceiptPayment.provider}</strong> (Ref: {activeReceiptPayment.reference})</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Montant Perçu</span>
                <span className="text-xl font-black text-emerald-700">
                  {activeReceiptPayment.amountFCFA.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic">
                Encaissé par: {activeReceiptPayment.receivedBy}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
