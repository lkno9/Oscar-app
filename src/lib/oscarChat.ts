export type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: string }
    >;

export type Message = { role: "user" | "assistant"; content: MessageContent };

const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;

/**
 * Stream a chat response from Mistral AI via the mistral-chat edge function.
 * Used by CallScreen.tsx for voice call conversations.
 */
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
  try {
    // Convert messages to Mistral-compatible format
    const apiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content, // Already compatible (string or vision array)
    }));

    const response = await fetch(MISTRAL_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      onError(errorData.error || "Une erreur est survenue.");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("Impossible de lire la réponse.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            onDelta(token);
          }
        } catch {
          // Skip malformed lines
        }
      }
    }

    onDone();
  } catch {
    onError("Erreur de connexion. Veuillez réessayer.");
  }
}
