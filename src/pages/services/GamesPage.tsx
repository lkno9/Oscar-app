import { ArrowLeft, Gamepad2, Brain, Trophy, Star, Sparkles, Zap, Users, Heart, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface GameStats {
  totalGames: number;
  successRate: number;
  streak: number;
  totalPoints: number;
}

export function GamesPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    successRate: 0,
    streak: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);

  const internalGames = [
    { id: "memory", name: "Memory", description: "Retrouvez les paires", emoji: "🃏", difficulty: "Facile", path: "/services/games/memory" },
    { id: "sudoku", name: "Sudoku", description: "Grilles de chiffres", emoji: "🔢", difficulty: "Moyen", path: "/services/games/sudoku" },
    { id: "quiz", name: "Quiz Culture", description: "10 questions variées", emoji: "🎓", difficulty: "Facile", path: "/services/games/quiz" },
    { id: "2048", name: "2048", description: "Fusionnez les tuiles", emoji: "🧮", difficulty: "Moyen", path: "/services/games/2048" },
    { id: "hangman", name: "Le Pendu", description: "Devinez le mot caché", emoji: "🔤", difficulty: "Facile", path: "/services/games/hangman" },
    { id: "math", name: "Calcul Mental", description: "15 calculs en 90s", emoji: "🧠", difficulty: "Moyen", path: "/services/games/math" },
    { id: "intruder", name: "L'Intrus", description: "Trouvez le mot en trop", emoji: "🔍", difficulty: "Facile", path: "/services/games/intruder" },
    { id: "tictactoe", name: "Morpion", description: "Jouez contre Oscar", emoji: "❌", difficulty: "Facile", path: "/services/games/tictactoe" },
    { id: "colors", name: "Couleurs", description: "Test de rapidité visuelle", emoji: "🎨", difficulty: "Moyen", path: "/services/games/colors" },
    { id: "sequence", name: "La Suite", description: "Trouvez le nombre suivant", emoji: "🔢", difficulty: "Moyen", path: "/services/games/sequence" },
    { id: "wordsearch", name: "Mots Mêlés", description: "Trouvez les mots cachés", emoji: "📝", difficulty: "Facile", path: "/services/games/wordsearch" },
    { id: "candy", name: "Candy Crush", description: "Alignez les bonbons", emoji: "🍬", difficulty: "Facile", path: "/services/games/candy", isNew: true },
  ];

  const multiplayerGames = [
    { id: "tictactoe-duo", name: "Morpion Duo", description: "Jouez à 2 joueurs", emoji: "🤝", difficulty: "Facile", path: "/services/games/tictactoe-duo", mode: "local" },
    { id: "quiz-duo", name: "Quiz Duo", description: "Défi culture générale", emoji: "🧠", difficulty: "Facile", path: "/services/games/quiz-duo", mode: "local" },
    { id: "memory-duo", name: "Memory Duo", description: "Trouvez les paires à 2", emoji: "🃏", difficulty: "Facile", path: "/services/games/memory-duo", mode: "local" },
    { id: "word-duel", name: "Bataille de Mots", description: "Duel de vocabulaire", emoji: "📝", difficulty: "Moyen", path: "/services/games/word-duel", mode: "local" },
  ];

  const onlineGames = [
    { id: "tictactoe-online", name: "Morpion", description: "Jouez à distance", emoji: "❌", difficulty: "Facile", path: "/services/games/tictactoe-online" },
    { id: "quiz-online", name: "Quiz", description: "Défi culture à distance", emoji: "🧠", difficulty: "Facile", path: "/services/games/quiz-online" },
    { id: "memory-online", name: "Memory", description: "Trouvez les paires à distance", emoji: "🃏", difficulty: "Facile", path: "/services/games/memory-online" },
    { id: "word-duel-online", name: "Bataille de Mots", description: "Duel de vocabulaire à distance", emoji: "📝", difficulty: "Moyen", path: "/services/games/word-duel-online" },
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
          onClick={goBack}
          aria-label="Retour"
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Jeux & mémoire</h1>
          <p className="text-sm text-muted-foreground">Stimulez votre esprit</p>
        </div>
        <Gamepad2 className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
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
              <p className="text-sm opacity-80">Jours d'affilée</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalGames}</p>
              <p className="text-sm opacity-80">Parties jouées</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
              <p className="text-sm opacity-80">Réussite</p>
            </div>
          </div>
        </div>

        {stats.totalGames === 0 && !loading && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">🎮 Prêt à jouer ?</p>
            <p className="text-sm text-muted-foreground">
              Essayez nos jeux Oscar pour commencer à cumuler des points !
            </p>
          </div>
        )}

        {/* Jeux à plusieurs - Section mise en avant */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4" />
              Jouer ensemble
            </h2>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
              NOUVEAU
            </span>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Jouez avec vos proches sur le même appareil !
          </p>
          <div className="grid grid-cols-2 gap-3">
            {multiplayerGames.map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(game.path)}
                className="bg-gradient-to-br from-orange-500/15 to-rose-500/10 rounded-xl p-4 shadow-sm border border-orange-300/30 dark:border-orange-700/30 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md hover:border-orange-400 dark:hover:border-orange-600 relative"
              >
                <div className="absolute top-2 right-2">
                  <Heart className="w-4 h-4 text-orange-400 fill-orange-400" />
                </div>
                <span className="text-4xl">{game.emoji}</span>
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
                <div className="flex gap-1.5">
                  <span className="text-xs bg-orange-200/60 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                    2 joueurs
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {game.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Jeux en ligne - à distance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Jouer à distance
            </h2>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
              NOUVEAU
            </span>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Jouez en ligne avec vos proches, chacun sur son appareil !
          </p>
          <div className="grid grid-cols-2 gap-3">
            {onlineGames.map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(game.path)}
                className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 rounded-xl p-4 shadow-sm border border-green-300/30 dark:border-green-700/30 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md hover:border-green-400 dark:hover:border-green-600 relative"
              >
                <div className="absolute top-2 right-2">
                  <Wifi className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-4xl">{game.emoji}</span>
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
                <div className="flex gap-1.5">
                  <span className="text-xs bg-green-200/60 dark:bg-green-800/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    En ligne
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {game.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Jeux Oscar solo */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Jeux Solo
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {internalGames.map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(game.path)}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 shadow-sm border border-primary/20 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md hover:border-primary relative"
              >
                {"isNew" in game && game.isNew && (
                  <span className="absolute top-2 right-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                    NEW
                  </span>
                )}
                <span className="text-4xl">{game.emoji}</span>
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
                <span className="text-sm bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {game.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-foreground font-medium mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Conseil du jour
          </p>
          <p className="text-sm text-muted-foreground">
            Invitez vos proches à jouer avec vous ! Les jeux à plusieurs sont parfaits pour partager un moment ensemble.
          </p>
        </div>
      </div>
    </div>
  );
}
