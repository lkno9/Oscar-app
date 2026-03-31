import { ArrowLeft, RotateCcw, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy: number | null; // 1 or 2
}

const EMOJI_SETS = [
  ["🍎", "🍊", "🍋", "🍇", "🍓", "🍒", "🥝", "🍑"],
  ["🐶", "🐱", "🐸", "🐰", "🦊", "🐻", "🐼", "🐨"],
  ["🌸", "🌻", "🌹", "🌷", "🌺", "🪻", "🌼", "💐"],
  ["⚽", "🏀", "🎾", "🏈", "🎱", "🏐", "🏓", "🎳"],
];

export function MemoryDuoGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState("Joueur 2");
  const [isSetup, setIsSetup] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isPlayer1Turn, setIsPlayer1Turn] = useState(true);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [emojiSetIndex, setEmojiSetIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalP1, setTotalP1] = useState(0);
  const [totalP2, setTotalP2] = useState(0);
  const savedRef = useRef(false);

  const emojis = EMOJI_SETS[emojiSetIndex % EMOJI_SETS.length];

  useEffect(() => {
    if (gameComplete && !savedRef.current) {
      savedRef.current = true;
      saveSession();
    }
  }, [gameComplete]);

  const saveSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "memory_duo",
      score: (p1Score + p2Score) * 50,
      success: true,
      duration_seconds: duration,
    });
  };

  const initCards = (setIdx: number) => {
    const emojiSet = EMOJI_SETS[setIdx % EMOJI_SETS.length];
    const shuffled = [...emojiSet, ...emojiSet]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
        matchedBy: null,
      }));
    return shuffled;
  };

  const startGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      toast.error("Entrez les deux prénoms !");
      return;
    }
    setCards(initCards(0));
    setIsSetup(false);
    setStartTime(Date.now());
    savedRef.current = false;
  };

  const handleCardClick = (id: number) => {
    if (isProcessing) return;
    if (flippedCards.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id] = { ...newCards[id], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [first, second] = newFlipped;

      if (newCards[first].emoji === newCards[second].emoji) {
        // Match! Current player scores and plays again
        setTimeout(() => {
          const matchedCards = newCards.map(c => ({ ...c }));
          matchedCards[first] = { ...matchedCards[first], isMatched: true, matchedBy: isPlayer1Turn ? 1 : 2 };
          matchedCards[second] = { ...matchedCards[second], isMatched: true, matchedBy: isPlayer1Turn ? 1 : 2 };
          setCards(matchedCards);
          setFlippedCards([]);
          setIsProcessing(false);

          if (isPlayer1Turn) {
            setP1Score(s => s + 1);
            toast.success(`✅ Paire trouvée par ${player1Name} !`, { duration: 1500 });
          } else {
            setP2Score(s => s + 1);
            toast.success(`✅ Paire trouvée par ${player2Name} !`, { duration: 1500 });
          }

          // Check completion
          if (matchedCards.every(c => c.isMatched)) {
            setGameComplete(true);
          }
        }, 500);
      } else {
        // No match - switch turns
        setTimeout(() => {
          const resetCards = newCards.map(c => ({ ...c }));
          resetCards[first] = { ...resetCards[first], isFlipped: false };
          resetCards[second] = { ...resetCards[second], isFlipped: false };
          setCards(resetCards);
          setFlippedCards([]);
          setIsProcessing(false);
          setIsPlayer1Turn(!isPlayer1Turn);
        }, 1200);
      }
    }
  };

  const nextRound = () => {
    const nextSetIdx = emojiSetIndex + 1;
    setEmojiSetIndex(nextSetIdx);
    setRoundNumber(r => r + 1);
    setTotalP1(t => t + p1Score);
    setTotalP2(t => t + p2Score);
    setCards(initCards(nextSetIdx));
    setFlippedCards([]);
    setIsPlayer1Turn(roundNumber % 2 === 0); // alternate who starts
    setP1Score(0);
    setP2Score(0);
    setGameComplete(false);
    setIsProcessing(false);
    savedRef.current = false;
  };

  const newMatch = () => {
    setEmojiSetIndex(0);
    setRoundNumber(1);
    setTotalP1(0);
    setTotalP2(0);
    setCards(initCards(0));
    setFlippedCards([]);
    setIsPlayer1Turn(true);
    setP1Score(0);
    setP2Score(0);
    setGameComplete(false);
    setIsProcessing(false);
    setStartTime(Date.now());
    savedRef.current = false;
  };

  const currentPlayerName = isPlayer1Turn ? player1Name : player2Name;

  // Setup screen
  if (isSetup) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Memory Duo</h1>
            <p className="text-sm text-muted-foreground">Jouez à deux !</p>
          </div>
          <Users className="w-6 h-6 text-primary" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">🃏</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Memory à 2 joueurs</h2>
            <p className="text-muted-foreground">
              Trouvez le plus de paires ! Quand vous trouvez une paire, rejouez.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Joueur 1 🔵</label>
              <input
                type="text"
                value={player1Name}
                onChange={e => setPlayer1Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Joueur 2 🔴</label>
              <input
                type="text"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>
            <Button size="lg" className="w-full text-lg py-6" onClick={startGame}>
              🎮 Commencer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Memory Duo</h1>
          <p className="text-sm text-muted-foreground">Manche {roundNumber}</p>
        </div>
        <Button size="sm" variant="outline" onClick={newMatch}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Nouveau
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scoreboard */}
        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div className={`text-center flex-1 transition-opacity ${isPlayer1Turn && !gameComplete ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{p1Score}</p>
              <p className="text-sm font-medium text-foreground">{player1Name}</p>
              {isPlayer1Turn && !gameComplete && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  À vous !
                </span>
              )}
            </div>
            <div className="text-center px-3">
              <p className="text-sm text-muted-foreground">Paires restantes</p>
              <p className="text-lg font-bold text-foreground">{emojis.length - p1Score - p2Score}</p>
            </div>
            <div className={`text-center flex-1 transition-opacity ${!isPlayer1Turn && !gameComplete ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{p2Score}</p>
              <p className="text-sm font-medium text-foreground">{player2Name}</p>
              {!isPlayer1Turn && !gameComplete && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  À vous !
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {!gameComplete && (
          <div className={`text-center py-2 px-4 rounded-xl ${
            isPlayer1Turn ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
          }`}>
            <p className={`font-semibold ${
              isPlayer1Turn ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
            }`}>
              {currentPlayerName}, retournez 2 cartes !
            </p>
          </div>
        )}

        {/* Game board */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || isProcessing || gameComplete}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all transform ${
                card.isFlipped || card.isMatched
                  ? card.matchedBy === 1
                    ? "bg-blue-200 dark:bg-blue-900/30 ring-2 ring-blue-400"
                    : card.matchedBy === 2
                    ? "bg-red-200 dark:bg-red-900/30 ring-2 ring-red-400"
                    : "bg-primary/20"
                  : "bg-gradient-to-br from-primary to-primary/70 hover:from-primary/80 hover:to-primary/60 cursor-pointer"
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
              {p1Score > p2Score
                ? `${player1Name} gagne ! 🎉`
                : p2Score > p1Score
                ? `${player2Name} gagne ! 🎉`
                : "Égalité ! 🤝"}
            </h2>
            <p className="text-muted-foreground mb-1">
              {player1Name} : {p1Score} paires — {player2Name} : {p2Score} paires
            </p>
            {(totalP1 > 0 || totalP2 > 0) && (
              <p className="text-sm text-muted-foreground mb-3">
                Score total : {player1Name} {totalP1 + p1Score} - {totalP2 + p2Score} {player2Name}
              </p>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <Button onClick={nextRound}>
                ▶️ Manche suivante
              </Button>
              <Button variant="outline" onClick={newMatch}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Nouveau match
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!gameComplete && p1Score === 0 && p2Score === 0 && flippedCards.length === 0 && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">🃏 Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Retournez 2 cartes pour trouver les paires.
              Si vous trouvez une paire, vous rejouez !
              Sinon, c'est au tour de l'autre joueur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
