import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Phone, MoreVertical } from "lucide-react";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OscarAvatar } from "@/components/OscarAvatar";
import { CallScreen } from "@/components/CallScreen";
import { streamChat, Message } from "@/lib/oscarChat";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me poser vos questions, nous ferons cela ensemble. 😊",
};

export function HomePage() {
  const [messages, setMessages] = useState<ChatMessageData[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantIdRef = useRef<string | null>(null);

  const { 
    isListening, 
    transcript, 
    isSupported: voiceSupported, 
    error: voiceError,
    startListening, 
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  const { 
    isSpeaking, 
    isSupported: ttsSupported, 
    speak, 
    stop: stopSpeaking,
  } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Show voice errors
  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  // Handle speaking state
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  // Auto-speak new assistant messages when voiceMode is on
  useEffect(() => {
    if (!voiceMode || !ttsSupported) return;
    
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage && 
      lastMessage.role === "assistant" && 
      lastMessage.id !== "welcome" &&
      lastMessage.id !== lastAssistantIdRef.current &&
      !isTyping
    ) {
      lastAssistantIdRef.current = lastMessage.id;
      setSpeakingMessageId(lastMessage.id);
      speak(lastMessage.content);
    }
  }, [messages, voiceMode, ttsSupported, speak, isTyping]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSpeak = (text: string, messageId?: string) => {
    if (messageId) {
      setSpeakingMessageId(messageId);
    }
    speak(text);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  const handleSend = async (content: string) => {
    // Stop listening if active
    if (isListening) {
      stopListening();
    }
    resetTranscript();

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Build the conversation history for the API (excluding welcome message for cleaner context)
    const apiMessages: Message[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content });

    let assistantSoFar = "";
    let assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id !== "welcome") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { id: assistantId, role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: apiMessages,
      onDelta: (chunk) => {
        setIsTyping(false);
        upsertAssistant(chunk);
      },
      onDone: () => {
        setIsTyping(false);
      },
      onError: (error) => {
        setIsTyping(false);
        toast.error(error);
      },
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
          
          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Voice mode toggle */}
            {ttsSupported && (
              <button
                onClick={() => setVoiceMode(!voiceMode)}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  voiceMode 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                aria-label={voiceMode ? "Désactiver le mode vocal" : "Activer le mode vocal"}
              >
                {voiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            
            {/* Phone button */}
            <button
              onClick={() => setIsCallOpen(true)}
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Appeler"
            >
              <Phone className="w-5 h-5" />
            </button>
            
            {/* Menu button */}
            <button
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
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
            messageId={message.id}
            onSpeak={(text) => handleSpeak(text, message.id)}
            onStopSpeaking={handleStopSpeaking}
            isSpeaking={isSpeaking}
            speakingMessageId={speakingMessageId || undefined}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput 
        onSend={handleSend} 
        disabled={isTyping}
        isListening={isListening}
        transcript={transcript}
        onVoiceToggle={handleVoiceToggle}
        voiceSupported={voiceSupported}
      />

      {/* Call Screen */}
      <CallScreen isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} />
    </div>
  );
}
