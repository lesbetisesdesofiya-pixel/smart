export type ScreenType =
  | 'dashboard'
  | 'evaluations'
  | 'class_details'
  | 'student_profile'
  | 'create_assessment'
  | 'messaging'
  | 'login'
  | 'create_remark'
  | 'interrogation'
  | 'presences';

export interface ProfData {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  school: string;
  school_id: number;
  ai_notes_enabled: boolean;
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
  classe?: Classe;
  matiere?: Matiere;
  has_notes?: boolean;
  notes_count?: number;
  moyenne?: number;
  mediane?: number;
}

export interface EmploiItem {
  heure: string;
  matiere: string;
  classe: string;
}

export interface MoyenneClasse {
  classe: string;
  moyenne: number;
}

export interface DashboardData {
  prof: ProfData;
  classes: Classe[];
  matieres: Matiere[];
  evaluations: Evaluation[];
  stats: {
    nb_classes: number;
    nb_matieres: number;
    nb_evaluations: number;
    taux_saisie: number;
    moyennes_par_classe: MoyenneClasse[];
    absences_semaine: number;
  };
  emploi_du_jour: EmploiItem[];
}

export interface EleveClasse {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  moyenne: number;
  nb_notes: number;
  rank: number;
  matricule?: string;
}
