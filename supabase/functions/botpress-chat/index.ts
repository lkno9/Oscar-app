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
    const { message, conversationId, userKey } = await req.json();

    const BOTPRESS_WEBHOOK_ID = Deno.env.get("BOTPRESS_BOT_ID"); // reusing BOT_ID secret as WEBHOOK_ID
    const BASE_URL = `https://chat.botpress.cloud/${BOTPRESS_WEBHOOK_ID}`;

    if (!BOTPRESS_WEBHOOK_ID) {
      throw new Error("BOTPRESS_BOT_ID (webhook ID) not configured");
    }

    // Step 1: Get or create a user key
    let currentUserKey = userKey;
    let currentConversationId = conversationId;

    if (!currentUserKey) {
      const userRes = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!userRes.ok) {
        const err = await userRes.text();
        console.error("Create user error:", userRes.status, err);
        throw new Error(`Failed to create Botpress user: ${userRes.status}`);
      }

      const userData = await userRes.json();
      currentUserKey = userData.key;
    }

    // Step 2: Get or create a conversation
    if (!currentConversationId) {
      const convRes = await fetch(`${BASE_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": currentUserKey,
        },
        body: JSON.stringify({}),
      });

      if (!convRes.ok) {
        const err = await convRes.text();
        console.error("Create conversation error:", convRes.status, err);
        throw new Error(`Failed to create conversation: ${convRes.status}`);
      }

      const convData = await convRes.json();
      currentConversationId = convData.conversation?.id;
    }

    // Step 3: Send message
    const msgRes = await fetch(`${BASE_URL}/conversations/${currentConversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": currentUserKey,
      },
      body: JSON.stringify({
        payload: { type: "text", text: message },
      }),
    });

    if (!msgRes.ok) {
      const err = await msgRes.text();
      console.error("Send message error:", msgRes.status, err);
      throw new Error(`Failed to send message: ${msgRes.status}`);
    }

    // Step 4: Poll for bot response (up to 15s)
    let botReply = null;
    const startTime = Date.now();

    while (Date.now() - startTime < 15000) {
      await new Promise((r) => setTimeout(r, 1500));

      const listRes = await fetch(
        `${BASE_URL}/conversations/${currentConversationId}/messages`,
        {
          headers: { "x-user-key": currentUserKey },
        }
      );

      if (!listRes.ok) continue;

      const listData = await listRes.json();
      const msgs = listData?.messages || [];

      // Find the latest bot message (not from user)
      const botMsg = msgs.find(
        (m: { source?: { type?: string }; payload?: { text?: string } }) =>
          m.source?.type === "bot" && m.payload?.text
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
      JSON.stringify({
        reply: botReply,
        conversationId: currentConversationId,
        userKey: currentUserKey,
      }),
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
