import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { securityQuizQuestions } from "./ScamAlertsData";
import { GraduationCap, CheckCircle, XCircle, RotateCcw, Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type QuizState = 'intro' | 'playing' | 'result';

export function SecurityQuiz() {
  const [state, setState] = useState<QuizState>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const { user } = useAuth();

  const questions = securityQuizQuestions;
  const totalQuestions = questions.length;

  const startQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setState('playing');
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(optionIndex);
    setShowExplanation(true);
    
    if (questions[currentQuestion].options[optionIndex].isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setState('result');
      
      // Save score to database
      if (user) {
        await supabase.from('security_quiz_scores').insert({
          user_id: user.id,
          score: score + (questions[currentQuestion].options[selectedAnswer!]?.isCorrect ? 1 : 0),
          total_questions: totalQuestions
        });
      }
    }
  };

  const getResultBadge = () => {
    const finalScore = score;
    const percentage = (finalScore / totalQuestions) * 100;
    
    if (percentage >= 80) {
      return { icon: Trophy, label: "Expert Anti-Arnaque", color: "text-yellow-500", message: "Excellent ! Vous avez d'excellents réflexes face aux arnaques." };
    } else if (percentage >= 60) {
      return { icon: Medal, label: "Vigilant", color: "text-blue-500", message: "Bien ! Vous connaissez les bases, mais restez vigilant." };
    } else {
      return { icon: Award, label: "Apprenti", color: "text-muted-foreground", message: "Continuez à apprendre ! Relisez les conseils de sécurité." };
    }
  };

  // INTRO STATE
  if (state === 'intro') {
    return (
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Quiz Sécurité</CardTitle>
          <p className="text-muted-foreground text-sm">
            Testez vos réflexes anti-arnaque en 5 questions
          </p>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <Button onClick={startQuiz} size="lg" className="text-lg px-8 py-6">
            Commencer le quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // RESULT STATE
  if (state === 'result') {
    const badge = getResultBadge();
    const BadgeIcon = badge.icon;
    
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <BadgeIcon className={cn("w-10 h-10", badge.color)} />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-1">{badge.label}</h3>
            <p className="text-4xl font-bold text-primary">
              {score}/{totalQuestions}
            </p>
          </div>
          
          <p className="text-muted-foreground">
            {badge.message}
          </p>
          
          <Button onClick={startQuiz} variant="outline" className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refaire le quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // PLAYING STATE
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1}/{totalQuestions}
          </span>
          <span className="text-sm font-medium">
            Score: {score}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = option.isCorrect;
            
            let buttonClass = "w-full text-left p-4 h-auto justify-start";
            
            if (showExplanation) {
              if (isCorrect) {
                buttonClass += " border-green-500 bg-green-50 dark:bg-green-950/30";
              } else if (isSelected && !isCorrect) {
                buttonClass += " border-red-500 bg-red-50 dark:bg-red-950/30";
              }
            }

            return (
              <Button
                key={index}
                variant="outline"
                className={buttonClass}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-start gap-3 w-full">
                  {showExplanation && (
                    isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : isSelected ? (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5" />
                    )
                  )}
                  <span className="text-base leading-relaxed">{option.text}</span>
                </div>
              </Button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="bg-muted p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm leading-relaxed">
              💡 {question.options[selectedAnswer!].explanation}
            </p>
            <Button 
              onClick={nextQuestion} 
              className="mt-4 w-full"
            >
              {currentQuestion < totalQuestions - 1 ? "Question suivante" : "Voir mon score"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
