import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Trophy, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { OnlineGameLobby } from "@/components/games/OnlineGameLobby";
import { toast } from "sonner";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy: "host" | "guest" | null;
}

const emojis = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍒", "🥝", "🍑"];

function createCards(): Card[] {
  return [...emojis, ...emojis]
    .sort(() => Math.random() - 0.5)
    .map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      matchedBy: null,
    }));
}

export function MemoryOnlineGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<ReturnType<typeof useGameRoom> | null>(null);
  const [inLobby, setInLobby] = useState(true);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const savedRef = useRef(false);

  const myRole = gameRoom?.isHost ? "host" : "guest";

  const handleGameReady = useCallback((room: ReturnType<typeof useGameRoom>) => {
    setGameRoom(room);
    setInLobby(false);

    if (room.isHost) {
      const newCards = createCards();
      setCards(newCards);
      setIsMyTurn(true);
      // Send cards to guest
      setTimeout(() => {
        room.sendEvent("init_cards", { cards: newCards });
      }, 500);
    } else {
      setIsMyTurn(false);
    }
  }, []);

  // Listen for events
  useEffect(() => {
    if (!gameRoom) return;

    gameRoom.onEvent("init_cards", (data: { cards: Card[] }) => {
      setCards(data.cards);
    });

    gameRoom.onEvent("flip", (data: { cardId: number }) => {
      setCards((prev) => {
        const newCards = prev.map((c) => (c.id === data.cardId ? { ...c, isFlipped: true } : c));
        return newCards;
      });
      setFlippedCards((prev) => [...prev, data.cardId]);
    });

    gameRoom.onEvent("match_result", (data: { card1: number; card2: number; matched: boolean; matchedBy: "host" | "guest"; nextTurn: "host" | "guest" }) => {
      setTimeout(() => {
        setCards((prev) => {
          if (data.matched) {
            return prev.map((c) =>
              c.id === data.card1 || c.id === data.card2
                ? { ...c, isMatched: true, matchedBy: data.matchedBy, isFlipped: true }
                : c
            );
          } else {
            return prev.map((c) =>
              c.id === data.card1 || c.id === data.card2
                ? { ...c, isFlipped: false }
                : c
            );
          }
        });

        if (data.matched) {
          if (data.matchedBy === myRole) {
            setMyScore((s) => s + 1);
            toast.success("✅ Paire trouvée !", { duration: 1000 });
          } else {
            setTheirScore((s) => s + 1);
          }
        }

        setFlippedCards([]);
        setIsProcessing(false);
        setIsMyTurn(data.nextTurn === myRole);
      }, 1000);
    });

    gameRoom.onEvent("game_complete", () => {
      setGameComplete(true);
    });
  }, [gameRoom, myRole]);

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched) && !gameComplete) {
      setGameComplete(true);
      if (gameRoom?.isHost) {
        gameRoom.sendEvent("game_complete", {});
      }
    }
  }, [cards, gameComplete, gameRoom]);

  // Save
  useEffect(() => {
    if (gameComplete && !savedRef.current && user) {
      savedRef.current = true;
      supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "memory_online",
        score: myScore * 50,
        success: myScore > theirScore,
        duration_seconds: 60,
      });
    }
  }, [gameComplete, user, myScore, theirScore]);

  const handleCardClick = (cardId: number) => {
    if (!isMyTurn || isProcessing || !gameRoom) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    // Flip locally
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Send to opponent
    gameRoom.sendEvent("flip", { cardId });

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [first, second] = newFlipped;
      const card1 = cards.find((c) => c.id === first)!;
      const card2 = cards.find((c) => c.id === second)!;
      const matched = card1.emoji === card2.emoji;

      // Host determines match result
      if (gameRoom.isHost) {
        setTimeout(() => {
          gameRoom.sendEvent("match_result", {
            card1: first,
            card2: second,
            matched,
            matchedBy: myRole,
            nextTurn: matched ? myRole : "guest",
          });

          // Apply locally too
          setCards((prev) => {
            if (matched) {
              return prev.map((c) =>
                c.id === first || c.id === second
                  ? { ...c, isMatched: true, matchedBy: myRole as "host" | "guest", isFlipped: true }
                  : c
              );
            } else {
              return prev.map((c) =>
                c.id === first || c.id === second ? { ...c, isFlipped: false } : c
              );
            }
          });

          if (matched) {
            setMyScore((s) => s + 1);
            toast.success("✅ Paire trouvée !", { duration: 1000 });
          }

          setFlippedCards([]);
          setIsProcessing(false);
          setIsMyTurn(matched);
        }, 1000);
      } else {
        // Guest: send flip, let host decide
        setTimeout(() => {
          gameRoom.sendEvent("match_result", {
            card1: first,
            card2: second,
            matched,
            matchedBy: myRole,
            nextTurn: matched ? myRole : "host",
          });

          setCards((prev) => {
            if (matched) {
              return prev.map((c) =>
                c.id === first || c.id === second
                  ? { ...c, isMatched: true, matchedBy: myRole as "host" | "guest", isFlipped: true }
                  : c
              );
            } else {
              return prev.map((c) =>
                c.id === first || c.id === second ? { ...c, isFlipped: false } : c
              );
            }
          });

          if (matched) {
            setMyScore((s) => s + 1);
            toast.success("✅ Paire trouvée !", { duration: 1000 });
          }

          setFlippedCards([]);
          setIsProcessing(false);
          setIsMyTurn(matched);
        }, 1000);
      }
    }
  };

  if (inLobby) {
    return (
      <OnlineGameLobby gameTitle="Memory" gameEmoji="🃏" gameType="memory" onGameReady={handleGameReady} />
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg text-foreground">Préparation du jeu...</p>
      </div>
    );
  }

  if (gameRoom?.status === "disconnected") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1"><h1 className="text-lg font-bold text-foreground">Memory En Ligne</h1></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-bold">Connexion perdue</h2>
          <Button onClick={() => { gameRoom.leaveRoom(); setInLobby(true); }}>🔄 Nouvelle partie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Memory En Ligne</h1>
          <p className="text-sm text-muted-foreground">
            {isMyTurn ? "Votre tour !" : `Tour de ${gameRoom?.opponentName}`}
          </p>
        </div>
        <Wifi className="w-4 h-4 text-green-500" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scoreboard */}
        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div className={`text-center flex-1 ${isMyTurn && !gameComplete ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{myScore}</p>
              <p className="text-sm font-medium text-foreground">{gameRoom?.myName}</p>
              {isMyTurn && !gameComplete && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full">À vous !</span>
              )}
            </div>
            <div className="text-center px-3">
              <p className="text-sm text-muted-foreground">Restant</p>
              <p className="text-lg font-bold">{emojis.length - myScore - theirScore}</p>
            </div>
            <div className={`text-center flex-1 ${!isMyTurn && !gameComplete ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{theirScore}</p>
              <p className="text-sm font-medium text-foreground">{gameRoom?.opponentName}</p>
              {!isMyTurn && !gameComplete && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">Joue...</span>
              )}
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {!gameComplete && (
          <div className={`text-center py-2 px-4 rounded-xl ${isMyTurn ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            <p className={`font-semibold ${isMyTurn ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
              {isMyTurn ? "Retournez 2 cartes !" : `${gameRoom?.opponentName} retourne des cartes...`}
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!isMyTurn || card.isFlipped || card.isMatched || isProcessing || gameComplete}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                card.isFlipped || card.isMatched
                  ? card.matchedBy === "host"
                    ? "bg-blue-200 dark:bg-blue-900/30 ring-2 ring-blue-400"
                    : card.matchedBy === "guest"
                    ? "bg-red-200 dark:bg-red-900/30 ring-2 ring-red-400"
                    : "bg-primary/20"
                  : isMyTurn && !isProcessing
                  ? "bg-gradient-to-br from-primary to-primary/70 hover:from-primary/80 cursor-pointer"
                  : "bg-gradient-to-br from-primary/60 to-primary/40"
              } ${card.isMatched ? "opacity-60" : ""}`}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "?"}
            </button>
          ))}
        </div>

        {/* Game Complete */}
        {gameComplete && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {myScore > theirScore ? "Vous gagnez ! 🎉" : theirScore > myScore ? `${gameRoom?.opponentName} gagne !` : "Égalité ! 🤝"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {gameRoom?.myName} : {myScore} — {gameRoom?.opponentName} : {theirScore}
            </p>
            <Button onClick={() => { gameRoom?.leaveRoom(); goBack(); }}>
              Retour aux jeux
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
