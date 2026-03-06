import { Volume2, VolumeX } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { RichCardRenderer } from "@/components/chat/RichCards";
import type { RichCard } from "@/types/chat";
import { extractUrlsFromText } from "@/lib/urlDetection";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  richCards?: RichCard[];
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  speakingMessageId?: string;
  messageId?: string;
}

// Regex for splitting text around URLs (capturing group keeps URLs in split result)
const URL_SPLIT_REGEX = /(https?:\/\/[^\s)<>,;"']+)/g;
// Regex for testing if a string is a URL (no /g flag to avoid lastIndex issues)
const URL_TEST_REGEX = /^https?:\/\/[^\s)<>,;"']+$/;

function TextWithLinks({ text, isUser }: { text: string; isUser: boolean }) {
  const parts = text.split(URL_SPLIT_REGEX);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (URL_TEST_REGEX.test(part)) {
          const cleanUrl = part.replace(/[.,;:!?)]+$/, "");
          const trailing = part.slice(cleanUrl.length);
          return (
            <span key={i}>
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "underline underline-offset-2 break-all",
                  isUser
                    ? "text-[#48A29E] hover:text-[#3a8a87]"
                    : "text-[#48A29E] hover:text-[#3a8a87]"
                )}
              >
                {cleanUrl}
              </a>
              {trailing}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function ChatMessage({
  role,
  content,
  imageUrl,
  richCards,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  speakingMessageId,
  messageId,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isThisMessageSpeaking = isSpeaking && speakingMessageId === messageId;

  const autoLinkCards = useMemo<RichCard[]>(() => {
    if (isUser || !content) return [];
    const existingUrls = new Set(
      (richCards || [])
        .filter((c) => c.type === "webview" || c.type === "link_preview")
        .map((c) => (c.data as { url: string }).url)
    );
    const detected = extractUrlsFromText(content);
    return detected
      .filter((link) => !existingUrls.has(link.url))
      .map((link) => ({ type: "link_preview" as const, data: link }));
  }, [content, richCards, isUser]);

  const allCards = useMemo(() => {
    return [...(richCards || []), ...autoLinkCards];
  }, [richCards, autoLinkCards]);

  const handleSpeakClick = () => {
    if (isThisMessageSpeaking && onStopSpeaking) {
      onStopSpeaking();
    } else if (onSpeak) {
      onSpeak(content);
    }
  };

  return (
    <div
      className={cn("flex msg-fade-up", isUser ? "justify-end" : "justify-start")}
      style={{ alignItems: "flex-end", gap: 8 }}
    >
      <div
        className="max-w-[75%]"
        style={{
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "rgba(72,162,158,0.1)" : "#f8fafc",
          border: isUser ? "1px solid rgba(72,162,158,0.2)" : "1px solid #f1f5f9",
          color: "#1e293b",
          fontSize: "14.5px",
          lineHeight: 1.65,
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Image envoyée"
            className="rounded-xl mb-2 max-w-full"
          />
        )}
        <div className="flex items-start gap-2">
          <TextWithLinks text={content} isUser={isUser} />
          {!isUser && onSpeak && content && (
            <button
              onClick={handleSpeakClick}
              className={cn(
                "flex-shrink-0 p-1 rounded-full transition-colors mt-0.5",
                isThisMessageSpeaking
                  ? "text-[#48A29E] bg-[#48A29E]/10"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
              aria-label={isThisMessageSpeaking ? "Arrêter la lecture" : "Écouter"}
            >
              {isThisMessageSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Rich Cards + Auto Link Previews */}
        {!isUser && allCards.length > 0 && (
          <div className="space-y-2 mt-2">
            {allCards.map((card, i) => (
              <RichCardRenderer key={i} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start msg-fade-up" style={{ alignItems: "flex-end" }}>
      <div
        style={{
          padding: "10px 16px",
          borderRadius: "18px 18px 18px 4px",
          background: "#f8fafc",
          border: "1px solid #f1f5f9",
        }}
      >
        <div className="flex gap-1.5 items-center py-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-[7px] h-[7px] rounded-full bg-[#48A29E]"
              style={{
                animation: "bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
