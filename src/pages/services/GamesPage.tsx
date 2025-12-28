import { ArrowLeft, Gamepad2, Brain, Trophy, Star, Play, ExternalLink, Puzzle, Grid3X3, Calculator, PenTool, Target, Sparkles, Zap } from "lucide-react";
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

  const internalGames = [
    { id: "memory", name: "Memory", description: "Retrouvez les paires", emoji: "🃏", difficulty: "Facile", path: "/services/games/memory" },
  ];

  const externalGames = [
    // Mots croisés & Lettres
    { id: "motsfleches", name: "Mots Fléchés", description: "20 Minutes", emoji: "✏️", url: "https://www.20minutes.fr/services/mots-fleches", category: "lettres" },
    { id: "motscroises", name: "Mots Croisés", description: "Le Monde", emoji: "📝", url: "https://www.lemonde.fr/jeux/mots-croises/", category: "lettres" },
    { id: "wordle-fr", name: "Sutom", description: "Wordle français", emoji: "🔤", url: "https://sutom.nocle.fr/", category: "lettres" },
    { id: "motus", name: "Motus", description: "Le jeu TV en ligne", emoji: "🎯", url: "https://www.tusmo.xyz/", category: "lettres" },
    
    // Chiffres & Logique
    { id: "sudoku", name: "Sudoku", description: "20 Minutes", emoji: "🔢", url: "https://www.20minutes.fr/services/sudoku", category: "logique" },
    { id: "sudoku-lemonde", name: "Sudoku", description: "Le Monde", emoji: "9️⃣", url: "https://www.lemonde.fr/jeux/sudoku/", category: "logique" },
    { id: "2048", name: "2048", description: "Jeu de chiffres addictif", emoji: "🧮", url: "https://play2048.co/", category: "logique" },
    { id: "freecell", name: "FreeCell", description: "Solitaire stratégique", emoji: "🃏", url: "https://www.solitaire-klondike.com/fr/freecell.html", category: "logique" },
    
    // Quiz & Culture
    { id: "quiz-geo", name: "Quiz Géographie", description: "Pays et capitales", emoji: "🌍", url: "https://www.jetpunk.com/user-quizzes/12389/pays-du-monde", category: "culture" },
    { id: "quiz-histoire", name: "Quiz Histoire", description: "Testez vos connaissances", emoji: "📜", url: "https://www.quizz.biz/quizz-820.html", category: "culture" },
    { id: "quiz-culture", name: "Culture Générale", description: "Quizz.biz", emoji: "🎓", url: "https://www.quizz.biz/quizz-1057.html", category: "culture" },
    { id: "trivia", name: "Questions pour un Champion", description: "Format TV", emoji: "🏆", url: "https://www.france.tv/france-3/questions-pour-un-champion/", category: "culture" },
    
    // Réflexion & Mémoire
    { id: "chess", name: "Échecs", description: "Chess.com", emoji: "♟️", url: "https://www.chess.com/fr/play/computer", category: "reflexion" },
    { id: "checkers", name: "Dames", description: "Jouez contre l'ordinateur", emoji: "🔴", url: "https://www.247checkers.com/", category: "reflexion" },
    { id: "mahjong", name: "Mahjong", description: "Jeu de tuiles classique", emoji: "🀄", url: "https://www.jeu-mahjong.com/", category: "reflexion" },
    { id: "solitaire", name: "Solitaire", description: "Le classique", emoji: "🂡", url: "https://www.solitaire-klondike.com/fr/", category: "reflexion" },
    
    // Casual & Détente
    { id: "tetris", name: "Tetris", description: "Le classique des classiques", emoji: "🧱", url: "https://tetris.com/play-tetris", category: "arcade" },
    { id: "pacman", name: "Pac-Man", description: "Classique arcade", emoji: "👻", url: "https://www.google.com/search?q=pacman", category: "arcade" },
    { id: "snake", name: "Snake", description: "Jeu du serpent", emoji: "🐍", url: "https://www.google.com/search?q=snake+game", category: "arcade" },
    { id: "bubble", name: "Bubble Shooter", description: "Éclater des bulles", emoji: "🫧", url: "https://www.bubbleshooter.net/", category: "arcade" },
  ];

  const categories = [
    { id: "lettres", name: "Mots & Lettres", emoji: "📝", icon: PenTool },
    { id: "logique", name: "Logique & Chiffres", emoji: "🧮", icon: Calculator },
    { id: "culture", name: "Culture & Quiz", emoji: "🎓", icon: Brain },
    { id: "reflexion", name: "Réflexion", emoji: "♟️", icon: Target },
    { id: "arcade", name: "Arcade & Détente", emoji: "🕹️", icon: Gamepad2 },
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

  const handleExternalGame = (url: string) => {
    window.open(url, '_blank');
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
              Jouez au Memory pour enregistrer vos statistiques !
            </p>
          </div>
        )}

        {/* Oscar Games */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Jeux Oscar
          </h2>
          {internalGames.map((game) => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="w-full bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 shadow-sm border border-primary/20 flex items-center gap-4 text-left transition-all hover:shadow-md hover:border-primary"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">
                {game.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                  {game.difficulty}
                </span>
                <Play className="w-5 h-5 text-primary" />
              </div>
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Explorer par catégorie
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card rounded-xl p-2 shadow-sm border border-border flex flex-col items-center gap-1"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[9px] text-muted-foreground text-center font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Games by Category */}
        {categories.map((category) => {
          const categoryGames = externalGames.filter(g => g.category === category.id);
          return (
            <div key={category.id} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <category.icon className="w-4 h-4" />
                {category.name}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {categoryGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleExternalGame(game.url)}
                    className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3 hover:border-primary transition-colors text-left"
                  >
                    <span className="text-2xl">{game.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{game.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{game.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Tips */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-foreground font-medium mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Conseil du jour
          </p>
          <p className="text-sm text-muted-foreground">
            Jouer régulièrement aide à maintenir votre mémoire et votre agilité mentale. Essayez un nouveau jeu chaque semaine !
          </p>
        </div>
      </div>
    </div>
  );
}
