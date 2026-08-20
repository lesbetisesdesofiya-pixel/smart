import React, { useState, useRef, useEffect } from 'react';
import { StaffMember, ChatMessage } from '../types';
import { Avatar } from './Avatar';

interface TeacherChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: StaffMember | null;
  messages: ChatMessage[];
  onSendMessage: (teacherId: string, message: Partial<ChatMessage>) => void;
}

export const TeacherChatModal: React.FC<TeacherChatModalProps> = ({
  isOpen,
  onClose,
  teacher,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: 'file' | 'image' | 'doc' }[]>([]);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback simulation state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Hidden File Input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filter messages for current teacher
  const teacherMessages = teacher
    ? messages.filter((m) => m.teacherId === teacher.id)
    : [];

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, teacherMessages.length]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  if (!isOpen || !teacher) return null;

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    onSendMessage(teacher.id, {
      sender: 'parent',
      text: inputText.trim(),
      timestamp: 'À l\'instant',
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    });

    setInputText('');
    setAttachedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const isDoc = file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
      const isImg = file.type.startsWith('image/');
      
      setAttachedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
          type: isImg ? 'image' : isDoc ? 'doc' : 'file',
        },
      ]);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  const handleSendVoiceNote = () => {
    const durationFormatted = `00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds || 5}`;
    setIsRecording(false);

    onSendMessage(teacher.id, {
      sender: 'parent',
      timestamp: 'À l\'instant',
      audioUrl: 'simulated_audio.mp3',
      audioDuration: durationFormatted,
    });
  };

  const toggleAudioPlay = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      setTimeout(() => {
        setPlayingAudioId(null);
      }, 4000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] h-[88vh] sm:h-[700px] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="p-4 bg-[#002366] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={teacher.name} size="md" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#002366]" />
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{teacher.name}</span>
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                {teacher.subtitle} • {teacher.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${teacher.phone || '+221338001000'}`}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Appeler"
            >
              <span className="material-symbols-outlined text-lg">call</span>
            </a>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Message Notice Info */}
        <div className="bg-[#f8f9ff] px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
            Discussion sécurisée avec le corps enseignant
          </span>
          <span className="text-[#375ca6] font-bold">Réponse sous 24h</span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdfefe] no-scrollbar">
          {teacherMessages.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-[#f0f4ff] text-[#002366] mx-auto flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-3xl">chat</span>
              </div>
              <h4 className="text-sm font-bold text-[#00113a]">Demarrer la discussion</h4>
              <p className="text-xs text-slate-500 mt-1">
                Posez une question à {teacher.name} concernant les cours, devoirs ou le suivi de votre enfant.
              </p>
            </div>
          ) : (
            teacherMessages.map((msg) => {
              const isParent = msg.sender === 'parent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isParent ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
                >
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {isParent ? 'Vous' : teacher.name}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl shadow-xs space-y-2 text-xs font-medium leading-relaxed ${
                      isParent
                        ? 'bg-[#002366] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-100 shadow-card rounded-bl-xs'
                    }`}
                  >
                    {/* Text content */}
                    {msg.text && <p>{msg.text}</p>}

                    {/* Audio Voice Note Bubble */}
                    {msg.audioUrl && (
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-xl ${
                          isParent ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-800 border border-slate-200/80'
                        }`}
                      >
                        <button
                          onClick={() => toggleAudioPlay(msg.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                            isParent
                              ? 'bg-white text-[#002366]'
                              : 'bg-[#002366] text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {playingAudioId === msg.id ? 'pause' : 'play_arrow'}
                          </span>
                        </button>

                        <div className="flex-1 space-y-1">
                          {/* Animated Waveform bar */}
                          <div className="flex items-center gap-0.5 h-4">
                            {[40, 70, 30, 90, 50, 100, 60, 30, 80, 40, 90, 60, 30].map((h, i) => (
                              <span
                                key={i}
                                className={`w-0.5 rounded-full transition-all ${
                                  playingAudioId === msg.id
                                    ? 'bg-emerald-400 animate-pulse'
                                    : isParent
                                    ? 'bg-white/60'
                                    : 'bg-slate-400'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>

                          <div className="flex justify-between items-center text-[10px] opacity-80">
                            <span className="font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">graphic_eq</span>
                              Message vocal
                            </span>
                            <span>{msg.audioDuration || '00:08'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold border ${
                              isParent
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="material-symbols-outlined text-lg">
                                {att.type === 'doc'
                                  ? 'description'
                                  : att.type === 'image'
                                  ? 'image'
                                  : 'attach_file'}
                              </span>
                              <span className="truncate">{att.name}</span>
                            </div>
                            <span className="text-[10px] opacity-75 shrink-0">{att.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Attached Files Preview Bar */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm text-[#375ca6]">
                  {file.type === 'image' ? 'image' : 'description'}
                </span>
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-500 ml-1"
                >
                  <span className="material-symbols-outlined text-xs">cancel</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          {isRecording ? (
            /* Voice Recording Active UI */
            <div className="flex items-center justify-between bg-rose-50 p-2.5 rounded-2xl border border-rose-200 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
                <span className="text-xs font-bold text-rose-800">
                  Enregistrement vocal : {formatSeconds(recordingSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Envoyer</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Text & Attachment Input */
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Joindre un fichier ou une photo"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>

              {/* Record Voice Note Button */}
              <button
                type="button"
                onClick={handleStartRecording}
                className="w-10 h-10 rounded-full bg-slate-100 text-[#002366] hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Message vocal"
              >
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>

              {/* Input Text Box */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Rédigez votre message..."
                className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 focus:outline-none focus:border-[#375ca6] focus:bg-white transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && attachedFiles.length === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white transition-all cursor-pointer ${
                  inputText.trim() || attachedFiles.length > 0
                    ? 'bg-[#002366] hover:bg-[#00113a] shadow-xs active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
