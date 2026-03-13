import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MessageSquare, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

type CallPhase = "permissions" | "active" | "ended" | "error";
type OscarState = "listening" | "thinking" | "speaking" | "idle";

// ─── API URLs ────────────────────────────────────────────
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;

// ─── Capture a frame from the video element as base64 JPEG ───
function captureFrame(video: HTMLVideoElement): string | null {
  try {
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    // Smaller resolution to keep base64 size reasonable
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}

// ─── Main Component ───────────────────────────────────────
export function CallScreen({ isOpen, onClose }: CallScreenProps) {
  // Call state
  const [phase, setPhase] = useState<CallPhase>("permissions");
  const [oscarState, setOscarState] = useState<OscarState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Transcript
  const [userTranscript, setUserTranscript] = useState("");
  const [oscarText, setOscarText] = useState("");
  const [conversationLog, setConversationLog] = useState<{ role: "user" | "oscar"; text: string }[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortTtsRef = useRef<AbortController | null>(null);
  const historyRef = useRef<Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: string }> }>>([]);
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const camEnabledRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => { camEnabledRef.current = camEnabled; }, [camEnabled]);

  // ─── Cleanup ────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    wantListeningRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
    abortTtsRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPhase("permissions");
    setOscarState("idle");
    setCallDuration(0);
    setUserTranscript("");
    setOscarText("");
    setConversationLog([]);
    setCamEnabled(false);
    setFacingMode("user");
    historyRef.current = [];
    processingRef.current = false;
    finalTranscriptRef.current = "";
  }, []);

  const handleEndCall = useCallback(() => { cleanup(); onClose(); }, [cleanup, onClose]);

  // ─── TTS: Speak Oscar's response ───────────────────────
  const speakOscar = useCallback(async (text: string) => {
    if (!mountedRef.current) return;
    setOscarState("speaking");
    abortTtsRef.current?.abort();
    const controller = new AbortController();
    abortTtsRef.current = controller;
    const truncated = text.length > 4000 ? text.substring(0, 4000) + "..." : text;

    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: truncated }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Empty audio");

      const url = URL.createObjectURL(blob);
      return new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => {
          audioRef.current = null;
          URL.revokeObjectURL(url);
          if (mountedRef.current) { setOscarState("listening"); resumeListening(); }
          resolve();
        };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (mountedRef.current) {
        try { await browserTTS(truncated); } catch { /* ignore */ }
        setOscarState("listening");
        resumeListening();
      }
    }
  }, []);

  const browserTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  };

  // ─── Send to Mistral (with optional camera frame) ──────
  const sendToOscar = useCallback(async (text: string) => {
    if (!mountedRef.current || !text.trim()) return;
    processingRef.current = true;
    setOscarState("thinking");
    setOscarText("");

    // Capture camera frame if camera is active
    let frameBase64: string | null = null;
    if (camEnabledRef.current && videoRef.current) {
      frameBase64 = captureFrame(videoRef.current);
    }

    // Build the message content
    let userContent: string | Array<{ type: string; text?: string; image_url?: string }>;
    if (frameBase64) {
      userContent = [
        { type: "text", text },
        { type: "image_url", image_url: frameBase64 },
      ];
    } else {
      userContent = text;
    }

    // For history: store text-only version (no base64 blobs)
    const textOnlyForHistory = frameBase64 ? `${text} [image de la camera analysee]` : text;
    // Keep a separate text-only history for subsequent requests
    const historyTextOnly = historyRef.current.map(m => {
      if (typeof m.content === "string") return m;
      return { ...m, content: (m.content as Array<any>).filter(p => p.type === "text").map(p => p.text).join(" ") };
    });
    historyTextOnly.push({ role: "user", content: textOnlyForHistory });

    // The actual messages to send: history (text-only) + current (with image if any)
    const messagesToSend = [
      ...historyTextOnly.slice(0, -1).slice(-18),
      { role: "user", content: userContent },
    ];

    // Store text-only in persistent history
    historyRef.current.push({ role: "user", content: textOnlyForHistory });
    setConversationLog(prev => [...prev, { role: "user", text }]);

    try {
      const res = await fetch(MISTRAL_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!res.ok) throw new Error("Mistral error");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let eventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) { eventType = ""; continue; }
          if (trimmed.startsWith("event: ")) { eventType = trimmed.slice(7).trim(); continue; }
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;
          if (eventType === "tool_result") { eventType = ""; continue; }
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) { fullText += token; if (mountedRef.current) setOscarText(fullText); }
          } catch { /* skip */ }
        }
      }

      if (fullText) {
        historyRef.current.push({ role: "assistant", content: fullText });
        setConversationLog(prev => [...prev, { role: "oscar", text: fullText }]);
        await speakOscar(fullText);
      } else {
        if (mountedRef.current) { setOscarState("listening"); resumeListening(); }
      }
    } catch {
      if (mountedRef.current) {
        setOscarText("Desole, je n'ai pas pu vous repondre. Reessayez.");
        setOscarState("listening");
        resumeListening();
      }
    } finally {
      processingRef.current = false;
    }
  }, [speakOscar]);

  // ─── STT: Speech Recognition ───────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    wantListeningRef.current = true;
    finalTranscriptRef.current = "";
    setUserTranscript("");

    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setUserTranscript(finalTranscriptRef.current + interim);

      if (silenceTimer) clearTimeout(silenceTimer);
      if (finalTranscriptRef.current.trim()) {
        silenceTimer = setTimeout(() => {
          const txt = finalTranscriptRef.current.trim();
          if (txt && !processingRef.current) {
            wantListeningRef.current = false;
            try { recognition.stop(); } catch { /* ignore */ }
            finalTranscriptRef.current = "";
            setUserTranscript("");
            sendToOscar(txt);
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (wantListeningRef.current && mountedRef.current && !processingRef.current) {
        try { recognition.start(); return; } catch { /* fall through */ }
      }
      const remaining = finalTranscriptRef.current.trim();
      if (remaining && !processingRef.current) {
        finalTranscriptRef.current = "";
        setUserTranscript("");
        sendToOscar(remaining);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") {
        setPhase("error");
        setErrorMsg("Acces au microphone refuse. Autorisez l'acces dans les reglages.");
      }
    };

    try { recognition.start(); } catch { /* already running */ }
    recognitionRef.current = recognition;
  }, [sendToOscar]);

  const resumeListening = useCallback(() => {
    if (!mountedRef.current || !micEnabled) return;
    finalTranscriptRef.current = "";
    setUserTranscript("");
    startListening();
  }, [startListening, micEnabled]);

  // ─── Initialize call (audio-only) ─────────────────────
  const initCall = useCallback(async () => {
    setPhase("permissions");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      setPhase("active");
      setOscarState("listening");

      setTimeout(() => {
        if (mountedRef.current) {
          const greetings = [
            "Bonjour ! Je vous ecoute, que puis-je faire pour vous ?",
            "Bonjour ! Comment puis-je vous aider ?",
            "Me voila ! Dites-moi ce dont vous avez besoin.",
          ];
          const greeting = greetings[Math.floor(Math.random() * greetings.length)];
          setOscarText(greeting);
          setConversationLog([{ role: "oscar", text: greeting }]);
          historyRef.current.push({ role: "assistant", content: greeting });
          speakOscar(greeting);
        }
      }, 500);
    } catch (err) {
      if (!mountedRef.current) return;
      setPhase("error");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMsg("Acces au microphone refuse. Autorisez l'acces dans les reglages de votre navigateur.");
      } else {
        setErrorMsg("Impossible d'acceder au micro.");
      }
    }
  }, [speakOscar]);

  // ─── Effect: open/close ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    mountedRef.current = true;
    initCall();
    return () => { mountedRef.current = false; cleanup(); };
  }, [isOpen]);

  // ─── Toggle mic ─────────────────────────────────────────
  const toggleMic = () => {
    if (micEnabled) {
      wantListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      setMicEnabled(false);
      if (oscarState === "listening") setOscarState("idle");
    } else {
      setMicEnabled(true);
      if (phase === "active" && !processingRef.current) {
        setOscarState("listening");
        startListening();
      }
    }
  };

  // ─── Start camera (with specific facing mode) ─────────
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // Stop any existing video tracks
    const existing = streamRef.current?.getVideoTracks() || [];
    existing.forEach(t => { t.stop(); streamRef.current?.removeTrack(t); });

    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const videoTrack = camStream.getVideoTracks()[0];
      if (!videoTrack) { toast.error("Camera introuvable."); return false; }

      if (streamRef.current) {
        streamRef.current.addTrack(videoTrack);
      } else {
        streamRef.current = camStream;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream([videoTrack]);
      }
      return true;
    } catch {
      toast.error("Impossible d'acceder a la camera. Verifiez les permissions.");
      return false;
    }
  }, []);

  // ─── Toggle camera ──────────────────────────────────────
  const toggleCam = async () => {
    if (camEnabled) {
      const videoTracks = streamRef.current?.getVideoTracks() || [];
      videoTracks.forEach(t => { t.stop(); streamRef.current?.removeTrack(t); });
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamEnabled(false);
    } else {
      const ok = await startCamera(facingMode);
      if (ok) setCamEnabled(true);
    }
  };

  // ─── Flip camera ────────────────────────────────────────
  const flipCamera = async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    if (camEnabled) {
      await startCamera(newFacing);
    }
  };

  // ─── Format duration ────────────────────────────────────
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden">
      {/* ── Permissions / Loading ── */}
      {phase === "permissions" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <OscarOrb state="connecting" />
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Connexion en cours...</p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">
              Oscar prepare l'appel. Autorisez l'acces au micro si demande.
            </p>
          </div>
          <button onClick={handleEndCall} className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base">
            Annuler
          </button>
        </div>
      )}

      {/* ── Active Call ── */}
      {phase === "active" && (
        <>
          {/* Fullscreen camera background (when enabled) */}
          {camEnabled && (
            <div className="absolute inset-0 z-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
              {/* Dark overlay so orb/text remain visible */}
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}
          {/* Hidden video element when camera is off (needed for ref) */}
          {!camEnabled && <video ref={videoRef} autoPlay playsInline muted className="hidden" />}

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                oscarState === "speaking" ? "bg-green-400 animate-pulse" : oscarState === "thinking" ? "bg-yellow-400 animate-pulse" : "bg-green-500"
              )} />
              <span className="text-white/80 text-sm font-medium">
                {oscarState === "listening" ? "Oscar ecoute..." : oscarState === "thinking" ? "Oscar reflechit..." : oscarState === "speaking" ? "Oscar parle..." : "En appel avec Oscar"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {camEnabled && (
                <span className="text-xs text-teal-300/80 bg-teal-500/20 px-2 py-0.5 rounded-full">Oscar voit</span>
              )}
              <span className="text-white/50 text-sm font-mono tabular-nums">{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* Main area: Oscar orb (centered, overlaying camera) */}
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <OscarOrb state={oscarState === "speaking" ? "speaking" : oscarState === "thinking" ? "thinking" : oscarState === "listening" ? "listening" : "idle"} />

            {/* Oscar subtitle text */}
            {showSubtitles && oscarText && (
              <div className="absolute bottom-24 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-5 py-3 max-h-32 overflow-y-auto">
                  <p className="text-white text-base leading-relaxed text-center">
                    {oscarText.length > 200 ? "..." + oscarText.slice(-200) : oscarText}
                  </p>
                </div>
              </div>
            )}

            {/* User transcript */}
            {showSubtitles && userTranscript && oscarState === "listening" && (
              <div className="absolute bottom-24 left-4 right-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3">
                  <p className="text-white/80 text-base leading-relaxed text-center italic">{userTranscript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6">
            <div className="flex items-center justify-center gap-4">
              {/* Mic toggle */}
              <button
                onClick={toggleMic}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                  micEnabled ? "bg-white/15 text-white" : "bg-red-500/80 text-white"
                )}
                aria-label={micEnabled ? "Couper le micro" : "Activer le micro"}
              >
                {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Camera toggle */}
              <button
                onClick={toggleCam}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                  camEnabled ? "bg-white/15 text-white" : "bg-white/10 text-white/50"
                )}
                aria-label={camEnabled ? "Couper la camera" : "Activer la camera"}
              >
                {camEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Hang up */}
              <button
                onClick={handleEndCall}
                className="rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
                style={{ width: 72, height: 72 }}
                aria-label="Raccrocher"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              {/* Flip camera (only visible when camera is on) */}
              <button
                onClick={flipCamera}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                  camEnabled ? "bg-white/15 text-white" : "bg-white/5 text-white/20 pointer-events-none"
                )}
                aria-label="Retourner la camera"
                disabled={!camEnabled}
              >
                <SwitchCamera className="w-6 h-6" />
              </button>

              {/* Subtitles toggle */}
              <button
                onClick={() => setShowSubtitles(s => !s)}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                  showSubtitles ? "bg-white/15 text-white" : "bg-white/10 text-white/50"
                )}
                aria-label="Sous-titres"
              >
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Error state ── */}
      {phase === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <MicOff className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Probleme de connexion</p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">{errorMsg}</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={initCall} className="px-6 py-3 rounded-full bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all active:scale-95 text-base">
              Reessayer
            </button>
            <button onClick={handleEndCall} className="px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Ended state ── */}
      {phase === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span className="text-3xl">&#128075;</span>
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Appel termine</p>
            <p className="text-white/50 text-base">Duree : {formatDuration(callDuration)}</p>
          </div>
          <button onClick={handleEndCall} className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 text-base">
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Animated Orb — visual representation of Oscar
// ─────────────────────────────────────────────────────────
type OrbAnimState = "connecting" | "idle" | "listening" | "thinking" | "speaking";

function OscarOrb({ state }: { state: OrbAnimState }) {
  const config: Record<OrbAnimState, { gradient: string; speed: string; scale: string; glow: string }> = {
    connecting: {
      gradient: "conic-gradient(from 0deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)",
      speed: "3s", scale: "scale-90", glow: "rgba(66, 133, 244, 0.15)",
    },
    idle: {
      gradient: "conic-gradient(from 0deg, #4285F4, #38b2ac, #4285F4)",
      speed: "6s", scale: "scale-100", glow: "rgba(56, 178, 172, 0.1)",
    },
    listening: {
      gradient: "conic-gradient(from 0deg, #2DD4BF, #0F766E, #2DD4BF)",
      speed: "4s", scale: "scale-100", glow: "rgba(45, 212, 191, 0.2)",
    },
    thinking: {
      gradient: "conic-gradient(from 0deg, #FBBC05, #F59E0B, #EA4335, #FBBC05)",
      speed: "2s", scale: "scale-95", glow: "rgba(251, 188, 5, 0.15)",
    },
    speaking: {
      gradient: "conic-gradient(from 0deg, #34A853, #2DD4BF, #4285F4, #34A853)",
      speed: "2.5s", scale: "scale-110", glow: "rgba(52, 168, 83, 0.2)",
    },
  };

  const c = config[state];

  return (
    <div className="relative w-48 h-48">
      <div
        className={cn("absolute inset-[-30%] rounded-full transition-all duration-700 blur-3xl",
          state === "speaking" ? "opacity-80" : state === "listening" ? "opacity-60" : "opacity-40"
        )}
        style={{ background: c.gradient, animation: `orbRotate ${c.speed} linear infinite` }}
      />
      <div
        className={cn("absolute inset-[-10%] rounded-full transition-all duration-500 blur-xl", c.scale)}
        style={{ background: c.gradient, animation: `orbRotate ${c.speed} linear infinite reverse` }}
      />
      <div
        className={cn("absolute inset-[10%] rounded-full transition-all duration-500", c.scale)}
        style={{ background: c.gradient, animation: `orbRotate ${c.speed} linear infinite`, boxShadow: `0 0 60px 20px ${c.glow}` }}
      />
      <div
        className={cn("absolute inset-[25%] rounded-full transition-all duration-500",
          state === "speaking" ? "bg-white/20" : state === "listening" ? "bg-white/15" : "bg-white/10"
        )}
        style={{
          animation: state === "speaking" ? "orbPulse 0.8s ease-in-out infinite"
            : state === "thinking" ? "orbPulse 1s ease-in-out infinite"
            : state === "listening" ? "orbPulse 2s ease-in-out infinite"
            : state === "connecting" ? "orbPulse 1.5s ease-in-out infinite"
            : "orbPulse 3s ease-in-out infinite",
        }}
      />
      {state === "listening" && (
        <div className="absolute inset-[-5%] rounded-full border-2 border-teal-400/30" style={{ animation: "orbPulse 2s ease-in-out infinite" }} />
      )}
      <style>{`
        @keyframes orbRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbPulse { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 1; } }
      `}</style>
    </div>
  );
}
