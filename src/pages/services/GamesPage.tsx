import { ArrowLeft, Gamepad2, Brain, Trophy, Star, Play, ExternalLink, Grid3X3, Calculator, PenTool, Target, Sparkles, Zap } from "lucide-react";
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
  ];

  // Liens directs vers des jeux jouables immédiatement
  const externalGames = [
    // Mots & Lettres - Liens directs vers les jeux
    { id: "sutom", name: "SUTOM", description: "Wordle français quotidien", emoji: "🔤", url: "https://sutom.nocle.fr/", category: "lettres" },
    { id: "tusmo", name: "TUSMO", description: "Motus en ligne", emoji: "🎯", url: "https://www.tusmo.xyz/", category: "lettres" },
    { id: "cemantix", name: "Cémantix", description: "Trouvez le mot secret", emoji: "🧠", url: "https://cemantix.certitudes.org/", category: "lettres" },
    { id: "pedantix", name: "Pédantix", description: "Devinez l'article Wikipédia", emoji: "📚", url: "https://pedantix.certitudes.org/", category: "lettres" },
    
    // Logique - Liens directs vers interfaces de jeu
    { id: "sudoku-web", name: "Sudoku Web", description: "Grilles illimitées", emoji: "9️⃣", url: "https://sudoku.com/fr", category: "logique" },
    { id: "chess-play", name: "Échecs", description: "Jouer contre l'IA", emoji: "♟️", url: "https://www.chess.com/fr/play/computer", category: "logique" },
    { id: "checkers-web", name: "Dames", description: "Jouez maintenant", emoji: "🔴", url: "https://cardgames.io/checkers/", category: "logique" },
    { id: "nonogram", name: "Nonogram", description: "Picross / Hanjie", emoji: "🎨", url: "https://www.puzzle-nonograms.com/", category: "logique" },
    
    // Quiz & Culture - Liens vers quiz jouables
    { id: "geo-quiz", name: "Quiz Géo", description: "Pays du monde", emoji: "🌍", url: "https://www.jetpunk.com/user-quizzes/12389/pays-du-monde", category: "culture" },
    { id: "flags-quiz", name: "Drapeaux", description: "Reconnaître les drapeaux", emoji: "🏁", url: "https://www.jetpunk.com/quizzes/drapeaux-du-monde-quiz", category: "culture" },
    { id: "quizz-culture", name: "Culture G", description: "Quiz variés", emoji: "📖", url: "https://www.quizz.biz/annuaire/quiz-Culture-generale.html", category: "culture" },
    { id: "blind-test", name: "Blind Test", description: "Devinez la musique", emoji: "🎵", url: "https://www.blindtestmaker.com/", category: "culture" },
    
    // Arcade & Classiques - Liens directs vers jeux
    { id: "tetris-play", name: "Tetris", description: "Le classique", emoji: "🧱", url: "https://tetris.com/play-tetris", category: "arcade" },
    { id: "pacman-google", name: "Pac-Man", description: "Version Google", emoji: "👻", url: "https://www.google.com/logos/2010/pacman10-i.html", category: "arcade" },
    { id: "snake-google", name: "Snake", description: "Serpent classique", emoji: "🐍", url: "https://www.google.com/fbx?fbx=snake_arcade", category: "arcade" },
    { id: "bubble-shooter", name: "Bubble Shooter", description: "Éclater des bulles", emoji: "🫧", url: "https://bubble-shooter.co/", category: "arcade" },
    
    // Réflexion - Jeux de réflexion
    { id: "mahjong-play", name: "Mahjong", description: "Tuiles chinoises", emoji: "🀄", url: "https://www.mahjong.com/", category: "reflexion" },
    { id: "solitaire-play", name: "Solitaire", description: "Cartes classique", emoji: "🂡", url: "https://www.solitr.com/", category: "reflexion" },
    { id: "freecell-play", name: "FreeCell", description: "Solitaire stratégique", emoji: "🃏", url: "https://www.free-freecell-solitaire.com/", category: "reflexion" },
    { id: "minesweeper", name: "Démineur", description: "Évitez les mines", emoji: "💣", url: "https://minesweeper.online/", category: "reflexion" },
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
          onClick={goBack}
          aria-label="Retour"
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
              Essayez nos jeux Oscar pour commencer à cumuler des points !
            </p>
          </div>
        )}

        {/* Oscar Games - Internal */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Jeux Oscar (avec statistiques)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {internalGames.map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(game.path)}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 shadow-sm border border-primary/20 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md hover:border-primary"
              >
                <span className="text-4xl">{game.emoji}</span>
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-xs text-muted-foreground">{game.description}</p>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {game.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Catégories
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card rounded-xl p-2 shadow-sm border border-border flex flex-col items-center gap-1"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs text-muted-foreground text-center font-medium">{cat.name}</span>
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
            Les jeux Oscar enregistrent vos scores et progressions. Les jeux externes s'ouvrent directement pour jouer !
          </p>
        </div>
      </div>
    </div>
  );
}
