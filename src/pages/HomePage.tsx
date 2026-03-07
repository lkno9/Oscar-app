import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Phone, Settings, Send, Mic, Square, Paperclip, X, FileText as FileTextIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { useMistralChat } from "@/hooks/useMistralChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { RichCard } from "@/types/chat";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  richCards?: RichCard[];
}

// Pool de suggestions — 3 sont choisies aléatoirement à chaque visite
const ALL_SUGGESTIONS = [
  // Administratif
  "Comment renouveler ma carte vitale ?",
  "Aide-moi avec ma mutuelle",
  "Comment déclarer mes impôts ?",
  "Je veux simuler mes aides sociales",
  "Comment obtenir l'APA ?",
  "Je dois renouveler ma carte d'identité",
  // Santé & bien-être
  "Rappelle-moi de prendre mes médicaments",
  "Je cherche une pharmacie de garde",
  "Aide-moi à prendre un RDV chez le médecin",
  "Quels exercices doux je peux faire ?",
  // Social & émotionnel
  "Je me sens seul aujourd'hui",
  "Aide-moi à écrire un message à mes petits-enfants",
  "Je voudrais appeler ma famille",
  "Raconte-moi quelque chose d'intéressant",
  // Quotidien & pratique
  "Quel temps fait-il aujourd'hui ?",
  "Aide-moi à traduire un texte",
  "Je veux voir les trains pour aller à Lyon",
  "Quel film voir ce soir ?",
  // Sécurité
  "J'ai reçu un SMS bizarre, c'est une arnaque ?",
  "Comment me protéger des arnaques en ligne ?",
  // Loisirs
  "Jouons à un petit quiz !",
  "Qu'est-ce que je peux faire aujourd'hui ?",
];

function pickRandomSuggestions(count: number): string[] {
  const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "ce matin";
  if (h < 18) return "cet après-midi";
  return "ce soir";
}

// ElevenLabs TTS — with abort, play() error handling, and truncation
let currentAudio: HTMLAudioElement | null = null;
let currentTtsAbort: AbortController | null = null;

