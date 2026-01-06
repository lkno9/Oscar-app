export interface ScamAlert {
  id: string;
  title: string;
  description: string;
  category: 'sms' | 'email' | 'telephone' | 'social';
  danger_level: 'low' | 'medium' | 'high';
  date_detected: string;
  source?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const securityQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Vous recevez un SMS disant que votre carte vitale expire. Que faites-vous ?",
    options: [
      {
        text: "Je clique sur le lien pour mettre à jour mes informations",
        isCorrect: false,
        explanation: "Non ! L'Assurance Maladie ne demande jamais de mise à jour par SMS. C'est une arnaque."
      },
      {
        text: "J'ignore le message et je le supprime",
        isCorrect: true,
        explanation: "Bravo ! La carte vitale n'expire pas. C'est une arnaque classique. En cas de doute, appelez le 3646."
      },
      {
        text: "Je rappelle le numéro indiqué dans le SMS",
        isCorrect: false,
        explanation: "Non ! Le numéro appartient aux escrocs. Ne jamais rappeler un numéro reçu par SMS suspect."
      }
    ]
  },
  {
    id: 2,
    question: "Quelqu'un vous appelle en disant être votre conseiller bancaire. Il demande vos codes. Que faites-vous ?",
    options: [
      {
        text: "Je donne mes codes car c'est urgent",
        isCorrect: false,
        explanation: "Jamais ! Votre banque ne vous demandera JAMAIS vos codes par téléphone."
      },
      {
        text: "Je raccroche et j'appelle ma banque avec le numéro officiel",
        isCorrect: true,
        explanation: "Parfait ! Raccrochez toujours et vérifiez en appelant le numéro officiel de votre banque."
      },
      {
        text: "Je donne une partie de mes codes seulement",
        isCorrect: false,
        explanation: "Non ! Même une partie des codes peut permettre aux escrocs d'accéder à votre compte."
      }
    ]
  },
  {
    id: 3,
    question: "Un email vous annonce un remboursement des impôts de 200€. Il faut cliquer sur un lien. Que faites-vous ?",
    options: [
      {
        text: "Je clique pour récupérer mon argent rapidement",
        isCorrect: false,
        explanation: "C'est une arnaque ! Les impôts ne demandent jamais vos coordonnées bancaires par email."
      },
      {
        text: "Je transfère l'email à mes amis pour les prévenir de cette bonne nouvelle",
        isCorrect: false,
        explanation: "Non ! Vous propageriez l'arnaque. Ne jamais transférer ce type d'email."
      },
      {
        text: "Je me connecte directement sur impots.gouv.fr pour vérifier",
        isCorrect: true,
        explanation: "Excellent réflexe ! Toujours vérifier sur le site officiel, jamais via un lien dans un email."
      }
    ]
  },
  {
    id: 4,
    question: "Vous recevez un SMS pour un colis avec des frais de 1,99€ à payer. Que faites-vous ?",
    options: [
      {
        text: "Je paie les 1,99€ pour recevoir mon colis",
        isCorrect: false,
        explanation: "Attention ! C'est une arnaque classique. La Poste ne demande jamais de paiement par SMS."
      },
      {
        text: "Je vérifie si j'attends vraiment un colis et je contacte le vendeur",
        isCorrect: true,
        explanation: "Très bien ! Vérifiez toujours auprès du vendeur ou sur le site officiel du transporteur."
      },
      {
        text: "Je clique pour voir de quel colis il s'agit",
        isCorrect: false,
        explanation: "Non ! Le lien mène à un site frauduleux qui volera vos informations bancaires."
      }
    ]
  },
  {
    id: 5,
    question: "Une personne rencontrée en ligne depuis 2 mois vous demande de l'argent pour une urgence. Que faites-vous ?",
    options: [
      {
        text: "J'envoie l'argent car je lui fais confiance",
        isCorrect: false,
        explanation: "C'est une arnaque sentimentale ! Ne jamais envoyer d'argent à quelqu'un que vous n'avez pas rencontré en vrai."
      },
      {
        text: "Je demande à voir cette personne en visio avant d'envoyer l'argent",
        isCorrect: false,
        explanation: "Même en visio, ça peut être une arnaque (deepfake). N'envoyez jamais d'argent à un inconnu."
      },
      {
        text: "Je refuse et je coupe les contacts",
        isCorrect: true,
        explanation: "Bravo ! C'est une arnaque sentimentale classique. Coupez tout contact et ne culpabilisez pas."
      }
    ]
  }
];

