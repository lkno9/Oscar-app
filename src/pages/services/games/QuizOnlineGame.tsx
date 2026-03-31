import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Trophy, CheckCircle, XCircle, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { OnlineGameLobby } from "@/components/games/OnlineGameLobby";
import { toast } from "sonner";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  category: string;
}

const allQuestions: Question[] = [
  { question: "En quelle année la Révolution française a-t-elle commencé ?", answers: ["1789", "1792", "1815", "1776"], correct: 0, category: "Histoire" },
  { question: "Qui était le roi de France pendant la Révolution ?", answers: ["Louis XIV", "Louis XV", "Louis XVI", "Napoléon"], correct: 2, category: "Histoire" },
  { question: "En quelle année la Tour Eiffel a-t-elle été construite ?", answers: ["1889", "1867", "1900", "1878"], correct: 0, category: "Histoire" },
  { question: "Qui a découvert l'Amérique en 1492 ?", answers: ["Magellan", "Christophe Colomb", "Vasco de Gama", "Marco Polo"], correct: 1, category: "Histoire" },
  { question: "Quel événement a eu lieu le 11 novembre 1918 ?", answers: ["Début de la guerre", "Armistice", "Traité de Versailles", "Révolution russe"], correct: 1, category: "Histoire" },
  { question: "Quel est le plus long fleuve de France ?", answers: ["La Seine", "La Loire", "Le Rhône", "La Garonne"], correct: 1, category: "Géographie" },
  { question: "Quelle est la capitale de l'Espagne ?", answers: ["Barcelone", "Séville", "Madrid", "Valence"], correct: 2, category: "Géographie" },
  { question: "Quel est le plus haut sommet du monde ?", answers: ["Mont Blanc", "K2", "Kilimandjaro", "Everest"], correct: 3, category: "Géographie" },
  { question: "Combien d'océans y a-t-il sur Terre ?", answers: ["3", "4", "5", "6"], correct: 2, category: "Géographie" },
  { question: "Quelle est la capitale de l'Italie ?", answers: ["Milan", "Rome", "Florence", "Venise"], correct: 1, category: "Géographie" },
  { question: "Quel peintre a peint la Joconde ?", answers: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Botticelli"], correct: 1, category: "Culture" },
  { question: "Qui a écrit Les Misérables ?", answers: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Balzac"], correct: 1, category: "Culture" },
  { question: "Quel instrument a 88 touches ?", answers: ["Guitare", "Violon", "Piano", "Orgue"], correct: 2, category: "Culture" },
  { question: "Quel est le symbole chimique de l'or ?", answers: ["Or", "Ag", "Au", "Fe"], correct: 2, category: "Sciences" },
  { question: "Combien de planètes compte notre système solaire ?", answers: ["7", "8", "9", "10"], correct: 1, category: "Sciences" },
  { question: "Quelle planète est surnommée la planète rouge ?", answers: ["Vénus", "Jupiter", "Mars", "Saturne"], correct: 2, category: "Sciences" },
  { question: "Quel personnage Disney vit dans une tour ?", answers: ["Cendrillon", "Raiponce", "Belle", "Ariel"], correct: 1, category: "Divertissement" },
  { question: "Quelle chanteuse a chanté 'La Vie en Rose' ?", answers: ["Dalida", "Édith Piaf", "Céline Dion", "Mireille Mathieu"], correct: 1, category: "Divertissement" },
  { question: "Combien d'os a le corps humain adulte ?", answers: ["106", "206", "306", "186"], correct: 1, category: "Sciences" },
  { question: "Qui a peint 'Les Tournesols' ?", answers: ["Monet", "Van Gogh", "Renoir", "Cézanne"], correct: 1, category: "Culture" },
];

const TOTAL_QUESTIONS = 8;

type Phase = "lobby" | "waiting_question" | "answering" | "waiting_opponent" | "reveal" | "results";

export function QuizOnlineGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<ReturnType<typeof useGameRoom> | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [theirAnswer, setTheirAnswer] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const [startTime] = useState(Date.now());
  const savedRef = useRef(false);

  const handleGameReady = useCallback((room: ReturnType<typeof useGameRoom>) => {
    setGameRoom(room);

    if (room.isHost) {
      // Host picks questions and sends them
      const picked = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
      setQuestions(picked);
      // Small delay to ensure both are ready
      setTimeout(() => {
        room.sendEvent("questions", { questions: picked });
        setPhase("answering");
      }, 500);
    } else {
      setPhase("waiting_question");
    }
  }, []);

  // Listen for events
  useEffect(() => {
    if (!gameRoom) return;

    gameRoom.onEvent("questions", (data: { questions: Question[] }) => {
      setQuestions(data.questions);
      setPhase("answering");
    });

    gameRoom.onEvent("answer", (data: { questionIndex: number; answerIndex: number }) => {
      setTheirAnswer(data.answerIndex);
    });

    gameRoom.onEvent("next_question", () => {
      setCurrentIndex((i) => i + 1);
      setMyAnswer(null);
      setTheirAnswer(null);
      setPhase("answering");
    });

    gameRoom.onEvent("show_results", () => {
      setPhase("results");
    });
  }, [gameRoom]);

  // When both have answered, reveal
  useEffect(() => {
    if (myAnswer !== null && theirAnswer !== null && phase === "waiting_opponent") {
      setPhase("reveal");

      const currentQ = questions[currentIndex];
      if (myAnswer === currentQ.correct) setMyScore((s) => s + 1);
      if (theirAnswer === currentQ.correct) setTheirScore((s) => s + 1);
    }
  }, [myAnswer, theirAnswer, phase, questions, currentIndex]);

  // Save on results
  useEffect(() => {
    if (phase === "results" && !savedRef.current && user) {
      savedRef.current = true;
      const duration = Math.round((Date.now() - startTime) / 1000);
      supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "quiz_online",
        score: myScore * 100,
        success: myScore > theirScore,
        duration_seconds: duration,
      });
    }
  }, [phase, user, myScore, theirScore]);

  const handleAnswer = (answerIndex: number) => {
    if (myAnswer !== null || !gameRoom) return;
    setMyAnswer(answerIndex);
    gameRoom.sendEvent("answer", { questionIndex: currentIndex, answerIndex });

    if (theirAnswer !== null) {
      // Both answered
      setPhase("reveal");
      const currentQ = questions[currentIndex];
      if (answerIndex === currentQ.correct) setMyScore((s) => s + 1);
      if (theirAnswer === currentQ.correct) setTheirScore((s) => s + 1);
    } else {
      setPhase("waiting_opponent");
    }
  };

  const nextQuestion = () => {
    if (!gameRoom?.isHost) return;

    if (currentIndex + 1 >= questions.length) {
      setPhase("results");
      gameRoom.sendEvent("show_results", {});
    } else {
      setCurrentIndex((i) => i + 1);
      setMyAnswer(null);
      setTheirAnswer(null);
      setPhase("answering");
      gameRoom.sendEvent("next_question", {});
    }
  };

  const getAnswerClass = (index: number) => {
    let base = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium ";
    if (phase !== "reveal") {
      if (index === myAnswer) return base + "border-primary bg-primary/10";
      return base + "border-border bg-card hover:border-primary hover:bg-primary/5";
    }
    const isCorrect = index === questions[currentIndex].correct;
    if (isCorrect) return base + "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (index === myAnswer && !isCorrect) return base + "border-destructive bg-destructive/10 text-destructive";
    if (index === theirAnswer && !isCorrect) return base + "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600";
    return base + "border-border bg-card opacity-50";
  };

  if (phase === "lobby") {
    return (
      <OnlineGameLobby gameTitle="Quiz" gameEmoji="🧠" gameType="quiz" onGameReady={handleGameReady} />
    );
  }

  if (phase === "waiting_question") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg text-foreground">Préparation du quiz...</p>
      </div>
    );
  }

  if (phase === "results") {
    const winner = myScore > theirScore ? gameRoom?.myName : theirScore > myScore ? gameRoom?.opponentName : null;
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Quiz En Ligne - Résultats</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <Trophy className="w-16 h-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground text-center">
            {winner ? (winner === gameRoom?.myName ? "Vous gagnez ! 🎉" : `${gameRoom?.opponentName} gagne !`) : "Égalité ! 🤝"}
          </h2>
          <div className="w-full max-w-sm bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div className={`text-center flex-1 ${myScore >= theirScore ? "opacity-100" : "opacity-60"}`}>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{myScore}</p>
                <p className="text-sm font-medium text-foreground">{gameRoom?.myName}</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className={`text-center flex-1 ${theirScore >= myScore ? "opacity-100" : "opacity-60"}`}>
                <p className="text-4xl font-bold text-red-600 dark:text-red-400">{theirScore}</p>
                <p className="text-sm font-medium text-foreground">{gameRoom?.opponentName}</p>
              </div>
            </div>
          </div>
          <Button size="lg" onClick={() => { gameRoom?.leaveRoom(); goBack(); }}>
            Retour aux jeux
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Quiz En Ligne</h1>
          <p className="text-sm text-muted-foreground">Question {currentIndex + 1}/{questions.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600">{myScore}</span>
          <span className="text-xs text-muted-foreground">-</span>
          <span className="text-sm font-bold text-red-600">{theirScore}</span>
          <Wifi className="w-4 h-4 text-green-500 ml-1" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Progress */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Category */}
        <div className="flex justify-center">
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">{currentQ.category}</span>
        </div>

        {/* Question */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground text-center leading-relaxed">{currentQ.question}</h2>
        </div>

        {/* Answers */}
        <div className="flex flex-col gap-3">
          {currentQ.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={getAnswerClass(index)}
              disabled={myAnswer !== null}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{answer}</span>
                {phase === "reveal" && index === questions[currentIndex].correct && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {phase === "reveal" && index === myAnswer && index !== questions[currentIndex].correct && (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Waiting for opponent */}
        {phase === "waiting_opponent" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>En attente de {gameRoom?.opponentName}...</span>
          </div>
        )}

        {/* Reveal - show both answers */}
        {phase === "reveal" && (
          <div className="bg-card rounded-xl p-3 border border-border space-y-1">
            <p className="text-sm">
              <span className="font-medium text-blue-600">{gameRoom?.myName}</span> :{" "}
              {myAnswer === currentQ.correct ? "✅ Bonne réponse" : "❌ Mauvaise réponse"}
            </p>
            <p className="text-sm">
              <span className="font-medium text-red-600">{gameRoom?.opponentName}</span> :{" "}
              {theirAnswer === currentQ.correct ? "✅ Bonne réponse" : "❌ Mauvaise réponse"}
            </p>
          </div>
        )}

        {/* Next button (host only) */}
        {phase === "reveal" && gameRoom?.isHost && (
          <Button size="lg" className="mt-2" onClick={nextQuestion}>
            {currentIndex + 1 >= questions.length ? "Voir les résultats" : "Question suivante ▶️"}
          </Button>
        )}
        {phase === "reveal" && !gameRoom?.isHost && (
          <p className="text-center text-sm text-muted-foreground py-2">
            En attente de la question suivante...
          </p>
        )}
      </div>
    </div>
  );
}
