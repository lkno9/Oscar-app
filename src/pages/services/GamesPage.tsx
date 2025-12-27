import { ArrowLeft, Gamepad2, Brain, Puzzle, Trophy, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function GamesPage() {
  const navigate = useNavigate();

  const games = [
    { id: 1, name: "Mots croisés", description: "Enrichissez votre vocabulaire", emoji: "✏️", difficulty: "Facile" },
    { id: 2, name: "Sudoku", description: "Exercez votre logique", emoji: "🔢", difficulty: "Moyen" },
    { id: 3, name: "Memory", description: "Entraînez votre mémoire", emoji: "🃏", difficulty: "Facile" },
    { id: 4, name: "Quiz culture", description: "Testez vos connaissances", emoji: "❓", difficulty: "Variable" },
  ];

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
              <span className="font-bold">1,250</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">15</p>
              <p className="text-xs opacity-80">Jours d'affilée</p>
            </div>
            <div>
              <p className="text-2xl font-bold">42</p>
              <p className="text-xs opacity-80">Parties jouées</p>
            </div>
            <div>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-xs opacity-80">Réussite</p>
            </div>
          </div>
        </div>

        {/* Games */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Jeux disponibles
          </h2>
          {games.map((game) => (
            <button
              key={game.id}
              className="w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-colors text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                {game.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </div>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                {game.difficulty}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
