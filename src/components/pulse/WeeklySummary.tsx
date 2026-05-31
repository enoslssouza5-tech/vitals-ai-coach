import React from "react";
import { Footprints, Timer, Activity, Flame } from "lucide-react";

export const WeeklySummary = React.memo(function WeeklySummary({ showComparisons = true }: { showComparisons?: boolean }) {
  const items = [
    {
      icon: <Footprints className="h-8 w-8" strokeWidth={1.5} />,
      value: "42,6",
      unit: "km",
      label: "Distância",
      delta: "▲ 12% vs semana passada",
      good: true,
    },
    {
      icon: <Timer className="h-8 w-8" strokeWidth={1.5} />,
      value: "4h 32m",
      unit: "",
      label: "Tempo",
      delta: "▲ 8% vs semana passada",
      good: true,
    },
    {
      icon: <Activity className="h-8 w-8" strokeWidth={1.5} />,
      value: "5'22\"",
      unit: "",
      label: "Ritmo médio",
      delta: "▼ 3% vs semana passada",
      good: true,
    },
    {
      icon: <Flame className="h-8 w-8" strokeWidth={1.5} />,
      value: "2.896",
      unit: "",
      label: "Calorias",
      delta: "▲ 15% vs semana passada",
      good: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-1.5 text-center first:pl-0 last:pr-0">
          <div className="mx-auto mb-3 flex h-9 items-center justify-center text-[#C8FF00]">
            {item.icon}
          </div>
          <div className="whitespace-nowrap text-lg font-bold leading-none text-white">
            {item.value}
            {item.unit && (
              <span className="ml-1 text-sm font-semibold tracking-normal">{item.unit}</span>
            )}
          </div>
          <div className="mt-2 truncate text-[11px] text-[#888888]">{item.label}</div>
          {showComparisons && (
            <div
              className={`mt-3 text-[10px] font-bold ${item.good ? "text-[#C8FF00]" : "text-[#ff4d4d]"}`}
            >
              {item.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
