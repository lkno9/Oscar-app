import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://oscarappmvp.vercel.app',
  'https://oscar-ia-mvp.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

const SYSTEM_PROMPT = `Tu es Oscar Famille, l'assistant IA d'Oscar dédié aux proches et aidants familiaux.
Tu aides les membres de la famille à comprendre et suivre le bien-être de leurs proches seniors qui utilisent l'application Oscar.

TON ROLE :
1. INFORMER — Donner un résumé clair et rassurant de l'état du senior
2. ALERTER — Signaler les tendances inquiétantes (baisse d'humeur, inactivité prolongée)
3. CONSEILLER — Proposer des actions concrètes pour le proche (appeler, envoyer un message, proposer une sortie)
4. RASSURER — Contextualiser les données, éviter l'alarmisme inutile
5. EDUQUER — Donner des conseils sur le vieillissement, la communication intergénérationnelle, le rôle d'aidant

RÈGLES :
- Tutoiement avec les membres famille (ils sont généralement 30-55 ans)
- Phrases courtes et claires
- Toujours en français
- Pas de markdown (texte simple, comme une conversation)
- Si pas de données récentes, le dire honnêtement et suggérer d'envoyer un message au senior
- Ne jamais faire de diagnostic médical
- Orienter vers un médecin si situation préoccupante
- Être positif et encourageant tout en étant honnête`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { messages, seniorIds } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const mistralKey = Deno.env.get("MISTRAL_API_KEY")!;

    // ── GUARD : vérifie que l'appelant est bien lié aux seniors demandés ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Identifie l'utilisateur via son JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Récupère les seniors autorisés pour cet utilisateur (family_links acceptés)
    let allowedSeniorIds = new Set<string>();
    if (seniorIds && seniorIds.length > 0) {
      const { data: links } = await supabase
        .from("family_links")
        .select("senior_id")
        .eq("family_member_id", user.id)
        .eq("status", "accepted")
        .in("senior_id", seniorIds);
      allowedSeniorIds = new Set((links ?? []).map((l: any) => l.senior_id));
    }

    // Fetch senior data context — uniquement pour les seniors autorisés
    let seniorContext = "";
    if (seniorIds && seniorIds.length > 0) {
      for (const seniorId of seniorIds) {
        // Ignore tout seniorId non autorisé
        if (!allowedSeniorIds.has(seniorId)) continue;
        try {
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const sevenDaysAheadDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

          const [profileRes, moodRes, activityRes, wellnessRes, medRes, eventsRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", seniorId).single(),
            supabase.from("mood_entries").select("mood_level, notes, created_at").eq("user_id", seniorId).gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
            supabase.from("wellness_activities").select("activity_type, duration, notes, created_at").eq("user_id", seniorId).gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
            supabase.from("daily_wellness").select("entry_date, steps, sleep_minutes, activity_minutes").eq("user_id", seniorId).gte("created_at", sevenDaysAgo).order("entry_date", { ascending: false }).limit(7),
            supabase.from("medications").select("name, dosage, frequency").eq("user_id", seniorId).eq("is_active", true),
            supabase.from("events").select("title, event_date, event_type").eq("user_id", seniorId).gte("event_date", now.toISOString().split("T")[0]).lte("event_date", sevenDaysAheadDate).order("event_date", { ascending: true }),
          ]);

          const name = profileRes.data?.full_name || "Votre proche";
          const moods = moodRes.data || [];
          const activities = activityRes.data || [];
          const wellness = wellnessRes.data || [];
          const meds = medRes.data || [];
          const events = eventsRes.data || [];

          seniorContext += `\n--- Senior : ${name} ---\n`;

          if (moods.length > 0) {
            const lastMood = moods[0];
            const moodDate = new Date(lastMood.created_at).toLocaleDateString("fr-FR");
            seniorContext += `Dernière humeur : ${lastMood.mood_level}/5 le ${moodDate}`;
            if (lastMood.notes) seniorContext += ` (${lastMood.notes})`;
            seniorContext += "\n";
            const moodList = moods.map(m => `${m.mood_level}/5`).join(", ");
            seniorContext += `Humeurs des 7 derniers jours : ${moodList}\n`;
          } else {
            seniorContext += `Aucune donnée d'humeur récente\n`;
          }

          if (activities.length > 0) {
            const actList = activities.slice(0, 5).map(a => {
              const d = new Date(a.created_at).toLocaleDateString("fr-FR");
              return `${a.activity_type}${a.duration ? ` (${a.duration} min)` : ""} le ${d}`;
            }).join(", ");
            seniorContext += `Activités récentes : ${actList}\n`;
          } else {
            seniorContext += `Aucune activité récente enregistrée\n`;
          }

          if (wellness.length > 0) {
            const todayWellness = wellness[0];
            const sleepH = todayWellness.sleep_minutes ? Math.round(todayWellness.sleep_minutes / 60 * 10) / 10 : 0;
            seniorContext += `Bien-être récent : ${todayWellness.steps || 0} pas, ${sleepH}h de sommeil, ${todayWellness.activity_minutes || 0} min d'activité\n`;
          }

          if (meds.length > 0) {
            const medList = meds.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` (${m.frequency})` : ""}`).join(", ");
            seniorContext += `Médicaments actifs : ${medList}\n`;
          }

          if (events.length > 0) {
            const eventList = events.slice(0, 5).map(e => {
              const d = new Date(e.event_date).toLocaleDateString("fr-FR");
              return `${e.title} le ${d}`;
            }).join(", ");
            seniorContext += `Prochains RDV : ${eventList}\n`;
          }
        } catch (_) {
          // Skip senior on error
        }
      }
    }

    const fullSystemPrompt = seniorContext
      ? `${SYSTEM_PROMPT}\n\nDONNÉES ACTUELLES DE VOS PROCHES :\n${seniorContext}`
      : SYSTEM_PROMPT;

    const mistralMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages,
    ];

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: mistralMessages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!mistralResponse.ok) {
      const err = await mistralResponse.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Stream response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = mistralResponse.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(encoder.encode(decoder.decode(value)));
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
