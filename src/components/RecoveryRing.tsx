import { motion } from "framer-motion";
import { Counter } from "@/components/Counter";

interface RecoveryRingProps {
  score: number;
  size?: number;
}

export function RecoveryRing({ score, size = 96 }: RecoveryRingProps) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  
  const color = score >= 80 ? "oklch(0.70 0.18 250)" 
    : score >= 60 ? "oklch(0.62 0.20 250)" 
    : score >= 40 ? "var(--color-warning)" 
    : "var(--color-danger)";
    
  const glowColor = score >= 80 ? "oklch(0.70 0.18 250 / 0.5)" 
    : score >= 60 ? "oklch(0.62 0.20 250 / 0.5)"
    : score >= 40 ? "oklch(0.82 0.17 85 / 0.4)"
    : "oklch(0.7 0.18 25 / 0.4)";

  return (
    <div className="relative grid place-items-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track circle */}
        <circle cx={size / 2} cy={size / 2} r={r} 
          stroke="oklch(0.22 0.04 250)" strokeWidth={8} fill="none" />
        
        {/* Animated progressive circle */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={8} fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          style={{ 
            filter: `drop-shadow(0 0 10px ${glowColor})`
          }}
        />
      </svg>
      
      {/* Centered animated scoreboard number */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-black font-mono leading-none tracking-tighter flex items-center justify-center">
            <Counter to={score} duration={0.8} />
          </div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">RECUP</div>
        </div>
      </div>
    </div>
  );
}
