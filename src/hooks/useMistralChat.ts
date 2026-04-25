import { useRef, useCallback, useEffect } from "react";
import type { RichCard } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;
const MAX_PERSISTED_MESSAGES = 30;

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
  userId?: string | null;
  /** ID of the conversation to load/save. null = create new on first message */
  conversationId?: string | null;
  /** Called with the DB conversation id when a new conversation is created */
  onConversationId?: (id: string) => void;
  /** Called with loaded messages from DB on mount */
  onHistoryLoaded?: (messages: MistralMessage[]) => void;
  /** Dynamic context about the senior (name, meds, events) injected into system prompt */
  seniorContext?: string | null;
}

export function useMistralChat({
  onDelta,
  onDone,
  onError,
  onToolResult,
  userId,
  conversationId,
  onConversationId,
  onHistoryLoaded,
  seniorContext,
}: UseMistralChatOptions) {
  // Conversation history in ref (no re-renders on update)
  const historyRef = useRef<MistralMessage[]>([]);
  const conversationIdRef = useRef<string | null>(conversationId ?? null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onToolResultRef = useRef(onToolResult);
  onToolResultRef.current = onToolResult;
  const onConversationIdRef = useRef(onConversationId);
  onConversationIdRef.current = onConversationId;

  // Sync conversationId ref when prop changes (parent switches conversation)
  useEffect(() => {
    conversationIdRef.current = conversationId ?? null;
  }, [conversationId]);

  // Load conversation from Supabase on mount / when conversationId changes
  useEffect(() => {
    if (!userId) return;
    historyRef.current = [];

    (async () => {
      try {
        let data: { id: string; messages: unknown } | null = null;

        if (conversationId) {
          // Load specific conversation by ID
          const res = await supabase
            .from("conversations" as any)
            .select("id, messages")
            .eq("id", conversationId)
            .single();
          data = res.data as any;
        } else {
          // Load most recent conversation for this user
          const res = await supabase
            .from("conversations" as any)
            .select("id, messages")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();
          data = res.data as any;
        }

        if (data?.messages && Array.isArray(data.messages)) {
          const loaded = (data.messages as MistralMessage[]).slice(-MAX_PERSISTED_MESSAGES);
          historyRef.current = loaded;
          if (data.id) {
            conversationIdRef.current = data.id;
            onConversationIdRef.current?.(data.id);
          }
          onHistoryLoaded?.(loaded);
        }
      } catch {
        // No conversation yet — that's fine
      }
    })();
  }, [userId, conversationId]);

  // Debounced persist to Supabase
  const persistConversation = useCallback((firstUserMessage?: string) => {
    if (!userId) return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(async () => {
      try {
        const trimmed = historyRef.current.slice(-MAX_PERSISTED_MESSAGES);
        const now = new Date().toISOString();

        if (conversationIdRef.current) {
          // Update existing conversation
          await supabase
            .from("conversations" as any)
            .update({ messages: trimmed, updated_at: now })
            .eq("id", conversationIdRef.current);
        } else {
          // Create new conversation — use first user message as title
          const title = firstUserMessage
            ? firstUserMessage.slice(0, 60) + (firstUserMessage.length > 60 ? "…" : "")
            : "Nouvelle conversation";

          const { data } = await (supabase
            .from("conversations" as any)
            .insert({ user_id: userId, messages: trimmed, updated_at: now, title })
            .select("id")
            .single() as any);

          if (data?.id) {
            conversationIdRef.current = data.id;
            onConversationIdRef.current?.(data.id);
          }
        }
      } catch {
        // Non-blocking
      }
    }, 1000);
  }, [userId]);

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
      const isFirstMessage = historyRef.current.length === 0;
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: imageBase64 ? `${text} [fichier joint analysé]` : text },
      ];
      persistConversation(isFirstMessage ? text : undefined);

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Timeout: 45s for image requests, 30s for text-only
      const timeoutMs = imageBase64 ? 45000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Récupérer un token frais avant chaque appel (évite les JWT périmés)
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
          onErrorRef.current("Votre session a expiré. Veuillez vous reconnecter.");
          return;
        }

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
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: messagesToSend, seniorContext }),
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
        let currentEventType = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) {
              currentEventType = "";
              continue;
            }

            if (trimmed.startsWith("event: ")) {
              currentEventType = trimmed.slice(7).trim();
              continue;
            }

            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (currentEventType === "tool_result" && onToolResultRef.current) {
                onToolResultRef.current(parsed as RichCard);
                currentEventType = "";
                continue;
              }

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
          persistConversation();
        }

        onDoneRef.current(fullText);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          if (!abortControllerRef.current || abortControllerRef.current === controller) {
            onErrorRef.current("La connexion a pris trop de temps. Vérifiez votre réseau et réessayez.");
          }
          return;
        }
        onErrorRef.current("Erreur de connexion. Vérifiez votre réseau et réessayez.");
      }
    },
    [persistConversation, seniorContext]
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    persistConversation();
  }, [persistConversation]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, clearHistory, cancelRequest };
}
