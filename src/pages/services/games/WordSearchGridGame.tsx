import { ArrowLeft, RotateCcw, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface WordPlacement {
  word: string;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
}

interface CellData {
  letter: string;
  row: number;
  col: number;
  wordIndices: number[]; // which words pass through this cell
}

interface WordTheme {
  name: string;
  emoji: string;
  words: string[];
}

const GRID_SIZE = 8;

const THEMES: WordTheme[] = [
  {
    name: "Animaux",
    emoji: "🐾",
    words: ["CHAT", "CHIEN", "POULE", "VACHE", "LAPIN", "CANARD"],
  },
  {
    name: "Fruits",
    emoji: "🍎",
    words: ["POMME", "POIRE", "PECHE", "PRUNE", "RAISIN", "CERISE"],
  },
  {
    name: "Couleurs",
    emoji: "🎨",
    words: ["ROUGE", "BLEU", "VERT", "JAUNE", "ROSE", "NOIR"],
  },
  {
    name: "Pays",
    emoji: "🌍",
    words: ["FRANCE", "ITALIE", "CHINE", "INDE", "PEROU", "MALI"],
  },
  {
    name: "Maison",
    emoji: "🏠",
    words: ["SALON", "CUISINE", "CHAMBRE", "JARDIN", "CAVE", "GRENIER"],
  },
  {
    name: "Nature",
    emoji: "🌿",
    words: ["ARBRE", "FLEUR", "HERBE", "LAC", "FORET", "ROCHE"],
  },
  {
    name: "Corps",
    emoji: "🦶",
    words: ["MAIN", "PIED", "BRAS", "TETE", "GENOU", "DOIGT"],
  },
  {
    name: "Cuisine",
    emoji: "🍳",
    words: ["PAIN", "SOUPE", "SALADE", "RIZ", "PATE", "TARTE"],
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function tryPlaceWord(
  grid: string[][],
  word: string,
  placements: WordPlacement[]
): WordPlacement | null {
  const directions: Array<"horizontal" | "vertical"> = shuffleArray([
    "horizontal",
    "vertical",
  ]);

  for (const direction of directions) {
    const maxRow = direction === "vertical" ? GRID_SIZE - word.length : GRID_SIZE - 1;
    const maxCol = direction === "horizontal" ? GRID_SIZE - word.length : GRID_SIZE - 1;

    // Try random positions up to 100 attempts
    for (let attempt = 0; attempt < 100; attempt++) {
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = direction === "vertical" ? row + i : row;
        const c = direction === "horizontal" ? col + i : col;
        const existing = grid[r][c];
        if (existing !== "" && existing !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          const r = direction === "vertical" ? row + i : row;
          const c = direction === "horizontal" ? col + i : col;
          grid[r][c] = word[i];
        }
        return { word, row, col, direction };
      }
    }
  }

  return null;
}

function generateGrid(words: string[]): {
  grid: CellData[][];
  placements: WordPlacement[];
  placedWords: string[];
} {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Sort words by length descending for better placement
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  // Try generating up to 10 times to place at least 5 words
  for (let gridAttempt = 0; gridAttempt < 10; gridAttempt++) {
    const rawGrid: string[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill("")
    );
    const placements: WordPlacement[] = [];

    for (const word of sortedWords) {
      const placement = tryPlaceWord(rawGrid, word, placements);
      if (placement) {
        placements.push(placement);
      }
    }

    if (placements.length >= 5) {
      // Fill empty cells with random letters
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (rawGrid[r][c] === "") {
            rawGrid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          }
        }
      }

      // Build CellData grid
      const cellGrid: CellData[][] = rawGrid.map((row, r) =>
        row.map((letter, c) => ({
          letter,
          row: r,
          col: c,
          wordIndices: [],
        }))
      );

      // Mark which words pass through each cell
      placements.forEach((p, idx) => {
        for (let i = 0; i < p.word.length; i++) {
          const r = p.direction === "vertical" ? p.row + i : p.row;
          const c = p.direction === "horizontal" ? p.col + i : p.col;
          cellGrid[r][c].wordIndices.push(idx);
        }
      });

      return {
        grid: cellGrid,
        placements,
        placedWords: placements.map((p) => p.word),
      };
    }
  }

  // Fallback: return whatever we have (shouldn't normally happen)
  const rawGrid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill("")
  );
  const placements: WordPlacement[] = [];
  for (const word of sortedWords) {
    const placement = tryPlaceWord(rawGrid, word, placements);
    if (placement) placements.push(placement);
  }
  const ALPHABET_FB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (rawGrid[r][c] === "") {
        rawGrid[r][c] = ALPHABET_FB[Math.floor(Math.random() * ALPHABET_FB.length)];
      }
    }
  }
  const cellGrid: CellData[][] = rawGrid.map((row, r) =>
    row.map((letter, c) => ({
      letter,
      row: r,
      col: c,
      wordIndices: [],
    }))
  );
  placements.forEach((p, idx) => {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.direction === "vertical" ? p.row + i : p.row;
      const c = p.direction === "horizontal" ? p.col + i : p.col;
      cellGrid[r][c].wordIndices.push(idx);
    }
  });
  return {
    grid: cellGrid,
    placements,
    placedWords: placements.map((p) => p.word),
  };
}

