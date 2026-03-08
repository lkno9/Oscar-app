import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Loader2, AlertCircle, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── TODO (Phase 2) : Migrer de l'iframe vers le composant React natif Tavus
// → npx @tavus/cvi-ui@latest init
// Cela permettra un contrôle plus fin de l'interface (mute, camera toggle, etc.)

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

type CallStatus = "loading" | "active" | "ended" | "error" | "permission-denied";

// ─── Tavus API helper ─────────────────────────────────────
// TODO: En production, proxifier cet appel via Xano pour ne pas exposer l'API key côté client
// Ex: POST https://votre-xano.com/api/tavus/create-conversation
async function createTavusConversation(): Promise<string> {
  const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
  const replicaId = import.meta.env.VITE_TAVUS_REPLICA_ID;
  const personaId = import.meta.env.VITE_TAVUS_PERSONA_ID;

  if (!apiKey || !replicaId || !personaId) {
    throw new Error("MISSING_CONFIG");
  }

  const res = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      replica_id: replicaId,
      persona_id: personaId,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error("[Tavus] API error:", res.status, errorBody);
    throw new Error(`API_ERROR_${res.status}`);
  }

  const data = await res.json();
  const conversationUrl = data.conversation_url;

  if (!conversationUrl) {
    console.error("[Tavus] No conversation_url in response:", data);
    throw new Error("NO_URL");
  }

  return conversationUrl;
}

// ─── Check camera/mic permissions ─────────────────────────
async function checkMediaPermissions(): Promise<boolean> {
  try {
    // Check if permissions API is available
    if (navigator.permissions) {
      const [camera, mic] = await Promise.all([
        navigator.permissions.query({ name: "camera" as PermissionName }),
        navigator.permissions.query({ name: "microphone" as PermissionName }),
      ]);
      // If either is explicitly denied, return false
      if (camera.state === "denied" || mic.state === "denied") {
        return false;
      }
    }
    return true;
  } catch {
    // permissions.query not supported (e.g. some mobile browsers) — let it through
    return true;
  }
}

// ─── Main Component ───────────────────────────────────────
export function CallScreen({ isOpen, onClose }: CallScreenProps) {
  const [status, setStatus] = useState<CallStatus>("loading");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  // ─── Cleanup ────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setConversationUrl(null);
    setStatus("loading");
    setCallDuration(0);
    setErrorMessage("");
  }, []);

  // ─── End call ───────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // ─── Initialize on open ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    mountedRef.current = true;
    setStatus("loading");
    setCallDuration(0);
    setErrorMessage("");
    setConversationUrl(null);

    async function init() {
      // 1. Check permissions
      const permOk = await checkMediaPermissions();
      if (!permOk) {
        if (mountedRef.current) {
          setStatus("permission-denied");
          setErrorMessage(
            "Oscar a besoin de votre caméra et microphone pour vous parler. Autorisez l'accès dans les réglages de votre navigateur."
          );
        }
        return;
      }

      // 2. Create Tavus conversation
      try {
        const url = await createTavusConversation();
        if (!mountedRef.current) return;

        setConversationUrl(url);
        setStatus("active");

        // Start call timer
        timerRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      } catch (err) {
        if (!mountedRef.current) return;

        const error = err as Error;
        console.error("[CallScreen] Tavus init error:", error);

        if (error.message === "MISSING_CONFIG") {
          setStatus("error");
          setErrorMessage(
            "Configuration Tavus manquante. Ajoutez les variables VITE_TAVUS_API_KEY, VITE_TAVUS_REPLICA_ID et VITE_TAVUS_PERSONA_ID."
          );
        } else if (error.message.startsWith("API_ERROR_")) {
          setStatus("error");
          setErrorMessage(
            "Impossible de joindre Oscar pour le moment. Réessayez dans quelques instants."
          );
        } else {
          setStatus("error");
          setErrorMessage(
            "Une erreur est survenue. Réessayez dans quelques instants."
          );
        }
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Format duration ────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Render ─────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* ── Loading state ── */}
      {status === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🎙️</span>
            </div>
            <Loader2 className="absolute -bottom-1 -right-1 w-8 h-8 text-teal-400 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              Oscar se prépare...
            </p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">
              Préparation de l'appel vidéo. Cela peut prendre quelques secondes.
            </p>
          </div>
          {/* Cancel button */}
          <button
            onClick={handleEndCall}
            className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ── Active state — Tavus iframe ── */}
      {status === "active" && conversationUrl && (
        <>
          {/* Top status bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white/80 text-sm font-medium">
                En appel avec Oscar
              </span>
            </div>
            <span className="text-white/50 text-sm font-mono tabular-nums">
              {formatDuration(callDuration)}
            </span>
          </div>

          {/* Tavus CVI iframe — responsive, full viewport */}
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src={conversationUrl}
              allow="camera; microphone; autoplay; display-capture"
              className="absolute inset-0 w-full h-full border-0"
              style={{ background: "#000" }}
              title="Appel vidéo avec Oscar"
            />
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
                aria-label="Terminer l'appel"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Error state ── */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              Problème de connexion
            </p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => {
                // Retry
                setStatus("loading");
                setErrorMessage("");
                setConversationUrl(null);
                // Re-trigger init by toggling
                const retryInit = async () => {
                  const permOk = await checkMediaPermissions();
                  if (!permOk) {
                    setStatus("permission-denied");
                    setErrorMessage(
                      "Oscar a besoin de votre caméra et microphone pour vous parler. Autorisez l'accès dans les réglages de votre navigateur."
                    );
                    return;
                  }
                  try {
                    const url = await createTavusConversation();
                    setConversationUrl(url);
                    setStatus("active");
                    timerRef.current = setInterval(() => {
                      setCallDuration((d) => d + 1);
                    }, 1000);
                  } catch (retryErr) {
                    console.error("[CallScreen] Retry error:", retryErr);
                    setStatus("error");
                    setErrorMessage(
                      "Impossible de joindre Oscar pour le moment. Réessayez dans quelques instants."
                    );
                  }
                };
                retryInit();
              }}
              className="px-6 py-3 rounded-full bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all active:scale-95 text-base"
            >
              Réessayer
            </button>
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Permission denied state ── */}
      {status === "permission-denied" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
            <VideoOff className="w-10 h-10 text-orange-400" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              Caméra et micro nécessaires
            </p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => {
                // Guide the user — on mobile this usually opens settings
                toast.info(
                  "Allez dans les réglages de votre navigateur pour autoriser la caméra et le microphone, puis revenez ici.",
                  { duration: 6000 }
                );
              }}
              className="px-6 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all active:scale-95 text-base"
            >
              Comment faire ?
            </button>
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Ended state ── */}
      {status === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span className="text-3xl">👋</span>
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              Appel terminé
            </p>
            <p className="text-white/50 text-base">
              Durée : {formatDuration(callDuration)}
            </p>
          </div>
          <button
            onClick={handleEndCall}
            className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 text-base"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
