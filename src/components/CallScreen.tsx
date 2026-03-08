import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AudioRecorder,
  AudioPlayer,
  GeminiLiveSession,
  type GeminiEvent,
} from "@/lib/gemini-live";

// ─── Oscar's system prompt for Gemini Live ───────────────
const OSCAR_SYSTEM_PROMPT = `Tu es Oscar, un compagnon numérique bienveillant et chaleureux conçu pour aider les seniors au quotidien.

Règles de conversation :
- Parle toujours en français, de manière simple, claire et chaleureuse
- Utilise des phrases courtes et faciles à comprendre
- Sois patient et reformule si nécessaire
- Vouvoie l'utilisateur par défaut, tutoie-le s'il le demande
- Sois encourageant et positif
- Réponds de manière concise (2-3 phrases maximum à l'oral)
- Présente-toi brièvement au début de la conversation

Tu peux aider avec :
- Questions du quotidien (météo, recettes, actualités, heure)
- Aide technologique (utiliser un téléphone, une application, internet, envoyer un SMS)
- Compagnie et conversation (discuter, raconter des histoires, anecdotes)
- Santé (rappels généraux, bien-être — toujours recommander de consulter un médecin pour les questions médicales)
- Sécurité (reconnaître les arnaques téléphoniques/internet, numéros d'urgence : 15 SAMU, 17 Police, 18 Pompiers, 112 Europe)

Si l'utilisateur te montre quelque chose via la caméra, décris ce que tu vois et aide-le en conséquence (lire un document, identifier un produit, expliquer une notice, etc.). Sois descriptif mais concis.`;

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

type CallState = "connecting" | "idle" | "listening" | "thinking" | "speaking";

