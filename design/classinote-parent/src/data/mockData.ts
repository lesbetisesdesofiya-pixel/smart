import { Parent, Grade, Notice, PaymentItem, TimetableClass, StaffMember, AttendanceRecord, ChatMessage } from '../types';

export const initialParent: Parent = {
  name: "Mme Mensah",
  photo: "",
  activeChildId: "child-1",
  children: [
    {
      id: "child-1",
      name: "Koffi Mensah",
      class: "6ème A",
      photo: "",
      school: "Complexe Scolaire ClassiNote",
      nextCourse: "Histoire-Géo à 14:00",
      isPresent: true,
    },
    {
      id: "child-2",
      name: "Ama Mensah",
      class: "4ème B",
      photo: "",
      school: "Complexe Scolaire ClassiNote",
      nextCourse: "Physique-Chimie à 15:15",
      isPresent: true,
    }
  ]
};

export const initialGrades: Grade[] = [
  {
    id: "g1",
    childId: "child-1",
    subject: "Mathématiques",
    title: "Interrogation : Algèbre",
    score: 16,
    maxScore: 20,
    date: "14 Oct 2023",
    term: "T1",
    accentColor: "#375ca6",
    badgeBg: "bg-blue-100/60 text-[#19448d]",
    badgeText: "Mathématiques",
    coefficient: 3,
    appreciation: "Très bon travail en résolution d'équations."
  },
  {
    id: "g2",
    childId: "child-1",
    subject: "Français",
    title: "Devoir : Dissertation",
    score: 12,
    maxScore: 20,
    date: "10 Oct 2023",
    term: "T1",
    accentColor: "#ba1a1a",
    badgeBg: "bg-red-100 text-[#ba1a1a]",
    badgeText: "Français",
    coefficient: 2,
    appreciation: "Analyse correcte mais attention aux fautes d'inattention."
  },
  {
    id: "g3",
    childId: "child-1",
    subject: "Sciences de la Vie",
    title: "Composition : Écosystèmes",
    score: 18.5,
    maxScore: 20,
    date: "05 Oct 2023",
    term: "T1",
    accentColor: "#16a34a",
    badgeBg: "bg-emerald-100 text-emerald-800",
    badgeText: "Sciences de la Vie",
    coefficient: 2,
    appreciation: "Excellente maîtrise des concepts biologiques !"
  },
  {
    id: "g4",
    childId: "child-1",
    subject: "Histoire-Géo",
    title: "Interrogation : La Renaissance",
    score: 14,
    maxScore: 20,
    date: "02 Oct 2023",
    term: "T1",
    accentColor: "#757682",
    badgeBg: "bg-slate-200 text-slate-800",
    badgeText: "Histoire-Géo",
    coefficient: 2,
    appreciation: "Bonne restitution des repères chronologiques."
  },
  {
    id: "g5",
    childId: "child-1",
    subject: "Anglais",
    title: "Oral : Expression continue",
    score: 17,
    maxScore: 20,
    date: "28 Sep 2023",
    term: "T1",
    accentColor: "#9333ea",
    badgeBg: "bg-purple-100 text-purple-800",
    badgeText: "Anglais",
    coefficient: 1.5,
    appreciation: "Excellente fluidité et accent dynamique."
  },
  {
    id: "g6",
    childId: "child-2",
    subject: "Physique-Chimie",
    title: "Contrôle : Transformations chimiques",
    score: 15.5,
    maxScore: 20,
    date: "15 Oct 2023",
    term: "T1",
    accentColor: "#0284c7",
    badgeBg: "bg-sky-100 text-sky-800",
    badgeText: "Physique",
    coefficient: 3,
    appreciation: "Raisonnement rigoureux."
  }
];

