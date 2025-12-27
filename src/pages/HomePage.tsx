import { useState, useRef, useEffect } from "react";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OscarAvatar } from "@/components/OscarAvatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me poser vos questions, nous ferons cela ensemble. 😊",
};

export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate Oscar's response (will be replaced with actual AI integration)
    setTimeout(() => {
      const responses = [
        "Je comprends votre demande. Laissez-moi vous aider étape par étape. Que souhaitez-vous faire exactement ?",
        "Bien sûr, je suis là pour vous accompagner. Pouvez-vous me donner plus de détails ?",
        "Pas de souci, nous allons faire cela ensemble. Êtes-vous prêt à commencer ?",
        "Je vais vous guider. D'abord, assurons-nous de bien comprendre ce que vous voulez faire.",
      ];
      
      const oscarResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, oscarResponse]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <OscarAvatar size="md" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Oscar</h1>
            <p className="text-sm text-muted-foreground">Votre compagnon numérique</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} content={message.content} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
