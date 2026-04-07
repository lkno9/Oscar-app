// Partner organizations data — digital workshops for seniors
// These organizations activate seniors on Oscar through in-person workshops

export interface PartnerOrganization {
  id: string;
  name: string;
  type: "association" | "ccas" | "mairie" | "residence" | "mutuelle" | "autre";
  description: string;
  logo?: string; // URL or emoji fallback
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  activities: string[];
  schedule?: string; // e.g. "Ateliers le mardi et jeudi, 14h-16h"
}

export const PARTNER_TYPE_LABELS: Record<PartnerOrganization["type"], { label: string; emoji: string }> = {
  association: { label: "Association", emoji: "🤝" },
  ccas: { label: "CCAS", emoji: "🏛️" },
  mairie: { label: "Mairie", emoji: "🏛️" },
  residence: { label: "Résidence", emoji: "🏠" },
  mutuelle: { label: "Mutuelle", emoji: "🛡️" },
  autre: { label: "Organisme", emoji: "📋" },
};

// Demo partners — will be replaced by Supabase data
export const DEMO_PARTNERS: PartnerOrganization[] = [
  {
    id: "emmaus-connect-paris",
    name: "Emmaüs Connect Paris",
    type: "association",
    description: "Emmaüs Connect lutte contre l'exclusion numérique en proposant des ateliers d'initiation au numérique pour les seniors.",
    address: "28 avenue Daumesnil",
    city: "Paris 12e",
    phone: "01 58 51 10 00",
    website: "emmaus-connect.org",
    activities: ["Ateliers numériques", "Aide aux démarches en ligne", "Prêt de tablettes", "Accompagnement individuel"],
    schedule: "Mardi et jeudi, 14h-16h",
  },
  {
    id: "ccas-lyon-3",
    name: "CCAS Lyon 3e",
    type: "ccas",
    description: "Le Centre Communal d'Action Sociale du 3e arrondissement de Lyon accompagne les seniors dans leur quotidien numérique.",
    address: "216 rue Duguesclin",
    city: "Lyon 3e",
    phone: "04 72 61 42 00",
    activities: ["Ateliers informatique seniors", "Permanences numériques", "Aide administrative"],
    schedule: "Lundi et mercredi, 10h-12h",
  },
  {
    id: "petits-freres-pauvres",
    name: "Petits Frères des Pauvres",
    type: "association",
    description: "Accompagnement des personnes âgées isolées, incluant des ateliers numériques pour maintenir le lien social.",
    phone: "0 800 47 47 88",
    website: "petitsfreresdespauvres.fr",
    activities: ["Visites à domicile", "Ateliers numériques", "Sorties et activités collectives"],
  },
];

// Local storage key for linking a senior to their partner org
const PARTNER_STORAGE_KEY = "oscar_partner_org_id";

export function getLinkedPartnerId(): string | null {
  return localStorage.getItem(PARTNER_STORAGE_KEY);
}

export function setLinkedPartnerId(partnerId: string | null): void {
  if (partnerId) {
    localStorage.setItem(PARTNER_STORAGE_KEY, partnerId);
  } else {
    localStorage.removeItem(PARTNER_STORAGE_KEY);
  }
}

export function getLinkedPartner(): PartnerOrganization | null {
  const id = getLinkedPartnerId();
  if (!id) return null;
  return DEMO_PARTNERS.find(p => p.id === id) || null;
}
