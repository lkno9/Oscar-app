export interface TaskStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: TaskStep[];
  estimatedDays: number;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'carte_identite',
    title: "Renouveler sa carte d'identité",
    description: "Renouvellement de la carte nationale d'identité",
    category: 'identite',
    estimatedDays: 60,
    steps: [
      { id: 1, title: "Préparer les documents", description: "Ancienne carte, photo d'identité récente, justificatif de domicile", completed: false },
      { id: 2, title: "Prendre rendez-vous en mairie", description: "Appeler ou réserver en ligne sur le site de votre mairie", completed: false },
      { id: 3, title: "Se rendre au rendez-vous", description: "Avec tous les documents originaux", completed: false },
      { id: 4, title: "Attendre la fabrication", description: "Délai de 1 à 3 mois selon la période", completed: false },
      { id: 5, title: "Récupérer la nouvelle carte", description: "Retour en mairie avec l'ancien récépissé", completed: false }
    ]
  },
  {
    id: 'apa',
    title: "Demander l'APA",
    description: "Allocation Personnalisée d'Autonomie",
    category: 'aides',
    estimatedDays: 90,
    steps: [
      { id: 1, title: "Retirer le dossier", description: "Au conseil départemental ou télécharger sur le site", completed: false },
      { id: 2, title: "Remplir le dossier", description: "Avec l'aide d'un proche si besoin", completed: false },
      { id: 3, title: "Obtenir le certificat médical", description: "Consulter votre médecin traitant", completed: false },
      { id: 4, title: "Déposer le dossier complet", description: "Au conseil départemental avec toutes les pièces", completed: false },
      { id: 5, title: "Recevoir la visite d'évaluation", description: "Un professionnel viendra évaluer vos besoins à domicile", completed: false },
      { id: 6, title: "Recevoir la notification", description: "Décision du conseil départemental sous 2 mois", completed: false }
    ]
  },
  {
    id: 'declaration_impots',
    title: "Déclaration d'impôts",
    description: "Déclaration annuelle des revenus",
    category: 'impots',
    estimatedDays: 30,
    steps: [
      { id: 1, title: "Rassembler les documents", description: "Avis d'imposition précédent, relevés de revenus, justificatifs de charges", completed: false },
      { id: 2, title: "Se connecter à impots.gouv.fr", description: "Ou utiliser le formulaire papier si besoin", completed: false },
      { id: 3, title: "Vérifier les informations pré-remplies", description: "Corriger si nécessaire", completed: false },
      { id: 4, title: "Valider et signer", description: "Conserver l'accusé de réception", completed: false }
    ]
  },
  {
    id: 'carte_vitale',
    title: "Renouveler sa carte vitale",
    description: "Demande de nouvelle carte vitale ou mise à jour",
    category: 'sante',
    estimatedDays: 21,
    steps: [
      { id: 1, title: "Se connecter à ameli.fr", description: "Ou contacter la CPAM par courrier", completed: false },
      { id: 2, title: "Déclarer la perte ou demander le renouvellement", description: "Dans la rubrique 'Mes démarches'", completed: false },
      { id: 3, title: "Envoyer une photo si demandé", description: "Photo d'identité récente au format numérique", completed: false },
      { id: 4, title: "Réceptionner la nouvelle carte", description: "Sous 3 semaines environ", completed: false }
    ]
  },
  {
    id: 'mutuelle',
    title: "Changer de mutuelle",
    description: "Résiliation et souscription à une nouvelle complémentaire santé",
    category: 'sante',
    estimatedDays: 45,
    steps: [
      { id: 1, title: "Comparer les offres", description: "Utiliser un comparateur ou demander plusieurs devis", completed: false },
      { id: 2, title: "Choisir la nouvelle mutuelle", description: "Vérifier les garanties et le prix", completed: false },
      { id: 3, title: "Souscrire à la nouvelle offre", description: "La nouvelle mutuelle s'occupe de la résiliation", completed: false },
      { id: 4, title: "Confirmer la résiliation", description: "Vérifier que l'ancienne mutuelle est bien résiliée", completed: false }
    ]
  },
  {
    id: 'aide_logement',
    title: "Demander une aide au logement",
    description: "APL, ALS ou ALF selon votre situation",
    category: 'logement',
    estimatedDays: 60,
    steps: [
      { id: 1, title: "Simuler vos droits", description: "Sur caf.fr avec le simulateur d'aides", completed: false },
      { id: 2, title: "Créer ou se connecter à son compte CAF", description: "Avec numéro de sécurité sociale", completed: false },
      { id: 3, title: "Remplir la demande en ligne", description: "Avec les informations sur le logement et les revenus", completed: false },
      { id: 4, title: "Envoyer les justificatifs", description: "Bail, avis d'imposition, RIB", completed: false },
      { id: 5, title: "Attendre la réponse", description: "Notification de la CAF sous 1 à 2 mois", completed: false }
    ]
  },
  {
    id: 'css',
    title: "Demander la CSS",
    description: "Complémentaire Santé Solidaire (mutuelle gratuite ou à 1€/jour)",
    category: 'sante',
    estimatedDays: 45,
    steps: [
      { id: 1, title: "Vérifier son éligibilité", description: "Sur ameli.fr selon vos revenus", completed: false },
      { id: 2, title: "Remplir le formulaire", description: "En ligne sur ameli.fr ou papier Cerfa", completed: false },
      { id: 3, title: "Joindre les justificatifs", description: "Avis d'imposition, justificatif de domicile", completed: false },
      { id: 4, title: "Envoyer le dossier", description: "À la CPAM de votre département", completed: false },
      { id: 5, title: "Recevoir l'attestation", description: "Valable 1 an, à renouveler", completed: false }
    ]
  },
  {
    id: 'aspa',
    title: "Demander l'ASPA",
    description: "Allocation de Solidarité aux Personnes Âgées (minimum vieillesse)",
    category: 'aides',
    estimatedDays: 90,
    steps: [
      { id: 1, title: "Vérifier les conditions", description: "65 ans ou plus, faibles ressources", completed: false },
      { id: 2, title: "Retirer le formulaire", description: "Auprès de votre caisse de retraite (CARSAT, MSA...)", completed: false },
      { id: 3, title: "Remplir le dossier", description: "Avec tous les justificatifs de ressources", completed: false },
      { id: 4, title: "Déposer le dossier", description: "À votre caisse de retraite", completed: false },
      { id: 5, title: "Recevoir la notification", description: "Décision sous 2 à 3 mois", completed: false }
    ]
  }
];

