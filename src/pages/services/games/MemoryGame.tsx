import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const emojis = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍒", "🥝", "🍑"];

export function MemoryGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));

    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setGameComplete(false);
    setStartTime(Date.now());
    setIsProcessing(false);
  };

  const handleCardClick = (id: number) => {
    if (isProcessing) return;
    if (flippedCards.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessing(true);

      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setIsProcessing(false);

          // Check if game is complete
          if (matchedCards.every(c => c.isMatched)) {
            setGameComplete(true);
            saveGameSession(true);
          }
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const saveGameSession = async (success: boolean) => {
    if (!user) return;

    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = success ? Math.max(100, 500 - (moves * 10) - (duration / 2)) : 0;

    await supabase.from('game_sessions').insert({
      user_id: user.id,
      game_type: 'memory',
      score: Math.round(score),
      success,
      duration_seconds: duration
    });

    if (success) {
      toast.success(`🎉 Bravo ! Score: ${Math.round(score)} points`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Retour"
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Mémoire</h1>
          <p className="text-sm text-muted-foreground">Trouvez les paires</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="flex justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{moves}</p>
            <p className="text-sm text-muted-foreground">Coups</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {cards.filter(c => c.isMatched).length / 2} / {emojis.length}
            </p>
            <p className="text-sm text-muted-foreground">Paires</p>
          </div>
        </div>

        {/* Game board */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || isProcessing}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all transform ${
                card.isFlipped || card.isMatched
                  ? 'bg-primary/20 rotate-0 scale-100'
                  : 'bg-primary hover:bg-primary/80 rotate-0 scale-100'
              } ${card.isMatched ? 'opacity-50' : ''}`}
            >
              {card.isFlipped || card.isMatched ? card.emoji : '?'}
            </button>
          ))}
        </div>

        {/* Victory */}
        {gameComplete && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Félicitations !</h2>
            <p className="text-muted-foreground mb-4">
              Vous avez terminé en {moves} coups
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!gameComplete && moves === 0 && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">🃏 Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Retournez deux cartes pour trouver les paires identiques. 
              Mémorisez la position des cartes !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
