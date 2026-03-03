import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, Settings, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { useBotpressChat } from "@/hooks/useBotpressChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
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

function isSpeaking() {
  return currentAudio !== null && !currentAudio.paused;
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
  const speechRecognitionRef = useRef<any>(null);

  const { user } = useAuth();

  const handleBotMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    setIsTyping(false);
    const id = Date.now().toString();
    const words = text.split(" ");
    let accumulated = "";
    words.forEach((word, i) => {
      setTimeout(() => {
        accumulated += (i === 0 ? "" : " ") + word;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === id) {
            return prev.map(m => m.id === id ? { ...m, content: accumulated } : m);
          }
          return [...prev, { id, role: "assistant", content: accumulated }];
        });
        // Auto-speak when streaming is complete
        if (i === words.length - 1) {
          handleSpeak(text, id);
        }
      }, i * 25);
    });
  }, []);

  const { sendMessage: sendToBotpress } = useBotpressChat(handleBotMessage);

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

  const handleVoiceToggle = () => {
    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Reconnaissance vocale non supportée par ce navigateur");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalText = "";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => {
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (finalText.trim()) { handleSend(finalText.trim()); finalText = ""; }
    };
    recognition.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error === "not-allowed") toast.error("Accès au microphone refusé.");
      else if (e.error !== "aborted") toast.error(`Erreur vocale : ${e.error}`);
    };
    speechRecognitionRef.current = recognition;
    try { recognition.start(); } catch { toast.error("Impossible de démarrer la reconnaissance vocale"); }
  };

  const detectImageRequest = (content: string): string | null => {
    const lower = content.toLowerCase();
    const imageKeywords = ["génère une image", "génère moi une image", "crée une image", "dessine", "montre-moi une image", "illustre", "generate image", "fais une image"];
    for (const kw of imageKeywords) {
      if (lower.includes(kw)) return content;
    }
    return null;
  };

  const handleAttach = async (files: FileList) => {
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
      const userMsg: ChatMessageData = {
        id: Date.now().toString(),
        role: "user",
        content: isImage ? `[Image envoyée : ${file.name}]` : `[Document envoyé : ${file.name}]`,
        imageUrl: isImage ? base64 : undefined,
      };
      setMessages(prev => [...prev, userMsg]);
      sendToBotpress(isImage ? `Peux-tu analyser cette image ? (${file.name})` : `Peux-tu analyser ce document ? (${file.name})`);
    } catch {
      setIsTyping(false);
      toast.error("Impossible de lire le fichier");
    }
  };

  const handleSend = async (content: string) => {
    setIsRecording(false);
    const imagePrompt = detectImageRequest(content);
    if (imagePrompt) {
      const userMsg: ChatMessageData = { id: Date.now().toString(), role: "user", content };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      try {
        const resp = await fetch(IMAGE_GEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ prompt: imagePrompt }),
        });
        const data = await resp.json();
        if (data.imageUrl) {
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Voici l'image que j'ai créée pour vous ! 🎨", imageUrl: data.imageUrl }]);
        } else throw new Error(data.error || "Erreur");
      } catch {
        toast.error("Impossible de générer l'image");
      } finally {
        setIsTyping(false);
      }
      return;
    }
    const userMessage: ChatMessageData = { id: Date.now().toString(), role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    sendToBotpress(content);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header amélioré */}
      <header className="relative px-5 py-4 bg-card border-b border-border overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <OscarAvatar size="md" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-foreground">Oscar</h1>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-primary font-semibold tracking-wide uppercase">Votre assistant IA</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCallType("audio"); setIsCallOpen(true); }}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-all"
              aria-label="Appel audio"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 scrollbar-hide">
        {/* Date separator */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium px-2">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

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
