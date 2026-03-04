import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, X } from "lucide-react";
import { OscarAvatar } from "./OscarAvatar";
import { streamChat, Message } from "@/lib/oscarChat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function CallScreen({ isOpen, onClose }: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isOscarSpeaking, setIsOscarSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [statusText, setStatusText] = useState("Connexion...");

  const conversationRef = useRef<Message[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const webSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // --- ElevenLabs TTS (try first) then fallback to browser ---
  const speakAsOscar = useCallback(async (text: string): Promise<void> => {
    setIsOscarSpeaking(true);
    setStatusText("Oscar parle...");

    // Try ElevenLabs first
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
      // Fallback to Web Speech API
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

    setIsOscarSpeaking(false);
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
    setIsOscarSpeaking(false);
  }, []);

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

      // Reset silence timer — user is still speaking
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // 2 seconds of silence → send the message
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
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantListeningRef.current = false;
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Accès au microphone refusé.");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setStatusText("Oscar écoute...");
    } catch { /* already running */ }
  }, [webSpeechSupported]);

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
    setIsListening(false);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  // --- Process user speech → Mistral → Oscar speaks ---
  const processUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);
    setStatusText("Oscar réfléchit...");
    setIsListening(false);

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
        setIsProcessing(false);

        // Oscar speaks the response
        await speakAsOscar(oscarResponse);

        // Resume listening after Oscar finishes
        if (!isMuted && wantListeningRef.current !== false) {
          setTimeout(() => startListening(), 300);
        }
      },
      onError: (error) => {
        toast.error(error);
        setIsProcessing(false);
        setStatusText("Erreur...");
        // Resume listening even on error
        if (!isMuted) {
          setTimeout(() => startListening(), 500);
        }
      },
    });
  }, [isProcessing, isMuted, speakAsOscar, startListening]);

  // --- Toggle mute ---
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      setStatusText("Micro coupé");
    }
  }, [isMuted, startListening, stopListening]);

  // --- Initialize / cleanup call ---
  useEffect(() => {
    if (isOpen) {
      // Reset state
      conversationRef.current = [];
      setCallDuration(0);
      setIsMuted(false);
      setIsProcessing(false);
      setIsOscarSpeaking(false);
      setLiveTranscript("");
      setStatusText("Connexion...");

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Oscar greeting after a short delay
      const greetTimeout = setTimeout(async () => {
        const greeting = "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider ?";
        conversationRef.current = [{ role: "assistant", content: greeting }];
        await speakAsOscar(greeting);
        // Start listening after greeting
        startListening();
      }, 800);

      return () => {
        clearTimeout(greetTimeout);
      };
    } else {
      // Cleanup
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      stopOscarSpeech();
      conversationRef.current = [];
      setCallDuration(0);
    }
  }, [isOpen]);

  // --- End call ---
  const handleEndCall = useCallback(() => {
    stopListening();
    stopOscarSpeech();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    onClose();
  }, [stopListening, stopOscarSpeech, onClose]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Main area */}
      <div className="flex-1 relative bg-oscar-navy overflow-hidden">
        {/* Oscar avatar (center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className={cn(
              "transition-transform duration-300",
              isOscarSpeaking && "animate-pulse scale-110"
            )}>
              <OscarAvatar size="lg" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-foreground">Oscar</h2>
              <p className="text-primary-foreground/70 text-lg">
                {statusText}
              </p>
            </div>

            {/* Audio waveform when listening */}
            {isListening && !isMuted && (
              <div className="flex gap-1.5 items-end h-8">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="w-2 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 20}px`,
                      animationDelay: `${i * 150}ms`,
                      animationDuration: "0.8s",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" />
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Call duration */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/20 px-4 py-2 rounded-full">
          <span className="text-primary-foreground font-medium">
            {formatDuration(callDuration)}
          </span>
        </div>

        {/* Live transcript */}
        {liveTranscript && (
          <div className="absolute bottom-28 left-4 right-4">
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
              <p className="text-foreground text-base">{liveTranscript}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={cn(
              "p-4 rounded-full transition-all",
              !isMuted
                ? "bg-secondary text-foreground"
                : "bg-destructive/20 text-destructive"
            )}
            aria-label={isMuted ? "Activer le micro" : "Désactiver le micro"}
          >
            {!isMuted ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
            aria-label="Terminer l'appel"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
