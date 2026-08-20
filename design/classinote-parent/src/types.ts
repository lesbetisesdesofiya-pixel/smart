export type NavigationTab = 'accueil' | 'notes' | 'avis' | 'paiements' | 'profil' | 'schedule' | 'team' | 'support' | 'qr' | 'messages';

export interface Child {
  id: string;
  name: string;
  class: string;
  photo: string;
  school: string;
  nextCourse: string;
  isPresent: boolean;
  accessLocked?: boolean;
  lockMessage?: string | null;
  subscriptionPaid?: boolean;
}

export interface Parent {
  name: string;
  photo: string;
  children: Child[];
  activeChildId: string;
}

export interface Grade {
  id: string;
  childId: string;
  subject: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
  term: 'T1' | 'T2' | 'T3';
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  coefficient?: number;
  appreciation?: string;
}

export interface Notice {
  id: string;
  childId: string;
  authorName: string;
  authorRole: string;
  authorPhoto: string;
  date: string;
  type: 'Félicitations' | 'Attention' | 'Information générale';
  badgeBg: string;
  badgeTextColor: string;
  content: string;
  isNew?: boolean;
}

export interface PaymentItem {
  id: string;
  childId: string;
  title: string;
  date: string;
  amount: number;
  currency: string;
  status: 'PAYÉ' | 'EN ATTENTE' | 'À PAYER';
  iconName: string;
  receiptNumber?: string;
  dueDate?: string;
}

export interface TimetableClass {
  id: string;
  day: 'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN';
  dayNum: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  teacherName: string;
  teacherPhoto: string;
  borderLeftColor: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

export interface StaffMember {
  id: string;
  name: string;
  category: 'administration' | 'enseignants';
  role: string;
  subtitle: string;
  photo: string;
  classes?: string[];
  days?: string[];
  subject?: string;
  email?: string;
  phone?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  teacherId: string;
  sender: 'parent' | 'teacher';
  text?: string;
  timestamp: string;
  attachments?: {
    name: string;
    size?: string;
    type: 'file' | 'image' | 'doc';
  }[];
  audioUrl?: string;
  audioDuration?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: 'bug' | 'review' | 'suggestion';
  attachmentName?: string;
  date: string;
  status: 'Envoyé' | 'En cours' | 'Résolu';
}

export interface AttendanceRecord {
  id: string;
  childId: string;
  date: string;
  time: string;
  type: 'PRÉSENCE' | 'ABSENCE' | 'RETARD';
  subject: string;
  justified?: boolean;
  reason?: string;
}
