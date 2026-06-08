import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Flame,
  Footprints,
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
import { motion } from "framer-motion";
import { GoogleMapView } from "@/components/GoogleMapView";
import { calcularStreak, kmTreino } from "@/lib/pulse-data";
import { listarTreinos, type TreinoRegistro } from "@/lib/treino-history";

export const Route = createFileRoute("/_app/atividades")({ component: Atividades });

const sportFilters = ["Todas", "Corrida", "Bike", "Tenis", "Natacao", "Coletivos"] as const;
const periodOptions = ["Hoje", "7 dias", "30 dias", "90 dias", "Ano", "Personalizado"] as const;

type SportFilter = (typeof sportFilters)[number];
type Period = (typeof periodOptions)[number];

type Insight = {
  id: string;
  icon: LucideIcon;
  text: string;
};

function Atividades() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportFilter>("Todas");
  const [period, setPeriod] = useState<Period>("7 dias");
  const [customStart, setCustomStart] = useState(() => formatInputDate(addDays(new Date(), -6)));
  const [customEnd, setCustomEnd] = useState(() => formatInputDate(new Date()));
  const treinos = useMemo(() => ordenarTreinos(listarTreinos()), []);

  const periodRange = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [customEnd, customStart, period],
  );
  const periodLabel = periodCopy(period);
  const currentTreinos = useMemo(
    () => filterBySport(filterByRange(treinos, periodRange.start, periodRange.end), sport),
    [periodRange, sport, treinos],
  );
  const previousTreinos = useMemo(
    () =>
      filterBySport(
        filterByRange(treinos, periodRange.previousStart, periodRange.previousEnd),
        sport,
      ),
    [periodRange, sport, treinos],
  );
  const visibleTreinos = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return currentTreinos;
    return currentTreinos.filter((treino) =>
      `${treinoTitle(treino)} ${sportLabel(treino.modalidade)}`.toLowerCase().includes(value),
    );
  }, [currentTreinos, query]);

  const stats = useMemo(
    () => buildPeriodStats(currentTreinos, previousTreinos, sport),
    [currentTreinos, previousTreinos, sport],
  );
  const goal = useMemo(
    () => buildGoalProgress(readWeeklyGoal(), stats, periodLabel),
    [periodLabel, stats],
  );
  const insights = useMemo(
    () =>
      buildPeriodInsights({
        currentTreinos,
        previousTreinos,
        allTreinos: treinos,
        goal,
        stats,
        periodLabel,
      }),
    [currentTreinos, goal, periodLabel, previousTreinos, stats, treinos],
  );
  const destaque = useMemo(
    () => pickFeaturedWorkout(currentTreinos, treinos, periodLabel),
    [currentTreinos, periodLabel, treinos],
  );
  const heroText = useMemo(
    () => buildHeroText(stats, sport, periodLabel),
    [periodLabel, sport, stats],
  );

  return (
    <main
      className="min-h-screen overflow-y-auto bg-[#0A0A0A] px-4 pt-safe text-white pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5 pt-5"
      >
        <motion.header
          variants={sectionVariants}
          className="flex items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <h1 className="text-[28px] font-black leading-tight tracking-normal">Atividades</h1>
            <p className="mt-1 text-sm leading-snug text-[#6B7280]">{heroText}</p>
          </div>
          <button type="button" className={iconButtonClass} aria-label="Ajustar filtros" disabled>
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.7} />
          </button>
        </motion.header>

        <motion.label
          variants={sectionVariants}
          className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111111] px-4 text-[#6B7280]"
        >
          <Search className="h-5 w-5 shrink-0" strokeWidth={1.7} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar atividades"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6B7280]"
          />
        </motion.label>

        <motion.section variants={sectionVariants} className="space-y-3">
          <FilterRow label="Esporte">
            {sportFilters.map((item) => (
              <FilterChip key={item} active={sport === item} onClick={() => setSport(item)}>
                {item}
              </FilterChip>
            ))}
          </FilterRow>
        </motion.section>

        <SummarySection
          period={period}
          setPeriod={setPeriod}
          periodLabel={periodLabel}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          stats={stats}
          goal={goal}
        />

        <EvolutionSection insights={insights} />

        {destaque && <FeaturedWorkoutCard featured={destaque} periodLabel={periodLabel} />}

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white">Historico visual</h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                {visibleTreinos.length} {visibleTreinos.length === 1 ? "atividade" : "atividades"}{" "}
                em {periodLabel.context}
              </p>
            </div>
            {stats.distanceKm > 0 && (
              <span className="text-xs font-black text-[#C8FF00]">
                {formatKm(stats.distanceKm)} km
              </span>
            )}
          </div>

          {visibleTreinos.length ? (
            <div className="space-y-3">
              {visibleTreinos.map((treino, index) => (
                <ActivityCard
                  key={treino.id}
                  treino={treino}
                  allTreinos={treinos}
                  currentTreinos={currentTreinos}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyActivitiesState hasAnyTreino={treinos.length > 0} />
          )}
        </section>
      </motion.div>
    </main>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-2xl border px-4 text-[13px] font-black transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70 disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? "border-[#C8FF00] bg-[#C8FF00] text-black"
          : "border-white/[0.08] bg-[#111111] text-[#A3A3A3] hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </motion.button>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-white/[0.06] bg-[#111111] px-3 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-8 w-full bg-transparent text-sm font-bold text-white outline-none"
      />
    </label>
  );
}

function SummarySection({
  period,
  setPeriod,
  periodLabel,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  stats,
  goal,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  periodLabel: PeriodCopy;
  customStart: string;
  setCustomStart: (value: string) => void;
  customEnd: string;
  setCustomEnd: (value: string) => void;
  stats: PeriodStats;
  goal: GoalProgress | null;
}) {
  return (
    <motion.section
      variants={sectionVariants}
      className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">{periodLabel.summaryTitle}</h2>
          <p className="mt-1 text-xs text-[#6B7280]">{stats.count} atividades no periodo</p>
        </div>
        <label className="relative shrink-0">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            className="h-10 cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-[#1A1A1A] pl-3 pr-8 text-[11px] font-black text-white outline-none transition-colors duration-200 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70"
            aria-label="Selecionar periodo do resumo"
          >
            {periodOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-[#6B7280]" />
        </label>
      </div>

      {period === "Personalizado" && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <DateField label="Inicio" value={customStart} onChange={setCustomStart} />
          <DateField label="Fim" value={customEnd} onChange={setCustomEnd} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <SummaryMetric
          icon={Footprints}
          label="Distancia"
          value={`${formatKm(stats.distanceKm)} km`}
          delta={stats.distanceDelta}
        />
        <SummaryMetric
          icon={Timer}
          label="Tempo"
          value={formatDuration(stats.durationSeconds)}
          delta={stats.durationDelta}
        />
        <SummaryMetric
          icon={TrendingUp}
          label={stats.speedLabel}
          value={stats.speedValue}
          delta={stats.paceDelta}
          invertedDelta
        />
        <SummaryMetric icon={Flame} label="Calorias" value={`${Math.round(stats.calories)} kcal`} />
      </div>

      {goal ? <GoalCard goal={goal} /> : <GoalEmptyState />}
    </motion.section>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  delta,
  invertedDelta = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number | null;
  invertedDelta?: boolean;
}) {
  const positive = typeof delta === "number" && (invertedDelta ? delta <= 0 : delta >= 0);
  return (
    <div className="relative flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0A0A0A] p-4 text-center">
      <div className="mb-3 grid h-6 place-items-center">
        <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
        {typeof delta === "number" && (
          <span
            className={`absolute right-3 top-3 text-[10px] font-black ${positive ? "text-[#C8FF00]" : "text-[#FF6B6B]"}`}
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <p className="max-w-full truncate text-lg font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </p>
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalProgress }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#C8FF00]/10 bg-[#C8FF00]/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
          <span className="text-xs font-black text-white">{goal.title}</span>
        </div>
        <span className="text-xs font-black text-[#C8FF00]">
          {formatKm(goal.currentKm)} / {formatKm(goal.targetKm)} km
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full bg-[#C8FF00]"
          initial={{ width: 0 }}
          animate={{ width: `${goal.percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-[11px] text-[#A3A3A3]">
        {goal.percent}% concluida
        {goal.remainingKm > 0 ? ` - faltam ${formatKm(goal.remainingKm)} km` : ""}
      </p>
    </div>
  );
}

function GoalEmptyState() {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3">
      <p className="text-xs leading-relaxed text-[#A3A3A3]">
        Defina uma meta para acompanhar seu progresso.
      </p>
      <Link to="/dashboard" className={secondaryButtonClass}>
        Criar meta
      </Link>
    </div>
  );
}

function EvolutionSection({ insights }: { insights: Insight[] }) {
  return (
    <motion.section variants={sectionVariants}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black">Sua Evolucao</h2>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C8FF00]">
          Dados reais
        </span>
      </div>
      {insights.length ? (
        <div className="grid gap-2">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111111] p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.04, ease: "easeOut" }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#C8FF00]/10">
                  <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-medium leading-snug text-[#D1D5DB]">{insight.text}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4 text-sm text-[#A3A3A3]">
          Complete mais atividades para desbloquear seus destaques.
        </div>
      )}
    </motion.section>
  );
}

function FeaturedWorkoutCard({
  featured,
  periodLabel,
}: {
  featured: FeaturedWorkout;
  periodLabel: PeriodCopy;
}) {
  const treino = featured.treino;
  const pontos = routePoints(treino);

  return (
    <motion.section
      variants={sectionVariants}
      className="overflow-hidden rounded-2xl border border-[#C8FF00]/15 bg-[#111111]"
      whileTap={{ scale: 0.992 }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C8FF00]/10">
              <Trophy className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8FF00]">
                Destaque {periodLabel.of}
              </p>
              <h2 className="mt-1 text-lg font-black text-white">{treinoTitle(treino)}</h2>
            </div>
          </div>
          <span className="text-xs font-bold text-[#6B7280]">
            {formatDateTime(treino.data).date}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-[#A3A3A3]">{featured.reason}</p>
      </div>
      <Link
        to="/atividade/$activityId"
        params={{ activityId: treino.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70"
      >
        <RoutePreview
          pontos={pontos}
          className="h-52 w-full"
          title={treinoTitle(treino)}
          large
          layoutId={`activity-map-${treino.id}`}
        />
      </Link>
      <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-[#0A0A0A]">
        <ActivityMetric label="Distancia" value={`${formatKm(kmTreino(treino))} km`} />
        <ActivityMetric label={metricLabelFor(treino.modalidade)} value={activityPace(treino)} />
        <ActivityMetric label="Tempo" value={formatDuration(treino.duracaoSeg)} />
      </div>
      <div className="border-t border-white/5 p-3">
        <Link
          to="/atividade/$activityId"
          params={{ activityId: treino.id }}
          className={primaryButtonClass}
        >
          Ver detalhes
        </Link>
      </div>
    </motion.section>
  );
}

function ActivityCard({
  treino,
  allTreinos,
  currentTreinos,
  index,
}: {
  treino: TreinoRegistro;
  allTreinos: TreinoRegistro[];
  currentTreinos: TreinoRegistro[];
  index: number;
}) {
  const pontos = routePoints(treino);
  const insight = activityInsight(treino, allTreinos, currentTreinos);
  const dateTime = formatDateTime(treino.data);

  return (
    <motion.article
      className={`overflow-hidden rounded-2xl border bg-[#111111] ${insight ? "border-[#C8FF00]/20" : "border-white/[0.06]"}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.035, ease: "easeOut" }}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        to="/atividade/$activityId"
        params={{ activityId: treino.id }}
        className="block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70"
      >
        <RoutePreview
          pontos={pontos}
          className="h-44 w-full"
          title={treinoTitle(treino)}
          layoutId={`activity-map-${treino.id}`}
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-white">{treinoTitle(treino)}</h3>
              <p className="mt-1 text-xs font-medium text-[#6B7280]">
                {dateTime.relative} - {dateTime.time}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#A3A3A3]">
              {sportLabel(treino.modalidade)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CompactMetric label="KM" value={formatKm(kmTreino(treino))} />
            <CompactMetric label={metricLabelFor(treino.modalidade)} value={activityPace(treino)} />
            <CompactMetric label="Tempo" value={formatDuration(treino.duracaoSeg)} />
          </div>

          {insight && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#C8FF00]/[0.06] px-3 py-2">
              <insight.icon className="h-3.5 w-3.5 shrink-0 text-[#C8FF00]" strokeWidth={1.8} />
              <span className="text-xs font-semibold leading-snug text-[#C8FF00]">
                {insight.text}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

function RoutePreview({
  pontos,
  className,
  title,
  large = false,
  layoutId,
}: {
  pontos: [number, number][];
  className: string;
  title: string;
  large?: boolean;
  layoutId?: string;
}) {
  if (pontos.length < 2) {
    return (
      <motion.div
        layoutId={layoutId}
        className={`${className} grid place-items-center bg-[#0A0A0A]`}
      >
        <div className="text-center">
          <MapPinOff className="mx-auto h-7 w-7 text-[#6B7280]" strokeWidth={1.6} />
          <p className="mt-2 text-xs font-semibold text-[#6B7280]">Rota indisponivel</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative overflow-hidden bg-[#0A0A0A] ${className}`}
    >
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
    </motion.div>
  );
}

function ActivityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-base font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#6B7280]">
        {label}
      </p>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0A0A0A] p-2 text-center">
      <p className="text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </p>
    </div>
  );
}

function EmptyActivitiesState({ hasAnyTreino }: { hasAnyTreino: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 text-center">
      <RouteIcon className="mx-auto h-8 w-8 text-[#6B7280]" strokeWidth={1.6} />
      <p className="mt-3 text-sm font-bold text-white">
        {hasAnyTreino
          ? "Nenhuma atividade encontrada neste periodo."
          : "Nenhuma atividade registrada ainda."}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
        {hasAnyTreino
          ? "Ajuste o esporte, periodo ou busca para encontrar outros treinos."
          : "Registre uma atividade para ver mapas, metricas e evolucao aqui."}
      </p>
      <Link to="/treino" className={`${primaryButtonClass} mt-4`}>
        Registrar atividade
      </Link>
    </div>
  );
}

type PeriodStats = {
  count: number;
  distanceKm: number;
  durationSeconds: number;
  calories: number;
  averagePaceSec: number | null;
  averageSpeedKmh: number | null;
  speedLabel: string;
  speedValue: string;
  distanceDelta: number | null;
  durationDelta: number | null;
  paceDelta: number | null;
};

type GoalProgress = {
  title: string;
  currentKm: number;
  targetKm: number;
  percent: number;
  remainingKm: number;
};

type FeaturedWorkout = {
  treino: TreinoRegistro;
  reason: string;
};

type PeriodCopy = {
  short: string;
  context: string;
  summaryTitle: string;
  goalTitle: string;
  of: string;
};

function buildPeriodStats(
  current: TreinoRegistro[],
  previous: TreinoRegistro[],
  sport: SportFilter,
): PeriodStats {
  const distanceKm = current.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const durationSeconds = current.reduce((sum, treino) => sum + Number(treino.duracaoSeg ?? 0), 0);
  const calories = current.reduce((sum, treino) => sum + Number(treino.caloriasKcal ?? 0), 0);
  const previousDistance = previous.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const previousDuration = previous.reduce(
    (sum, treino) => sum + Number(treino.duracaoSeg ?? 0),
    0,
  );
  const averagePaceSec =
    distanceKm > 0 && durationSeconds > 0 ? durationSeconds / distanceKm : null;
  const previousPace =
    previousDistance > 0 && previousDuration > 0 ? previousDuration / previousDistance : null;
  const averageSpeedKmh = durationSeconds > 0 ? distanceKm / (durationSeconds / 3600) : null;
  const speedLabel =
    sport === "Bike"
      ? "Velocidade media"
      : sport === "Todas"
        ? "Ritmo medio"
        : metricLabelForSport(sport);
  const speedValue = sport === "Bike" ? formatSpeed(averageSpeedKmh) : formatPace(averagePaceSec);

  return {
    count: current.length,
    distanceKm,
    durationSeconds,
    calories,
    averagePaceSec,
    averageSpeedKmh,
    speedLabel,
    speedValue,
    distanceDelta:
      previousDistance > 0
        ? Math.round(((distanceKm - previousDistance) / previousDistance) * 100)
        : null,
    durationDelta:
      previousDuration > 0
        ? Math.round(((durationSeconds - previousDuration) / previousDuration) * 100)
        : null,
    paceDelta:
      previousPace && averagePaceSec
        ? Math.round(((averagePaceSec - previousPace) / previousPace) * 100)
        : null,
  };
}

function buildGoalProgress(
  weeklyGoalKm: number | null,
  stats: PeriodStats,
  periodLabel: PeriodCopy,
): GoalProgress | null {
  if (periodLabel.goalTitle !== "Meta semanal") return null;
  if (!weeklyGoalKm || weeklyGoalKm <= 0) return null;
  const percent = Math.min(100, Math.round((stats.distanceKm / weeklyGoalKm) * 100));
  return {
    title: periodLabel.goalTitle,
    currentKm: stats.distanceKm,
    targetKm: weeklyGoalKm,
    percent,
    remainingKm: Math.max(0, weeklyGoalKm - stats.distanceKm),
  };
}

function buildPeriodInsights({
  currentTreinos,
  previousTreinos,
  allTreinos,
  goal,
  stats,
  periodLabel,
}: {
  currentTreinos: TreinoRegistro[];
  previousTreinos: TreinoRegistro[];
  allTreinos: TreinoRegistro[];
  goal: GoalProgress | null;
  stats: PeriodStats;
  periodLabel: PeriodCopy;
}): Insight[] {
  const insights: Insight[] = [];
  const bestPace = bestPaceWorkout(currentTreinos);
  if (bestPace) {
    insights.push({
      id: "best-pace",
      icon: Trophy,
      text: `Melhor ritmo ${periodLabel.of}: ${activityPace(bestPace)}.`,
    });
  }

  const streak = calcularStreak(allTreinos);
  if (streak >= 2)
    insights.push({ id: "streak", icon: Zap, text: `Sequencia ativa de ${streak} dias.` });

  const previousDistance = previousTreinos.reduce((sum, treino) => sum + kmTreino(treino), 0);
  if (previousDistance > 0 && typeof stats.distanceDelta === "number") {
    insights.push({
      id: "volume-delta",
      icon: TrendingUp,
      text: `Volume ${stats.distanceDelta >= 0 ? "+" : ""}${stats.distanceDelta}% comparado ao periodo anterior.`,
    });
  }

  if (goal && goal.remainingKm > 0) {
    insights.push({
      id: "goal",
      icon: Target,
      text: `Faltam ${formatKm(goal.remainingKm)} km para atingir sua meta.`,
    });
  }

  const longest = longestWorkout(currentTreinos);
  if (longest && kmTreino(longest) > 0) {
    insights.push({
      id: "longest",
      icon: Footprints,
      text: `Maior distancia ${periodLabel.of}: ${formatKm(kmTreino(longest))} km.`,
    });
  }

  return insights.slice(0, 4);
}

function pickFeaturedWorkout(
  currentTreinos: TreinoRegistro[],
  allTreinos: TreinoRegistro[],
  periodLabel: PeriodCopy,
): FeaturedWorkout | null {
  if (!currentTreinos.length) return null;
  const longest = longestWorkout(currentTreinos);
  const best = bestPaceWorkout(currentTreinos);
  if (longest && (!best || kmTreino(longest) >= kmTreino(best) * 1.25)) {
    return { treino: longest, reason: `Maior distancia registrada ${periodLabel.of}.` };
  }
  if (best) {
    const similar = allTreinos.filter(
      (treino) => treino.modalidade === best.modalidade && treino.id !== best.id,
    );
    const historicalBest = bestPaceWorkout(similar);
    return {
      treino: best,
      reason:
        historicalBest && paceSeconds(best)! < paceSeconds(historicalBest)!
          ? "Melhor ritmo comparado ao seu historico desta modalidade."
          : `Treino com melhor ritmo ${periodLabel.of}.`,
    };
  }
  return longest
    ? { treino: longest, reason: `Maior duracao registrada ${periodLabel.of}.` }
    : null;
}

function activityInsight(
  treino: TreinoRegistro,
  allTreinos: TreinoRegistro[],
  currentTreinos: TreinoRegistro[],
): Insight | null {
  const bestPeriod = bestPaceWorkout(currentTreinos);
  if (bestPeriod?.id === treino.id)
    return { id: "best-period", icon: Trophy, text: "Melhor ritmo do periodo" };

  const longest = longestWorkout(currentTreinos);
  if (longest?.id === treino.id && kmTreino(treino) > 0)
    return { id: "longest-period", icon: Footprints, text: "Maior distancia do periodo" };

  const previousSimilar = ordenarTreinos(
    allTreinos.filter(
      (item) =>
        item.modalidade === treino.modalidade && new Date(item.data) < new Date(treino.data),
    ),
  )[0];
  const currentPace = paceSeconds(treino);
  const previousPace = previousSimilar ? paceSeconds(previousSimilar) : null;
  if (currentPace && previousPace && currentPace < previousPace) {
    const delta = Math.round(((previousPace - currentPace) / previousPace) * 100);
    if (delta > 0)
      return {
        id: "faster-previous",
        icon: TrendingUp,
        text: `${delta}% mais rapido que a atividade similar anterior`,
      };
  }

  return null;
}

function getPeriodRange(period: Period, customStart: string, customEnd: string) {
  const now = new Date();
  if (period === "Hoje") {
    const start = startOfDay(now);
    return { start, end: now, previousStart: addDays(start, -1), previousEnd: start };
  }
  if (period === "7 dias") return rollingRange(7);
  if (period === "30 dias") return rollingRange(30);
  if (period === "90 dias") return rollingRange(90);
  if (period === "Ano") {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      end: now,
      previousStart: new Date(now.getFullYear() - 1, 0, 1),
      previousEnd: start,
    };
  }
  const start = startOfDay(parseInputDate(customStart, addDays(now, -6)));
  const end = endOfDay(parseInputDate(customEnd, now));
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  return { start, end, previousStart: addDays(start, -days), previousEnd: start };
}

function rollingRange(days: number) {
  const end = new Date();
  const start = startOfDay(addDays(end, -(days - 1)));
  return { start, end, previousStart: addDays(start, -days), previousEnd: start };
}

function periodCopy(period: Period): PeriodCopy {
  const map: Record<Period, PeriodCopy> = {
    Hoje: {
      short: "Hoje",
      context: "hoje",
      summaryTitle: "Resumo do dia",
      goalTitle: "Meta do dia",
      of: "do dia",
    },
    "7 dias": {
      short: "7 dias",
      context: "nos ultimos 7 dias",
      summaryTitle: "Resumo da semana",
      goalTitle: "Meta semanal",
      of: "da semana",
    },
    "30 dias": {
      short: "30 dias",
      context: "nos ultimos 30 dias",
      summaryTitle: "Resumo do mes",
      goalTitle: "Meta mensal",
      of: "do mes",
    },
    "90 dias": {
      short: "90 dias",
      context: "nos ultimos 90 dias",
      summaryTitle: "Resumo dos ultimos 90 dias",
      goalTitle: "Meta do periodo",
      of: "do periodo",
    },
    Ano: {
      short: "Ano",
      context: "neste ano",
      summaryTitle: "Resumo do ano",
      goalTitle: "Meta anual",
      of: "do ano",
    },
    Personalizado: {
      short: "Personalizado",
      context: "no periodo",
      summaryTitle: "Resumo do periodo",
      goalTitle: "Meta do periodo",
      of: "do periodo",
    },
  };
  return map[period];
}

function buildHeroText(stats: PeriodStats, sport: SportFilter, periodLabel: PeriodCopy) {
  if (stats.count === 0) return "Nenhuma atividade encontrada neste periodo";
  const sportText = sport === "Todas" ? "treinos" : sport.toLowerCase();
  if (stats.distanceKm > 0) return `${formatKm(stats.distanceKm)} km em ${periodLabel.context}`;
  return `${stats.count} ${stats.count === 1 ? "atividade" : sportText} concluidos ${periodLabel.context}`;
}

function filterBySport(treinos: TreinoRegistro[], sport: SportFilter) {
  if (sport === "Todas") return treinos;
  return treinos.filter((treino) => sportCategory(treino.modalidade) === sport);
}

function sportCategory(value: string): SportFilter {
  const normalized = value.toLowerCase();
  if (["running", "run", "corrida", "walking", "hiking"].includes(normalized)) return "Corrida";
  if (["cycling", "bike", "ciclismo"].includes(normalized)) return "Bike";
  if (["tennis", "tenis"].includes(normalized)) return "Tenis";
  if (["swimming", "natacao"].includes(normalized)) return "Natacao";
  if (["soccer", "football", "basketball", "volleyball", "coletivo"].includes(normalized))
    return "Coletivos";
  return "Todas";
}

function filterByRange(treinos: TreinoRegistro[], start: Date, end: Date) {
  return treinos.filter((treino) => {
    const date = new Date(treino.data);
    return date >= start && date <= end;
  });
}

function ordenarTreinos(treinos: TreinoRegistro[]) {
  return [...treinos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

function bestPaceWorkout(treinos: TreinoRegistro[]) {
  return (
    treinos
      .filter((treino) => paceSeconds(treino))
      .sort((a, b) => Number(paceSeconds(a)) - Number(paceSeconds(b)))[0] ?? null
  );
}

function longestWorkout(treinos: TreinoRegistro[]) {
  return [...treinos].sort((a, b) => kmTreino(b) - kmTreino(a))[0] ?? null;
}

function paceSeconds(treino: TreinoRegistro) {
  const km = kmTreino(treino);
  if (km <= 0 || !treino.duracaoSeg) return null;
  return treino.duracaoSeg / km;
}

function activityPace(treino: TreinoRegistro) {
  if (sportCategory(treino.modalidade) === "Bike") {
    const speed = treino.duracaoSeg > 0 ? kmTreino(treino) / (treino.duracaoSeg / 3600) : null;
    return formatSpeed(speed);
  }
  if (treino.ritmoMedio) return treino.ritmoMedio.replace("/km", "");
  return formatPace(paceSeconds(treino));
}

function routePoints(treino: TreinoRegistro): [number, number][] {
  return Array.isArray(treino.coordenadas) ? treino.coordenadas : [];
}

function treinoTitle(treino: TreinoRegistro) {
  const distance = kmTreino(treino);
  return distance > 0
    ? `${formatKm(distance)} km - ${sportLabel(treino.modalidade)}`
    : sportLabel(treino.modalidade);
}

function sportLabel(value: string) {
  const map: Record<string, string> = {
    running: "Corrida",
    walking: "Caminhada",
    cycling: "Bike",
    hiking: "Trilha",
    workout: "Funcional",
    swimming: "Natacao",
    tennis: "Tenis",
  };
  return map[value] ?? capitalize(value || "Treino");
}

function metricLabelFor(modalidade: string) {
  return sportCategory(modalidade) === "Bike" ? "Veloc." : "Pace";
}

function metricLabelForSport(sport: SportFilter) {
  return sport === "Bike" ? "Velocidade media" : "Pace medio";
}

function formatPace(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return "--";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}'${String(sec).padStart(2, "0")}"`;
}

function formatSpeed(value: number | null) {
  if (!value || !Number.isFinite(value)) return "--";
  return `${value.toFixed(1).replace(".", ",")} km/h`;
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
    relative: dayRelativeLabel(date),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function dayRelativeLabel(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return target.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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

function parseInputDate(value: string, fallback: Date) {
  const parsed = value ? new Date(`${value}T00:00:00`) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const primaryButtonClass =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#C8FF00] px-4 text-center text-[13px] font-black text-black transition-colors duration-200 hover:bg-[#D8FF38] active:bg-[#B6EA00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70 disabled:pointer-events-none disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/[0.1] bg-[#111111] px-4 text-center text-[12px] font-black text-white transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.04] active:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70 disabled:pointer-events-none disabled:opacity-50";

const iconButtonClass =
  "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border border-white/[0.06] bg-[#111111] text-[#A3A3A3] transition-colors duration-200 hover:border-white/20 hover:text-white active:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70 disabled:cursor-not-allowed disabled:opacity-50";
