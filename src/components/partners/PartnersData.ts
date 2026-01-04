export type PartnerCategory = 'sante' | 'logement' | 'aide' | 'transport' | 'loisirs' | 'finances';

export interface PartnerService {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string;
  whyWeRecommend: string;
  promoCode?: string;
  promoValue?: string;
  affiliateUrl: string;
  infoUrl?: string;
  icon: string;
  tags: string[];
  isPartner: boolean; // true = affiliation, false = recommandation gratuite
}

export const categoryLabels: Record<PartnerCategory, { label: string; emoji: string; description: string }> = {
  sante: {
    label: "Santé",
    emoji: "🏥",
    description: "Mutuelles, téléassistance et services de santé"
  },
  logement: {
    label: "Logement",
    emoji: "🏠",
    description: "Énergie, adaptation du domicile et services"
  },
  aide: {
    label: "Aide à domicile",
    emoji: "🤝",
    description: "Portage de repas, aide ménagère et accompagnement"
  },
  transport: {
    label: "Transport",
    emoji: "🚗",
    description: "Cartes de réduction et mobilité adaptée"
  },
  loisirs: {
    label: "Loisirs",
    emoji: "🎭",
    description: "Voyages, culture et activités"
  },
  finances: {
    label: "Finances",
    emoji: "💰",
    description: "Banques, assurances et gestion du patrimoine"
  }
};