// ─── Main Component ───────────────────────────────────────
export function CallScreen({ isOpen, onClose, initialVideoEnabled = false }: CallScreenProps) {
  // State
  const [callState, setCallState] = useState<CallState>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [callDuration, setCallDuration] = useState(0);
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [noApiKey, setNoApiKey] = useState(false);

  // Refs (persistent across renders)
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const callStateRef = useRef<CallState>("connecting");

  // Keep ref in sync with state for use in callbacks
  callStateRef.current = callState;

  // ─── Status labels ──────────────────────────────────────
  const statusLabel: Record<CallState, string> = {
    connecting: "Connexion...",
    idle: "En appel avec Oscar",
    listening: "Oscar écoute...",
    thinking: "Oscar réfléchit...",
    speaking: "Oscar parle...",
  };

  // ─── Gemini event handler ───────────────────────────────
  const handleGeminiEvent = useCallback((event: GeminiEvent) => {
    if (!mountedRef.current) return;

    switch (event.type) {
      case "connected":
        setCallState("idle");
        // Start mic recording — audio streams continuously to Gemini
        startMicRecording();
        break;

      case "audio":
        // Clear any thinking timer
        if (thinkingTimerRef.current) {
          clearTimeout(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        setCallState("speaking");
        playerRef.current?.resume();
        playerRef.current?.play(event.data);
        break;

      case "inputTranscript":
        setCallState("listening");
        setInputTranscript((prev) => prev + event.text);
        // Set thinking timer — if no audio arrives soon, show "thinking"
        if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = setTimeout(() => {
          if (callStateRef.current === "listening") {
            setCallState("thinking");
          }
        }, 1200);
        break;

      case "outputTranscript":
        setOutputTranscript((prev) => prev + event.text);
        break;

      case "interrupted":
        // User interrupted Oscar — stop audio immediately
        playerRef.current?.stop();
        setCallState("listening");
        setOutputTranscript("");
        if (outputClearTimerRef.current) clearTimeout(outputClearTimerRef.current);
        break;

      case "turnComplete":
        setCallState("idle");
        setInputTranscript("");
        // Keep output transcript visible briefly, then clear
        if (outputClearTimerRef.current) clearTimeout(outputClearTimerRef.current);
        outputClearTimerRef.current = setTimeout(() => {
          setOutputTranscript("");
        }, 4000);
        break;

      case "error":
        toast.error(event.message);
        break;

      case "closed":
        // Connection lost — could reconnect here
        if (mountedRef.current && callStateRef.current !== "connecting") {
          toast.error("Connexion perdue avec Oscar");
        }
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Start mic recording ────────────────────────────────
  const startMicRecording = useCallback(async () => {
    try {
      const recorder = new AudioRecorder();
      await recorder.start((base64Pcm) => {
        sessionRef.current?.sendAudio(base64Pcm);
      });
      recorderRef.current = recorder;
    } catch (err) {
      console.error("[CallScreen] Mic error:", err);
      toast.error("Impossible d'accéder au microphone");
    }
  }, []);

  // ─── Camera management ──────────────────────────────────
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // Stop existing video tracks
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing, // Don't use 'exact' — fails on desktop
          width: { ideal: 768 },
          height: { ideal: 768 },
        },
        audio: false,
      });

      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoEnabled(true);
      setFacingMode(facing);

      // Start capturing frames at 1 FPS for Gemini
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");

      frameIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !ctx || !sessionRef.current?.isConnected) return;
        try {
          ctx.drawImage(videoRef.current, 0, 0, 768, 768);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const base64 = dataUrl.split(",")[1];
          if (base64) {
            sessionRef.current.sendImage(base64);
          }
        } catch {
          /* canvas draw can fail if video not ready */
        }
      }, 1000);
    } catch {
      // Fallback: try without facingMode constraint (desktop with single camera)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 768 }, height: { ideal: 768 } },
          audio: false,
        });
        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsVideoEnabled(true);
      } catch {
        toast.error("Impossible d'accéder à la caméra");
        setIsVideoEnabled(false);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
  }, []);

  const toggleVideo = useCallback(() => {
    if (isVideoEnabled) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  }, [isVideoEnabled, startCamera, stopCamera, facingMode]);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // ─── Mute toggle ────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isMuted) {
      recorderRef.current?.unmute();
      setIsMuted(false);
    } else {
      recorderRef.current?.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  // ─── Cleanup helper ─────────────────────────────────────
  const cleanupAll = useCallback(() => {
    // Timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    if (outputClearTimerRef.current) clearTimeout(outputClearTimerRef.current);
    timerRef.current = null;
    thinkingTimerRef.current = null;
    outputClearTimerRef.current = null;

    // Audio
    recorderRef.current?.stop();
    recorderRef.current = null;
    playerRef.current?.destroy();
    playerRef.current = null;

    // Camera
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }

    // Gemini session
    sessionRef.current?.disconnect();
    sessionRef.current = null;
  }, []);

  // ─── End call ───────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    cleanupAll();
    onClose();
  }, [cleanupAll, onClose]);

  // ─── Initialize on open ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setNoApiKey(true);
      return;
    }

    mountedRef.current = true;
    setNoApiKey(false);
    setCallState("connecting");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setInputTranscript("");
    setOutputTranscript("");

    async function init() {
      // 1. Init audio player (for Gemini's responses)
      const player = new AudioPlayer();
      await player.init();
      playerRef.current = player;

      // 2. Create and connect Gemini Live session
      const session = new GeminiLiveSession({
        apiKey,
        systemPrompt: OSCAR_SYSTEM_PROMPT,
        voiceName: "Kore",
        onEvent: handleGeminiEvent,
      });
      sessionRef.current = session;
      session.connect();

      // 3. Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      // 4. Start camera if requested
      if (initialVideoEnabled) {
        // Wait a bit for session to establish
        setTimeout(() => startCamera("user"), 1500);
      }
    }

    init().catch((err) => {
      console.error("[CallScreen] Init error:", err);
      toast.error("Erreur d'initialisation de l'appel");
    });

    return () => {
      mountedRef.current = false;
      cleanupAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Format duration ────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Transcript to display ──────────────────────────────
  const displayTranscript = callState === "listening" || callState === "thinking"
    ? inputTranscript
    : outputTranscript;
  const transcriptLabel = callState === "listening" || callState === "thinking"
    ? "Vous"
    : "Oscar";

  // ─── Render ─────────────────────────────────────────────
  if (!isOpen) return null;

  // Missing API key screen
  if (noApiKey) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8" style={{ background: "#000" }}>
        <KeyRound className="w-16 h-16 text-white/30 mb-6" />
        <p className="text-white text-lg text-center font-medium mb-2">
          Clé API Gemini requise
        </p>
        <p className="text-white/50 text-sm text-center max-w-xs mb-8 leading-relaxed">
          Pour activer les appels vocaux avec Oscar, ajoutez votre clé API Google Gemini
          dans le fichier <span className="text-white/70 font-mono">.env</span>
        </p>
        <p className="text-white/30 text-xs font-mono mb-8">VITE_GEMINI_API_KEY=votre_clé</p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      {/* Top status bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              callState === "connecting" ? "bg-yellow-500 animate-pulse" :
              callState === "speaking" ? "bg-green-400 animate-pulse" :
              callState === "listening" ? "bg-blue-400 animate-pulse" :
              callState === "thinking" ? "bg-purple-400 animate-pulse" :
              "bg-green-500"
            )}
          />
          <span className="text-white/80 text-sm font-medium">
            {statusLabel[callState]}
          </span>
        </div>
        <span className="text-white/50 text-sm font-mono tabular-nums">
          {formatDuration(callDuration)}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Camera viewfinder (full screen when active) */}
        {isVideoEnabled ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
            />
            {/* Camera overlay gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.8) 100%)",
              }}
            />
            {/* Switch camera button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 p-3 rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-95 transition-transform"
              aria-label="Changer de caméra"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            {/* Mini orb indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <GeminiOrb state={callState} size="sm" />
            </div>
          </div>
        ) : (
          /* Orb visualization (center, no camera) */
          <div className="flex flex-col items-center gap-8">
            <GeminiOrb state={callState} size="lg" />
            <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
              {callState === "listening"
                ? "Parlez maintenant"
                : callState === "speaking"
                ? "Oscar vous répond"
                : callState === "thinking"
                ? "Un instant..."
                : callState === "connecting"
                ? "Connexion à Oscar..."
                : "En attente"}
            </p>
          </div>
        )}

        {/* Live transcript overlay */}
        {displayTranscript && (
          <div className="absolute bottom-6 left-4 right-4 z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
              <p className="text-white/50 text-xs text-center mb-1">{transcriptLabel}</p>
              <p className="text-white text-base text-center leading-relaxed">
                {displayTranscript}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6">
        <div className="flex items-center justify-center gap-6">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
              !isMuted
                ? "bg-white/15 text-white"
                : "bg-red-500/30 text-red-400 ring-2 ring-red-500/50"
            )}
            aria-label={isMuted ? "Activer le micro" : "Couper le micro"}
          >
            {!isMuted ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
            aria-label="Terminer l'appel"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
              isVideoEnabled
                ? "bg-blue-500/30 text-blue-400 ring-2 ring-blue-500/50"
                : "bg-white/15 text-white/60"
            )}
            aria-label={isVideoEnabled ? "Couper la caméra" : "Activer la caméra"}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Animated Orb component (Gemini Live–style)
