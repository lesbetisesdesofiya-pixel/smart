import React, { useState } from "react";
import { Calendar, Plus, Clock, User, X, Trash2, Coffee } from "lucide-react";
import { TimetableSlot, SchoolClass, Teacher } from "../types";

interface TimetableManagerProps {
  timetable: TimetableSlot[];
  setTimetable: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
  classes: SchoolClass[];
  teachers: Teacher[];
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  timetable,
  setTimetable,
  classes,
  teachers
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "C1");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [slotType, setSlotType] = useState<"cours" | "recreation">("cours");

  const days: TimetableSlot["day"][] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Filter slots for selected class
  const classSlots = timetable.filter((ts) => ts.classId === selectedClassId);

  const [newSlotForm, setNewSlotForm] = useState({
    day: "Lundi" as TimetableSlot["day"],
    startTime: "08:00",
    endTime: "10:00",
    subject: "Mathématiques",
    teacherId: teachers[0]?.id || "T1"
  });

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();

    if (slotType === "recreation") {
      const newSlot: TimetableSlot = {
        id: `TS${Date.now()}`,
        classId: selectedClassId,
        className: currentClass?.name || "6ème A",
        day: newSlotForm.day,
        startTime: newSlotForm.startTime,
        endTime: newSlotForm.endTime,
        subject: "Récréation",
        teacherId: "",
        teacherName: "Pause élèves & professeurs",
        colorBg: "bg-amber-100 text-amber-900 border-amber-300"
      };
      setTimetable([...timetable, newSlot]);
      setIsAddingSlot(false);
      return;
    }

    const teach = teachers.find((t) => t.id === newSlotForm.teacherId);

    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-emerald-100 text-emerald-800 border-emerald-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200"
    ];

    const newSlot: TimetableSlot = {
      id: `TS${Date.now()}`,
      classId: selectedClassId,
      className: currentClass?.name || "6ème A",
      day: newSlotForm.day,
      startTime: newSlotForm.startTime,
      endTime: newSlotForm.endTime,
      subject: newSlotForm.subject,
      teacherId: newSlotForm.teacherId,
      teacherName: teach ? `${teach.firstName} ${teach.lastName}` : "M. Professeur",
      colorBg: colors[Math.floor(Math.random() * colors.length)]
    };

    setTimetable([...timetable, newSlot]);
    setIsAddingSlot(false);
  };

  const handleDeleteSlot = (id: string) => {
    setTimetable(timetable.filter((ts) => ts.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Gestion des Emplois du Temps</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Planning hebdomadaire des cours et des récréations par classe
          </p>
        </div>

        <button
          id="btn-add-timetable-slot"
          onClick={() => {
            setSlotType("cours");
            setIsAddingSlot(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Créneau / Récréation</span>
        </button>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Sélectionner la classe :</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-extrabold text-blue-800"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSlotType("recreation");
            setNewSlotForm({ ...newSlotForm, startTime: "10:00", endTime: "10:15" });
            setIsAddingSlot(true);
          }}
          className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Coffee className="w-4 h-4 text-amber-600" />
          <span>+ Ajouter une Récréation</span>
        </button>
      </div>

      {/* Timetable Weekly Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {days.map((day) => {
          const slotsForDay = classSlots
            .filter((ts) => ts.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-3">
              <div className="p-2 bg-slate-900 text-white font-black text-xs text-center rounded-xl uppercase tracking-wider">
                {day}
              </div>

              <div className="space-y-2.5 min-h-[220px]">
                {slotsForDay.length > 0 ? (
                  slotsForDay.map((ts) => {
                    const isRec = ts.subject.toLowerCase().includes("récréation") || ts.subject.toLowerCase().includes("recreation");

                    return (
                      <div
                        key={ts.id}
                        className={`p-3 rounded-xl border ${
                          isRec ? "bg-amber-50 text-amber-900 border-amber-300" : ts.colorBg
                        } shadow-xs relative group transition-all space-y-1`}
                      >
                        <button
                          onClick={() => handleDeleteSlot(ts.id)}
                          className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1 text-[10px] font-extrabold opacity-80">
                          <Clock className="w-3 h-3" />
                          <span>{ts.startTime} - {ts.endTime}</span>
                        </div>

                        {isRec ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <Coffee className="w-4 h-4 text-amber-600" />
                            <span className="font-extrabold text-xs text-amber-900 uppercase tracking-wide">
                              Récréation
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="font-extrabold text-xs leading-tight">{ts.subject}</p>
                            <p className="text-[10px] font-medium opacity-90 truncate">{ts.teacherName}</p>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center p-4 text-[10px] text-slate-300 italic text-center border-2 border-dashed border-slate-100 rounded-xl">
                    Aucun cours
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      {isAddingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {slotType === "recreation" ? "Ajouter une Récréation" : `Ajouter un Cours (${currentClass?.name})`}
              </h3>
              <button onClick={() => setIsAddingSlot(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector tabs inside modal */}
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setSlotType("cours")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  slotType === "cours" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                }`}
              >
                Cours Ordinaire
              </button>
              <button
                type="button"
                onClick={() => setSlotType("recreation")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  slotType === "recreation" ? "bg-amber-500 text-white shadow-xs" : "text-slate-600"
                }`}
              >
                ☕ Récréation / Pause
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jour de la semaine</label>
                <select
                  value={newSlotForm.day}
                  onChange={(e) => setNewSlotForm({ ...newSlotForm, day: e.target.value as TimetableSlot["day"] })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Heure Début</label>
                  <input
                    type="time"
                    value={newSlotForm.startTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Heure Fin</label>
                  <input
                    type="time"
                    value={newSlotForm.endTime}
                    onChange={(e) => setNewSlotForm({ ...newSlotForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {slotType === "cours" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Enseignant & Matière</label>
                  <select
                    value={newSlotForm.teacherId}
                    onChange={(e) => {
                      const t = teachers.find((teach) => teach.id === e.target.value);
                      setNewSlotForm({
                        ...newSlotForm,
                        teacherId: e.target.value,
                        subject: t?.mainSubject || "Mathématiques"
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.mainSubject})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {slotType === "recreation" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                  Cette plage horaire sera marquée comme <strong>Récréation</strong> sur l'emploi du temps de la classe.
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSlot(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {slotType === "recreation" ? "Ajouter la Récréation" : "Valider le cours"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
