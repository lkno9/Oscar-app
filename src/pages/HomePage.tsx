import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, Settings, Languages, Cloud, FileText, HelpCircle, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { useMistralChat } from "@/hooks/useMistralChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { RichCard } from "@/types/chat";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  richCards?: RichCard[];
}

const INITIAL_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me poser vos questions, nous ferons cela ensemble. 😊",
};

const SUGGESTION_CHIPS = [
  { label: "Traduire un texte", icon: Languages, message: "Peux-tu me traduire ce texte en anglais : " },
  { label: "Météo du jour", icon: Cloud, message: "Quel temps fait-il aujourd'hui ?" },
  { label: "Analyser un document", icon: FileText, message: "Peux-tu m'aider à comprendre ce document ?" },
  { label: "Mes droits & aides", icon: HelpCircle, message: "Quelles aides suis-je éligible en tant que senior ?" },
  { label: "Écrire un message", icon: PenLine, message: "Aide-moi à écrire un message pour " },
];

// ElevenLabs TTS — with abort, play() error handling, and truncation
let currentAudio: HTMLAudioElement | null = null;
let currentTtsAbort: AbortController | null = null;

async function speakWithElevenLabs(text: string): Promise<void> {
  stopSpeech();

  currentTtsAbort?.abort();
  const abortController = new AbortController();
  currentTtsAbort = abortController;

  // Truncate very long text to avoid ElevenLabs limits
  const truncatedText = text.length > 4000 ? text.substring(0, 4000) + "..." : text;

  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text: truncatedText }),
    signal: abortController.signal,
  });

  if (!response.ok) throw new Error("TTS échoué");
  const blob = await response.blob();
  if (blob.size === 0) throw new Error("Audio vide");

  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;

    const cleanup = () => {
      currentAudio = null;
      currentTtsAbort = null;
      URL.revokeObjectURL(url);
    };

    audio.onended = () => { cleanup(); resolve(); };
    audio.onerror = () => { cleanup(); reject(new Error("Erreur lecture audio")); };

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((err) => {
        // Audio play() was rejected (user hasn't interacted yet)
        cleanup();
        reject(err);
      });
    }
  });
}