export const DOCUMENT_TYPES = [
  { value: 'carte_identite', label: "Carte d'identité", hasExpiry: true },
  { value: 'passeport', label: 'Passeport', hasExpiry: true },
  { value: 'carte_vitale', label: 'Carte vitale', hasExpiry: false },
  { value: 'permis', label: 'Permis de conduire', hasExpiry: true },
  { value: 'attestation_mutuelle', label: 'Attestation mutuelle', hasExpiry: true },
  { value: 'avis_imposition', label: "Avis d'imposition", hasExpiry: true },
  { value: 'facture', label: 'Facture', hasExpiry: false },
  { value: 'contrat', label: 'Contrat', hasExpiry: true },
  { value: 'ordonnance', label: 'Ordonnance', hasExpiry: true },
  { value: 'attestation', label: 'Attestation', hasExpiry: true },
  { value: 'autre', label: 'Autre document', hasExpiry: false }
];

export const SOCIAL_AIDS = [
  {
    id: 'apa',
    name: "APA - Allocation Personnalisée d'Autonomie",
    shortDescription: "Aide pour financer les dépenses liées à la perte d'autonomie",
    whoCanApply: "Personnes de 60 ans et plus en perte d'autonomie (GIR 1 à 4)",
    whereToApply: "Conseil départemental",
    website: "pour-les-personnes-agees.gouv.fr"
  },
  {
    id: 'aspa',
    name: "ASPA - Allocation de Solidarité aux Personnes Âgées",
    shortDescription: "Minimum vieillesse pour compléter vos revenus",
    whoCanApply: "Personnes de 65 ans et plus avec faibles ressources",
    whereToApply: "Caisse de retraite (CARSAT, MSA...)",
    website: "service-public.fr"
  },
  {
    id: 'css',
    name: "CSS - Complémentaire Santé Solidaire",
    shortDescription: "Mutuelle gratuite ou à moins de 1€/jour",
    whoCanApply: "Personnes à faibles revenus",
    whereToApply: "CPAM via ameli.fr",
    website: "ameli.fr"
  },
  {
    id: 'apl',
    name: "APL - Aide Personnalisée au Logement",
    shortDescription: "Aide pour réduire le montant du loyer",
    whoCanApply: "Locataires avec faibles ressources",
    whereToApply: "CAF",
    website: "caf.fr"
  },
  {
    id: 'aide_menagere',
    name: "Aide ménagère à domicile",
    shortDescription: "Services d'aide pour le ménage, courses, repas",
    whoCanApply: "Personnes de 65 ans et plus (60 ans si inaptitude)",
    whereToApply: "Conseil départemental ou caisse de retraite",
    website: "pour-les-personnes-agees.gouv.fr"
  },
  {
    id: 'cheque_energie',
    name: "Chèque énergie",
    shortDescription: "Aide pour payer les factures d'énergie",
    whoCanApply: "Automatique selon revenus déclarés",
    whereToApply: "Envoyé automatiquement si éligible",
    website: "chequeenergie.gouv.fr"
  },
  {
    id: 'carte_senior',
    name: "Carte Avantage Senior SNCF",
    shortDescription: "30% de réduction sur les trajets en train",
    whoCanApply: "Personnes de 60 ans et plus",
    whereToApply: "SNCF en gare ou en ligne",
    website: "sncf.com"
  }
];

export const TASK_CATEGORIES = [
  { value: 'identite', label: 'Identité', icon: '🪪' },
  { value: 'sante', label: 'Santé', icon: '🏥' },
  { value: 'impots', label: 'Impôts', icon: '📊' },
  { value: 'logement', label: 'Logement', icon: '🏠' },
  { value: 'aides', label: 'Aides sociales', icon: '🤝' },
  { value: 'general', label: 'Autre', icon: '📋' }
];
