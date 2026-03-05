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

/**
 * Render text with inline clickable links replacing raw URLs
 */
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
                    ? "text-primary-foreground/90 hover:text-primary-foreground"
                    : "text-primary hover:text-primary/80"
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

  // Auto-detect URLs in assistant messages and generate link preview cards
  const autoLinkCards = useMemo<RichCard[]>(() => {
    if (isUser || !content) return [];

    // Don't generate auto previews for URLs that are already covered by richCards
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
    const cards = [...(richCards || []), ...autoLinkCards];
    return cards;
  }, [richCards, autoLinkCards]);

  const handleSpeakClick = () => {
    if (isThisMessageSpeaking && onStopSpeaking) {
      onStopSpeaking();
    } else if (onSpeak) {
      onSpeak(content);
    }
  };

  return (
    <div className={cn("flex animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl text-base leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-md px-4 py-3"
          : "bg-secondary text-secondary-foreground rounded-bl-md px-4 py-3"
      )}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Image envoy\u00e9e"
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
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label={isThisMessageSpeaking ? "Arr\u00eater la lecture" : "\u00c9couter"}
            >
              {isThisMessageSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Rich Cards + Auto Link Previews */}
        {!isUser && allCards.length > 0 && (
          <div className="space-y-2">
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
    <div className="flex justify-start animate-fade-in">
      <div className="bg-secondary text-secondary-foreground px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: "200ms" }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}
