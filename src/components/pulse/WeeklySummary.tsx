import React from "react";
import { Activity, Flame, Footprints, Timer } from "lucide-react";

export const WeeklySummary = React.memo(function WeeklySummary({
  showComparisons = true,
}: {
  showComparisons?: boolean;
}) {
  const items = [
    {
      icon: <Footprints className="h-6 w-6" strokeWidth={1.5} />,
      value: "42,6",
      unit: "km",
      label: "Distancia",
      delta: "+12%",
      good: true,
    },
    {
      icon: <Timer className="h-6 w-6" strokeWidth={1.5} />,
      value: "4h32",
      unit: "",
      label: "Tempo",
      delta: "+8%",
      good: true,
    },
    {
      icon: <Activity className="h-6 w-6" strokeWidth={1.5} />,
      value: "5'22",
      unit: "",
      label: "Ritmo",
      delta: "-3%",
      good: true,
    },
    {
      icon: <Flame className="h-6 w-6" strokeWidth={1.5} />,
      value: "2.896",
      unit: "",
      label: "Kcal",
      delta: "+15%",
      good: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] px-2 py-3 text-center"
        >
          <div className="mx-auto mb-3 flex h-7 items-center justify-center text-[#C8FF00] opacity-85">
            {item.icon}
          </div>
          <div className="whitespace-nowrap text-[17px] font-black leading-none text-white">
            {item.value}
            {item.unit && (
              <span className="ml-1 text-[11px] font-black tracking-normal text-[#888888]">
                {item.unit}
              </span>
            )}
          </div>
          <div className="mt-2 truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#888888]">
            {item.label}
          </div>
          {showComparisons && (
            <div
              className={`mt-3 text-[10px] font-black ${item.good ? "text-[#C8FF00]" : "text-[#ff4d4d]"}`}
            >
              {item.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
