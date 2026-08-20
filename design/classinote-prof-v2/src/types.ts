export type ScreenType =
  | 'dashboard'
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

export interface ProfData {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  school: string;
  school_id: number;
  ai_notes_enabled?: boolean;
}

export interface Classe {
  id: number;
  libelle: string;
  section?: { libelle: string };
  eleves_count?: number;
}

export interface Matiere {
  id: number;
  libelle: string;
}

export interface Evaluation {
  id: number;
  titre: string;
  type: string;
  date: string;
  coefficient: number;
  note_sur: number;
  classe: Classe;
  matiere: Matiere;
  notes: any[];
  has_notes?: boolean;
  notes_saisies?: number;
  total_eleves?: number;
  moyenne?: number;
  mediane?: number;
}

export interface EleveClasse {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  moyenne: number | null;
  nb_notes: number;
  rank: number;
  matricule?: string;
}

export interface EvolutionNote {
  id: number;
  note: number;
  evaluation: {
    id: number;
    titre: string;
    type: string;
    coefficient: number;
    date: string;
    matiere: { id: number; libelle: string };
    periode: { id: number; libelle: string } | null;
  };
}

export interface StudentData {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  moyenne?: number;
  nb_notes?: number;
  rank?: number;
  classeName?: string;
  totalStudents?: number;
  evolution?: EvolutionNote[];
}

export interface Message {
  id: string;
  sender_type: string;
  sender_id: number;
  sender_name: string;
  contenu: string;
  lu: boolean;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  type: string;
  subject: string;
  eleve: { id: number; nom_complet: string; classe: string } | null;
  other_party: { id: number; nom_complet: string; role: string };
  last_message: { contenu: string; created_at: string } | null;
  unread_count: number;
}

export interface NotificationItem {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  lu: boolean;
  data: any;
  created_at: string;
}
