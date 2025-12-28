import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  category: string;
}

const questions: Question[] = [
  // Histoire
  { question: "En quelle année la Révolution française a-t-elle commencé ?", answers: ["1789", "1792", "1815", "1776"], correct: 0, category: "Histoire" },
  { question: "Qui était le roi de France pendant la Révolution ?", answers: ["Louis XIV", "Louis XV", "Louis XVI", "Napoléon"], correct: 2, category: "Histoire" },
  { question: "Quelle ville a été la première capitale de la France ?", answers: ["Paris", "Lyon", "Tournai", "Reims"], correct: 2, category: "Histoire" },
  { question: "En quelle année la Tour Eiffel a-t-elle été construite ?", answers: ["1889", "1867", "1900", "1878"], correct: 0, category: "Histoire" },
  
  // Géographie
  { question: "Quel est le plus long fleuve de France ?", answers: ["La Seine", "La Loire", "Le Rhône", "La Garonne"], correct: 1, category: "Géographie" },
  { question: "Quelle est la capitale de l'Espagne ?", answers: ["Barcelone", "Séville", "Madrid", "Valence"], correct: 2, category: "Géographie" },
  { question: "Combien de régions compte la France métropolitaine ?", answers: ["13", "18", "22", "15"], correct: 0, category: "Géographie" },
  { question: "Quel pays n'est pas frontalier de la France ?", answers: ["Belgique", "Autriche", "Suisse", "Espagne"], correct: 1, category: "Géographie" },
  
  // Culture générale
  { question: "Quel peintre a peint la Joconde ?", answers: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Botticelli"], correct: 1, category: "Culture" },
  { question: "Qui a écrit Les Misérables ?", answers: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Balzac"], correct: 1, category: "Culture" },
  { question: "Quel est le symbole chimique de l'or ?", answers: ["Or", "Ag", "Au", "Fe"], correct: 2, category: "Sciences" },
  { question: "Combien de planètes compte notre système solaire ?", answers: ["7", "8", "9", "10"], correct: 1, category: "Sciences" },
  
  // Divertissement
  { question: "Quel personnage Disney vit dans une tour ?", answers: ["Cendrillon", "Raiponce", "Belle", "Ariel"], correct: 1, category: "Divertissement" },
  { question: "Qui interprète James Bond dans Casino Royale (2006) ?", answers: ["Pierce Brosnan", "Daniel Craig", "Sean Connery", "Roger Moore"], correct: 1, category: "Divertissement" },
  { question: "Quelle chanteuse française a chanté 'La Vie en Rose' ?", answers: ["Dalida", "Édith Piaf", "Céline Dion", "Mireille Mathieu"], correct: 1, category: "Musique" },
];

export function QuizGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [answered, setAnswered] = useState(false);

  const TOTAL_QUESTIONS = 10;

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setShuffledQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsComplete(false);
    setAnswered(false);
    setStartTime(new Date());
  };

  const handleAnswerSelect = (index: number) => {
    if (answered) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    setAnswered(true);
    
    if (index === shuffledQuestions[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
      toast.success("Bonne réponse ! 🎉");
    } else {
      toast.error("Mauvaise réponse !");
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 >= shuffledQuestions.length) {
      setIsComplete(true);
      const duration = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
      const finalScore = score * 100;
      saveGameSession(score >= TOTAL_QUESTIONS / 2, finalScore, duration);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswered(false);
    }
  };

  const saveGameSession = async (success: boolean, scoreValue: number, duration: number) => {
    if (!user) return;
    
    await supabase.from('game_sessions').insert({
      user_id: user.id,
      game_type: 'quiz',
      score: scoreValue,
      success,
      duration_seconds: duration
    });
  };

  const getAnswerClass = (index: number) => {
    let base = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium ";
    
    if (!showResult) {
      return base + "border-border bg-card hover:border-primary hover:bg-primary/5 ";
    }
    
    const isCorrect = index === shuffledQuestions[currentQuestionIndex].correct;
    const isSelected = index === selectedAnswer;
    
    if (isCorrect) {
      return base + "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ";
    }
    if (isSelected && !isCorrect) {
      return base + "border-destructive bg-destructive/10 text-destructive ";
    }
    return base + "border-border bg-card opacity-50 ";
  };

  if (shuffledQuestions.length === 0) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + (answered ? 1 : 0)) / TOTAL_QUESTIONS) * 100;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Quiz Culture</h1>
          <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary">{score}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isComplete ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground w-full max-w-sm">
              <Trophy className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
              <p className="text-4xl font-bold mb-2">{score}/{TOTAL_QUESTIONS}</p>
              <p className="opacity-90">
                {score >= 8 ? "Excellent ! 🌟" : score >= 5 ? "Bien joué ! 👏" : "Continuez à vous entraîner ! 💪"}
              </p>
            </div>
            <Button size="lg" onClick={initGame}>
              Rejouer
            </Button>
          </div>
        ) : (
          <>
            {/* Category Badge */}
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
                  onClick={() => handleAnswerSelect(index)}
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

            {/* Next Button */}
            {answered && (
              <Button size="lg" className="mt-4" onClick={handleNext}>
                {currentQuestionIndex + 1 >= TOTAL_QUESTIONS ? "Voir les résultats" : "Question suivante"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
