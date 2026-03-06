import { ArrowLeft, RotateCcw, Trophy, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Question {
  text: string;
  answer: number;
  options: number[];
}

function generateQuestion(round: number): Question {
  const difficulty = Math.min(Math.floor(round / 4), 3);
  let a: number, b: number, op: string, answer: number;

  if (difficulty === 0) {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    op = "+";
    answer = a + b;
  } else if (difficulty === 1) {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 20) + 1;
    op = Math.random() > 0.5 ? "+" : "-";
    answer = op === "+" ? a + b : a - b;
  } else if (difficulty === 2) {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
    op = "×";
    answer = a * b;
  } else {
    const ops = ["+", "-", "×"];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "×") {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
    } else if (op === "-") {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a);
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
    }
  }

  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
    if (wrong > 0 && wrong !== answer) options.add(wrong);
  }

  return {
    text: `${a} ${op} ${b}`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 15;
const TIME_LIMIT = 90;

export function MathGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question>(() => generateQuestion(0));
  const [currentQ, setCurrentQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [startTime] = useState(Date.now());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const endGame = useCallback(() => {
    setGameState("finished");
    saveGameSession();
  }, [correct, score]);

  const saveGameSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const success = correct >= Math.floor(TOTAL_QUESTIONS * 0.6);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "math",
      score,
      success,
      duration_seconds: duration,
    });
  };

  const handleAnswer = (selected: number) => {
    if (gameState !== "playing" || feedback) return;

    const isCorrect = selected === question.answer;
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      const streakBonus = streak >= 3 ? 5 : 0;
      const points = 10 + streakBonus;
      setCorrect(c => c + 1);
      setScore(s => s + points);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentQ + 1 >= TOTAL_QUESTIONS) {
        endGame();
      } else {
        setCurrentQ(q => q + 1);
        setQuestion(generateQuestion(currentQ + 1));
      }
    }, 600);
  };

  const initGame = () => {
    setQuestion(generateQuestion(0));
    setCurrentQ(0);
    setCorrect(0);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setGameState("playing");
    setFeedback(null);
    setStreak(0);
  };

  const progressPercent = (currentQ / TOTAL_QUESTIONS) * 100;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Calcul Mental</h1>
          <p className="text-sm text-muted-foreground">Entraînez votre cerveau</p>
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
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Question {currentQ + 1}/{TOTAL_QUESTIONS}</p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm ${timeLeft <= 15 ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-foreground'}`}>
                <Clock className="w-4 h-4" />
                {timeLeft}s
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{score}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              {streak >= 3 && (
                <div>
                  <p className="text-2xl font-bold text-orange-500 flex items-center gap-1"><Zap className="w-5 h-5" />{streak}</p>
                  <p className="text-sm text-muted-foreground">Série</p>
                </div>
              )}
            </div>

            {/* Question */}
            <div className={`bg-card rounded-2xl border-2 p-8 text-center transition-all ${
              feedback === "correct" ? "border-green-500 bg-green-500/5" :
              feedback === "wrong" ? "border-destructive bg-destructive/5" :
              "border-border"
            }`}>
              <p className="text-4xl font-bold text-foreground">{question.text}</p>
              <p className="text-lg text-muted-foreground mt-2">= ?</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={`${currentQ}-${i}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`rounded-xl p-4 text-xl font-bold transition-all active:scale-95 ${
                    feedback && opt === question.answer ? "bg-green-500 text-white" :
                    feedback === "wrong" && opt !== question.answer ? "bg-secondary/50 text-muted-foreground" :
                    "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
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
                <p className="text-2xl font-bold text-primary">{score}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-green-500">{correct}/{TOTAL_QUESTIONS}</p>
                <p className="text-sm text-muted-foreground">Bonnes réponses</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {correct >= 12 ? "Excellent ! Vous êtes un champion !" :
               correct >= 8 ? "Très bien ! Continuez comme ça !" :
               "Pas mal ! Vous ferez mieux la prochaine fois !"}
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
        )}

        {gameState === "playing" && currentQ === 0 && !feedback && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Répondez à 15 calculs en 90 secondes. La difficulté augmente progressivement !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
