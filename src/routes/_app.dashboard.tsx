import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityList } from "@/components/PulseUI";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
  calcularStreak,
  dataISO,
  lerPerfil,
  lerRecuperacao,
  kmTreino,
  obterClimaAtual,
  treinosDaSemana,
  ultimoTreino,
  type RecuperacaoDia,
  type ClimaAtual,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import {
  Activity,
  Calendar,
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Flag,
  Flame,
  Footprints,
  Info,
  MapPin,
  Moon,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Target,
  Thermometer,
  Timer,
  Trophy,
  TrendingUp,
  WifiOff,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { TreinoRegistro } from "@/lib/treino-history";

const containerVariants = {
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type HeroState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string; cta: { label: string; to: "/treino" | "/perfil" } }
  | { status: "ready"; message: string };

type SavedRace = {
  nome?: string;
  name?: string;
  titulo?: string;
  title?: string;
  data?: string;
  date?: string;
  eventDate?: string;
  targetKm?: number;
  metaKm?: number;
};

function Dashboard() {
  const fallbackBriefing =
    "Hoje pede controle: comece leve, mantenha ritmo sustentavel e termine com sobra. O treino bom e o que voce consegue repetir.";
  const [briefing, setBriefing] = useState(fallbackBriefing);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const perfil = useMemo(() => lerPerfil(), []);
  const recuperacao = useMemo(() => lerRecuperacao().at(-1), []);
  const treinos = useMemo(() => listarTreinos(), []);
  const currentWeekKm = useMemo(
    () => treinosDaSemana(treinos).reduce((sum, treino) => sum + kmTreino(treino), 0),
    [treinos],
  );
  const firstName = (perfil.nome || "Atleta").split(" ")[0];
  const [heroState, setHeroState] = useState<HeroState>({ status: "loading" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroState(buildHeroInsight({ treinos, currentWeekKm }));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [currentWeekKm, treinos]);

  useEffect(() => {
    let cancelled = false;
    async function carregarBriefing() {
      try {
        const climaAtual = await obterClimaAtual();
        if (cancelled) return;
        setClima(climaAtual);
        const texto = await gerarTextoAnthropic({
          system:
            "Voce e um coach esportivo. Gere uma recomendacao curta, especifica e humana em portugues. Use Pulse Coach, nunca use o termo IA.",
          prompt: JSON.stringify({ ultimoTreino: ultimoTreino(), recuperacao, clima: climaAtual }),
          fallback: fallbackBriefing,
          storageKey: `briefing-${dataISO(new Date())}`,
        });
        if (!cancelled) setBriefing(texto);
      } catch {
        if (!cancelled) setBriefing(fallbackBriefing);
      }
    }
    carregarBriefing();
    return () => {
      cancelled = true;
    };
  }, [fallbackBriefing, recuperacao]);

  return (
    <main
      className="min-h-screen bg-[#0A0A0A] overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <HomeHero firstName={firstName} state={heroState} />

      <motion.div
        className="px-4 space-y-3"
        variants={containerVariants}
        initial={false}
        animate="show"
      >
        <ScrollRevealSection className="w-full bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C8FF00]" strokeWidth={1.7} />
              SEMANA
            </h2>
            <Link
              to="/atividades"
              className="text-xs font-bold text-[#C8FF00] flex items-center gap-0.5"
            >
              DETALHES <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <WeeklySummaryCards />
        </ScrollRevealSection>

        <ScrollRevealBlock>
          <WeatherCard city={perfil.cidade || "Sao Paulo"} />
        </ScrollRevealBlock>

        {clima && clima.temp > 30 && (
          <ScrollRevealSection className="w-full bg-[#1A1A1A] rounded-2xl p-4 border border-[#C8FF00]/20">
            <p className="text-sm leading-relaxed text-[#A0A0A0]">
              Calor alto hoje: {clima.temp} C. Hidrate-se antes do treino.
            </p>
          </ScrollRevealSection>
        )}

        <ScrollRevealSection className="w-full bg-[#111111] rounded-2xl p-4 border border-[#C8FF00]/20 overflow-hidden">
          <div className="inline-flex items-center gap-1.5 bg-[#C8FF00]/10 rounded-full px-3 py-1 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C8FF00]" strokeWidth={1.7} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8FF00]">
              Pulse Coach
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-2xl font-black text-white leading-tight">
                Proximo nivel, sem quebrar.
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">{briefing}</p>
            </div>
            <ReadinessRing value={82} />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <SignalMetric label="TSB" value="-4" status="ideal" />
            <SignalMetric label="Sono" value="7h20" status="ok" />
            <SignalMetric label="VITALs" value="78" status="bom" />
          </div>

          <button
            type="button"
            className="w-full mt-4 h-12 rounded-2xl border border-[#C8FF00] bg-transparent flex items-center justify-center gap-2 active:bg-[#C8FF00]/10 transition-colors duration-150"
          >
            <span className="text-sm font-bold text-[#C8FF00]">Ver treino recomendado</span>
            <span className="text-[#C8FF00]">›</span>
          </button>
        </ScrollRevealSection>

        <ScrollRevealSection className="w-full rounded-2xl border border-white/5 bg-[#111111] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">Atividades recentes</h2>
              <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                Resumo dos ultimos treinos
              </p>
            </div>
            <Link
              to="/atividades"
              className="group flex h-9 items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-3 text-xs font-bold text-[#C8FF00] transition-colors duration-150 hover:bg-white/[0.06] active:bg-[#C8FF00]/10"
            >
              Ver todas
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform duration-150 group-active:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl border border-white/5 bg-[#0A0A0A] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8FF00]/10">
                <Trophy className="h-3.5 w-3.5 text-[#C8FF00]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Melhoria recente no pace</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Recorde pessoal nos ultimos 30 dias
                </p>
              </div>
            </div>
            <span className="ml-3 shrink-0 text-[10px] font-semibold text-[#C8FF00]">+3%</span>
          </div>
          <ActivityList treinos={treinos} showBadge limit={3} />
        </ScrollRevealSection>

        <ScrollRevealBlock className="grid grid-cols-2 gap-3">
          <ReadinessCard fallbackCheckin={recuperacao} />
          <WeeklyFocusCard currentKm={currentWeekKm} defaultTargetKm={perfil.metaSemanalKm || 20} />
        </ScrollRevealBlock>
      </motion.div>
    </main>
  );
}

function useDashboardScrollMotion() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "end 18%"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [20, -10]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.96, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.28, 1], [0, 1, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.42, 1], [3, 0, 0]);

  return {
    ref,
    style: {
      y,
      scale,
      opacity,
      rotateX,
      transformPerspective: 1000,
      transformOrigin: "center top",
    },
  };
}

function ScrollRevealSection({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scrollMotion = useDashboardScrollMotion();

  return (
    <motion.section
      ref={scrollMotion.ref}
      className={className}
      style={scrollMotion.style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22 }}
      variants={itemVariants}
    >
      {children}
    </motion.section>
  );
}

function ScrollRevealBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scrollMotion = useDashboardScrollMotion();

  return (
    <motion.div
      ref={scrollMotion.ref as React.Ref<HTMLDivElement>}
      className={className}
      style={scrollMotion.style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22 }}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
}

