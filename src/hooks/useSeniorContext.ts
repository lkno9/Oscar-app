import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Builds a dynamic context string about the senior for injection into Oscar's system prompt.
 * Includes: name, active medications, upcoming events (7 days).
 * Recalculated on mount only (not per message).
 */
export function useSeniorContext(userId?: string | null): string | null {
  const [context, setContext] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const now = new Date();
        const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        const dayOfWeek = dayNames[now.getDay()];
        const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        const timeStr = `${now.getHours()}h${String(now.getMinutes()).padStart(2, "0")}`;

        // Fetch profile, meds, and upcoming events in parallel
        const [profileRes, medsRes, eventsRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
          supabase.from("medications").select("name, frequency").eq("user_id", userId).eq("is_active", true).limit(10),
          supabase.from("events").select("title, event_date, event_time").eq("user_id", userId).gte("event_date", now.toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(5),
        ]);

        const name = profileRes.data?.full_name || "l'utilisateur";
        const meds = medsRes.data || [];
        const events = eventsRes.data || [];

        const medsLine = meds.length > 0
          ? meds.map((m) => `${m.name}${m.frequency ? ` (${m.frequency})` : ""}`).join(", ")
          : "aucun renseigné";

        const eventsLine = events.length > 0
          ? events.map((e) => `${e.title} le ${e.event_date}${e.event_time ? ` à ${e.event_time}` : ""}`).join(", ")
          : "aucun dans les 7 prochains jours";

        const contextStr = [
          `Le senior s'appelle ${name}. Utilise son prénom quand c'est naturel.`,
          `Nous sommes ${dayOfWeek} ${dateStr}, il est ${timeStr}.`,
          `Médicaments actifs : ${medsLine}.`,
          `Prochains rendez-vous : ${eventsLine}.`,
        ].join("\n");

        setContext(contextStr);
      } catch (err) {
        console.warn("useSeniorContext: could not fetch context", err);
        // Non-blocking — Oscar works without context
      }
    })();
  }, [userId]);

  return context;
}