export function WordSearchGridGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [theme, setTheme] = useState<WordTheme | null>(null);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [placements, setPlacements] = useState<WordPlacement[]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<number>>(new Set());
  const [firstCell, setFirstCell] = useState<{ row: number; col: number } | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = useCallback(() => {
    // Pick a random theme
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setTheme(randomTheme);

    const { grid: newGrid, placements: newPlacements, placedWords: newPlacedWords } =
      generateGrid(randomTheme.words);

    setGrid(newGrid);
    setPlacements(newPlacements);
    setPlacedWords(newPlacedWords);
    setFoundWords(new Set());
    setFirstCell(null);
    setGameComplete(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setGameStarted(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame]);

  // Start the timer on first cell tap
  useEffect(() => {
    if (gameStarted && !gameComplete) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, gameComplete, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameComplete) return;

    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    if (!firstCell) {
      // First tap: select starting cell
      setFirstCell({ row, col });
      return;
    }

    // Second tap: check if it forms a valid word
    const startRow = firstCell.row;
    const startCol = firstCell.col;
    const endRow = row;
    const endCol = col;

    // Check if selection is horizontal or vertical
    const isHorizontal = startRow === endRow;
    const isVertical = startCol === endCol;

    if (!isHorizontal && !isVertical) {
      // Not a straight line, reset selection
      setFirstCell(null);
      return;
    }

    // Ensure start is before end
    let r1 = startRow, c1 = startCol, r2 = endRow, c2 = endCol;
    if (isHorizontal && c1 > c2) {
      [c1, c2] = [c2, c1];
    }
    if (isVertical && r1 > r2) {
      [r1, r2] = [r2, r1];
    }

    // Build the selected word
    let selectedWord = "";
    if (isHorizontal) {
      for (let c = c1; c <= c2; c++) {
        selectedWord += grid[r1][c].letter;
      }
    } else {
      for (let r = r1; r <= r2; r++) {
        selectedWord += grid[r][c1].letter;
      }
    }

    // Check if selected word matches any placement
    let matchIndex = -1;
    placements.forEach((p, idx) => {
      if (foundWords.has(idx)) return;
      if (
        p.word === selectedWord &&
        p.row === r1 &&
        p.col === c1 &&
        ((p.direction === "horizontal" && isHorizontal) ||
          (p.direction === "vertical" && isVertical))
      ) {
        matchIndex = idx;
      }
    });

    if (matchIndex >= 0) {
      const newFound = new Set(foundWords);
      newFound.add(matchIndex);
      setFoundWords(newFound);

      // Check if all words found
      if (newFound.size === placements.length) {
        setGameComplete(true);
        saveGameSession(newFound.size);
      }
    }

    setFirstCell(null);
  };

  const isCellInFoundWord = (row: number, col: number): boolean => {
    const cell = grid[row]?.[col];
    if (!cell) return false;
    return cell.wordIndices.some((idx) => foundWords.has(idx));
  };

  const isCellSelected = (row: number, col: number): boolean => {
    if (!firstCell) return false;
    return firstCell.row === row && firstCell.col === col;
  };

  const saveGameSession = async (wordsFound: number) => {
    if (!user) return;

    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = wordsFound * 15;
    const success = wordsFound === placements.length;

    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "wordsearch",
      score,
      success,
      duration_seconds: duration,
    });

    if (success) {
      toast.success(`Bravo ! Score: ${score} points`);
    }
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
          <h1 className="text-lg font-bold text-foreground">Mots Mêlés</h1>
          <p className="text-sm text-muted-foreground">
            {theme ? `${theme.emoji} ${theme.name}` : "Trouvez les mots cachés"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="flex justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {foundWords.size} / {placements.length}
            </p>
            <p className="text-sm text-muted-foreground">Mots trouvés</p>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-primary">{formatTime(elapsedSeconds)}</p>
              <p className="text-sm text-muted-foreground">Temps</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex justify-center">
          <div
            className="grid gap-[2px] bg-border rounded-xl p-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {grid.flatMap((row) =>
              row.map((cell) => {
                const found = isCellInFoundWord(cell.row, cell.col);
                const selected = isCellSelected(cell.row, cell.col);

                return (
                  <button
                    key={`${cell.row}-${cell.col}`}
                    onClick={() => handleCellClick(cell.row, cell.col)}
                    disabled={gameComplete}
                    className={`
                      w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center
                      text-sm sm:text-base font-bold rounded-md transition-all
                      ${
                        found
                          ? "bg-primary text-primary-foreground"
                          : selected
                          ? "bg-primary/30 text-foreground ring-2 ring-primary"
                          : "bg-card text-foreground hover:bg-secondary active:bg-primary/20"
                      }
                    `}
                  >
                    {cell.letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Word list */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-3 text-center">
            Mots à trouver
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {placedWords.map((word, idx) => {
              const isFound = foundWords.has(idx);
              return (
                <span
                  key={`${word}-${idx}`}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                    ${
                      isFound
                        ? "bg-primary/20 text-primary line-through opacity-60"
                        : "bg-secondary text-foreground"
                    }
                  `}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Victory */}
        {gameComplete && (
          <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Félicitations !</h2>
            <p className="text-muted-foreground mb-1">
              Tous les mots trouvés en {formatTime(elapsedSeconds)} !
            </p>
            <p className="text-lg font-bold text-primary mb-4">
              Score : {foundWords.size * 15} points
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!gameComplete && !gameStarted && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">Comment jouer</p>
            <p className="text-sm text-muted-foreground">
              Touchez la première lettre d'un mot, puis sa dernière lettre pour le
              sélectionner. Les mots sont cachés horizontalement ou verticalement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
