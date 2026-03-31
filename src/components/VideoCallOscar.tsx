/**
 * VideoCallOscar — Appel vidéo/audio avec Oscar via LiveKit Agents
 *
 * Architecture :
 * Frontend (React) ←WebRTC→ LiveKit Server ←→ Agent backend (Python)
 *                                                    ↓
 *                                              LLM + STT + TTS
 *
 * TODO (prod) : Proxifier le token server via Xano
 * TODO : Remplacement du LLM par Claude si besoin
 * TODO : Ajout Mistral Voxtral comme TTS pour la voix unifiée Oscar
 */

import { useState, useCallback, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useAgent,
  useConnectionState,
  useRoomContext,
  useTrackToggle,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";

// ─── Oscar couleurs ─────────────────────────────────────
const OSCAR_TEAL = "#1A9E7E";
const OSCAR_NAVY = "#1A1A2E";
const OSCAR_LIGHT = "#E8F5F0";

// ─── Types ──────────────────────────────────────────────
interface VideoCallOscarProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoEnabled?: boolean;
}

// ─── Token Server ────────────────────────────────────────
// TODO (prod) : Proxifier via Xano pour ne pas exposer l'URL du token server
const tokenServerUrl = import.meta.env.VITE_LIVEKIT_TOKEN_SERVER_URL || "";
const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || "";

// ─── Main Component ─────────────────────────────────────
export function VideoCallOscar({
  isOpen,
  onClose,
  initialVideoEnabled = false,
}: VideoCallOscarProps) {
  if (!isOpen) return null;

  if (!tokenServerUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-8">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-white text-xl font-semibold mb-2">
          Configuration manquante
        </p>
        <p className="text-white/50 text-base max-w-xs text-center leading-relaxed">
          Ajoutez VITE_LIVEKIT_TOKEN_SERVER_URL dans votre fichier .env
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 text-lg"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token=""
      serverUrl={livekitUrl}
      connect={true}
      video={initialVideoEnabled}
      audio={true}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: OSCAR_NAVY }}
      onDisconnected={onClose}
    >
      <RoomAudioRenderer />
      <CallContent onClose={onClose} initialVideoEnabled={initialVideoEnabled} />
    </LiveKitRoom>
  );
}

// ─── Call Content (inside LiveKitRoom context) ──────────
function CallContent({
  onClose,
  initialVideoEnabled,
}: {
  onClose: () => void;
  initialVideoEnabled: boolean;
}) {
  const connectionState = useConnectionState();
  const agent = useAgent();
  const room = useRoomContext();
  const [callDuration, setCallDuration] = useState(0);

  // Timer
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [connectionState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = useCallback(() => {
    room?.disconnect();
    onClose();
  }, [room, onClose]);

  // ── Connecting state ──
  if (
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <AgentAudioVisualizerAura
          size="lg"
          state="connecting"
          color={OSCAR_TEAL as `#${string}`}
          themeMode="dark"
        />
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">
            Oscar se prépare...
          </p>
          <p className="text-white/50 text-lg max-w-xs leading-relaxed">
            Préparation de l'appel. Cela peut prendre quelques secondes.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-8 py-4 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95 text-lg min-h-[56px]"
        >
          Annuler
        </button>
      </div>
    );
  }

  // ── Disconnected / Error state ──
  if (
    connectionState === ConnectionState.Disconnected
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center">
          <span className="text-3xl">👋</span>
        </div>
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">
            Appel terminé
          </p>
          {callDuration > 0 && (
            <p className="text-white/50 text-lg">
              Durée : {formatDuration(callDuration)}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-8 py-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 text-lg min-h-[56px]"
        >
          Fermer
        </button>
      </div>
    );
  }

  // ── Active call state ──
  return (
    <>
      {/* Top status bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white/80 text-lg font-medium">
            En appel avec Oscar
          </span>
        </div>
        <span className="text-white/50 text-base font-mono tabular-nums">
          {formatDuration(callDuration)}
        </span>
      </div>

      {/* Aura visualizer — centre de l'écran */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <AgentAudioVisualizerAura
          size="xl"
          state={agent.state ?? "connecting"}
          audioTrack={agent.microphoneTrack}
          color={OSCAR_TEAL as `#${string}`}
          themeMode="dark"
        />
        <p className="text-white/60 text-lg">
          {agent.state === "speaking"
            ? "Oscar parle..."
            : agent.state === "thinking"
            ? "Oscar réfléchit..."
            : agent.state === "listening"
            ? "Oscar vous écoute..."
            : "Oscar se prépare..."}
        </p>

        {/* TODO: Ajouter transcription en temps réel (useSessionMessages) */}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 px-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Toggle Micro */}
          <MicToggleButton />

          {/* Raccrocher */}
          <button
            onClick={handleEndCall}
            className="w-[72px] h-[72px] rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
            aria-label="Terminer l'appel"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          {/* Toggle Caméra */}
          <CameraToggleButton initialEnabled={initialVideoEnabled} />
        </div>
      </div>
    </>
  );
}

// ─── Mic Toggle ─────────────────────────────────────────
function MicToggleButton() {
  const { enabled, toggle } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  return (
    <button
      onClick={() => toggle()}
      className={cn(
        "w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all active:scale-95",
        enabled
          ? "bg-white/20 text-white hover:bg-white/30"
          : "bg-white/10 text-red-400 hover:bg-white/20"
      )}
      aria-label={enabled ? "Couper le micro" : "Activer le micro"}
    >
      {enabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
    </button>
  );
}

// ─── Camera Toggle ──────────────────────────────────────
function CameraToggleButton({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const { enabled, toggle } = useTrackToggle({
    source: Track.Source.Camera,
    initialState: initialEnabled,
  });

  return (
    <button
      onClick={() => toggle()}
      className={cn(
        "w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all active:scale-95",
        enabled
          ? "bg-white/20 text-white hover:bg-white/30"
          : "bg-white/10 text-white/50 hover:bg-white/20"
      )}
      aria-label={enabled ? "Couper la caméra" : "Activer la caméra"}
    >
      {enabled ? (
        <Video className="w-6 h-6" />
      ) : (
        <VideoOff className="w-6 h-6" />
      )}
    </button>
  );
}

// TODO: Ajouter TranscriptPanel avec useSessionMessages quand le flow session sera confirmé
