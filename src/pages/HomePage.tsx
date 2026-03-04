import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, Settings } from "lucide-react";
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

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const INITIAL_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me poser vos questions, nous ferons cela ensemble. 😊",
};

// ElevenLabs TTS
let currentAudio: HTMLAudioElement | null = null;

async function speakWithElevenLabs(text: string): Promise<void> {
  stopSpeech();
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("TTS échoué");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { currentAudio = null; URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { currentAudio = null; URL.revokeObjectURL(url); resolve(); };
    audio.play();
  });
}

function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
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
      // First token: create a new assistant message
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

  const { sendMessage: sendToMistral } = useMistralChat({
    onDelta: handleStreamDelta,
    onDone: handleStreamDone,
    onError: handleStreamError,
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

  const handleSpeak = async (text: string, messageId?: string) => {
    stopSpeech();
    if (messageId) setSpeakingMessageId(messageId);
    setIsSpeakingState(true);
    try {
      await speakWithElevenLabs(text);
    } catch {
      // Fallback to Web Speech API
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording → will trigger onstop → transcription
      mediaRecorderRef.current?.stop();
      return;
    }

    // Stop any ongoing TTS before recording
    stopSpeech();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeakingState(false);
    setSpeakingMessageId(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) return; // too short, ignore

        setIsTyping(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, `voice.${mimeType.includes("webm") ? "webm" : "mp4"}`);

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
            {
              method: "POST",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: fd,
            }
          );
          const data = await res.json();
          setIsTyping(false);
          if (data.text?.trim()) {
            handleSend(data.text.trim());
          } else {
            toast.info("Aucune parole détectée, réessayez.");
          }
        } catch {
          setIsTyping(false);
          toast.error("Impossible de transcrire l'audio. Réessayez.");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      setIsRecording(false);
      if (err?.name === "NotAllowedError") {
        toast.error("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
      } else {
        toast.error("Impossible d'accéder au microphone.");
      }
    }
  };

  const handleAttach = async (files: FileList, extraMessage?: string) => {
    const file = files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) { toast.info(`Fichier sélectionné : ${file.name}`); return; }
    setIsTyping(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAttach={handleAttach}
        onAudioRecorded={undefined}
        disabled={isTyping}
        isListening={false}
        isRecording={isRecording}
        transcript=""
        onVoiceToggle={handleVoiceToggle}
        voiceSupported={true}
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
