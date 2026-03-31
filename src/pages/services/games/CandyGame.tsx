import { ArrowLeft, RotateCcw, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const GRID_SIZE = 8;
const CANDY_TYPES = ["🍬", "🍭", "🍫", "🍩", "🧁", "🍪"];
const MOVES_LIMIT = 30;
const SCORE_PER_CANDY = 10;
const COMBO_MULTIPLIER = 1.5;

type Cell = {
  type: number;
  id: number;
  isMatched: boolean;
  isFalling: boolean;
};

let nextId = 0;
function createCell(type?: number): Cell {
  return {
    type: type ?? Math.floor(Math.random() * CANDY_TYPES.length),
    id: nextId++,
    isMatched: false,
    isFalling: false,
  };
}

function createGrid(): Cell[][] {
  let grid: Cell[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell = createCell();
      // Avoid initial matches of 3
      while (
        (c >= 2 && grid[r][c - 1].type === cell.type && grid[r][c - 2].type === cell.type) ||
        (r >= 2 && grid[r - 1][c].type === cell.type && grid[r - 2][c].type === cell.type)
      ) {
        cell = createCell();
      }
      grid[r][c] = cell;
    }
  }
  return grid;
}

function copyGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

function findMatches(grid: Cell[][]): [number, number][] {
  const matched = new Set<string>();

  // Horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      const t = grid[r][c].type;
      if (t === grid[r][c + 1].type && t === grid[r][c + 2].type) {
        matched.add(`${r},${c}`);
        matched.add(`${r},${c + 1}`);
        matched.add(`${r},${c + 2}`);
      }
    }
  }

  // Vertical
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      const t = grid[r][c].type;
      if (t === grid[r + 1][c].type && t === grid[r + 2][c].type) {
        matched.add(`${r},${c}`);
        matched.add(`${r + 1},${c}`);
        matched.add(`${r + 2},${c}`);
      }
    }
  }

  return [...matched].map(s => {
    const [r, c] = s.split(",").map(Number);
    return [r, c];
  });
}

function removeAndDrop(grid: Cell[][]): { newGrid: Cell[][]; removed: number } {
  const matches = findMatches(grid);
  if (matches.length === 0) return { newGrid: grid, removed: 0 };

  const g = copyGrid(grid);

  // Mark matched
  for (const [r, c] of matches) {
    g[r][c].isMatched = true;
  }

  // Drop: for each column, remove matched and fill from top
  for (let c = 0; c < GRID_SIZE; c++) {
    const remaining: Cell[] = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (!g[r][c].isMatched) {
        remaining.push(g[r][c]);
      }
    }
    remaining.reverse();

    const newCells: Cell[] = [];
    while (remaining.length + newCells.length < GRID_SIZE) {
      const nc = createCell();
      nc.isFalling = true;
      newCells.push(nc);
    }

    const column = [...newCells, ...remaining];
    for (let r = 0; r < GRID_SIZE; r++) {
      g[r][c] = column[r];
    }
  }

  return { newGrid: g, removed: matches.length };
}

function cascadeAll(grid: Cell[][]): { finalGrid: Cell[][]; totalRemoved: number; combos: number } {
  let current = copyGrid(grid);
  let totalRemoved = 0;
  let combos = 0;

  while (true) {
    const { newGrid, removed } = removeAndDrop(current);
    if (removed === 0) break;
    totalRemoved += removed;
    combos++;
    current = newGrid;
  }

  return { finalGrid: current, totalRemoved, combos };
}

function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function hasValidMoves(grid: Cell[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Try swap right
      if (c < GRID_SIZE - 1) {
        const g = copyGrid(grid);
        [g[r][c], g[r][c + 1]] = [g[r][c + 1], g[r][c]];
        if (findMatches(g).length > 0) return true;
      }
      // Try swap down
      if (r < GRID_SIZE - 1) {
        const g = copyGrid(grid);
        [g[r][c], g[r + 1][c]] = [g[r + 1][c], g[r][c]];
        if (findMatches(g).length > 0) return true;
      }
    }
  }
  return false;
}

