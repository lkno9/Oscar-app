import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Lightbulb, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Generate a simple Sudoku puzzle
function generateSudoku(): { puzzle: (number | null)[][], solution: number[][] } {
  // Simple pre-made puzzle for reliable gameplay
  const solution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  // Remove some numbers to create puzzle (easy difficulty: 35 clues)
  const puzzle: (number | null)[][] = solution.map(row => [...row]);
  const cellsToRemove = 46; // 81 - 35 = 46 cells removed
  let removed = 0;
  
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      removed++;
    }
  }

  return { puzzle, solution };
}

export function SudokuGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [puzzle, setPuzzle] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [userGrid, setUserGrid] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [errors, setErrors] = useState(0);
  const [hints, setHints] = useState(3);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const { puzzle: newPuzzle, solution: newSolution } = generateSudoku();
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setUserGrid(newPuzzle.map(row => [...row]));
    setSelectedCell(null);
    setIsComplete(false);
    setStartTime(new Date());
    setErrors(0);
    setHints(3);
  };

  const handleCellClick = (row: number, col: number) => {
    // Can't select original puzzle cells
    if (puzzle[row][col] !== null) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return;
    
    const { row, col } = selectedCell;
    if (puzzle[row][col] !== null) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = num;
    setUserGrid(newGrid);

    // Check if correct
    if (num !== solution[row][col]) {
      setErrors(prev => prev + 1);
      toast.error("Ce n'est pas le bon chiffre !");
    }

    // Check if complete
    checkCompletion(newGrid);
  };

  const handleClear = () => {
    if (!selectedCell || isComplete) return;
    const { row, col } = selectedCell;
    if (puzzle[row][col] !== null) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = null;
    setUserGrid(newGrid);
  };

  const handleHint = () => {
    if (hints <= 0 || isComplete) return;
    
    // Find an empty cell and fill it
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (userGrid[row][col] === null) {
          const newGrid = userGrid.map(r => [...r]);
          newGrid[row][col] = solution[row][col];
          setUserGrid(newGrid);
          setHints(prev => prev - 1);
          checkCompletion(newGrid);
          toast.success("Indice utilisé !");
          return;
        }
      }
    }
  };

  const checkCompletion = (grid: (number | null)[][]) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== solution[row][col]) return;
      }
    }
    
    setIsComplete(true);
    const duration = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
    const score = Math.max(0, 1000 - (errors * 50) - Math.floor(duration / 10));
    saveGameSession(true, score, duration);
    toast.success("Bravo ! Sudoku terminé ! 🎉");
  };

  const saveGameSession = async (success: boolean, score: number, duration: number) => {
    if (!user) return;
    
    await supabase.from('game_sessions').insert({
      user_id: user.id,
      game_type: 'sudoku',
      score,
      success,
      duration_seconds: duration
    });
  };

  const getCellClass = (row: number, col: number) => {
    const isOriginal = puzzle[row][col] !== null;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isCorrect = userGrid[row][col] === solution[row][col];
    const hasValue = userGrid[row][col] !== null;
    
    let classes = "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg font-semibold transition-all border border-border ";
    
    if (isSelected) {
      classes += "bg-primary/30 ring-2 ring-primary ";
    } else if (isOriginal) {
      classes += "bg-secondary text-foreground ";
    } else if (hasValue && !isCorrect) {
      classes += "bg-destructive/20 text-destructive ";
    } else if (hasValue) {
      classes += "bg-card text-primary ";
    } else {
      classes += "bg-card hover:bg-secondary/50 cursor-pointer ";
    }

    // Add thicker borders for 3x3 boxes
    if (col % 3 === 0 && col !== 0) classes += "border-l-2 border-l-foreground/30 ";
    if (row % 3 === 0 && row !== 0) classes += "border-t-2 border-t-foreground/30 ";

    return classes;
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
          <h1 className="text-lg font-bold text-foreground">Sudoku</h1>
          <p className="text-sm text-muted-foreground">Complétez la grille</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">❌ {errors}</span>
          <span className="text-sm text-muted-foreground">💡 {hints}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
        {isComplete && (
          <div className="w-full max-w-sm bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 text-center text-primary-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-2" />
            <h2 className="text-xl font-bold mb-1">Félicitations !</h2>
            <p className="text-sm opacity-90">Sudoku complété avec {errors} erreur(s)</p>
          </div>
        )}

        {/* Sudoku Grid */}
        <div className="bg-card rounded-xl p-2 border-2 border-foreground/20 shadow-lg">
          {userGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={getCellClass(rowIndex, colIndex)}
                  disabled={puzzle[rowIndex][colIndex] !== null || isComplete}
                >
                  {cell || ""}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Number Input */}
        {!isComplete && (
          <div className="w-full max-w-sm">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  className="h-12 bg-card rounded-xl border border-border text-xl font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  className="h-12 bg-card rounded-xl border border-border text-xl font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-12 bg-secondary rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-destructive/20 transition-colors"
              >
                Effacer
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleHint} disabled={hints <= 0 || isComplete}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Indice ({hints})
          </Button>
          <Button onClick={initGame}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {isComplete ? "Rejouer" : "Nouvelle partie"}
          </Button>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-sm bg-secondary/50 rounded-xl p-4 mt-2">
          <p className="text-sm text-muted-foreground text-center">
            Remplissez la grille avec les chiffres 1-9. Chaque ligne, colonne et carré 3×3 doit contenir tous les chiffres sans répétition.
          </p>
        </div>
      </div>
    </div>
  );
}
