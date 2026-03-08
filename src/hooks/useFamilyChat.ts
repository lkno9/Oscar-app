import { useRef, useCallback } from "react";

const FAMILY_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-chat`;

export interface FamilyChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseFamilyChatOptions {
  onDelta: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
  seniorIds?: string[];
}

export function useFamilyChat({
  onDelta,
  onDone,
  onError,
  seniorIds = [],
}: UseFamilyChatOptions) {
  const historyRef = useRef<FamilyChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const seniorIdsRef = useRef(seniorIds);
  seniorIdsRef.current = seniorIds;

  const sendMessage = useCallback(async (text: string) => {
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ];

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(FAMILY_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: historyRef.current,
          seniorIds: seniorIdsRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onErrorRef.current(errorData.error || "Une erreur est survenue.");
        return;
      }

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
              fullText += token;
              onDeltaRef.current(token);
            }
          } catch {
            // skip malformed
          }
        }
      }

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
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, clearHistory, cancelRequest };
}
