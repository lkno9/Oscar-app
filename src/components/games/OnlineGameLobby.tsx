import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Users, Wifi, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyLinks } from "@/hooks/useFamilyLinks";
import { useFamilyMessages } from "@/hooks/useFamilyMessages";
import { useGameRoom, RoomStatus } from "@/hooks/useGameRoom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnlineGameLobbyProps {
  gameTitle: string;
  gameEmoji: string;
  gameType: string;
  onGameReady: (gameRoom: ReturnType<typeof useGameRoom>) => void;
}

export function OnlineGameLobby({ gameTitle, gameEmoji, gameType, onGameReady }: OnlineGameLobbyProps) {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const { linkedSeniors, linkedFamily, loading: linksLoading } = useFamilyLinks();
  const { sendMessage } = useFamilyMessages();
  const gameRoom = useGameRoom();

  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [myName, setMyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [profileName, setProfileName] = useState("");

  // Fetch user profile name
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setProfileName(data.full_name);
            setMyName(data.full_name);
          }
        });
    }
  }, [user]);

  // Get all proches (both directions of family_links)
  const proches = [
    ...linkedSeniors.map((l) => ({
      id: l.senior_id,
      name: l.senior_profile?.full_name || "Proche",
      relationship: l.relationship,
      avatar: l.senior_profile?.avatar_url,
    })),
    ...linkedFamily.map((l) => ({
      id: l.family_member_id,
      name: l.family_profile?.full_name || "Proche",
      relationship: l.relationship,
      avatar: l.family_profile?.avatar_url,
    })),
  ].filter((p) => p.id !== user?.id);

  // When connected, notify parent
  useEffect(() => {
    if (gameRoom.status === "connected") {
      // Small delay to let the UI show "connected" state
      const timer = setTimeout(() => {
        gameRoom.setStatus("playing");
        onGameReady(gameRoom);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameRoom.status]);

  const handleCreate = () => {
    if (!myName.trim()) {
      toast.error("Entrez votre prénom !");
      return;
    }
    gameRoom.createRoom(myName.trim());
    setMode("create");
  };

  const handleJoin = () => {
    if (!myName.trim()) {
      toast.error("Entrez votre prénom !");
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length < 6) {
      toast.error("Entrez un code de 6 caractères !");
      return;
    }
    gameRoom.joinRoom(joinCode.trim(), myName.trim());
    setMode("join");
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(gameRoom.roomId);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendCodeToProche = async (procheId: string, procheName: string) => {
    const message = `🎮 Je t'invite à jouer à ${gameTitle} en ligne ! Mon code de partie : ${gameRoom.roomId} — Rejoins-moi dans Jeux > ${gameTitle} En Ligne > Rejoindre une partie !`;
    await sendMessage(procheId, message);
    setSentTo((prev) => new Set([...prev, procheId]));
    toast.success(`Invitation envoyée à ${procheName} !`);
  };

  // Choose mode screen
  if (mode === "choose") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameTitle} En Ligne</h1>
            <p className="text-sm text-muted-foreground">Jouez à distance !</p>
          </div>
          <Wifi className="w-6 h-6 text-green-500" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-2">
            <div className="text-6xl mb-3">{gameEmoji}</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{gameTitle}</h2>
            <p className="text-muted-foreground">Jouez en ligne avec vos proches, chacun sur son appareil !</p>
          </div>

          {/* Name input */}
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-foreground mb-1">Votre prénom</label>
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
              placeholder="Votre prénom..."
              maxLength={15}
            />
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm space-y-3">
            <Button size="lg" className="w-full text-lg py-6" onClick={handleCreate}>
              🎮 Créer une partie
            </Button>
            <div className="text-center text-muted-foreground text-sm">ou</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg uppercase text-center tracking-widest focus:border-primary focus:outline-none"
                placeholder="CODE"
                maxLength={6}
              />
              <Button size="lg" onClick={handleJoin} disabled={joinCode.length < 6}>
                Rejoindre
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-accent rounded-xl p-4 text-center w-full max-w-sm">
            <p className="text-foreground font-medium mb-2">📱 Comment ça marche ?</p>
            <ol className="text-sm text-muted-foreground text-left space-y-1">
              <li>1. Créez une partie et partagez le code</li>
              <li>2. Votre proche entre le code sur son appareil</li>
              <li>3. La partie commence automatiquement !</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for opponent (host created room)
  if (mode === "create" && gameRoom.status === "waiting") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => { gameRoom.leaveRoom(); setMode("choose"); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameTitle} En Ligne</h1>
            <p className="text-sm text-muted-foreground">En attente d'un joueur...</p>
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Room code display */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-center text-primary-foreground">
            <p className="text-sm opacity-80 mb-2">Code de la partie</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-bold tracking-[0.3em]">{gameRoom.roomId}</span>
              <button onClick={copyCode} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm opacity-80 mt-3">Partagez ce code à votre proche</p>
          </div>

          {/* Waiting animation */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>En attente d'un joueur...</span>
            </div>
          </div>

          {/* Send to proches */}
          {proches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Send className="w-4 h-4" />
                Envoyer le code à un proche
              </h3>
              <div className="space-y-2">
                {proches.map((proche) => (
                  <button
                    key={proche.id}
                    onClick={() => sendCodeToProche(proche.id, proche.name)}
                    disabled={sentTo.has(proche.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {proche.avatar ? (
                        <img src={proche.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{proche.name}</p>
                      <p className="text-xs text-muted-foreground">{proche.relationship}</p>
                    </div>
                    {sentTo.has(proche.id) ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> Envoyé
                      </span>
                    ) : (
                      <Send className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {proches.length === 0 && !linksLoading && (
            <div className="bg-accent rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                💡 Partagez le code par téléphone ou message à votre proche.
                Ils doivent ouvrir le même jeu et cliquer "Rejoindre".
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Joining / Connected state
  if (gameRoom.status === "connected") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameTitle} En Ligne</h1>
          </div>
          <div className="flex items-center gap-1 text-green-500">
            <Wifi className="w-5 h-5" />
            <span className="text-sm font-medium">Connecté</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-foreground text-center">
            {gameRoom.opponentName} a rejoint !
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl mb-1">
                👤
              </div>
              <p className="font-medium text-foreground">{gameRoom.myName}</p>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl mb-1">
                👤
              </div>
              <p className="font-medium text-foreground">{gameRoom.opponentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Lancement de la partie...</span>
          </div>
        </div>
      </div>
    );
  }

  // Joining state (waiting for connection)
  if (mode === "join" && gameRoom.status !== "connected" && gameRoom.status !== "playing") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => { gameRoom.leaveRoom(); setMode("choose"); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameTitle} En Ligne</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <h2 className="text-xl font-bold text-foreground">Connexion en cours...</h2>
          <p className="text-muted-foreground text-center">
            Connexion à la partie <span className="font-mono font-bold">{gameRoom.roomId}</span>
          </p>
        </div>
      </div>
    );
  }

  // Disconnected state
  if (gameRoom.status === "disconnected") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameTitle} En Ligne</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-bold text-foreground text-center">Connexion perdue</h2>
          <p className="text-muted-foreground text-center">
            Votre adversaire s'est déconnecté.
          </p>
          <Button size="lg" onClick={() => { gameRoom.leaveRoom(); setMode("choose"); }}>
            🔄 Nouvelle partie
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
