import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Paperclip, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: (files: FileList) => void;
  onAudioRecorded?: (blob: Blob) => void;
  disabled?: boolean;
  isListening?: boolean;
  isRecording?: boolean;
  transcript?: string;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
}

export function ChatInput({ 
  onSend, 
  onAttach,
  onAudioRecorded,
  disabled, 
  isListening = false,
  isRecording = false,
  transcript = "",
  onVoiceToggle,
  voiceSupported = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAttach) {
      onAttach(e.target.files);
      e.target.value = "";
    }
  };

  const handleMicClick = () => {
    if (onAudioRecorded) {
      // ElevenLabs STT mode
      onVoiceToggle?.();
    } else {
      onVoiceToggle?.();
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
          accept="image/*,application/pdf,.doc,.docx,.txt,audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isRecording ? "Enregistrement en cours..." : "Demandez à Oscar..."}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
          disabled={disabled || isRecording}
        />
        
        {/* Mic button */}
        {voiceSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            className={cn(
              "p-2 rounded-full transition-all",
              isListening || isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            aria-label={isListening || isRecording ? "Arrêter l'enregistrement" : "Parler"}
          >
            {isListening || isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        <button
          type="submit"
          disabled={!message.trim() || disabled || isRecording}
          className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          aria-label="Envoyer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {isRecording && (
        <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
          🔴 Parlez... Appuyez à nouveau pour envoyer
        </p>
      )}
    </form>
  );
}
