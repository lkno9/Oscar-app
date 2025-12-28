import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { OscarAvatar } from "./OscarAvatar";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { streamChat, Message } from "@/lib/oscarChat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

export function CallScreen({ isOpen, onClose, initialVideoEnabled = true }: CallScreenProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideoEnabled);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isOscarSpeaking, setIsOscarSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    transcript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech();

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Impossible d'accéder à la caméra");
      setIsVideoEnabled(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (isVideoEnabled) {
      stopCamera();
      setIsVideoEnabled(false);
    } else {
      await startCamera();
      setIsVideoEnabled(true);
    }
  }, [isVideoEnabled, startCamera, stopCamera]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (voiceSupported && !isListening) {
        startListening();
      }
    } else {
      setIsMuted(true);
      if (isListening) {
        stopListening();
      }
    }
  }, [isMuted, voiceSupported, isListening, startListening, stopListening]);

  // Process user speech and get Oscar's response
  const processUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);
    
    const newHistory: Message[] = [
      ...conversationHistory,
      { role: "user", content: userText },
    ];
    setConversationHistory(newHistory);

    let oscarResponse = "";
    
    await streamChat({
      messages: newHistory,
      onDelta: (chunk) => {
        oscarResponse += chunk;
      },
      onDone: () => {
        setConversationHistory(prev => [
          ...prev,
          { role: "assistant", content: oscarResponse },
        ]);
        setIsOscarSpeaking(true);
        speak(oscarResponse);
        setIsProcessing(false);
      },
      onError: (error) => {
        toast.error(error);
        setIsProcessing(false);
      },
    });
  }, [conversationHistory, isProcessing, speak]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && !isMuted && !isProcessing && !isSpeaking) {
      // Wait a bit to ensure the user has finished speaking
      const timeoutId = setTimeout(() => {
        if (transcript.trim()) {
          processUserSpeech(transcript);
          resetTranscript();
        }
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [transcript, isMuted, isProcessing, isSpeaking, processUserSpeech, resetTranscript]);

  // Update Oscar speaking state
  useEffect(() => {
    if (!isSpeaking) {
      setIsOscarSpeaking(false);
      // Resume listening after Oscar finishes speaking
      if (voiceSupported && !isMuted && isOpen) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    }
  }, [isSpeaking, voiceSupported, isMuted, isOpen, startListening]);

  // Initialize call
  useEffect(() => {
    if (isOpen) {
      // Reset video state based on initial prop
      setIsVideoEnabled(initialVideoEnabled);
      
      // Start call timer
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Start camera only if video is enabled
      if (initialVideoEnabled) {
        startCamera();
      }

      // Start listening
      if (voiceSupported && !isMuted) {
        setTimeout(() => startListening(), 1000);
      }

      // Oscar greeting
      setTimeout(() => {
        const greeting = "Bonjour ! Je suis Oscar. Comment puis-je vous aider ?";
        setConversationHistory([{ role: "assistant", content: greeting }]);
        setIsOscarSpeaking(true);
        speak(greeting);
      }, 1500);
    } else {
      // Cleanup
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      stopCamera();
      stopListening();
      stopSpeaking();
      setConversationHistory([]);
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isOpen, initialVideoEnabled, voiceSupported, isMuted, startCamera, stopCamera, startListening, stopListening, stopSpeaking, speak]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle end call
  const handleEndCall = () => {
    stopSpeaking();
    stopListening();
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Video/Avatar area */}
      <div className="flex-1 relative bg-oscar-navy overflow-hidden">
        {/* User video (small, corner) */}
        {isVideoEnabled && (
          <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden shadow-lg border-2 border-border z-10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}

        {/* Oscar avatar (center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className={cn(
              "transition-transform duration-300",
              isOscarSpeaking && "animate-pulse scale-110"
            )}>
              <OscarAvatar size="lg" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-foreground">Oscar</h2>
              <p className="text-primary-foreground/70">
                {isOscarSpeaking ? "Parle..." : isListening ? "Écoute..." : "En appel"}
              </p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Call duration */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/20 px-4 py-2 rounded-full">
          <span className="text-primary-foreground font-medium">
            {formatDuration(callDuration)}
          </span>
        </div>

        {/* Listening indicator */}
        {isListening && !isMuted && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-primary/90 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-4 bg-primary-foreground rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-3 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-primary-foreground text-sm font-medium">
              {transcript || "Parlez..."}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border p-6">
        <div className="flex items-center justify-center gap-6">
          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            className={cn(
              "p-4 rounded-full transition-all",
              isVideoEnabled
                ? "bg-secondary text-foreground"
                : "bg-destructive/20 text-destructive"
            )}
            aria-label={isVideoEnabled ? "Désactiver la vidéo" : "Activer la vidéo"}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={cn(
              "p-4 rounded-full transition-all",
              !isMuted
                ? "bg-secondary text-foreground"
                : "bg-destructive/20 text-destructive"
            )}
            aria-label={isMuted ? "Activer le micro" : "Désactiver le micro"}
          >
            {!isMuted ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
            aria-label="Terminer l'appel"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
