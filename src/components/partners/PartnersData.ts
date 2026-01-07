export type PartnerCategory = 'sante' | 'logement' | 'aide' | 'transport' | 'loisirs' | 'finances';

export interface PartnerService {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string;
  why_we_recommend: string;
  promo_code?: string;
  promo_value?: string;
  affiliate_url: string;
  info_url?: string;
  icon: string;
  tags: string[];
  is_partner: boolean;
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

export const getAllCategories = (): PartnerCategory[] => {
  return Object.keys(categoryLabels) as PartnerCategory[];
};
