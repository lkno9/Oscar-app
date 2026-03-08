import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
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

const SUGGESTION_POOL = [
  "Comment va mon proche aujourd'hui ?",
  "Quelle est l'humeur de mon proche cette semaine ?",
  "Quelles activités a fait mon proche récemment ?",
  "Mon proche a-t-il bien dormi ?",
  "Résume-moi la semaine de mon proche",
  "Y a-t-il des alertes pour mon proche ?",
  "Quels sont les prochains RDV de mon proche ?",
  "Comment encourager mon proche à rester actif ?",
  "Donne-moi des conseils pour communiquer avec un senior",
  "Comment détecter les signes de dépression chez un senior ?",
  "Quelles activités proposer à mon proche ?",
  "Mon proche a-t-il pris ses médicaments ?",
];

function getRandomSuggestions(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function FamilyChatPage() {
  const { linkedSeniors } = useFamilyLinks();
  const seniorIds = linkedSeniors.map((l) => l.senior_id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions] = useState(() => getRandomSuggestions(SUGGESTION_POOL, 3));
  const streamingIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const { sendMessage, cancelRequest } = useFamilyChat({
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <OscarAvatar size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">Oscar Famille</h1>
          <p className="text-xs text-primary font-medium">En ligne</p>
        </div>
      </header>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3 pb-6">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
              <OscarAvatar size="lg" className="mb-5" />
              <h2
                className="text-2xl font-bold text-foreground mb-2 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Comment va votre proche aujourd'hui ?
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
                Je peux vous donner un résumé de son bien-être, ses activités et vous conseiller.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground hover:bg-secondary transition-colors text-left active:scale-[0.98]"
                  >
                    <span className="text-primary mr-2">
                      <Sparkles className="w-3.5 h-3.5 inline -mt-0.5" />
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  messageId={m.id}
                />
              ))}
              {isTyping && streamingIdRef.current === null && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="bg-card border-t border-border p-3 pb-safe">
        <div
          className="flex items-end gap-2"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(24px) saturate(180%)",
            border: "1.5px solid rgba(72,162,158,0.2)",
            borderRadius: "20px",
            padding: "8px 8px 8px 16px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Demandez à Oscar..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground leading-relaxed py-1 max-h-32"
            style={{ fontFamily: "'Inter', 'Nunito', sans-serif" }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="w-10 h-10 rounded-full shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isTyping && (
          <button
            onClick={cancelRequest}
            className="text-xs text-muted-foreground mt-2 mx-auto block hover:text-foreground transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
