import type { LinkPreviewData } from "@/types/chat";

// Known site metadata for common French senior-friendly sites
const KNOWN_SITES: Record<string, { title: string; description: string; favicon: string }> = {
  "ameli.fr": {
    title: "Ameli - Assurance Maladie",
    description: "Votre compte Ameli : remboursements, droits, carte vitale",
    favicon: "https://www.ameli.fr/favicon.ico",
  },
  "impots.gouv.fr": {
    title: "Impots.gouv.fr",
    description: "Espace personnel, d\u00e9claration de revenus, avis d'imposition",
    favicon: "https://www.impots.gouv.fr/favicon.ico",
  },
  "service-public.fr": {
    title: "Service-Public.fr",
    description: "Site officiel de l'administration fran\u00e7aise",
    favicon: "https://www.service-public.fr/favicon.ico",
  },
  "caf.fr": {
    title: "CAF - Allocations Familiales",
    description: "Aides au logement, allocations, simulation de droits",
    favicon: "https://www.caf.fr/favicon.ico",
  },
  "doctolib.fr": {
    title: "Doctolib",
    description: "Prendre rendez-vous avec un m\u00e9decin en ligne",
    favicon: "https://www.doctolib.fr/favicon.ico",
  },
  "mesdroitssociaux.gouv.fr": {
    title: "Mes Droits Sociaux",
    description: "Simulateur d'aides sociales et droits",
    favicon: "https://www.mesdroitssociaux.gouv.fr/favicon.ico",
  },
  "pour-les-personnes-agees.gouv.fr": {
    title: "Pour les personnes \u00e2g\u00e9es",
    description: "Informations et droits pour les seniors",
    favicon: "https://www.pour-les-personnes-agees.gouv.fr/favicon.ico",
  },
  "france-services.gouv.fr": {
    title: "France Services",
    description: "Trouver un point d'accueil France Services",
    favicon: "https://www.france-services.gouv.fr/favicon.ico",
  },
  "sncf-connect.com": {
    title: "SNCF Connect",
    description: "R\u00e9server un billet de train, horaires et tarifs",
    favicon: "https://www.sncf-connect.com/favicon.ico",
  },
  "ratp.fr": {
    title: "RATP",
    description: "Itin\u00e9raires, horaires de m\u00e9tro et bus",
    favicon: "https://www.ratp.fr/favicon.ico",
  },
  "allocine.fr": {
    title: "AlloCin\u00e9",
    description: "S\u00e9ances de cin\u00e9ma, films \u00e0 l'affiche",
    favicon: "https://www.allocine.fr/favicon.ico",
  },
  "meteofrance.com": {
    title: "M\u00e9t\u00e9o-France",
    description: "Pr\u00e9visions m\u00e9t\u00e9o fiables",
    favicon: "https://meteofrance.com/favicon.ico",
  },
  "monespacedesante.fr": {
    title: "Mon Espace Sant\u00e9",
    description: "Votre carnet de sant\u00e9 num\u00e9rique",
    favicon: "https://www.monespacedesante.fr/favicon.ico",
  },
  "wikipedia.org": {
    title: "Wikip\u00e9dia",
    description: "L'encyclop\u00e9die libre",
    favicon: "https://fr.wikipedia.org/favicon.ico",
  },
  "youtube.com": {
    title: "YouTube",
    description: "Vid\u00e9os en ligne",
    favicon: "https://www.youtube.com/favicon.ico",
  },
  "google.com": {
    title: "Google",
    description: "Moteur de recherche",
    favicon: "https://www.google.com/favicon.ico",
  },
};

/**
 * Extract domain from a URL string
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Find metadata for a known domain (matches subdomains too)
 */
function findKnownSite(domain: string): { title: string; description: string; favicon: string } | null {
  // Exact match
  if (KNOWN_SITES[domain]) return KNOWN_SITES[domain];
  // Check if domain ends with a known site (e.g. "compte.ameli.fr" matches "ameli.fr")
  for (const [knownDomain, meta] of Object.entries(KNOWN_SITES)) {
    if (domain.endsWith(`.${knownDomain}`) || domain === knownDomain) {
      return meta;
    }
  }
  return null;
}

/**
 * Generate a human-friendly title from a URL when no metadata is available
 */
function generateTitle(url: string, domain: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = decodeURIComponent(pathParts[pathParts.length - 1])
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, ""); // remove file extension
      if (lastPart.length > 2) {
        return `${domain} - ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`;
      }
    }
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return domain;
  }
}

/**
 * Extract all URLs from a text string and return LinkPreviewData for each
 */
export function extractUrlsFromText(text: string): LinkPreviewData[] {
  // Use fresh regex each time to avoid stale lastIndex with /g flag
  const matches = text.match(/https?:\/\/[^\s)<>,;"']+/gi);
  if (!matches) return [];

  // Deduplicate
  const unique = [...new Set(matches)];

  return unique.map((url) => {
    // Clean trailing punctuation that may have been captured
    const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
    const domain = extractDomain(cleanUrl);
    const known = findKnownSite(domain);

    return {
      url: cleanUrl,
      domain,
      title: known?.title || generateTitle(cleanUrl, domain),
      description: known?.description,
      favicon: known?.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    };
  });
}

/**
 * Check if a text contains any URLs
 */
export function hasUrls(text: string): boolean {
  return /https?:\/\/[^\s)<>,;"']+/i.test(text);
}
