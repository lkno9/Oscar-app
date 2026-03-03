const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

let currentAudio: HTMLAudioElement | null = null;

export async function speakWithElevenLabs(text: string): Promise<void> {
  // Stop any current speech
  stopElevenLabsSpeech();

  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Erreur TTS");
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(audioUrl);
  await currentAudio.play();

  return new Promise((resolve) => {
    currentAudio!.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    };
    currentAudio!.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    };
  });
}

export function stopElevenLabsSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export function isElevenLabsSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}
