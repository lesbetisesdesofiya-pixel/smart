export type ScreenType = 
  | 'dashboard'
  | 'grade_entry'
  | 'assessments'
  | 'class_details'
  | 'student_profile'
  | 'create_assessment'
  | 'messaging'
  | 'school_selection'
  | 'login'
  | 'qr_connect'
  | 'create_remark'
  | 'ai_notes'
  | 'interrogation'
  | 'presences';

export interface GradeHistoryItem {
  id: string;
  subject: string;
  title: string;
  date: string;
  trimester: string;
  coefficient: number;
  grade: number;
  status: 'Validé' | 'Moyen' | 'Excellent' | 'Rattrapage';
  icon: string;
}

export interface Student {
  id: string;
  initials: string;
  name: string;
  className: string;
  matricule: string;
  lastGrade: number;
  currentGrade?: string;
  average: number;
  rank: number;
  totalStudentsInClass: number;
  attendanceRate: number; // e.g. 98
  conduct: string; // e.g. "A"
  credits: number; // e.g. 142
  photoUrl: string;
  skills: {
    francais: number;
    maths: number;
    physique: number;
    anglais: number;
    histoGeo: number;
    eps: number;
  };
  observations: string;
  gradesHistory: GradeHistoryItem[];
  trend?: string; // e.g. "+0.5"
}

export interface ExamStudentGrade {
  studentId: string;
  studentName: string;
  initials: string;
  grade: number;
  outOf?: number; // default 20
  appreciation?: string;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  trimester: string;
  date: string;
  className: string;
  status: 'Corrigé' | 'En attente' | 'Archivé' | 'À saisir';
  isUrgent?: boolean;
  time?: string;
  location?: string;
  description?: string;
  studentAvatars?: string[];
  averageGrade?: number;
  maxGrade?: number;
  minGrade?: number;
  studentGrades?: ExamStudentGrade[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'teacher';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  senderName: string;
  roleDescription: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  isUnread?: boolean;
  tag?: string;
  messagesHistory: ChatMessage[];
}

export interface School {
  id: string;
  name: string;
  location: string;
  role: string;
  iconName: string;
  bgColor: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'grade' | 'message' | 'system' | 'reminder';
}
