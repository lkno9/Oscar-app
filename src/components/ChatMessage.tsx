import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  speakingMessageId?: string;
  messageId?: string;
}

export function ChatMessage({ 
  role, 
  content, 
  imageUrl,
  onSpeak, 
  onStopSpeaking,
  isSpeaking = false,
  speakingMessageId,
  messageId,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isThisMessageSpeaking = isSpeaking && speakingMessageId === messageId;

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
        "max-w-[85%] px-4 py-3 rounded-2xl text-base leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-secondary text-secondary-foreground rounded-bl-md"
      )}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Image générée"
            className="rounded-xl mb-2 max-w-full"
          />
        )}
        <div className="flex items-start gap-2">
          <span className="flex-1 whitespace-pre-wrap">{content}</span>
          {!isUser && onSpeak && content && (
            <button
              onClick={handleSpeakClick}
              className={cn(
                "flex-shrink-0 p-1 rounded-full transition-colors mt-0.5",
                isThisMessageSpeaking 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label={isThisMessageSpeaking ? "Arrêter la lecture" : "Écouter"}
            >
              {isThisMessageSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
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