// ─────────────────────────────────────────────────────────
function GeminiOrb({ state, size = "lg" }: { state: CallState; size?: "sm" | "lg" }) {
  const isSmall = size === "sm";
  const dim = isSmall ? "w-10 h-10" : "w-48 h-48";
  const blurLg = isSmall ? "blur-md" : "blur-3xl";
  const blurMd = isSmall ? "blur-sm" : "blur-xl";

  const config: Record<CallState, { gradient: string; speed: string; scale: string; glow: string }> = {
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
    listening: {
      gradient: "conic-gradient(from 0deg, #4285F4, #078efb, #38b2ac, #4285F4)",
      speed: "2s",
      scale: "scale-105",
      glow: "rgba(7, 142, 251, 0.2)",
    },
    thinking: {
      gradient: "conic-gradient(from 0deg, #ac87eb, #4285F4, #34A853, #ac87eb)",
      speed: "1.5s",
      scale: "scale-95",
      glow: "rgba(172, 135, 235, 0.2)",
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
    <div className={cn("relative", dim)}>
      {/* Outer glow */}
      <div
        className={cn(
          "absolute inset-[-30%] rounded-full transition-all duration-700",
          blurLg,
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
          "absolute inset-[-10%] rounded-full transition-all duration-500",
          blurMd,
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
          boxShadow: `0 0 ${isSmall ? 15 : 60}px ${isSmall ? 5 : 20}px ${c.glow}`,
        }}
      />
      {/* White center breathing */}
      {!isSmall && (
        <div
          className={cn(
            "absolute inset-[25%] rounded-full transition-all duration-500",
            state === "speaking"
              ? "bg-white/20"
              : state === "listening"
              ? "bg-white/15"
              : "bg-white/10"
          )}
          style={{
            animation:
              state === "speaking"
                ? "orbPulse 0.8s ease-in-out infinite"
                : state === "listening"
                ? "orbPulse 1.5s ease-in-out infinite"
                : state === "thinking"
                ? "orbPulse 1s ease-in-out infinite"
                : "orbPulse 3s ease-in-out infinite",
          }}
        />
      )}

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
