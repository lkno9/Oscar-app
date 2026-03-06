import { ArrowLeft, RotateCcw, Trophy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Puzzle {
  category: string;
  items: string[];
  intruder: string;
  explanation: string;
}

const PUZZLES: Puzzle[] = [
  { category: "Fruits", items: ["Pomme", "Banane", "Carotte", "Fraise"], intruder: "Carotte", explanation: "La carotte est un légume, pas un fruit." },
  { category: "Animaux domestiques", items: ["Chat", "Chien", "Lion", "Lapin"], intruder: "Lion", explanation: "Le lion est un animal sauvage." },
  { category: "Couleurs chaudes", items: ["Rouge", "Orange", "Bleu", "Jaune"], intruder: "Bleu", explanation: "Le bleu est une couleur froide." },
  { category: "Jours de la semaine", items: ["Lundi", "Mars", "Mercredi", "Vendredi"], intruder: "Mars", explanation: "Mars est un mois, pas un jour." },
  { category: "Instruments à cordes", items: ["Guitare", "Violon", "Trompette", "Harpe"], intruder: "Trompette", explanation: "La trompette est un instrument à vent." },
  { category: "Planètes", items: ["Mars", "Vénus", "Lune", "Jupiter"], intruder: "Lune", explanation: "La Lune est un satellite, pas une planète." },
  { category: "Boissons chaudes", items: ["Thé", "Café", "Limonade", "Chocolat chaud"], intruder: "Limonade", explanation: "La limonade est une boisson froide." },
  { category: "Fleurs", items: ["Rose", "Tulipe", "Sapin", "Marguerite"], intruder: "Sapin", explanation: "Le sapin est un arbre, pas une fleur." },
  { category: "Vêtements d'hiver", items: ["Écharpe", "Bonnet", "Maillot de bain", "Gants"], intruder: "Maillot de bain", explanation: "Le maillot de bain est pour l'été." },
  { category: "Moyens de transport terrestres", items: ["Voiture", "Train", "Avion", "Vélo"], intruder: "Avion", explanation: "L'avion est un transport aérien." },
  { category: "Légumes verts", items: ["Épinard", "Brocoli", "Tomate", "Haricot vert"], intruder: "Tomate", explanation: "La tomate est rouge, pas verte." },
  { category: "Sports d'équipe", items: ["Football", "Tennis", "Basketball", "Rugby"], intruder: "Tennis", explanation: "Le tennis est un sport individuel." },
  { category: "Desserts", items: ["Tarte", "Gâteau", "Soupe", "Crème brûlée"], intruder: "Soupe", explanation: "La soupe est un plat salé, pas un dessert." },
  { category: "Pays européens", items: ["France", "Espagne", "Japon", "Italie"], intruder: "Japon", explanation: "Le Japon est en Asie, pas en Europe." },
  { category: "Oiseaux", items: ["Moineau", "Aigle", "Dauphin", "Perroquet"], intruder: "Dauphin", explanation: "Le dauphin est un mammifère marin." },
  { category: "Pièces de la maison", items: ["Cuisine", "Salon", "Garage", "Forêt"], intruder: "Forêt", explanation: "La forêt n'est pas une pièce de la maison." },
  { category: "Saisons", items: ["Printemps", "Automne", "Janvier", "Été"], intruder: "Janvier", explanation: "Janvier est un mois, pas une saison." },
  { category: "Nombres pairs", items: ["2", "4", "7", "8"], intruder: "7", explanation: "7 est un nombre impair." },
  { category: "Métiers de santé", items: ["Médecin", "Infirmier", "Boulanger", "Pharmacien"], intruder: "Boulanger", explanation: "Le boulanger ne travaille pas dans la santé." },
  { category: "Fromages français", items: ["Camembert", "Brie", "Mozzarella", "Roquefort"], intruder: "Mozzarella", explanation: "La mozzarella est un fromage italien." },
];

const ROUNDS_PER_GAME = 10;

export function WordSearchGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "feedback" | "finished">("playing");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);

  useEffect(() => { initGame(); }, []);

  const initGame = () => {
    const shuffled = [...PUZZLES].sort(() => Math.random() - 0.5).slice(0, ROUNDS_PER_GAME);
    shuffled.forEach(p => { p.items = p.items.sort(() => Math.random() - 0.5); });
    setPuzzles(shuffled);
    setCurrentRound(0);
    setScore(0);
    setCorrect(0);
    setGameState("playing");
    setSelectedAnswer(null);
    setShowHint(false);
  };

  const handleSelect = (item: string) => {
    if (gameState !== "playing") return;
    const puzzle = puzzles[currentRound];
    const isCorrect = item === puzzle.intruder;

    setSelectedAnswer(item);
    setGameState("feedback");

    if (isCorrect) {
      const points = showHint ? 5 : 10;
      setScore(s => s + points);
      setCorrect(c => c + 1);
    }
  };

  const nextRound = () => {
    setSelectedAnswer(null);
    setShowHint(false);
    if (currentRound + 1 >= ROUNDS_PER_GAME) {
      setGameState("finished");
      saveGameSession();
    } else {
      setCurrentRound(r => r + 1);
      setGameState("playing");
    }
  };

  const saveGameSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const success = correct >= Math.floor(ROUNDS_PER_GAME * 0.6);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "intruder",
      score,
      success,
      duration_seconds: duration,
    });
    if (success) toast.success(`Bravo ! Score: ${score} points`);
  };

  const puzzle = puzzles[currentRound];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Trouvez l'intrus</h1>
          <p className="text-sm text-muted-foreground">Quel mot ne va pas avec les autres ?</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {gameState !== "finished" && puzzle && (
          <>
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentRound / ROUNDS_PER_GAME) * 100}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Question {currentRound + 1}/{ROUNDS_PER_GAME}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{score} pts</p>
                <p className="text-xs text-muted-foreground">{correct} correct{correct > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Category hint */}
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <p className="text-sm text-muted-foreground">Catégorie</p>
              <p className="text-lg font-bold text-foreground">{puzzle.category}</p>
            </div>

            {/* Hint button */}
            {gameState === "playing" && !showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
              >
                <Lightbulb className="w-4 h-4" />
                Besoin d'un indice ? (5 pts au lieu de 10)
              </button>
            )}
            {showHint && gameState === "playing" && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                <p className="text-sm text-foreground">{puzzle.explanation}</p>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {puzzle.items.map(item => {
                const isSelected = selectedAnswer === item;
                const isIntruder = item === puzzle.intruder;
                let classes = "bg-card border-border text-foreground hover:border-primary";

                if (gameState === "feedback") {
                  if (isIntruder) {
                    classes = "bg-green-500 border-green-500 text-white";
                  } else if (isSelected && !isIntruder) {
                    classes = "bg-destructive/20 border-destructive text-destructive";
                  } else {
                    classes = "bg-card border-border text-muted-foreground opacity-50";
                  }
                }

                return (
                  <button
                    key={item}
                    onClick={() => handleSelect(item)}
                    disabled={gameState !== "playing"}
                    className={`rounded-xl p-4 text-lg font-semibold border-2 transition-all active:scale-[0.98] ${classes}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {gameState === "feedback" && (
              <div className={`rounded-xl p-4 text-center ${selectedAnswer === puzzle.intruder ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <p className="font-bold text-foreground mb-1">
                  {selectedAnswer === puzzle.intruder ? "Correct !" : "Raté !"}
                </p>
                <p className="text-sm text-muted-foreground mb-3">{puzzle.explanation}</p>
                <Button onClick={nextRound}>Continuer</Button>
              </div>
            )}
          </>
        )}

        {gameState === "finished" && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Partie terminée !</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-primary">{score}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-2xl font-bold text-green-500">{correct}/{ROUNDS_PER_GAME}</p>
                <p className="text-sm text-muted-foreground">Bonnes réponses</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {correct >= 8 ? "Excellent sens de l'observation !" :
               correct >= 5 ? "Bien joué ! Vous progressez !" :
               "Continuez, vous ferez mieux !"}
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
        )}

        {gameState === "playing" && currentRound === 0 && !selectedAnswer && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Parmi les 4 mots proposés, trouvez celui qui n'appartient pas à la catégorie !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
