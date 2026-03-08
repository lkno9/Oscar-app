import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera, RotateCcw } from "lucide-react";
import { streamChat, Message } from "@/lib/oscarChat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

type CallState = "connecting" | "idle" | "listening" | "thinking" | "speaking";

export function CallScreen({ isOpen, onClose, initialVideoEnabled = false }: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideoEnabled);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const conversationRef = useRef<Message[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const webSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // --- Status text by state ---
  const statusLabel: Record<CallState, string> = {
    connecting: "Connexion...",
    idle: "En appel avec Oscar",
    listening: "Oscar écoute...",
    thinking: "Oscar réfléchit...",
    speaking: "Oscar parle...",
  };

  // --- ElevenLabs TTS (try first) then fallback to browser ---
  const speakAsOscar = useCallback(async (text: string): Promise<void> => {
    setCallState("speaking");

    try {
      ttsAbortRef.current?.abort();
      const abortController = new AbortController();
      ttsAbortRef.current = abortController;

      const truncated = text.length > 4000 ? text.substring(0, 4000) + "..." : text;

      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: truncated }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Empty audio");

      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => { currentAudioRef.current = null; URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { currentAudioRef.current = null; URL.revokeObjectURL(url); reject(new Error("Audio error")); };
        const playPromise = audio.play();
        if (playPromise) playPromise.catch(reject);
      });
    } catch {
      await new Promise<void>((resolve) => {
        if (!("speechSynthesis" in window)) { resolve(); return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        utterance.rate = 0.95;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }

    setCallState("idle");
    ttsAbortRef.current = null;
  }, []);

  const stopOscarSpeech = useCallback(() => {
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setCallState("idle");
  }, []);

  // --- Camera ---
  const startCamera = useCallback(async (facing: "user" | "environment" = "user") => {
    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoEnabled(true);
      setFacingMode(facing);
    } catch {
      toast.error("Impossible d'accéder à la caméra.");
      setIsVideoEnabled(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
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

  // --- STT: Web Speech API with auto-restart ---
  const startListeningInternal = useCallback(() => {
    if (!webSpeechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const fullText = finalTranscriptRef.current + interim;
      setLiveTranscript(fullText);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (finalTranscriptRef.current.trim()) {
          const text = finalTranscriptRef.current.trim();
          finalTranscriptRef.current = "";
          setLiveTranscript("");
          wantListeningRef.current = false;
          recognition.stop();
          processUserSpeech(text);
        }
      }, 2000);
    };

    recognition.onend = () => {
      if (wantListeningRef.current) {
        try { recognition.start(); return; } catch { /* fall through */ }
      }
      if (callState === "listening") setCallState("idle");
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantListeningRef.current = false;
      if (callState === "listening") setCallState("idle");
      if (event.error === "not-allowed") {
        toast.error("Accès au microphone refusé.");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setCallState("listening");
    } catch { /* already running */ }
  }, [webSpeechSupported, callState]);

  const startListening = useCallback(() => {
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    wantListeningRef.current = true;
    startListeningInternal();
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setLiveTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  // --- Process user speech → Mistral → Oscar speaks ---
  const processUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    setCallState("thinking");
    setLiveTranscript("");

    conversationRef.current = [
      ...conversationRef.current,
      { role: "user", content: userText },
    ];

    let oscarResponse = "";

    await streamChat({
      messages: conversationRef.current,
      onDelta: (chunk) => {
        oscarResponse += chunk;
      },
      onDone: async () => {
        conversationRef.current = [
          ...conversationRef.current,
          { role: "assistant", content: oscarResponse },
        ];

        await speakAsOscar(oscarResponse);

        if (!isMuted) {
          setTimeout(() => startListening(), 300);
        }
      },
      onError: (error) => {
        toast.error(error);
        setCallState("idle");
        if (!isMuted) {
          setTimeout(() => startListening(), 500);
        }
      },
    });
  }, [isMuted, speakAsOscar, startListening]);

  // --- Toggle mute ---
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      setCallState("idle");
    }
  }, [isMuted, startListening, stopListening]);

  // --- Initialize / cleanup ---
  useEffect(() => {
    if (isOpen) {
      conversationRef.current = [];
      setCallDuration(0);
      setIsMuted(false);
      setCallState("connecting");
      setLiveTranscript("");

      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      if (initialVideoEnabled) {
        startCamera();
      }

      const greetTimeout = setTimeout(async () => {
        const greeting = "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider ?";
        conversationRef.current = [{ role: "assistant", content: greeting }];
        await speakAsOscar(greeting);
        startListening();
      }, 800);

      return () => {
        clearTimeout(greetTimeout);
      };
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      stopOscarSpeech();
      stopCamera();
      conversationRef.current = [];
      setCallDuration(0);
    }
  }, [isOpen]);

  // --- End call ---
  const handleEndCall = useCallback(() => {
    stopListening();
    stopOscarSpeech();
    stopCamera();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    onClose();
  }, [stopListening, stopOscarSpeech, stopCamera, onClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      {/* Top status bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            callState === "connecting" ? "bg-yellow-500 animate-pulse" :
            callState === "speaking" ? "bg-green-400 animate-pulse" :
            callState === "listening" ? "bg-blue-400 animate-pulse" :
            callState === "thinking" ? "bg-purple-400 animate-pulse" :
            "bg-green-500"
          )} />
          <span className="text-white/80 text-sm font-medium">{statusLabel[callState]}</span>
        </div>
        <span className="text-white/50 text-sm font-mono tabular-nums">{formatDuration(callDuration)}</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Camera viewfinder (takes most of screen when active) */}
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
            {/* Camera overlay gradient (top + bottom) */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.8) 100%)"
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
              {callState === "listening" ? "Parlez maintenant" :
               callState === "speaking" ? "Oscar vous répond" :
               callState === "thinking" ? "Un instant..." :
               callState === "connecting" ? "Démarrage..." :
               "En attente"}
            </p>
          </div>
        )}

        {/* Live transcript overlay */}
        {liveTranscript && (
          <div className="absolute bottom-6 left-4 right-4 z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
              <p className="text-white text-base text-center leading-relaxed">{liveTranscript}</p>
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

// ─────────────────────────────────────────────────────
// Animated Orb component (Gemini Live–style)
// ─────────────────────────────────────────────────────
function GeminiOrb({ state, size = "lg" }: { state: CallState; size?: "sm" | "lg" }) {
  const isSmall = size === "sm";
  const dim = isSmall ? "w-10 h-10" : "w-48 h-48";
  const blurLg = isSmall ? "blur-md" : "blur-3xl";
  const blurMd = isSmall ? "blur-sm" : "blur-xl";

  // Colors and animation speed by state
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
      {/* Middle ring */}
      <div
        className={cn(
          "absolute inset-[-10%] rounded-full transition-all duration-500",
          blurMd,
          c.scale,
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
      {/* White center dot / breathing */}
      {!isSmall && (
        <div
          className={cn(
            "absolute inset-[25%] rounded-full transition-all duration-500",
            state === "speaking" ? "bg-white/20" :
            state === "listening" ? "bg-white/15" :
            "bg-white/10"
          )}
          style={{
            animation: state === "speaking"
              ? "orbPulse 0.8s ease-in-out infinite"
              : state === "listening"
              ? "orbPulse 1.5s ease-in-out infinite"
              : state === "thinking"
              ? "orbPulse 1s ease-in-out infinite"
              : "orbPulse 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Inject keyframes once */}
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
