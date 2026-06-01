import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityList,
  AppHeader,
  AppScreen,
  CoachButton,
  DesignCard,
  SectionTitle,
  WeeklySummary,
} from "@/components/PulseUI";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
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
  CloudRain,
  Droplets,
  Flag,
  Footprints,
  Info,
  Moon,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Thermometer,
  Trophy,
  TrendingUp,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

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
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
};

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

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
    <AppScreen>
      <AppHeader title={<>Bom dia, {firstName}</>} subtitle="Seu painel de evolucao esta pronto." />

      <motion.div className="space-y-4" variants={containerVariants} initial={false} animate="show">
        <DesignCard variants={itemVariants}>
          <SectionTitle
            title="Semana"
            icon={<Calendar className="h-5 w-5 text-[#C8FF00]" strokeWidth={1.5} />}
            action={
              <span className="flex items-center gap-1">
                Detalhes <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
          <WeeklySummary />
        </DesignCard>

        <DesignCard variants={itemVariants} className="p-0">
          <WeatherCard city={perfil.cidade || "Sao Paulo"} />
        </DesignCard>

        {clima && clima.temp > 30 && (
          <DesignCard variants={itemVariants} className="border-[#C8FF00]/20 py-4">
            <p className="text-sm leading-relaxed text-[#A0A0A0]">
              Calor alto hoje: {clima.temp} C. Hidrate-se antes do treino.
            </p>
          </DesignCard>
        )}

        <DesignCard variants={itemVariants} className="border-[#C8FF00]/25">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#0A0A0A] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C8FF00]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
                Pulse Coach
              </div>
              <h2 className="max-w-[190px] text-[30px] font-black leading-[0.95] tracking-[-0.04em] text-white">
                Proximo nivel, sem quebrar.
              </h2>
            </div>
            <ReadinessRing value={82} />
          </div>

          <p className="text-[15px] leading-relaxed text-[#A0A0A0]">{briefing}</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <SignalMetric label="TSB" value="-4" status="ideal" />
            <SignalMetric label="Sono" value="7h20" status="ok" />
            <SignalMetric label="VITALs" value="78" status="bom" />
          </div>

          <div className="mt-5">
            <CoachButton>Ver treino recomendado</CoachButton>
          </div>
        </DesignCard>

        <DesignCard variants={itemVariants}>
          <div className="activities-header">
            <h2 className="activities-title">Atividades recentes</h2>
            <Link to="/atividades" className="activities-see-all">
              Ver todas <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <ActivityList treinos={treinos} showBadge limit={3} />
        </DesignCard>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <ReadinessCard fallbackCheckin={recuperacao} />
          <WeeklyFocusCard currentKm={currentWeekKm} defaultTargetKm={perfil.metaSemanalKm || 20} />
        </motion.div>
      </motion.div>
    </AppScreen>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid h-[112px] w-[112px] shrink-0 place-items-center">
      <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#0A0A0A" strokeWidth="9" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#C8FF00"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (value / 100)} ${circumference}`}
        />
      </svg>
      <div className="text-center">
        <div className="text-[30px] font-black leading-none text-white">{value}%</div>
        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#888888]">
          Prep.
        </div>
      </div>
    </div>
  );
}

function SignalMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#555555]">
        {label}
      </div>
      <div className="mt-2 text-[20px] font-black leading-none text-white">{value}</div>
      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#C8FF00]">
        {status}
      </div>
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
    const todayCheckin = readTodayCheckin(today) ?? (fallbackCheckin?.data === today ? fallbackCheckin : null);
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
        className="prontidao-card prontidao-card-empty card-interactive"
        onClick={() => navigate({ to: "/saude" })}
      >
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
            <text x="32" y="40" textAnchor="middle" className="fill-[#333333] text-[22px] font-black">
              ?
            </text>
          </svg>
        </div>
        <p className="text-center text-[13px] leading-snug text-[#888888]">
          Como seu corpo está hoje?
        </p>
        <span className="checkin-cta-btn">FAZER CHECK-IN →</span>
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
        className="prontidao-card prontidao-card-filled card-interactive"
        onClick={() => setDetailsOpen(true)}
        style={{
          borderColor: readinessBorder(checkin.score),
          "--score-color": scoreColor,
        } as React.CSSProperties}
      >
        <span className="prontidao-glow" style={{ background: scoreColor }} />
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
        <p className="relative text-[12px] leading-snug text-[#CCCCCC]">{recommendation}</p>
        <div className="prontidao-metrics">
          <ReadinessMetric icon={<Moon />} value={`${checkin.sono}h`} label="SONO" />
          <ReadinessMetric icon={<ActivityIcon />} value={`${checkin.score}%`} label="RECUP." />
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