export const safetyTips = [
  {
    id: 1,
    title: "Ne cliquez jamais sur un lien dans un SMS",
    description: "Les administrations officielles (Ameli, impôts, CAF, banques) ne vous demanderont jamais de cliquer sur un lien par SMS. Connectez-vous toujours directement sur leur site officiel.",
    icon: "🔗"
  },
  {
    id: 2,
    title: "Ne donnez jamais vos codes par téléphone",
    description: "Votre banque, la police ou tout organisme officiel ne vous demandera JAMAIS vos codes secrets, mots de passe ou numéros de carte bancaire par téléphone.",
    icon: "🔐"
  },
  {
    id: 3,
    title: "Méfiez-vous des urgences artificielles",
    description: "Les escrocs créent de fausses urgences pour vous faire agir vite. Prenez toujours le temps de réfléchir et de vérifier avant d'agir.",
    icon: "⏰"
  },
  {
    id: 4,
    title: "Vérifiez l'adresse email de l'expéditeur",
    description: "Les emails officiels viennent de domaines comme @ameli.fr, @dgfip.finances.gouv.fr. Méfiez-vous des adresses bizarre ou avec des fautes.",
    icon: "📧"
  },
  {
    id: 5,
    title: "Ne rappelez jamais un numéro inconnu",
    description: "Si on vous demande de rappeler un numéro, vérifiez d'abord sur internet s'il est officiel. Les escrocs utilisent des numéros qui ressemblent aux vrais.",
    icon: "📞"
  },
  {
    id: 6,
    title: "N'envoyez jamais d'argent à un inconnu",
    description: "Que ce soit par virement, mandat cash ou cartes cadeaux, n'envoyez jamais d'argent à quelqu'un que vous n'avez pas rencontré en personne.",
    icon: "💸"
  },
  {
    id: 7,
    title: "En cas de doute, demandez à Oscar",
    description: "Vous pouvez me montrer n'importe quel message suspect et je vous dirai s'il s'agit d'une arnaque. N'hésitez jamais à me demander !",
    icon: "🤖"
  }
];

export const emergencyContacts = [
  {
    id: 1,
    name: "Info Escroqueries",
    number: "0 805 805 817",
    description: "Numéro gratuit pour signaler une arnaque et obtenir des conseils",
    hours: "Lundi-Vendredi 9h-18h30"
  },
  {
    id: 2,
    name: "Cybermalveillance.gouv.fr",
    url: "https://www.cybermalveillance.gouv.fr",
    description: "Plateforme officielle d'assistance aux victimes de cybermalveillance",
    hours: "24h/24"
  },
  {
    id: 3,
    name: "Signal Spam",
    number: "33700",
    description: "Transférez les SMS frauduleux à ce numéro pour les signaler",
    hours: "24h/24"
  },
  {
    id: 4,
    name: "Pharos (Internet)",
    url: "https://www.internet-signalement.gouv.fr",
    description: "Signaler un contenu illicite sur internet",
    hours: "24h/24"
  }
];

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'sms': return '📱';
    case 'email': return '📧';
    case 'telephone': return '📞';
    case 'social': return '💔';
    default: return '⚠️';
  }
};

export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    case 'telephone': return 'Téléphone';
    case 'social': return 'Réseaux sociaux';
    default: return 'Autre';
  }
};

export const getDangerColor = (level: string): string => {
  switch (level) {
    case 'high': return 'bg-destructive text-destructive-foreground';
    case 'medium': return 'bg-amber-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getDangerLabel = (level: string): string => {
  switch (level) {
    case 'high': return 'Danger élevé';
    case 'medium': return 'Prudence';
    case 'low': return 'Faible risque';
    default: return 'Inconnu';
  }
};
