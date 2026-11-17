import { useMemo } from "react";

const COLORS = ["#FF7A1A", "#1FA8E0", "#E8288A", "#7BC400", "#FFC400", "#7A3BE0"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  dx: string;
  rot: string;
  color: string;
  w: number;
  h: number;
  round: boolean;
}

/** One-shot paper confetti for the results screen. */
export default function Confetti({ count = 46 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    const out: Piece[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.6 + Math.random() * 1.9,
        dx: `${(Math.random() - 0.5) * 220}px`,
        rot: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720)}deg`,
        color: COLORS[i % COLORS.length],
        w: 8 + Math.random() * 10,
        h: 12 + Math.random() * 16,
        round: Math.random() > 0.72,
      });
    }
    return out;
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => {
        const style: Record<string, string | number> = {
          left: `${p.left}%`,
          width: p.w,
          height: p.h,
          background: p.color,
          borderRadius: p.round ? "999px" : "2px",
          border: "2px solid #2E2438",
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          "--dx": p.dx,
          "--rot": p.rot,
        };
        return <span key={i} className="animate-confetti absolute top-0 block" style={style} />;
      })}
    </div>
  );
}
