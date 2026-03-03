import { useRef, useCallback } from "react";

const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;

export interface MistralMessage {
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

interface UseMistralChatOptions {
  onDelta: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export function useMistralChat({
  onDelta,
  onDone,
  onError,
}: UseMistralChatOptions) {
  // Conversation history in ref (no re-renders on update)
  const historyRef = useRef<MistralMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stable callback refs to avoid stale closures
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string) => {
      // Build user message content
      let content: MistralMessage["content"];
      if (imageBase64) {
        content = [
          { type: "text", text },
          { type: "image_url", image_url: { url: imageBase64 } },
        ];
      } else {
        content = text;
      }

      // Add user message to history
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content },
      ];

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(MISTRAL_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: historyRef.current }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          onErrorRef.current(
            errorData.error || "Une erreur est survenue avec Oscar."
          );
          return;
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          onErrorRef.current("Impossible de lire la réponse.");
          return;
        }

        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6); // Remove "data: " prefix
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullText += token;
                onDeltaRef.current(token);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Add assistant response to history
        if (fullText) {
          historyRef.current = [
            ...historyRef.current,
            { role: "assistant", content: fullText },
          ];
        }

        onDoneRef.current(fullText);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        onErrorRef.current("Erreur de connexion. Veuillez réessayer.");
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, clearHistory, cancelRequest };
}
