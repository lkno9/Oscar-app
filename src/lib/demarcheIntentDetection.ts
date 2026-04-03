/**
 * Keyword-based intent detection for administrative démarches.
 * Detects when a senior wants help writing a letter, email, or formal document.
 * Returns a matched intent or null.
 */

export interface DemarcheIntent {
  type: "reclamation" | "courrier-mairie" | "resiliation" | "aide-sociale" | "caf-cpam" | "message-libre";
  confidence: "high" | "medium";
  detectedKeywords: string[];
}

interface PatternRule {
  keywords: string[];
  type: DemarcheIntent["type"];
  /** Requires at least one "action" keyword AND one "context" keyword */
  requiresBoth?: boolean;
}

// Action keywords — indicate the user wants to write/send something
const ACTION_KEYWORDS = [
  "écrire", "ecrire", "rédiger", "rediger", "envoyer",
  "lettre", "courrier", "mail", "email", "e-mail",
  "message", "résilier", "resilier", "résiliation", "resiliation",
  "réclamation", "reclamation", "réclamer", "reclamer",
];

// Pattern rules for specific démarche types
const PATTERN_RULES: PatternRule[] = [
  {
    type: "reclamation",
    keywords: ["réclamation", "reclamation", "réclamer", "reclamer", "plainte", "problème", "probleme", "rembourser", "remboursement"],
  },
  {
    type: "courrier-mairie",
    keywords: ["mairie", "maire", "commune", "municipalité", "municipalite", "carte d'identité", "carte d'identite"],
  },
  {
    type: "resiliation",
    keywords: ["résilier", "resilier", "résiliation", "resiliation", "résiler", "annuler", "abonnement", "contrat", "désabonner", "desabonner"],
  },
  {
    type: "aide-sociale",
    keywords: ["aide sociale", "allocation", "apa", "prestation", "apl", "rsa"],
  },
  {
    type: "caf-cpam",
    keywords: ["caf", "cpam", "caisse d'allocations", "assurance maladie", "sécurité sociale", "securite sociale"],
  },
  {
    type: "message-libre",
    keywords: ["médecin", "medecin", "docteur", "banque", "assurance", "voisin", "propriétaire", "proprietaire"],
    requiresBoth: true,
  },
];

/**
 * Normalize text for matching: lowercase, remove accents, trim.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if any of the keywords are present in the text.
 */
function findMatchingKeywords(text: string, keywords: string[]): string[] {
  const normalized = normalize(text);
  return keywords.filter((kw) => normalized.includes(normalize(kw)));
}

/**
 * Detect if a user message contains an administrative démarche intent.
 * Uses keyword matching — returns the most specific match.
 */
export function detectDemarcheIntent(userMessage: string): DemarcheIntent | null {
  const text = normalize(userMessage);

  // First check: does the message contain any action keyword?
  const actionMatches = findMatchingKeywords(text, ACTION_KEYWORDS);
  const hasActionIntent = actionMatches.length > 0;

  // Try each pattern rule, most specific first
  for (const rule of PATTERN_RULES) {
    const contextMatches = findMatchingKeywords(text, rule.keywords);
    if (contextMatches.length === 0) continue;

    // "requiresBoth" means we need both an action keyword and a context keyword
    if (rule.requiresBoth && !hasActionIntent) continue;

    return {
      type: rule.type,
      confidence: contextMatches.length >= 2 || hasActionIntent ? "high" : "medium",
      detectedKeywords: [...actionMatches, ...contextMatches],
    };
  }

  // Fallback: if we have action keywords but no specific context, suggest "message-libre"
  if (hasActionIntent) {
    // Check for generic writing intent
    const writingPatterns = [
      "écrire un", "ecrire un", "rédiger un", "rediger un",
      "envoyer un", "écrire une", "ecrire une",
      "aide-moi à écrire", "aide-moi a ecrire",
      "aide moi à écrire", "aide moi a ecrire",
      "tu peux m'écrire", "tu peux m'ecrire",
      "peux-tu écrire", "peux-tu ecrire",
      "je voudrais envoyer", "je veux envoyer",
      "comment écrire", "comment ecrire",
      "comment je fais pour écrire", "comment je fais pour ecrire",
    ];

    const genericMatch = writingPatterns.some((p) => text.includes(normalize(p)));
    if (genericMatch) {
      return {
        type: "message-libre",
        confidence: "medium",
        detectedKeywords: actionMatches,
      };
    }
  }

  return null;
}
