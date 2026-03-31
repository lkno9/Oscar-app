import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RotateCcw, Trophy, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { OnlineGameLobby } from "@/components/games/OnlineGameLobby";
import { toast } from "sonner";

type CellValue = "X" | "O" | null;
type Board = CellValue[];

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
  return board.every((c) => c !== null);
}

export function TicTacToeOnlineGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<ReturnType<typeof useGameRoom> | null>(null);
  const [inLobby, setInLobby] = useState(true);

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ me: 0, them: 0, draws: 0 });
  const [roundNumber, setRoundNumber] = useState(1);
  const savedRef = useRef(false);

  const gameOver = result !== null;
  const mySymbol: CellValue = gameRoom?.isHost ? "X" : "O";
  const theirSymbol: CellValue = gameRoom?.isHost ? "O" : "X";

  const handleGameReady = useCallback((room: ReturnType<typeof useGameRoom>) => {
    setGameRoom(room);
    setInLobby(false);
    setIsMyTurn(room.isHost); // Host (X) goes first
    savedRef.current = false;
  }, []);

  // Listen for opponent moves
  useEffect(() => {
    if (!gameRoom) return;

    gameRoom.onEvent("move", (data: { cellIndex: number }) => {
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[data.cellIndex] = theirSymbol;

        const winner = checkWinner(newBoard);
        if (winner) {
          setResult("loss");
          setWinningLine(getWinningLine(newBoard));
        } else if (isBoardFull(newBoard)) {
          setResult("draw");
        }

        return newBoard;
      });
      setIsMyTurn(true);
    });

    gameRoom.onEvent("new_round", () => {
      setBoard(Array(9).fill(null));
      setResult(null);
      setWinningLine(null);
      setRoundNumber((r) => r + 1);
      setIsMyTurn(!gameRoom.isHost); // alternate
      savedRef.current = false;
    });

    gameRoom.onEvent("rematch", () => {
      setBoard(Array(9).fill(null));
      setResult(null);
      setWinningLine(null);
      setScores({ me: 0, them: 0, draws: 0 });
      setRoundNumber(1);
      setIsMyTurn(gameRoom.isHost);
      savedRef.current = false;
    });
  }, [gameRoom, theirSymbol]);

  // Save session on game over
  useEffect(() => {
    if (gameOver && !savedRef.current && user) {
      savedRef.current = true;
      const duration = 30; // approximate
      supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "tictactoe_online",
        score: result === "win" ? 1 : 0,
        success: result === "win",
        duration_seconds: duration,
      });

      if (result === "win") {
        setScores((s) => ({ ...s, me: s.me + 1 }));
        toast.success("🎉 Vous avez gagné !");
      } else if (result === "loss") {
        setScores((s) => ({ ...s, them: s.them + 1 }));
        toast("L'adversaire a gagné cette manche !");
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        toast("Match nul ! 🤝");
      }
    }
  }, [gameOver, result, user]);

  const handleCellClick = (index: number) => {
    if (gameOver || !isMyTurn || board[index] !== null || !gameRoom) return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);
    setIsMyTurn(false);

    gameRoom.sendEvent("move", { cellIndex: index });

    const winner = checkWinner(newBoard);
    if (winner) {
      setResult("win");
      setWinningLine(getWinningLine(newBoard));
    } else if (isBoardFull(newBoard)) {
      setResult("draw");
    }
  };

  const requestNewRound = () => {
    if (!gameRoom) return;
    setBoard(Array(9).fill(null));
    setResult(null);
    setWinningLine(null);
    setRoundNumber((r) => r + 1);
    setIsMyTurn(roundNumber % 2 === 0 ? gameRoom.isHost : !gameRoom.isHost);
    savedRef.current = false;
    gameRoom.sendEvent("new_round", {});
  };

  if (inLobby) {
    return (
      <OnlineGameLobby
        gameTitle="Morpion"
        gameEmoji="❌"
        gameType="tictactoe"
        onGameReady={handleGameReady}
      />
    );
  }

  if (gameRoom?.status === "disconnected") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Morpion En Ligne</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-bold">Connexion perdue</h2>
          <p className="text-muted-foreground">Votre adversaire s'est déconnecté.</p>
          <Button onClick={() => { gameRoom.leaveRoom(); setInLobby(true); }}>
            🔄 Nouvelle partie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Morpion En Ligne</h1>
          <p className="text-sm text-muted-foreground">Manche {roundNumber}</p>
        </div>
        <div className="flex items-center gap-1 text-green-500">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">En ligne</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Scoreboard */}
        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div className={`text-center flex-1 ${isMyTurn && !gameOver ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{scores.me}</p>
              <p className="text-sm font-medium text-foreground">{gameRoom?.myName}</p>
              <p className="text-xs text-muted-foreground">{mySymbol} (Vous)</p>
            </div>
            <div className="text-center px-4">
              <p className="text-lg font-bold text-muted-foreground">{scores.draws}</p>
              <p className="text-xs text-muted-foreground">Nuls</p>
            </div>
            <div className={`text-center flex-1 ${!isMyTurn && !gameOver ? "opacity-100" : "opacity-60"}`}>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{scores.them}</p>
              <p className="text-sm font-medium text-foreground">{gameRoom?.opponentName}</p>
              <p className="text-xs text-muted-foreground">{theirSymbol}</p>
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {!gameOver && (
          <div className={`text-center py-2 px-4 rounded-xl ${isMyTurn ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            <p className={`text-lg font-semibold ${isMyTurn ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
              {isMyTurn ? "À vous de jouer !" : `${gameRoom?.opponentName} réfléchit...`}
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
                disabled={gameOver || !isMyTurn || cell !== null}
                className={`aspect-square rounded-xl text-4xl font-bold flex items-center justify-center transition-all ${
                  isWinCell
                    ? "bg-primary/30 ring-2 ring-primary scale-105"
                    : cell !== null
                    ? "bg-card border-2 border-border"
                    : isMyTurn
                    ? "bg-card border-2 border-border hover:bg-primary/10 hover:border-primary cursor-pointer"
                    : "bg-card border-2 border-border opacity-60"
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
            result === "win" ? "bg-gradient-to-r from-primary/20 to-accent" : result === "draw" ? "bg-accent" : "bg-destructive/10"
          }`}>
            {result === "win" && <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {result === "win" ? "Vous avez gagné ! 🎉" : result === "loss" ? `${gameRoom?.opponentName} gagne !` : "Match nul ! 🤝"}
            </h2>
            <p className="text-muted-foreground mb-4">
              Score : {gameRoom?.myName} {scores.me} - {scores.them} {gameRoom?.opponentName}
            </p>
            {gameRoom?.isHost && (
              <Button onClick={requestNewRound}>
                ▶️ Manche suivante
              </Button>
            )}
            {!gameRoom?.isHost && (
              <p className="text-sm text-muted-foreground">En attente de la prochaine manche...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
