import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Bike,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  CloudSun,
  Crosshair,
  Dumbbell,
  Expand,
  Flag,
  Footprints,
  Heart,
  Map,
  MapPin,
  MapPinOff,
  MoreHorizontal,
  Mountain,
  Pause,
  Play,
  Save,
  Share2,
  Shield,
  Square,
  Trash2,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleMapView, type GoogleRouteMarker } from "@/components/GoogleMapView";
import { estimarCalorias, fmtDuracao, haversine, salvarTreino } from "@/lib/treino-history";
import { demoPath } from "@/lib/pulse-design-data";
import type { LatLngTuple } from "@/lib/google-maps";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

type Stage = "setup" | "active" | "finished";
type Goal = "distance" | "time" | "free";
type IconComponent = typeof Footprints;

type SportCategory = {
  icon: IconComponent;
  name: string;
  sports: string[];
};

const stageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" } },
};

const sportCategories: SportCategory[] = [
  {
    icon: Footprints,
    name: "Corrida e Caminhada",
    sports: [
      "Corrida de rua",
      "Trail running",
      "Corrida na esteira",
      "Caminhada",
      "Corrida com obstaculos",
      "Marcha atletica",
    ],
  },
  {
    icon: Bike,
    name: "Ciclismo",
    sports: [
      "Ciclismo de estrada",
      "Mountain bike",
      "Ciclismo indoor",
      "BMX urbano",
      "Cicloturismo",
      "Gravel",
    ],
  },
  {
    icon: Waves,
    name: "Natacao e Agua",
    sports: ["Natacao em piscina", "Aguas abertas", "Triathlon", "Remo", "Kayak", "SUP"],
  },
  {
    icon: Users,
    name: "Esportes Coletivos",
    sports: ["Futebol", "Futsal", "Basquete", "Volei", "Handebol", "Rugby"],
  },
  {
    icon: CircleDot,
    name: "Esportes de Raquete",
    sports: ["Tenis", "Padel", "Beach tennis", "Squash", "Badminton", "Pickleball"],
  },
  {
    icon: Shield,
    name: "Lutas e Artes Marciais",
    sports: ["Boxe", "Muay Thai", "Jiu-jitsu", "MMA", "Judo", "Karate"],
  },
  {
    icon: Heart,
    name: "Bem-estar e Mobilidade",
    sports: ["Yoga", "Pilates", "Alongamento", "Mobilidade", "Danca", "Meditacao ativa"],
  },
  {
    icon: Dumbbell,
    name: "Forca e Potencia",
    sports: ["Musculacao", "Powerlifting", "Halterofilismo", "Calistenia", "Funcional", "HIIT"],
  },
  {
    icon: Mountain,
    name: "Aventura e Outdoor",
    sports: ["Trilha", "Escalada", "Rapel", "Ski", "Surfe", "Parkour"],
  },
  {
    icon: MoreHorizontal,
    name: "Outros Esportes",
    sports: ["Equitacao", "Golfe", "Boliche", "Patinacao", "Outro"],
  },
];

const recentSports = ["Corrida de rua", "Musculacao", "Ciclismo de estrada"];
const splitRows = [
  { km: 1, pace: "5'02\"", delta: "-4s", fast: false },
  { km: 2, pace: "4'56\"", delta: "-6s", fast: true },
  { km: 3, pace: "5'08\"", delta: "+12s", fast: false },
  { km: 4, pace: "5'01\"", delta: "-7s", fast: false },
];

function TreinoPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [sport, setSport] = useState("");
  const [openCategory, setOpenCategory] = useState("Corrida e Caminhada");
  const [goal, setGoal] = useState<Goal>("free");
  const [goalValue, setGoalValue] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [satellite, setSatellite] = useState(false);
  const [showKmToast, setShowKmToast] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [gpsRoute, setGpsRoute] = useState<LatLngTuple[]>([]);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [gpsDistanceMeters, setGpsDistanceMeters] = useState(0);
  const [stopProgress, setStopProgress] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const stopTimer = useRef<number | null>(null);
  const stopProgressTimer = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVoiceEnabled(localStorage.getItem("pulse_voice_coach") !== "off");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pulse_voice_coach", voiceEnabled ? "on" : "off");
  }, [voiceEnabled]);

  useEffect(() => {
    if (stage !== "active" || paused) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, stage]);

  useEffect(() => {
    if (stage !== "active" || seconds === 0 || seconds % 18 !== 0) return;
    setShowKmToast(true);
    const timeout = window.setTimeout(() => setShowKmToast(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [seconds, stage]);

  useEffect(() => {
    if (stage !== "active" || typeof navigator === "undefined" || !navigator.geolocation) return;
    let lastPoint: LatLngTuple | null = null;
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: LatLngTuple = [position.coords.latitude, position.coords.longitude];
        if (typeof position.coords.heading === "number" && isFinite(position.coords.heading)) {
          setCurrentHeading(position.coords.heading);
        }
        if (lastPoint) {
          const meters = haversine(lastPoint, point);
          if (meters > 1 && meters < 100) {
            setGpsDistanceMeters((current) => current + meters);
          }
        }
        lastPoint = point;
        setGpsRoute((route) => [...route, point]);
        setLocationBlocked(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setLocationBlocked(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 3,
      } as PositionOptions & { distanceFilter: number },
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [stage]);

  const demoLiveRoute = useMemo(() => {
    const count = Math.max(2, Math.min(demoPath.length, Math.floor(seconds / 3) + 2));
    return demoPath.slice(0, count) as [number, number][];
  }, [seconds]);
  const liveRoute = gpsRoute.length >= 2 ? gpsRoute : demoLiveRoute;

  const distance = useMemo(() => {
    if (stage === "setup") return 0;
    if (gpsDistanceMeters > 0) return gpsDistanceMeters / 1000;
    const speed = sportType(sport) === "cycling" ? 0.0062 : sportType(sport) === "workout" ? 0 : 0.00285;
    return Math.max(0, seconds * speed);
  }, [gpsDistanceMeters, seconds, sport, stage]);

  const calories = estimarCalorias(sportType(sport), seconds || 1);
  const pace = distance > 0 ? seconds / 60 / distance : 0;
  const paceText =
    pace > 0
      ? `${Math.floor(pace)}'${String(Math.round((pace % 1) * 60)).padStart(2, "0")}"`
      : "--:--";
  const averagePace = distance > 0 ? `${paceText}/km` : "--:--/km";

  const liveMarkers = useMemo<GoogleRouteMarker[]>(() => {
    if (liveRoute.length === 0) return [];
    const completeKm = Math.floor(gpsDistanceMeters / 1000);
    const kmMarkers = Array.from({ length: completeKm })
      .map(
        (_, index) =>
          liveRoute[
            Math.min(
              liveRoute.length - 1,
              Math.round(((index + 1) / Math.max(1, completeKm + 1)) * (liveRoute.length - 1)),
            )
          ],
      )
      .filter(Boolean)
      .map((position, index) => ({
        position,
        kind: "km" as const,
        label: String(index + 1),
      }));

    return [
      { position: liveRoute[0], kind: "start" },
      ...kmMarkers,
      { position: liveRoute[liveRoute.length - 1], kind: "current" },
    ];
  }, [gpsDistanceMeters, liveRoute]);

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const requestLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return true;
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (permission.state === "denied") {
        setLocationBlocked(true);
        return false;
      }
    } catch {
      return true;
    }
    return true;
  };

  const start = async () => {
    if (!sport) return;
    const canUseLocation = await requestLocation();
    if (!canUseLocation) return;
    setSeconds(0);
    setPaused(false);
    setShowKmToast(false);
    setGpsRoute([]);
    setGpsDistanceMeters(0);
    setCurrentHeading(0);
    setStage("active");
  };

  const finish = () => {
    if (watchId.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setPaused(true);
    clearStopTimers();
    setStopProgress(0);
    setStage("finished");
  };

  const clearStopTimers = () => {
    if (stopTimer.current != null) window.clearTimeout(stopTimer.current);
    if (stopProgressTimer.current != null) window.clearInterval(stopProgressTimer.current);
    stopTimer.current = null;
    stopProgressTimer.current = null;
  };

  const startStopHold = () => {
    clearStopTimers();
    const startedAt = Date.now();
    setStopProgress(0);
    stopProgressTimer.current = window.setInterval(() => {
      setStopProgress(Math.min(100, ((Date.now() - startedAt) / 800) * 100));
    }, 16);
    stopTimer.current = window.setTimeout(finish, 800);
  };

  const cancelStopHold = () => {
    clearStopTimers();
    setStopProgress(0);
  };

  const save = () => {
    salvarTreino({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      data: new Date().toISOString(),
      modalidade: sportType(sport),
      duracaoSeg: seconds,
      distanciaMetros: Math.round(distance * 1000),
      caloriasKcal: calories,
      ritmoMedio: distance > 0 ? averagePace : null,
      coordenadas: liveRoute,
      analiseIA: note || "Treino salvo pelo Pulse Coach.",
    });
    toast.success("Atividade salva.");
    resetWorkout();
  };

  const resetWorkout = () => {
    setStage("setup");
    setSeconds(0);
    setPaused(false);
    setGpsRoute([]);
    setGpsDistanceMeters(0);
    setCurrentHeading(0);
    setNote("");
    setConfirmDiscard(false);
    setStopProgress(0);
  };

  return (
    <main className="screen-container treino-screen bg-[#0A0A0A] px-0 pt-0 text-white">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "setup" && (
          <motion.section
            key="setup"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="px-5 pb-28"
          >
            <PreWorkoutHeader currentDate={currentDate} />
            <CoachCard />
            <WeatherStrip />
            <SportSelector
              selectedSport={sport}
              openCategory={openCategory}
              onOpenCategory={setOpenCategory}
              onSelect={setSport}
            />
            <GoalSelector goal={goal} goalValue={goalValue} onGoal={setGoal} onValue={setGoalValue} />
            {locationBlocked && <LocationBlockedCard />}
            <motion.button
              whileTap={{ scale: sport ? 0.97 : 1 }}
              onClick={start}
              disabled={!sport}
              className={sport ? "btn-iniciar-active mt-5" : "btn-iniciar-disabled mt-5"}
            >
              <Play className="h-5 w-5 fill-current" />
              INICIAR TREINO
            </motion.button>
          </motion.section>
        )}

        {stage === "active" && (
          <motion.section
            key="active"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen bg-[#0A0A0A]"
          >
            <div className="map-container-active">
              <GoogleMapView
                paths={[liveRoute]}
                markers={liveMarkers}
                className="h-full w-full"
                interactive={false}
                showControls={false}
                followLastPoint
                fitToPath={false}
                defaultMode={satellite ? "hybrid" : "roadmap"}
                strokeColor="#C8FF00"
                strokeWeight={5}
                tilt={60}
                heading={currentHeading || seconds * 3}
                terrain
                ariaLabel="Mapa ao vivo do treino"
              />
              <div className="map-fade-bottom" />
              <div className="map-top-overlay">
                <span className="floating-map-pill">
                  <Footprints className="h-3.5 w-3.5" />
                  {sport || "Corrida"}
                </span>
                <span className="floating-map-pill text-white">
                  <Clock className="h-3.5 w-3.5 text-[#C8FF00]" />
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <button
                type="button"
                className="satellite-toggle"
                onClick={() => setSatellite((current) => !current)}
              >
                {satellite ? <SatelliteIcon /> : <Map className="h-3.5 w-3.5" />}
                {satellite ? "Satelite" : "Mapa"}
              </button>
              <button
                type="button"
                className="camera-center"
                onClick={() => window.dispatchEvent(new Event("pulse-map-center"))}
              >
                <Crosshair className="h-5 w-5" />
              </button>
              <button
                type="button"
                className={`voice-toggle ${voiceEnabled ? "active" : ""}`}
                onClick={() => setVoiceEnabled((current) => !current)}
                aria-label={voiceEnabled ? "Coach de voz ativado" : "Coach de voz silenciado"}
              >
                {voiceEnabled ? <Volume2 /> : <VolumeX />}
              </button>
              <div className="current-position-dot" />
            </div>

            <div className="metrics-panel">
              {showKmToast && (
                <div className="km-toast">
                  <Flag className="h-4 w-4 text-[#C8FF00]" />
                  <span className="km-toast-text">Km {Math.max(1, Math.floor(seconds / 18))}</span>
                  <span className="km-toast-split">{paceText} melhorando</span>
                </div>
              )}
              <div className="primary-metrics">
                <MetricHero label="PACE ATUAL" value={paceText} unit="/km" trend="subindo" />
                <MetricHero
                  label="DISTANCIA"
                  value={distance.toFixed(2)}
                  unit="km"
                  progress={goal === "distance" ? Math.min(100, (distance / 5) * 100) : undefined}
                />
              </div>
              <div className="secondary-metrics">
                <MetricSecondary label="TEMPO" value={fmtDuracao(seconds).slice(3)} />
                <MetricSecondary label="CALORIAS" value={String(calories)} />
                <MetricSecondary label="RITMO MEDIO" value={averagePace.replace("/km", "")} />
              </div>
              <SplitsRow seconds={seconds} />
              <div className="training-controls">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setPaused((current) => !current)}
                  className={`btn-pause ${paused ? "paused" : ""}`}
                >
                  {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5" />}
                  {paused ? "RETOMAR" : "PAUSAR"}
                </motion.button>
                <button
                  type="button"
                  className="btn-stop"
                  onPointerDown={startStopHold}
                  onPointerUp={cancelStopHold}
                  onPointerLeave={cancelStopHold}
                  aria-label="Segure para encerrar treino"
                >
                  <span style={{ width: `${stopProgress}%` }} />
                  <Square className="relative z-10 h-5 w-5 fill-current" />
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {stage === "finished" && (
          <motion.section
            key="finished"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="px-5 pb-24"
          >
            <header className="post-workout-header">
              <div className="congrats-label">TREINO CONCLUIDO</div>
              <h1 className="congrats-title">
                {distance > 5 || seconds > 2400
                  ? "Voce foi incrivel hoje."
                  : distance > 2
                    ? "Treino solido. Continue assim."
                    : "Missao cumprida."}
              </h1>
              <p className="congrats-subtitle">
                {fmtDuracao(seconds)} de {sport || "corrida"}
              </p>
            </header>

            <div className="post-route-map">
              <GoogleMapView
                paths={[demoPath as [number, number][]]}
                className="h-full w-full"
                interactive={false}
                showControls={false}
                defaultMode="roadmap"
                strokeColor="#C8FF00"
                strokeWeight={5}
                tilt={30}
                ariaLabel="Mapa da rota completa"
              />
              <button type="button" className="expand-map">
                <Expand className="h-4 w-4" />
                Expandir
              </button>
            </div>

            <div className="post-stats-grid">
              <PostStat label="DISTANCIA" value={distance.toFixed(2)} unit="km" compare="+8% vs semana" pr />
              <PostStat label="PACE MEDIO" value={paceText} unit="/km" compare="melhor split no km 2" pr />
              <PostStat label="TEMPO" value={fmtDuracao(seconds).slice(3)} compare="ritmo constante" />
              <PostStat label="CALORIAS" value={String(calories)} unit="kcal" compare="+42 vs media" />
            </div>

            {distance >= 0 && (
              <div className="pr-full-banner">
                <Trophy className="h-8 w-8 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
                <div className="min-w-0">
                  <div className="font-bold text-white">Novo recorde pessoal</div>
                  <p className="mt-1 text-xs leading-relaxed text-[#888888]">
                    Pace medio melhor que sua referencia dos ultimos 30 dias. Adicionado as suas conquistas.
                  </p>
                </div>
              </div>
            )}

            <SplitsTable />

            <div className="workout-note">
              <textarea
                value={note}
                maxLength={280}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Como foi? Adicione uma nota sobre esse treino..."
              />
              <div className="mt-2 text-right text-[11px] text-[#555555]">{note.length}/280</div>
            </div>

            {confirmDiscard && (
              <div className="mb-3 rounded-xl border border-white/[0.08] bg-[#111111] p-3 text-sm text-[#CCCCCC]">
                Descartar este treino sem salvar?
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDiscard(false)}
                    className="h-10 rounded-lg bg-[#1A1A1A] text-xs font-bold text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={resetWorkout}
                    className="h-10 rounded-lg border border-[#C8FF00] text-xs font-bold text-[#C8FF00]"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            <div className="post-actions">
              <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={save} className="btn-save">
                <Save className="h-5 w-5" />
                SALVAR ATIVIDADE
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} type="button" className="btn-share">
                <Share2 className="h-4 w-4 text-[#C8FF00]" />
                Compartilhar resultado
              </motion.button>
              <button type="button" onClick={() => setConfirmDiscard(true)} className="btn-discard">
                <Trash2 className="h-4 w-4" />
                Descartar treino
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function PreWorkoutHeader({ currentDate }: { currentDate: string }) {
  return (
    <header className="treino-pre-header">
      <div>
        <h1>Treino de hoje</h1>
        <p>{currentDate}</p>
      </div>
      <button type="button" className="notification-button" aria-label="Notificacoes">
        <Bell className="h-5 w-5" />
        <span />
      </button>
    </header>
  );
}

function CoachCard() {
  return (
    <section className="coach-card-pretreino">
      <div className="coach-label">PULSE COACH</div>
      <p className="mt-3 text-[14px] leading-[1.6] text-[#CCCCCC]">
        Hoje pede uma rodagem com controle e presenca. Comece solto nos primeiros dez minutos,
        segure zona 2 no bloco principal e deixe o final progressivo se a respiracao continuar
        limpa.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <CoachPlanMetric label="DISTANCIA" value="6 km" />
        <CoachPlanMetric label="INTENSIDADE" value="Z2" />
        <CoachPlanMetric label="DURACAO" value="35 min" />
      </div>
    </section>
  );
}

function CoachPlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0A0A0A] p-3 text-center">
      <div className="text-[10px] font-semibold tracking-[0.12em] text-[#555555]">{label}</div>
      <div className="mt-2 text-[16px] font-bold text-[#C8FF00]">{value}</div>
    </div>
  );
}

function WeatherStrip() {
  return (
    <section className="weather-strip">
      <CloudSun className="h-6 w-6 shrink-0 text-[#C8FF00]" strokeWidth={1.6} />
      <div className="text-[20px] font-bold text-white">18C</div>
      <div className="min-w-0 flex-1 truncate text-[12px] text-[#888888]">Parcialmente nublado</div>
      <span className="text-[#555555]">•</span>
      <div className="shrink-0 text-[12px] text-[#888888]">Condicoes ideais</div>
    </section>
  );
}

function LocationBlockedCard() {
  return (
    <div className="mt-5 flex gap-3 rounded-[14px] border border-[#FF444433] bg-[#1A0A0A] p-4">
      <MapPinOff className="h-5 w-5 shrink-0 text-[#FF4444]" strokeWidth={1.8} />
      <div className="min-w-0">
        <div className="text-[15px] font-bold text-white">Localização bloqueada</div>
        <p className="mt-1 text-[13px] leading-relaxed text-[#888888]">
          Ative a localização nas configurações do navegador para registrar sua rota.
        </p>
        <button type="button" className="mt-2 text-[13px] font-bold text-[#C8FF00]">
          Como ativar -&gt;
        </button>
      </div>
    </div>
  );
}

function SportSelector({
  selectedSport,
  openCategory,
  onOpenCategory,
  onSelect,
}: {
  selectedSport: string;
  openCategory: string;
  onOpenCategory: (category: string) => void;
  onSelect: (sport: string) => void;
}) {
  return (
    <section className="mt-6">
      <h2 className="section-compact-title">Selecionar esporte</h2>
      <div className="recent-sports">
        {recentSports.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => onSelect(sport)}
            className={`recent-sport-pill ${selectedSport === sport ? "active" : ""}`}
          >
            <Activity className="h-3 w-3" />
            {sport}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {sportCategories.map((category) => {
          const Icon = category.icon;
          const expanded = openCategory === category.name;
          const selectedInCategory = category.sports.includes(selectedSport);
          return (
            <div key={category.name}>
              <button
                type="button"
                onClick={() => onOpenCategory(category.name)}
                className={`sport-category-card ${selectedInCategory ? "selected" : ""}`}
              >
                <span className="sport-category-icon">
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-white">{category.name}</span>
                  <span className="mt-1 block truncate text-[12px] text-[#888888]">
                    {selectedInCategory ? selectedSport : `${category.sports.length} modalidades`}
                  </span>
                </span>
                <ChevronRight className={`h-4 w-4 text-[#555555] ${expanded ? "rotate-90" : ""}`} />
              </button>
              {expanded && (
                <div className="sport-pills-grid">
                  {category.sports.map((sport) => (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => onSelect(sport)}
                      className={selectedSport === sport ? "sport-pill active" : "sport-pill"}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GoalSelector({
  goal,
  goalValue,
  onGoal,
  onValue,
}: {
  goal: Goal;
  goalValue: string;
  onGoal: (goal: Goal) => void;
  onValue: (value: string) => void;
}) {
  const goals = [
    { id: "distance" as const, icon: MapPin, label: "Distancia", value: "0,0 km" },
    { id: "time" as const, icon: Clock, label: "Tempo", value: "00:00" },
    { id: "free" as const, icon: Zap, label: "Livre", value: "Sem meta" },
  ];

  return (
    <section className="mt-6">
      <h2 className="section-compact-title">Meta do treino</h2>
      <div className="grid grid-cols-3 gap-2">
        {goals.map((item) => {
          const Icon = item.icon;
          const active = goal === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onGoal(item.id)}
              className={`goal-card ${active ? "active" : ""}`}
            >
              <Icon className="goal-card-icon" />
              <span className="goal-card-label">{item.label}</span>
              <span className="text-[11px] text-[#555555]">{item.value}</span>
            </button>
          );
        })}
      </div>
      {goal !== "free" && (
        <label className="mt-3 block rounded-xl border border-white/[0.06] bg-[#111111] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555555]">
            {goal === "distance" ? "Distancia alvo" : "Tempo alvo"}
          </span>
          <input
            inputMode="decimal"
            value={goalValue}
            onChange={(event) => onValue(event.target.value)}
            placeholder={goal === "distance" ? "5,0 km" : "35:00"}
            className="mt-2 w-full bg-transparent text-[18px] font-bold text-white outline-none placeholder:text-[#333333]"
          />
        </label>
      )}
    </section>
  );
}

function MetricHero({
  label,
  value,
  unit,
  trend,
  progress,
}: {
  label: string;
  value: string;
  unit: string;
  trend?: string;
  progress?: number;
}) {
  return (
    <div className="metric-hero">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="metric-hero-value">{value}</span>
            <span className="metric-hero-unit">{unit}</span>
          </div>
          <div className="metric-hero-label">{label}</div>
        </div>
        {trend && <span className="text-[13px] font-bold text-[#C8FF00]">up</span>}
      </div>
      {typeof progress === "number" && (
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[#1A1A1A]">
          <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function MetricSecondary({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-secondary">
      <span className="metric-secondary-value">{value}</span>
      <span className="metric-secondary-label">{label}</span>
    </div>
  );
}

function SplitsRow({ seconds }: { seconds: number }) {
  const current = Math.max(1, Math.min(4, Math.ceil(seconds / 18)));
  return (
    <div className="splits-row">
      {splitRows.map((split) => (
        <div
          key={split.km}
          className={`split-chip ${current === split.km ? "current" : ""} ${split.fast ? "pr" : ""}`}
        >
          <span className="split-number">KM {split.km}</span>
          <span className="split-time">{split.pace}</span>
        </div>
      ))}
    </div>
  );
}

function PostStat({
  label,
  value,
  unit,
  compare,
  pr,
}: {
  label: string;
  value: string;
  unit?: string;
  compare: string;
  pr?: boolean;
}) {
  return (
    <div className="post-stat-card">
      <div className={`post-stat-value ${pr ? "pr" : ""}`}>
        {value}
        {unit && <span className="ml-1 text-[12px] text-[#888888]">{unit}</span>}
      </div>
      <div className="post-stat-label">{label}</div>
      <div className={`post-stat-compare ${pr ? "positive" : ""}`}>{compare}</div>
    </div>
  );
}

function SplitsTable() {
  return (
    <section className="mb-4 rounded-[14px] bg-[#111111] p-3">
      <div className="grid grid-cols-3 border-b border-white/[0.06] pb-2 text-[10px] font-semibold tracking-[0.14em] text-[#555555]">
        <span>KM</span>
        <span className="text-center">PACE</span>
        <span className="text-right">DIF</span>
      </div>
      {splitRows.map((split) => (
        <div
          key={split.km}
          className={`grid grid-cols-3 py-2 text-sm ${split.fast ? "rounded-lg bg-[#C8FF0008] px-2 text-[#C8FF00]" : "text-[#CCCCCC]"}`}
        >
          <span>{split.km}</span>
          <span className="text-center font-bold">{split.pace}</span>
          <span className="text-right text-[#888888]">{split.delta}</span>
        </div>
      ))}
    </section>
  );
}

function SatelliteIcon() {
  return <Map className="h-3.5 w-3.5" />;
}

function sportType(sport: string) {
  if (/ciclismo|bike|mtb|bmx|gravel|spinning/i.test(sport)) return "cycling";
  if (/musculacao|crossfit|hiit|funcional|ginastica|powerlifting|halterofilismo|calistenia/i.test(sport)) {
    return "workout";
  }
  if (/caminhada|hiking|trilha/i.test(sport)) return "walking";
  return "running";
}
