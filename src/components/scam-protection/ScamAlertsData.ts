export interface ScamAlert {
  id: string;
  title: string;
  description: string;
  category: 'sms' | 'email' | 'telephone' | 'social' | 'porte-a-porte' | 'web';
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
  },
  {
    id: 6,
    question: "Un technicien Microsoft vous appelle pour un virus sur votre ordinateur. Il veut prendre le contrôle à distance. Que faites-vous ?",
    options: [
      {
        text: "Je le laisse se connecter à mon ordinateur car c'est Microsoft",
        isCorrect: false,
        explanation: "Jamais ! Microsoft n'appelle JAMAIS ses clients directement. C'est une arnaque très courante."
      },
      {
        text: "Je raccroche immédiatement",
        isCorrect: true,
        explanation: "Parfait ! C'est l'arnaque au faux support technique. Microsoft ne vous appellera jamais. Raccrochez et signalez au 0 805 805 817."
      },
      {
        text: "Je lui demande une preuve qu'il travaille chez Microsoft",
        isCorrect: false,
        explanation: "Non ! Les escrocs ont des réponses toutes prêtes. Ne perdez pas de temps, raccrochez."
      }
    ]
  },
  {
    id: 7,
    question: "Vous recevez un email de votre banque avec un lien. L'adresse est « service-client@banque-secure-update.com ». Que faites-vous ?",
    options: [
      {
        text: "L'adresse a l'air officielle, je clique",
        isCorrect: false,
        explanation: "Non ! L'adresse est fausse. Une vraie banque utilise son propre domaine (ex: @bnpparibas.fr, @credit-agricole.fr)."
      },
      {
        text: "Je vérifie l'adresse email — elle ne correspond pas au domaine officiel de ma banque",
        isCorrect: true,
        explanation: "Excellent ! Vérifier l'adresse email est un réflexe essentiel. Les escrocs créent des adresses qui ressemblent aux vraies."
      },
      {
        text: "Je transfère l'email à un ami pour qu'il vérifie",
        isCorrect: false,
        explanation: "Non ! Ne transférez jamais un email suspect. Vérifiez l'adresse vous-même ou demandez à Oscar."
      }
    ]
  },
  {
    id: 8,
    question: "Quelqu'un sonne à votre porte et dit venir de la part d'EDF pour un contrôle. Il veut entrer chez vous. Que faites-vous ?",
    options: [
      {
        text: "Je le laisse entrer car c'est EDF",
        isCorrect: false,
        explanation: "Attention ! Les vrais techniciens EDF préviennent toujours par courrier avant une visite et ont une carte professionnelle."
      },
      {
        text: "Je lui demande sa carte professionnelle et j'appelle EDF pour vérifier",
        isCorrect: true,
        explanation: "Très bien ! Demandez toujours une pièce d'identité professionnelle et vérifiez en appelant l'organisme au numéro officiel."
      },
      {
        text: "Je refuse catégoriquement sans discuter",
        isCorrect: false,
        explanation: "Refuser n'est pas faux, mais le mieux est de vérifier. Demandez sa carte et appelez EDF au numéro officiel (3004)."
      }
    ]
  },
  {
    id: 9,
    question: "Vous recevez un SMS de la vignette Crit'Air vous demandant de commander votre vignette en urgence via un lien. Que faites-vous ?",
    options: [
      {
        text: "Je commande vite avant l'amende",
        isCorrect: false,
        explanation: "C'est une arnaque ! Le site officiel est uniquement certificat-air.gouv.fr. Les SMS de ce type sont frauduleux."
      },
      {
        text: "J'ignore le SMS et je vais directement sur certificat-air.gouv.fr",
        isCorrect: true,
        explanation: "Bravo ! La vignette Crit'Air ne se commande que sur le site officiel. Les SMS sont toujours des arnaques."
      },
      {
        text: "Je clique pour vérifier si le site est officiel",
        isCorrect: false,
        explanation: "Non ! Même « vérifier » le site est dangereux. Les sites frauduleux sont très convaincants."
      }
    ]
  },
  {
    id: 10,
    question: "Un email vous dit que vous avez gagné un iPhone. Il faut payer 1€ de frais de livraison. Que faites-vous ?",
    options: [
      {
        text: "C'est seulement 1€, je paie pour recevoir l'iPhone",
        isCorrect: false,
        explanation: "C'est un piège ! Les 1€ servent à récupérer vos coordonnées bancaires. Vous ne recevrez jamais d'iPhone."
      },
      {
        text: "C'est trop beau pour être vrai, je supprime l'email",
        isCorrect: true,
        explanation: "Parfait ! Si c'est trop beau pour être vrai, c'est une arnaque. Personne ne donne d'iPhone gratuitement."
      },
      {
        text: "Je partage l'offre avec ma famille au cas où c'est vrai",
        isCorrect: false,
        explanation: "Non ! Vous propageriez l'arnaque à vos proches. Supprimez-le immédiatement."
      }
    ]
  },
  {
    id: 11,
    question: "Un message sur WhatsApp d'un numéro inconnu dit : « Bonjour maman, j'ai changé de numéro ». Que faites-vous ?",
    options: [
      {
        text: "Je réponds en pensant que c'est mon enfant",
        isCorrect: false,
        explanation: "Attention ! C'est l'arnaque au faux enfant. Les escrocs vont ensuite vous demander de l'argent en urgence."
      },
      {
        text: "J'appelle mon enfant sur son ancien numéro pour vérifier",
        isCorrect: true,
        explanation: "Excellent réflexe ! Toujours vérifier en appelant directement votre enfant sur le numéro que vous connaissez."
      },
      {
        text: "Je demande au nouveau numéro de me prouver que c'est bien mon enfant",
        isCorrect: false,
        explanation: "Non ! Les escrocs peuvent connaître des détails personnels via les réseaux sociaux. Appelez le vrai numéro."
      }
    ]
  },
  {
    id: 12,
    question: "Votre voisin vous dit qu'un homme en costume lui a proposé de rénover sa toiture pour « seulement 500€ cash ». Que lui conseillez-vous ?",
    options: [
      {
        text: "C'est une bonne affaire, il devrait accepter",
        isCorrect: false,
        explanation: "Non ! Le démarchage à domicile avec paiement en cash est un signe classique d'arnaque aux travaux."
      },
      {
        text: "Refuser et ne jamais payer en espèces un inconnu qui démarche",
        isCorrect: true,
        explanation: "Très bien ! Ne jamais payer cash un démarcheur. Demandez toujours plusieurs devis écrits et vérifiez l'entreprise."
      },
      {
        text: "Demander une facture et payer ensuite",
        isCorrect: false,
        explanation: "La facture peut être fausse. Le bon réflexe : ne jamais accepter de travaux d'un démarcheur au porte-à-porte sans vérifier."
      }
    ]
  },
  {
    id: 13,
    question: "Vous recevez un courrier officiel vous demandant de payer une amende par carte cadeau ou coupon PCS. Que faites-vous ?",
    options: [
      {
        text: "Je paie avec la carte cadeau pour éviter les ennuis",
        isCorrect: false,
        explanation: "Jamais ! Aucune administration ne demande un paiement par carte cadeau. C'est toujours une arnaque."
      },
      {
        text: "C'est une arnaque — aucune administration ne demande un paiement par carte cadeau",
        isCorrect: true,
        explanation: "Parfait ! Les paiements officiels se font par chèque, virement ou sur les sites officiels. Les cartes cadeaux = arnaque."
      },
      {
        text: "J'appelle le numéro indiqué sur le courrier pour vérifier",
        isCorrect: false,
        explanation: "Non ! Le numéro sur le courrier est celui des escrocs. Allez directement sur le site officiel de l'administration."
      }
    ]
  },
  {
    id: 14,
    question: "Un site web vous propose un placement financier à 15% de rendement garanti. Que faites-vous ?",
    options: [
      {
        text: "J'investis car 15% c'est très intéressant",
        isCorrect: false,
        explanation: "C'est une arnaque ! Aucun placement sérieux ne garantit 15%. Les rendements élevés garantis sont toujours frauduleux."
      },
      {
        text: "Je vérifie si l'organisme est enregistré sur le site de l'AMF (regafi.fr)",
        isCorrect: true,
        explanation: "Excellent ! Vérifiez toujours sur le site de l'Autorité des Marchés Financiers (AMF) que l'organisme est autorisé."
      },
      {
        text: "Je demande à un ami s'il connaît ce placement",
        isCorrect: false,
        explanation: "Un ami peut aussi se faire piéger. Seule l'AMF peut confirmer la légitimité d'un placement financier."
      }
    ]
  },
  {
    id: 15,
    question: "Un QR code collé sur un parcmètre vous invite à payer votre stationnement en scannant. Que faites-vous ?",
    options: [
      {
        text: "Je scanne le QR code et je paie directement",
        isCorrect: false,
        explanation: "Attention ! Des escrocs collent de faux QR codes sur les parcmètres. Vous serez redirigé vers un faux site."
      },
      {
        text: "Je paie via l'application officielle de stationnement ou au parcmètre directement",
        isCorrect: true,
        explanation: "Parfait ! Utilisez toujours l'application officielle (PayByPhone, EasyPark...) ou le parcmètre lui-même. Méfiez-vous des QR codes collés."
      },
      {
        text: "Je vérifie si le QR code a l'air officiel",
        isCorrect: false,
        explanation: "Impossible de distinguer un vrai QR code d'un faux à l'œil nu. Utilisez l'app officielle."
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

// Alertes de fallback affichées quand la base de données est vide
export const fallbackAlerts: ScamAlert[] = [
  {
    id: 'fallback-1',
    title: "Faux SMS de la vignette Crit'Air",
    description: "Des SMS frauduleux circulent massivement, vous demandant de commander votre vignette Crit'Air via un lien. Le site officiel est uniquement certificat-air.gouv.fr. Ne cliquez jamais sur ces liens.",
    category: 'sms',
    danger_level: 'high',
    date_detected: new Date().toISOString(),
    source: "cybermalveillance.gouv.fr"
  },
  {
    id: 'fallback-2',
    title: "Arnaque au faux conseiller bancaire",
    description: "Des escrocs se font passer pour votre banque et vous appellent pour vous signaler un problème sur votre compte. Ils demandent vos codes ou vous font valider des opérations. Votre banque ne vous demandera JAMAIS vos codes par téléphone.",
    category: 'telephone',
    danger_level: 'high',
    date_detected: new Date().toISOString(),
    source: "Banque de France"
  },
  {
    id: 'fallback-3',
    title: "Faux emails de remboursement des impôts",
    description: "Des emails imitant les impôts vous annoncent un remboursement et vous demandent de cliquer sur un lien. Les impôts ne demandent jamais vos coordonnées bancaires par email. Connectez-vous sur impots.gouv.fr directement.",
    category: 'email',
    danger_level: 'high',
    date_detected: new Date().toISOString(),
    source: "DGFIP"
  },
  {
    id: 'fallback-4',
    title: "Arnaque au faux enfant sur WhatsApp",
    description: "Vous recevez un message « Bonjour maman/papa, j'ai changé de numéro ». L'escroc prétend être votre enfant puis demande de l'argent en urgence. Vérifiez toujours en appelant votre enfant sur son vrai numéro.",
    category: 'social',
    danger_level: 'high',
    date_detected: new Date().toISOString(),
    source: "Signal Spam"
  },
  {
    id: 'fallback-5',
    title: "Démarchage abusif à domicile — faux artisans",
    description: "Des personnes se présentent à votre porte en proposant des travaux urgents (toiture, isolation) à prix cassé avec paiement en espèces. Ne payez jamais en cash un démarcheur et demandez toujours plusieurs devis écrits.",
    category: 'porte-a-porte',
    danger_level: 'medium',
    date_detected: new Date().toISOString(),
    source: "DGCCRF"
  },
  {
    id: 'fallback-6',
    title: "Faux QR codes sur les parcmètres",
    description: "Des escrocs collent de faux QR codes sur les parcmètres et horodateurs. En les scannant, vous êtes redirigé vers un faux site de paiement. Utilisez toujours l'application officielle de stationnement.",
    category: 'web',
    danger_level: 'medium',
    date_detected: new Date().toISOString(),
    source: "Police Nationale"
  }
];

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'sms': return '📱';
    case 'email': return '📧';
    case 'telephone': return '📞';
    case 'social': return '💔';
    case 'web': return '🌐';
    case 'courrier': return '✉️';
    case 'porte-a-porte': return '🚪';
    default: return '⚠️';
  }
};

export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    case 'telephone': return 'Téléphone';
    case 'social': return 'Réseaux sociaux';
    case 'web': return 'Internet';
    case 'courrier': return 'Courrier';
    case 'porte-a-porte': return 'Porte-à-porte';
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
