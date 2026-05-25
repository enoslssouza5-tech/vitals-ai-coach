import { Link } from "@tanstack/react-router";
import type React from "react";
import { Activity, Bell, ChevronRight, Flame, Footprints, Info, MapPin, Timer } from "lucide-react";
import { GoogleMapView } from "@/components/GoogleMapView";
import { fmtDuracao, type TreinoRegistro } from "@/lib/treino-history";
import { formatarDataCurta, kmTreino, nomeModalidade } from "@/lib/pulse-data";
import { demoPath } from "@/lib/pulse-design-data";

export function AppScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[390px] overflow-x-hidden px-4 pt-safe pb-[90px]">
      {children}
    </main>
  );
}

export function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 pt-7 pb-6">
      <div>
        <h1 className="text-2xl leading-tight font-bold tracking-[-0.3px] text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-base leading-snug text-[#888888]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 text-white">{right ?? <NotificationBell />}</div>
    </header>
  );
}

export function NotificationBell() {
  return (
    <button className="relative h-11 w-11 grid place-items-center" aria-label="Notificacoes">
      <Bell className="h-7 w-7" strokeWidth={1.8} />
      <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#C8FF00]" />
    </button>
  );
}

export function DesignCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`pulse-card overflow-hidden p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="min-w-0 flex items-center gap-3 text-base font-semibold text-white">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      {action && <div className="shrink-0 text-sm font-semibold text-[#C8FF00]">{action}</div>}
    </div>
  );
}

export function WeeklySummary({ showComparisons = true }: { showComparisons?: boolean }) {
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
}

export function VitalsHex({ value = 78, small = false }: { value?: number; small?: boolean }) {
  return (
    <div className={`relative grid place-items-center ${small ? "h-28 w-28" : "h-32 w-32"}`}>
      <div className="vitals-hex absolute inset-2" />
      <div className="relative text-center">
        <div className={`${small ? "text-[28px]" : "text-4xl"} font-bold text-[#C8FF00]`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function ActivityList({
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
}

function ActivityRow({
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
  const pace = km > 0 ? treino.duracaoSeg / 60 / km : 5.35;
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
            <span className="truncate">{fmtDuracao(treino.duracaoSeg).slice(3)}</span>
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
}

export function TrainingLoadCard() {
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
}

export function PageActionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <AppHeader
      title={title}
      right={
        <div className="flex items-center gap-3">
          {action}
          <NotificationBell />
        </div>
      }
    />
  );
}

export function SimpleMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-4">
      <div className="text-[#C8FF00]">{icon}</div>
      <div className="mt-5 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-[#888888]">{label}</div>
    </div>
  );
}

export function CoachButton({
  to = "/treino",
  children,
}: {
  to?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as never}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C8FF00] text-sm font-bold text-[#C8FF00]"
    >
      {children} <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function ProfileLocation({ city }: { city: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-[#888888]">
      <MapPin className="h-4 w-4" strokeWidth={1.5} />
      {city}
    </div>
  );
}

function shiftedPath(index: number): [number, number][] {
  const shift = index * 0.006;
  return demoPath.map(([lat, lng]) => [lat + shift, lng - shift]);
}
