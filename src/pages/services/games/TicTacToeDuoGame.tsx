import { ArrowLeft, RotateCcw, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

type CellValue = "X" | "O" | null;
type Board = CellValue[];
type GameResult = "player1" | "player2" | "draw" | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Board): CellValue {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getWinningLine(board: Board): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}

export function TicTacToeDuoGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState("Joueur 2");
  const [isSetup, setIsSetup] = useState(true);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayer1Turn, setIsPlayer1Turn] = useState(true);
  const [result, setResult] = useState<GameResult>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const [roundNumber, setRoundNumber] = useState(1);
  const [startTime, setStartTime] = useState(Date.now());
  const savedRef = useRef(false);

  const gameOver = result !== null;

  useEffect(() => {
    if (gameOver && !savedRef.current) {
      savedRef.current = true;
      saveGameSession();
    }
  }, [gameOver]);

  const saveGameSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "tictactoe_duo",
      score: scores.p1 + scores.p2,
      success: true,
      duration_seconds: duration,
    });
  };

  const startGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      toast.error("Entrez les deux prénoms !");
      return;
    }
    setIsSetup(false);
    setStartTime(Date.now());
  };

  const initRound = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayer1Turn(roundNumber % 2 === 1); // alternate who starts
    setResult(null);
    setWinningLine(null);
    savedRef.current = false;
  }, [roundNumber]);

  const newMatch = () => {
    setScores({ p1: 0, p2: 0, draws: 0 });
    setRoundNumber(1);
    setBoard(Array(9).fill(null));
    setIsPlayer1Turn(true);
    setResult(null);
    setWinningLine(null);
    setStartTime(Date.now());
    savedRef.current = false;
  };

  const handleCellClick = (index: number) => {
    if (gameOver || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = isPlayer1Turn ? "X" : "O";
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      const res: GameResult = winner === "X" ? "player1" : "player2";
      setResult(res);
      setWinningLine(getWinningLine(newBoard));
      setScores(s => ({
        ...s,
        p1: res === "player1" ? s.p1 + 1 : s.p1,
        p2: res === "player2" ? s.p2 + 1 : s.p2,
      }));
      toast.success(`🎉 ${res === "player1" ? player1Name : player2Name} gagne !`);
      return;
    }

    if (isBoardFull(newBoard)) {
      setResult("draw");
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      toast("Match nul ! 🤝");
      return;
    }

    setIsPlayer1Turn(!isPlayer1Turn);
  };

  const nextRound = () => {
    setRoundNumber(r => r + 1);
    setBoard(Array(9).fill(null));
    setIsPlayer1Turn(roundNumber % 2 === 0);
    setResult(null);
    setWinningLine(null);
    savedRef.current = false;
  };

  const currentPlayerName = isPlayer1Turn ? player1Name : player2Name;
  const currentSymbol = isPlayer1Turn ? "X" : "O";

  if (isSetup) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Morpion Duo</h1>
            <p className="text-sm text-muted-foreground">Jouez à deux !</p>
          </div>
          <Users className="w-6 h-6 text-primary" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Morpion à 2 joueurs</h2>
            <p className="text-muted-foreground">Entrez vos prénoms pour commencer</p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Joueur 1 (X) - 🔵
              </label>
              <input
                type="text"
                value={player1Name}
                onChange={e => setPlayer1Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Joueur 2 (O) - 🔴
              </label>
              <input
                type="text"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>
            <Button size="lg" className="w-full text-lg py-6" onClick={startGame}>
              🎮 Commencer la partie
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Morpion Duo</h1>
          <p className="text-sm text-muted-foreground">Manche {roundNumber}</p>
        </div>
        <Button size="sm" variant="outline" onClick={newMatch}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Nouveau
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Score board */}
        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div className={`text-center flex-1 ${isPlayer1Turn && !gameOver ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{scores.p1}</p>
              <p className="text-sm font-medium text-foreground">{player1Name}</p>
              <p className="text-xs text-muted-foreground">X 🔵</p>
            </div>
            <div className="text-center px-4">
              <p className="text-lg font-bold text-muted-foreground">{scores.draws}</p>
              <p className="text-xs text-muted-foreground">Nuls</p>
            </div>
            <div className={`text-center flex-1 ${!isPlayer1Turn && !gameOver ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{scores.p2}</p>
              <p className="text-sm font-medium text-foreground">{player2Name}</p>
              <p className="text-xs text-muted-foreground">O 🔴</p>
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {!gameOver && (
          <div className={`text-center py-2 px-4 rounded-xl ${
            isPlayer1Turn ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
          }`}>
            <p className={`text-lg font-semibold ${
              isPlayer1Turn ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
            }`}>
              {currentPlayerName}, à vous ! ({currentSymbol})
            </p>
          </div>
        )}

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
          {board.map((cell, index) => {
            const isWinCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={gameOver || cell !== null}
                className={`aspect-square rounded-xl text-4xl font-bold flex items-center justify-center transition-all ${
                  isWinCell
                    ? "bg-primary/30 ring-2 ring-primary scale-105"
                    : cell !== null
                    ? "bg-card border-2 border-border"
                    : "bg-card border-2 border-border hover:bg-primary/10 hover:border-primary cursor-pointer"
                } ${cell === "X" ? "text-blue-600 dark:text-blue-400" : ""} ${cell === "O" ? "text-red-600 dark:text-red-400" : ""}`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {gameOver && (
          <div className={`rounded-2xl p-6 text-center ${
            result === "draw" ? "bg-accent" : "bg-gradient-to-r from-primary/20 to-accent"
          }`}>
            {result !== "draw" && <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {result === "player1" ? `${player1Name} gagne ! 🎉` : result === "player2" ? `${player2Name} gagne ! 🎉` : "Match nul ! 🤝"}
            </h2>
            <p className="text-muted-foreground mb-4">
              Score : {player1Name} {scores.p1} - {scores.p2} {player2Name}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={nextRound}>
                ▶️ Manche suivante
              </Button>
              <Button variant="outline" onClick={newMatch}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Nouveau match
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
