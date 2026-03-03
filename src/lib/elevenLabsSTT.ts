// Free browser-native STT using Web Speech API

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Fallback: try browser STT via a temporary recognition
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error("Reconnaissance vocale non supportée"));
      return;
    }
    // We can't feed a blob to SpeechRecognition, so resolve empty to signal fallback
    resolve("");
  });
}

export function startAudioRecording(): Promise<{ stop: () => Promise<Blob> }> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
              res(new Blob(chunks, { type: mimeType }));
            };
            mediaRecorder.stop();
          }),
      });
    } catch (e) {
      reject(e);
    }
  });
}