async function speakWithElevenLabs(text: string): Promise<void> {
  stopSpeech();

  currentTtsAbort?.abort();
  const abortController = new AbortController();
  currentTtsAbort = abortController;

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

interface PendingFile {
  file: File;
  previewUrl?: string;
  type: "image" | "pdf" | "other";
}

export function HomePage() {
  const navigate = useNavigate();
  // 3 suggestions aléatoires choisies au montage
  const suggestions = useMemo(() => pickRandomSuggestions(3), []);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const started = messages.length > 0;

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

  const handleToolResult = useCallback((card: RichCard) => {
    setIsTyping(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.id === lastAssistantIdRef.current) {
        return prev.map(m =>
          m.id === lastAssistantIdRef.current
            ? { ...m, richCards: [...(m.richCards || []), card] }
            : m
        );
      }
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

  // --- STT via Web Speech API ---
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
      if (wantRecordingRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to stop
        }
      }
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
      if (event.error === "no-speech" || event.error === "aborted") return;
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
      wantRecordingRef.current = false;
      recognitionRef.current?.stop();
      return;
    }

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

  // Update input with transcript
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // File reading helpers
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    setPendingFile({
      file,
      previewUrl,
      type: isImage ? "image" : file.type === "application/pdf" ? "pdf" : "other",
    });
    e.target.value = "";
  };

  const removePendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const handleAttach = async (file: File, extraMessage?: string) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isText = file.type === "text/plain" || file.name.endsWith(".txt");
    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
    const isMarkdown = file.name.endsWith(".md");
    const isTextFile = isText || isCsv || isMarkdown;
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");
    const isDoc = file.type === "application/msword" || file.name.endsWith(".doc");

    if (!isImage && !isPdf && !isTextFile && !isDocx && !isDoc) {
      toast.error(`Format non supporté. Oscar peut lire : images, PDF, TXT, CSV et DOCX.`);
      return;
    }

    if (isDoc && !isDocx) {
      toast.error("Le format .doc ancien n'est pas supporté. Convertissez le fichier en .docx ou .pdf.");
      return;
    }

    setIsTyping(true);
    try {
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
          const promptText = extraMessage ? extraMessage : `Peux-tu analyser ce document Word ? (${file.name})`;
          sendToMistral(promptText, base64);
          return;
        } catch {
          setIsTyping(false);
          toast.error("Impossible de lire le fichier Word. Essayez de le convertir en PDF.");
          return;
        }
      }

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

  const handleSubmit = () => {
    if (isTyping || isRecording) return;

    if (pendingFile) {
      handleAttach(pendingFile.file, input.trim() || undefined);
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      setPendingFile(null);
      setInput("");
    } else if (input.trim()) {
      handleSend(input.trim());
      setInput("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = !isTyping && !isRecording && (pendingFile !== null || input.trim().length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', 'Nunito', sans-serif" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between flex-shrink-0 bg-white dark:bg-card"
        style={{
          padding: "16px 20px 14px",
          borderBottom: started ? "1px solid #f1f5f9" : "none",
        }}
      >
        <div className="flex items-center gap-2.5">
          <OscarAvatar size="sm" className="w-9 h-9 shadow-[0_2px_8px_rgba(72,162,158,0.3)]" />
          <div className="flex flex-col gap-px">
            <span className="font-bold text-slate-800 dark:text-foreground" style={{ fontSize: "15.5px", letterSpacing: "-0.2px", lineHeight: 1.2 }}>Oscar</span>
            <span className="text-xs font-medium text-[#48A29E]">En ligne</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCallType("audio"); setIsCallOpen(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            aria-label="Appel audio"
          >
            <Phone className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            aria-label="Paramètres"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      {/* Welcome Screen (no messages) */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 pb-10 animate-fade-in">
          <h1
            className="font-playfair text-center text-slate-800 dark:text-foreground animate-fade-in"
            style={{
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: "-0.5px",
              marginBottom: 36,
              animationDelay: "0.15s",
              animationFillMode: "both",
            }}
          >
            Comment puis-je<br />vous aider {getGreeting()} ?
          </h1>
          <div
            className="flex flex-col gap-2.5 w-full animate-fade-in"
            style={{ animationDelay: "0.35s", animationFillMode: "both" }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="suggestion-btn"
                onClick={() => handleSend(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {started && (
        <div className="flex-1 overflow-y-auto px-4 py-5 thin-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-card" style={{ padding: "10px 16px 24px" }}>
        {/* File preview */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 bg-slate-50 dark:bg-secondary rounded-2xl p-2 pr-3">
            {pendingFile.type === "image" && pendingFile.previewUrl ? (
              <img src={pendingFile.previewUrl} alt="Aperçu" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#48A29E]/10 flex items-center justify-center flex-shrink-0">
                <FileTextIcon className="w-6 h-6 text-[#48A29E]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-foreground truncate">{pendingFile.file.name}</p>
              <p className="text-xs text-slate-400">Vous pouvez ajouter un message</p>
            </div>
            <button onClick={removePendingFile} className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-all flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="glass-input">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isRecording ? "Enregistrement en cours..." : "Demandez à Oscar..."}
            rows={1}
            disabled={isTyping || isRecording}
            className="w-full border-none bg-transparent outline-none text-slate-800 dark:text-foreground placeholder:text-slate-400 resize-none"
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
              marginBottom: 10,
              fontFamily: "'Inter', 'Nunito', sans-serif",
            }}
          />
          <div className="flex items-center justify-between gap-2">
            {/* Plus/attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#48A29E] hover:bg-[#48A29E]/5 transition-all"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              accept="image/*,application/pdf,.docx,.txt,.csv,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2.5">
              {/* Mic button */}
              {webSpeechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-[#48A29E] hover:bg-[#48A29E]/5"
                  }`}
                  aria-label={isRecording ? "Arrêter" : "Parler"}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-[18px] h-[18px]" />}
                </button>
              )}

              {/* Send button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: canSend
                    ? "linear-gradient(135deg, #48A29E 0%, #38b2ac 100%)"
                    : "#e2e8f0",
                }}
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        {isRecording && (
          <p className="text-xs text-center text-slate-400 mt-2 animate-pulse">
            Parlez... Appuyez à nouveau pour envoyer
          </p>
        )}
      </div>

      {/* Call Screen */}
      <CallScreen
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        initialVideoEnabled={callType === "video"}
      />
    </div>
  );
}
