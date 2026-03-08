/**
 * Gemini Live API — Real-time voice & video conversation
 *
 * Architecture:
 *   Mic (16kHz PCM) ──→ WebSocket ──→ Gemini Live API
 *   Camera (JPEG 1fps) ──→ WebSocket ──→ Gemini Live API
 *   Speaker ←── WebSocket (24kHz PCM) ←── Gemini Live API
 */

// ─── Constants ────────────────────────────────────────────
const WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const MODEL = "gemini-2.5-flash-preview-native-audio-dialog";
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_BUFFER_SIZE = 4096;

// ─── Base64 Helpers ───────────────────────────────────────
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── PCM Conversion ──────────────────────────────────────
function float32ToPcm16Buffer(float32: Float32Array): ArrayBuffer {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16.buffer;
}

function pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
  const int16 = new Int16Array(buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

// ─── AudioWorklet code (inlined as string → Blob URL) ────
const RECORDER_WORKLET_CODE = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;

    const ratio = sampleRate / 16000;
    let pcm16;

    if (ratio > 1.01) {
      // Downsample to 16kHz
      const len = Math.floor(input.length / ratio);
      pcm16 = new Int16Array(len);
      for (let i = 0; i < len; i++) {
        const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
    } else {
      pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
    }

    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

// ─── AudioRecorder ────────────────────────────────────────
// Captures mic audio → 16kHz mono PCM base64 chunks
export class AudioRecorder {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processorNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private onData: ((base64: string) => void) | null = null;

  async start(onData: (base64Pcm: string) => void): Promise<void> {
    this.onData = onData;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: { ideal: INPUT_SAMPLE_RATE },
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Try to create context at 16kHz, fall back to default
    try {
      this.context = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    } catch {
      this.context = new AudioContext();
    }

    // Resume context (needed for iOS Safari user gesture requirement)
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.source = this.context.createMediaStreamSource(this.stream);

    // Try AudioWorklet first, fall back to ScriptProcessorNode
    try {
      await this.initAudioWorklet();
    } catch (e) {
      console.warn("[AudioRecorder] AudioWorklet failed, falling back to ScriptProcessor:", e);
      this.initScriptProcessor();
    }
  }

  private async initAudioWorklet(): Promise<void> {
    if (!this.context || !this.source) throw new Error("No context");

    const blob = new Blob([RECORDER_WORKLET_CODE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    try {
      await this.context.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    const workletNode = new AudioWorkletNode(this.context, "recorder-processor");
    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (this.onData && event.data.byteLength > 0) {
        this.onData(arrayBufferToBase64(event.data));
      }
    };

    this.source.connect(workletNode);
    // Connect to destination via silent gain (keeps processing active, no feedback)
    this.silentGain = this.context.createGain();
    this.silentGain.gain.value = 0;
    workletNode.connect(this.silentGain);
    this.silentGain.connect(this.context.destination);

    this.processorNode = workletNode;
  }

  private initScriptProcessor(): void {
    if (!this.context || !this.source) return;

    const actualRate = this.context.sampleRate;
    const processor = this.context.createScriptProcessor(SCRIPT_BUFFER_SIZE, 1, 1);

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.onData) return;
      const input = e.inputBuffer.getChannelData(0);

      // Zero the output to prevent feedback
      const output = e.outputBuffer.getChannelData(0);
      output.fill(0);

      let pcmData: ArrayBuffer;
      if (Math.abs(actualRate - INPUT_SAMPLE_RATE) > 100) {
        // Downsample to 16kHz
        const ratio = actualRate / INPUT_SAMPLE_RATE;
        const len = Math.floor(input.length / ratio);
        const downsampled = new Float32Array(len);
        for (let i = 0; i < len; i++) {
          downsampled[i] = input[Math.floor(i * ratio)];
        }
        pcmData = float32ToPcm16Buffer(downsampled);
      } else {
        pcmData = float32ToPcm16Buffer(input);
      }

      this.onData(arrayBufferToBase64(pcmData));
    };

    this.source.connect(processor);
    processor.connect(this.context.destination);
    this.processorNode = processor;
  }

  stop(): void {
    this.onData = null;
    this.processorNode?.disconnect();
    this.silentGain?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close().catch(() => {});
    this.processorNode = null;
    this.silentGain = null;
    this.source = null;
    this.stream = null;
    this.context = null;
  }

  mute(): void {
    this.stream?.getAudioTracks().forEach((t) => { t.enabled = false; });
  }

  unmute(): void {
    this.stream?.getAudioTracks().forEach((t) => { t.enabled = true; });
  }
}

// ─── AudioPlayer ──────────────────────────────────────────
// Plays 24kHz PCM base64 audio using scheduled AudioBufferSourceNodes
export class AudioPlayer {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private _isPlaying = false;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async init(): Promise<void> {
    try {
      this.context = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    } catch {
      this.context = new AudioContext();
    }
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.nextPlayTime = 0;
  }

  async resume(): Promise<void> {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  play(base64Pcm: string): void {
    if (!this.context || !this.gainNode) return;

    const pcmBuffer = base64ToArrayBuffer(base64Pcm);
    const float32 = pcm16ToFloat32(pcmBuffer);
    if (float32.length === 0) return;

    const audioBuffer = this.context.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const currentTime = this.context.currentTime;
    const playTime = Math.max(currentTime + 0.005, this.nextPlayTime);
    source.start(playTime);
    this.nextPlayTime = playTime + audioBuffer.duration;

    this._isPlaying = true;
    this.activeSources.push(source);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) this.activeSources.splice(idx, 1);
      if (this.activeSources.length === 0) {
        this._isPlaying = false;
      }
    };
  }

  stop(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.activeSources = [];
    this.nextPlayTime = 0;
    this._isPlaying = false;
  }

  destroy(): void {
    this.stop();
    this.gainNode?.disconnect();
    this.context?.close().catch(() => {});
    this.gainNode = null;
    this.context = null;
  }
}

// ─── GeminiLiveSession ────────────────────────────────────
// Manages the WebSocket connection to Gemini Live API

export type GeminiEvent =
  | { type: "connected" }
  | { type: "audio"; data: string }
  | { type: "text"; text: string }
  | { type: "inputTranscript"; text: string }
  | { type: "outputTranscript"; text: string }
  | { type: "interrupted" }
  | { type: "turnComplete" }
  | { type: "error"; message: string }
  | { type: "closed" };

interface GeminiConfig {
  apiKey: string;
  systemPrompt: string;
  voiceName?: string;
  onEvent: (event: GeminiEvent) => void;
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private config: GeminiConfig;
  private setupDone = false;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  connect(): void {
    const url = `${WS_URL}?key=${this.config.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.sendSetup();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        this.handleMessage(msg);
      } catch (err) {
        console.error("[GeminiLive] Parse error:", err);
      }
    };

    this.ws.onerror = () => {
      this.config.onEvent({ type: "error", message: "Erreur de connexion au serveur vocal" });
    };

    this.ws.onclose = (e) => {
      this.setupDone = false;
      // Don't emit closed if it was a normal close (code 1000)
      if (e.code !== 1000) {
        this.config.onEvent({ type: "error", message: `Connexion perdue (code ${e.code})` });
      }
      this.config.onEvent({ type: "closed" });
    };
  }

  private sendSetup(): void {
    const setupMsg = {
      setup: {
        model: `models/${MODEL}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || "Kore",
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: this.config.systemPrompt }],
        },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
            endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
            silenceDurationMs: 500,
          },
          activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        contextWindowCompression: {
          slidingWindow: {},
        },
      },
    };

    this.send(setupMsg);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(msg: any): void {
    // Setup complete
    if (msg.setupComplete !== undefined) {
      this.setupDone = true;
      this.config.onEvent({ type: "connected" });
      return;
    }

    // Server content
    if (msg.serverContent) {
      const sc = msg.serverContent;

      if (sc.interrupted) {
        this.config.onEvent({ type: "interrupted" });
        return;
      }

      if (sc.turnComplete) {
        this.config.onEvent({ type: "turnComplete" });
        return;
      }

      if (sc.inputTranscription?.text) {
        this.config.onEvent({ type: "inputTranscript", text: sc.inputTranscription.text });
        return;
      }

      if (sc.outputTranscription?.text) {
        this.config.onEvent({ type: "outputTranscript", text: sc.outputTranscription.text });
        return;
      }

      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.config.onEvent({ type: "audio", data: part.inlineData.data });
          }
          if (part.text) {
            this.config.onEvent({ type: "text", text: part.text });
          }
        }
      }
    }

    // Go-away (session termination warning)
    if (msg.goAway) {
      console.warn("[GeminiLive] GoAway received, time left:", msg.goAway.timeLeft);
    }
  }

  sendAudio(base64Pcm: string): void {
    if (!this.setupDone) return;
    this.send({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
            data: base64Pcm,
          },
        ],
      },
    });
  }

  sendImage(base64Jpeg: string): void {
    if (!this.setupDone) return;
    this.send({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: "image/jpeg",
            data: base64Jpeg,
          },
        ],
      },
    });
  }

  sendText(text: string): void {
    if (!this.setupDone) return;
    this.send({
      clientContent: {
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null; // Prevent close event during intentional disconnect
      this.ws.close(1000);
      this.ws = null;
    }
    this.setupDone = false;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.setupDone;
  }
}
