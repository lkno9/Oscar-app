import { useState, useRef, useEffect } from "react";
import { Phone, Settings, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { streamChat, Message } from "@/lib/oscarChat";
import { speakWithElevenLabs, stopElevenLabsSpeech } from "@/lib/elevenLabsTTS";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

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

export function HomePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageData[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeakingEL, setIsSpeakingEL] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  // ElevenLabs STT recording
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantIdRef = useRef<string | null>(null);

  const { user } = useAuth();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- ElevenLabs TTS ---
  const handleSpeak = async (text: string, messageId?: string) => {
    stopElevenLabsSpeech();
    if (messageId) setSpeakingMessageId(messageId);
    setIsSpeakingEL(true);
    try {
      await speakWithElevenLabs(text);
    } catch {
      toast.error("Impossible de lire le message");
    } finally {
      setIsSpeakingEL(false);
      setSpeakingMessageId(null);
    }
  };

  const handleStopSpeaking = () => {
    stopElevenLabsSpeech();
    setIsSpeakingEL(false);
    setSpeakingMessageId(null);
  };

  // --- Browser Web Speech API STT ---
  const speechRecognitionRef = useRef<any>(null);

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
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error === "not-allowed") toast.error("Accès au microphone refusé");
      else if (e.error !== "aborted") toast.error("Erreur de reconnaissance vocale");
    };
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      if (text.trim()) handleSend(text.trim());
    };

    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      toast.error("Impossible de démarrer la reconnaissance vocale");
    }
  };

  // --- Image generation detection ---
  const detectImageRequest = (content: string): string | null => {
    const lower = content.toLowerCase();
    const imageKeywords = ["génère une image", "génère moi une image", "crée une image", "dessine", "montre-moi une image", "illustre", "generate image", "fais une image"];
    for (const kw of imageKeywords) {
      if (lower.includes(kw)) {
        return content;
      }
    }
    return null;
  };

  const handleAttach = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    toast.info(`Fichier sélectionné : ${file.name}`);
  };

  const handleSend = async (content: string) => {
    setIsRecording(false);

    // Check for image generation request
    const imagePrompt = detectImageRequest(content);
    if (imagePrompt) {
      const userMsg: ChatMessageData = { id: Date.now().toString(), role: "user", content };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      try {
        const resp = await fetch(IMAGE_GEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: imagePrompt }),
        });
        const data = await resp.json();
        if (data.imageUrl) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Voici l'image que j'ai créée pour vous ! 🎨",
            imageUrl: data.imageUrl,
          }]);
        } else {
          throw new Error(data.error || "Erreur");
        }
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

    const apiMessages: Message[] = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content });

    let assistantSoFar = "";
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id !== "welcome") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: assistantId, role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: apiMessages,
      onDelta: (chunk) => { setIsTyping(false); upsertAssistant(chunk); },
      onDone: () => setIsTyping(false),
      onError: (error) => { setIsTyping(false); toast.error(error); },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OscarAvatar size="md" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Oscar</h1>
              <p className="text-sm text-primary font-medium">En ligne</p>
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
            isSpeaking={isSpeakingEL}
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
