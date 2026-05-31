import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Flame,
  Footprints,
  Search,
  Share2,
  SlidersHorizontal,
  Timer,
  TrendingUp,
} from "lucide-react";
import { GoogleMapView } from "@/components/GoogleMapView";
import { pulseActivities, periodStats, type PulseActivity } from "@/lib/pulse-mock";

export const Route = createFileRoute("/_app/atividades")({ component: Atividades });

const filters = ["Todas", "Corrida", "Bike", "Tênis", "Futebol", "Funcional"];
const periods = ["Esta semana", "Este mês", "Este ano", "Tudo"] as const;

function Atividades() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [period, setPeriod] = useState<(typeof periods)[number]>("Esta semana");
  const [selected, setSelected] = useState<PulseActivity | null>(null);

  const activities = useMemo(() => {
    return pulseActivities.filter((activity) => {
      const bySport = filter === "Todas" || activity.sport === filter;
      const byQuery = `${activity.title} ${activity.sport}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return bySport && byQuery;
    });
  }, [filter, query]);

  if (selected) {
    return <ActivityDetail activity={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <main className="screen-container bg-[#0A0A0A] pt-safe text-white">
      <header className="flex items-center justify-between pt-4 pb-4">
        <h1 className="text-2xl font-bold tracking-[-0.3px]">Atividades</h1>
        <button className="grid h-11 w-11 place-items-center rounded-full bg-[#1A1A1A] text-[#888888]">
          <SlidersHorizontal className="h-[22px] w-[22px]" strokeWidth={1.7} />
        </button>
      </header>

      <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[#1A1A1A] px-4 py-3 text-[#555555]">
        <Search className="h-5 w-5 shrink-0" strokeWidth={1.7} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar atividades..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#555555]"
        />
      </label>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`min-h-8 shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium whitespace-nowrap ${
              filter === item
                ? "border-[#C8FF00] bg-[#C8FF00] font-bold text-black"
                : "border-white/10 bg-[#1A1A1A] text-[#888888]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Stats do período</h2>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as typeof period)}
            className="h-9 rounded-lg border border-white/[0.08] bg-[#1A1A1A] px-3 text-[13px] text-white outline-none"
          >
            {periods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <StatsGrid values={periodStats[period]} />
      </section>

      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Lista completa</h2>
          <span className="text-xs font-semibold text-[#C8FF00]">{activities.length} treinos</span>
        </div>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={() => setSelected(activity)}
          />
        ))}
      </section>
    </main>
  );
}

function StatsGrid({ values }: { values: string[] }) {
  const items = [
    { icon: <Footprints />, label: "Distância", value: values[0] },
    { icon: <Timer />, label: "Tempo", value: values[1] },
    { icon: <TrendingUp />, label: "Ritmo médio", value: values[2] },
    { icon: <Flame />, label: "Calorias", value: values[3] },
  ];
  return (
    <div className="stats-grid-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-1.5 text-center first:pl-0 last:pr-0">
          <div className="mx-auto mb-3 flex h-8 items-center justify-center text-[#C8FF00] [&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.6]">
            {item.icon}
          </div>
          <div className="truncate text-lg font-bold">{item.value}</div>
          <div className="mt-2 truncate text-[11px] text-[#888888]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityCard({ activity, onClick }: { activity: PulseActivity; onClick: () => void }) {
  return (
    <button onClick={onClick} className="activity-card text-left">
      <div className="map-thumb">
        <GoogleMapView
          paths={[activity.route]}
          className="h-[72px] w-[72px] rounded-lg"
          interactive={false}
          showControls={false}
          defaultMode="roadmap"
          strokeWeight={3}
        />
      </div>
      <div className="content">
        <div className="text-base font-bold text-white">{activity.title}</div>
        <div className="mt-1 text-[13px] text-[#888888]">{activity.date}</div>
        <div className="mt-3 flex gap-2 text-xs text-[#888888]">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Footprints className="h-4 w-4 shrink-0" />{" "}
            <span className="truncate">{activity.distance}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Timer className="h-4 w-4 shrink-0" /> <span className="truncate">{activity.pace}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Timer className="h-4 w-4 shrink-0" /> <span className="truncate">{activity.time}</span>
          </span>
        </div>
      </div>
      <div className="right-col">
        <span
          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${activity.quality === "Excelente" ? "bg-[#2A1A00] text-[#FF9900]" : "bg-[#1A2A00] text-[#C8FF00]"}`}
        >
          {activity.quality}
        </span>
        <ChevronRight className="h-5 w-5 text-[#555555]" />
      </div>
    </button>
  );
}

function ActivityDetail({ activity, onBack }: { activity: PulseActivity; onBack: () => void }) {
  const stats = [
    ["Distância", activity.distance],
    ["Tempo", activity.time],
    ["Pace", activity.pace],
    ["Calorias", activity.calories],
    ["Elevação", activity.elevation],
    ["Passos", activity.steps],
  ];

  return (
    <main className="screen-container bg-[#0A0A0A] pt-safe text-white">
      <header className="flex items-center justify-between pt-5 pb-4">
        <button onClick={onBack} className="flex h-11 items-center gap-2 text-[#C8FF00]">
          <ChevronLeft className="h-5 w-5" /> Voltar
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-full bg-[#1A1A1A]">
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <GoogleMapView
        paths={[activity.route]}
        className="h-[240px] rounded-2xl"
        interactive={false}
        showControls={false}
        defaultMode="roadmap"
        strokeWeight={4}
        tilt={30}
      />

      <section className="mt-5">
        <h1 className="text-2xl font-bold tracking-[-0.3px]">{activity.title}</h1>
        <p className="mt-1 text-[#888888]">{activity.date}</p>
      </section>

      <section className="mt-5 grid-2col">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
            <div className="text-[11px] font-semibold text-[#888888]">{label}</div>
            <div className="mt-2 truncate text-[28px] font-bold text-[#C8FF00]">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <div className="mb-4 flex items-center gap-2 font-bold">
          <BarChart3 className="h-5 w-5 text-[#C8FF00]" /> Pace por km
        </div>
        <div className="flex h-32 items-end gap-2">
          {activity.paceBars.map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-[#C8FF00]" style={{ height: `${height}%` }} />
              <span className="text-[11px] text-[#888888]">{index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <h2 className="mb-3 text-lg font-bold">Splits</h2>
        <div className="space-y-2">
          {activity.splits.map((split) => (
            <div
              key={`${split.km}-${split.time}`}
              className="grid grid-cols-3 border-b border-white/[0.06] py-2 text-sm last:border-0"
            >
              <span className="text-[#888888]">Km {split.km}</span>
              <span className="text-center text-white">{split.time}</span>
              <span className="text-right text-[#C8FF00]">{split.pace}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
