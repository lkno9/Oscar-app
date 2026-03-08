// --- Données RSS et guides pour la section "À savoir" du dashboard famille ---

export interface RssArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
  source: string;
  emoji: string;
}

export interface RssSource {
  url: string;
  category: string;
  source: string;
  emoji: string;
}

// Sources RSS orientées aidants / proches
export const RSS_SOURCES: RssSource[] = [
  // Droits & aides
  { url: "https://www.pour-les-personnes-agees.gouv.fr/rss.xml", category: "Droits", source: "Pour les personnes âgées", emoji: "🏛️" },
  { url: "https://www.capretraite.fr/feed/", category: "Droits", source: "Cap Retraite", emoji: "📋" },
  // Santé senior
  { url: "https://www.senioractu.com/xml/syndication.rss", category: "Santé", source: "Senior Actu", emoji: "🏥" },
  { url: "https://www.santemagazine.fr/feeds/rss", category: "Santé", source: "Santé Magazine", emoji: "💊" },
  // Bien-être aidant
  { url: "https://www.psychologies.com/feed", category: "Bien-être", source: "Psychologies", emoji: "🧘" },
  { url: "https://www.femmeactuelle.fr/sante/feed", category: "Bien-être", source: "Femme Actuelle Santé", emoji: "🌿" },
  // Actualité silver
  { url: "https://www.silvereco.fr/feed", category: "Actualité", source: "Silver Eco", emoji: "🏠" },
  { url: "https://www.notretemps.com/feed", category: "Actualité", source: "Notre Temps", emoji: "📰" },
];

export const ACTU_CATEGORIES = ["Tout", "Droits", "Santé", "Bien-être", "Actualité"];

// Guides pratiques pour les aidants
export interface AidantGuide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
  tips: string[];
}

export const AIDANT_GUIDES: AidantGuide[] = [
  {
    id: 'droits',
    emoji: '⚖️',
    title: 'Vos droits en tant qu\'aidant',
    description: 'Congé de proche aidant, AJPA, droit au répit',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    tips: [
      "Le congé de proche aidant permet de suspendre ou réduire son activité professionnelle jusqu'à 3 mois (renouvelable, max 1 an).",
      "L'Allocation Journalière du Proche Aidant (AJPA) est d'environ 64€/jour, dans la limite de 66 jours sur l'ensemble de la carrière.",
      "Le droit au répit permet de financer jusqu'à 509€/an d'hébergement temporaire ou d'accueil de jour pour votre proche.",
      "Vous pouvez être affilié gratuitement à l'assurance vieillesse si vous cessez votre activité pour aider un proche dépendant.",
    ],
  },
  {
    id: 'signes',
    emoji: '❤️',
    title: 'Signes à surveiller',
    description: 'Repérer les changements chez votre proche',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    tips: [
      "Perte d'appétit ou de poids inexpliquée — peut signaler une dépression ou un problème de santé.",
      "Isolement croissant, refus de sortir ou de voir du monde — parlez-en au médecin traitant.",
      "Oublis fréquents (médicaments, rendez-vous, repas) — au-delà de l'oubli normal, consultez.",
      "Chutes répétées ou peur de tomber — faites évaluer l'aménagement du domicile.",
      "Changements d'humeur soudains, agressivité ou apathie — ne les banalisez pas.",
    ],
  },
  {
    id: 'communication',
    emoji: '🧠',
    title: 'Bien communiquer',
    description: 'Adapter sa communication avec son aîné',
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    tips: [
      "Parlez clairement, lentement et face à la personne. Évitez le bruit de fond.",
      "Posez des questions simples avec des choix : « Tu préfères sortir ou rester lire ? » plutôt que « Qu'est-ce que tu veux faire ? »",
      "Ne corrigez pas systématiquement les erreurs de mémoire — cela peut être blessant et inutile.",
      "Valorisez ce que votre proche sait encore faire. L'autonomie, même partielle, est précieuse.",
      "Respectez les silences. Être présent sans parler est aussi une forme de communication.",
    ],
  },
  {
    id: 'bienetre',
    emoji: '🤲',
    title: 'Prendre soin de vous',
    description: 'Prévenir l\'épuisement de l\'aidant',
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    tips: [
      "Vous n'êtes pas seul : 11 millions de Français aident un proche. Rejoignez un groupe de soutien ou un café des aidants.",
      "Acceptez l'aide. Déléguer certaines tâches n'est pas un échec, c'est une nécessité.",
      "Gardez du temps pour vous chaque semaine : une activité, une sortie, un moment de détente.",
      "Le sentiment de culpabilité est normal mais injustifié. Vous faites déjà beaucoup.",
      "Consultez votre médecin si vous ressentez de la fatigue chronique, de l'anxiété ou un sentiment de ras-le-bol.",
    ],
  },
  {
    id: 'urgences',
    emoji: '📞',
    title: 'Numéros utiles',
    description: 'Les contacts essentiels à garder sous la main',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    tips: [
      "SAMU : 15 — Urgence médicale vitale.",
      "Pompiers : 18 — Secours d'urgence (chutes, malaises).",
      "Numéro unique urgences : 112 — Fonctionne dans toute l'Europe.",
      "Allo Maltraitance Personnes Âgées : 3977 — Signalement de maltraitance.",
      "Plateforme des aidants : 01 84 72 94 72 — Écoute, orientation, soutien.",
    ],
  },
  {
    id: 'securite',
    emoji: '🛡️',
    title: 'Protéger votre proche',
    description: 'Sécurité du domicile et prévention des arnaques',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    tips: [
      "Aménagez la salle de bain : tapis antidérapant, barre d'appui, siège de douche.",
      "Éclairez les couloirs et escaliers avec des veilleuses automatiques.",
      "Méfiez-vous des démarchages téléphoniques. Inscrivez le numéro sur Bloctel.",
      "Apprenez à votre proche à ne jamais donner ses coordonnées bancaires par téléphone.",
      "Vérifiez régulièrement les détecteurs de fumée et le bon fonctionnement du chauffage.",
    ],
  },
];

// Liens ressources utiles
export const USEFUL_LINKS = [
  { label: "Pour les personnes âgées (gouv.fr)", url: "https://www.pour-les-personnes-agees.gouv.fr", emoji: "🏛️" },
  { label: "Espace proche aidant (CNSA)", url: "https://www.pour-les-personnes-agees.gouv.fr/vivre-a-domicile/aides-aux-aidants", emoji: "🤝" },
  { label: "Association Française des Aidants", url: "https://www.aidants.fr", emoji: "💛" },
  { label: "Cap Retraite — Guide aidants", url: "https://www.capretraite.fr/aides-seniors/aides-aidants/", emoji: "📋" },
];

// Fetch RSS articles
export async function fetchRssArticles(sources: RssSource[]): Promise<RssArticle[]> {
  const allArticles: RssArticle[] = [];
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (data.status !== "ok" || !data.items) return [];
      return data.items.slice(0, 3).map((item: any) => {
        const rawDesc = item.description || "";
        const cleanDesc = rawDesc.replace(/<[^>]+>/g, "").trim();
        const shortDesc = cleanDesc.length > 90 ? cleanDesc.slice(0, 90) + "..." : cleanDesc;
        return {
          title: item.title,
          description: shortDesc,
          link: item.link,
          pubDate: item.pubDate,
          category: src.category,
          source: src.source,
          emoji: src.emoji,
        } as RssArticle;
      });
    })
  );
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      allArticles.push(...result.value);
    }
  }
  return allArticles;
}

// Time ago helper
export function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Hier";
    return `Il y a ${days}j`;
  } catch { return ""; }
}
