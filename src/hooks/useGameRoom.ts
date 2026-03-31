import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type RoomStatus = "idle" | "waiting" | "connected" | "playing" | "finished" | "disconnected";

export function useGameRoom() {
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [isHost, setIsHost] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const [myName, setMyName] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setupChannel = useCallback((channel: RealtimeChannel) => {
    channel.on("broadcast", { event: "game_event" }, ({ payload }) => {
      const handler = handlersRef.current.get(payload.type);
      if (handler) handler(payload.data);
    });

    channel.on("broadcast", { event: "player_leave" }, () => {
      setStatus("disconnected");
    });
  }, []);

  const createRoom = useCallback((playerName: string): string => {
    cleanup();
    const id = generateRoomId();
    setRoomId(id);
    setIsHost(true);
    setMyName(playerName);
    setStatus("waiting");

    const channel = supabase.channel(`game-${id}`, {
      config: { broadcast: { self: false } },
    });

    setupChannel(channel);

    channel.on("broadcast", { event: "player_join" }, ({ payload }) => {
      setOpponentName(payload.name);
      setStatus("connected");
      channel.send({
        type: "broadcast",
        event: "host_info",
        payload: { name: playerName },
      });
    });

    channel.subscribe();
    channelRef.current = channel;
    return id;
  }, [cleanup, setupChannel]);

  const joinRoom = useCallback((id: string, playerName: string) => {
    cleanup();
    const cleanId = id.toUpperCase().trim();
    setRoomId(cleanId);
    setIsHost(false);
    setMyName(playerName);

    const channel = supabase.channel(`game-${cleanId}`, {
      config: { broadcast: { self: false } },
    });

    setupChannel(channel);

    channel.on("broadcast", { event: "host_info" }, ({ payload }) => {
      setOpponentName(payload.name);
      setStatus("connected");
    });

    channel.subscribe(async (st) => {
      if (st === "SUBSCRIBED") {
        await channel.send({
          type: "broadcast",
          event: "player_join",
          payload: { name: playerName },
        });
      }
    });

    channelRef.current = channel;
  }, [cleanup, setupChannel]);

  const sendEvent = useCallback((type: string, data?: any) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game_event",
      payload: { type, data },
    });
  }, []);

  const onEvent = useCallback((type: string, handler: (data: any) => void) => {
    handlersRef.current.set(type, handler);
  }, []);

  const leaveRoom = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "player_leave",
      payload: {},
    });
    cleanup();
    setStatus("idle");
    setRoomId("");
    setIsHost(false);
    setOpponentName("");
    setMyName("");
  }, [cleanup]);

  return {
    roomId,
    status,
    isHost,
    opponentName,
    myName,
    createRoom,
    joinRoom,
    sendEvent,
    onEvent,
    leaveRoom,
    setStatus,
  };
}
