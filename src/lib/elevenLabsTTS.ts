// Free browser-native TTS using Web Speech API (fallback)

let currentUtterance: SpeechSynthesisUtterance | null = null;

function getFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const fr = voices.filter(v => v.lang.startsWith("fr"));
  return fr.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("enhanced"))
    || fr[0]
    || voices[0]
    || null;
}

export async function speakWithBrowserTTS(text: string): Promise<void> {
  stopBrowserSpeech();
  if (!("speechSynthesis" in window)) throw new Error("TTS non supporté");

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Wait for voices to load if needed
    const trySpeak = () => {
      const voice = getFrenchVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => { currentUtterance = null; resolve(); };
      utterance.onerror = () => { currentUtterance = null; resolve(); };
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); };
    }
  });
}

// Keep old exports for backward compatibility
export const speakWithElevenLabs = speakWithBrowserTTS;

export function stopBrowserSpeech(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export const stopElevenLabsSpeech = stopBrowserSpeech;

export function isBrowserSpeaking(): boolean {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
}

export const isElevenLabsSpeaking = isBrowserSpeaking;
