import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Paperclip, Square, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYSIS_ACCEPT, isImageFile, isPdfFile } from "@/lib/fileUtils";

interface PendingFile {
  file: File;
  previewUrl?: string;
  type: "image" | "pdf" | "other";
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: (files: FileList, message?: string) => void;
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
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (pendingFile) {
      // Send file (with optional text)
      const dt = new DataTransfer();
      dt.items.add(pendingFile.file);
      onAttach?.(dt.files, message.trim() || undefined);
      setPendingFile(null);
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      setMessage("");
    } else if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = isImageFile(file);
    const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

    setPendingFile({
      file,
      previewUrl,
      type: isImg ? "image" : isPdfFile(file) ? "pdf" : "other",
    });
    e.target.value = "";
  };

  const removePendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const canSend = !disabled && !isRecording && (pendingFile !== null || message.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border-t border-border">
      {/* File preview */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 bg-secondary rounded-2xl p-2 pr-3">
          {pendingFile.type === "image" && pendingFile.previewUrl ? (
            <img
              src={pendingFile.previewUrl}
              alt="Aperçu"
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{pendingFile.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {pendingFile.type === "image" ? "Image" : "Document"} · Vous pouvez ajouter un message
            </p>
          </div>
          <button
            type="button"
            onClick={removePendingFile}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all flex-shrink-0"
            aria-label="Supprimer le fichier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-secondary rounded-full p-1.5 pl-2">
        {/* Attach button — label for iOS Safari compat */}
        {!pendingFile && (
          <label
            className="p-2 min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              accept={ANALYSIS_ACCEPT}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isRecording
              ? "Enregistrement en cours..."
              : pendingFile
              ? "Ajouter un message (optionnel)..."
              : "Demandez à Oscar..."
          }
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
          disabled={disabled || isRecording}
        />
        
        {/* Mic button */}
        {voiceSupported && !pendingFile && (
          <button
            type="button"
            onClick={() => onVoiceToggle?.()}
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
          disabled={!canSend}
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
