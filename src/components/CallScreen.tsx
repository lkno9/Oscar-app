import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Loader2, AlertCircle, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── TODO (Phase 2) : Migrer de l'iframe vers le composant React natif Tavus
// → npx @tavus/cvi-ui@latest init
// Cela permettra un contrôle plus fin (mute natif, events, etc.)

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

type CallStatus = "loading" | "active" | "ended" | "error" | "permission-denied";

// ─── Tavus API helper ─────────────────────────────────────
// TODO: En production, proxifier cet appel via Xano pour ne pas exposer l'API key côté client
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
    if (navigator.permissions) {
      const [camera, mic] = await Promise.all([
        navigator.permissions.query({ name: "camera" as PermissionName }),
        navigator.permissions.query({ name: "microphone" as PermissionName }),
      ]);
      if (camera.state === "denied" || mic.state === "denied") return false;
    }
    return true;
  } catch {
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

  // ─── Retry helper ───────────────────────────────────────
  const retryInit = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    setConversationUrl(null);

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
      if (!mountedRef.current) return;
      setConversationUrl(url);
      setStatus("active");
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("[CallScreen] Init error:", err);
      if (!mountedRef.current) return;
      setStatus("error");
      const error = err as Error;
      if (error.message === "MISSING_CONFIG") {
        setErrorMessage(
          "Configuration Tavus manquante. Ajoutez les variables VITE_TAVUS_API_KEY, VITE_TAVUS_REPLICA_ID et VITE_TAVUS_PERSONA_ID."
        );
      } else {
        setErrorMessage(
          "Impossible de joindre Oscar pour le moment. Réessayez dans quelques instants."
        );
      }
    }
  }, []);

  // ─── Initialize on open ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    mountedRef.current = true;
    setCallDuration(0);

    retryInit();

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
            <OscarOrb state="connecting" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              Oscar se prépare...
            </p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">
              Préparation de l'appel. Cela peut prendre quelques secondes.
            </p>
          </div>
          <button
            onClick={handleEndCall}
            className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ── Active state — Tavus iframe (plein écran) + contrôles ── */}
      {status === "active" && conversationUrl && (
        <>
          {/* Top status bar (overlay) */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2 bg-gradient-to-b from-black/70 to-transparent">
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

          {/* Tavus iframe — masquée visuellement, audio uniquement */}
          <iframe
            ref={iframeRef}
            src={conversationUrl}
            allow="camera; microphone; autoplay; display-capture"
            className="absolute w-0 h-0 border-0 opacity-0 pointer-events-none"
            style={{ position: "absolute", top: -9999, left: -9999 }}
            title="Appel vidéo avec Oscar"
          />

          {/* Orbe animé visible à la place de l'avatar */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <OscarOrb state="speaking" />
            <p className="text-white/60 text-base mt-6">Oscar vous écoute...</p>
          </div>

          {/* Bottom controls (overlay) */}
          <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6 bg-gradient-to-t from-black/70 to-transparent">
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
              onClick={retryInit}
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

// ─────────────────────────────────────────────────────────
// Animated Orb — visual representation of Oscar (no avatar)
// ─────────────────────────────────────────────────────────
type OrbState = "connecting" | "idle" | "speaking";

function OscarOrb({ state }: { state: OrbState }) {
  const config: Record<OrbState, { gradient: string; speed: string; scale: string; glow: string }> = {
    connecting: {
      gradient: "conic-gradient(from 0deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)",
      speed: "3s",
      scale: "scale-90",
      glow: "rgba(66, 133, 244, 0.15)",
    },
    idle: {
      gradient: "conic-gradient(from 0deg, #4285F4, #38b2ac, #4285F4)",
      speed: "6s",
      scale: "scale-100",
      glow: "rgba(56, 178, 172, 0.1)",
    },
    speaking: {
      gradient: "conic-gradient(from 0deg, #34A853, #38b2ac, #4285F4, #34A853)",
      speed: "2.5s",
      scale: "scale-110",
      glow: "rgba(52, 168, 83, 0.2)",
    },
  };

  const c = config[state];

  return (
    <div className="relative w-48 h-48">
      {/* Outer glow */}
      <div
        className={cn(
          "absolute inset-[-30%] rounded-full transition-all duration-700 blur-3xl",
          state === "speaking" ? "opacity-80" : "opacity-40"
        )}
        style={{
          background: c.gradient,
          animation: `orbRotate ${c.speed} linear infinite`,
        }}
      />
      {/* Middle ring (reverse rotation) */}
      <div
        className={cn(
          "absolute inset-[-10%] rounded-full transition-all duration-500 blur-xl",
          c.scale
        )}
        style={{
          background: c.gradient,
          animation: `orbRotate ${c.speed} linear infinite reverse`,
        }}
      />
      {/* Core */}
      <div
        className={cn(
          "absolute inset-[10%] rounded-full transition-all duration-500",
          c.scale
        )}
        style={{
          background: c.gradient,
          animation: `orbRotate ${c.speed} linear infinite`,
          boxShadow: `0 0 60px 20px ${c.glow}`,
        }}
      />
      {/* White center breathing */}
      <div
        className={cn(
          "absolute inset-[25%] rounded-full transition-all duration-500",
          state === "speaking" ? "bg-white/20" : "bg-white/10"
        )}
        style={{
          animation:
            state === "speaking"
              ? "orbPulse 0.8s ease-in-out infinite"
              : state === "connecting"
              ? "orbPulse 1.5s ease-in-out infinite"
              : "orbPulse 3s ease-in-out infinite",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes orbRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
