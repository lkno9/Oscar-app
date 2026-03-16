import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type CellValue = "X" | "O" | null;
type Board = CellValue[];
type GameResult = "win" | "loss" | "draw" | null;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): CellValue {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function getWinningLine(board: Board): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

/**
 * Simple AI for Oscar:
 * 1. Win if possible
 * 2. Block player from winning
 * 3. Take center if available
 * 4. Pick a random empty cell
 */
function oscarMove(board: Board): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  // 1. Try to win
  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = "O";
    if (checkWinner(copy) === "O") return idx;
  }

  // 2. Block player from winning
  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = "X";
    if (checkWinner(copy) === "X") return idx;
  }

  // 3. Take center
  if (board[4] === null) return 4;

  // 4. Random
  return empty[Math.floor(Math.random() * empty.length)];
}

export function TicTacToeGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [result, setResult] = useState<GameResult>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [moveCount, setMoveCount] = useState(0);

  const gameOver = result !== null;

  const initGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setResult(null);
    setWinningLine(null);
    setStartTime(Date.now());
    setMoveCount(0);
  }, []);

  const saveGameSession = useCallback(
    async (outcome: GameResult) => {
      if (!user || !outcome) return;

      const duration = Math.round((Date.now() - startTime) / 1000);
      const score = outcome === "win" ? 1 : 0;
      const success = outcome === "win";

      await supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "tictactoe",
        score,
        success,
        duration_seconds: duration,
      });

      if (success) {
        toast.success("Bravo ! Vous avez battu Oscar !");
      } else if (outcome === "draw") {
        toast("Match nul ! Bien joue !");
      } else {
        toast("Oscar a gagne cette fois. Retentez votre chance !");
      }
    },
    [user, startTime]
  );

  // Oscar plays when it's his turn
  useEffect(() => {
    if (gameOver || isPlayerTurn) return;

    const timeout = setTimeout(() => {
      const idx = oscarMove(board);
      if (idx === -1) return;

      const newBoard = [...board];
      newBoard[idx] = "O";
      setBoard(newBoard);
      setMoveCount((c) => c + 1);

      const winner = checkWinner(newBoard);
      if (winner === "O") {
        setResult("loss");
        setWinningLine(getWinningLine(newBoard));
        return;
      }
      if (isBoardFull(newBoard)) {
        setResult("draw");
        return;
      }

      setIsPlayerTurn(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isPlayerTurn, gameOver, board]);

  // Save session when game ends
  useEffect(() => {
    if (result) {
      saveGameSession(result);
    }
  }, [result, saveGameSession]);

  const handleCellClick = (index: number) => {
    if (gameOver || !isPlayerTurn || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setMoveCount((c) => c + 1);

    const winner = checkWinner(newBoard);
    if (winner === "X") {
      setResult("win");
      setWinningLine(getWinningLine(newBoard));
      return;
    }
    if (isBoardFull(newBoard)) {
      setResult("draw");
      return;
    }

    setIsPlayerTurn(false);
  };

  const resultMessage = () => {
    switch (result) {
      case "win":
        return "Vous avez gagne !";
      case "loss":
        return "Oscar a gagne !";
      case "draw":
        return "Match nul !";
      default:
        return "";
    }
  };

  const turnMessage = () => {
    if (gameOver) return resultMessage();
    return isPlayerTurn ? "A vous de jouer (X)" : "Oscar reflechit...";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Retour"
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Morpion</h1>
          <p className="text-sm text-muted-foreground">Jouez contre Oscar</p>
        </div>
        <Button size="sm" variant="outline" onClick={initGame}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Rejouer
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Turn indicator */}
        <div className="text-center">
          <p
            className={`text-lg font-semibold ${
              gameOver
                ? result === "win"
                  ? "text-primary"
                  : result === "loss"
                  ? "text-destructive"
                  : "text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {turnMessage()}
          </p>
        </div>

        {/* Score labels */}
        <div className="flex justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">X</p>
            <p className="text-sm text-muted-foreground">Vous</p>
          </div>
          <div className="text-muted-foreground text-2xl font-bold">VS</div>
          <div>
            <p className="text-2xl font-bold text-destructive">O</p>
            <p className="text-sm text-muted-foreground">Oscar</p>
          </div>
        </div>

        {/* Game board */}
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
          {board.map((cell, index) => {
            const isWinCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={gameOver || !isPlayerTurn || cell !== null}
                className={`aspect-square rounded-xl text-3xl font-bold flex items-center justify-center transition-all
                  ${
                    isWinCell
                      ? "bg-primary/30 ring-2 ring-primary"
                      : cell !== null
                      ? "bg-card border-2 border-border"
                      : "bg-card border-2 border-border hover:bg-primary/10 hover:border-primary"
                  }
                  ${cell === "X" ? "text-primary" : ""}
                  ${cell === "O" ? "text-destructive" : ""}
                  ${cell === null && !gameOver ? "cursor-pointer" : ""}
                `}
                aria-label={`Case ${index + 1}${cell ? `, ${cell}` : ", vide"}`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Result panel */}
        {gameOver && (
          <div
            className={`rounded-2xl p-6 text-center ${
              result === "win"
                ? "bg-gradient-to-r from-primary/20 to-accent"
                : result === "draw"
                ? "bg-accent"
                : "bg-destructive/10"
            }`}
          >
            {result === "win" && (
              <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
            )}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {resultMessage()}
            </h2>
            <p className="text-muted-foreground mb-4">
              {result === "win"
                ? `Bravo ! Partie terminee en ${moveCount} coups.`
                : result === "draw"
                ? "Personne ne gagne, essayez encore !"
                : "Oscar etait plus malin cette fois."}
            </p>
            <Button onClick={initGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!gameOver && moveCount === 0 && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <p className="text-foreground font-medium mb-1">
              Comment jouer
            </p>
            <p className="text-sm text-muted-foreground">
              Vous jouez les X, Oscar joue les O. Alignez 3 symboles en ligne,
              colonne ou diagonale pour gagner !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
