import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trophy, CheckCircle, XCircle, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  category: string;
}

const allQuestions: Question[] = [
  // Histoire
  { question: "En quelle année la Révolution française a-t-elle commencé ?", answers: ["1789", "1792", "1815", "1776"], correct: 0, category: "Histoire" },
  { question: "Qui était le roi de France pendant la Révolution ?", answers: ["Louis XIV", "Louis XV", "Louis XVI", "Napoléon"], correct: 2, category: "Histoire" },
  { question: "En quelle année la Tour Eiffel a-t-elle été construite ?", answers: ["1889", "1867", "1900", "1878"], correct: 0, category: "Histoire" },
  { question: "Qui a découvert l'Amérique en 1492 ?", answers: ["Magellan", "Christophe Colomb", "Vasco de Gama", "Marco Polo"], correct: 1, category: "Histoire" },
  { question: "Quel événement a eu lieu le 11 novembre 1918 ?", answers: ["Début de la guerre", "Armistice", "Traité de Versailles", "Révolution russe"], correct: 1, category: "Histoire" },
  // Géographie
  { question: "Quel est le plus long fleuve de France ?", answers: ["La Seine", "La Loire", "Le Rhône", "La Garonne"], correct: 1, category: "Géographie" },
  { question: "Quelle est la capitale de l'Espagne ?", answers: ["Barcelone", "Séville", "Madrid", "Valence"], correct: 2, category: "Géographie" },
  { question: "Quel est le plus haut sommet du monde ?", answers: ["Mont Blanc", "K2", "Kilimandjaro", "Everest"], correct: 3, category: "Géographie" },
  { question: "Combien d'océans y a-t-il sur Terre ?", answers: ["3", "4", "5", "6"], correct: 2, category: "Géographie" },
  { question: "Quelle est la capitale de l'Italie ?", answers: ["Milan", "Rome", "Florence", "Venise"], correct: 1, category: "Géographie" },
  // Culture
  { question: "Quel peintre a peint la Joconde ?", answers: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Botticelli"], correct: 1, category: "Culture" },
  { question: "Qui a écrit Les Misérables ?", answers: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Balzac"], correct: 1, category: "Culture" },
  { question: "Quel instrument a 88 touches ?", answers: ["Guitare", "Violon", "Piano", "Orgue"], correct: 2, category: "Culture" },
  { question: "Qui a peint 'Les Tournesols' ?", answers: ["Monet", "Van Gogh", "Renoir", "Cézanne"], correct: 1, category: "Culture" },
  // Sciences
  { question: "Quel est le symbole chimique de l'or ?", answers: ["Or", "Ag", "Au", "Fe"], correct: 2, category: "Sciences" },
  { question: "Combien de planètes compte notre système solaire ?", answers: ["7", "8", "9", "10"], correct: 1, category: "Sciences" },
  { question: "Quelle planète est surnommée la planète rouge ?", answers: ["Vénus", "Jupiter", "Mars", "Saturne"], correct: 2, category: "Sciences" },
  { question: "Combien d'os a le corps humain adulte ?", answers: ["106", "206", "306", "186"], correct: 1, category: "Sciences" },
  // Divertissement
  { question: "Quel personnage Disney vit dans une tour ?", answers: ["Cendrillon", "Raiponce", "Belle", "Ariel"], correct: 1, category: "Divertissement" },
  { question: "Quelle chanteuse a chanté 'La Vie en Rose' ?", answers: ["Dalida", "Édith Piaf", "Céline Dion", "Mireille Mathieu"], correct: 1, category: "Divertissement" },
];

const QUESTIONS_PER_PLAYER = 5;

type GamePhase = "setup" | "player1" | "player2" | "results";

export function QuizDuoGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState("Joueur 2");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [showPassScreen, setShowPassScreen] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (phase === "results" && !savedRef.current) {
      savedRef.current = true;
      saveGameSession();
    }
  }, [phase]);

  const saveGameSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "quiz_duo",
      score: (p1Score + p2Score) * 100,
      success: true,
      duration_seconds: duration,
    });
  };

  const startGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      toast.error("Entrez les deux prénoms !");
      return;
    }
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_PLAYER * 2);
    setQuestions(shuffled);
    setPhase("player1");
    setCurrentIndex(0);
    setP1Score(0);
    setP2Score(0);
    setStartTime(Date.now());
    savedRef.current = false;
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setShowResult(true);
    setAnswered(true);

    const isCorrect = index === questions[currentIndex].correct;
    if (isCorrect) {
      if (phase === "player1") setP1Score(s => s + 1);
      else setP2Score(s => s + 1);
      toast.success("Bonne réponse ! 🎉");
    } else {
      toast.error("Mauvaise réponse !");
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    if (phase === "player1" && nextIndex >= QUESTIONS_PER_PLAYER) {
      // Switch to player 2
      setShowPassScreen(true);
      return;
    }

    if (phase === "player2" && nextIndex >= QUESTIONS_PER_PLAYER * 2) {
      setPhase("results");
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswered(false);
  };

  const startPlayer2 = () => {
    setShowPassScreen(false);
    setPhase("player2");
    setCurrentIndex(QUESTIONS_PER_PLAYER);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswered(false);
  };

  const newGame = () => {
    setPhase("setup");
    setP1Score(0);
    setP2Score(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswered(false);
    setShowPassScreen(false);
    savedRef.current = false;
  };

  const getAnswerClass = (index: number) => {
    let base = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium ";
    if (!showResult) return base + "border-border bg-card hover:border-primary hover:bg-primary/5";
    const isCorrect = index === questions[currentIndex].correct;
    const isSelected = index === selectedAnswer;
    if (isCorrect) return base + "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (isSelected && !isCorrect) return base + "border-destructive bg-destructive/10 text-destructive";
    return base + "border-border bg-card opacity-50";
  };

  const currentPlayerName = phase === "player1" ? player1Name : player2Name;
  const currentQuestionNumber = phase === "player1" ? currentIndex + 1 : currentIndex - QUESTIONS_PER_PLAYER + 1;

  // Setup screen
  if (phase === "setup") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Quiz Duo</h1>
            <p className="text-sm text-muted-foreground">Défiez-vous en culture G !</p>
          </div>
          <Users className="w-6 h-6 text-primary" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Quiz en Duo</h2>
            <p className="text-muted-foreground">Chacun répond à {QUESTIONS_PER_PLAYER} questions. Qui aura le meilleur score ?</p>
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
              🎮 Lancer le Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pass device screen
  if (showPassScreen) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Quiz Duo</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Au tour de {player2Name} !
            </h2>
            <p className="text-muted-foreground mb-2">
              {player1Name} a terminé avec {p1Score}/{QUESTIONS_PER_PLAYER} bonnes réponses.
            </p>
            <p className="text-lg text-foreground font-medium">
              Passez l'appareil à {player2Name} !
            </p>
          </div>

          <Button size="lg" className="text-lg py-6 px-8" onClick={startPlayer2}>
            🎯 C'est parti, {player2Name} !
          </Button>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const winner = p1Score > p2Score ? player1Name : p2Score > p1Score ? player2Name : null;
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Quiz Duo - Résultats</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <Trophy className="w-16 h-16 text-primary" />

          <h2 className="text-2xl font-bold text-foreground text-center">
            {winner ? `${winner} gagne ! 🎉` : "Égalité ! 🤝"}
          </h2>

          <div className="w-full max-w-sm">
            <div className="bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-2xl p-6">
              <div className="flex justify-between items-center">
                <div className={`text-center flex-1 ${p1Score >= p2Score ? "opacity-100" : "opacity-60"}`}>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{p1Score}</p>
                  <p className="text-sm font-medium text-foreground">{player1Name}</p>
                  <p className="text-xs text-muted-foreground">/ {QUESTIONS_PER_PLAYER}</p>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">VS</div>
                <div className={`text-center flex-1 ${p2Score >= p1Score ? "opacity-100" : "opacity-60"}`}>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">{p2Score}</p>
                  <p className="text-sm font-medium text-foreground">{player2Name}</p>
                  <p className="text-xs text-muted-foreground">/ {QUESTIONS_PER_PLAYER}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button size="lg" onClick={startGame}>
              🔄 Revanche
            </Button>
            <Button size="lg" variant="outline" onClick={newGame}>
              Nouveaux joueurs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz play screen
  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Tour de {currentPlayerName}</h1>
          <p className="text-sm text-muted-foreground">Question {currentQuestionNumber}/{QUESTIONS_PER_PLAYER}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          phase === "player1" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
        }`}>
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary">{phase === "player1" ? p1Score : p2Score}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Progress */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              phase === "player1" ? "bg-blue-500" : "bg-red-500"
            }`}
            style={{ width: `${(currentQuestionNumber / QUESTIONS_PER_PLAYER) * 100}%` }}
          />
        </div>

        {/* Category */}
        <div className="flex justify-center">
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            {currentQuestion.category}
          </span>
        </div>

        {/* Question */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground text-center leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answers */}
        <div className="flex flex-col gap-3">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={getAnswerClass(index)}
              disabled={answered}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{answer}</span>
                {showResult && index === currentQuestion.correct && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {showResult && index === selectedAnswer && index !== currentQuestion.correct && (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Next */}
        {answered && (
          <Button size="lg" className="mt-4" onClick={handleNext}>
            {(phase === "player1" && currentQuestionNumber >= QUESTIONS_PER_PLAYER)
              ? `Passer à ${player2Name}`
              : (phase === "player2" && currentQuestionNumber >= QUESTIONS_PER_PLAYER)
              ? "Voir les résultats"
              : "Question suivante"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
