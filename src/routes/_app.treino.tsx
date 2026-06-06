import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  CheckCircle2,
  Clock,
  Crosshair,
  Dumbbell,
  Expand,
  Flag,
  Footprints,
  Heart,
  Map,
  MapPinOff,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleMapView, type GoogleRouteMarker } from "@/components/GoogleMapView";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { estimarCalorias, fmtDuracao, haversine, salvarTreino } from "@/lib/treino-history";
import { demoPath } from "@/lib/pulse-design-data";
import type { LatLngTuple } from "@/lib/google-maps";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

type Stage = "setup" | "active" | "finished";
type Goal = "distance" | "time" | "free";

type HeroSport = {
  emoji: string;
  name: string;
  label: string;
  icon: LucideIcon;
  sports: string[];
};

const stageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" as const } },
};

const heroSports: HeroSport[] = [
  {
    emoji: "🏃",
    name: "Corrida",
    label: "Corrida e Caminhada",
    icon: Footprints,
    sports: ["Corrida de rua", "Trail running", "Corrida na esteira", "Caminhada", "Corrida com obstaculos", "Marcha atletica"],
  },
  {
    emoji: "🚴",
    name: "Ciclismo",
    label: "Ciclismo",
    icon: Bike,
    sports: ["Ciclismo de estrada", "Mountain bike", "Ciclismo indoor", "BMX urbano", "Cicloturismo", "Gravel"],
  },
  {
    emoji: "🏊",
    name: "Natação",
    label: "Natacao e Agua",
    icon: Waves,
    sports: ["Natacao em piscina", "Aguas abertas", "Triathlon", "Remo", "Kayak", "SUP"],
  },
  {
    emoji: "⚽",
    name: "Coletivos",
    label: "Esportes Coletivos",
    icon: Users,
    sports: ["Futebol", "Futsal", "Basquete", "Volei", "Handebol", "Rugby"],
  },
  {
    emoji: "🎾",
    name: "Raquete",
    label: "Esportes de Raquete",
    icon: Trophy,
    sports: ["Tenis", "Padel", "Beach tennis", "Squash", "Badminton", "Pickleball"],
  },
  {
    emoji: "🥊",
    name: "Lutas",
    label: "Lutas e Artes Marciais",
    icon: Shield,
    sports: ["Boxe", "Muay Thai", "Jiu-jitsu", "MMA", "Judo", "Karate"],
  },
  {
    emoji: "🧘",
    name: "Bem-estar",
    label: "Bem-estar e Mobilidade",
    icon: Heart,
    sports: ["Yoga", "Pilates", "Alongamento", "Mobilidade", "Danca", "Meditacao ativa"],
  },
  {
    emoji: "🏋️",
    name: "Força",
    label: "Forca e Potencia",
    icon: Dumbbell,
    sports: ["Musculacao", "Powerlifting", "Halterofilismo", "Calistenia", "Funcional", "HIIT"],
  },
  {
    emoji: "🏔",
    name: "Aventura",
    label: "Aventura e Outdoor",
    icon: Mountain,
    sports: ["Trilha", "Escalada", "Rapel", "Ski", "Surfe", "Parkour"],
  },
  {
    emoji: "➕",
    name: "Outro",
    label: "Outros Esportes",
    icon: Flag,
    sports: ["Equitacao", "Golfe", "Boliche", "Patinacao", "Outro"],
  },
];

const dailyChallenges = [
  { icon: "🎯", text: "Bata seu recorde — tente", highlight: "5'18\"/km" },
  { icon: "🔥", text: "Sequência de 4 dias —", highlight: "não para agora" },
  { icon: "⚡", text: "3 km a mais que", highlight: "semana passada" },
];

const splitRows = [
  { km: 1, pace: "5'02\"", delta: "-4s", fast: false },
  { km: 2, pace: "4'56\"", delta: "-6s", fast: true },
  { km: 3, pace: "5'08\"", delta: "+12s", fast: false },
  { km: 4, pace: "5'01\"", delta: "-7s", fast: false },
];

function TreinoPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [sport, setSport] = useState("");
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
  // Hero map setup states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMainSport, setSelectedMainSport] = useState<HeroSport | null>(null);
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

  // Geolocalização para o mapa hero do pré-treino
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Sem localização: usa São Paulo como fallback
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

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
  const sportNavItems = useMemo(
    () => heroSports.map((s) => ({ name: s.name, url: "#", icon: s.icon })),
    [],
  );
  const activeSportTab = selectedMainSport?.name ?? heroSports.find((s) => s.sports.includes(sport))?.name ?? heroSports[0].name;

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
    const activeSport = sport || "Corrida de rua";
    if (!sport) setSport(activeSport);
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
          <motion.div
            key="setup"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="treino-hero-setup"
          >
            {/* Mapa full screen */}
            <div className="treino-map-container">
              <GoogleMapView
                className="h-full w-full"
                interactive={false}
                showControls={false}
                fitToPath={false}
                defaultMode="roadmap"
                defaultCenter={userLocation ? [userLocation.lat, userLocation.lng] : [-23.5505, -46.6333]}
                defaultZoom={15}
                tilt={45}
                terrain
                ariaLabel="Mapa do local de treino"
              />
            </div>

            {/* Gradientes */}
            <div className="treino-top-fade" />
            <div className="treino-bottom-fade" />

            {/* Pílulas no topo */}
            <div className="treino-pills-container">
              <div className="pill-pace">
                <span className="pill-pace-value">5'21&quot;</span>
                <span className="pill-pace-label">Último Pace</span>
              </div>
              <div className="pill-weather">
                <span className="pill-weather-temp">18°C</span>
                <span className="pill-weather-desc">Nublado</span>
              </div>
            </div>

            {/* Pílula desafio central */}
            <div className="pill-challenge">
              <span className="pill-challenge-icon">{dailyChallenges[new Date().getDay() % dailyChallenges.length].icon}</span>
              <span className="pill-challenge-text">
                {dailyChallenges[new Date().getDay() % dailyChallenges.length].text}{" "}
                <span className="pill-challenge-highlight">
                  {dailyChallenges[new Date().getDay() % dailyChallenges.length].highlight}
                </span>
              </span>
            </div>

            {/* Carrossel de esportes */}
            <div className="treino-sports-carousel">
              <NavBar
                items={sportNavItems}
                activeName={activeSportTab}
                ariaLabel="Escolher categoria de treino"
                className="treino-sports-tubelight"
                embedded
                onItemSelect={(item) => {
                  const selectedSport = heroSports.find((s) => s.name === item.name);
                  if (!selectedSport) return;
                  setSelectedMainSport(selectedSport);
                  setSheetOpen(true);
                }}
              />
            </div>

            {/* Botão Play — sempre ativo */}
            <button
              type="button"
              id="treino-play-btn"
              className={`treino-play-btn ${sport ? "active" : ""}`}
              onClick={start}
              aria-label="Iniciar treino"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            {/* Bottom Sheet de subcategorias */}
            <div className={`subcategory-sheet ${sheetOpen ? "open" : ""}`}>
              <div className="sheet-handle" />
              {selectedMainSport && (
                <>
                  <div className="sheet-header">
                    <span className="sheet-sport-emoji">{selectedMainSport.emoji}</span>
                    <span className="sheet-sport-title">{selectedMainSport.label}</span>
                    <button
                      type="button"
                      className="sheet-close"
                      onClick={() => setSheetOpen(false)}
                      aria-label="Fechar"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="sheet-options">
                    {selectedMainSport.sports.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        className={`sheet-option ${sport === sub ? "selected" : ""}`}
                        onClick={() => {
                          setSport(sub);
                          setTimeout(() => setSheetOpen(false), 200);
                        }}
                      >
                        <span className="sheet-option-name">{sub}</span>
                        <CheckCircle2 className="sheet-option-check" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
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
