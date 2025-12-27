import { useState, useEffect, useCallback, useRef } from "react";

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      
      switch (event.error) {
        case "not-allowed":
          setError("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.");
          break;
        case "no-speech":
          setError("Aucune parole détectée. Veuillez réessayer.");
          break;
        case "network":
          setError("Erreur réseau. La reconnaissance vocale nécessite une connexion internet.");
          break;
        case "aborted":
          // User cancelled, no need to show error
          setError(null);
          break;
        case "audio-capture":
          setError("Aucun microphone détecté. Veuillez vérifier votre appareil.");
          break;
        default:
          setError(`Erreur de reconnaissance vocale: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    setTranscript("");
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Recognition might already be running
      console.error("Error starting recognition:", e);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
