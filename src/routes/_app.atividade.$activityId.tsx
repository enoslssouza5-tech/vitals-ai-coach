import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  Activity,
  Clock,
  Flame,
  Footprints,
  HeartPulse,
  MapPinOff,
  RouteIcon,
  Timer,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { GoogleMapView } from "@/components/GoogleMapView";
import { kmTreino } from "@/lib/pulse-data";
import { listarTreinos, type TreinoRegistro } from "@/lib/treino-history";

export const Route = createFileRoute("/_app/atividade/$activityId")({ component: ActivityReport });

function ActivityReport() {
  const { activityId } = Route.useParams();
  const navigate = useNavigate();
  const treinos = useMemo(() => ordenarTreinos(listarTreinos()), []);
  const treino = useMemo(
    () => treinos.find((item) => item.id === activityId) ?? null,
    [activityId, treinos],
  );

  const analysis = useMemo(() => (treino ? buildAnalysis(treino, treinos) : []), [treino, treinos]);
  const achievements = useMemo(
    () => (treino ? buildAchievements(treino, treinos) : []),
    [treino, treinos],
  );
  const comparison = useMemo(
    () => (treino ? buildComparison(treino, treinos) : null),
    [treino, treinos],
  );

  if (!treino) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-4 pt-safe text-white">
        <div className="pt-5">
          <button
            type="button"
            onClick={() => navigate({ to: "/atividades" })}
            className={iconButtonClass}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
          </button>
          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#111111] p-5 text-center">
            <RouteIcon className="mx-auto h-8 w-8 text-[#6B7280]" strokeWidth={1.6} />
            <p className="mt-3 text-sm font-bold text-white">Atividade nao encontrada.</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              O treino pode ter sido removido do historico deste dispositivo.
            </p>
            <Link to="/atividades" className={`${primaryButtonClass} mt-4`}>
              Voltar para atividades
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pontos = routePoints(treino);
  const dateTime = formatDateTime(treino.data);

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
          className="flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/atividades" })}
            className={iconButtonClass}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
          </button>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">
              {sportLabel(treino.modalidade)}
            </p>
            <h1 className="mt-1 truncate text-[24px] font-black leading-tight">
              {treinoTitle(treino)}
            </h1>
          </div>
        </motion.header>

        <motion.section
          variants={sectionVariants}
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]"
        >
          <RoutePreview
            pontos={pontos}
            title={treinoTitle(treino)}
            layoutId={`activity-map-${treino.id}`}
          />
          <div className="p-4">
            <p className="text-sm font-bold text-white">{dateTime.full}</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {dateTime.time} - {sportLabel(treino.modalidade)}
            </p>
          </div>
        </motion.section>

        <motion.section
          variants={sectionVariants}
          className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
        >
          <h2 className="text-base font-black">Resumo</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ReportMetric
              icon={Footprints}
              label="Distancia"
              value={`${formatKm(kmTreino(treino))} km`}
            />
            <ReportMetric
              icon={TrendingUp}
              label={metricLabelFor(treino.modalidade)}
              value={activityPace(treino)}
            />
            <ReportMetric icon={Timer} label="Tempo" value={formatDuration(treino.duracaoSeg)} />
            <ReportMetric
              icon={Flame}
              label="Calorias"
              value={`${Math.round(treino.caloriasKcal ?? 0)} kcal`}
            />
            {typeof treino.fcMedia === "number" && (
              <ReportMetric
                icon={HeartPulse}
                label="FC media"
                value={`${Math.round(treino.fcMedia)} bpm`}
              />
            )}
            <ReportMetric icon={Activity} label="Esporte" value={sportLabel(treino.modalidade)} />
          </div>
        </motion.section>

        {buildSplits(treino).length > 0 && (
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
          >
            <h2 className="text-base font-black">Splits</h2>
            <div className="mt-3 space-y-2">
              {buildSplits(treino).map((split) => (
                <div
                  key={split.km}
                  className="flex min-h-11 items-center justify-between rounded-xl bg-[#0A0A0A] px-3"
                >
                  <span className="text-sm font-bold text-white">Km {split.km}</span>
                  <span className="text-sm font-black text-[#C8FF00]">{split.value}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {analysis.length > 0 && (
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
          >
            <h2 className="text-base font-black">Analise da atividade</h2>
            <div className="mt-3 space-y-2">
              {analysis.map((item) => (
                <p
                  key={item}
                  className="rounded-xl bg-[#0A0A0A] p-3 text-sm leading-relaxed text-[#D1D5DB]"
                >
                  {item}
                </p>
              ))}
            </div>
          </motion.section>
        )}

        {achievements.length > 0 && (
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-[#C8FF00]/15 bg-[#111111] p-4"
          >
            <h2 className="text-base font-black">Conquistas</h2>
            <div className="mt-3 grid gap-2">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.text}
                    className="flex items-center gap-3 rounded-xl bg-[#C8FF00]/[0.06] p-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#C8FF00]" strokeWidth={1.8} />
                    <p className="text-sm font-semibold text-[#D1D5DB]">{achievement.text}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {comparison && (
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
          >
            <h2 className="text-base font-black">Comparacao</h2>
            <p className="mt-3 rounded-xl bg-[#0A0A0A] p-3 text-sm leading-relaxed text-[#D1D5DB]">
              {comparison}
            </p>
          </motion.section>
        )}
      </motion.div>
    </main>
  );
}

function RoutePreview({
  pontos,
  title,
  layoutId,
}: {
  pontos: [number, number][];
  title: string;
  layoutId: string;
}) {
  if (pontos.length < 2) {
    return (
      <motion.div layoutId={layoutId} className="grid h-[320px] place-items-center bg-[#0A0A0A]">
        <div className="text-center">
          <MapPinOff className="mx-auto h-8 w-8 text-[#6B7280]" strokeWidth={1.6} />
          <p className="mt-2 text-xs font-semibold text-[#6B7280]">
            Rota indisponivel para esta atividade.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layoutId={layoutId} className="relative h-[320px] overflow-hidden bg-[#0A0A0A]">
      <GoogleMapView
        paths={[pontos]}
        className="h-full w-full rounded-none opacity-95"
        interactive
        showControls
        fitToPath
        defaultMode="roadmap"
        strokeColor="#C8FF00"
        strokeWeight={5}
        tilt={30}
        terrain={false}
        ariaLabel={`Mapa da atividade ${title}`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111111] to-transparent" />
    </motion.div>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-[#0A0A0A] p-3">
      <Icon className="mb-3 h-4 w-4 text-[#C8FF00]" strokeWidth={1.8} />
      <p className="truncate text-lg font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </p>
    </div>
  );
}

type Achievement = {
  icon: LucideIcon;
  text: string;
};

function buildSplits(treino: TreinoRegistro) {
  const splits = (treino as TreinoRegistro & { splits?: Array<{ km?: number; pace?: string }> })
    .splits;
  if (!Array.isArray(splits)) return [];
  return splits
    .filter((split) => typeof split.km === "number" && split.pace)
    .map((split) => ({ km: Number(split.km), value: String(split.pace) }));
}

function buildAnalysis(treino: TreinoRegistro, treinos: TreinoRegistro[]) {
  const analysis: string[] = [];
  if (treino.analiseIA) analysis.push(treino.analiseIA);

  const previousSimilar = previousSimilarWorkout(treino, treinos);
  const currentPace = paceSeconds(treino);
  const previousPace = previousSimilar ? paceSeconds(previousSimilar) : null;
  if (currentPace && previousPace && currentPace < previousPace) {
    analysis.push("Seu ritmo foi melhor que na atividade semelhante anterior.");
  }

  const average = averagePace(
    treinos.filter((item) => item.modalidade === treino.modalidade && item.id !== treino.id),
  );
  if (currentPace && average && currentPace < average) {
    analysis.push("Seu pace ficou melhor que sua media recente nesta modalidade.");
  }

  return Array.from(new Set(analysis)).slice(0, 3);
}

function buildAchievements(treino: TreinoRegistro, treinos: TreinoRegistro[]): Achievement[] {
  const sameSport = treinos.filter((item) => item.modalidade === treino.modalidade);
  const achievements: Achievement[] = [];
  const longest = [...sameSport].sort((a, b) => kmTreino(b) - kmTreino(a))[0];
  if (longest?.id === treino.id && kmTreino(treino) > 0 && sameSport.length >= 2) {
    achievements.push({ icon: Footprints, text: "Maior distancia registrada nesta modalidade." });
  }

  const best = bestPaceWorkout(sameSport);
  if (best?.id === treino.id && sameSport.length >= 2) {
    achievements.push({ icon: Trophy, text: "Melhor pace registrado nesta modalidade." });
  }

  const streakDays = activeStreakAt(treino, treinos);
  if (streakDays >= 2) {
    achievements.push({ icon: Flame, text: `Sequencia mantida por ${streakDays} dias.` });
  }

  return achievements;
}

function buildComparison(treino: TreinoRegistro, treinos: TreinoRegistro[]) {
  const previous = previousSimilarWorkout(treino, treinos);
  if (!previous) return null;
  const currentPace = paceSeconds(treino);
  const previousPace = paceSeconds(previous);
  if (currentPace && previousPace) {
    const seconds = Math.round(previousPace - currentPace);
    if (seconds > 0)
      return `Voce foi ${seconds}s/km mais rapido que a atividade semelhante anterior.`;
    if (seconds < 0)
      return `Voce ficou ${Math.abs(seconds)}s/km acima do ritmo da atividade semelhante anterior.`;
  }

  const currentKm = kmTreino(treino);
  const previousKm = kmTreino(previous);
  if (currentKm > 0 && previousKm > 0 && currentKm !== previousKm) {
    const diff = currentKm - previousKm;
    return `${diff > 0 ? "Voce percorreu" : "Voce percorreu"} ${formatKm(Math.abs(diff))} km ${diff > 0 ? "a mais" : "a menos"} que a atividade semelhante anterior.`;
  }
  return null;
}

function previousSimilarWorkout(treino: TreinoRegistro, treinos: TreinoRegistro[]) {
  return (
    ordenarTreinos(
      treinos.filter(
        (item) =>
          item.modalidade === treino.modalidade && new Date(item.data) < new Date(treino.data),
      ),
    )[0] ?? null
  );
}

function averagePace(treinos: TreinoRegistro[]) {
  const values = treinos.map(paceSeconds).filter((value): value is number => Boolean(value));
  if (values.length < 2) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function activeStreakAt(treino: TreinoRegistro, treinos: TreinoRegistro[]) {
  const days = new Set(treinos.map((item) => startOfDay(new Date(item.data)).getTime()));
  let count = 0;
  const cursor = startOfDay(new Date(treino.data));
  while (days.has(cursor.getTime())) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
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

function sportCategory(value: string) {
  const normalized = value.toLowerCase();
  if (["cycling", "bike", "ciclismo"].includes(normalized)) return "Bike";
  return "Corrida";
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
  return sportCategory(modalidade) === "Bike" ? "Velocidade" : "Pace";
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
    full: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function formatKm(value: number) {
  return value.toFixed(value >= 10 ? 1 : 2).replace(".", ",");
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
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

const iconButtonClass =
  "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border border-white/[0.06] bg-[#111111] text-[#A3A3A3] transition-colors duration-200 hover:border-white/20 hover:text-white active:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00]/70 disabled:pointer-events-none disabled:opacity-50";
