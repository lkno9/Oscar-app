import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { OscarAvatar } from "@/components/OscarAvatar";
import { useFamilyChat } from "@/hooks/useFamilyChat";
import { useFamilyLinks } from "@/hooks/useFamilyLinks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Pool de suggestions famille — 3 sont choisies aléatoirement à chaque visite
const ALL_SUGGESTIONS = [
  // Suivi bien-être
  "Comment va mon proche aujourd'hui ?",
  "Quelle est l'humeur de mon proche cette semaine ?",
  "Résume-moi la semaine de mon proche",
  "Mon proche a-t-il bien dormi ?",
  // Activités & médicaments
  "Quelles activités a fait mon proche récemment ?",
  "Mon proche a-t-il pris ses médicaments ?",
  "Y a-t-il des alertes pour mon proche ?",
  "Quels sont les prochains RDV de mon proche ?",
  // Conseils aidants
  "Comment encourager mon proche à rester actif ?",
  "Donne-moi des conseils pour communiquer avec un senior",
  "Comment détecter les signes de dépression chez un senior ?",
  "Quelles activités proposer à mon proche ?",
  "Comment aider mon proche à garder le moral ?",
  "Quels signes de fatigue surveiller chez mon proche ?",
  "Comment maintenir le lien à distance avec mon proche ?",
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

export default function FamilyChatPage() {
  const { linkedSeniors } = useFamilyLinks();
  const seniorIds = linkedSeniors.map((l) => l.senior_id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // 3 suggestions aléatoires choisies au montage
  const suggestions = useMemo(() => pickRandomSuggestions(3), []);
  const streamingIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const started = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const { sendMessage, clearHistory, cancelRequest } = useFamilyChat({
    seniorIds,
    onDelta: (token) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, content: m.content + token }
            : m
        )
      );
    },
    onDone: () => {
      setIsTyping(false);
      streamingIdRef.current = null;
    },
    onError: (error) => {
      setIsTyping(false);
      streamingIdRef.current = null;
      const errId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: errId, role: "assistant", content: error },
      ]);
    },
  });

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isTyping) return;

    setInput("");

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: messageText },
    ]);

    setIsTyping(true);
    streamingIdRef.current = assistantMsgId;

    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    await sendMessage(messageText);
  };

  const handleClearChat = () => {
    if (isTyping) return;
    setMessages([]);
    clearHistory();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !isTyping && input.trim().length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', 'Nunito', sans-serif" }}>
      {/* Header — identique au chat senior */}
      <header
        className={`flex items-center justify-between flex-shrink-0 bg-white dark:bg-card ${started ? "border-b border-border" : ""}`}
        style={{ padding: "16px 20px 14px" }}
      >
        <div className="flex items-center gap-2.5">
          <OscarAvatar size="sm" className="w-9 h-9 shadow-[0_2px_8px_rgba(72,162,158,0.3)]" />
          <div className="flex flex-col gap-px">
            <span className="font-bold text-slate-800 dark:text-foreground" style={{ fontSize: "15.5px", letterSpacing: "-0.2px", lineHeight: 1.2 }}>Oscar</span>
            <span className="text-xs font-medium text-[#48A29E]">En ligne</span>
          </div>
        </div>
        {started && (
          <button
            onClick={handleClearChat}
            disabled={isTyping}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30"
            aria-label="Nouvelle conversation"
          >
            <RotateCcw className="w-[18px] h-[18px]" />
          </button>
        )}
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
              marginBottom: 10,
              animationDelay: "0.15s",
              animationFillMode: "both",
            }}
          >
            Comment puis-je<br />vous aider {getGreeting()} ?
          </h1>
          <p
            className="text-sm text-muted-foreground mb-9 max-w-xs text-center leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.25s", animationFillMode: "both" }}
          >
            Je peux vous donner un résumé du bien-être de vos proches, leurs activités et vous conseiller.
          </p>
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
        <div className="flex-1 overflow-y-auto px-4 py-5 thin-scrollbar bg-background" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              content={m.content}
              messageId={m.id}
            />
          ))}
          {isTyping && streamingIdRef.current === null && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Bar — identique au style senior */}
      <div className="flex-shrink-0 bg-white dark:bg-card border-t border-transparent dark:border-border" style={{ padding: "10px 16px 24px" }}>
        <div className="glass-input">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Demandez à Oscar..."
            rows={1}
            disabled={isTyping}
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
            <div />
            <div className="flex items-center gap-2.5">
              {/* Cancel button when streaming */}
              {isTyping && (
                <button
                  type="button"
                  onClick={cancelRequest}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Annuler
                </button>
              )}
              {/* Send button */}
              <button
                type="button"
                onClick={() => handleSend()}
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
      </div>
    </div>
  );
}
