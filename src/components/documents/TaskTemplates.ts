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

export interface AdminTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  season?: string; // 'spring' | 'summer' | 'autumn' | 'winter' | 'all'
  month?: number; // 1-12 for specific month tips
  actionLabel?: string;
  actionUrl?: string;
}

export interface RightGuide {
  id: string;
  title: string;
  icon: string;
  description: string;
  eligibility: string[];
  howToApply: string[];
  documents: string[];
  website: string;
  estimatedDelay: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // IDENTITÉ
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
    id: 'passeport',
    title: "Renouveler son passeport",
    description: "Demande ou renouvellement de passeport",
    category: 'identite',
    estimatedDays: 60,
    steps: [
      { id: 1, title: "Faire la pré-demande en ligne", description: "Sur ants.gouv.fr, récupérer le numéro de pré-demande", completed: false },
      { id: 2, title: "Préparer les documents", description: "Photo, justificatif domicile, timbre fiscal (86€)", completed: false },
      { id: 3, title: "Prendre rendez-vous", description: "En mairie équipée de station biométrique", completed: false },
      { id: 4, title: "Se rendre au rendez-vous", description: "Avec tous les documents originaux et le numéro de pré-demande", completed: false },
      { id: 5, title: "Retirer le passeport", description: "En mairie, sur convocation (délai 2 à 6 semaines)", completed: false }
    ]
  },
  {
    id: 'permis_conduire',
    title: "Renouveler son permis de conduire",
    description: "Renouvellement obligatoire tous les 15 ans",
    category: 'identite',
    estimatedDays: 45,
    steps: [
      { id: 1, title: "Se connecter à ants.gouv.fr", description: "Avec FranceConnect ou créer un compte", completed: false },
      { id: 2, title: "Faire la demande de renouvellement", description: "Rubrique 'Permis de conduire'", completed: false },
      { id: 3, title: "Télécharger les justificatifs", description: "Photo, justificatif domicile, ancien permis", completed: false },
      { id: 4, title: "Suivre l'avancement", description: "Vérifier régulièrement sur le site", completed: false },
      { id: 5, title: "Recevoir le nouveau permis", description: "Par courrier à domicile", completed: false }
    ]
  },

  // SANTÉ
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
    id: 'medecin_traitant',
    title: "Déclarer son médecin traitant",
    description: "Obligatoire pour être bien remboursé",
    category: 'sante',
    estimatedDays: 7,
    steps: [
      { id: 1, title: "Choisir un médecin", description: "Médecin généraliste acceptant de nouveaux patients", completed: false },
      { id: 2, title: "Remplir le formulaire", description: "Cerfa disponible chez le médecin ou sur ameli.fr", completed: false },
      { id: 3, title: "Signature du médecin", description: "Le médecin signe et envoie le formulaire", completed: false },
      { id: 4, title: "Confirmation par la CPAM", description: "Vérifier sur votre compte ameli.fr", completed: false }
    ]
  },
  {
    id: 'carte_europeenne',
    title: "Demander la carte européenne d'assurance maladie",
    description: "Pour les soins lors de voyages en Europe",
    category: 'sante',
    estimatedDays: 14,
    steps: [
      { id: 1, title: "Se connecter à ameli.fr", description: "Rubrique 'Mes démarches'", completed: false },
      { id: 2, title: "Demander la CEAM", description: "Demande gratuite et simple", completed: false },
      { id: 3, title: "Recevoir la carte", description: "Sous 2 semaines, valable 2 ans", completed: false }
    ]
  },

  // IMPÔTS
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
      { id: 4, title: "Déclarer les réductions d'impôt", description: "Dons, emploi à domicile, travaux...", completed: false },
      { id: 5, title: "Valider et signer", description: "Conserver l'accusé de réception", completed: false }
    ]
  },
  {
    id: 'taxe_fonciere',
    title: "Vérifier et payer la taxe foncière",
    description: "Échéance annuelle en octobre",
    category: 'impots',
    estimatedDays: 30,
    steps: [
      { id: 1, title: "Recevoir l'avis", description: "Par courrier ou sur impots.gouv.fr (septembre)", completed: false },
      { id: 2, title: "Vérifier le montant", description: "Comparer avec l'année précédente", completed: false },
      { id: 3, title: "Demander une exonération si éligible", description: "Selon âge et revenus", completed: false },
      { id: 4, title: "Payer avant la date limite", description: "Mi-octobre, en ligne ou chèque", completed: false }
    ]
  },
  {
    id: 'taxe_habitation',
    title: "Gérer la taxe d'habitation",
    description: "Résidences secondaires uniquement désormais",
    category: 'impots',
    estimatedDays: 30,
    steps: [
      { id: 1, title: "Recevoir l'avis", description: "Si vous avez une résidence secondaire", completed: false },
      { id: 2, title: "Vérifier les informations", description: "Surface, occupants déclarés", completed: false },
      { id: 3, title: "Payer avant la date limite", description: "Mi-novembre généralement", completed: false }
    ]
  },

  // LOGEMENT
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
    id: 'anah',
    title: "Demander MaPrimeRénov'",
    description: "Aide pour la rénovation énergétique",
    category: 'logement',
    estimatedDays: 90,
    steps: [
      { id: 1, title: "Vérifier son éligibilité", description: "Sur maprimerenov.gouv.fr selon revenus", completed: false },
      { id: 2, title: "Obtenir des devis", description: "Auprès d'artisans RGE (reconnus)", completed: false },
      { id: 3, title: "Créer le dossier en ligne", description: "Avec les devis et justificatifs", completed: false },
      { id: 4, title: "Attendre l'accord", description: "Ne pas commencer les travaux avant", completed: false },
      { id: 5, title: "Faire réaliser les travaux", description: "Par l'artisan RGE choisi", completed: false },
      { id: 6, title: "Demander le paiement", description: "Avec les factures acquittées", completed: false }
    ]
  },
  {
    id: 'changement_adresse',
    title: "Signaler un changement d'adresse",
    description: "Prévenir toutes les administrations en une fois",
    category: 'logement',
    estimatedDays: 7,
    steps: [
      { id: 1, title: "Se connecter à service-public.fr", description: "Rubrique 'Je déménage'", completed: false },
      { id: 2, title: "Remplir le formulaire unique", description: "Une seule déclaration pour tout", completed: false },
      { id: 3, title: "Sélectionner les organismes", description: "CAF, Impôts, CPAM, Retraite...", completed: false },
      { id: 4, title: "Valider et conserver la confirmation", description: "Tous les organismes sont prévenus", completed: false }
    ]
  },
  {
    id: 'adaptation_logement',
    title: "Adapter son logement au vieillissement",
    description: "Aides pour l'aménagement du domicile",
    category: 'logement',
    estimatedDays: 120,
    steps: [
      { id: 1, title: "Faire un diagnostic", description: "Par un ergothérapeute ou évaluateur", completed: false },
      { id: 2, title: "Identifier les travaux", description: "Douche, monte-escalier, rampes...", completed: false },
      { id: 3, title: "Demander les aides", description: "ANAH, APA, caisse de retraite", completed: false },
      { id: 4, title: "Obtenir les devis", description: "Plusieurs devis pour comparaison", completed: false },
      { id: 5, title: "Faire réaliser les travaux", description: "Après accord des financeurs", completed: false }
    ]
  },

  // AIDES SOCIALES
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
  },
  {
    id: 'aide_menagere',
    title: "Demander l'aide ménagère",
    description: "Aide pour le ménage, courses, repas à domicile",
    category: 'aides',
    estimatedDays: 45,
    steps: [
      { id: 1, title: "Contacter la caisse de retraite", description: "Ou le CCAS de votre commune", completed: false },
      { id: 2, title: "Évaluer vos besoins", description: "Visite d'un évaluateur à domicile", completed: false },
      { id: 3, title: "Choisir un prestataire", description: "Liste fournie par le financeur", completed: false },
      { id: 4, title: "Commencer les prestations", description: "Heures d'aide prises en charge", completed: false }
    ]
  },
  {
    id: 'portage_repas',
    title: "Demander le portage de repas",
    description: "Livraison de repas à domicile",
    category: 'aides',
    estimatedDays: 14,
    steps: [
      { id: 1, title: "Contacter le CCAS", description: "Centre Communal d'Action Sociale de votre ville", completed: false },
      { id: 2, title: "Évaluer vos besoins", description: "Fréquence, régimes alimentaires", completed: false },
      { id: 3, title: "Étudier les tarifs", description: "Selon revenus, aides possibles", completed: false },
      { id: 4, title: "Signer le contrat", description: "Début des livraisons", completed: false }
    ]
  },
  {
    id: 'teleassistance',
    title: "Installer la téléassistance",
    description: "Bracelet ou médaillon d'alerte en cas de chute",
    category: 'aides',
    estimatedDays: 14,
    steps: [
      { id: 1, title: "Comparer les offres", description: "CCAS, opérateurs privés", completed: false },
      { id: 2, title: "Vérifier les aides", description: "APA, caisse de retraite peuvent aider", completed: false },
      { id: 3, title: "Souscrire au service", description: "Abonnement mensuel", completed: false },
      { id: 4, title: "Installation du matériel", description: "À domicile, très simple", completed: false }
    ]
  },

  // RETRAITE
  {
    id: 'retraite_releve',
    title: "Vérifier son relevé de carrière",
    description: "S'assurer que tous les trimestres sont bien comptés",
    category: 'retraite',
    estimatedDays: 30,
    steps: [
      { id: 1, title: "Se connecter à lassuranceretraite.fr", description: "Avec FranceConnect", completed: false },
      { id: 2, title: "Consulter le relevé de carrière", description: "Rubrique 'Ma carrière'", completed: false },
      { id: 3, title: "Vérifier les trimestres", description: "Comparer avec vos bulletins de salaire", completed: false },
      { id: 4, title: "Signaler les erreurs", description: "Formulaire de régularisation disponible", completed: false }
    ]
  },
  {
    id: 'reversion',
    title: "Demander la pension de réversion",
    description: "Après le décès du conjoint",
    category: 'retraite',
    estimatedDays: 60,
    steps: [
      { id: 1, title: "Rassembler les documents", description: "Acte de décès, livret de famille, avis d'imposition", completed: false },
      { id: 2, title: "Faire la demande", description: "Sur lassuranceretraite.fr ou formulaire papier", completed: false },
      { id: 3, title: "Envoyer les justificatifs", description: "À la caisse de retraite du conjoint décédé", completed: false },
      { id: 4, title: "Recevoir la notification", description: "Montant calculé selon vos ressources", completed: false }
    ]
  },

  // TRANSPORT
  {
    id: 'carte_senior_sncf',
    title: "Obtenir la carte Avantage Senior SNCF",
    description: "30% de réduction garantie sur les trajets",
    category: 'transport',
    estimatedDays: 7,
    steps: [
      { id: 1, title: "Vérifier votre éligibilité", description: "60 ans et plus", completed: false },
      { id: 2, title: "Commander sur sncf-connect.com", description: "Ou en gare SNCF", completed: false },
      { id: 3, title: "Payer la carte", description: "49€/an ou moins selon offres", completed: false },
      { id: 4, title: "Recevoir la carte", description: "Numérique ou physique", completed: false }
    ]
  },
  {
    id: 'carte_mobilite',
    title: "Demander la carte mobilité inclusion",
    description: "Stationnement, invalidité ou priorité",
    category: 'transport',
    estimatedDays: 60,
    steps: [
      { id: 1, title: "Retirer le formulaire", description: "À la MDPH de votre département", completed: false },
      { id: 2, title: "Obtenir un certificat médical", description: "Par votre médecin traitant", completed: false },
      { id: 3, title: "Déposer le dossier", description: "À la MDPH avec toutes les pièces", completed: false },
      { id: 4, title: "Attendre l'évaluation", description: "Parfois visite médicale", completed: false },
      { id: 5, title: "Recevoir la carte", description: "Valable plusieurs années", completed: false }
    ]
  }
];

