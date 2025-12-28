import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: (files: FileList) => void;
  disabled?: boolean;
  isListening?: boolean;
  transcript?: string;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
}

export function ChatInput({ 
  onSend, 
  onAttach,
  disabled, 
  isListening = false,
  transcript = "",
  onVoiceToggle,
  voiceSupported = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAttach) {
      onAttach(e.target.files);
      // Reset input to allow selecting the same file again
      e.target.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border-t border-border">
      <div className="flex items-center gap-2 bg-secondary rounded-full p-1.5 pl-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={handleAttachClick}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
          aria-label="Joindre un fichier"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Demandez à Oscar..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
          disabled={disabled}
        />
        
        {/* Voice button */}
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceClick}
            className={cn(
              "p-2 rounded-full transition-all",
              isListening 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            aria-label={isListening ? "Arrêter l'écoute" : "Parler"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

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
