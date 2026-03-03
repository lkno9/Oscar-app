import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OnMessageCallback = (text: string) => void;

let scriptLoaded = false;
let scriptLoading = false;
const pendingCallbacks: Array<() => void> = [];

function loadBotpressScript(onReady: () => void) {
  if (scriptLoaded) { onReady(); return; }
  if (scriptLoading) { pendingCallbacks.push(onReady); return; }

  scriptLoading = true;
  pendingCallbacks.push(onReady);

  const script = document.createElement("script");
  script.src = "https://cdn.botpress.cloud/webchat/v2.3/inject.js";
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    pendingCallbacks.forEach((cb) => cb());
    pendingCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export function useBotpressChat(onMessage: OnMessageCallback) {
  const listenerRegistered = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let cancelled = false;

    supabase.functions.invoke("botpress-config").then(({ data }) => {
      const botId = data?.botId;
      if (!botId || cancelled) return;

      loadBotpressScript(() => {
        if (cancelled) return;
        const bp = (window as unknown as { botpress?: BotpressSDK }).botpress;
        if (!bp) return;

        bp.init({
          botId,
          hideWidget: true,
          showPoweredBy: false,
        });

        if (!listenerRegistered.current) {
          listenerRegistered.current = true;
          bp.on("message", (event: BotpressMessageEvent) => {
            if (event.direction === "incoming" && event.payload?.text) {
              onMessageRef.current(event.payload.text);
            }
          });
        }
      });
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = (text: string) => {
    const bp = (window as unknown as { botpress?: BotpressSDK }).botpress;
    if (!bp) {
      console.warn("Botpress SDK not ready yet");
      return;
    }
    bp.sendMessage({ type: "text", text });
  };

  return { sendMessage };
}

// Botpress SDK types
interface BotpressMessageEvent {
  direction: "incoming" | "outgoing";
  payload?: { text?: string };
}

interface BotpressSDK {
  init: (config: {
    botId: string;
    hideWidget?: boolean;
    showPoweredBy?: boolean;
  }) => void;
  on: (event: string, callback: (event: BotpressMessageEvent) => void) => void;
  sendMessage: (payload: { type: string; text: string }) => void;
}