export const DOCUMENT_TYPES = [
  { value: 'carte_identite', label: "Carte d'identité", hasExpiry: true },
  { value: 'passeport', label: 'Passeport', hasExpiry: true },
  { value: 'carte_vitale', label: 'Carte vitale', hasExpiry: false },
  { value: 'carte_europeenne', label: "Carte européenne d'assurance maladie", hasExpiry: true },
  { value: 'permis', label: 'Permis de conduire', hasExpiry: true },
  { value: 'carte_grise', label: 'Carte grise', hasExpiry: false },
  { value: 'attestation_mutuelle', label: 'Attestation mutuelle', hasExpiry: true },
  { value: 'attestation_css', label: 'Attestation CSS', hasExpiry: true },
  { value: 'avis_imposition', label: "Avis d'imposition", hasExpiry: true },
  { value: 'taxe_fonciere', label: 'Taxe foncière', hasExpiry: true },
  { value: 'releve_retraite', label: 'Relevé de retraite', hasExpiry: true },
  { value: 'attestation_apa', label: 'Attestation APA', hasExpiry: true },
  { value: 'facture', label: 'Facture', hasExpiry: false },
  { value: 'contrat', label: 'Contrat', hasExpiry: true },
  { value: 'ordonnance', label: 'Ordonnance', hasExpiry: true },
  { value: 'testament', label: 'Testament', hasExpiry: false },
  { value: 'acte_naissance', label: 'Acte de naissance', hasExpiry: false },
  { value: 'livret_famille', label: 'Livret de famille', hasExpiry: false },
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
    id: 'als',
    name: "ALS - Allocation de Logement Sociale",
    shortDescription: "Aide logement si non éligible à l'APL",
    whoCanApply: "Locataires ne pouvant pas bénéficier de l'APL",
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
    id: 'maprimerenov',
    name: "MaPrimeRénov'",
    shortDescription: "Aide pour la rénovation énergétique du logement",
    whoCanApply: "Propriétaires occupants ou bailleurs",
    whereToApply: "En ligne sur maprimerenov.gouv.fr",
    website: "maprimerenov.gouv.fr"
  },
  {
    id: 'maprimeadapt',
    name: "MaPrimeAdapt'",
    shortDescription: "Aide pour adapter son logement au vieillissement",
    whoCanApply: "Propriétaires de 70 ans+ ou en perte d'autonomie",
    whereToApply: "En ligne sur maprimeadapt.gouv.fr",
    website: "maprimeadapt.gouv.fr"
  },
  {
    id: 'aah',
    name: "AAH - Allocation Adulte Handicapé",
    shortDescription: "Revenu minimum pour personnes en situation de handicap",
    whoCanApply: "Personnes avec taux d'incapacité ≥ 80% ou 50-79% avec restriction d'emploi",
    whereToApply: "MDPH puis CAF",
    website: "service-public.fr"
  },
  {
    id: 'pch',
    name: "PCH - Prestation de Compensation du Handicap",
    shortDescription: "Aide pour compenser les besoins liés au handicap",
    whoCanApply: "Personnes avec difficultés absolues ou graves dans les actes du quotidien",
    whereToApply: "MDPH",
    website: "mdph.fr"
  },
  {
    id: 'teleassistance',
    name: "Téléassistance",
    shortDescription: "Bracelet ou médaillon d'alerte en cas de chute",
    whoCanApply: "Personnes isolées ou à risque de chute",
    whereToApply: "CCAS, opérateurs privés ou via l'APA",
    website: "pour-les-personnes-agees.gouv.fr"
  },
  {
    id: 'portage_repas',
    name: "Portage de repas à domicile",
    shortDescription: "Livraison de repas équilibrés à domicile",
    whoCanApply: "Personnes ne pouvant plus préparer leurs repas",
    whereToApply: "CCAS de votre commune",
    website: "pour-les-personnes-agees.gouv.fr"
  },
  {
    id: 'carte_senior',
    name: "Carte Avantage Senior SNCF",
    shortDescription: "30% de réduction sur les trajets en train",
    whoCanApply: "Personnes de 60 ans et plus",
    whereToApply: "SNCF en gare ou en ligne",
    website: "sncf.com"
  },
  {
    id: 'carte_cmi',
    name: "Carte Mobilité Inclusion (CMI)",
    shortDescription: "Priorité, invalidité ou stationnement",
    whoCanApply: "Personnes avec difficulté à se déplacer ou invalidité",
    whereToApply: "MDPH de votre département",
    website: "mdph.fr"
  },
  {
    id: 'reduction_transport',
    name: "Réductions transports urbains",
    shortDescription: "Tarifs réduits ou gratuité selon villes",
    whoCanApply: "Seniors, selon les villes",
    whereToApply: "Réseau de transport de votre ville",
    website: "Variable selon la ville"
  }
];

