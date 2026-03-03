import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userId } = await req.json();

    const BOTPRESS_TOKEN = Deno.env.get("BOTPRESS_TOKEN");
    const BOTPRESS_BOT_ID = Deno.env.get("BOTPRESS_BOT_ID");

    if (!BOTPRESS_TOKEN || !BOTPRESS_BOT_ID) {
      throw new Error("BOTPRESS_TOKEN or BOTPRESS_BOT_ID not configured");
    }

    // Use a stable conversation ID (per user session)
    const convId = conversationId || `app-${userId || "anon"}-${Date.now()}`;

    // Step 1: Create or reuse conversation
    const createConvRes = await fetch(
      `https://api.botpress.cloud/v1/chat/conversations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BOTPRESS_TOKEN}`,
          "x-bot-id": BOTPRESS_BOT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: convId }),
      }
    );

    if (!createConvRes.ok && createConvRes.status !== 409) {
      const err = await createConvRes.text();
      console.error("Create conversation error:", createConvRes.status, err);
      throw new Error(`Botpress conversation error: ${createConvRes.status}`);
    }

    const convData = createConvRes.status === 409
      ? { conversation: { id: convId } }
      : await createConvRes.json();

    const finalConvId = convData?.conversation?.id || convId;

    // Step 2: Send message
    const msgRes = await fetch(
      `https://api.botpress.cloud/v1/chat/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BOTPRESS_TOKEN}`,
          "x-bot-id": BOTPRESS_BOT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: finalConvId,
          type: "text",
          payload: { text: message },
          userId: userId || "app-user",
        }),
      }
    );

    if (!msgRes.ok) {
      const err = await msgRes.text();
      console.error("Send message error:", msgRes.status, err);
      throw new Error(`Botpress message error: ${msgRes.status}`);
    }

    // Step 3: Poll for bot response (wait up to 15s)
    let botReply = null;
    const startTime = Date.now();
    const sentAt = new Date().toISOString();

    while (Date.now() - startTime < 15000) {
      await new Promise((r) => setTimeout(r, 1500));

      const listRes = await fetch(
        `https://api.botpress.cloud/v1/chat/messages?conversationId=${finalConvId}&direction=desc&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${BOTPRESS_TOKEN}`,
            "x-bot-id": BOTPRESS_BOT_ID,
          },
        }
      );

      if (!listRes.ok) continue;

      const listData = await listRes.json();
      const messages = listData?.messages || [];

      // Find bot response after user message
      const botMsg = messages.find(
        (m: { direction?: string; createdAt?: string; payload?: { text?: string } }) =>
          m.direction === "incoming" &&
          m.createdAt > sentAt &&
          m.payload?.text
      );

      if (botMsg) {
        botReply = botMsg.payload.text;
        break;
      }
    }

    if (!botReply) {
      botReply = "Je n'ai pas pu obtenir une réponse. Veuillez réessayer.";
    }

    return new Response(
      JSON.stringify({ reply: botReply, conversationId: finalConvId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Botpress chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
