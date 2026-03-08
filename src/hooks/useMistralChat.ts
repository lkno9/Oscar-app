import { useRef, useCallback } from "react";
import type { RichCard } from "@/types/chat";

const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;

export interface MistralMessage {
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: string }
      >;
}

interface UseMistralChatOptions {
  onDelta: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
  onToolResult?: (card: RichCard) => void;
}

export function useMistralChat({
  onDelta,
  onDone,
  onError,
  onToolResult,
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
  const onToolResultRef = useRef(onToolResult);
  onToolResultRef.current = onToolResult;

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string) => {
      // Build user message content for the API request
      let contentForApi: MistralMessage["content"];
      if (imageBase64) {
        contentForApi = [
          { type: "text", text },
          { type: "image_url", image_url: imageBase64 },
        ];
      } else {
        contentForApi = text;
      }

      // For history: store text only (no base64 blobs — they bloat subsequent requests)
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: imageBase64 ? `${text} [fichier joint analysé]` : text },
      ];

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Timeout: 45s for image requests, 30s for text-only
      const timeoutMs = imageBase64 ? 45000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Build messages: history (text only) + current message (with image if any)
        const messagesToSend = imageBase64
          ? [
              ...historyRef.current.slice(0, -1), // previous history (text only)
              { role: "user" as const, content: contentForApi }, // current msg with image
            ]
          : historyRef.current;

        const response = await fetch(MISTRAL_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesToSend }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 413) {
            onErrorRef.current("Le fichier est trop volumineux. Essayez une image plus petite.");
            return;
          }
          if (response.status === 408 || response.status === 504) {
            onErrorRef.current("Connexion trop lente. Vérifiez votre connexion internet et réessayez.");
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          onErrorRef.current(
            errorData.error || "Une erreur est survenue avec Oscar."
          );
          return;
        }

        // Parse SSE stream (supports custom tool_result events)
        const reader = response.body?.getReader();
        if (!reader) {
          onErrorRef.current("Impossible de lire la réponse.");
          return;
        }

        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";
        let currentEventType = ""; // Track SSE event type

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();

            // Empty line = end of SSE event block
            if (!trimmed) {
              currentEventType = "";
              continue;
            }

            // Detect custom event type (e.g. "event: tool_result")
            if (trimmed.startsWith("event: ")) {
              currentEventType = trimmed.slice(7).trim();
              continue;
            }

            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6); // Remove "data: " prefix
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Handle tool_result custom events
              if (currentEventType === "tool_result" && onToolResultRef.current) {
                onToolResultRef.current(parsed as RichCard);
                currentEventType = "";
                continue;
              }

              // Handle normal SSE delta (text streaming)
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
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          // Check if it was our timeout or a user cancel
          if (!abortControllerRef.current || abortControllerRef.current === controller) {
            onErrorRef.current("La connexion a pris trop de temps. Vérifiez votre réseau et réessayez.");
          }
          return;
        }
        onErrorRef.current("Erreur de connexion. Vérifiez votre réseau et réessayez.");
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
