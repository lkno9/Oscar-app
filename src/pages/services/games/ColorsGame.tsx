import { ArrowLeft, RotateCcw, Trophy, Clock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";

interface ColorEntry {
  name: string;
  label: string;
  tw: string;
  hex: string;
}

const COLORS: ColorEntry[] = [
  { name: "red",    label: "ROUGE",  tw: "bg-red-500",    hex: "#ef4444" },
  { name: "blue",   label: "BLEU",   tw: "bg-blue-500",   hex: "#3b82f6" },
  { name: "green",  label: "VERT",   tw: "bg-green-500",  hex: "#22c55e" },
  { name: "yellow", label: "JAUNE",  tw: "bg-yellow-400", hex: "#facc15" },
  { name: "orange", label: "ORANGE", tw: "bg-orange-500", hex: "#f97316" },
  { name: "violet", label: "VIOLET", tw: "bg-violet-500", hex: "#8b5cf6" },
];

interface Round {
  wordLabel: string;
  wordColorIndex: number;
  options: number[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRound(): Round {
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  let colorIndex: number;
  do {
    colorIndex = Math.floor(Math.random() * COLORS.length);
  } while (colorIndex === wordIndex);

  const optionSet = new Set<number>([colorIndex]);
  while (optionSet.size < 4) {
    const idx = Math.floor(Math.random() * COLORS.length);
    optionSet.add(idx);
  }

  return {
    wordLabel: COLORS[wordIndex].label,
    wordColorIndex: colorIndex,
    options: [...optionSet].sort(() => Math.random() - 0.5),
  };
}

const TOTAL_ROUNDS = 10;

export function ColorsGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [round, setRound] = useState<Round>(() => generateRound());
  const [currentRound, setCurrentRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const startTimeRef = useRef(Date.now());

  // Timer counting up
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const saveGameSession = useCallback(async (finalCorrect: number, finalDuration: number) => {
    if (!user) return;
    const score = finalCorrect * 10;
    const success = finalCorrect >= 7;
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "colors",
      score,
      success,
      duration_seconds: finalDuration,
    });
  }, [user]);

  const endGame = useCallback((finalCorrect: number) => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    setElapsedSeconds(duration);
    setGameState("finished");
    saveGameSession(finalCorrect, duration);
  }, [saveGameSession]);

  const handleAnswer = (selectedColorIndex: number) => {
    if (gameState !== "playing" || feedback) return;

    const isCorrect = selectedColorIndex === round.wordColorIndex;
    setFeedback(isCorrect ? "correct" : "wrong");
    setSelectedOption(selectedColorIndex);

    const newCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) {
      setCorrect(newCorrect);
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        endGame(newCorrect);
      } else {
        setCurrentRound(r => r + 1);
        setRound(generateRound());
      }
    }, 700);
  };

  const initGame = () => {
    setRound(generateRound());
    setCurrentRound(0);
    setCorrect(0);
    setGameState("playing");
    setFeedback(null);
    setSelectedOption(null);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
  };

  const progressPercent = (currentRound / TOTAL_ROUNDS) * 100;
  const avgTime = gameState === "finished" && elapsedSeconds > 0
    ? (elapsedSeconds / TOTAL_ROUNDS).toFixed(1)
    : null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Jeu des Couleurs</h1>
          <p className="text-sm text-muted-foreground">Trouvez la bonne couleur</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {gameState === "playing" && (
          <>
            {/* Progress & timer */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tour {currentRound + 1}/{TOTAL_ROUNDS}
                </p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm bg-secondary text-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{correct * 10}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
            </div>

            {/* Color word display */}
            <div
              className={`bg-card rounded-2xl border-2 p-8 text-center transition-all ${
                feedback === "correct"
                  ? "border-green-500 bg-green-500/10"
                  : feedback === "wrong"
                  ? "border-destructive bg-destructive/10"
                  : "border-border"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                Quelle est la couleur du texte ?
              </p>
              <p
                className="text-5xl font-extrabold select-none transition-transform"
                style={{ color: COLORS[round.wordColorIndex].hex }}
              >
                {round.wordLabel}
              </p>
            </div>

            {/* Color button options */}
            <div className="grid grid-cols-2 gap-3">
              {round.options.map((colorIdx, i) => {
                const color = COLORS[colorIdx];
                const isSelected = selectedOption === colorIdx;
                const isAnswer = colorIdx === round.wordColorIndex;

                let btnClass =
                  "rounded-xl p-4 text-lg font-bold transition-all active:scale-95 text-white ";

                if (feedback && isAnswer) {
                  btnClass += `${color.tw} ring-4 ring-green-400 scale-105`;
                } else if (feedback && isSelected && !isAnswer) {
                  btnClass += `${color.tw} opacity-50 ring-4 ring-red-400`;
                } else if (feedback) {
                  btnClass += `${color.tw} opacity-40`;
                } else {
                  btnClass += `${color.tw} hover:opacity-90 hover:scale-[1.02]`;
                }

                return (
                  <button
                    key={`${currentRound}-${i}`}
                    onClick={() => handleAnswer(colorIdx)}
                    disabled={!!feedback}
                    className={btnClass}
                  >
                    {color.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {gameState === "finished" && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Partie terminée !</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-primary">{correct * 10}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-green-500">
                  {correct}/{TOTAL_ROUNDS}
                </p>
                <p className="text-sm text-muted-foreground">Bonnes réponses</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-sm text-muted-foreground">Temps total</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-foreground">{avgTime}s</p>
                <p className="text-sm text-muted-foreground">Moy. / tour</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {correct >= 9
                ? "Incroyable ! Vous avez un oeil de lynx !"
                : correct >= 7
                ? "Bravo ! Votre concentration est excellente !"
                : correct >= 5
                ? "Pas mal ! C'est un exercice difficile !"
                : "Continuez, c'est un bon entraînement pour le cerveau !"}
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
          </div>
        )}

        {gameState === "playing" && currentRound === 0 && !feedback && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <Palette className="w-6 h-6 mx-auto text-foreground mb-2" />
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Un mot de couleur s'affiche dans une couleur différente.
              Appuyez sur le bouton correspondant à la <strong>couleur du texte</strong>, pas au mot écrit !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
