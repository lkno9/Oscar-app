import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// --- Types ---
interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_grace_used: boolean;
  total_active_days: number;
}

interface ProgressData {
  total_stars: number;
  level: string;
  quizzes_completed: number;
  articles_read: number;
  oscar_conversations: number;
  achievements: string[];
}

interface QuizRecord {
  quiz_date: string;
  score: number;
  total_questions: number;
}

// --- Niveaux de sagesse ---
const LEVELS = [
  { name: "explorateur", label: "Explorateur", minDays: 0, emoji: "🌱" },
  { name: "curieux", label: "Curieux", minDays: 7, emoji: "🔍" },
  { name: "fidele", label: "Fidèle", minDays: 30, emoji: "⭐" },
  { name: "sage", label: "Sage", minDays: 90, emoji: "🦉" },
  { name: "mentor", label: "Mentor", minDays: 180, emoji: "👑" },
];

export function getLevelInfo(levelName: string) {
  return LEVELS.find((l) => l.name === levelName) || LEVELS[0];
}

export function getNextLevel(levelName: string) {
  const idx = LEVELS.findIndex((l) => l.name === levelName);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getAllLevels() {
  return LEVELS;
}

// --- Jalons de streak ---
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

export function getNextMilestone(currentStreak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > currentStreak) || null;
}

// --- Hook principal ---
export function useEngagement() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    streak_grace_used: false,
    total_active_days: 0,
  });
  const [progress, setProgress] = useState<ProgressData>({
    total_stars: 0,
    level: "explorateur",
    quizzes_completed: 0,
    articles_read: 0,
    oscar_conversations: 0,
    achievements: [],
  });
  const [todayQuiz, setTodayQuiz] = useState<QuizRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakJustIncreased, setStreakJustIncreased] = useState(false);

  // Charger les données
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Charger streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakData) {
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          last_active_date: streakData.last_active_date,
          streak_grace_used: streakData.streak_grace_used,
          total_active_days: streakData.total_active_days,
        });
      }

      // Charger progression
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (progressData) {
        setProgress({
          total_stars: progressData.total_stars,
          level: progressData.level,
          quizzes_completed: progressData.quizzes_completed,
          articles_read: progressData.articles_read,
          oscar_conversations: progressData.oscar_conversations,
          achievements: progressData.achievements || [],
        });
      }

      // Quiz du jour
      const today = new Date().toISOString().split("T")[0];
      const { data: quizData } = await supabase
        .from("quiz_history")
        .select("quiz_date, score, total_questions")
        .eq("user_id", user.id)
        .eq("quiz_date", today)
        .maybeSingle();

      if (quizData) {
        setTodayQuiz(quizData as QuizRecord);
      }
    } catch {
      // Tables pas encore créées — on reste sur les defaults
    }
    setLoading(false);
  };

  // Enregistrer l'activité du jour (met à jour le streak)
  const recordActivity = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // Déjà actif aujourd'hui ?
    if (streak.last_active_date === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const dayBefore = new Date(Date.now() - 172800000).toISOString().split("T")[0];

    let newStreak = streak.current_streak;
    let graceUsed = streak.streak_grace_used;

    if (streak.last_active_date === yesterday) {
      // Jour consécutif — streak continue
      newStreak += 1;
      graceUsed = false;
    } else if (streak.last_active_date === dayBefore && !streak.streak_grace_used) {
      // 1 jour de grâce (pas actif hier mais avant-hier) — streak protégé
      newStreak += 1;
      graceUsed = true;
    } else if (streak.last_active_date && streak.last_active_date !== today) {
      // Streak cassé — on recommence
      newStreak = 1;
      graceUsed = false;
    } else {
      // Premier jour
      newStreak = 1;
    }

    const newLongest = Math.max(streak.longest_streak, newStreak);
    const newTotalDays = streak.total_active_days + 1;

    // Calculer le niveau
    const newLevel = calculateLevel(newTotalDays);

    try {
      // Upsert streak
      await supabase.from("user_streaks").upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        streak_grace_used: graceUsed,
        total_active_days: newTotalDays,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      // Upsert progress avec nouveau niveau
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        level: newLevel,
        total_stars: progress.total_stars,
        quizzes_completed: progress.quizzes_completed,
        articles_read: progress.articles_read,
        oscar_conversations: progress.oscar_conversations,
        achievements: progress.achievements,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      setStreak({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        streak_grace_used: graceUsed,
        total_active_days: newTotalDays,
      });
      setProgress((prev) => ({ ...prev, level: newLevel }));
      setStreakJustIncreased(true);
      setTimeout(() => setStreakJustIncreased(false), 3000);
    } catch {
      // Supabase indisponible — on met à jour localement
      setStreak({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        streak_grace_used: graceUsed,
        total_active_days: newTotalDays,
      });
    }
  }, [user, streak, progress]);

  // Enregistrer un quiz complété
  const recordQuiz = useCallback(async (score: number, totalQuestions: number) => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const starsEarned = score; // 1 étoile par bonne réponse

    try {
      await supabase.from("quiz_history").upsert({
        user_id: user.id,
        quiz_date: today,
        score,
        total_questions: totalQuestions,
      }, { onConflict: "user_id,quiz_date" });

      const newStars = progress.total_stars + starsEarned;
      const newQuizzes = progress.quizzes_completed + 1;

      await supabase.from("user_progress").upsert({
        user_id: user.id,
        total_stars: newStars,
        quizzes_completed: newQuizzes,
        level: progress.level,
        articles_read: progress.articles_read,
        oscar_conversations: progress.oscar_conversations,
        achievements: progress.achievements,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      setProgress((prev) => ({
        ...prev,
        total_stars: newStars,
        quizzes_completed: newQuizzes,
      }));
      setTodayQuiz({ quiz_date: today, score, total_questions: totalQuestions });
    } catch {
      // Fallback local
      setProgress((prev) => ({
        ...prev,
        total_stars: prev.total_stars + starsEarned,
        quizzes_completed: prev.quizzes_completed + 1,
      }));
      setTodayQuiz({ quiz_date: today, score, total_questions: totalQuestions });
    }

    // Aussi enregistrer l'activité du jour
    await recordActivity();
  }, [user, progress, recordActivity]);

  return {
    streak,
    progress,
    todayQuiz,
    loading,
    streakJustIncreased,
    recordActivity,
    recordQuiz,
    getLevelInfo: () => getLevelInfo(progress.level),
    getNextLevel: () => getNextLevel(progress.level),
    getNextMilestone: () => getNextMilestone(streak.current_streak),
  };
}

function calculateLevel(totalDays: number): string {
  if (totalDays >= 180) return "mentor";
  if (totalDays >= 90) return "sage";
  if (totalDays >= 30) return "fidele";
  if (totalDays >= 7) return "curieux";
  return "explorateur";
}