function HomeHero({ firstName, state }: { firstName: string; state: HeroState }) {
  const scrollMotion = useDashboardScrollMotion();

  return (
    <motion.header
      ref={scrollMotion.ref as React.Ref<HTMLElement>}
      className="px-4 pt-12 pb-6"
      style={scrollMotion.style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
    >
      <div className="min-h-[136px]">
        {state.status === "loading" ? (
          <div className="space-y-4 pt-1" aria-label="Carregando insight do coach">
            <div className="h-9 w-64 max-w-[78vw] animate-pulse rounded-xl bg-white/10" />
            <div className="h-5 w-80 max-w-[86vw] animate-pulse rounded-lg bg-white/[0.07]" />
          </div>
        ) : (
          <>
            <h1 className="text-[34px] font-black leading-[1.04] tracking-normal text-white">
              Bom dia, {firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p
              className={`mt-3 max-w-[31rem] text-[17px] font-medium leading-snug tracking-normal ${
                state.status === "error" ? "text-gray-500" : "text-[#D8D8D8]"
              }`}
            >
              {state.message}
            </p>
            {state.status === "empty" && (
              <Link
                to={state.cta.to}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#C8FF00] px-4 text-sm font-black text-[#0A0A0A] transition-colors duration-200 active:bg-[#B8EA00]"
              >
                {state.cta.label}
              </Link>
            )}
          </>
        )}
      </div>
    </motion.header>
  );
}

function buildHeroInsight({
  treinos,
  currentWeekKm,
}: {
  treinos: TreinoRegistro[];
  currentWeekKm: number;
}): HeroState {
  try {
    const race = readNextRace();
    if (race) {
      const insight = raceInsight(race, treinos, currentWeekKm);
      if (insight) return { status: "ready", message: insight };
    }

    const goalKm = readWeeklyGoal();
    if (goalKm) {
      const remaining = Math.max(0, goalKm - currentWeekKm);
      if (remaining === 0) {
        return {
          status: "ready",
          message: "Voce concluiu sua meta semanal com os treinos registrados.",
        };
      }
      return {
        status: "ready",
        message: `Faltam ${formatKm(remaining)} km para atingir sua meta semanal.`,
      };
    }

    const recent = recentEvolutionInsight(treinos);
    if (recent) return { status: "ready", message: recent };

    const streak = calcularStreak(treinos);
    if (streak >= 2) {
      return { status: "ready", message: `Voce manteve uma sequencia ativa de ${streak} dias.` };
    }

    if (treinos.length > 0) {
      return {
        status: "empty",
        message: "Defina uma meta semanal para acompanhar sua evolucao com mais clareza.",
        cta: { label: "Criar meta", to: "/perfil" },
      };
    }

    return {
      status: "empty",
      message: "Complete seu primeiro treino para desbloquear insights personalizados.",
      cta: { label: "Iniciar treino", to: "/treino" },
    };
  } catch {
    return {
      status: "error",
      message: "Nao consegui atualizar seu insight agora. Seus dados seguem preservados.",
    };
  }
}

function readNextRace() {
  if (typeof window === "undefined") return null;
  const keys = ["pulse_next_race", "pulse_proxima_prova", "pulse_race_goal", "pulse_saved_races"];
  const today = startOfDay(new Date()).getTime();
  const races: Array<SavedRace & { dateValue: Date }> = [];

  keys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedRace | SavedRace[];
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        const date = item.data ?? item.date ?? item.eventDate;
        if (!date) return;
        const dateValue = startOfDay(new Date(date));
        if (Number.isNaN(dateValue.getTime()) || dateValue.getTime() < today) return;
        races.push({ ...item, dateValue });
      });
    } catch {
      return;
    }
  });

  return races.sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime())[0] ?? null;
}

function raceInsight(
  race: SavedRace & { dateValue: Date },
  treinos: TreinoRegistro[],
  currentWeekKm: number,
) {
  const daysLeft = daysBetween(startOfDay(new Date()), race.dateValue);
  const raceName = race.nome ?? race.name ?? race.titulo ?? race.title ?? "sua proxima prova";
  const weekRuns = treinosDaSemana(treinos).filter((treino) => kmTreino(treino) > 0);
  const targetKm = Number(race.metaKm ?? race.targetKm ?? readWeeklyGoal() ?? 0);

  if (daysLeft <= 0)
    return `Sua prova e hoje. Use os treinos registrados para ajustar o aquecimento.`;
  if (daysLeft <= 2)
    return `Sua prova e neste fim de semana. Hoje e um bom dia para manter tudo leve.`;
  if (targetKm > 0 && currentWeekKm < targetKm * 0.8) {
    return `Faltam ${daysLeft} dias para ${raceName} e voce treinou ${formatKm(currentWeekKm)} km esta semana.`;
  }
  if (weekRuns.length >= 3 || (targetKm > 0 && currentWeekKm >= targetKm * 0.8)) {
    return `Faltam ${daysLeft} dias para ${raceName}. Voce esta no ritmo certo para a prova.`;
  }
  return `Faltam ${daysLeft} dias para ${raceName}. Cadastre uma meta semanal para acompanhar a preparacao.`;
}

