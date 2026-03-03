import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: "droits" | "seniors" | "securite";
}

const RSS_SOURCES = [
  {
    url: "https://www.service-public.fr/rss/particuliers.xml",
    source: "Service Public",
    category: "droits" as const,
  },
  {
    url: "https://www.pour-les-personnes-agees.gouv.fr/rss.xml",
    source: "Pour les personnes âgées",
    category: "seniors" as const,
  },
  {
    url: "https://www.cybermalveillance.gouv.fr/feed",
    source: "Cybermalveillance",
    category: "securite" as const,
  },
];

/**
 * Parse RSS/Atom XML and extract articles.
 * Works with both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 */
function parseRSS(xml: string, source: string, category: NewsArticle["category"]): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Try RSS 2.0 <item> tags first, then Atom <entry> tags
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

  const matches = [...xml.matchAll(itemRegex), ...xml.matchAll(entryRegex)];

  for (const match of matches) {
    const block = match[1];

    // Title
    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (!title) continue;

    // Description / summary / content
    const descMatch =
      block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) ||
      block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
    let description = descMatch ? descMatch[1].trim() : "";
    // Strip HTML tags from description
    description = description.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
    // Truncate to 200 chars
    if (description.length > 200) {
      description = description.substring(0, 200).replace(/\s+\S*$/, "") + "...";
    }

    // Link
    const linkMatch =
      block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
      block.match(/<link[^>]*href=["']([^"']+)["']/i);
    const link = linkMatch ? (linkMatch[1] || "").trim() : "";

    // Date
    const dateMatch =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) ||
      block.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
    const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

    articles.push({ title, description, link, pubDate, source, category });
  }

  return articles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch all RSS feeds in parallel with timeout
    const fetchWithTimeout = async (url: string, timeoutMs = 8000): Promise<string> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "Oscar-SeniorApp/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } finally {
        clearTimeout(timeout);
      }
    };

    const results = await Promise.allSettled(
      RSS_SOURCES.map(async (src) => {
        const xml = await fetchWithTimeout(src.url);
        return parseRSS(xml, src.source, src.category);
      })
    );

    // Collect all successful articles
    const allArticles: NewsArticle[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      } else {
        errors.push(`${RSS_SOURCES[i].source}: ${result.reason?.message || "error"}`);
      }
    });

    // Sort by date descending
    allArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    // Return top 20
    return new Response(
      JSON.stringify({
        success: true,
        articles: allArticles.slice(0, 20),
        sources: RSS_SOURCES.map((s) => s.source),
        errors: errors.length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg, articles: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
