import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MessageSquare, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface CallScreenProps { isOpen: boolean; onClose: () => void; }
type CallPhase = "permissions" | "active" | "ended" | "error";
type OscarState = "listening" | "thinking" | "speaking" | "idle";

// ─── API URLs ────────────────────────────────────────────
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const MISTRAL_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;

// Frame capture interval (ms) — how often we snapshot the camera
const FRAME_INTERVAL = 4000;

// ─── Capture a frame from video as base64 JPEG ───────────
function captureFrame(video: HTMLVideoElement): string | null {
  try {
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65);
  } catch { return null; }
}

// ─── Main Component ───────────────────────────────────────
export function CallScreen({ isOpen, onClose }: CallScreenProps) {
  const [phase, setPhase] = useState<CallPhase>("permissions");
  const [oscarState, setOscarState] = useState<OscarState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [userTranscript, setUserTranscript] = useState("");
  const [oscarText, setOscarText] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortTtsRef = useRef<AbortController | null>(null);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const camEnabledRef = useRef(false);

  // Real-time vision: continuously captured frame
  const latestFrameRef = useRef<string | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { camEnabledRef.current = camEnabled; }, [camEnabled]);

  // ─── Continuous frame capture (real-time vision) ───────
  useEffect(() => {
    if (camEnabled && phase === "active") {
      // Capture immediately
      if (videoRef.current) latestFrameRef.current = captureFrame(videoRef.current);
      // Then every FRAME_INTERVAL ms
      frameIntervalRef.current = setInterval(() => {
        if (videoRef.current && camEnabledRef.current) {
          latestFrameRef.current = captureFrame(videoRef.current);
        }
      }, FRAME_INTERVAL);
    } else {
      latestFrameRef.current = null;
      if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    }
    return () => {
      if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    };
  }, [camEnabled, phase]);

  // ─── Cleanup ────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    wantListeningRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
    abortTtsRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    latestFrameRef.current = null;
    setPhase("permissions"); setOscarState("idle"); setCallDuration(0);
    setUserTranscript(""); setOscarText("");
    setCamEnabled(false); setFacingMode("user");
    historyRef.current = []; processingRef.current = false; finalTranscriptRef.current = "";
  }, []);

  const handleEndCall = useCallback(() => { cleanup(); onClose(); }, [cleanup, onClose]);

  // ─── TTS ───────────────────────────────────────────────
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
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
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
        const done = () => { audioRef.current = null; URL.revokeObjectURL(url); if (mountedRef.current) { setOscarState("listening"); resumeListening(); } resolve(); };
        audio.onended = done; audio.onerror = done; audio.play().catch(done);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (mountedRef.current) { try { await browserTTS(truncated); } catch { /* */ } setOscarState("listening"); resumeListening(); }
    }
  }, []);

  const browserTTS = (text: string): Promise<void> => new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "fr-FR"; u.rate = 0.95;
    u.onend = () => resolve(); u.onerror = () => resolve(); window.speechSynthesis.speak(u);
  });

  // ─── Send to Mistral (always includes latest frame if camera on) ──
  const sendToOscar = useCallback(async (text: string) => {
    if (!mountedRef.current || !text.trim()) return;
    processingRef.current = true;
    setOscarState("thinking"); setOscarText("");

    // Always use the latest continuously-captured frame
    const frame = latestFrameRef.current;

    // Build message content
    let userContent: string | Array<{ type: string; text?: string; image_url?: string }>;
    if (frame) {
      userContent = [
        { type: "text", text },
        { type: "image_url", image_url: frame },
      ];
    } else {
      userContent = text;
    }

    // History: text-only to avoid bloat
    const textForHistory = frame ? `${text} [camera en direct]` : text;
    const messagesToSend = [
      ...historyRef.current.slice(-18),
      { role: "user", content: userContent },
    ];

    historyRef.current.push({ role: "user", content: textForHistory });

    try {
      const res = await fetch(MISTRAL_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: messagesToSend }),
      });
      if (!res.ok) throw new Error("Mistral error");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "", buffer = "", eventType = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) { eventType = ""; continue; }
          if (trimmed.startsWith("event: ")) { eventType = trimmed.slice(7).trim(); continue; }
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;
          if (eventType === "tool_result") { eventType = ""; continue; }
          try { const parsed = JSON.parse(data); const token = parsed.choices?.[0]?.delta?.content; if (token) { fullText += token; if (mountedRef.current) setOscarText(fullText); } } catch { /* skip */ }
        }
      }

      if (fullText) {
        historyRef.current.push({ role: "assistant", content: fullText });
        await speakOscar(fullText);
      } else {
        if (mountedRef.current) { setOscarState("listening"); resumeListening(); }
      }
    } catch {
      if (mountedRef.current) { setOscarText("Desole, je n'ai pas pu vous repondre. Reessayez."); setOscarState("listening"); resumeListening(); }
    } finally { processingRef.current = false; }
  }, [speakOscar]);

  // ─── STT ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    wantListeningRef.current = true; finalTranscriptRef.current = ""; setUserTranscript("");
    const recognition = new SR();
    recognition.lang = "fr-FR"; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 1;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscriptRef.current += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setUserTranscript(finalTranscriptRef.current + interim);
      if (silenceTimer) clearTimeout(silenceTimer);
      if (finalTranscriptRef.current.trim()) {
        silenceTimer = setTimeout(() => {
          const txt = finalTranscriptRef.current.trim();
          if (txt && !processingRef.current) {
            wantListeningRef.current = false;
            try { recognition.stop(); } catch { /* */ }
            finalTranscriptRef.current = ""; setUserTranscript("");
            sendToOscar(txt);
          }
        }, 2000);
      }
    };
    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (wantListeningRef.current && mountedRef.current && !processingRef.current) { try { recognition.start(); return; } catch { /* */ } }
      const remaining = finalTranscriptRef.current.trim();
      if (remaining && !processingRef.current) { finalTranscriptRef.current = ""; setUserTranscript(""); sendToOscar(remaining); }
    };
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") { setPhase("error"); setErrorMsg("Acces au microphone refuse. Autorisez l'acces dans les reglages."); }
    };
    try { recognition.start(); } catch { /* already running */ }
    recognitionRef.current = recognition;
  }, [sendToOscar]);

  const resumeListening = useCallback(() => {
    if (!mountedRef.current || !micEnabled) return;
    finalTranscriptRef.current = ""; setUserTranscript(""); startListening();
  }, [startListening, micEnabled]);

  // ─── Init call (audio-only) ────────────────────────────
  const initCall = useCallback(async () => {
    setPhase("permissions");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      setPhase("active"); setOscarState("listening");
      setTimeout(() => {
        if (mountedRef.current) {
          const greetings = ["Bonjour ! Je vous ecoute, que puis-je faire pour vous ?", "Bonjour ! Comment puis-je vous aider ?", "Me voila ! Dites-moi ce dont vous avez besoin."];
          const greeting = greetings[Math.floor(Math.random() * greetings.length)];
          setOscarText(greeting);
          historyRef.current.push({ role: "assistant", content: greeting });
          speakOscar(greeting);
        }
      }, 500);
    } catch (err) {
      if (!mountedRef.current) return;
      setPhase("error");
      setErrorMsg(err instanceof DOMException && err.name === "NotAllowedError" ? "Acces au microphone refuse. Autorisez l'acces dans les reglages de votre navigateur." : "Impossible d'acceder au micro.");
    }
  }, [speakOscar]);

  useEffect(() => {
    if (!isOpen) return;
    mountedRef.current = true; initCall();
    return () => { mountedRef.current = false; cleanup(); };
  }, [isOpen]);

  // ─── Toggle mic ─────────────────────────────────────────
  const toggleMic = () => {
    if (micEnabled) {
      wantListeningRef.current = false; try { recognitionRef.current?.abort(); } catch { /* */ }
      setMicEnabled(false); if (oscarState === "listening") setOscarState("idle");
    } else {
      setMicEnabled(true);
      if (phase === "active" && !processingRef.current) { setOscarState("listening"); startListening(); }
    }
  };

  // ─── Camera helpers ────────────────────────────────────
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    const existing = streamRef.current?.getVideoTracks() || [];
    existing.forEach(t => { t.stop(); streamRef.current?.removeTrack(t); });
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      const videoTrack = camStream.getVideoTracks()[0];
      if (!videoTrack) { toast.error("Camera introuvable."); return false; }
      if (streamRef.current) streamRef.current.addTrack(videoTrack); else streamRef.current = camStream;
      if (videoRef.current) videoRef.current.srcObject = new MediaStream([videoTrack]);
      return true;
    } catch { toast.error("Impossible d'acceder a la camera. Verifiez les permissions."); return false; }
  }, []);

  const toggleCam = async () => {
    if (camEnabled) {
      const vt = streamRef.current?.getVideoTracks() || [];
      vt.forEach(t => { t.stop(); streamRef.current?.removeTrack(t); });
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamEnabled(false);
    } else { if (await startCamera(facingMode)) setCamEnabled(true); }
  };

  const flipCamera = async () => {
    const nf = facingMode === "user" ? "environment" : "user";
    setFacingMode(nf);
    if (camEnabled) await startCamera(nf);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!isOpen) return null;

  // ─── Status bar color/label ────────────────────────────
  const stateColor = oscarState === "speaking" ? "#34D399" : oscarState === "thinking" ? "#FBBF24" : oscarState === "listening" ? "#2DD4BF" : "#6B7280";
  const stateLabel = oscarState === "listening" ? "Oscar ecoute..." : oscarState === "thinking" ? "Oscar reflechit..." : oscarState === "speaking" ? "Oscar parle..." : "En appel avec Oscar";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#111] overflow-hidden">
      {/* ── Permissions ── */}
      {phase === "permissions" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          {/* Simple spinner */}
          <div className="w-16 h-16 rounded-full border-4 border-teal-500/30 border-t-teal-400" style={{ animation: "spin 1s linear infinite" }} />
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Connexion en cours...</p>
            <p className="text-white/50 text-base max-w-xs leading-relaxed">Autorisez l'acces au micro si demande.</p>
          </div>
          <button onClick={handleEndCall} className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base">Annuler</button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Active Call ── */}
      {phase === "active" && (
        <>
          {/* Fullscreen camera */}
          {camEnabled && (
            <div className="absolute inset-0 z-0">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
            </div>
          )}
          {!camEnabled && <video ref={videoRef} autoPlay playsInline muted className="hidden" />}

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
            <div className="flex items-center gap-3">
              {/* Animated state dot */}
              <div className="relative">
                <div className="w-3 h-3 rounded-full" style={{ background: stateColor }} />
                {(oscarState === "listening" || oscarState === "speaking") && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full" style={{ background: stateColor, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                )}
              </div>
              <span className="text-white/80 text-sm font-medium">{stateLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              {camEnabled && (
                <span className="text-xs text-teal-300/90 bg-teal-500/20 px-2.5 py-1 rounded-full font-medium">Vision active</span>
              )}
              <span className="text-white/40 text-sm font-mono tabular-nums">{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* Center area — no orb, just spacer + subtitles */}
          <div className="flex-1 relative z-10 flex flex-col justify-end">
            {/* Oscar's response text */}
            {showSubtitles && oscarText && (
              <div className="px-5 mb-3">
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl px-5 py-3.5 max-h-40 overflow-y-auto border border-white/5">
                  <p className="text-white text-base leading-relaxed text-center">
                    {oscarText.length > 250 ? "..." + oscarText.slice(-250) : oscarText}
                  </p>
                </div>
              </div>
            )}

            {/* User speech transcript */}
            {showSubtitles && userTranscript && oscarState === "listening" && (
              <div className="px-5 mb-3">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/5">
                  <p className="text-white/80 text-base leading-relaxed text-center italic">{userTranscript}</p>
                </div>
              </div>
            )}

            {/* Listening wave animation (when no text) — subtle replacement for the orb */}
            {!oscarText && !userTranscript && oscarState === "listening" && (
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1 rounded-full bg-teal-400/60" style={{ height: 16, animation: `wave 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
            {oscarState === "thinking" && (
              <div className="flex items-center justify-center gap-2 mb-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6">
            <div className="flex items-center justify-center gap-4">
              <button onClick={toggleMic} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95", micEnabled ? "bg-white/15 text-white" : "bg-red-500/80 text-white")} aria-label={micEnabled ? "Couper le micro" : "Activer le micro"}>
                {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              <button onClick={toggleCam} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95", camEnabled ? "bg-white/15 text-white" : "bg-white/10 text-white/50")} aria-label={camEnabled ? "Couper la camera" : "Activer la camera"}>
                {camEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <button onClick={handleEndCall} className="rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30" style={{ width: 72, height: 72 }} aria-label="Raccrocher">
                <PhoneOff className="w-8 h-8" />
              </button>

              <button onClick={flipCamera} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95", camEnabled ? "bg-white/15 text-white" : "bg-white/5 text-white/20 pointer-events-none")} aria-label="Retourner la camera" disabled={!camEnabled}>
                <SwitchCamera className="w-6 h-6" />
              </button>

              <button onClick={() => setShowSubtitles(s => !s)} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95", showSubtitles ? "bg-white/15 text-white" : "bg-white/10 text-white/50")} aria-label="Sous-titres">
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          </div>

          <style>{`
            @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
            @keyframes wave { 0%, 100% { height: 8px; opacity: 0.4; } 50% { height: 24px; opacity: 1; } }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          `}</style>
        </>
      )}

      {/* ── Error ── */}
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
            <button onClick={initCall} className="px-6 py-3 rounded-full bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all active:scale-95 text-base">Reessayer</button>
            <button onClick={handleEndCall} className="px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-base">Fermer</button>
          </div>
        </div>
      )}

      {/* ── Ended ── */}
      {phase === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">Appel termine</p>
            <p className="text-white/40 text-base">Duree : {formatDuration(callDuration)}</p>
          </div>
          <button onClick={handleEndCall} className="mt-4 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 text-base">Fermer</button>
        </div>
      )}
    </div>
  );
}
