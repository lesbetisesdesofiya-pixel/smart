export type AdminRole = "superadmin" | "admin";

export type NavView =
  | "dashboard"
  | "teachers"
  | "students"
  | "classes"
  | "subjects"
  | "feeItems"
  | "assignments"
  | "gradeEntry"
  | "rapportNotes"
  | "bulletins"
  | "comptabilite"
  | "timetable"
  | "announcements"
  | "conversations"
  | "subscription"
  | "payments"
  | "permissions"
  | "settings"
  | "aiProviders"
  | "sa-schools"
  | "sa-admins"
  | "sa-activityLogs";

export type PaymentStatus = "a_jour" | "en_retard" | "partiel";
export type TeacherStatus = "actif" | "en_conge" | "inactif";
export type SchoolLevel = "college" | "lycee";

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  category: "Scientifique" | "Littéraire" | "Langue" | "Sport" | "Général";
  coefficientDefault: number;
}

export interface FeeItem {
  id: string;
  title: string;
  amountFCFA: number;
  isMandatory: boolean; // Obligatoire vs Facultatif
  targetClassIds: string[]; // ["all"] or list of classIds
  targetClassNames: string[];
}

export interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  level: SchoolLevel;
  classId: string;
  className: string;
  parentPhone: string;
  parentEmail: string;
  parentAddress: string;
  parentName?: string;
  parentCode?: string;
  parentMagicToken?: string;
  gender?: "M" | "F";
  paymentStatus: PaymentStatus;
  tuitionPaid: number;
  tuitionTotal: number;
  paidFeeIds?: string[];
  paidSubscriptionMonths?: string[]; // e.g. ["Septembre", "Octobre"]
  attendanceRate: number;
  status: "actif" | "suspendu" | "transfere";
  registrationDate: string;
  notesSummary?: {
    average: number;
    rank: number;
    totalStudents: number;
  };
}

export interface Teacher {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  photo: string;
  mainSubject: string;
  secondarySubjects: string[];
  assignedClassIds: string[];
  assignedClassNames: string[];
  phone: string;
  email: string;
  status: TeacherStatus;
  weeklyHours: number;
  maxWeeklyHours: number;
  diploma: string;
  hireDate: string;
  code?: string;
  magic_token?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: SchoolLevel;
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  delegateName: string;
  attendanceRate: number;
  ecolage?: number;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classId: string;
  className: string;
  coefficient: number;
}

export interface Evaluation {
  id: string;
  title: string;
  type: "devoir" | "interrogation" | "composition" | "examen";
  classId: string;
  className: string;
  subject: string;
  subject_id?: string;
  date: string;
  term: string;
  term_id?: string;
  totalPoints: number;
  coefficient: number;
  note_sur?: number;
  status: "a_venir" | "en_saisie" | "publie";
  classes?: { id: string; classe_id: string; libelle: string; nb_notes: number }[];
  nb_classes?: number;
}

export interface GradeEntry {
  studentId: string;
  studentName: string;
  matricule: string;
  mark?: number;
  comment?: string;
  absent?: boolean;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  className: string;
  day: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi" | "Samedi";
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  colorBg: string;
  isBreak?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  targetAudience: string;
  content: string;
  sentDate: string;
  readRate: number;
  priority: "normale" | "urgente" | "rappel";
  sender: string;
}

export interface MessageItem {
  id: string;
  sender: "parent" | "teacher" | "admin";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ConversationThread {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  subjectTopic: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "ouvert" | "resolu" | "archive";
  messages: MessageItem[];
}

export interface SubscriptionInfo {
  schoolName: string;
  licenseNumber: string;
  totalStudents: number;
  ratePerStudentFCFA: number; // 1000 FCFA
  billingCycle: "Mensuel" | "Trimestriel" | "Annuel";
  monthlyTotalFCFA: number;
  status: "actif" | "en_attente" | "expire";
  nextRenewalDate: string;
  planName: "ClassiNote Pro - Établissement";
  invoices: {
    id: string;
    number: string;
    period: string;
    amountFCFA: number;
    date: string;
    status: "payee" | "en_attente";
    receiptUrl?: string;
  }[];
}

export interface SubscriptionPayout {
  id: string;
  date: string;
  amountFCFA: number;
  method?: "Orange Money" | "MTN MoMo" | "Wave" | "Virement Bancaire";
  reference?: string;
  proofFileName?: string;
  proofUrl?: string;
  status: "en_attente" | "valide" | "rejete";
  submittedBy?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  studentMatricule?: string;
  className: string;
  date: string;
  amountFCFA: number;
  category: "scolarite" | "frais" | "abonnement" | "cantine" | "transport" | "uniforme";
  feeItemId?: string;
  feeTitle?: string;
  monthsCovered?: string[];
  method: "mobile_money" | "especes" | "virement";
  provider?: "Orange Money" | "MTN MoMo" | "Wave" | "Caisse École";
  reference?: string;
  receivedBy?: string;
  status: "valide" | "annule";
  description?: string;
}

export interface TuitionTranche {
  id: string;
  name: string;
  amountFCFA: number;
  dueDate: string;
}

export interface TuitionScheduleDefinition {
  id: string;
  title: string;
  targetClassIds: string[];
  tranches: TuitionTranche[];
}

export interface AiSetting {
  id: string;
  ai_provider_id: string;
  scope_type: string | null;
  scope_id: number | null;
  api_key_preview: string;
  model: string | null;
  is_active: boolean;
}

export interface AiProvider {
  id: string;
  name: string;
  code: string;
  base_url: string;
  is_active: boolean;
  default_model: string | null;
  settings: AiSetting[];
}

export interface SchoolSettings {
  schoolName: string;
  acronym?: string;
  logoUrl?: string;
  address: string;
  city?: string;
  country?: string;
  phone: string;
  email: string;
  website?: string;
  principalName?: string;
  principalTitle?: string;
  directorName: string;
  motto: string;
  currency: string;
}
