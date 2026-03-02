import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Grid = number[][];

const getTileColor = (value: number): string => {
  const colors: Record<number, string> = {
    0: "bg-secondary",
    2: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100",
    4: "bg-amber-200 dark:bg-amber-800/40 text-amber-900 dark:text-amber-100",
    8: "bg-orange-300 dark:bg-orange-700/50 text-white",
    16: "bg-orange-400 dark:bg-orange-600 text-white",
    32: "bg-orange-500 dark:bg-orange-500 text-white",
    64: "bg-orange-600 dark:bg-orange-400 text-white",
    128: "bg-yellow-400 dark:bg-yellow-500 text-white",
    256: "bg-yellow-500 dark:bg-yellow-400 text-white",
    512: "bg-yellow-600 dark:bg-yellow-300 text-yellow-900",
    1024: "bg-yellow-500 dark:bg-yellow-400 text-white",
    2048: "bg-yellow-400 dark:bg-yellow-300 text-yellow-900",
  };
  return colors[value] || "bg-purple-500 text-white";
};

const createEmptyGrid = (): Grid => {
  return Array(4).fill(null).map(() => Array(4).fill(0));
};

const addRandomTile = (grid: Grid): Grid => {
  const newGrid = grid.map(row => [...row]);
  const emptyCells: { row: number; col: number }[] = [];
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (newGrid[i][j] === 0) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  }
  
  return newGrid;
};

const initGrid = (): Grid => {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

const slideRow = (row: number[]): { newRow: number[]; score: number } => {
  let score = 0;
  const filtered = row.filter(val => val !== 0);
  const merged: number[] = [];
  
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  
  while (merged.length < 4) {
    merged.push(0);
  }
  
  return { newRow: merged, score };
};

const moveLeft = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let totalScore = 0;
  let moved = false;
  
  const newGrid = grid.map(row => {
    const { newRow, score } = slideRow(row);
    totalScore += score;
    if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
    return newRow;
  });
  
  return { grid: newGrid, score: totalScore, moved };
};

const rotateGrid = (grid: Grid): Grid => {
  const n = 4;
  const rotated: Grid = createEmptyGrid();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rotated[j][n - 1 - i] = grid[i][j];
    }
  }
  return rotated;
};

const moveRight = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let rotated = rotateGrid(rotateGrid(grid));
  const { grid: movedGrid, score, moved } = moveLeft(rotated);
  return { grid: rotateGrid(rotateGrid(movedGrid)), score, moved };
};

const moveUp = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let rotated = rotateGrid(rotateGrid(rotateGrid(grid)));
  const { grid: movedGrid, score, moved } = moveLeft(rotated);
  return { grid: rotateGrid(movedGrid), score, moved };
};

const moveDown = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let rotated = rotateGrid(grid);
  const { grid: movedGrid, score, moved } = moveLeft(rotated);
  return { grid: rotateGrid(rotateGrid(rotateGrid(movedGrid))), score, moved };
};

const canMove = (grid: Grid): boolean => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] === 0) return true;
      if (j < 3 && grid[i][j] === grid[i][j + 1]) return true;
      if (i < 3 && grid[i][j] === grid[i + 1][j]) return true;
    }
  }
  return false;
};

const hasWon = (grid: Grid): boolean => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] >= 2048) return true;
    }
  }
  return false;
};

export function Game2048() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  const initGame = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setStartTime(new Date());
  }, []);

  const saveGameSession = async (success: boolean, finalScore: number) => {
    if (!user) return;
    
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    
    await supabase.from('game_sessions').insert({
      user_id: user.id,
      game_type: '2048',
      score: finalScore,
      success,
      duration_seconds: duration
    });
  };

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    let result: { grid: Grid; score: number; moved: boolean };
    
    switch (direction) {
      case 'up':
        result = moveUp(grid);
        break;
      case 'down':
        result = moveDown(grid);
        break;
      case 'left':
        result = moveLeft(grid);
        break;
      case 'right':
        result = moveRight(grid);
        break;
    }

    if (result.moved) {
      const newScore = score + result.score;
      const newGrid = addRandomTile(result.grid);
      
      setGrid(newGrid);
      setScore(newScore);
      
      if (newScore > bestScore) {
        setBestScore(newScore);
      }

      if (hasWon(newGrid) && !won) {
        setWon(true);
        toast.success("Félicitations ! Vous avez atteint 2048 ! 🎉");
        saveGameSession(true, newScore);
      }

      if (!canMove(newGrid)) {
        setGameOver(true);
        toast.error("Partie terminée !");
        saveGameSession(false, newScore);
      }
    }
  }, [grid, score, bestScore, gameOver, won, startTime, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 30) handleMove('right');
      else if (deltaX < -30) handleMove('left');
    } else {
      if (deltaY > 30) handleMove('down');
      else if (deltaY < -30) handleMove('up');
    }
    
    setTouchStart(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">2048</h1>
          <p className="text-sm text-muted-foreground">Fusionnez les tuiles</p>
        </div>
        <Button variant="outline" size="sm" onClick={initGame}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
        {/* Scores */}
        <div className="flex gap-4 w-full max-w-xs">
          <div className="flex-1 bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground uppercase">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
          <div className="flex-1 bg-gradient-to-r from-primary to-primary/80 rounded-xl p-3 text-center text-primary-foreground">
            <p className="text-xs uppercase opacity-80">Meilleur</p>
            <p className="text-2xl font-bold">{bestScore}</p>
          </div>
        </div>

        {/* Game Status */}
        {(gameOver || won) && (
          <div className={`w-full max-w-xs rounded-xl p-4 text-center ${won ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' : 'bg-destructive/20 text-destructive'}`}>
            <Trophy className="w-10 h-10 mx-auto mb-2" />
            <h2 className="text-xl font-bold">{won ? "Victoire ! 🎉" : "Partie terminée"}</h2>
            <p>Score final : {score}</p>
          </div>
        )}

        {/* Grid */}
        <div 
          className="bg-secondary/70 rounded-xl p-2 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-2">
            {grid.flat().map((value, index) => (
              <div
                key={index}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl transition-all ${getTileColor(value)}`}
              >
                {value !== 0 && value}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="grid grid-cols-3 gap-2 w-36">
          <div />
          <button
            onClick={() => handleMove('up')}
            className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div />
          <button
            onClick={() => handleMove('left')}
            className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleMove('down')}
            className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleMove('right')}
            className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-xs bg-secondary/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Glissez ou utilisez les flèches pour déplacer les tuiles. Fusionnez les même nombres pour atteindre 2048 !
          </p>
        </div>
      </div>
    </div>
  );
}