function WeeklyFocusCard({
  currentKm,
}: {
  currentKm: number;
  defaultTargetKm: number;
}) {
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
    localStorage.setItem("pulse_weekly_goal", JSON.stringify({ km: nextGoal, updatedAt: new Date().toISOString() }));
    setGoalKm(nextGoal);
    setConfigOpen(false);
    setOptionsOpen(false);
  };

  if (!goalKm) {
    return (
      <>
        <button
          type="button"
          className="meta-card meta-card-empty card-interactive"
          onClick={() => setConfigOpen(true)}
        >
          <Target className="h-7 w-7 text-[#333333]" strokeWidth={1.7} />
          <div className="text-[14px] font-semibold text-white">Definir meta</div>
          <p className="max-w-[130px] text-center text-[12px] leading-snug text-[#555555]">
            Quanto quer correr essa semana?
          </p>
          <span className="set-goal-btn">CONFIGURAR</span>
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
        className="meta-card meta-card-filled card-interactive"
        onClick={() => setOptionsOpen(true)}
        style={{
          borderColor: completed ? "rgba(255,215,0,0.3)" : undefined,
          "--meta-color": progressColor,
        } as React.CSSProperties}
      >
        {completed && <span className="meta-complete-glow" />}
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
        <div className="meta-progress-display">
          <div className="meta-km-done" style={{ color: completed ? "#FFD700" : undefined }}>
            {formatKm(currentKm)} <span>km</span>
          </div>
          <div className="meta-progress-bar-track">
            <div
              className="meta-progress-bar-fill"
              style={{ width: `${Math.min(100, animatedProgress)}%`, background: progressColor }}
            />
          </div>
          <div className="meta-progress-labels">
            <span className="meta-percent" style={{ color: progressColor }}>
              {realProgress}%
            </span>
            <span className="meta-remaining">
              {completed ? "concluída" : `${formatKm(remaining)} km restantes`}
            </span>
          </div>
        </div>
        <div className="meta-next-card">
          <span className="meta-next-icon">
            <NextIcon />
          </span>
          <span className="meta-next-text">
            <span className="meta-next-label">Próximo</span>
            <span className="meta-next-desc">{next.text}</span>
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
  if (progress <= 85) return { icon: Flag, text: `${formatKm(remainingKm)} km para bater a meta essa semana` };
  if (progress < 100) return { icon: Star, text: `Quase lá! ${formatKm(remainingKm)} km para completar` };
  return { icon: Trophy, text: "Meta da semana concluída!" };
}

function formatKm(value: number) {
  return value.toFixed(1).replace(".", ",");
}

type WeatherDay = {
  label: string;
  icon: string;
  max: number;
};

type WeatherState = {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  rain: number;
  condition: string;
  icon: string;
  forecast: WeatherDay[];
};

function WeatherCard({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
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
          const fallback = await fetchOpenMeteoWeather(coords);
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
        if (cancelled) return;
        setWeather({
          temp: Math.round(current.main?.temp ?? 0),
          feelsLike: Math.round(current.main?.feels_like ?? current.main?.temp ?? 0),
          humidity: Math.round(current.main?.humidity ?? 0),
          wind: Math.round((current.wind?.speed ?? 0) * 3.6),
          rain: Math.round(
            current.rain?.["1h"] ? Math.min(100, Number(current.rain["1h"]) * 25) : 0,
          ),
          condition: capitalize(current.weather?.[0]?.description ?? "Clima local"),
          icon: current.weather?.[0]?.main ?? "Clouds",
          forecast: buildForecast(forecast.list ?? []),
        });
      } catch {
        try {
          coords = coords ?? (await getWeatherCoords(city));
          if (!coords) throw new Error("coords");
          const fallback = await fetchOpenMeteoWeather(coords);
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
  }, [apiKey, city]);

  const hasWeather = Boolean(weather);
  const recommendation = weather ? weatherRecommendation(weather.temp, weather.rain) : "";

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C8FF00]">
            Clima inteligente
          </div>
          <p className="mt-1 truncate text-[12px] text-[#888888]">{city}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A0A0A] text-[#C8FF00]">
          {hasWeather ? weatherIcon(weather.icon) : <Cloud className="h-6 w-6 text-[#555555]" />}
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-[30px] font-black leading-none text-white">
          {weather ? weather.temp : "--"}
        </span>
        <span className="pb-0.5 text-base font-black text-white">C</span>
        <p className="min-w-0 flex-1 truncate pb-1 text-[12px] text-[#888888]">
          {weather
            ? weather.condition
            : loading
              ? "Preparando clima local..."
              : "Configure a API do clima nas variaveis de ambiente"}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <WeatherInfo
          icon={<Thermometer />}
          label="Sens."
          value={weather ? `${weather.feelsLike} C` : "--"}
        />
        <WeatherInfo icon={<Droplets />} label="Umid." value={weather ? `${weather.humidity}%` : "--"} />
        <WeatherInfo icon={<Wind />} label="Vento" value={weather ? `${weather.wind}` : "--"} />
        <WeatherInfo icon={<CloudRain />} label="Chuva" value={weather ? `${weather.rain}%` : "--"} />
      </div>

      <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-snug text-[#888888]">
        {weather
          ? recommendation
          : "Quando a API estiver configurada, o Pulse ajusta a recomendacao ao clima local."}
      </div>
    </section>
  );
}

function WeatherInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#0A0A0A] px-1.5 py-2">
      <div className="flex justify-center text-[#555555] [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div className="mt-1 truncate text-center text-[9px] font-black uppercase tracking-[0.04em] text-[#555555]">
        {label}
      </div>
      <div className="mt-1 truncate text-center text-[12px] font-black text-white">{value}</div>
    </div>
  );
}

function weatherIcon(icon: string) {
  if (/rain|drizzle|thunder/i.test(icon))
    return <CloudRain className="h-6 w-6" strokeWidth={1.7} />;
  if (/clear|sun/i.test(icon)) return <Sun className="h-6 w-6" strokeWidth={1.7} />;
  return <Cloud className="h-6 w-6" strokeWidth={1.7} />;
}

function weatherRecommendation(temp: number, rain: number) {
  if (rain > 50) return "Chuva provavel - considere treino indoor.";
  if (temp < 15) return "Frio - vista camadas e comece em ritmo mais lento.";
  if (temp <= 25) return "Clima ideal para treinar.";
  if (temp <= 32) return "Quente - hidrate-se bem e reduza o pace.";
  return "Muito quente - prefira horarios mais frescos.";
}

function fallbackForecast(): WeatherDay[] {
  return ["Hoje", "Amanha", "Depois", "Sexta"].map((label) => ({ label, icon: "Clouds", max: 0 }));
}

function buildForecast(
  list: Array<{
    dt_txt?: string;
    main?: { temp_max?: number };
    weather?: Array<{ main?: string }>;
  }>,
): WeatherDay[] {
  const byDay = new Map<string, WeatherDay>();
  list.forEach((item) => {
    if (!item.dt_txt) return;
    const date = new Date(item.dt_txt.replace(" ", "T"));
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const existing = byDay.get(key);
    const max = Math.round(item.main?.temp_max ?? 0);
    byDay.set(key, {
      label: byDay.size === 0 ? "Hoje" : capitalize(label),
      icon: item.weather?.[0]?.main ?? existing?.icon ?? "Clouds",
      max: Math.max(existing?.max ?? -99, max),
    });
  });
  return Array.from(byDay.values()).slice(0, 4);
}

async function fetchOpenMeteoWeather(coords: { lat: number; lon: number }): Promise<WeatherState> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,weathercode");
  url.searchParams.set("forecast_days", "4");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("open-meteo");
  const data = await response.json();
  const current = data.current ?? {};
  const daily = data.daily ?? {};

  return {
    temp: Math.round(current.temperature_2m ?? 0),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    wind: Math.round(current.wind_speed_10m ?? 0),
    rain: Math.round(current.precipitation ? Math.min(100, Number(current.precipitation) * 25) : 0),
    condition: weatherCodeLabel(current.weathercode),
    icon: weatherCodeIcon(current.weathercode),
    forecast: buildOpenMeteoForecast(daily),
  };
}

function buildOpenMeteoForecast(daily: {
  time?: string[];
  temperature_2m_max?: number[];
  weathercode?: number[];
}): WeatherDay[] {
  return (daily.time ?? []).slice(0, 4).map((day, index) => {
    const date = new Date(`${day}T12:00:00`);
    const label = index === 0
      ? "Hoje"
      : capitalize(date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""));
    return {
      label,
      icon: weatherCodeIcon(daily.weathercode?.[index]),
      max: Math.round(daily.temperature_2m_max?.[index] ?? 0),
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

function weatherCodeIcon(code?: number) {
  if (code === 0) return "Clear";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code ?? -1)) {
    return "Rain";
  }
  return "Clouds";
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
