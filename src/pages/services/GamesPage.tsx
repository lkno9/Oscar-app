import { ArrowLeft, Gamepad2, Brain, Trophy, Star, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface GameStats {
  totalGames: number;
  successRate: number;
  streak: number;
  totalPoints: number;
}

export function GamesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    successRate: 0,
    streak: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);

  const games = [
    { id: "memory", name: "Memory", description: "Entraînez votre mémoire", emoji: "🃏", difficulty: "Facile", path: "/services/games/memory" },
    { id: "mots-croises", name: "Mots croisés", description: "Enrichissez votre vocabulaire", emoji: "✏️", difficulty: "Facile", path: null },
    { id: "sudoku", name: "Sudoku", description: "Exercez votre logique", emoji: "🔢", difficulty: "Moyen", path: null },
    { id: "quiz", name: "Quiz culture", description: "Testez vos connaissances", emoji: "❓", difficulty: "Variable", path: null },
  ];

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .order('played_at', { ascending: false });

    if (sessions && sessions.length > 0) {
      const totalGames = sessions.length;
      const successCount = sessions.filter(s => s.success).length;
      const successRate = Math.round((successCount / totalGames) * 100);
      const totalPoints = sessions.reduce((acc, s) => acc + (s.score || 0), 0);

      // Calculate streak (consecutive days with at least one game)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasGameOnDate = sessions.some(s => 
          s.played_at.split('T')[0] === dateStr
        );

        if (hasGameOnDate) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setStats({ totalGames, successRate, streak, totalPoints });
    }
    setLoading(false);
  };

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
          <h1 className="text-lg font-bold text-foreground">Jeux & mémoire</h1>
          <p className="text-sm text-muted-foreground">Stimulez votre esprit</p>
        </div>
        <Gamepad2 className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              <span className="font-bold">Vos statistiques</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold">{stats.totalPoints.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.streak}</p>
              <p className="text-xs opacity-80">Jours d'affilée</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalGames}</p>
              <p className="text-xs opacity-80">Parties jouées</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
              <p className="text-xs opacity-80">Réussite</p>
            </div>
          </div>
        </div>

        {stats.totalGames === 0 && !loading && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">🎮 Prêt à jouer ?</p>
            <p className="text-sm text-muted-foreground">
              Commencez une partie pour voir vos statistiques ici !
            </p>
          </div>
        )}

        {/* Games */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Jeux disponibles
          </h2>
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => game.path && navigate(game.path)}
              disabled={!game.path}
              className={`w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 text-left transition-colors ${
                game.path 
                  ? 'hover:border-primary cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                {game.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                  {game.difficulty}
                </span>
                {game.path ? (
                  <Play className="w-5 h-5 text-primary" />
                ) : (
                  <span className="text-xs text-muted-foreground">Bientôt</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