function stopSpeech() {
  currentTtsAbort?.abort();
  currentTtsAbort = null;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function HomePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageData[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantIdRef = useRef<string | null>(null);

  const { user } = useAuth();

  // Real SSE streaming: accumulate tokens into assistant message
  const handleStreamDelta = useCallback((token: string) => {
    setIsTyping(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.id === lastAssistantIdRef.current) {
        return prev.map(m =>
          m.id === lastAssistantIdRef.current
            ? { ...m, content: m.content + token }
            : m
        );
      }
      const id = Date.now().toString();
      lastAssistantIdRef.current = id;
      return [...prev, { id, role: "assistant" as const, content: token }];
    });
  }, []);

  const handleStreamDone = useCallback((_fullText: string) => {
    setIsTyping(false);
    lastAssistantIdRef.current = null;
  }, []);

  const handleStreamError = useCallback((error: string) => {
    setIsTyping(false);
    lastAssistantIdRef.current = null;
    toast.error(error);
  }, []);

  // Handle rich card tool results from Mistral function calling
  const handleToolResult = useCallback((card: RichCard) => {
    setIsTyping(false);
    setMessages(prev => {
      // Find or create the current assistant message to attach the card
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.id === lastAssistantIdRef.current) {
        return prev.map(m =>
          m.id === lastAssistantIdRef.current
            ? { ...m, richCards: [...(m.richCards || []), card] }
            : m
        );
      }
      // Create new assistant message with card (text will follow via delta)
      const id = Date.now().toString();
      lastAssistantIdRef.current = id;
      return [...prev, { id, role: "assistant" as const, content: "", richCards: [card] }];
    });
  }, []);

  const { sendMessage: sendToMistral } = useMistralChat({
    onDelta: handleStreamDelta,
    onDone: handleStreamDone,
    onError: handleStreamError,
    onToolResult: handleToolResult,
  });

  // Medication reminders
  useEffect(() => {
    if (!user) return;
    const lastReminderRef = { window: "" };
    const checkMedReminders = async () => {
      const now = new Date();
      const hour = now.getHours();
      const morningWindow = hour >= 7 && hour < 10;
      const noonWindow = hour >= 12 && hour < 14;
      const eveningWindow = hour >= 18 && hour < 21;
      if (!morningWindow && !noonWindow && !eveningWindow) return;
      const currentWindow = morningWindow ? "matin" : noonWindow ? "midi" : "soir";
      if (lastReminderRef.window === currentWindow) return;
      const { data: meds } = await supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true);
      if (!meds || meds.length === 0) return;
      lastReminderRef.window = currentWindow;
      toast(`💊 Rappel médicaments du ${currentWindow}`, {
        description: `N'oubliez pas de prendre vos ${meds.length} médicament${meds.length > 1 ? 's' : ''}.`,
        duration: 8000,
        action: { label: 'Voir', onClick: () => navigate('/services/health') },
      });
    };
    checkMedReminders();
    const interval = setInterval(checkMedReminders, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- TTS ---
  const handleSpeak = async (text: string, messageId?: string) => {
    stopSpeech();
    if (messageId) setSpeakingMessageId(messageId);
    setIsSpeakingState(true);
    try {
      await speakWithElevenLabs(text);
    } catch {
      // ElevenLabs TTS failed, falling back to browser speech
      // Don't silently fallback — show a toast so we know ElevenLabs is failing
      toast.info("Voix ElevenLabs indisponible, utilisation de la voix du navigateur.");
      try {
        await fallbackSpeak(text);
      } catch {
        toast.error("Impossible de lire le message");
      }
    } finally {
      setIsSpeakingState(false);
      setSpeakingMessageId(null);
    }
  };

  const fallbackSpeak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const handleStopSpeaking = () => {
    stopSpeech();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeakingState(false);
    setSpeakingMessageId(null);
  };

  // --- STT via Web Speech API (gratuit, natif navigateur) ---
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState("");
  const wantRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const webSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecognition = () => {
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
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      // If user still wants to record, restart automatically
      // (Chrome stops after silences, this keeps it alive)
      if (wantRecordingRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to stop
        }
      }
      // Actually stopping
      setIsRecording(false);
      const text = finalTranscriptRef.current.trim();
      setTranscript("");
      finalTranscriptRef.current = "";
      if (text) {
        handleSend(text);
      }
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are not fatal — let onend handle restart
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      // Fatal errors — stop everything
      wantRecordingRef.current = false;
      setIsRecording(false);
      setTranscript("");
      finalTranscriptRef.current = "";
      recognitionRef.current = null;
      if (event.error === "not-allowed") {
        toast.error("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
      } else {
        // STT error handled — show toast to user
        toast.error("Erreur de reconnaissance vocale.");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      // User wants to stop — send what we have
      wantRecordingRef.current = false;
      recognitionRef.current?.stop();
      return;
    }

    // Stop any ongoing speech first
    stopSpeech();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeakingState(false);
    setSpeakingMessageId(null);

    if (!webSpeechSupported) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    try {
      finalTranscriptRef.current = "";
      wantRecordingRef.current = true;
      setIsRecording(true);
      setTranscript("");
      startRecognition();
    } catch (err) {
      wantRecordingRef.current = false;
      setIsRecording(false);
      // STT initialization failed
      toast.error("Impossible de démarrer la reconnaissance vocale.");
    }
  };

  // Read a file as text (for .txt, .csv, .md, etc.)
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Read a file as base64 data URL (for images, PDFs)
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAttach = async (files: FileList, extraMessage?: string) => {
    const file = files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isText = file.type === "text/plain" || file.name.endsWith(".txt");
    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
    const isMarkdown = file.name.endsWith(".md");
    const isTextFile = isText || isCsv || isMarkdown;
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");
    const isDoc = file.type === "application/msword" || file.name.endsWith(".doc");

    // Unsupported types
    if (!isImage && !isPdf && !isTextFile && !isDocx && !isDoc) {
      toast.error(`Format non supporté. Oscar peut lire : images, PDF, TXT, CSV et DOCX.`);
      return;
    }

    // .doc (old Word format) — can't read client-side
    if (isDoc && !isDocx) {
      toast.error("Le format .doc ancien n'est pas supporté. Convertissez le fichier en .docx ou .pdf.");
      return;
    }

    setIsTyping(true);
    try {
      // --- Text files (TXT, CSV, MD) — read as plain text ---
      if (isTextFile) {
        const textContent = await readFileAsText(file);
        const truncated = textContent.length > 10000
          ? textContent.substring(0, 10000) + "\n\n[... fichier tronqué, trop long ...]"
          : textContent;

        const contentLabel = `[Fichier texte : ${file.name}]`;
        const userMsg: ChatMessageData = {
          id: Date.now().toString(),
          role: "user",
          content: extraMessage ? `${contentLabel}\n${extraMessage}` : contentLabel,
        };
        setMessages(prev => [...prev, userMsg]);

        const promptText = extraMessage
          ? `${extraMessage}\n\nVoici le contenu du fichier "${file.name}" :\n\n${truncated}`
          : `Peux-tu analyser ce fichier "${file.name}" ?\n\nVoici son contenu :\n\n${truncated}`;

        sendToMistral(promptText);
        return;
      }

      // --- DOCX — extract text from XML ---
      if (isDocx) {
        try {
          // Send DOCX as base64 for server-side processing
          const base64 = await readFileAsBase64(file);

          const contentLabel = `[Document Word : ${file.name}]`;
          const userMsg: ChatMessageData = {
            id: Date.now().toString(),
            role: "user",
            content: extraMessage ? `${contentLabel}\n${extraMessage}` : contentLabel,
          };
          setMessages(prev => [...prev, userMsg]);

          const promptText = extraMessage
            ? extraMessage
            : `Peux-tu analyser ce document Word ? (${file.name})`;

          // Send as base64 — edge function will handle it
          sendToMistral(promptText, base64);
          return;
        } catch {
          setIsTyping(false);
          toast.error("Impossible de lire le fichier Word. Essayez de le convertir en PDF.");
          return;
        }
      }

      // --- Images & PDFs — read as base64 ---
      const base64 = await readFileAsBase64(file);

      const contentLabel = isImage ? `[Image envoyée : ${file.name}]` : `[Document envoyé : ${file.name}]`;
      const userMsg: ChatMessageData = {
        id: Date.now().toString(),
        role: "user",
        content: extraMessage ? `${contentLabel}\n${extraMessage}` : contentLabel,
        imageUrl: isImage ? base64 : undefined,
      };
      setMessages(prev => [...prev, userMsg]);

      const promptText = extraMessage
        ? extraMessage
        : isImage
          ? `Peux-tu analyser cette image ? (${file.name})`
          : `Peux-tu analyser ce document ? (${file.name})`;

      sendToMistral(promptText, base64);
    } catch {
      setIsTyping(false);
      toast.error("Impossible de lire le fichier");
    }
  };

  const handleSend = async (content: string) => {
    setIsRecording(false);

    const userMessage: ChatMessageData = { id: Date.now().toString(), role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    sendToMistral(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OscarAvatar size="md" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Oscar</h1>
              <p className="text-xs text-muted-foreground capitalize">{format(new Date(), "EEEE d MMMM", { locale: fr })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCallType("audio"); setIsCallOpen(true); }}
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Appel audio"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            imageUrl={message.imageUrl}
            richCards={message.richCards}
            messageId={message.id}
            onSpeak={(text) => handleSpeak(text, message.id)}
            onStopSpeaking={handleStopSpeaking}
            isSpeaking={isSpeakingState}
            speakingMessageId={speakingMessageId || undefined}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips — visible when conversation is empty */}
      {messages.length === 0 && !isTyping && (
        <div className="px-4 pb-2 pt-1 bg-card border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Oscar peut vous aider avec :</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {SUGGESTION_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip.message)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-secondary text-foreground text-sm font-medium whitespace-nowrap hover:border-primary hover:bg-primary/5 transition-all flex-shrink-0"
              >
                <chip.icon className="w-3.5 h-3.5 text-primary" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAttach={handleAttach}
        onAudioRecorded={undefined}
        disabled={isTyping}
        isListening={isRecording}
        isRecording={isRecording}
        transcript={transcript}
        onVoiceToggle={handleVoiceToggle}
        voiceSupported={webSpeechSupported}
      />

      {/* Call Screen */}
      <CallScreen
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        initialVideoEnabled={callType === "video"}
      />
    </div>
  );
}
