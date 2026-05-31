import React from "react";
import { Info, MapPin } from "lucide-react";
import { DesignCard } from "@/components/ui/DesignCard";

export const TrainingLoadCard = React.memo(function TrainingLoadCard() {
  const bars = [28, 34, 44, 38, 48, 62, 86];
  const days = ["S", "T", "Q", "S", "S", "S", "D"];
  return (
    <DesignCard className="min-h-[196px]">
      <div className="mb-5 flex items-center gap-2 text-lg font-bold">
        Carga de treino <Info className="h-4 w-4 text-[#888888]" strokeWidth={1.5} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[32px] font-black leading-none text-white">620</div>
          <div className="mt-1 text-base text-[#C8FF00]">Carga ideal</div>
          <div className="mt-1 text-sm text-[#888888]">Últimos 7 dias</div>
        </div>
        <div className="flex items-end gap-2">
          {bars.map((height, index) => (
            <div key={`${days[index]}-${index}`} className="flex flex-col items-center gap-2">
              <div
                className={`w-3 rounded-sm ${index === bars.length - 1 ? "bg-[#C8FF00]" : "bg-[#555555]"}`}
                style={{ height }}
              />
              <span className="text-[11px] text-[#888888]">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </DesignCard>
  );
});

export const ProfileLocation = React.memo(function ProfileLocation({ city }: { city: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-[#888888]">
      <MapPin className="h-4 w-4" strokeWidth={1.5} />
      {city}
    </div>
  );
});
