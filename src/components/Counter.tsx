import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
}

export function Counter({ from = 0, to, duration = 1, decimals = 0 }: CounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        setCount(value);
      },
    });
    return () => controls.stop();
  }, [from, to, duration]);

  return <span className="font-mono tabular-nums">{count.toFixed(decimals)}</span>;
}
