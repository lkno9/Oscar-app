import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  width: number;
  height: number;
  rotation: number;
  shape: "square" | "circle" | "rect";
}

const COLORS = [
  "#2DD4BF", "#f59e0b", "#7c3aed", "#ef4444",
  "#22c55e", "#3b82f6", "#f97316", "#ec4899",
  "#fbbf24", "#a855f7", "#10b981",
];

interface ConfettiProps {
  /** Set to true to trigger the animation */
  active: boolean;
  /** Number of confetti pieces */
  count?: number;
  /** How long (ms) before pieces are removed from DOM */
  duration?: number;
}

export function Confetti({ active, count = 55, duration = 3500 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;

    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => {
      const size = 6 + Math.random() * 9;
      const shape = (["square", "circle", "rect"] as const)[Math.floor(Math.random() * 3)];
      return {
        id: i,
        x: 3 + Math.random() * 94,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.9,
        duration: 1.8 + Math.random() * 1.6,
        width:  shape === "rect" ? size * 2.4 : size,
        height: shape === "rect" ? size * 0.5 : size,
        rotation: Math.random() * 360,
        shape,
      };
    });

    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), duration + 1000);
    return () => clearTimeout(timer);
  }, [active, count, duration]);

  if (!pieces.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -18,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius:
              p.shape === "circle" ? "50%" :
              p.shape === "square" ? 3 : 2,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
