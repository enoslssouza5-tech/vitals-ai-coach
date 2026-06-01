import React from "react";
import { ChevronRight, Flame, Trophy, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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
          Sequencia de <span className="achievement-highlight">4 dias</span> ativa
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
          <span className="achievement-highlight">2a corrida</span> acima de 10km esse mes
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

const turnStyles: Record<ActivityCardData["turn"], string> = {
  Manha: "border-[#FFB80033] bg-[#1A1500] text-[#FFB800]",
  Tarde: "border-[#FF6B0033] bg-[#1A0A00] text-[#FF6B00]",
  Noite: "border-[#8888FF33] bg-[#0A0A1A] text-[#8888FF]",
  Madrugada: "border-[#6666CC33] bg-[#0A0A14] text-[#6666CC]",
};

const qualityStyles: Record<Quality, string> = {
  Excelente: "badge-excelente",
  "Muito bom": "badge-muito-bom",
  Bom: "badge-bom",
};

function IconByKind({ kind, className }: { kind: "trophy" | "flame" | "zap"; className: string }) {
  if (kind === "flame") return <Flame className={className} strokeWidth={1.8} />;
  if (kind === "zap") return <Zap className={className} strokeWidth={1.8} />;
  return <Trophy className={className} strokeWidth={1.8} />;
}

const ActivityCard = React.memo(function ActivityCard({ activity }: { activity: ActivityCardData }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="activity-card block w-full text-left"
      onClick={() =>
        navigate({
          to: "/atividades",
          search: { activityId: activity.id },
        })
      }
    >
      {activity.prBanner && (
        <div className="pr-banner">
          <IconByKind kind={activity.prBanner.icon} className="pr-banner-icon h-3.5 w-3.5" />
          <span className="pr-banner-text">{activity.prBanner.text}</span>
          {activity.prBanner.detail && (
            <span className="pr-banner-detail">{activity.prBanner.detail}</span>
          )}
        </div>
      )}

      <div className="flex flex-col p-4 gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="activity-title">{activity.title}</div>
            <div className="activity-datetime mt-1">
              <span>{activity.date}</span>
              <span className="text-[#555555]">•</span>
              <span>{activity.time}</span>
            </div>
          </div>
          <span className={`activity-turn-badge border ${turnStyles[activity.turn]}`}>
            {activity.turn}
          </span>
        </div>

        <GoogleMapView
          paths={[activity.route]}
          className="w-full h-40 rounded-xl"
          interactive={false}
          showControls={false}
          defaultMode="roadmap"
          strokeColor="#C8FF00"
          strokeWeight={4}
          tilt={30}
          ariaLabel={`Miniatura do mapa de ${activity.title}`}
        />

        <div className="flex flex-col gap-3">
          <div className="activity-metrics w-full">
            {activity.metrics.map((metric) => (
              <div key={metric.label} className="activity-metric">
                <span className={`activity-metric-value ${metric.isPr ? "text-[#C8FF00]" : ""}`}>
                  {metric.value}
                </span>
                <span className="activity-metric-label">{metric.label}</span>
              </div>
            ))}
          </div>

          <div className="activity-quality-row">
            <span className={`activity-quality-badge ${qualityStyles[activity.quality]}`}>
              {activity.quality}
            </span>
            <ChevronRight className="activity-arrow h-4 w-4" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      {activity.achievement && (
        <div className="activity-achievement">
          <IconByKind kind={activity.achievement.icon} className="achievement-icon h-3.5 w-3.5" />
          <span className="achievement-text">{activity.achievement.text}</span>
        </div>
      )}
    </button>
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
    <div className="dashboard-activities space-y-3">
      {activities.slice(0, limit).map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
});
