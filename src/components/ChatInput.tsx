import { useState, useEffect } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isListening?: boolean;
  transcript?: string;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
}

export function ChatInput({ 
  onSend, 
  disabled, 
  isListening = false,
  transcript = "",
  onVoiceToggle,
  voiceSupported = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleVoiceClick = () => {
    if (onVoiceToggle) {
      onVoiceToggle();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border-t border-border">
      <div className="flex items-center gap-2 bg-secondary rounded-full p-1.5 pl-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Demandez à Oscar..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
          disabled={disabled}
        />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          aria-label="Envoyer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
