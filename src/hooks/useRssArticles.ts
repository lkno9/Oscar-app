import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---
export interface RssArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
  source: string;
  emoji: string;
}

interface RssSource {
  url: string;
  category: string;
  source: string;
  emoji: string;
}

export const ACTU_CATEGORIES = [
  "Tout",
  "Droits",
  "Santé",
  "Loisirs",
  "Sécurité",
  "Actualité",
  "Bien-être",
];

// Sources par défaut — utilisées si Supabase est indisponible
const DEFAULT_RSS_SOURCES: RssSource[] = [
  // Droits & Retraite
  { url: "https://www.capretraite.fr/feed/", category: "Droits", source: "Cap Retraite", emoji: "📋" },
  { url: "https://www.pour-les-personnes-agees.gouv.fr/rss.xml", category: "Droits", source: "Pour les personnes âgées", emoji: "🏛️" },
  // Santé
  { url: "https://www.senioractu.com/xml/syndication.rss", category: "Santé", source: "Senior Actu", emoji: "🏥" },
  { url: "https://www.santemagazine.fr/feeds/rss", category: "Santé", source: "Santé Magazine", emoji: "💊" },
  // Loisirs
  { url: "https://www.notretemps.com/feed", category: "Loisirs", source: "Notre Temps", emoji: "🎭" },
  { url: "https://www.pleinevie.fr/feed", category: "Loisirs", source: "Pleine Vie", emoji: "🌸" },
  // Sécurité
  { url: "https://www.60millions-mag.com/feed", category: "Sécurité", source: "60 Millions", emoji: "🛡️" },
  { url: "https://www.cybermalveillance.gouv.fr/feed", category: "Sécurité", source: "Cybermalveillance", emoji: "🔒" },
  // Actualité
  { url: "https://www.francetvinfo.fr/economie.rss", category: "Actualité", source: "France Info", emoji: "📰" },
  { url: "https://www.silvereco.fr/feed", category: "Actualité", source: "Silver Eco", emoji: "🏠" },
  // Bien-être
  { url: "https://www.psychologies.com/feed", category: "Bien-être", source: "Psychologies", emoji: "🧘" },
  { url: "https://www.femmeactuelle.fr/sante/feed", category: "Bien-être", source: "Femme Actuelle Santé", emoji: "🌿" },
];

// --- Helpers ---
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// --- Hook ---
interface UseRssArticlesOptions {
  /** Nombre max d'articles par source (défaut 3) */
  perSource?: number;
  /** Longueur max de la description tronquée (défaut 90) */
  descMaxLength?: number;
}

export function useRssArticles(options: UseRssArticlesOptions = {}) {
  const { perSource = 3, descMaxLength = 90 } = options;

  const [rssSources, setRssSources] = useState<RssSource[]>(DEFAULT_RSS_SOURCES);
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actuCat, setActuCat] = useState("Tout");

  // 1. Charger les sources depuis Supabase (fallback sur les defaults)
  useEffect(() => {
    const loadSources = async () => {
      try {
        const { data, error } = await supabase
          .from("rss_sources")
          .select("url, category, source_name, emoji")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (!error && data && data.length > 0) {
          setRssSources(
            data.map((d) => ({
              url: d.url,
              category: d.category,
              source: d.source_name,
              emoji: d.emoji,
            }))
          );
        }
      } catch {
        // Supabase indisponible → on garde les sources par défaut
      }
    };
    loadSources();
  }, []);

  // 2. Fetch les articles RSS
  useEffect(() => {
    const fetchRss = async () => {
      setLoading(true);
      const allArticles: RssArticle[] = [];

      const results = await Promise.allSettled(
        rssSources.map(async (src) => {
          const res = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`
          );
          if (!res.ok) return [];
          const data = await res.json();
          if (data.status !== "ok" || !data.items) return [];
          return data.items.slice(0, perSource).map((item: any) => {
            const rawDesc = item.description || "";
            const cleanDesc = rawDesc.replace(/<[^>]+>/g, "").trim();
            const shortDesc =
              cleanDesc.length > descMaxLength
                ? cleanDesc.slice(0, descMaxLength) + "..."
                : cleanDesc;
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

      setArticles(allArticles);
      setLoading(false);
    };
    fetchRss();
  }, [rssSources, perSource, descMaxLength]);

  // 3. Filtrage par catégorie
  const filteredArticles = useMemo(
    () => (actuCat === "Tout" ? articles : articles.filter((a) => a.category === actuCat)),
    [articles, actuCat]
  );

  return { articles, filteredArticles, loading, actuCat, setActuCat };
}