export const TASK_CATEGORIES = [
  { value: 'identite', label: 'Identité', icon: '🪪' },
  { value: 'sante', label: 'Santé', icon: '🏥' },
  { value: 'impots', label: 'Impôts & Taxes', icon: '📊' },
  { value: 'logement', label: 'Logement', icon: '🏠' },
  { value: 'aides', label: 'Aides sociales', icon: '🤝' },
  { value: 'retraite', label: 'Retraite', icon: '🎖️' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'general', label: 'Autre', icon: '📋' }
];

// Conseils saisonniers et actualités administratives
export const ADMIN_TIPS: AdminTip[] = [
  // JANVIER
  { id: 'voeux', title: "Bonne année !", description: "N'oubliez pas d'envoyer vos vœux à vos proches et de vérifier vos contrats (mutuelle, assurance) qui se renouvellent.", icon: "🎉", category: "general", month: 1 },
  { id: 'revalorisation', title: "Revalorisation des retraites", description: "Les pensions de retraite sont revalorisées au 1er janvier. Vérifiez le nouveau montant sur votre compte.", icon: "💰", category: "retraite", month: 1 },
  
  // FÉVRIER-MARS
  { id: 'chaudiere', title: "Entretien chaudière", description: "Pensez à l'entretien annuel obligatoire de votre chaudière. Gardez bien le certificat.", icon: "🔥", category: "logement", month: 2 },
  
  // AVRIL-MAI
  { id: 'impots_declaration', title: "Déclaration des revenus", description: "La période de déclaration des revenus a commencé. Vérifiez les informations pré-remplies.", icon: "📝", category: "impots", month: 4, actionLabel: "Commencer ma déclaration" },
  { id: 'jardin_printemps', title: "Attention au jardin", description: "Si vous avez un jardin, pensez au débroussaillage obligatoire dans certaines zones.", icon: "🌳", category: "logement", month: 5 },
  
  // JUIN-JUILLET
  { id: 'canicule', title: "Plan canicule activé", description: "Inscrivez-vous sur le registre canicule de votre mairie pour être appelé en cas de forte chaleur.", icon: "☀️", category: "sante", month: 6, actionLabel: "Me renseigner" },
  { id: 'ceam', title: "Vacances en Europe ?", description: "Demandez votre Carte Européenne d'Assurance Maladie sur ameli.fr avant de partir.", icon: "✈️", category: "sante", month: 6 },
  
  // SEPTEMBRE
  { id: 'grippe', title: "Vaccination grippe", description: "La campagne de vaccination contre la grippe commence. Les plus de 65 ans reçoivent un bon automatique.", icon: "💉", category: "sante", month: 9 },
  { id: 'rentree', title: "Rentrée administrative", description: "Bon moment pour mettre à jour vos documents : attestation mutuelle, carte vitale, etc.", icon: "📚", category: "general", month: 9 },
  
  // OCTOBRE
  { id: 'taxe_fonciere', title: "Taxe foncière", description: "Date limite de paiement mi-octobre. Vérifiez votre éligibilité aux exonérations (âge, revenus).", icon: "🏠", category: "impots", month: 10, actionLabel: "Vérifier mon éligibilité" },
  { id: 'heure_hiver', title: "Changement d'heure", description: "Passage à l'heure d'hiver fin octobre. Profitez-en pour vérifier vos détecteurs de fumée.", icon: "🕐", category: "general", month: 10 },
  
  // NOVEMBRE
  { id: 'chauffage', title: "Aides au chauffage", description: "Le chèque énergie est envoyé automatiquement aux ménages éligibles. Vérifiez votre boîte aux lettres.", icon: "🔥", category: "aides", month: 11 },
  
  // DÉCEMBRE
  { id: 'bilan_annuel', title: "Bilan de fin d'année", description: "Conservez bien vos justificatifs de l'année (factures, relevés, attestations) pour votre prochaine déclaration.", icon: "📁", category: "general", month: 12 },
  { id: 'dons', title: "Réduction d'impôts", description: "Derniers jours pour faire des dons déductibles des impôts de cette année.", icon: "❤️", category: "impots", month: 12 },
  
  // TOUTE L'ANNÉE
  { id: 'france_services', title: "France Services près de chez vous", description: "Un guichet unique pour toutes vos démarches : CAF, impôts, retraite... Des conseillers vous accompagnent gratuitement.", icon: "🏛️", category: "general", season: "all", actionLabel: "Trouver un point France Services" },
  { id: 'aidants', title: "Espace proche aidant", description: "Si vous aidez un proche, des droits existent pour vous : congé proche aidant, allocation journalière...", icon: "🤗", category: "aides", season: "all" },
  { id: 'arnaque', title: "Attention aux arnaques", description: "Ne donnez jamais vos coordonnées bancaires par téléphone. Les administrations ne demandent jamais d'argent par SMS.", icon: "⚠️", category: "general", season: "all" }
];