export function CandyGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [grid, setGrid] = useState<Cell[][]>(() => createGrid());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES_LIMIT);
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [combo, setCombo] = useState(0);
  const [startTime] = useState(Date.now());
  const [bestCombo, setBestCombo] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const savedRef = useRef(false);

  // Ensure no initial matches
  useEffect(() => {
    const { finalGrid } = cascadeAll(grid);
    setGrid(finalGrid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for game over
  useEffect(() => {
    if (movesLeft <= 0 && !isAnimating) {
      setGameOver(true);
    } else if (!isAnimating && !gameOver) {
      if (!hasValidMoves(grid)) {
        // Reshuffle if no valid moves
        const newGrid = createGrid();
        const { finalGrid } = cascadeAll(newGrid);
        setGrid(finalGrid);
        toast("🔄 Grille remélangée !");
      }
    }
  }, [movesLeft, isAnimating, grid, gameOver]);

  // Save game when over
  useEffect(() => {
    if (gameOver && !savedRef.current) {
      savedRef.current = true;
      saveGameSession();
    }
  }, [gameOver]);

  const saveGameSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const success = score >= 500;

    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "candy",
      score,
      success,
      duration_seconds: duration,
    });

    if (success) {
      toast.success(`🎉 Super partie ! ${score} points !`);
    } else {
      toast(`Partie terminée ! ${score} points. Essayez encore !`);
    }
  };

  const initGame = () => {
    nextId = 0;
    const newGrid = createGrid();
    const { finalGrid } = cascadeAll(newGrid);
    setGrid(finalGrid);
    setSelected(null);
    setScore(0);
    setMovesLeft(MOVES_LIMIT);
    setGameOver(false);
    setIsAnimating(false);
    setCombo(0);
    setBestCombo(0);
    setShowHint(true);
    savedRef.current = false;
  };

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (gameOver || isAnimating) return;
      setShowHint(false);

      if (!selected) {
        setSelected([r, c]);
        return;
      }

      const [sr, sc] = selected;

      // Deselect if same cell
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }

      // Must be adjacent
      if (!isAdjacent(sr, sc, r, c)) {
        setSelected([r, c]);
        return;
      }

      // Try swap
      const newGrid = copyGrid(grid);
      [newGrid[sr][sc], newGrid[r][c]] = [newGrid[r][c], newGrid[sr][sc]];

      const matches = findMatches(newGrid);
      if (matches.length === 0) {
        // Invalid swap - shake animation would go here
        setSelected(null);
        toast("❌ Pas de combinaison !", { duration: 1000 });
        return;
      }

      setSelected(null);
      setIsAnimating(true);
      setMovesLeft(m => m - 1);

      // Process cascades
      const { finalGrid, totalRemoved, combos } = cascadeAll(newGrid);
      const comboBonus = combos > 1 ? Math.pow(COMBO_MULTIPLIER, combos - 1) : 1;
      const points = Math.round(totalRemoved * SCORE_PER_CANDY * comboBonus);

      setScore(s => s + points);
      setCombo(combos);
      if (combos > bestCombo) setBestCombo(combos);

      if (combos > 1) {
        toast.success(`🔥 Combo x${combos} ! +${points} points`, { duration: 1500 });
      }

      // Slight delay for visual effect
      setTimeout(() => {
        setGrid(finalGrid);
        setIsAnimating(false);
        setCombo(0);
      }, 300);
    },
    [grid, selected, gameOver, isAnimating, bestCombo]
  );

  const getScoreLevel = () => {
    if (score >= 2000) return { label: "Légendaire", emoji: "👑", color: "text-yellow-500" };
    if (score >= 1000) return { label: "Expert", emoji: "⭐", color: "text-purple-500" };
    if (score >= 500) return { label: "Très bien", emoji: "🌟", color: "text-primary" };
    if (score >= 200) return { label: "Bien", emoji: "👍", color: "text-blue-500" };
    return { label: "Débutant", emoji: "🍬", color: "text-muted-foreground" };
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
          <h1 className="text-lg font-bold text-foreground">Candy Crush</h1>
          <p className="text-sm text-muted-foreground">Alignez les bonbons !</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-xl">
            <Star className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary text-lg">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            {combo > 1 && (
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🔥 x{combo}
              </span>
            )}
          </div>
          <div className={`px-3 py-2 rounded-xl font-bold text-lg ${
            movesLeft <= 5 ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"
          }`}>
            {movesLeft} coups
          </div>
        </div>

        {/* Moves progress bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              movesLeft <= 5 ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${(movesLeft / MOVES_LIMIT) * 100}%` }}
          />
        </div>

        {/* Game grid */}
        <div className="flex justify-center">
          <div
            className="grid gap-1 p-2 bg-card rounded-2xl border border-border shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              maxWidth: "360px",
              width: "100%",
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selected && selected[0] === r && selected[1] === c;
                return (
                  <button
                    key={`${r}-${c}-${cell.id}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={gameOver || isAnimating}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/30 ring-2 ring-primary scale-110 shadow-lg"
                        : "bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 hover:scale-105 hover:shadow-md"
                    } ${cell.isMatched ? "opacity-0 scale-50" : "opacity-100 scale-100"} ${
                      cell.isFalling ? "animate-bounce" : ""
                    }`}
                    style={{ minWidth: 0, minHeight: 0 }}
                  >
                    {CANDY_TYPES[cell.type]}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Partie terminée !</h2>
            <div className={`text-3xl font-bold mb-1 ${getScoreLevel().color}`}>
              {getScoreLevel().emoji} {score} points
            </div>
            <p className="text-muted-foreground mb-1">{getScoreLevel().label}</p>
            {bestCombo > 1 && (
              <p className="text-sm text-orange-500 font-medium mb-3">
                🔥 Meilleur combo : x{bestCombo}
              </p>
            )}
            <Button onClick={initGame} className="mt-3">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
        )}

        {/* Instructions */}
        {showHint && !gameOver && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">🍬 Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Touchez un bonbon, puis un bonbon voisin pour les échanger.
              Alignez 3 bonbons identiques ou plus pour marquer des points !
              Créez des combos pour des bonus !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
