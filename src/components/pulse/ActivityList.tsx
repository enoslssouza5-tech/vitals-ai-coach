import React from "react";
import { ChevronRight, Flame, Trophy, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GoogleMapView } from "@/components/GoogleMapView";
import type { TreinoRegistro } from "@/lib/treino-history";
import { demoPath } from "@/lib/pulse-design-data";

type Quality = "Excelente" | "Muito bom" | "Bom";

type ActivityMetric = {
  label: string;
  value: string;
  isPr?: boolean;
};

type ActivityCardData = {
  id: string;
  title: string;
  turn: "Manha" | "Tarde" | "Noite" | "Madrugada";
  date: string;
  time: string;
  metrics: ActivityMetric[];
  quality: Quality;
  prBanner?: {
    icon: "trophy" | "flame" | "zap";
    text: string;
    detail?: string;
  };
  achievement?: {
    icon: "flame" | "zap" | "trophy";
    text: React.ReactNode;
  };
  route: [number, number][];
};

function shiftedPath(index: number): [number, number][] {
  const shift = index * 0.006;
  return demoPath.map(([lat, lng]) => [lat + shift, lng - shift]) as [number, number][];
}

const activities: ActivityCardData[] = [
  {
    id: "mock-rodagem-matinal",
    title: "Rodagem matinal",
    turn: "Manha",
    date: "Hoje",
    time: "07:15",
    metrics: [
      { label: "KM", value: "5,02" },
      { label: "PACE", value: "5'21\"", isPr: true },
      { label: "TEMPO", value: "26:52" },
    ],
    quality: "Muito bom",
    prBanner: {
      icon: "trophy",
      text: "Novo recorde de pace",
      detail: "melhor em 30 dias",
    },
    achievement: {
      icon: "flame",
      text: (
        <>
          Sequencia de <span className="text-[#C8FF00] font-bold">4 dias</span> ativa
        </>
      ),
    },
    route: shiftedPath(0),
  },
  {
    id: "mock-longao-segunda",
    title: "Longao de segunda",
    turn: "Manha",
    date: "Ontem",
    time: "06:48",
    metrics: [
      { label: "KM", value: "10,01" },
      { label: "PACE", value: "5'08\"" },
      { label: "TEMPO", value: "51:35" },
    ],
    quality: "Excelente",
    achievement: {
      icon: "trophy",
      text: (
        <>
          <span className="text-[#C8FF00] font-bold">2a corrida</span> acima de 10km esse mes
        </>
      ),
    },
    route: shiftedPath(1),
  },
  {
    id: "mock-tempo-run-parque",
    title: "Tempo Run no parque",
    turn: "Manha",
    date: "Sab",
    time: "07:02",
    metrics: [
      { label: "KM", value: "7,01" },
      { label: "PACE", value: "4'58\"" },
      { label: "TEMPO", value: "34:42" },
    ],
    quality: "Muito bom",
    route: shiftedPath(2),
  },
];

function IconByKind({ kind, className }: { kind: "trophy" | "flame" | "zap"; className: string }) {
  if (kind === "flame") return <Flame className={className} strokeWidth={1.8} />;
  if (kind === "zap") return <Zap className={className} strokeWidth={1.8} />;
  return <Trophy className={className} strokeWidth={1.8} />;
}

function MetricValue({ metric }: { metric: ActivityMetric }) {
  const tone =
    metric.label === "PACE"
      ? "text-[#C8FF00]"
      : metric.label === "TEMPO"
        ? "text-white"
        : "text-white";

  return (
    <div className="flex flex-col items-center py-3 gap-0.5">
      <motion.span
        className={`text-lg font-black tabular-nums ${tone}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {metric.value}
      </motion.span>
      <span className="text-[9px] text-gray-500 uppercase tracking-wide">{metric.label}</span>
    </div>
  );
}

const ActivityCard = React.memo(function ActivityCard({
  activity,
  index,
}: {
  activity: ActivityCardData;
  index: number;
}) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: "easeOut" }}
      whileTap={{ scale: 0.985 }}
      className="group relative mb-3 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#151515] text-left shadow-[0_14px_36px_rgba(0,0,0,0.2)] transition-colors duration-200 hover:border-white/10 hover:bg-[#181818] active:border-white/10"
      onClick={() =>
        navigate({
          to: "/atividades",
          search: { activityId: activity.id },
        })
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-white/[0.015] opacity-0 transition-opacity duration-200 group-active:opacity-100" />

      <div className="relative flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white leading-tight">{activity.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <span>{activity.date}</span>
              <span className="text-[#555555]"> · </span>
              <span>{activity.time}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-400/10 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            {activity.turn}
          </span>
        </div>

        <div className="relative h-40 w-full overflow-hidden border-y border-white/5 bg-[#0D0D0D]">
          <motion.div
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.05),transparent)]"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.12 + index * 0.04 }}
            className="relative h-full w-full"
          >
            <GoogleMapView
              paths={[activity.route]}
              className="w-full h-40 rounded-none opacity-95"
              interactive={false}
              showControls={false}
              defaultMode="roadmap"
              strokeColor="#C8FF00"
              strokeWeight={4}
              tilt={30}
              ariaLabel={`Miniatura do mapa de ${activity.title}`}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/5 bg-[#111111]">
          {activity.metrics.map((metric) => (
            <MetricValue key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <motion.span
            className="rounded-full border border-[#C8FF00]/10 bg-[#C8FF00]/8 px-3 py-1 text-xs font-bold text-[#C8FF00]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.14 + index * 0.06 }}
          >
            {activity.quality}
          </motion.span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-gray-500 transition-colors duration-150 group-active:bg-white/[0.06] group-active:text-[#C8FF00]">
            <ChevronRight className="h-4 w-4 transition-transform duration-150 group-active:translate-x-0.5" strokeWidth={1.8} />
          </span>
        </div>
      </div>

      {activity.achievement && (
        <motion.div
          className="relative flex items-center gap-1.5 px-4 pb-3"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.18 + index * 0.06 }}
        >
          <IconByKind kind={activity.achievement.icon} className="text-[#C8FF00]/90 h-3.5 w-3.5" />
          <span className="text-xs text-gray-400">{activity.achievement.text}</span>
        </motion.div>
      )}
    </motion.button>
  );
});

export const ActivityList = React.memo(function ActivityList({
  limit = 3,
}: {
  treinos: TreinoRegistro[];
  showBadge?: boolean;
  limit?: number;
}) {
  return (
    <div>
      {activities.slice(0, limit).map((activity, index) => (
        <ActivityCard key={activity.id} activity={activity} index={index} />
      ))}
    </div>
  );
});
