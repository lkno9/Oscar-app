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

// TODO: connecter à Supabase partner_organizations
export const DEMO_PARTNERS: PartnerOrganization[] = [];

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
