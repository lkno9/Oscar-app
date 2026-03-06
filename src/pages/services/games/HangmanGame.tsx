import { ArrowLeft, RotateCcw, Trophy, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const WORDS = [
  { word: "SOLEIL", hint: "Il brille dans le ciel" },
  { word: "MAISON", hint: "On y habite" },
  { word: "JARDIN", hint: "On y fait pousser des fleurs" },
  { word: "CHAPEAU", hint: "On le met sur la tête" },
  { word: "CUISINE", hint: "On y prépare les repas" },
  { word: "MUSIQUE", hint: "Art des sons" },
  { word: "VOYAGE", hint: "Partir découvrir le monde" },
  { word: "BONHEUR", hint: "Sentiment de joie" },
  { word: "CHOCOLAT", hint: "Douceur sucrée" },
  { word: "RIVIERE", hint: "Cours d'eau" },
  { word: "MONTAGNE", hint: "Sommet élevé" },
  { word: "FAMILLE", hint: "Nos proches" },
  { word: "LECTURE", hint: "Lire un livre" },
  { word: "PEINTURE", hint: "Art avec des couleurs" },
  { word: "FROMAGE", hint: "Spécialité française" },
  { word: "BOULANGER", hint: "Il fait le pain" },
  { word: "AUTOMNE", hint: "Saison des feuilles mortes" },
  { word: "PRINTEMPS", hint: "Saison des fleurs" },
  { word: "PAPILLON", hint: "Insecte aux belles ailes" },
  { word: "CROISSANT", hint: "Viennoiserie du matin" },
];

const MAX_ERRORS = 7;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function HangmanGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [wordData, setWordData] = useState(WORDS[0]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [errors, setErrors] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [startTime, setStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  useEffect(() => { initGame(); }, []);

  const initGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWordData(randomWord);
    setGuessedLetters([]);
    setErrors(0);
    setGameState("playing");
    setStartTime(Date.now());
    setRound(1);
    setScore(0);
  };

  const nextRound = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWordData(randomWord);
    setGuessedLetters([]);
    setErrors(0);
    setGameState("playing");
    setRound(r => r + 1);
  };

  const handleGuess = (letter: string) => {
    if (gameState !== "playing" || guessedLetters.includes(letter)) return;

    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (!wordData.word.includes(letter)) {
      const newErrors = errors + 1;
      setErrors(newErrors);
      if (newErrors >= MAX_ERRORS) {
        setGameState("lost");
        saveGameSession(false);
      }
    } else {
      const allFound = wordData.word.split("").every(l => newGuessed.includes(l));
      if (allFound) {
        const roundScore = Math.max(10, 100 - errors * 15);
        const newScore = score + roundScore;
        setScore(newScore);
        setGameState("won");
        if (round >= 5) {
          saveGameSession(true);
        }
      }
    }
  };

  const saveGameSession = async (success: boolean) => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const finalScore = success ? score + 100 : Math.max(0, score);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "hangman",
      score: finalScore,
      success,
      duration_seconds: duration,
    });
    if (success) toast.success(`Bravo ! Score: ${finalScore} points`);
  };

  const displayWord = wordData.word
    .split("")
    .map(letter => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  const livesLeft = MAX_ERRORS - errors;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Le Pendu</h1>
          <p className="text-sm text-muted-foreground">Devinez le mot</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_ERRORS }).map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < livesLeft ? "text-red-500 fill-red-500" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{score} pts</p>
            <p className="text-xs text-muted-foreground">Mot {round}/5</p>
          </div>
        </div>

        {/* Hint */}
        <div className="bg-primary/10 rounded-xl p-3 text-center">
          <p className="text-sm text-muted-foreground">Indice</p>
          <p className="text-base font-semibold text-foreground">{wordData.hint}</p>
        </div>

        {/* Word display */}
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-3xl font-bold tracking-[0.3em] text-foreground font-mono">{displayWord}</p>
        </div>

        {/* Keyboard */}
        {gameState === "playing" && (
          <div className="grid grid-cols-7 gap-1.5 max-w-sm mx-auto">
            {ALPHABET.map(letter => {
              const isGuessed = guessedLetters.includes(letter);
              const isCorrect = isGuessed && wordData.word.includes(letter);
              const isWrong = isGuessed && !wordData.word.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed}
                  className={`aspect-square rounded-lg text-base font-bold flex items-center justify-center transition-all ${
                    isCorrect ? "bg-green-500 text-white" :
                    isWrong ? "bg-destructive/20 text-destructive/40" :
                    "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground active:scale-95"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Won round */}
        {gameState === "won" && round < 5 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <h2 className="text-xl font-bold text-foreground mb-1">Bravo !</h2>
            <p className="text-muted-foreground mb-4">Le mot était : <strong>{wordData.word}</strong></p>
            <Button onClick={nextRound}>Mot suivant</Button>
          </div>
        )}

        {/* Won all rounds */}
        {gameState === "won" && round >= 5 && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Félicitations !</h2>
            <p className="text-muted-foreground mb-4">5 mots trouvés ! Score : {score + 100} points</p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
        )}

        {/* Lost */}
        {gameState === "lost" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-2">😔</p>
            <h2 className="text-xl font-bold text-foreground mb-1">Perdu !</h2>
            <p className="text-muted-foreground mb-4">Le mot était : <strong>{wordData.word}</strong></p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        )}

        {gameState === "playing" && guessedLetters.length === 0 && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Appuyez sur les lettres pour deviner le mot. Vous avez 7 vies !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
