import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock,
  Flame,
  Footprints,
  HeartPulse,
  MapPinOff,
  RouteIcon,
  Search,
  SlidersHorizontal,
  Target,
  Timer,
  Trophy,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleMapView } from "@/components/GoogleMapView";
import { calcularStreak, inicioDaSemana, kmTreino } from "@/lib/pulse-data";
import { listarTreinos, type TreinoRegistro } from "@/lib/treino-history";

export const Route = createFileRoute("/_app/atividades")({ component: Atividades });

const periods = ["Esta semana", "Este mes", "Este ano", "Tudo"] as const;
type Period = (typeof periods)[number];

type Insight = {
  id: string;
  icon: LucideIcon;
  text: string;
};

function Atividades() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [period, setPeriod] = useState<Period>("Esta semana");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const treinos = useMemo(() => ordenarTreinos(listarTreinos()), []);

  const filters = useMemo(() => {
    const modalidades = Array.from(new Set(treinos.map((treino) => treino.modalidade).filter(Boolean)));
    return ["Todas", ...modalidades.map(nomeModalidade)];
  }, [treinos]);

  const periodRange = useMemo(() => getPeriodRange(period), [period]);
  const currentPeriodTreinos = useMemo(
    () => filterByRange(treinos, periodRange.start, periodRange.end),
    [periodRange, treinos],
  );
  const previousPeriodTreinos = useMemo(
    () => filterByRange(treinos, periodRange.previousStart, periodRange.previousEnd),
    [periodRange, treinos],
  );
  const visibleTreinos = useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    return currentPeriodTreinos.filter((treino) => {
      const sportLabel = nomeModalidade(treino.modalidade);
      const bySport = filter === "Todas" || sportLabel === filter;
      const title = treinoTitle(treino).toLowerCase();
      const byQuery = !queryValue || `${title} ${sportLabel}`.toLowerCase().includes(queryValue);
      return bySport && byQuery;
    });
  }, [currentPeriodTreinos, filter, query]);

  const stats = useMemo(
    () => buildPeriodStats(currentPeriodTreinos, previousPeriodTreinos),
    [currentPeriodTreinos, previousPeriodTreinos],
  );
  const weeklyGoalKm = useMemo(() => readWeeklyGoal(), []);
  const weeklyTreinos = useMemo(() => filterByRange(treinos, inicioDaSemana(new Date()), new Date()), [treinos]);
  const weeklyStats = useMemo(() => buildPeriodStats(weeklyTreinos, []), [weeklyTreinos]);
  const insights = useMemo(
    () => buildWeeklyInsights({ treinos, weeklyTreinos, weeklyGoalKm }),
    [treinos, weeklyGoalKm, weeklyTreinos],
  );
  const destaque = useMemo(() => pickFeaturedWorkout(weeklyTreinos, treinos), [treinos, weeklyTreinos]);
  const timeline = useMemo(() => groupByDay(visibleTreinos), [visibleTreinos]);

  return (
    <main
      className="min-h-screen bg-[#0A0A0A] px-4 pt-safe text-white overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <motion.header
        className="flex items-center justify-between pt-5 pb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-[28px] font-black tracking-normal">Atividades</h1>
          <p className="mt-1 text-xs font-medium text-gray-500">Sua evolucao recente, treino por treino</p>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/5 bg-[#111111] text-[#888888] active:bg-white/5"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-[22px] w-[22px]" strokeWidth={1.7} />
        </button>
      </motion.header>

      <motion.label
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/5 bg-[#111111] px-4 py-3 text-[#555555]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.04, ease: "easeOut" }}
      >
        <Search className="h-5 w-5 shrink-0" strokeWidth={1.7} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar atividades..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#555555]"
        />
      </motion.label>

      <motion.div
        className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.08, ease: "easeOut" }}
      >
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`min-h-9 shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-bold transition-colors duration-200 active:scale-[0.98] ${
              filter === item
                ? "border-[#C8FF00] bg-[#C8FF00] text-black"
                : "border-white/10 bg-[#111111] text-[#888888]"
            }`}
          >
            {item}
          </button>
        ))}
      </motion.div>

      <WeeklySummarySection
        period={period}
        setPeriod={setPeriod}
        stats={stats}
        weeklyGoalKm={weeklyGoalKm}
        weeklyKm={weeklyStats.distanceKm}
      />

      {insights.length > 0 && <InsightsSection insights={insights} />}

      {destaque && <FeaturedWorkoutCard featured={destaque} />}

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Timeline de atividades</h2>
            <p className="mt-1 text-xs text-gray-500">
              {period} - {visibleTreinos.length} {visibleTreinos.length === 1 ? "treino" : "treinos"}
            </p>
          </div>
          <span className="text-xs font-black text-[#C8FF00]">{formatKm(stats.distanceKm)} km</span>
        </div>

        {timeline.length ? (
          <div className="space-y-5">
            {timeline.map((group) => (
              <div key={group.label}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                    {group.label}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                </div>
                <div className="space-y-3">
                  {group.items.map((treino, index) => (
                    <ActivityTimelineCard
                      key={treino.id}
                      treino={treino}
                      allTreinos={treinos}
                      isExpanded={expandedId === treino.id}
                      onToggle={() => setExpandedId((current) => (current === treino.id ? null : treino.id))}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyActivitiesState hasAnyTreino={treinos.length > 0} />
        )}
      </section>
    </main>
  );
}

function WeeklySummarySection({
  period,
  setPeriod,
  stats,
  weeklyGoalKm,
  weeklyKm,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  stats: PeriodStats;
  weeklyGoalKm: number | null;
  weeklyKm: number;
}) {
  const goalProgress = weeklyGoalKm ? Math.min(100, Math.round((weeklyKm / weeklyGoalKm) * 100)) : null;
  const remainingGoal = weeklyGoalKm ? Math.max(0, weeklyGoalKm - weeklyKm) : 0;

  return (
    <motion.section
      className="mt-5 rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.1, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black">Resumo da semana</h2>
          <p className="mt-1 text-xs text-gray-500">{stats.count} atividades no periodo</p>
        </div>
        <label className="relative">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            className="h-9 appearance-none rounded-xl border border-white/[0.08] bg-[#1A1A1A] pl-3 pr-8 text-[12px] font-bold text-white outline-none"
          >
            {periods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-500" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryMetric icon={Footprints} label="Distancia" value={`${formatKm(stats.distanceKm)} km`} delta={stats.distanceDelta} />
        <SummaryMetric icon={Timer} label="Tempo" value={formatDuration(stats.durationSeconds)} />
        <SummaryMetric icon={TrendingUp} label="Pace medio" value={formatPace(stats.averagePaceSec)} />
        <SummaryMetric icon={Flame} label="Calorias" value={`${Math.round(stats.calories)} kcal`} />
      </div>

      {weeklyGoalKm ? (
        <div className="mt-4 rounded-2xl border border-[#C8FF00]/10 bg-[#C8FF00]/[0.04] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
              <span className="text-xs font-black text-white">Meta semanal</span>
            </div>
            <span className="text-xs font-black text-[#C8FF00]">
              {formatKm(weeklyKm)} / {formatKm(weeklyGoalKm)} km
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${goalProgress}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            {goalProgress}% concluida{remainingGoal > 0 ? ` - faltam ${formatKm(remainingGoal)} km` : ""}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3 text-xs text-gray-500">
          Defina uma meta semanal para acompanhar progresso e fechamento da semana.
        </div>
      )}
    </motion.section>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-[#0A0A0A] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
        {typeof delta === "number" && (
          <span className={`text-[10px] font-black ${delta >= 0 ? "text-[#C8FF00]" : "text-[#FF6B6B]"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <p className="text-lg font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
    </div>
  );
}

function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <motion.section
      className="mt-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.14, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black">Insights da semana</h2>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C8FF00]">Dados reais</span>
      </div>
      <div className="grid gap-2">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111111] p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#C8FF00]/10">
                <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-medium leading-snug text-gray-300">{insight.text}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function FeaturedWorkoutCard({ featured }: { featured: FeaturedWorkout }) {
  const treino = featured.treino;
  const pontos = routePoints(treino);

  return (
    <motion.section
      className="mt-5 overflow-hidden rounded-2xl border border-[#C8FF00]/15 bg-[#111111]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.18, ease: "easeOut" }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C8FF00]/10">
              <Trophy className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8FF00]">Treino destaque</p>
              <h2 className="mt-1 text-lg font-black text-white">{treinoTitle(treino)}</h2>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500">{formatDateTime(treino.data).date}</span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-gray-400">{featured.reason}</p>
      </div>
      <RoutePreview pontos={pontos} className="h-52 w-full" title={treinoTitle(treino)} large />
      <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-[#0A0A0A]">
        <ActivityMetric label="Distancia" value={`${formatKm(kmTreino(treino))} km`} />
        <ActivityMetric label="Pace" value={activityPace(treino)} />
        <ActivityMetric label="Tempo" value={formatDuration(treino.duracaoSeg)} />
      </div>
    </motion.section>
  );
}

function ActivityTimelineCard({
  treino,
  allTreinos,
  isExpanded,
  onToggle,
  index,
}: {
  treino: TreinoRegistro;
  allTreinos: TreinoRegistro[];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const pontos = routePoints(treino);
  const insight = activityInsight(treino, allTreinos);
  const dateTime = formatDateTime(treino.data);

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileTap={{ scale: 0.985 }}
    >
      <button type="button" className="block w-full text-left" onClick={onToggle}>
        <RoutePreview pontos={pontos} className={isExpanded ? "h-64 w-full" : "h-44 w-full"} title={treinoTitle(treino)} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-white">{treinoTitle(treino)}</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {dateTime.date} - {dateTime.time}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
              {nomeModalidade(treino.modalidade)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CompactMetric label="KM" value={formatKm(kmTreino(treino))} />
            <CompactMetric label="Pace" value={activityPace(treino)} />
            <CompactMetric label="Tempo" value={formatDuration(treino.duracaoSeg)} />
          </div>

          {insight && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#C8FF00]/[0.06] px-3 py-2">
              <insight.icon className="h-3.5 w-3.5 shrink-0 text-[#C8FF00]" strokeWidth={1.8} />
              <span className="text-xs font-semibold leading-snug text-[#C8FF00]">{insight.text}</span>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="border-t border-white/[0.06] bg-[#0A0A0A] px-4 pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="grid grid-cols-2 gap-2 pt-4">
              <ExpandedMetric icon={Flame} label="Calorias" value={`${Math.round(treino.caloriasKcal ?? 0)} kcal`} />
              {typeof treino.fcMedia === "number" && (
                <ExpandedMetric icon={HeartPulse} label="FC media" value={`${Math.round(treino.fcMedia)} bpm`} />
              )}
              <ExpandedMetric icon={Activity} label="Modalidade" value={nomeModalidade(treino.modalidade)} />
              <ExpandedMetric icon={Clock} label="Inicio" value={dateTime.time} />
            </div>
            {pontos.length < 2 && (
              <p className="mt-3 rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-xs text-gray-500">
                Este treino nao possui rota GPS suficiente para mostrar o percurso completo.
              </p>
            )}
            {treino.analiseIA && (
              <p className="mt-3 rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-sm leading-relaxed text-gray-400">
                {treino.analiseIA}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function RoutePreview({
  pontos,
  className,
  title,
  large = false,
}: {
  pontos: [number, number][];
  className: string;
  title: string;
  large?: boolean;
}) {
  if (pontos.length < 2) {
    return (
      <div className={`${className} grid place-items-center bg-[#0A0A0A]`}>
        <div className="text-center">
          <MapPinOff className="mx-auto h-7 w-7 text-gray-600" strokeWidth={1.6} />
          <p className="mt-2 text-xs font-semibold text-gray-500">Sem rota GPS</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#0A0A0A] ${className}`}>
      <GoogleMapView
        paths={[pontos]}
        className="h-full w-full rounded-none opacity-95"
        interactive={false}
        showControls={false}
        fitToPath
        defaultMode="roadmap"
        strokeColor="#C8FF00"
        strokeWeight={large ? 5 : 4}
        tilt={large ? 30 : 0}
        terrain={false}
        ariaLabel={`Mapa da atividade ${title}`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111111] to-transparent" />
    </div>
  );
}

function ActivityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-base font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-gray-500">{label}</p>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0A0A0A] p-2 text-center">
      <p className="text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</p>
    </div>
  );
}

function ExpandedMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-3">
      <Icon className="mb-2 h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
      <p className="truncate text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
    </div>
  );
}

function EmptyActivitiesState({ hasAnyTreino }: { hasAnyTreino: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 text-center">
      <RouteIcon className="mx-auto h-8 w-8 text-gray-600" strokeWidth={1.6} />
      <p className="mt-3 text-sm font-bold text-white">
        {hasAnyTreino ? "Nenhuma atividade encontrada" : "Nenhuma atividade registrada ainda"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        {hasAnyTreino
          ? "Ajuste filtros ou busca para encontrar outros treinos."
          : "Complete seu primeiro treino para ver mapas, metricas e insights aqui."}
      </p>
    </div>
  );
}

type PeriodStats = {
  count: number;
  distanceKm: number;
  durationSeconds: number;
  calories: number;
  averagePaceSec: number | null;
  distanceDelta: number | null;
};

type FeaturedWorkout = {
  treino: TreinoRegistro;
  reason: string;
};

function buildPeriodStats(current: TreinoRegistro[], previous: TreinoRegistro[]): PeriodStats {
  const distanceKm = current.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const durationSeconds = current.reduce((sum, treino) => sum + Number(treino.duracaoSeg ?? 0), 0);
  const calories = current.reduce((sum, treino) => sum + Number(treino.caloriasKcal ?? 0), 0);
  const previousDistance = previous.reduce((sum, treino) => sum + kmTreino(treino), 0);
  return {
    count: current.length,
    distanceKm,
    durationSeconds,
    calories,
    averagePaceSec: distanceKm > 0 && durationSeconds > 0 ? durationSeconds / distanceKm : null,
    distanceDelta: previousDistance > 0 ? Math.round(((distanceKm - previousDistance) / previousDistance) * 100) : null,
  };
}

function buildWeeklyInsights({
  treinos,
  weeklyTreinos,
  weeklyGoalKm,
}: {
  treinos: TreinoRegistro[];
  weeklyTreinos: TreinoRegistro[];
  weeklyGoalKm: number | null;
}): Insight[] {
  const insights: Insight[] = [];
  const bestPace = bestPaceWorkout(weeklyTreinos);
  if (bestPace) {
    insights.push({ id: "best-pace", icon: Trophy, text: `Melhor ritmo da semana: ${activityPace(bestPace)}` });
  }

  const streak = calcularStreak(treinos);
  if (streak >= 2) {
    insights.push({ id: "streak", icon: Zap, text: `Sequencia ativa de ${streak} dias.` });
  }

  const currentWeekKm = weeklyTreinos.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const previousWeek = filterByRange(treinos, addDays(inicioDaSemana(new Date()), -7), inicioDaSemana(new Date()));
  const previousWeekKm = previousWeek.reduce((sum, treino) => sum + kmTreino(treino), 0);
  if (previousWeekKm > 0) {
    const delta = Math.round(((currentWeekKm - previousWeekKm) / previousWeekKm) * 100);
    insights.push({
      id: "volume-delta",
      icon: TrendingUp,
      text: `Volume ${delta >= 0 ? "+" : ""}${delta}% comparado a semana passada.`,
    });
  }

  if (weeklyGoalKm && weeklyGoalKm > currentWeekKm) {
    insights.push({
      id: "goal",
      icon: Target,
      text: `Faltam ${formatKm(weeklyGoalKm - currentWeekKm)} km para atingir sua meta semanal.`,
    });
  }

  const longest = longestWorkout(weeklyTreinos);
  if (longest && kmTreino(longest) > 0) {
    insights.push({
      id: "longest",
      icon: Footprints,
      text: `Maior distancia da semana: ${formatKm(kmTreino(longest))} km.`,
    });
  }

  return insights.slice(0, 4);
}

function pickFeaturedWorkout(weeklyTreinos: TreinoRegistro[], allTreinos: TreinoRegistro[]): FeaturedWorkout | null {
  if (!weeklyTreinos.length) return null;
  const best = bestPaceWorkout(weeklyTreinos);
  if (best) {
    const last14 = filterLastDays(allTreinos, 14);
    const best14 = bestPaceWorkout(last14);
    return {
      treino: best,
      reason:
        best14?.id === best.id
          ? "Seu melhor ritmo dos ultimos 14 dias."
          : "Treino com o melhor ritmo registrado nesta semana.",
    };
  }
  const longest = longestWorkout(weeklyTreinos);
  return longest ? { treino: longest, reason: "Maior distancia registrada nesta semana." } : null;
}

function activityInsight(treino: TreinoRegistro, allTreinos: TreinoRegistro[]): Insight | null {
  const week = filterByRange(allTreinos, inicioDaSemana(new Date(treino.data)), addDays(inicioDaSemana(new Date(treino.data)), 7));
  const bestWeek = bestPaceWorkout(week);
  if (bestWeek?.id === treino.id) return { id: "best-week", icon: Trophy, text: "Melhor ritmo da semana" };

  const month = filterByRange(allTreinos, startOfMonth(new Date(treino.data)), addMonths(startOfMonth(new Date(treino.data)), 1));
  const fastestMonth = bestPaceWorkout(month);
  if (fastestMonth?.id === treino.id && month.length >= 2) return { id: "fast-month", icon: Zap, text: "Treino mais rapido do mes" };

  const longest = longestWorkout(week);
  if (longest?.id === treino.id && kmTreino(treino) > 0) return { id: "longest-week", icon: Footprints, text: "Maior distancia da semana" };

  const previous = ordenarTreinos(allTreinos.filter((item) => new Date(item.data) < new Date(treino.data)))[0];
  if (previous && paceSeconds(treino) && paceSeconds(previous)) {
    const currentPace = paceSeconds(treino);
    const previousPace = paceSeconds(previous);
    if (currentPace && previousPace && currentPace < previousPace) {
      const delta = Math.round(((previousPace - currentPace) / previousPace) * 100);
      if (delta > 0) return { id: "faster-previous", icon: TrendingUp, text: `${delta}% mais rapido que o treino anterior` };
    }
  }

  return null;
}

function groupByDay(treinos: TreinoRegistro[]) {
  const groups = new Map<string, TreinoRegistro[]>();
  treinos.forEach((treino) => {
    const label = dayGroupLabel(new Date(treino.data));
    groups.set(label, [...(groups.get(label) ?? []), treino]);
  });
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function dayGroupLabel(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return target.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "").toUpperCase();
}

function getPeriodRange(period: Period) {
  const now = new Date();
  if (period === "Esta semana") {
    const start = inicioDaSemana(now);
    return { start, end: now, previousStart: addDays(start, -7), previousEnd: start };
  }
  if (period === "Este mes") {
    const start = startOfMonth(now);
    return { start, end: now, previousStart: addMonths(start, -1), previousEnd: start };
  }
  if (period === "Este ano") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start, end: now, previousStart: new Date(now.getFullYear() - 1, 0, 1), previousEnd: start };
  }
  return {
    start: new Date(0),
    end: now,
    previousStart: new Date(0),
    previousEnd: new Date(0),
  };
}

function filterByRange(treinos: TreinoRegistro[], start: Date, end: Date) {
  return treinos.filter((treino) => {
    const date = new Date(treino.data);
    return date >= start && date <= end;
  });
}

function filterLastDays(treinos: TreinoRegistro[], days: number) {
  const start = addDays(new Date(), -days);
  return treinos.filter((treino) => new Date(treino.data) >= start);
}

function ordenarTreinos(treinos: TreinoRegistro[]) {
  return [...treinos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

function bestPaceWorkout(treinos: TreinoRegistro[]) {
  return treinos
    .filter((treino) => paceSeconds(treino))
    .sort((a, b) => Number(paceSeconds(a)) - Number(paceSeconds(b)))[0] ?? null;
}

function longestWorkout(treinos: TreinoRegistro[]) {
  return treinos.sort((a, b) => kmTreino(b) - kmTreino(a))[0] ?? null;
}

function paceSeconds(treino: TreinoRegistro) {
  const km = kmTreino(treino);
  if (km <= 0 || !treino.duracaoSeg) return null;
  return treino.duracaoSeg / km;
}

function activityPace(treino: TreinoRegistro) {
  if (treino.ritmoMedio) return treino.ritmoMedio.replace("/km", "");
  return formatPace(paceSeconds(treino));
}

function routePoints(treino: TreinoRegistro): [number, number][] {
  return Array.isArray(treino.coordenadas) ? treino.coordenadas : [];
}

function treinoTitle(treino: TreinoRegistro) {
  return `${nomeModalidade(treino.modalidade)} ${formatKm(kmTreino(treino))} km`;
}

function nomeModalidade(value: string) {
  const map: Record<string, string> = {
    running: "Corrida",
    walking: "Caminhada",
    cycling: "Ciclismo",
    hiking: "Trilha",
    workout: "Funcional",
  };
  return map[value] ?? capitalize(value || "Treino");
}

function formatPace(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return "--";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}'${String(sec).padStart(2, "0")}"`;
}

function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function formatKm(value: number) {
  return value.toFixed(value >= 10 ? 1 : 2).replace(".", ",");
}

function readWeeklyGoal() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("pulse_weekly_goal");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { km?: number };
    return typeof parsed.km === "number" && parsed.km > 0 ? parsed.km : null;
  } catch {
    return null;
  }
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