export const initialNotices: Notice[] = [
  {
    id: "n1",
    childId: "child-1",
    authorName: "Mme. Sophie Martin",
    authorRole: "Professeur de Mathématiques",
    authorPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUfdkwZNE-sXJoG3S_hOtHVbm4zRR8Y1e6h7QJcyUPUJeFubrKIKj7Se5EESOJH33kpf3cC84fEOmV1w2WjmzxHZhR6AeiRW2fXSKyeLNqfcOYox3QueOxNHwvyppq-Cc-aLEZznLr6tDz_xVLf2Cj2PWqJcLrjkQqsqrD1veAACX7A0WpnwyhBdtfNwTT9_91ZCARutn4Y7YMMVnieyjkJs9ycpXtcm6qyJe2wnooXixWhkwg4Me5rGuEOwjJQWK382XSG6Re1Q",
    date: "Hier, 16:45",
    type: "Félicitations",
    badgeBg: "bg-emerald-100",
    badgeTextColor: "text-emerald-800",
    content: "Koffi a fait preuve d'une excellente participation lors du cours de mathématiques aujourd'hui. Sa résolution du problème de géométrie était particulièrement brillante.",
    isNew: true
  },
  {
    id: "n2",
    childId: "child-1",
    authorName: "M. Jean Dupont",
    authorRole: "Professeur d'Histoire-Géo",
    authorPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAe40Zn-L_AzZFjXyUUz1qAFomEwHEh3_yX1P2T-zYtAEOPgdH6C5HT6W23A6BLU9MScsktOAo8yAmrCVxYkvTB9T28XYl14BY7ole2JwBAh39DLgC7jyhw70W3lOwuafQ0InbZlLQztdkdB2X6zJ4OQfAdOeDEL-RsjNRo3ujDNW5CtTwc4UQcvfabGHcwa_0GAs7Yvu8j6tKv6xmD-XK578wrHG929MXkCFSKQAu8mKOttrXgsWNmN1Tah05Ew72W0Q31OIwgPA",
    date: "12 Oct. 2023",
    type: "Attention",
    badgeBg: "bg-amber-100",
    badgeTextColor: "text-amber-800",
    content: "Nous avons remarqué que Koffi a oublié son cahier d'exercices d'Histoire-Géo pour la deuxième fois cette semaine. Merci de veiller à ce qu'il vérifie son sac ce soir."
  },
  {
    id: "n3",
    childId: "child-1",
    authorName: "Direction École",
    authorRole: "Administration ClassiNote",
    authorPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_61k79l2tb631XnCnlscoKumjMEHzDE5WNIQCCM0cbY2EdzqS-3Qz83kai9FPn_tkoUW7npZJnm4Apnz1EF7V3gLyfsLp7XovJ_HECfSjlgG55FJ7XTnALZ1XhmI1gM7QlMfH8XkEx8qMKEbDJJCX5sv-xsDuJOgXzgzwhBJgLJUr5CRx3v-F0E1-xJ50g9IJsO27ylL7GqiqYbJCZIK0Wb2m3Lpj4CEJTVFr492vF4Pb6qqM27k5KvmLES4DBDtumQutXrClhw",
    date: "10 Oct. 2023",
    type: "Information générale",
    badgeBg: "bg-blue-100",
    badgeTextColor: "text-blue-800",
    content: "Chers parents, n'oubliez pas que la réunion parents-professeurs aura lieu ce vendredi à partir de 17h30 dans le hall principal."
  },
  {
    id: "n4",
    childId: "child-1",
    authorName: "Coach Sport",
    authorRole: "Éducation Physique & Sportive",
    authorPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzVpi_89N5NkGuM1HV6Y4qujFodUXwm_6aqbESexncbqJRU0On1UL2YXRrpiZ6wJKD-QlVbXauUxCKINBKr5aDHMINEZiXtnTi7er7Rg1qrgbh7yLVdXFljp7buVjR9YDdxFIMqQJb6o9dbz5K5pvtTC0ij1sPSIDbWfNheQ9j0czmcY49RvCXUImVlWvB8xmnUa-H5jWPskVZkda1ERlamL6eQ2E2p_uyOzVF_rp1zqKYowDvMTeLkMX91YXgX4HY49ZKqVshtg",
    date: "08 Oct. 2023",
    type: "Félicitations",
    badgeBg: "bg-emerald-100",
    badgeTextColor: "text-emerald-800",
    content: "Excellente performance de Koffi lors du tournoi de basket inter-classes. Il a su porter son équipe avec un esprit sportif exemplaire."
  }
];