function recentEvolutionInsight(treinos: TreinoRegistro[]) {
  const sorted = [...treinos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  const weekCount = treinosDaSemana(sorted).length;
  if (weekCount > 0)
    return `Voce completou ${weekCount} ${weekCount === 1 ? "treino" : "treinos"} nesta semana.`;

  const lastSeven = totalKmBetween(sorted, 0, 7);
  const previousSeven = totalKmBetween(sorted, 7, 14);
  if (lastSeven > 0 && previousSeven > 0) {
    const delta = Math.round(((lastSeven - previousSeven) / previousSeven) * 100);
    if (delta > 0) return `Voce esta ${delta}% acima da media da semana passada.`;
  }

  const bestPace = sorted
    .filter((treino) => kmTreino(treino) > 0 && treino.duracaoSeg > 0)
    .slice(0, 30)
    .sort((a, b) => a.duracaoSeg / kmTreino(a) - b.duracaoSeg / kmTreino(b))[0];
  if (bestPace) {
    const yesterday = dataISO(new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (dataISO(new Date(bestPace.data)) === yesterday) {
      return "Seu melhor pace dos ultimos 30 dias aconteceu ontem.";
    }
  }

  return null;
}

function totalKmBetween(treinos: TreinoRegistro[], startDaysAgo: number, endDaysAgo: number) {
  const end = new Date();
  end.setDate(end.getDate() - startDaysAgo);
  const start = new Date();
  start.setDate(start.getDate() - endDaysAgo);
  return treinos
    .filter((treino) => {
      const date = new Date(treino.data);
      return date >= start && date < end;
    })
    .reduce((sum, treino) => sum + kmTreino(treino), 0);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function WeeklySummaryCards() {
  const navigate = useNavigate();
  const items = [
    {
      icon: Footprints,
      value: "42,6",
      unit: "km",
      label: "DISTA",
      delta: "+12%",
      positive: true,
    },
    {
      icon: Timer,
      value: "4h32",
      unit: "min",
      label: "TEMPO",
      delta: "+8%",
      positive: true,
    },
    {
      icon: Activity,
      value: "5'22",
      unit: "",
      label: "RITMO",
      delta: "-3%",
      positive: false,
    },
    {
      icon: Flame,
      value: "2.896",
      unit: "",
      label: "KCAL",
      delta: "+15%",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            className="min-w-0 bg-[#0F0F0F] rounded-xl p-3 flex flex-col gap-1 text-left active:scale-95 transition-transform duration-150 cursor-pointer"
            onClick={() => navigate({ to: "/atividades" })}
          >
            <Icon className="w-4 h-4 text-[#C8FF00] mb-1" strokeWidth={1.7} />
            <span className="text-base font-black text-white leading-none">
              {item.value}
              {item.unit && (
                <span className="text-[9px] text-gray-500 inline ml-0.5">{item.unit}</span>
              )}
            </span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">
              {item.label}
            </span>
            <span
              className={`text-[10px] font-bold mt-1 ${item.positive ? "text-[#C8FF00]" : "text-[#FF4444]"}`}
            >
              {item.delta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#C8FF00"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (value / 100)} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white leading-none">{value}%</span>
        <span className="text-[8px] text-gray-500 uppercase tracking-wide">Prep.</span>
      </div>
    </div>
  );
}

function SignalMetric({ label, value, status }: { label: string; value: string; status: string }) {
  const statusClass = status.toLowerCase() === "ok" ? "text-gray-400" : "text-[#C8FF00]";

  return (
    <div className="bg-[#0A0A0A] rounded-xl p-3">
      <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-black text-white leading-none">{value}</div>
      <div className={`text-[10px] font-semibold mt-1 ${statusClass}`}>{status}</div>
    </div>
  );
}

type CheckinToday = {
  data: string;
  sono: number;
  energia?: number;
  dor?: number;
  score: number;
};

function ReadinessCard({ fallbackCheckin }: { fallbackCheckin?: RecuperacaoDia }) {
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<CheckinToday | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const today = dataISO(new Date());
    const todayCheckin =
      readTodayCheckin(today) ?? (fallbackCheckin?.data === today ? fallbackCheckin : null);
    setCheckin(todayCheckin);
  }, [fallbackCheckin]);

  useEffect(() => {
    if (!checkin) {
      setAnimatedScore(0);
      return;
    }
    const timer = window.setTimeout(() => setAnimatedScore(checkin.score), 300);
    return () => window.clearTimeout(timer);
  }, [checkin]);

  if (!checkin) {
    return (
      <button
        type="button"
        className="group relative flex w-full min-h-[226px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#1A1A1A,#101010)] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-white/15 hover:bg-[#181818] active:scale-[0.985] active:border-[#C8FF00]/20 cursor-pointer"
        onClick={() => navigate({ to: "/saude" })}
      >
        <div className="absolute inset-0 bg-[#C8FF00]/[0.025] opacity-0 transition-opacity duration-200 group-active:opacity-100" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[2px] text-[#555555]">
            PRONTIDÃO
          </span>
          <Shield className="h-3.5 w-3.5 text-[#555555]" strokeWidth={1.7} />
        </div>
        <div className="grid place-items-center">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              className="ring-empty-stroke"
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="6"
            />
            <text
              x="32"
              y="40"
              textAnchor="middle"
              className="fill-[#333333] text-[22px] font-black"
            >
              ?
            </text>
          </svg>
        </div>
        <p className="relative text-center text-[13px] leading-snug text-[#888888]">
          Como seu corpo está hoje?
        </p>
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-500">Ver detalhes</span>
          <span className="rounded-xl bg-[#C8FF00] px-3 py-2 text-xs font-black text-[#0A0A0A] transition-transform duration-150 group-active:scale-95">
            Iniciar check-in
          </span>
        </div>
      </button>
    );
  }

  const scoreColor = readinessColor(checkin.score);
  const circumference = 2 * Math.PI * 28;
  const recommendation = readinessRecommendation(checkin.score);

  return (
    <>
      <button
        type="button"
        className="group relative flex w-full min-h-[226px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#1A1A1A,#101010)] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-white/15 hover:bg-[#181818] active:scale-[0.985] active:border-[#C8FF00]/20 cursor-pointer"
        onClick={() => setDetailsOpen(true)}
        style={
          {
            borderColor: readinessBorder(checkin.score),
            "--score-color": scoreColor,
          } as React.CSSProperties
        }
      >
        <span className="absolute inset-0 bg-[#C8FF00]/[0.025] opacity-0 transition-opacity duration-200 group-active:opacity-100" />
        <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#C8FF00]/5 blur-2xl" />
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[2px] text-[#555555]">
              PRONTIDÃO
            </div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[1.5px] text-[#333333]">
              HOJE
            </div>
          </div>
          <Shield className="h-3.5 w-3.5" strokeWidth={1.7} style={{ color: scoreColor }} />
        </div>
        <div className="relative grid place-items-center">
          <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#1A1A1A" strokeWidth="6" />
            <circle
              className="score-ring-fill"
              cx="36"
              cy="36"
              r="28"
              fill="none"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - animatedScore / 100)}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-[24px] font-black leading-none" style={{ color: scoreColor }}>
              {checkin.score}
            </span>
            <span className="ml-0.5 text-[10px] font-black text-[#555555]">/100</span>
          </div>
        </div>
        <p className="relative text-[12px] leading-relaxed text-gray-400">
          {checkin.score >= 75
            ? "Seu corpo parece mais recuperado do que ontem. Bom momento para treinar com controle."
            : recommendation}
        </p>
        <div className="relative grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/5 bg-[#0A0A0A]/70 p-3">
            <p className="text-[9px] uppercase tracking-widest text-gray-500">Sono</p>
            <p className="mt-1 text-lg font-black text-white">{checkin.sono}h</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0A0A0A]/70 p-3">
            <p className="text-[9px] uppercase tracking-widest text-gray-500">Tendencia</p>
            <p className="mt-1 text-lg font-black text-[#C8FF00]">+6%</p>
          </div>
        </div>
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-500 transition-colors duration-150 group-active:text-gray-300">
            Ver detalhes
          </span>
          <span className="rounded-xl bg-[#C8FF00] px-3 py-2 text-xs font-black text-[#0A0A0A] transition-transform duration-150 group-active:scale-95">
            Abrir analise
          </span>
        </div>
      </button>
      {detailsOpen && (
        <DashboardSheet title="Check-in de hoje" onClose={() => setDetailsOpen(false)}>
          <div className="grid grid-cols-2 gap-2">
            <SheetStat label="Sono" value={`${checkin.sono}h`} />
            <SheetStat label="Score" value={`${checkin.score}/100`} />
            <SheetStat label="Energia" value={`${checkin.energia ?? "--"}/10`} />
            <SheetStat label="Dor" value={`${checkin.dor ?? "--"}/10`} />
          </div>
          <button
            type="button"
            className="mt-4 h-11 w-full rounded-xl bg-[#C8FF00] text-xs font-black uppercase tracking-[1px] text-black"
            onClick={() => navigate({ to: "/saude" })}
          >
            Refazer check-in
          </button>
        </DashboardSheet>
      )}
    </>
  );
}

function WeeklyFocusCard({ currentKm }: { currentKm: number; defaultTargetKm: number }) {
  const navigate = useNavigate();
  const [goalKm, setGoalKm] = useState<number | null>(null);
  const [draftKm, setDraftKm] = useState(40);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    const savedGoal = readWeeklyGoal();
    setGoalKm(savedGoal);
    if (savedGoal) setDraftKm(savedGoal);
  }, []);

  const realProgress = goalKm ? Math.min(140, Math.round((currentKm / goalKm) * 100)) : 0;
  useEffect(() => {
    if (!goalKm) {
      setAnimatedProgress(0);
      return;
    }
    const timer = window.setTimeout(() => setAnimatedProgress(realProgress), 400);
    return () => window.clearTimeout(timer);
  }, [goalKm, realProgress]);

  const saveGoal = () => {
    const nextGoal = Math.max(5, Math.min(200, draftKm));
    localStorage.setItem(
      "pulse_weekly_goal",
      JSON.stringify({ km: nextGoal, updatedAt: new Date().toISOString() }),
    );
    setGoalKm(nextGoal);
    setConfigOpen(false);
    setOptionsOpen(false);
  };

  if (!goalKm) {
    return (
      <>
        <button
          type="button"
          className="group relative w-full min-h-[226px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#1A1A1A,#101010)] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-white/15 hover:bg-[#181818] active:scale-[0.985] active:border-[#C8FF00]/20 cursor-pointer"
          onClick={() => setConfigOpen(true)}
        >
          <div className="absolute inset-0 bg-[#C8FF00]/[0.025] opacity-0 transition-opacity duration-200 group-active:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Meta semanal
              </p>
              <h3 className="mt-1 text-base font-black leading-tight text-white">
                Defina seu alvo
              </h3>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-white/[0.03]">
              <Target className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
            </div>
          </div>
          <div className="relative mt-4 rounded-xl border border-white/5 bg-[#0A0A0A]/70 p-3">
            <p className="text-xl font-black text-white">{formatKm(currentKm)} km</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Comece com uma meta realista e acompanhe sua consistencia semanal.
            </p>
          </div>
          <div className="relative mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="text-xs font-bold text-gray-500">Ver historico</span>
            <span className="rounded-xl bg-[#C8FF00] px-3 py-2 text-xs font-black text-[#0A0A0A] transition-transform duration-150 group-active:scale-95">
              Configurar
            </span>
          </div>
        </button>
        {configOpen && (
          <GoalConfigSheet
            draftKm={draftKm}
            setDraftKm={setDraftKm}
            onClose={() => setConfigOpen(false)}
            onSave={saveGoal}
          />
        )}
      </>
    );
  }

  const remaining = Math.max(0, goalKm - currentKm);
  const progressColor = weeklyProgressColor(realProgress);
  const next = weeklyNextStep(realProgress, remaining);
  const completed = realProgress >= 100;
  const NextIcon = next.icon;

  return (
    <>
      <button
        type="button"
        className="group relative w-full min-h-[226px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,#1A1A1A,#101010)] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-white/15 hover:bg-[#181818] active:scale-[0.985] active:border-[#C8FF00]/20 cursor-pointer"
        onClick={() => setOptionsOpen(true)}
        style={
          {
            borderColor: completed ? "rgba(255,215,0,0.3)" : undefined,
            "--meta-color": progressColor,
          } as React.CSSProperties
        }
      >
        <div className="absolute inset-0 bg-[#C8FF00]/[0.025] opacity-0 transition-opacity duration-200 group-active:opacity-100" />
        {completed && (
          <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#C8FF00]/5 blur-2xl" />
        )}
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[2px] text-[#555555]">
              META
            </div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[1.5px] text-[#333333]">
              {goalKm} KM
            </div>
          </div>
          <Target className="h-3.5 w-3.5 text-[#C8FF00]" strokeWidth={1.7} />
        </div>
        {completed && <div className="meta-complete-badge">✦ META BATIDA</div>}
        <div className="relative mt-4 rounded-xl border border-white/5 bg-[#0A0A0A]/70 p-3">
          <div
            className="text-2xl font-black text-white"
            style={{ color: completed ? "#FFD700" : undefined }}
          >
            {formatKm(currentKm)} <span>km</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#C8FF00] transition-all duration-700"
              style={{ width: `${Math.min(100, animatedProgress)}%`, background: progressColor }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold" style={{ color: progressColor }}>
              {realProgress}%
            </span>
            <span className="text-[11px] text-gray-500">
              {completed ? "concluída" : `${formatKm(remaining)} km restantes`}
            </span>
          </div>
        </div>
        <div className="relative mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <span className="flex items-start gap-2">
            <NextIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
          </span>
          <span className="block text-[12px] leading-relaxed text-gray-400">
            <span className="meta-next-label">Próximo</span>
            <span>{next.text}</span>
          </span>
        </div>
        <div className="relative mt-4 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-500">Ver historico</span>
          <span className="rounded-xl bg-[#C8FF00] px-3 py-2 text-xs font-black text-[#0A0A0A] transition-transform duration-150 group-active:scale-95">
            Ajustar meta
          </span>
        </div>
      </button>
      {configOpen && (
        <GoalConfigSheet
          draftKm={draftKm}
          setDraftKm={setDraftKm}
          onClose={() => setConfigOpen(false)}
          onSave={saveGoal}
        />
      )}
      {optionsOpen && (
        <DashboardSheet title="Meta semanal" onClose={() => setOptionsOpen(false)}>
          <button
            type="button"
            className="h-11 w-full rounded-xl bg-[#C8FF00] text-xs font-black uppercase tracking-[1px] text-black"
            onClick={() => {
              setOptionsOpen(false);
              setConfigOpen(true);
            }}
          >
            Ajustar meta
          </button>
          <button
            type="button"
            className="mt-2 h-11 w-full rounded-xl bg-[#1A1A1A] text-xs font-black uppercase tracking-[1px] text-white"
            onClick={() => navigate({ to: "/perfil" })}
          >
            Ver histórico de metas
          </button>
          <button
            type="button"
            className="mt-2 h-11 w-full rounded-xl text-xs font-black uppercase tracking-[1px] text-[#888888]"
            onClick={() => setOptionsOpen(false)}
          >
            Cancelar
          </button>
        </DashboardSheet>
      )}
    </>
  );
}

function ActivityIcon(props: React.ComponentProps<typeof TrendingUp>) {
  return <TrendingUp {...props} />;
}

function ReadinessMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="prontidao-metric">
      <span className="prontidao-metric-icon">{icon}</span>
      <span className="prontidao-metric-value">{value}</span>
      <span className="prontidao-metric-label">{label}</span>
    </div>
  );
}

function DashboardSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 px-4 pb-4">
      <div className="w-full max-w-[358px] rounded-2xl border border-white/[0.06] bg-[#111111] p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-white">{title}</h2>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#1A1A1A] text-[#888888]"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function GoalConfigSheet({
  draftKm,
  setDraftKm,
  onClose,
  onSave,
}: {
  draftKm: number;
  setDraftKm: (value: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <DashboardSheet title="Minha meta semanal" onClose={onClose}>
      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-[1.6px] text-[#555555]">
          Quilômetros
        </span>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={200}
            value={draftKm}
            onChange={(event) => setDraftKm(Number(event.target.value))}
            className="min-w-0 flex-1 accent-[#C8FF00]"
          />
          <input
            type="number"
            min={5}
            max={200}
            value={draftKm}
            onChange={(event) => setDraftKm(Number(event.target.value))}
            className="h-11 w-20 rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 text-center text-sm font-black text-white outline-none"
          />
        </div>
      </label>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[20, 40, 60, 80].map((km) => (
          <button
            key={km}
            type="button"
            className={`h-9 rounded-lg text-xs font-black ${
              draftKm === km ? "bg-[#C8FF00] text-black" : "bg-[#1A1A1A] text-[#888888]"
            }`}
            onClick={() => setDraftKm(km)}
          >
            {km} km
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-5 h-12 w-full rounded-xl bg-[#C8FF00] text-xs font-black uppercase tracking-[1px] text-black"
        onClick={onSave}
      >
        Salvar meta
      </button>
    </DashboardSheet>
  );
}

function SheetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0A0A0A] p-3">
      <div className="text-[10px] font-black uppercase tracking-[1px] text-[#555555]">{label}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function readTodayCheckin(today: string): CheckinToday | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("pulse_checkin_today");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckinToday> & {
      date?: string;
      sleep?: number;
      recovery?: number;
    };
    const date = parsed.data ?? parsed.date;
    if (date !== today) return null;
    const score = Number(parsed.score ?? parsed.recovery ?? 0);
    return {
      data: today,
      sono: Number(parsed.sono ?? parsed.sleep ?? 0),
      energia: parsed.energia,
      dor: parsed.dor,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  } catch {
    return null;
  }
}

function readWeeklyGoal() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("pulse_weekly_goal");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as number | { km?: number; targetKm?: number };
    const km = typeof parsed === "number" ? parsed : (parsed.km ?? parsed.targetKm);
    return km ? Math.max(5, Math.min(200, Number(km))) : null;
  } catch {
    return null;
  }
}

function readinessColor(score: number) {
  if (score >= 80) return "#C8FF00";
  if (score >= 60) return "#FF9800";
  return "#FF4444";
}

function readinessBorder(score: number) {
  if (score >= 80) return "rgba(200,255,0,0.25)";
  if (score >= 60) return "rgba(255,152,0,0.25)";
  return "rgba(255,68,68,0.25)";
}

function readinessRecommendation(score: number) {
  if (score >= 90) return "Dia perfeito para bater recordes.";
  if (score >= 80) return "Ótima prontidão. Treino forte hoje.";
  if (score >= 70) return "Bom para treino moderado.";
  if (score >= 60) return "Prefira ritmo leve hoje.";
  return "Seu corpo pede recuperação.";
}

function weeklyProgressColor(progress: number) {
  if (progress >= 100) return "#FFD700";
  if (progress >= 80) return "#C8FF00";
  if (progress >= 50) return "#C8FF00";
  return "#FF9800";
}

function weeklyNextStep(progress: number, remainingKm: number) {
  if (progress <= 30) return { icon: Zap, text: "Começar hoje com 7 km leves" };
  if (progress <= 60) return { icon: TrendingUp, text: "Você está no ritmo certo" };
  if (progress <= 85)
    return { icon: Flag, text: `${formatKm(remainingKm)} km para bater a meta essa semana` };
  if (progress < 100)
    return { icon: Star, text: `Quase lá! ${formatKm(remainingKm)} km para completar` };
  return { icon: Trophy, text: "Meta da semana concluída!" };
}

function formatKm(value: number) {
  return value.toFixed(1).replace(".", ",");
}

type WeatherDay = {
  label: string;
  date: string;
  icon: string;
  max: number;
  min: number;
  rainChance: number;
};

type WeatherHour = {
  time: string;
  hour: number;
  temp: number;
  feelsLike?: number;
  humidity?: number;
  wind?: number;
  rain?: number;
  condition: string;
  icon: string;
};

type WeatherState = {
  locationLabel: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  rain: number;
  condition: string;
  icon: string;
  hourly: WeatherHour[];
  forecast: WeatherDay[];
};

function WeatherCard({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [displayTemp, setDisplayTemp] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const [daysOpen, setDaysOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const apiKey =
    import.meta.env.VITE_WEATHER_API_KEY ||
    import.meta.env.WEATHER_API_KEY ||
    import.meta.env.VITE_OPENWEATHER_API_KEY ||
    "";

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      let coords: { lat: number; lon: number } | null = null;
      try {
        coords = await getWeatherCoords(city);
        if (!coords) throw new Error("coords");
        const fallback = await fetchOpenMeteoWeather(coords, city);

        if (!apiKey) {
          if (!cancelled) setWeather(fallback);
          return;
        }

        try {
          const params = new URLSearchParams({
            appid: apiKey,
            units: "metric",
            lang: "pt_br",
            lat: String(coords.lat),
            lon: String(coords.lon),
          });
          const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
          );
          if (!currentResponse.ok) throw new Error("weather");
          const current = await currentResponse.json();
          const currentRain = current.rain?.["1h"]
            ? Math.min(100, Number(current.rain["1h"]) * 25)
            : 0;

          if (!cancelled) {
            setWeather({
              ...fallback,
              locationLabel: formatOpenWeatherLocation(current, city),
              temp: Math.round(current.main?.temp ?? fallback.temp),
              feelsLike: Math.round(
                current.main?.feels_like ?? current.main?.temp ?? fallback.feelsLike,
              ),
              humidity: Math.round(current.main?.humidity ?? fallback.humidity),
              wind: Math.round((current.wind?.speed ?? fallback.wind / 3.6) * 3.6),
              rain: Math.round(Math.max(currentRain, fallback.rain)),
              condition: capitalize(current.weather?.[0]?.description ?? fallback.condition),
              icon: current.weather?.[0]?.icon ?? fallback.icon,
            });
          }
        } catch {
          if (!cancelled) setWeather(fallback);
        }
      } catch {
        if (!cancelled) setWeather(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWeather();
    const interval = window.setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiKey, city, reloadToken]);

  useEffect(() => {
    if (!weather) {
      setDisplayTemp(0);
      return;
    }
    setSelectedHourIndex(0);
    if (weather.temp <= 0) {
      setDisplayTemp(weather.temp);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const animate = (timestamp: number) => {
      start ??= timestamp;
      const progress = Math.min(1, (timestamp - start) / 560);
      setDisplayTemp(Math.round(weather.temp * progress));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [weather]);

  const selectedHour = weather?.hourly[selectedHourIndex] ?? null;
  const activeWeather = weather
    ? {
        ...weather,
        temp: selectedHour?.temp ?? weather.temp,
        feelsLike: selectedHour?.feelsLike ?? weather.feelsLike,
        humidity: selectedHour?.humidity ?? weather.humidity,
        wind: selectedHour?.wind ?? weather.wind,
        rain: selectedHour?.rain ?? weather.rain,
        condition: selectedHour?.condition ?? weather.condition,
        icon: selectedHour?.icon ?? weather.icon,
      }
    : null;
  const recommendation = activeWeather
    ? weatherRecommendation(
        activeWeather.temp,
        activeWeather.humidity,
        activeWeather.wind,
        activeWeather.rain,
      )
    : null;
  const iconMeta = activeWeather
    ? getWeatherIconMeta(activeWeather.icon)
    : getWeatherIconMeta("04d");
  const runWindow = weather ? findBestRunWindow(weather.hourly) : null;
  const weatherAlert = activeWeather ? buildWeatherAlert(activeWeather) : null;
  const raceWeather = weather ? buildRaceWeather(weather.forecast) : null;
  const scene = activeWeather
    ? getWeatherScene(activeWeather.icon, selectedHour?.hour)
    : getWeatherScene("04d");

  return (
    <section className="w-full">
      {loading && !weather ? (
        <WeatherSkeleton />
      ) : weather && activeWeather && recommendation ? (
        <motion.div
          className={`relative overflow-hidden rounded-2xl border border-white/[0.08] p-4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.34)] ${scene.className}`}
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={prefersReducedMotion ? undefined : { opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <span className="absolute -right-10 top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <span className="absolute left-6 top-28 h-20 w-32 rounded-full bg-white/[0.07] blur-2xl" />
            {scene.rain && (
              <span className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.12)_48%,transparent_52%)] opacity-20" />
            )}
          </motion.div>

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate">{weather.locationLabel}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeWeather.temp}-${activeWeather.condition}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <div className="mt-3 text-6xl font-black leading-none tracking-[-0.05em] text-white">
                      <span>{selectedHour ? activeWeather.temp : displayTemp}</span>
                      <span className="align-top text-2xl tracking-normal">C</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/80">
                      {activeWeather.condition}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.div
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white"
                animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <iconMeta.Icon className="h-8 w-8" strokeWidth={1.5} />
              </motion.div>
            </div>

            <div
              className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/18 p-3"
              style={{ color: recommendation.color }}
            >
              <recommendation.Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
              <div>
                <p className="text-sm font-black leading-snug text-white">{recommendation.text}</p>
                {weatherAlert && (
                  <p className="mt-1 text-xs font-medium leading-snug text-white/68">
                    {weatherAlert}
                  </p>
                )}
              </div>
            </div>

            {runWindow && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/16 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    Janela ideal
                  </span>
                  <span className="text-sm font-black text-white">{runWindow.range}</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-white/62">{runWindow.reason}</p>
              </div>
            )}

            {weather.hourly.length > 0 && (
              <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-2">
                  {weather.hourly.map((hour, index) => {
                    const hourIcon = getWeatherIconMeta(hour.icon);
                    const active = index === selectedHourIndex;
                    return (
                      <motion.button
                        key={`${hour.time}-${index}`}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedHourIndex(index)}
                        className={`min-h-[88px] w-[58px] shrink-0 rounded-2xl border px-2 py-2 text-center transition-colors duration-200 ${
                          active
                            ? "border-[#C8FF00]/70 bg-[#C8FF00]/15 text-white"
                            : "border-white/10 bg-black/16 text-white/68"
                        }`}
                      >
                        <span className="text-[11px] font-black">{hour.time}</span>
                        <hourIcon.Icon className="mx-auto mt-2 h-4 w-4" strokeWidth={1.5} />
                        <span className="mt-2 block text-sm font-black">{hour.temp}C</span>
                        {typeof hour.rain === "number" && hour.rain > 0 && (
                          <span className="mt-1 block text-[10px] font-bold text-[#9CCBFF]">
                            {hour.rain}%
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              <WeatherMetric
                icon={<Thermometer />}
                label="Sens."
                value={activeWeather.feelsLike}
                unit="C"
              />
              <WeatherMetric
                icon={<Droplets />}
                label="Umid."
                value={activeWeather.humidity}
                unit="%"
              />
              <WeatherMetric icon={<Wind />} label="Vento" value={activeWeather.wind} unit="km/h" />
              <WeatherMetric
                icon={<CloudRain />}
                label="Chuva"
                value={activeWeather.rain}
                unit="%"
              />
            </div>

            {weather.forecast.length > 0 && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/16">
                <button
                  type="button"
                  onClick={() => setDaysOpen((value) => !value)}
                  className="flex min-h-12 w-full items-center justify-between px-3 text-left"
                >
                  <span className="text-sm font-black text-white">Proximos dias</span>
                  <ChevronRight
                    className={`h-4 w-4 text-white/55 transition-transform ${daysOpen ? "rotate-90" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {daysOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="overflow-hidden px-3 pb-3"
                    >
                      {weather.forecast.map((day) => {
                        const dayIcon = getWeatherIconMeta(day.icon);
                        return (
                          <div
                            className="flex min-h-10 items-center justify-between gap-2 border-t border-white/10 text-sm"
                            key={day.date}
                          >
                            <span className="w-10 text-xs font-black text-white/58">
                              {day.label}
                            </span>
                            <dayIcon.Icon className="h-4 w-4 text-white/65" strokeWidth={1.5} />
                            <span className="font-black text-white">
                              {day.max} / {day.min}C
                            </span>
                            <span className="w-10 text-right text-xs font-bold text-[#9CCBFF]">
                              {day.rainChance > 0 ? `${day.rainChance}%` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {raceWeather && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/16 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-white">{raceWeather.name}</span>
                  <span className="text-[11px] font-bold text-white/58">
                    Faltam {raceWeather.daysLeft} dias
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/68">
                  {raceWeather.temp}C, {raceWeather.rain}% chuva. {raceWeather.condition}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <WifiOff className="w-5 h-5" aria-hidden="true" />
            <div>
              <p className="text-sm">Clima indisponivel - verifique sua conexao</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadToken((value) => value + 1);
                }}
                className="mt-2 min-h-8 text-xs font-bold text-[#C8FF00]"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WeatherCardLegacy({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayTemp, setDisplayTemp] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const apiKey =
    import.meta.env.VITE_WEATHER_API_KEY ||
    import.meta.env.WEATHER_API_KEY ||
    import.meta.env.VITE_OPENWEATHER_API_KEY ||
    "";

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      let coords: { lat: number; lon: number } | null = null;
      if (!apiKey) {
        try {
          coords = await getWeatherCoords(city);
          if (!coords) throw new Error("coords");
          const fallback = await fetchOpenMeteoWeather(coords, city);
          if (!cancelled) setWeather(fallback);
        } catch {
          if (!cancelled) setWeather(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      try {
        coords = await getWeatherCoords(city);
        const params = new URLSearchParams({
          appid: apiKey,
          units: "metric",
          lang: "pt_br",
        });
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lon", String(coords.lon));
        } else {
          params.set("q", city);
        }
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
        );
        if (!currentResponse.ok) throw new Error("weather");
        const current = await currentResponse.json();

        const forecastParams = new URLSearchParams({
          appid: apiKey,
          units: "metric",
          lang: "pt_br",
        });
        if (coords) {
          forecastParams.set("lat", String(coords.lat));
          forecastParams.set("lon", String(coords.lon));
        } else {
          forecastParams.set("q", city);
        }
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?${forecastParams.toString()}`,
        );
        if (!forecastResponse.ok) throw new Error("forecast");
        const forecast = await forecastResponse.json();
        const forecastDays = buildForecast(forecast.list ?? []);
        const currentRain = current.rain?.["1h"]
          ? Math.min(100, Number(current.rain["1h"]) * 25)
          : 0;
        const nextRain = forecast.list?.[0]?.pop ? Number(forecast.list[0].pop) * 100 : 0;
        const openMeteo = coords ? await fetchOpenMeteoWeather(coords, city) : null;
        if (cancelled) return;
        setWeather({
          locationLabel: formatOpenWeatherLocation(current, city),
          temp: Math.round(current.main?.temp ?? 0),
          feelsLike: Math.round(current.main?.feels_like ?? current.main?.temp ?? 0),
          humidity: Math.round(current.main?.humidity ?? 0),
          wind: Math.round((current.wind?.speed ?? 0) * 3.6),
          rain: Math.round(Math.max(currentRain, nextRain)),
          condition: capitalize(current.weather?.[0]?.description ?? "Clima local"),
          icon: current.weather?.[0]?.icon ?? "04d",
          hourly: openMeteo?.hourly ?? [],
          forecast: openMeteo?.forecast.length ? openMeteo.forecast : forecastDays,
        });
      } catch {
        try {
          coords = coords ?? (await getWeatherCoords(city));
          if (!coords) throw new Error("coords");
          const fallback = await fetchOpenMeteoWeather(coords, city);
          if (!cancelled) setWeather(fallback);
        } catch {
          if (!cancelled) setWeather(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWeather();
    const interval = window.setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiKey, city, reloadToken]);

  useEffect(() => {
    if (!weather) {
      setDisplayTemp(0);
      return;
    }
    if (weather.temp <= 0) {
      setDisplayTemp(weather.temp);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const duration = 600;
    const animate = (timestamp: number) => {
      start ??= timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      setDisplayTemp(Math.round(weather.temp * progress));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [weather]);

  const hasWeather = Boolean(weather);
  const recommendation = weather
    ? weatherRecommendation(weather.temp, weather.humidity, weather.wind, weather.rain)
    : null;
  const iconMeta = weather ? getWeatherIconMeta(weather.icon) : getWeatherIconMeta("04d");
  return (
    <section className="w-full bg-[#1A1A1A] rounded-2xl p-4 border border-[#C8FF00]/15">
      {loading && !hasWeather ? (
        <WeatherSkeleton />
      ) : hasWeather && weather && recommendation ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8FF00]">
                  Clima inteligente
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-gray-500 text-xs">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span>{weather.locationLabel}</span>
              </div>
              <div className="mt-4 text-6xl font-black text-white leading-none">
                <span>{displayTemp}</span>
                <span className="align-top text-2xl">C</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">{weather.condition}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center">
              <iconMeta.Icon className="text-[#C8FF00] w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>

          <div className="border-t border-white/5 my-3" />

          <div className="grid grid-cols-4 gap-2">
            <WeatherMetric
              icon={<Thermometer />}
              label="SENS"
              value={weather.feelsLike}
              unit="°C"
              tone={
                weather.feelsLike > 30 ? "#FF4444" : weather.feelsLike < 10 ? "#88CCFF" : undefined
              }
            />
            <WeatherMetric
              icon={<Droplets />}
              label="UMID"
              value={weather.humidity}
              unit="%"
              tone={
                weather.humidity > 90 ? "#FF4444" : weather.humidity > 80 ? "#FF9800" : undefined
              }
            />
            <WeatherMetric
              icon={<Wind />}
              label="VENTO"
              value={weather.wind}
              unit="km/h"
              tone={weather.wind > 30 ? "#FF9800" : undefined}
            />
            <WeatherMetric
              icon={<CloudRain />}
              label="CHUVA"
              value={weather.rain}
              unit="%"
              tone={weather.rain > 50 ? "#4488FF" : undefined}
            />
          </div>

          <div className="flex items-center gap-2 mt-3 bg-[#C8FF00]/10 rounded-xl p-3">
            <Shield className="text-[#C8FF00] w-4 h-4 shrink-0" strokeWidth={1.7} />
            <span className="text-[#C8FF00] text-xs font-semibold">{recommendation.text}</span>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              Proximos dias
            </div>
            <div>
              {(weather.forecast.length ? weather.forecast : buildEmptyForecast()).map((day) => {
                const dayIcon = getWeatherIconMeta(day.icon);
                return (
                  <div
                    className="flex items-center justify-between py-2 border-b border-white/5 active:bg-white/5 rounded-lg transition-colors"
                    key={`${day.label}-${day.max}`}
                  >
                    <span className="text-xs text-gray-500 w-8">{day.label}</span>
                    <span className="w-4 h-4 text-gray-400">
                      <dayIcon.Icon className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <span className="text-xs font-bold text-white">{day.max}C</span>
                    <span className="w-8 text-right text-[10px] text-gray-500">
                      {day.rainChance > 20 ? `${day.rainChance}%` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 text-gray-500">
          <WifiOff className="w-5 h-5" aria-hidden="true" />
          <div>
            <p className="text-sm">Clima indisponivel - verifique sua conexao</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setReloadToken((value) => value + 1);
              }}
              className="mt-2 text-xs font-bold text-[#C8FF00]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

void WeatherCardLegacy;

function WeatherSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <div className="h-3 w-32 rounded-full bg-white/10" />
        <div className="h-3.5 w-40 rounded-full bg-white/10" />
        <div className="mt-2 h-12 w-24 rounded-xl bg-white/10" />
        <div className="h-3.5 w-28 rounded-full bg-white/10" />
      </div>
      <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center">
        <div className="h-8 w-8 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

function WeatherMetric({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  tone?: string;
}) {
  return (
    <div className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/16 px-1 text-center">
      <span className="w-3 h-3 text-white/56 [&>svg]:w-3 [&>svg]:h-3" style={{ color: tone }}>
        {icon}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/48">
        {label}
      </span>
      <span className="text-sm font-bold text-white" style={{ color: tone }}>
        {value}
        <span className="text-[9px] text-white/45"> {unit}</span>
      </span>
    </div>
  );
}

function weatherScore(hour: WeatherHour) {
  const temp = hour.feelsLike ?? hour.temp;
  const humidity = hour.humidity ?? 70;
  const wind = hour.wind ?? 0;
  const rain = hour.rain ?? 0;
  let score = 100;
  if (temp < 10) score -= (10 - temp) * 4;
  if (temp > 24) score -= (temp - 24) * 5;
  if (humidity > 75) score -= (humidity - 75) * 0.8;
  if (wind > 24) score -= (wind - 24) * 1.4;
  score -= rain * 0.9;
  return Math.max(0, Math.round(score));
}

function findBestRunWindow(hourly: WeatherHour[]) {
  if (!hourly.length) return null;
  const candidates = hourly
    .filter((hour) => hour.hour >= 5 && hour.hour <= 22)
    .map((hour) => ({ hour, score: weatherScore(hour) }))
    .filter((item) => item.score >= 62);
  if (!candidates.length) return null;

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  const start = best.hour.hour;
  const end = Math.min(23, start + 2);
  const rain = best.hour.rain ?? 0;
  const reason =
    rain > 20
      ? "Menor risco de chuva dentro da previsao disponivel."
      : "Temperatura, vento e umidade mais favoraveis para correr.";
  return {
    range: `${String(start).padStart(2, "0")}h as ${String(end).padStart(2, "0")}h`,
    reason,
  };
}

function buildWeatherAlert(
  weather: Pick<WeatherState, "temp" | "feelsLike" | "humidity" | "wind" | "rain">,
) {
  if (weather.rain >= 45) return "Possibilidade de chuva. Planeje rota curta ou treino protegido.";
  if (weather.feelsLike >= 30 && weather.humidity >= 70) {
    return "Calor e umidade aumentam o esforco percebido. Hidrate-se antes de sair.";
  }
  if (weather.wind >= 28) return "Vento pode alterar o pace. Comece controlado.";
  if (weather.feelsLike >= 15 && weather.feelsLike <= 23 && weather.rain < 20) {
    return "Temperatura confortavel para rodagem e treinos longos.";
  }
  return null;
}

function buildRaceWeather(forecast: WeatherDay[]) {
  const race = readNextRace();
  if (!race) return null;
  const daysLeft = daysBetween(startOfDay(new Date()), race.dateValue);
  if (daysLeft < 0) return null;
  const key = race.dateValue.toISOString().slice(0, 10);
  const day = forecast.find((item) => item.date === key);
  if (!day) return null;
  const raceName = race.nome ?? race.name ?? race.titulo ?? race.title ?? "Proxima prova";
  const condition = day.rainChance >= 50 ? "Atenção para chuva" : "Condicao favoravel";
  return { name: raceName, daysLeft, temp: day.max, rain: day.rainChance, condition };
}

function getWeatherScene(iconCode: string, hour = new Date().getHours()) {
  const rainy = iconCode.startsWith("09") || iconCode.startsWith("10") || iconCode.startsWith("11");
  const cloudy =
    iconCode.startsWith("02") || iconCode.startsWith("03") || iconCode.startsWith("04");
  const night = iconCode.endsWith("n") || hour >= 19 || hour <= 4;
  const dawn = hour >= 5 && hour <= 8;
  const evening = hour >= 17 && hour <= 18;
  if (rainy)
    return {
      className: "bg-[linear-gradient(160deg,#121826_0%,#172033_48%,#090B10_100%)]",
      rain: true,
    };
  if (night)
    return {
      className: "bg-[linear-gradient(160deg,#07111F_0%,#10182B_54%,#06070A_100%)]",
      rain: false,
    };
  if (dawn)
    return {
      className: "bg-[linear-gradient(160deg,#24334B_0%,#895E45_50%,#101114_100%)]",
      rain: false,
    };
  if (evening)
    return {
      className: "bg-[linear-gradient(160deg,#1C2434_0%,#72542F_52%,#0A0A0A_100%)]",
      rain: false,
    };
  if (cloudy)
    return {
      className: "bg-[linear-gradient(160deg,#202733_0%,#151A20_52%,#090A0C_100%)]",
      rain: false,
    };
  return {
    className: "bg-[linear-gradient(160deg,#17375F_0%,#266C86_48%,#101316_100%)]",
    rain: false,
  };
}

function getWeatherIconMeta(iconCode: string) {
  const map = {
    "01d": { Icon: Sun, className: "icon-sun" },
    "01n": { Icon: Moon, className: "icon-sun" },
    "02d": { Icon: CloudSun, className: "icon-cloud" },
    "02n": { Icon: CloudMoon, className: "icon-cloud" },
    "03d": { Icon: Cloud, className: "icon-cloud" },
    "03n": { Icon: Cloud, className: "icon-cloud" },
    "04d": { Icon: Cloud, className: "icon-cloud" },
    "04n": { Icon: Cloud, className: "icon-cloud" },
    "09d": { Icon: CloudDrizzle, className: "icon-rain" },
    "09n": { Icon: CloudDrizzle, className: "icon-rain" },
    "10d": { Icon: CloudRain, className: "icon-rain" },
    "10n": { Icon: CloudRain, className: "icon-rain" },
    "11d": { Icon: CloudLightning, className: "icon-rain" },
    "11n": { Icon: CloudLightning, className: "icon-rain" },
    "13d": { Icon: Snowflake, className: "icon-cloud" },
    "13n": { Icon: Snowflake, className: "icon-cloud" },
    "50d": { Icon: Wind, className: "icon-cloud" },
    "50n": { Icon: Wind, className: "icon-cloud" },
  } as const;
  return map[iconCode as keyof typeof map] ?? { Icon: Cloud, className: "icon-cloud" };
}

function weatherRecommendation(temp: number, humidity: number, windKmh: number, rain: number) {
  if (rain > 50) {
    return { Icon: CloudRain, text: "Chuva provável - considere treino indoor.", color: "#8888FF" };
  }
  if (temp > 35) {
    return {
      Icon: Thermometer,
      text: "Muito quente - prefira manhã cedo ou após as 18h.",
      color: "#FF4444",
    };
  }
  if (temp > 28 && humidity > 70) {
    return {
      Icon: Droplets,
      text: "Calor e umidade alta - hidrate-se muito bem.",
      color: "#FF9800",
    };
  }
  if (humidity > 85) {
    return {
      Icon: Droplets,
      text: "Umidade alta - esforço parece maior. Reduza o pace.",
      color: "#FF9800",
    };
  }
  if (temp < 10) {
    return { Icon: Thermometer, text: "Frio - aqueça bem antes de acelerar.", color: "#88CCFF" };
  }
  if (windKmh > 30) {
    return { Icon: Wind, text: "Vento forte - ajuste o pace na ida.", color: "#AAAAFF" };
  }
  if (temp >= 15 && temp <= 25 && humidity < 70) {
    return { Icon: ShieldCheck, text: "Condições ideais para treinar!", color: "#C8FF00" };
  }
  return { Icon: CloudSun, text: "Condições razoáveis - atenção à hidratação.", color: "#FFB800" };
}

function buildEmptyForecast(): WeatherDay[] {
  return ["SEG", "TER", "QUA", "QUI"].map((label) => ({
    label,
    date: "",
    icon: "04d",
    max: 0,
    min: 0,
    rainChance: 0,
  }));
}

function buildForecast(
  list: Array<{
    dt?: number;
    dt_txt?: string;
    main?: { temp_max?: number; temp_min?: number };
    pop?: number;
    weather?: Array<{ icon?: string; main?: string }>;
  }>,
): WeatherDay[] {
  const today = new Date().toISOString().slice(0, 10);
  const byDay = new Map<
    string,
    {
      label: string;
      date: string;
      maxTemps: number[];
      minTemps: number[];
      icons: string[];
      rain: number[];
    }
  >();
  list.forEach((item) => {
    const date = item.dt
      ? new Date(item.dt * 1000)
      : item.dt_txt
        ? new Date(item.dt_txt.replace(" ", "T"))
        : null;
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    if (key === today) return;
    const label = date
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    const existing = byDay.get(key) ?? {
      label,
      date: key,
      maxTemps: [],
      minTemps: [],
      icons: [],
      rain: [],
    };
    existing.maxTemps.push(item.main?.temp_max ?? 0);
    existing.minTemps.push(item.main?.temp_min ?? item.main?.temp_max ?? 0);
    existing.icons.push(item.weather?.[0]?.icon ?? "04d");
    existing.rain.push((item.pop ?? 0) * 100);
    byDay.set(key, existing);
  });
  return Array.from(byDay.values())
    .slice(0, 4)
    .map((day) => ({
      label: day.label,
      date: day.date,
      icon: day.icons[Math.floor(day.icons.length / 2)] ?? "04d",
      max: Math.round(Math.max(...day.maxTemps)),
      min: Math.round(Math.min(...day.minTemps)),
      rainChance: Math.round(Math.max(...day.rain)),
    }));
}

async function fetchOpenMeteoWeather(
  coords: { lat: number; lon: number },
  fallbackCity: string,
): Promise<WeatherState> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,wind_speed_10m",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weathercode,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
  );
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("open-meteo");
  const data = await response.json();
  const current = data.current ?? {};
  const daily = data.daily ?? {};
  const hourly = data.hourly ?? {};

  return {
    locationLabel: fallbackCity || "Local atual",
    temp: Math.round(current.temperature_2m ?? 0),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    wind: Math.round(current.wind_speed_10m ?? 0),
    rain: Math.round(current.precipitation ? Math.min(100, Number(current.precipitation) * 25) : 0),
    condition: weatherCodeLabel(current.weathercode),
    icon: weatherCodeIcon(current.weathercode),
    hourly: buildOpenMeteoHourly(hourly),
    forecast: buildOpenMeteoForecast(daily),
  };
}

function buildOpenMeteoHourly(hourly: {
  time?: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  relative_humidity_2m?: number[];
  precipitation_probability?: number[];
  weathercode?: number[];
  wind_speed_10m?: number[];
}): WeatherHour[] {
  const now = new Date();
  return (hourly.time ?? [])
    .map((value, index) => {
      const date = new Date(value);
      return {
        date,
        item: {
          time: `${String(date.getHours()).padStart(2, "0")}h`,
          hour: date.getHours(),
          temp: Math.round(hourly.temperature_2m?.[index] ?? 0),
          feelsLike: Math.round(
            hourly.apparent_temperature?.[index] ?? hourly.temperature_2m?.[index] ?? 0,
          ),
          humidity: Math.round(hourly.relative_humidity_2m?.[index] ?? 0),
          wind: Math.round(hourly.wind_speed_10m?.[index] ?? 0),
          rain: Math.round(hourly.precipitation_probability?.[index] ?? 0),
          condition: weatherCodeLabel(hourly.weathercode?.[index]),
          icon: weatherCodeIcon(hourly.weathercode?.[index], date.getHours()),
        },
      };
    })
    .filter(({ date }) => date >= now)
    .slice(0, 16)
    .map(({ item }) => item);
}

function buildOpenMeteoForecast(daily: {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  weathercode?: number[];
}): WeatherDay[] {
  return (daily.time ?? []).slice(1, 7).map((day, index) => {
    const date = new Date(`${day}T12:00:00`);
    const sourceIndex = index + 1;
    const label = date
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    return {
      label,
      date: day,
      icon: weatherCodeIcon(daily.weathercode?.[sourceIndex], 12),
      max: Math.round(daily.temperature_2m_max?.[sourceIndex] ?? 0),
      min: Math.round(daily.temperature_2m_min?.[sourceIndex] ?? 0),
      rainChance: Math.round(daily.precipitation_probability_max?.[sourceIndex] ?? 0),
    };
  });
}

function weatherCodeLabel(code?: number) {
  if (code === 0) return "Ceu limpo";
  if ([1, 2, 3].includes(code ?? -1)) return "Parcialmente nublado";
  if ([45, 48].includes(code ?? -1)) return "Neblina";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) {
    return "Chuva";
  }
  if ([95, 96, 99].includes(code ?? -1)) return "Tempestade";
  return "Clima local";
}

function weatherCodeIcon(code?: number, hour = new Date().getHours()) {
  const suffix = hour >= 19 || hour <= 5 ? "n" : "d";
  if (code === 0) return `01${suffix}`;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code ?? -1)) {
    return `10${suffix}`;
  }
  if ([1, 2].includes(code ?? -1)) return `02${suffix}`;
  return `04${suffix}`;
}

function formatOpenWeatherLocation(
  data: {
    name?: string;
    sys?: { country?: string };
  },
  fallbackCity: string,
) {
  const name = data.name?.trim();
  const country = data.sys?.country?.trim();
  if (name && country) return `${name}, ${country}`;
  return name || fallbackCity || "Local atual";
}

function getWeatherCoords(city: string): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(cityCoords(city));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(cityCoords(city)),
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 1000 * 60 * 30 },
    );
  });
}

function cityCoords(city: string) {
  if (/rio/i.test(city)) return { lat: -22.9068, lon: -43.1729 };
  if (/belo/i.test(city)) return { lat: -19.9167, lon: -43.9345 };
  if (/curitiba/i.test(city)) return { lat: -25.4284, lon: -49.2733 };
  return { lat: -23.5505, lon: -46.6333 };
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
