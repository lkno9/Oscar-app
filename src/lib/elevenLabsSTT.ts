const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`;

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  // ElevenLabs Scribe expects a file with a name
  const audioFile = new File([audioBlob], "recording.webm", { type: audioBlob.type });
  formData.append("audio", audioFile);

  const response = await fetch(STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Erreur de transcription");
  }

  const data = await response.json();
  return data.text || "";
}

export function startAudioRecording(): Promise<{ stop: () => Promise<Blob> }> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start();

      resolve({
        stop: () =>
          new Promise((res) => {
            mediaRecorder.onstop = () => {
              stream.getTracks().forEach((t) => t.stop());
              res(new Blob(chunks, { type: "audio/webm" }));
            };
            mediaRecorder.stop();
          }),
      });
    } catch (e) {
      reject(e);
    }
  });
}