// Guide des droits détaillé
export const RIGHTS_GUIDES: RightGuide[] = [
  {
    id: 'apa_guide',
    title: "Allocation Personnalisée d'Autonomie (APA)",
    icon: "🤝",
    description: "L'APA aide à financer les dépenses nécessaires pour rester à domicile ou en établissement malgré la perte d'autonomie.",
    eligibility: [
      "Avoir 60 ans ou plus",
      "Résider en France de façon stable et régulière",
      "Être en situation de perte d'autonomie (GIR 1 à 4)",
      "Pas de condition de ressources pour l'accès, mais le montant varie selon les revenus"
    ],
    howToApply: [
      "Retirer le dossier auprès du Conseil départemental, CCAS ou en ligne",
      "Remplir le formulaire avec vos informations personnelles et médicales",
      "Joindre les pièces justificatives (identité, domicile, revenus)",
      "Un professionnel viendra évaluer vos besoins à domicile"
    ],
    documents: [
      "Carte d'identité ou passeport",
      "Justificatif de domicile de moins de 3 mois",
      "Dernier avis d'imposition",
      "Relevé d'identité bancaire (RIB)"
    ],
    website: "pour-les-personnes-agees.gouv.fr",
    estimatedDelay: "2 mois environ"
  },
  {
    id: 'aspa_guide',
    title: "Allocation de Solidarité aux Personnes Âgées (ASPA)",
    icon: "💰",
    description: "L'ASPA (ex-minimum vieillesse) garantit un niveau minimum de ressources aux personnes âgées.",
    eligibility: [
      "Avoir 65 ans ou plus (62 ans en cas d'inaptitude au travail)",
      "Résider en France au moins 9 mois par an",
      "Avoir des ressources inférieures au plafond (environ 1 000€/mois seul, 1 500€ en couple)",
      "Être de nationalité française ou avoir un titre de séjour depuis au moins 10 ans"
    ],
    howToApply: [
      "Faire la demande auprès de votre caisse de retraite",
      "Remplir le formulaire Cerfa dédié",
      "Fournir tous les justificatifs de ressources"
    ],
    documents: [
      "Carte d'identité",
      "Justificatif de domicile",
      "Avis d'imposition",
      "Relevés de tous vos comptes bancaires",
      "Attestations de pensions"
    ],
    website: "service-public.fr",
    estimatedDelay: "2 à 3 mois"
  },
  {
    id: 'css_guide',
    title: "Complémentaire Santé Solidaire (CSS)",
    icon: "🏥",
    description: "La CSS est une mutuelle gratuite ou à moins de 1€/jour pour les personnes à faibles revenus.",
    eligibility: [
      "Résider en France de façon stable et régulière",
      "Avoir des ressources inférieures au plafond (environ 10 000€/an pour une personne seule)",
      "Ne pas bénéficier d'une mutuelle d'entreprise obligatoire"
    ],
    howToApply: [
      "Faire une simulation sur ameli.fr",
      "Faire la demande en ligne sur ameli.fr ou par courrier",
      "Fournir les justificatifs demandés"
    ],
    documents: [
      "Carte d'identité",
      "Carte vitale",
      "Avis d'imposition",
      "Justificatif de domicile",
      "RIB si participation financière"
    ],
    website: "ameli.fr",
    estimatedDelay: "1 mois environ"
  }
];
