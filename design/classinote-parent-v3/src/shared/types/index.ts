export interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  classe: { libelle: string } | null;
  access_locked: boolean;
}

export interface DerniereNote {
  matiere: string;
  titre: string;
  note: number;
  sur: number;
  appreciation?: string;
  tendance?: number[];
}

export interface DashboardData {
  parent: { nom_complet: string };
  enfants: Enfant[];
  actif: {
    id: number;
    nom: string;
    present_aujourd_hui: boolean;
    prochain_cours: { matiere: string; heure: string } | null;
  };
  resume: {
    absences_mois: number;
    examens_a_venir: number;
    messages_non_lus: number;
    montant_du: number;
    montant_paye: number;
  };
  derniere_note: DerniereNote | null;
  dernier_avis: {
    auteur: string;
    contenu: string;
    date: string;
  } | null;
}

export interface Grade {
  id: number;
  evaluation: {
    titre: string;
    note_sur: number;
    coefficient: number;
    matiere: { libelle: string };
    periode?: string;
  };
  note: number;
  appreciation?: string;
}