export const initialPayments: PaymentItem[] = [
  {
    id: "p1",
    childId: "child-1",
    title: "Scolarité Trimestre 2",
    date: "12 Oct 2023",
    amount: 150000,
    currency: "FCFA",
    status: "PAYÉ",
    iconName: "school",
    receiptNumber: "REC-2023-0094"
  },
  {
    id: "p2",
    childId: "child-1",
    title: "Cantine Octobre",
    date: "05 Oct 2023",
    amount: 35000,
    currency: "FCFA",
    status: "PAYÉ",
    iconName: "restaurant",
    receiptNumber: "REC-2023-0081"
  },
  {
    id: "p3",
    childId: "child-1",
    title: "Transport Scolaire",
    date: "01 Oct 2023",
    amount: 25000,
    currency: "FCFA",
    status: "EN ATTENTE",
    iconName: "directions_bus",
    dueDate: "30 Oct 2023"
  },
  {
    id: "p4",
    childId: "child-1",
    title: "Scolarité Trimestre 1",
    date: "15 Sep 2023",
    amount: 200000,
    currency: "FCFA",
    status: "PAYÉ",
    iconName: "school",
    receiptNumber: "REC-2023-0012"
  }
];

export const initialTimetable: TimetableClass[] = [
  // LUNDI
  {
    id: "t1",
    day: "LUN",
    dayNum: 14,
    startTime: "08:30",
    endTime: "10:00",
    subject: "Mathématiques",
    room: "Salle 204",
    teacherName: "M. Lefebvre",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKkHrMwTx2r5QS_3EdENfFZh9_MupBGs0mDW_87368P0uV89TY-E_z4ba5Vqq_dpI4k4JGtnrijCMk5pN-c6MnyXcw-gRw9UpVK1I0y6xKhriKgaozLhIELLQp9_3RhVuthRpoASktkzWmDvBpL603JiRv4PXjYjrARsLccWImm7cCGOoU2DtQ29Yfh1UF2QTU6C3wIfIsYCfGcHgvmqS2FIQir5cS4i7TfT_cNnrwFVjdOr1JyLSDlKJo6-ZQmhukp2_ZLQro3A",
    borderLeftColor: "border-[#375ca6]",
    bgColor: "bg-[#E6EEFF]",
    textColor: "text-[#00174a]",
    badgeBg: "bg-[#d9e2ff]",
    badgeText: "text-[#19448d]"
  },
  {
    id: "t2",
    day: "LUN",
    dayNum: 14,
    startTime: "10:15",
    endTime: "12:15",
    subject: "Français",
    room: "Salle 102",
    teacherName: "Mme. Dubois",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgzSBaoYh7JILv6nD4HuYQ5pEHr8ezFrbkzNsMDJ--sbbXsFfE-IAadOJff5qneENoNrsH6JdoZzHKS9ijblbedx3yPxxMgtcCdTYkSN4OdRuKbgcpY36Ba_R_NwHarRqDrwKCH9umZ__nVe3UJmRRjmVsirLE2Pqi2DkMxC3hhLFHN-btjyfMKUa8d6hxM7fpxd9FBFZPj_k7Ohv3SkD9iLoLPbhEZJIyY91aSs_1JTzCbJiKM0CJkHkWD7mcALTh1m9bqrP3VQ",
    borderLeftColor: "border-[#D97706]",
    bgColor: "bg-[#FFF5E6]",
    textColor: "text-[#451A03]",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#92400E]"
  },
  {
    id: "t3",
    day: "LUN",
    dayNum: 14,
    startTime: "13:30",
    endTime: "15:30",
    subject: "SVT",
    room: "Labo Bio",
    teacherName: "M. Robert",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIVRcbIXzEpPx0Jx10hDuK64UvMPMNBYEPkZ5pzg-0nJmIxdiC-kl0Zo9wW-VLh20waL0iE013t8MWJ9JPb58HzBNtWSAqz3aULm8TQdSpwdDy24rGofe-m9PvE7y17hZ6-9eO4-_wcUx9-vdkpjO1fRdkl8IZceo9ZX6AgMdF8I6uOn6D2CG-jDyzbjuwgR71TyLiNw7OYXlqqyxQp3j0re4imMTvfExkZHh7vV4BAdQWdAmKUKIJhqte4ysPUzyJZOw-ERSayQ",
    borderLeftColor: "border-[#16A34A]",
    bgColor: "bg-[#F0FDF4]",
    textColor: "text-[#064E3B]",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-[#15803D]"
  },
  {
    id: "t4",
    day: "LUN",
    dayNum: 14,
    startTime: "15:45",
    endTime: "17:15",
    subject: "Anglais",
    room: "Salle 301",
    teacherName: "Mrs. Thompson",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdLqgdIDkaJH5_QB7OoXYcHIaD0U6I54h9-dqG2ZHZMQWmfpvFHcVo-M8ocQ9hp3kgoOVdTAIBtrgq8JN_WxOCV-VlmLgGQV52td4tyDpoKrvPX3gKiqMkP2MQ0W-jcNgvrrdxyx_-u0BMBoVXFGuXOcBpR34lbCO7chfPjD8ocdSfssTjg4-JQVqveVk2rE3zAQ1k4Agwv9LpW1y7hBZveEisKS7vkfWxwC_amsmRJg1JmKwcIZv5x4NJ3vmZTzEUhH3iu8P78g",
    borderLeftColor: "border-[#9333EA]",
    bgColor: "bg-[#FAF5FF]",
    textColor: "text-[#3B0764]",
    badgeBg: "bg-[#F3E8FF]",
    badgeText: "text-[#7E22CE]"
  },
  // MARDI
  {
    id: "t5",
    day: "MAR",
    dayNum: 15,
    startTime: "08:30",
    endTime: "10:30",
    subject: "Histoire-Géographie",
    room: "Salle 105",
    teacherName: "M. Jean Dupont",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAe40Zn-L_AzZFjXyUUz1qAFomEwHEh3_yX1P2T-zYtAEOPgdH6C5HT6W23A6BLU9MScsktOAo8yAmrCVxYkvTB9T28XYl14BY7ole2JwBAh39DLgC7jyhw70W3lOwuafQ0InbZlLQztdkdB2X6zJ4OQfAdOeDEL-RsjNRo3ujDNW5CtTwc4UQcvfabGHcwa_0GAs7Yvu8j6tKv6xmD-XK578wrHG929MXkCFSKQAu8mKOttrXgsWNmN1Tah05Ew72W0Q31OIwgPA",
    borderLeftColor: "border-[#0284c7]",
    bgColor: "bg-[#f0f9ff]",
    textColor: "text-[#0369a1]",
    badgeBg: "bg-[#e0f2fe]",
    badgeText: "text-[#0369a1]"
  },
  {
    id: "t6",
    day: "MAR",
    dayNum: 15,
    startTime: "10:45",
    endTime: "12:15",
    subject: "Éducation Physique (EPS)",
    room: "Gymnase Central",
    teacherName: "Mme. Sarah Petit",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUmGpofHB22ZtktdqVdHcfqCv0jN7eYudAJ5plNRFj0verrG0ZDhNMqNaKUbEzEHsHB0fzcRCIAMItJPrBwwwLKfV6aYlQ1MFEwYQX4oGSE0HnHK-yfI6B9iFVlSB0p3Nb1ZyuHnE8Yj6Lx8AA4M-yx7MdCkpQ3LhcTAQTlOBbCqngaiWoMs6P-niFTgDWm3rg2QD1Y2l8cRfKfWOggKSFyrN6HssIigj8gxy-sL43MFZStdiUyLR8xFkA73MQGKT0IZBNPvwieQ",
    borderLeftColor: "border-[#16A34A]",
    bgColor: "bg-[#F0FDF4]",
    textColor: "text-[#064E3B]",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-[#15803D]"
  },
  // MERCREDI
  {
    id: "t7",
    day: "MER",
    dayNum: 16,
    startTime: "08:30",
    endTime: "11:30",
    subject: "Technologie & Informatique",
    room: "Salle Info 1",
    teacherName: "M. Marc Dujardin",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2PD6ALTp5eGXZpzFGYKlgHmzrHWGLIJLY_x1_Ekf_9F83VYYmpUJDYxfIEUFJUeJMkGUZ6oAktd51ke8lGbsdhsBkAjC_gjK88S1RHpNzGUc-zuMprxNEkSKMYhAnCZ2J9EcpLfvlVEhFoWXTkTaLkZB2QMUfoLdekBuoZw1hJ9cc2SmhG_BwgIXdypvSlhhuVyCaFA6-hi8CQlGT7ITg4CCd0C_wvH_7HweZJ8722LtCConTtiFgP0eSCmRnyenZca1716pupQ",
    borderLeftColor: "border-[#375ca6]",
    bgColor: "bg-[#E6EEFF]",
    textColor: "text-[#00174a]",
    badgeBg: "bg-[#d9e2ff]",
    badgeText: "text-[#19448d]"
  },
  // JEUDI
  {
    id: "t8",
    day: "JEU",
    dayNum: 17,
    startTime: "08:30",
    endTime: "10:30",
    subject: "Mathématiques",
    room: "Salle 204",
    teacherName: "Mme. Claire Morel",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7NEs2m7aGlt9f7B0T6GtKBGYFeyfT8W6UHVYuPOFsEXRwCMdAhkk5YNVbcfIfli8KUpL0TSqCx2VU1it_mFPgJmIRNVJ4Yd2iL0C1bj2afxKz6QzeJMaHEibA4oHwsGYAIFDj9UsFhvTg6xOZfRIWzwfA73myIiYibJGcjAPsJCPOjVsUe7kKr0EvhBFrOpfcWA1XaXOoqU_GH7WwziY6q3qw1g24Jg-x9b0Wyedtt84VPmcYlKpliSXBCMp8k7WB9kv7UcCAlw",
    borderLeftColor: "border-[#375ca6]",
    bgColor: "bg-[#E6EEFF]",
    textColor: "text-[#00174a]",
    badgeBg: "bg-[#d9e2ff]",
    badgeText: "text-[#19448d]"
  },
  // VENDREDI
  {
    id: "t9",
    day: "VEN",
    dayNum: 18,
    startTime: "09:00",
    endTime: "11:00",
    subject: "Arts Plastiques & Musique",
    room: "Atelier Art",
    teacherName: "Mme. Sophie Laurent",
    teacherPhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIinlOZui0esOx6Qr0WRMPtGP0FywMx_VJ6wGNUb14lAfMU4QAV-hbUsjTbKg54j5E4m3aMAOpPwrTNIBrT8o8LcmrLkTAL3Co_xLbhPoKdgUZHqd0BWV6mdlsUREdJDZi5Zvn076_m2ewGOTcH2K2bbzB3kb80oYgQf95O3QIk4abTUFcKbBjkMz8LL1qipgBQwoZEk30Gjum__BWHtoNMxRjco_VCDfni4bwoS5bt6ijYfDXRV7pe3KXjenADWVEnAWVm1n3kQ",
    borderLeftColor: "border-[#9333EA]",
    bgColor: "bg-[#FAF5FF]",
    textColor: "text-[#3B0764]",
    badgeBg: "bg-[#F3E8FF]",
    badgeText: "text-[#7E22CE]"
  }
];

export const initialStaff: StaffMember[] = [
  {
    id: "s1",
    name: "Jean-Marc Lefebvre",
    category: "administration",
    role: "Directeur",
    subtitle: "Direction Générale",
    photo: "",
    email: "direction@classinote.edu",
    phone: "+221 33 800 10 00",
    unreadCount: 0
  },
  {
    id: "s2",
    name: "Sophie Laurent",
    category: "administration",
    role: "Secrétariat",
    subtitle: "Inscriptions & Suivi",
    photo: "",
    email: "secretariat@classinote.edu",
    phone: "+221 33 800 10 00",
    unreadCount: 1
  },
  {
    id: "s3",
    name: "Marc Dujardin",
    category: "administration",
    role: "Responsable",
    subtitle: "Pédagogie & Innovation",
    photo: "",
    email: "pedagogie@classinote.edu",
    phone: "+221 33 800 10 00",
    unreadCount: 0
  },
  {
    id: "s4",
    name: "Mme. Claire Morel",
    category: "enseignants",
    role: "Enseignante",
    subtitle: "Mathématiques",
    photo: "",
    subject: "MATHÉMATIQUES",
    classes: ["6ème A"],
    days: ["Lun", "Jeu"],
    email: "c.morel@classinote.edu",
    unreadCount: 2
  },
  {
    id: "s5",
    name: "M. Thomas Bernard",
    category: "enseignants",
    role: "Enseignant",
    subtitle: "Français",
    photo: "",
    subject: "FRANÇAIS",
    classes: ["6ème A", "5ème B"],
    days: ["Mar", "Mer", "Ven"],
    email: "t.bernard@classinote.edu",
    unreadCount: 1
  },
  {
    id: "s6",
    name: "M. Alain Fischer",
    category: "enseignants",
    role: "Enseignant",
    subtitle: "Sciences (SVT)",
    photo: "",
    subject: "SCIENCES (SVT)",
    classes: ["6ème A"],
    days: ["Jeu", "Ven"],
    email: "a.fischer@classinote.edu",
    unreadCount: 0
  },
  {
    id: "s7",
    name: "Mme. Sarah Petit",
    category: "enseignants",
    role: "Enseignante",
    subtitle: "EPS",
    photo: "",
    subject: "EPS",
    classes: ["Toutes classes"],
    days: ["Mer", "Ven"],
    email: "s.petit@classinote.edu",
    unreadCount: 0
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    teacherId: "s4",
    sender: "teacher",
    text: "Bonjour Mme Mensah, je voulais vous informer des excellents progrès de Koffi en géométrie cette semaine !",
    timestamp: "Hier, 16:30"
  },
  {
    id: "msg-2",
    teacherId: "s4",
    sender: "teacher",
    text: "Voici le support d'exercice pour réviser l'évaluation de lundi.",
    timestamp: "Aujourd'hui, 09:15",
    attachments: [
      { name: "Devoir_Maths_Revisions.pdf", size: "1.2 Mo", type: "doc" }
    ]
  },
  {
    id: "msg-3",
    teacherId: "s5",
    sender: "teacher",
    text: "Bonjour, n'oubliez pas d'apporter le manuel de littérature pour le cours de demain.",
    timestamp: "Hier, 14:10"
  },
  {
    id: "msg-4",
    teacherId: "s2",
    sender: "teacher",
    text: "Bonjour Mme Mensah, l'attestation de scolarité de Koffi est prête. Vous pouvez venir la récupérer au secrétariat ou nous la demander par e-mail.",
    timestamp: "Aujourd'hui, 08:30"
  }
];


export const initialAttendance: AttendanceRecord[] = [
  {
    id: "att-1",
    childId: "child-1",
    date: "Aujourd'hui, 24 Juil.",
    time: "08:30 - 10:00",
    type: "PRÉSENCE",
    subject: "Mathématiques",
    justified: true
  },
  {
    id: "att-2",
    childId: "child-1",
    date: "Aujourd'hui, 24 Juil.",
    time: "10:15 - 12:15",
    type: "PRÉSENCE",
    subject: "Français",
    justified: true
  },
  {
    id: "att-3",
    childId: "child-1",
    date: "18 Juil. 2024",
    time: "14:00 - 15:30",
    type: "RETARD",
    subject: "Histoire-Géo",
    justified: true,
    reason: "Rendez-vous médical (motif transmis)"
  },
  {
    id: "att-4",
    childId: "child-1",
    date: "10 Juil. 2024",
    time: "08:30 - 12:15",
    type: "ABSENCE",
    subject: "Matinée complète",
    justified: true,
    reason: "Grippe saisonnière (certificat médical transmis)"
  },
  {
    id: "att-5",
    childId: "child-1",
    date: "25 Juin 2024",
    time: "13:30 - 15:30",
    type: "PRÉSENCE",
    subject: "Sciences de la Vie"
  },
  {
    id: "att-6",
    childId: "child-2",
    date: "Aujourd'hui, 24 Juil.",
    time: "08:30 - 10:00",
    type: "PRÉSENCE",
    subject: "Physique-Chimie"
  }
];