export const partnerServices: PartnerService[] = [
  // === SANTÉ ===
  {
    id: "alan-senior",
    name: "Alan",
    category: "sante",
    description: "La mutuelle 100% digitale avec un service client ultra-réactif et une app simple à utiliser.",
    whyWeRecommend: "Remboursements rapides, app claire et service client par chat très réactif. Idéal pour ceux qui veulent du simple.",
    promoCode: "OSCAR50",
    promoValue: "50€ offerts",
    affiliateUrl: "https://alan.com/?utm_source=oscar&utm_medium=affiliate",
    icon: "💚",
    tags: ["Mutuelle", "Digital", "Rapide"],
    isPartner: true
  },
  {
    id: "filien-teleassistance",
    name: "Filien ADMR",
    category: "sante",
    description: "Téléassistance discrète avec médaillon ou montre connectée. Assistance 24h/24.",
    whyWeRecommend: "Réseau ADMR reconnu, équipements discrets et élégants, intervention rapide en cas de besoin.",
    promoValue: "1 mois offert",
    affiliateUrl: "https://www.filien.com/?utm_source=oscar&utm_medium=affiliate",
    icon: "⌚",
    tags: ["Téléassistance", "24h/24", "Discret"],
    isPartner: true
  },
  {
    id: "doctolib",
    name: "Doctolib",
    category: "sante",
    description: "Prenez rendez-vous avec un médecin en quelques clics, ou faites une téléconsultation.",
    whyWeRecommend: "Service gratuit et très pratique pour trouver un médecin disponible rapidement.",
    affiliateUrl: "https://www.doctolib.fr/",
    icon: "👨‍⚕️",
    tags: ["Médecin", "Gratuit", "Téléconsultation"],
    isPartner: false
  },

  // === LOGEMENT ===
  {
    id: "soliha",
    name: "SOLIHA",
    category: "logement",
    description: "Conseil gratuit pour adapter votre logement au vieillissement (rampes, douche, etc.).",
    whyWeRecommend: "Association reconnue d'utilité publique, conseils gratuits et accompagnement pour les aides financières.",
    affiliateUrl: "https://www.soliha.fr/",
    icon: "🔧",
    tags: ["Adaptation", "Gratuit", "Conseil"],
    isPartner: false
  },
  {
    id: "octopus-energy",
    name: "Octopus Energy",
    category: "logement",
    description: "Fournisseur d'électricité verte avec des prix transparents et un service client humain.",
    whyWeRecommend: "Prix parmi les moins chers du marché, énergie 100% renouvelable, et service client vraiment disponible.",
    promoValue: "50€ sur votre facture",
    affiliateUrl: "https://octopusenergy.fr/?utm_source=oscar&utm_medium=affiliate",
    icon: "🐙",
    tags: ["Électricité", "Économies", "Vert"],
    isPartner: true
  },
  {
    id: "engie-home",
    name: "Engie Home Services",
    category: "logement",
    description: "Entretien chaudière, dépannage et installation d'équipements de confort.",
    whyWeRecommend: "Techniciens qualifiés, interventions rapides et contrats d'entretien clairs.",
    affiliateUrl: "https://www.engie-homeservices.fr/?utm_source=oscar&utm_medium=affiliate",
    icon: "🔥",
    tags: ["Chauffage", "Entretien", "Dépannage"],
    isPartner: true
  },

  // === AIDE À DOMICILE ===
  {
    id: "les-menus-services",
    name: "Les Menus Services",
    category: "aide",
    description: "Portage de repas équilibrés à domicile, adaptés aux régimes spéciaux.",
    whyWeRecommend: "Repas variés et savoureux, livraison ponctuelle, possibilité de menus sans sel, diabétiques, etc.",
    promoValue: "1ère semaine offerte",
    affiliateUrl: "https://www.les-menus-services.com/?utm_source=oscar&utm_medium=affiliate",
    icon: "🍽️",
    tags: ["Repas", "Livraison", "Équilibré"],
    isPartner: true
  },
  {
    id: "o2-care",
    name: "O2 Care Services",
    category: "aide",
    description: "Aide ménagère, accompagnement sorties, garde de nuit et aide aux repas.",
    whyWeRecommend: "Personnel formé et bienveillant, flexibilité des interventions, tarifs avec crédit d'impôt.",
    affiliateUrl: "https://www.o2.fr/?utm_source=oscar&utm_medium=affiliate",
    icon: "🧹",
    tags: ["Ménage", "Accompagnement", "Crédit impôt"],
    isPartner: true
  },
  {
    id: "ccas",
    name: "CCAS de votre commune",
    category: "aide",
    description: "Centre Communal d'Action Sociale : renseignez-vous sur les aides locales disponibles.",
    whyWeRecommend: "Service public gratuit, premier interlocuteur pour connaître toutes les aides auxquelles vous avez droit.",
    affiliateUrl: "https://www.service-public.fr/particuliers/vosdroits/F869",
    icon: "🏛️",
    tags: ["Aides", "Gratuit", "Local"],
    isPartner: false
  },

  // === TRANSPORT ===
  {
    id: "sncf-avantage",
    name: "Carte Avantage Senior SNCF",
    category: "transport",
    description: "30% de réduction garantie sur tous vos trajets en TGV et Intercités.",
    whyWeRecommend: "Rentabilisée dès 2-3 voyages par an, réductions toute l'année sans conditions.",
    affiliateUrl: "https://www.sncf-connect.com/app/catalogue/carte-avantage-senior",
    icon: "🚄",
    tags: ["-30%", "Train", "Garanti"],
    isPartner: false
  },
  {
    id: "ulysse-transport",
    name: "Ulysse",
    category: "transport",
    description: "VTC adapté aux personnes à mobilité réduite, avec chauffeurs formés.",
    whyWeRecommend: "Véhicules adaptés, chauffeurs patients et formés, réservation simple.",
    promoCode: "OSCAR15",
    promoValue: "15€ offerts",
    affiliateUrl: "https://www.ulysse.co/?utm_source=oscar&utm_medium=affiliate",
    icon: "🚐",
    tags: ["VTC", "Adapté", "PMR"],
    isPartner: true
  },

  // === LOISIRS ===
  {
    id: "senior-vacances",
    name: "Seniors en Vacances",
    category: "loisirs",
    description: "Séjours vacances à petits prix avec l'ANCV, partez en groupe ou seul.",
    whyWeRecommend: "Programme national avec aides financières possibles, destinations variées en France.",
    affiliateUrl: "https://www.ancv.com/seniors-en-vacances",
    icon: "🏖️",
    tags: ["Vacances", "Aides", "Groupe"],
    isPartner: false
  },
  {
    id: "funmooc",
    name: "FUN MOOC",
    category: "loisirs",
    description: "Cours en ligne gratuits des universités françaises sur tous les sujets.",
    whyWeRecommend: "100% gratuit, apprenez à votre rythme, certificats disponibles.",
    affiliateUrl: "https://www.fun-mooc.fr/",
    icon: "🎓",
    tags: ["Cours", "Gratuit", "Culture"],
    isPartner: false
  },
  {
    id: "audible",
    name: "Audible",
    category: "loisirs",
    description: "Livres audio à écouter partout : romans, biographies, policiers...",
    whyWeRecommend: "Catalogue immense, qualité audio excellente, 1 livre inclus par mois.",
    promoValue: "30 jours gratuits",
    affiliateUrl: "https://www.audible.fr/?utm_source=oscar&utm_medium=affiliate",
    icon: "🎧",
    tags: ["Livres audio", "Écoute", "Romans"],
    isPartner: true
  },

  // === FINANCES ===
  {
    id: "boursorama",
    name: "Boursorama Banque",
    category: "finances",
    description: "Banque en ligne gratuite avec carte bancaire incluse et app simple.",
    whyWeRecommend: "0€ de frais bancaires, app intuitive, service client disponible par téléphone.",
    promoValue: "150€ offerts",
    affiliateUrl: "https://www.boursorama.com/?utm_source=oscar&utm_medium=affiliate",
    icon: "🏦",
    tags: ["Banque", "Gratuit", "Simple"],
    isPartner: true
  },
  {
    id: "afer",
    name: "AFER",
    category: "finances",
    description: "Association d'épargnants pour l'assurance-vie, conseil indépendant.",
    whyWeRecommend: "Association à but non lucratif, frais réduits, accompagnement personnalisé.",
    affiliateUrl: "https://www.afer.fr/",
    icon: "📈",
    tags: ["Épargne", "Assurance-vie", "Conseil"],
    isPartner: false
  }
];

export const getServicesByCategory = (category: PartnerCategory): PartnerService[] => {
  return partnerServices.filter(service => service.category === category);
};

export const getAllCategories = (): PartnerCategory[] => {
  return Object.keys(categoryLabels) as PartnerCategory[];
};
