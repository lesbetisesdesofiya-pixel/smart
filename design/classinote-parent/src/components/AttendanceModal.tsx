import React, { useState } from 'react';
import { Child, AttendanceRecord, TimetableClass } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChild: Child;
  records: AttendanceRecord[];
  timetable?: TimetableClass[];
  onNavigateToSupport?: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  activeChild,
  records,
  onNavigateToSupport
}) => {
  // Dates representation
  const [selectedDate, setSelectedDate] = useState<string>('2024-07-24');
  const [filterType, setFilterType] = useState<string>('Tous');
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [selectedSlotForReport, setSelectedSlotForReport] = useState<string | null>(null);
  
  // Absence Form State
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceSent, setAbsenceSent] = useState(false);

  if (!isOpen) return null;

  // Preset quick date options
  const quickDates = [
    { label: "Aujourd'hui", iso: "2024-07-24", display: "Mer. 24 Juil." },
    { label: "Hier", iso: "2024-07-23", display: "Mar. 23 Juil." },
    { label: "18 Juil.", iso: "2024-07-18", display: "Jeu. 18 Juil." },
    { label: "10 Juil.", iso: "2024-07-10", display: "Mer. 10 Juil." },
    { label: "25 Juin", iso: "2024-06-25", display: "Mar. 25 Juin" },
  ];

  // Standard daily schedule slots (8h to 17h course hours)
  const defaultDailySchedule = [
    {
      slotId: "slot-1",
      time: "08:30 - 10:00",
      subject: "Mathématiques",
      room: "Salle 204",
      teacher: "Mme. Claire Morel"
    },
    {
      slotId: "slot-2",
      time: "10:15 - 12:15",
      subject: "Français & Littérature",
      room: "Salle 102",
      teacher: "M. Thomas Bernard"
    },
    {
      slotId: "slot-3",
      time: "13:30 - 15:30",
      subject: "Sciences (SVT)",
      room: "Labo Sciences",
      teacher: "M. Alain Fischer"
    },
    {
      slotId: "slot-4",
      time: "15:45 - 17:15",
      subject: "Histoire - Géographie",
      room: "Salle 301",
      teacher: "M. Jean Dupont"
    }
  ];

  // Function to determine status per course slot for the selected date
  const getSlotStatus = (slotTime: string, slotSubject: string, isoDate: string) => {
    // Check custom record match
    const childRecords = records.filter(r => r.childId === activeChild.id);
    
    // Exact date matches
    if (isoDate === '2024-07-18' && slotTime.includes('13:30')) {
      return {
        type: 'RETARD' as const,
        reason: 'Rendez-vous médical (motif transmis)',
        justified: true
      };
    }

    if (isoDate === '2024-07-10') {
      if (slotTime.includes('08:30') || slotTime.includes('10:15')) {
        return {
          type: 'ABSENCE' as const,
          reason: 'Grippe saisonnière (certificat médical transmis)',
          justified: true
        };
      }
    }

    // Default: present
    return {
      type: 'PRÉSENCE' as const,
      justified: true
    };
  };

  const handleReportAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAbsenceSent(true);
    setTimeout(() => {
      setAbsenceSent(false);
      setShowAbsenceForm(false);
      setAbsenceReason('');
      setSelectedSlotForReport(null);
    }, 2000);
  };

  // Compute daily statistics for selected date
  const daySlots = defaultDailySchedule.map(slot => ({
    ...slot,
    statusInfo: getSlotStatus(slot.time, slot.subject, selectedDate)
  }));

  const filteredSlots = daySlots.filter(s => {
    if (filterType === 'Tous') return true;
    if (filterType === 'Présences') return s.statusInfo.type === 'PRÉSENCE';
    if (filterType === 'Absences') return s.statusInfo.type === 'ABSENCE';
    if (filterType === 'Retards') return s.statusInfo.type === 'RETARD';
    return true;
  });

  const presentCount = daySlots.filter(s => s.statusInfo.type === 'PRÉSENCE').length;
  const absentCount = daySlots.filter(s => s.statusInfo.type === 'ABSENCE').length;
  const retardCount = daySlots.filter(s => s.statusInfo.type === 'RETARD').length;

  const currentFormattedDateLabel = quickDates.find(d => d.iso === selectedDate)?.display || selectedDate;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl p-5 sm:p-6 space-y-5 animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#00113a]">Suivi des Présences par Cours</h3>
              <p className="text-xs text-slate-500 font-medium">
                Élève : <span className="font-bold text-[#375ca6]">{activeChild.name}</span> ({activeChild.class})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Date Search & Quick Date Selector */}
        <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#00113a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#375ca6]">calendar_month</span>
              <span>Rechercher une date</span>
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#002366] focus:outline-none focus:ring-2 focus:ring-[#375ca6]"
            />
          </div>

          {/* Quick Date Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
            {quickDates.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-[#002366] text-white border-[#002366] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Summary Banner */}
        <div className="bg-[#002366] rounded-[24px] p-4 text-white shadow-md relative overflow-hidden space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#758dd5] font-extrabold">
                BILAN DU JOUR ({currentFormattedDateLabel})
              </p>
              <div className="flex items-center gap-2 mt-1">
                {absentCount === 0 && retardCount === 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-extrabold text-white">Présent(e) à tous les cours</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-extrabold text-white">
                      {absentCount > 0 ? `${absentCount} cours manqué(s)` : 'Retard enregistré'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-right">
              <p className="text-[10px] text-blue-200 font-semibold">Taux de cours</p>
              <p className="text-base font-black text-emerald-300">
                {Math.round((presentCount / daySlots.length) * 100)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div className="bg-white/10 p-2 rounded-xl">
              <p className="text-[10px] text-slate-300 font-semibold">Cours suivi(s)</p>
              <p className="text-base font-extrabold text-emerald-300 mt-0.5">{presentCount} / {daySlots.length}</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <p className="text-[10px] text-amber-200 font-semibold">Retard(s)</p>
              <p className="text-base font-extrabold text-amber-300 mt-0.5">{retardCount}</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <p className="text-[10px] text-rose-200 font-semibold">Absence(s)</p>
              <p className="text-base font-extrabold text-rose-300 mt-0.5">{absentCount}</p>
            </div>
          </div>
        </div>

        {/* Action Button: Signaler une absence / Justifier */}
        <button
          onClick={() => setShowAbsenceForm(!showAbsenceForm)}
          className="w-full py-3 px-4 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#002366] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-[#8dafff]/40 transition-colors"
        >
          <span className="material-symbols-outlined text-lg text-[#375ca6]">edit_calendar</span>
          <span>{showAbsenceForm ? "Fermer le formulaire" : "Déclarer ou justifier une absence pour cette date"}</span>
        </button>

        {/* Report Absence Form */}
        {showAbsenceForm && (
          <form onSubmit={handleReportAbsenceSubmit} className="bg-[#f8f9ff] p-4 rounded-2xl border border-slate-200 space-y-3 animate-slideDown">
            <h4 className="text-xs font-bold text-[#00113a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#375ca6]">edit_note</span>
              <span>Déclaration d'absence ou justificatif</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#375ca6]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Créneau horaire</label>
                <select
                  value={selectedSlotForReport || ''}
                  onChange={(e) => setSelectedSlotForReport(e.target.value)}
                  className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#375ca6]"
                >
                  <option value="">Toute la journée</option>
                  {defaultDailySchedule.map(s => (
                    <option key={s.slotId} value={s.time}>{s.time} ({s.subject})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Motif de l'absence / justificatif</label>
              <textarea
                required
                rows={2}
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                placeholder="Ex: Rendez-vous médical, rendez-vous administratif, problème de transport..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#375ca6] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={absenceSent}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                absenceSent ? 'bg-emerald-600' : 'bg-[#002366] hover:bg-[#00113a]'
              }`}
            >
              {absenceSent ? (
                <>
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Justificatif transmis à l'établissement</span>
                </>
              ) : (
                <>
                  <span>Envoyer la justification</span>
                  <span className="material-symbols-outlined text-base">send</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Filter Pills */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#00113a] uppercase tracking-wider">
              Présence heure par heure ({currentFormattedDateLabel})
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">{filteredSlots.length} cours</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Tous', 'Présences', 'Absences', 'Retards'].map((tab) => {
              const isActive = filterType === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-[#002366] text-white border-[#002366]'
                      : 'bg-[#f8f9ff] text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hourly Course Schedule & Presence List */}
        <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {filteredSlots.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Aucun cours ne correspond au filtre sélectionné pour cette date.
            </div>
          ) : (
            filteredSlots.map((item) => {
              const status = item.statusInfo;
              let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
              let iconName = "check_circle";

              if (status.type === 'ABSENCE') {
                badgeStyle = "bg-rose-100 text-rose-800 border-rose-200";
                iconName = "cancel";
              } else if (status.type === 'RETARD') {
                badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
                iconName = "schedule";
              }

              return (
                <div
                  key={item.slotId}
                  className="p-4 bg-white border border-slate-100 rounded-2xl shadow-card flex items-start justify-between gap-3 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badgeStyle}`}>
                      <span className="material-symbols-outlined text-xl">{iconName}</span>
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#0b1c30]">{item.subject}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${badgeStyle}`}>
                          {status.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-[#375ca6]">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {item.time}
                        </span>
                        <span>•</span>
                        <span>{item.room}</span>
                      </div>

                      <p className="text-[11px] text-slate-400">Prof. : {item.teacher}</p>

                      {status.reason && (
                        <p className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg mt-1.5 italic border border-rose-100">
                          Motif : {status.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Toute contestation doit être signalée à la vie scolaire.</span>
          {onNavigateToSupport && (
            <button
              onClick={() => {
                onClose();
                onNavigateToSupport();
              }}
              className="text-[#375ca6] font-bold hover:underline"
            >
              Assistance
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
