import React from "react";
import { ChevronRight, Footprints, Timer } from "lucide-react";
import { GoogleMapView } from "@/components/GoogleMapView";
import { fmtDuracao, type TreinoRegistro } from "@/lib/treino-history";
import { kmTreino } from "@/lib/pulse-data";
import { demoPath } from "@/lib/pulse-design-data";

function shiftedPath(index: number): [number, number][] {
  const shift = index * 0.006;
  return demoPath.map(([lat, lng]) => [lat + shift, lng - shift]) as [number, number][];
}

const ActivityRow = React.memo(function ActivityRow({
  treino,
  showBadge,
  index,
}: {
  treino: TreinoRegistro;
  showBadge: boolean;
  index: number;
}) {
  const km = kmTreino(treino);
  const path = treino.coordenadas?.length ? treino.coordenadas : shiftedPath(index);
  const title = `${Math.round(km || [5, 10, 7][index] || 5)}km • ${
    index === 1 ? "Longão" : index === 2 ? "Tempo Run" : "Rodagem"
  }`;
  const pace = km > 0 ? (treino.duracaoSeg ?? 0) / 60 / km : 5.35;
  const paceStr = `${Math.floor(pace)}'${String(Math.round((pace % 1) * 60)).padStart(2, "0")}” /km`;
  const date = index === 0 ? "Hoje • 07:15" : index === 1 ? "Ontem • 06:48" : "Sáb • 07:02";

  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <GoogleMapView
        paths={[path]}
        className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A]"
        interactive={false}
        showControls={false}
        defaultMode="roadmap"
        strokeWeight={3}
        ariaLabel="Miniatura do mapa da atividade"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold leading-tight text-white">{title}</div>
        <div className="mt-1 truncate text-[13px] text-[#888888]">{date}</div>
        <div className="mt-3 flex gap-x-3 overflow-hidden text-xs text-[#888888]">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Footprints className="h-4 w-4" strokeWidth={1.5} />{" "}
            <span className="truncate">{km ? km.toFixed(2).replace(".", ",") : "5,02"} km</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Timer className="h-4 w-4" strokeWidth={1.5} />{" "}
            <span className="truncate">{paceStr}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Timer className="h-4 w-4" strokeWidth={1.5} />{" "}
            <span className="truncate">{fmtDuracao(treino.duracaoSeg ?? 0).slice(3)}</span>
          </span>
        </div>
      </div>
      {showBadge && (
        <span className="quality-badge hidden shrink-0 sm:inline-flex">
          {index === 1 ? "Excelente" : "Muito bom"}
        </span>
      )}
      <ChevronRight className="h-5 w-5 shrink-0 text-[#555555]" strokeWidth={1.8} />
    </div>
  );
});

export const ActivityList = React.memo(function ActivityList({
  treinos,
  showBadge = true,
  limit = 3,
}: {
  treinos: TreinoRegistro[];
  showBadge?: boolean;
  limit?: number;
}) {
  const fallback: TreinoRegistro[] = [
    {
      id: "mock-5",
      data: new Date().toISOString(),
      modalidade: "running",
      duracaoSeg: 1612,
      distanciaMetros: 5020,
      caloriasKcal: 420,
    },
    {
      id: "mock-10",
      data: new Date(Date.now() - 86_400_000).toISOString(),
      modalidade: "running",
      duracaoSeg: 3085,
      distanciaMetros: 10010,
      caloriasKcal: 840,
    },
    {
      id: "mock-7",
      data: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      modalidade: "running",
      duracaoSeg: 2082,
      distanciaMetros: 7010,
      caloriasKcal: 590,
    },
  ];
  const items = (treinos.length ? treinos : fallback).slice(0, limit);

  return (
    <div className="divide-y divide-white/[0.06]">
      {items.map((treino, index) => (
        <ActivityRow key={treino.id} treino={treino} showBadge={showBadge} index={index} />
      ))}
    </div>
  );
});
