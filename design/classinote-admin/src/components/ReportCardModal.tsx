import React from "react";
import { X, Printer, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { Student, SchoolSettings } from "../types";

interface ReportCardModalProps {
  student: Student | null;
  settings: SchoolSettings;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  student,
  settings,
  onClose
}) => {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const sampleSubjects = [
    { name: "Mathématiques", coef: 4, mark: 17.5, classAvg: 12.4, teacher: "M. Amadou Konaté", remark: "Excellentes capacités de raisonnement." },
    { name: "Français & Littérature", coef: 4, mark: 16.0, classAvg: 11.8, teacher: "Mme Aminata Diallo", remark: "Très bonne expression et orthographe." },
    { name: "Histoire-Géographie", coef: 2, mark: 15.0, classAvg: 13.0, teacher: "M. Koffi Emmanuel Yao", remark: "Travail sérieux et régulier." },
    { name: "SVT (Sciences)", coef: 3, mark: 16.5, classAvg: 12.1, teacher: "Mme Sarah Kouamé", remark: "Très bon esprit scientifique." },
    { name: "Physique-Chimie", coef: 3, mark: 15.5, classAvg: 11.2, teacher: "Mme Fatou Traoré", remark: "Bonne maîtrise des formules." },
    { name: "Anglais", coef: 2, mark: 18.0, classAvg: 13.5, teacher: "M. David Ouattara", remark: "Fluent and active in class." }
  ];

  const totalCoef = sampleSubjects.reduce((acc, s) => acc + s.coef, 0);
  const totalWeightedMarks = sampleSubjects.reduce((acc, s) => acc + s.mark * s.coef, 0);
  const overallAverage = (totalWeightedMarks / totalCoef).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Bulletin Trimestriel Officiel - ClassiNote</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Bulletin</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-report-card" className="p-8 space-y-6 text-slate-800">
          {/* School Banner Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-300" />
              <div>
                <h2 className="text-lg font-black uppercase text-slate-900">{settings.schoolName}</h2>
                <p className="text-xs text-slate-600">{settings.address}, {settings.city} - {settings.country}</p>
                <p className="text-[11px] text-slate-500">Tél: {settings.phone} | Email: {settings.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md block">
                BULLETIN DE NOTES
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">1<sup>er</sup> TRIMESTRE</p>
              <p className="text-[11px] text-slate-500 font-semibold">Année Scolaire: {settings.academicYear}</p>
            </div>
          </div>

          {/* Student Dossier Information */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <p>Nom & Prénom: <strong className="text-slate-900 text-sm">{student.firstName} {student.lastName}</strong></p>
              <p>Matricule Élève: <strong className="text-slate-900">{student.matricule}</strong></p>
              <p>Sexe: <strong>{student.gender === "M" ? "Masculin" : "Féminin"}</strong> | Date de Naissance: <strong>{student.birthDate}</strong></p>
            </div>
            <div className="space-y-1 text-right sm:text-left">
              <p>Classe: <strong className="text-blue-700 text-sm font-black">{student.className}</strong></p>
              <p>Effectif de la classe: <strong>32 élèves</strong></p>
              <p>Parent Tuteur: <strong>{student.parentName}</strong> ({student.parentPhone})</p>
            </div>
          </div>

          {/* Grades Breakdown Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200">Matière Enseignée</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Coef</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Note / 20</th>
                  <th className="p-2.5 text-center border-r border-slate-200 font-normal">Moy. Classe</th>
                  <th className="p-2.5 border-r border-slate-200">Professeur</th>
                  <th className="p-2.5">Appréciation / Remarques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {sampleSubjects.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">{sub.name}</td>
                    <td className="p-2.5 text-center border-r border-slate-200 font-bold">{sub.coef}</td>
                    <td className="p-2.5 text-center border-r border-slate-200 text-sm font-black text-blue-700">
                      {sub.mark.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-200 text-slate-500">{sub.classAvg.toFixed(1)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-700">{sub.teacher}</td>
                    <td className="p-2.5 italic text-slate-600">{sub.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* General Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-1">
              <span className="text-slate-500 font-bold block uppercase text-[10px]">Moyenne Générale</span>
              <span className="text-2xl font-black text-blue-800">{overallAverage} / 20</span>
              <p className="text-[11px] text-blue-600 font-semibold">Total Coef: {totalCoef}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-slate-500 font-bold block uppercase text-[10px]">Rang dans la classe</span>
              <span className="text-2xl font-black text-slate-900">2<sup>e</sup> / 32</span>
              <p className="text-[11px] text-slate-500">Moyenne max de la classe: 17.8</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-emerald-800 font-bold uppercase text-[10px] block">Décision du Conseil</span>
              <p className="font-extrabold text-emerald-900 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tableau d'Honneur
              </p>
              <p className="text-[11px] text-emerald-700">Félicitations du Conseil de Classe.</p>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-slate-300 flex items-end justify-between text-xs">
            <div className="text-center space-y-8">
              <p className="font-bold text-slate-700">Le Professeur Principal</p>
              <p className="text-slate-400 italic">Mme Aminata Diallo</p>
            </div>

            <div className="text-center space-y-8">
              <p className="font-bold text-slate-700">Le Parent d'Élève</p>
              <p className="text-slate-400 italic">Signature</p>
            </div>

            <div className="text-center space-y-8">
              <div>
                <p className="font-bold text-slate-900">Le Proviseur / Directeur</p>
                <p className="text-[10px] text-slate-500">{settings.principalName}</p>
              </div>
              <div className="w-24 h-12 border-2 border-dashed border-blue-300 rounded-lg mx-auto flex items-center justify-center text-[9px] text-blue-500 font-bold uppercase tracking-wider">
                Sceau École
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
