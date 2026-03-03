export type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
export type Message = { role: "user" | "assistant"; content: MessageContent };

const BOTPRESS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/botpress-chat`;

// Stable conversation ID per browser session
let sessionConversationId: string | null = null;

export async function sendBotpressMessage({
  message,
  userId,
  onDelta,
  onDone,
  onError,
}: {
  message: string;
  userId?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(BOTPRESS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        message,
        conversationId: sessionConversationId,
        userId,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      onError(errorData.error || "Une erreur est survenue");
      return;
    }

    const data = await resp.json();

    // Save conversation ID for continuity
    if (data.conversationId) {
      sessionConversationId = data.conversationId;
    }

    if (data.reply) {
      // Simulate streaming for smooth UX
      const words = data.reply.split(" ");
      for (const word of words) {
        onDelta(word + " ");
        await new Promise((r) => setTimeout(r, 20));
      }
    } else {
      onError("Pas de réponse reçue");
      return;
    }

    onDone();
  } catch {
    onError("Erreur de connexion. Veuillez réessayer.");
  }
}

// Keep legacy streamChat for backward compatibility if needed
export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  // Extract last user message and send to Botpress
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const text = typeof lastUserMsg?.content === "string"
    ? lastUserMsg.content
    : Array.isArray(lastUserMsg?.content)
    ? lastUserMsg.content.find((c) => c.type === "text")?.text || ""
    : "";

  await sendBotpressMessage({ message: text, onDelta, onDone, onError });
}
