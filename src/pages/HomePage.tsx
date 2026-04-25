import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Phone, Settings, Send, Mic, Square, Paperclip, X, FileText as FileTextIcon, Clock, Plus, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { useMistralChat } from "@/hooks/useMistralChat";
import { useDemarcheChat } from "@/hooks/useDemarcheChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSeniorContext } from "@/hooks/useSeniorContext";
import { toast } from "sonner";
import type { RichCard, DemarcheCardData } from "@/types/chat";
import {
  ANALYSIS_ACCEPT,
  isImageFile,
  isPdfFile,
  isTextFile as isTextFileCheck,
  isDocxFile,
  isOldDocFile,
  validateAnalysisSize,
  readFileAsBase64 as readBase64,
  readFileAsText as readText,
} from "@/lib/fileUtils";

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


// Mistral Voxtral TTS — with abort, play() error handling, and truncation
let currentAudio: HTMLAudioElement | null = null;
let currentTtsAbort: AbortController | null = null;

async function speakWithMistral(text: string): Promise<void> {
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

interface ConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
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
  // Call always starts audio-only; user can toggle video during the call
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const seniorContext = useSeniorContext(user?.id);
  const started = messages.length > 0;

  // Load conversation list for history panel
  const loadConversationList = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("conversations" as any)
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20) as any;
      if (data) setConversations(data as ConversationSummary[]);
    } catch {
      // Non-blocking
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversationList();
  }, [loadConversationList]);

  // Start a fresh new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
    lastAssistantIdRef.current = null;
  }, []);

  // Switch to a past conversation
  const handleSelectConversation = useCallback((id: string) => {
    setMessages([]);
    lastAssistantIdRef.current = null;
    setCurrentConversationId(id);
    setShowHistory(false);
  }, []);

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

  // Ref to hold the démarche completion callback (set after demarcheChat is initialized)
  const demarcheDoneRef = useRef<((text: string) => void) | null>(null);

  const handleStreamDone = useCallback((fullText: string) => {
    setIsTyping(false);
    lastAssistantIdRef.current = null;
    // If we're in a démarche flow, finalize the card
    demarcheDoneRef.current?.(fullText);
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

  const handleHistoryLoaded = useCallback((loaded: import("@/hooks/useMistralChat").MistralMessage[]) => {
    // Restore messages from DB into chat UI
    const restored: ChatMessageData[] = loaded.map((m, i) => ({
      id: `restored-${i}`,
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content.map(c => c.type === "text" ? c.text : "[fichier]").join(" "),
    }));
    if (restored.length > 0) {
      setMessages(restored);
    }
  }, []);

  const { sendMessage: sendToMistral } = useMistralChat({
    onDelta: handleStreamDelta,
    onDone: handleStreamDone,
    onError: handleStreamError,
    onToolResult: handleToolResult,
    userId: user?.id,
    conversationId: currentConversationId,
    onConversationId: (id) => {
      setCurrentConversationId(id);
      // Refresh list so new conversation appears in history
      loadConversationList();
    },
    onHistoryLoaded: handleHistoryLoaded,
    seniorContext,
  });

  // ─── Démarche chat integration ───
  const addAssistantMessageForDemarche = useCallback((text: string) => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, role: "assistant" as const, content: text }]);
    setIsTyping(false);
  }, []);

  const addDemarcheCardToChat = useCallback((data: DemarcheCardData) => {
    const id = Date.now().toString();
    const card: RichCard = { type: "demarche", data };
    setMessages(prev => [...prev, {
      id,
      role: "assistant" as const,
      content: "Votre texte est prêt. Appuyez sur Ouvrir pour l'envoyer depuis votre application email.",
      richCards: [card],
    }]);
    setIsTyping(false);
  }, []);

  const demarcheChat = useDemarcheChat({
    addAssistantMessage: addAssistantMessageForDemarche,
    addDemarcheCard: addDemarcheCardToChat,
    sendToOrchestrator: sendToMistral,
  });

  // Wire up the démarche completion ref
  demarcheDoneRef.current = demarcheChat.isActive
    ? demarcheChat.onGenerationComplete
    : null;

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
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- TTS ---
  const handleSpeak = async (text: string, messageId?: string) => {
    stopSpeech();
    if (messageId) setSpeakingMessageId(messageId);
    setIsSpeakingState(true);
    try {
      await speakWithMistral(text);
    } catch {
      toast.info("Voix Mistral indisponible, utilisation de la voix du navigateur.");
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

  // File handling — uses cross-browser utilities from fileUtils
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = isImageFile(file);
    const previewUrl = isImg ? URL.createObjectURL(file) : undefined;
    setPendingFile({
      file,
      previewUrl,
      type: isImg ? "image" : isPdfFile(file) ? "pdf" : "other",
    });
    e.target.value = "";
  };

  const removePendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const handleAttach = async (file: File, extraMessage?: string) => {
    const isImg = isImageFile(file);
    const isPdf = isPdfFile(file);
    const isTxt = isTextFileCheck(file);
    const isDocx = isDocxFile(file);

    if (!isImg && !isPdf && !isTxt && !isDocx && !isOldDocFile(file)) {
      toast.error("Format non supporté. Oscar peut lire : images (JPEG, PNG, HEIC), PDF, TXT, CSV et DOCX.");
      return;
    }

    if (isOldDocFile(file)) {
      toast.error("Le format .doc ancien n'est pas supporté. Convertissez le fichier en .docx ou .pdf.");
      return;
    }

    // Validate file size (images will be compressed, but others might be too big)
    if (!isImg) {
      const sizeErr = validateAnalysisSize(file);
      if (sizeErr) { toast.error(sizeErr); return; }
    }

    setIsTyping(true);
    try {
      // Text-based files: read as text
      if (isTxt) {
        const textContent = await readText(file);
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

      // DOCX: send as base64
      if (isDocx) {
        try {
          const base64 = await readBase64(file);
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

      // Images (auto-compressed via readBase64) & PDFs: send as base64
      const base64 = await readBase64(file);
      const contentLabel = isImg ? `[Image envoyée : ${file.name}]` : `[Document envoyé : ${file.name}]`;
      const userMsg: ChatMessageData = {
        id: Date.now().toString(),
        role: "user",
        content: extraMessage ? `${contentLabel}\n${extraMessage}` : contentLabel,
        imageUrl: isImg ? base64 : undefined,
      };
      setMessages(prev => [...prev, userMsg]);
      const promptText = extraMessage
        ? extraMessage
        : isImg
          ? `Peux-tu analyser cette image ? (${file.name})`
          : `Peux-tu analyser ce document ? (${file.name})`;
      sendToMistral(promptText, base64);
    } catch {
      setIsTyping(false);
      toast.error("Impossible de lire le fichier. Vérifiez le format et réessayez.");
    }
  };

  // Detect family messaging intent (e.g. "envoie un message à ma fille", "écris à Marie")
  const FAMILY_MSG_PATTERNS = [
    /envo(?:ie|yer)\s+(?:un\s+)?(?:message|msg|sms|texto)\s+(?:à|a)\s+(.+)/i,
    /(?:écri(?:s|re)|dire)\s+(?:à|a)\s+(.+?)(?:\s+que\s+|\s*:\s*|\s*$)/i,
    /message\s+(?:pour|à|a)\s+(.+)/i,
    /pr[ée]vien(?:s|dre)\s+(.+)/i,
  ];

  const detectFamilyMessageIntent = (text: string): { contactName: string } | null => {
    for (const pattern of FAMILY_MSG_PATTERNS) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const name = match[1].replace(/^(mon|ma|mes|le|la|les)\s+/i, '').trim();
        if (name.length > 1 && name.length < 40) return { contactName: name };
      }
    }
    return null;
  };

  const handleSend = async (content: string) => {
    setIsRecording(false);
    const userMessage: ChatMessageData = { id: Date.now().toString(), role: "user", content };
    setMessages(prev => [...prev, userMessage]);

    // Check if this message matches a démarche intent
    const isDemarche = demarcheChat.checkIntent(content);
    if (isDemarche) return;

    // Check if this is a family messaging intent — let Oscar draft the message,
    // then show a forward card after the response is done
    const familyIntent = detectFamilyMessageIntent(content);
    if (familyIntent) {
      // Override onDone for this request to add a forward card
      const origDoneRef = demarcheDoneRef.current;
      const forwardContactName = familyIntent.contactName;

      // We'll let Mistral generate the response normally, but after it's done
      // we'll add a forward card. We use a one-time effect via handleStreamDone override.
      const checkForForward = (fullText: string) => {
        // Add a family_message_forward card after the AI response
        if (fullText.trim()) {
          setTimeout(() => {
            const cardId = Date.now().toString();
            const forwardCard: RichCard = {
              type: "family_message_forward",
              data: { messageText: fullText.trim(), contactName: forwardContactName }
            };
            setMessages(prev => {
              const lastAssistant = [...prev].reverse().find(m => m.role === "assistant");
              if (lastAssistant) {
                return prev.map(m =>
                  m.id === lastAssistant.id
                    ? { ...m, richCards: [...(m.richCards || []), forwardCard] }
                    : m
                );
              }
              return [...prev, { id: cardId, role: "assistant" as const, content: "", richCards: [forwardCard] }];
            });
          }, 300);
        }
        // Restore original ref
        demarcheDoneRef.current = origDoneRef;
      };
      demarcheDoneRef.current = checkForForward;
    }

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
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header — frosted glass iOS style */}
      <header
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "16px 20px 14px",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: started ? "0.5px solid rgba(0,0,0,0.08)" : "none",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-2.5">
          <OscarAvatar size="sm" className="w-9 h-9 shadow-[0_2px_8px_rgba(45,212,191,0.3)]" />
          <div className="flex flex-col gap-px">
            <span style={{ fontSize: "15.5px", fontWeight: 500, color: "#1A1A2E", letterSpacing: "-0.2px", lineHeight: 1.2 }}>Oscar</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#2DD4BF" }}>En ligne</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory(true)}
            style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: "#F2F2F7", color: "#8E8E93", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", position: "relative" }}
            aria-label="Historique des conversations"
          >
            <Clock className="w-5 h-5" />
            {conversations.length > 0 && (
              <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#2DD4BF", border: "1.5px solid white" }} />
            )}
          </button>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: "rgba(45,212,191,0.08)", color: "#2DD4BF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            aria-label="Appeler Oscar"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: "#F2F2F7", color: "#8E8E93", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            aria-label="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Welcome Screen (no messages) */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 pb-10 animate-fade-in">
          <h1
            className="text-center text-slate-800 dark:text-foreground animate-fade-in"
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.3,
              letterSpacing: "-0.3px",
              marginBottom: 36,
              animationDelay: "0.15s",
              animationFillMode: "both",
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
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
        <div className="flex-1 overflow-y-auto px-4 py-5 thin-scrollbar oscar-page-bg" style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-live="polite" aria-atomic="false" aria-label="Conversation avec Oscar">
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

      {/* Input Bar — frosted glass */}
      <div
        className="flex-shrink-0"
        style={{
          padding: "10px 16px 24px",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* File preview */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 bg-slate-50 dark:bg-secondary rounded-2xl p-2 pr-3">
            {pendingFile.type === "image" && pendingFile.previewUrl ? (
              <img src={pendingFile.previewUrl} alt="Aperçu" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center flex-shrink-0">
                <FileTextIcon className="w-6 h-6 text-[#2DD4BF]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-foreground truncate">{pendingFile.file.name}</p>
              <p className="text-sm text-slate-400">Vous pouvez ajouter un message</p>
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
              fontSize: 16,
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
              marginBottom: 10,
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          />
          <div className="flex items-center justify-between gap-2">
            {/* Plus/attach button — uses <label> for iOS Safari compat (input.click() unreliable) */}
            <label className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-slate-400 hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/5 transition-all cursor-pointer active:scale-95">
              <Paperclip className="w-[18px] h-[18px]" />
              <input
                ref={fileInputRef}
                type="file"
                multiple={false}
                accept={ANALYSIS_ACCEPT}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <div className="flex items-center gap-2.5">
              {/* Mic button */}
              {webSpeechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/5"
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
                className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{
                  background: canSend
                    ? "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)"
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
          <p className="text-sm text-center text-slate-400 mt-2 animate-pulse">
            Parlez... Appuyez à nouveau pour envoyer
          </p>
        )}
      </div>

      {/* Call Screen */}
      <CallScreen
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
      />

      {/* History Panel — slides up from bottom */}
      {showHistory && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowHistory(false)}
        >
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              maxHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -4px 40px rgba(0,0,0,0.15)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E0E0E0" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E" }}>Mes conversations</span>
              <button
                onClick={handleNewConversation}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 99,
                  border: "none",
                  background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)",
                  color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus className="w-4 h-4" />
                Nouvelle
              </button>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1, padding: "4px 0 24px" }}>
              {conversations.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#8E8E93" }}>
                  <MessageSquare style={{ width: 36, height: 36, margin: "0 auto 10px", opacity: 0.4 }} />
                  <p style={{ fontSize: 15 }}>Aucune conversation enregistrée</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const isActive = conv.id === currentConversationId;
                  const date = new Date(conv.updated_at);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
                  const dateLabel = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Hier" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 20px",
                        border: "none",
                        background: isActive ? "rgba(45,212,191,0.08)" : "transparent",
                        borderLeft: isActive ? "3px solid #2DD4BF" : "3px solid transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? "rgba(45,212,191,0.15)" : "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MessageSquare style={{ width: 16, height: 16, color: isActive ? "#2DD4BF" : "#8E8E93" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: isActive ? 600 : 400, color: "#1A1A2E", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {conv.title || "Conversation"}
                        </p>
                        <p style={{ fontSize: 12, color: "#8E8E93", margin: "2px 0 0", fontWeight: 400 }}>{dateLabel}</p>
                      </div>
                      {isActive && (
                        <span style={{ fontSize: 11, color: "#2DD4BF", fontWeight: 600, flexShrink: 0 }}>En cours</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
