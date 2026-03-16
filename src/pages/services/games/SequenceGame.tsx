import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback } from "react";

interface SequenceQuestion {
  sequence: number[];
  answer: number;
  options: number[];
}

function generateSequence(round: number): SequenceQuestion {
  let sequence: number[];
  let answer: number;

  if (round < 3) {
    // Rounds 1-3: simple additions (+2, +3, +5)
    const steps = [2, 3, 5];
    const step = steps[Math.floor(Math.random() * steps.length)];
    const start = Math.floor(Math.random() * 10) + 1;
    sequence = [];
    for (let i = 0; i < 5; i++) {
      sequence.push(start + step * i);
    }
    answer = start + step * 5;
  } else if (round < 6) {
    // Rounds 4-6: multiplications (x2, x3)
    const multipliers = [2, 3];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const start = Math.floor(Math.random() * 3) + 1;
    sequence = [];
    let val = start;
    for (let i = 0; i < 5; i++) {
      sequence.push(val);
      val = val * mult;
    }
    answer = val;
  } else if (round < 8) {
    // Rounds 7-8: alternating patterns (+2, +3, +2, +3...)
    const pairs = [
      [2, 3],
      [3, 5],
      [1, 4],
      [2, 5],
    ];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const start = Math.floor(Math.random() * 10) + 1;
    sequence = [start];
    for (let i = 1; i < 6; i++) {
      const step = pair[(i - 1) % 2];
      sequence.push(sequence[i - 1] + step);
    }
    answer = sequence[5] + pair[0];
    // Keep only first 6 elements as the visible sequence
    sequence = sequence.slice(0, 6);
  } else {
    // Rounds 9-10: squares or fibonacci-like
    if (Math.random() > 0.5) {
      // Squares: 1, 4, 9, 16, 25, ?
      const offset = Math.floor(Math.random() * 3);
      sequence = [];
      for (let i = 1; i <= 5; i++) {
        sequence.push((i + offset) * (i + offset));
      }
      answer = (6 + offset) * (6 + offset);
    } else {
      // Fibonacci-like: each number is sum of previous two
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + a;
      sequence = [a, b];
      for (let i = 2; i < 6; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
      }
      answer = sequence[4] + sequence[5];
      // Show 6 numbers, answer is the 7th
      sequence = sequence.slice(0, 6);
    }
  }

  // Generate 3 plausible wrong answers
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offsetRange = Math.max(3, Math.floor(answer * 0.25));
    const offset = Math.floor(Math.random() * offsetRange) + 1;
    const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
    if (wrong > 0 && wrong !== answer && !options.has(wrong)) {
      options.add(wrong);
    }
  }

  return {
    sequence,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

const TOTAL_ROUNDS = 10;

export function SequenceGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [question, setQuestion] = useState<SequenceQuestion>(() => generateSequence(0));
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [startTime] = useState(Date.now());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const saveGameSession = useCallback(async (finalCorrect: number) => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = finalCorrect * 10;
    const success = finalCorrect >= 6;
    try {
      await supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "sequence",
        score,
        success,
        duration_seconds: duration,
      });
    } catch (e) {
      console.error("Failed to save game session", e);
    }
  }, [user, startTime]);

  const endGame = useCallback((finalCorrect: number) => {
    setGameState("finished");
    saveGameSession(finalCorrect);
  }, [saveGameSession]);

  const handleAnswer = (selected: number) => {
    if (gameState !== "playing" || feedback) return;

    const isCorrect = selected === question.answer;
    setFeedback(isCorrect ? "correct" : "wrong");

    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) {
      setCorrectCount(newCorrect);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        endGame(newCorrect);
      } else {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setQuestion(generateSequence(nextRound));
      }
    }, 800);
  };

  const initGame = () => {
    setQuestion(generateSequence(0));
    setCurrentRound(0);
    setCorrectCount(0);
    setGameState("playing");
    setFeedback(null);
  };

  const progressPercent = (currentRound / TOTAL_ROUNDS) * 100;

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
          <h1 className="text-lg font-bold text-foreground">Suite Logique</h1>
          <p className="text-sm text-muted-foreground">Trouvez le nombre suivant</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {gameState === "playing" && (
          <>
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Question {currentRound + 1}/{TOTAL_ROUNDS}
                </p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-foreground font-bold text-sm">
                {correctCount} / {currentRound}
              </div>
            </div>

            {/* Sequence display */}
            <div
              className={`bg-card rounded-2xl border-2 p-6 text-center transition-all ${
                feedback === "correct"
                  ? "border-green-500 bg-green-500/5"
                  : feedback === "wrong"
                  ? "border-destructive bg-destructive/5"
                  : "border-border"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-3">Quelle est la suite ?</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {question.sequence.map((num, i) => (
                  <span key={i} className="text-2xl font-bold text-foreground">
                    {num}
                    {i < question.sequence.length - 1 && (
                      <span className="text-muted-foreground mx-1">,</span>
                    )}
                  </span>
                ))}
                <span className="text-2xl font-bold text-primary ml-1">, ?</span>
              </div>
            </div>

            {/* Multiple choice options */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={`${currentRound}-${i}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`rounded-xl p-4 text-xl font-bold transition-all active:scale-95 ${
                    feedback && opt === question.answer
                      ? "bg-green-500 text-white"
                      : feedback === "wrong" && opt !== question.answer
                      ? "bg-secondary/50 text-muted-foreground"
                      : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {gameState === "finished" && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Partie terminée !</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-primary">{correctCount * 10}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-green-500">
                  {correctCount}/{TOTAL_ROUNDS}
                </p>
                <p className="text-sm text-muted-foreground">Bonnes réponses</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {correctCount >= 9
                ? "Excellent ! Vous êtes un champion des suites !"
                : correctCount >= 6
                ? "Très bien ! Continuez comme ça !"
                : "Pas mal ! Vous ferez mieux la prochaine fois !"}
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
          </div>
        )}

        {gameState === "playing" && currentRound === 0 && !feedback && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Trouvez le nombre manquant dans chaque suite logique.
              10 questions avec une difficulté croissante !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
