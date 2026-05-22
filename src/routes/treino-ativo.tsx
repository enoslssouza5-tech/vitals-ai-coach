import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pause, Play, Square, Sparkles, RotateCcw, Save } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  estimarCalorias,
  fmtDuracao,
  haversine,
  MODALIDADE_INFO,
  salvarTreino,
} from "@/lib/treino-history";
import { gerarAnaliseCoach } from "@/lib/coach.functions";

const RouteMap = lazy(() =>
  import("@/components/RouteMap").then((m) => ({ default: m.RouteMap })),
);

const search = z.object({ type: z.string().default("running") });

export const Route = createFileRoute("/treino-ativo")({
  validateSearch: search,
  component: TreinoAtivo,
});

function TreinoAtivo() {
  const navigate = useNavigate();
  const { type } = Route.useSearch();
  const info = MODALIDADE_INFO[type] ?? MODALIDADE_INFO.running;
  const usaGPS = info.usaGPS;
  const callCoach = useServerFn(gerarAnaliseCoach);

  // Fases: 'countdown' | 'active' | 'finished'
  const [fase, setFase] = useState<"countdown" | "active" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);

  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<Date | null>(null);

  // GPS
  const [pontos, setPontos] = useState<[number, number][]>([]);
  const [distancia, setDistancia] = useState(0); // metros
  const [gpsErro, setGpsErro] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const ultimoPonto = useRef<[number, number] | null>(null);

  // FC simulada
  const [hr, setHr] = useState(135);

  // IA
  const [analise, setAnalise] = useState<string | null>(null);
  const [analiseLoading, setAnaliseLoading] = useState(false);

  // ---------- Contagem regressiva ----------
  useEffect(() => {
    if (fase !== "countdown") return;
    if (countdown <= 0) {
      startedAt.current = new Date();
      setFase("active");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [fase, countdown]);

  // ---------- Cronômetro ----------
  useEffect(() => {
    if (fase !== "active" || !running) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
      setHr((h) => Math.max(110, Math.min(175, h + Math.round((Math.random() - 0.5) * 4))));
    }, 1000);
    return () => clearInterval(t);
  }, [fase, running]);

  // ---------- GPS ----------
  useEffect(() => {
    if (fase !== "active" || !usaGPS) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsErro("📍 Geolocalização não suportada neste dispositivo.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (ultimoPonto.current) {
          const d = haversine(ultimoPonto.current, p);
          if (d > 1 && d < 100) {
            setDistancia((cur) => cur + d);
          }
        }
        ultimoPonto.current = p;
        setPontos((arr) => [...arr, p]);
        setGpsErro(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErro("📍 Localização não autorizada. Distância não será rastreada.");
        } else {
          setGpsErro("📍 Sinal de GPS fraco. Tente em área aberta.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
    watchId.current = id;
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [fase, usaGPS]);

  // ---------- Encerrar ----------
  const encerrar = async () => {
    if (watchId.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setRunning(false);
    setFase("finished");

    setAnaliseLoading(true);
    try {
      const km = distancia / 1000;
      const pace =
        usaGPS && km > 0 ? seconds / 60 / km : null;
      const ritmoStr =
        pace != null && isFinite(pace)
          ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}/km`
          : null;
      const calorias = estimarCalorias(type, seconds);
      const r = await callCoach({
        data: {
          modalidade: info.label,
          duracaoSeg: seconds,
          distanciaMetros: Math.round(distancia),
          caloriasKcal: calorias,
          ritmoMedio: ritmoStr,
          fcMedia: hr,
        },
      });
      setAnalise(r.analise);
    } catch (e) {
      console.error(e);
      setAnalise("Treino concluído! Mantenha o ritmo nas próximas sessões.");
    } finally {
      setAnaliseLoading(false);
    }
  };

  const salvar = () => {
    const calorias = estimarCalorias(type, seconds);
    const km = distancia / 1000;
    const pace = usaGPS && km > 0 ? seconds / 60 / km : null;
    const ritmoStr =
      pace != null && isFinite(pace)
        ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}/km`
        : null;

    salvarTreino({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      data: (startedAt.current ?? new Date()).toISOString(),
      modalidade: type,
      duracaoSeg: seconds,
      distanciaMetros: Math.round(distancia),
      caloriasKcal: calorias,
      ritmoMedio: ritmoStr,
      fcMedia: hr,
      analiseIA: analise ?? undefined,
    });
    toast.success("✅ Treino salvo com sucesso!");
    navigate({ to: "/treino" });
  };

  const treinarNovamente = () => {
    setFase("countdown");
    setCountdown(3);
    setSeconds(0);
    setDistancia(0);
    setPontos([]);
    ultimoPonto.current = null;
    setAnalise(null);
    setRunning(true);
  };

  // ---------- RENDER ----------

  // Contagem regressiva
  if (fase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background select-none px-5">
        <div className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-6">
          ● PREPARANDO {info.label.toUpperCase()}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[140px] font-black leading-none text-primary-light glow-primary-sm"
          >
            {countdown > 0 ? countdown : "AGORA!"}
          </motion.div>
        </AnimatePresence>
        <button
          onClick={() => navigate({ to: "/treino" })}
          className="mt-10 text-[10px] font-black tracking-widest uppercase text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    );
  }

  const km = distancia / 1000;
  const pace = usaGPS && km > 0 ? seconds / 60 / km : 0;
  const ritmoStr =
    usaGPS && pace > 0 && isFinite(pace)
      ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}`
      : "--:--";
  const calorias = estimarCalorias(type, seconds);

  // Encerrado
  if (fase === "finished") {
    return (
      <div className="min-h-screen px-5 pt-safe pb-10 flex flex-col select-none">
        <div className="my-4">
          <h1 className="text-3xl font-black tracking-tight uppercase">TREINO CONCLUÍDO</h1>
          <p className="text-xs text-muted-foreground font-black tracking-widest mt-1 uppercase">
            ● RESUMO DA SESSÃO
          </p>
        </div>

        <div className="glass-card p-6 mt-4">
          <div className="grid grid-cols-2 gap-y-5 gap-x-3">
            <Stat label="MODALIDADE" value={info.label} />
            <Stat label="DATA" value={(startedAt.current ?? new Date()).toLocaleDateString("pt-BR")} />
            <Stat label="DURAÇÃO TOTAL" value={fmtDuracao(seconds)} />
            <Stat label="DISTÂNCIA" value={km.toFixed(2)} unit="km" />
            {usaGPS && <Stat label="RITMO MÉDIO" value={ritmoStr} unit="/km" />}
            <Stat label="CALORIAS" value={String(calorias)} unit="kcal" />
            <Stat label="FC MÉDIA" value={String(hr)} unit="bpm" />
          </div>
        </div>

        <div className="glass-card p-5 mt-5 border border-warning/30">
          <div className="flex items-center gap-1.5 text-xs text-warning font-black tracking-widest uppercase mb-3">
            🏆 ANÁLISE DO COACH IA
          </div>
          {analiseLoading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Analisando seu desempenho...
            </div>
          ) : (
            <p className="text-sm leading-relaxed font-semibold">{analise}</p>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <motion.button
            onClick={salvar}
            whileTap={{ scale: 0.97 }}
            disabled={analiseLoading}
            aria-label="Salvar treino"
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs cursor-pointer glow-primary-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ minHeight: 48 }}
          >
            <Save className="h-4 w-4" /> SALVAR TREINO
          </motion.button>

          <motion.button
            onClick={treinarNovamente}
            whileTap={{ scale: 0.97 }}
            aria-label="Treinar novamente"
            className="w-full h-12 rounded-2xl glass-card font-black tracking-widest text-xs cursor-pointer flex items-center justify-center gap-2"
            style={{ minHeight: 48 }}
          >
            <RotateCcw className="h-4 w-4" /> TREINAR NOVAMENTE
          </motion.button>
        </div>
      </div>
    );
  }

  // Treino ativo
  return (
    <div className="min-h-screen flex flex-col bg-background select-none relative">
      {/* Mapa real (se GPS) ou banner */}
      <div className="relative w-full" style={{ height: "38vh" }}>
        {usaGPS ? (
          <Suspense fallback={<div className="w-full h-full bg-card/50" />}>
            <RouteMap pontos={pontos} className="w-full h-full" />
          </Suspense>
        ) : (
          <div className="w-full h-full bg-card/50 flex items-center justify-center">
            <img src={info.icon} alt="" className="h-20 w-20 opacity-40" />
          </div>
        )}

        <div className="absolute top-safe left-5 right-5 flex justify-between items-center z-[400]">
          <span
            className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5"
            style={{
              background: "oklch(0.12 0.03 250 / 0.85)",
              border: "1px solid oklch(0.45 0.10 250 / 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
            {usaGPS ? "GRAVANDO GPS" : "EM ATIVIDADE"}
          </span>
        </div>
      </div>

      {gpsErro && usaGPS && (
        <div className="mx-5 mt-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning font-semibold">
          {gpsErro}
        </div>
      )}

      <div className="flex-1 px-5 py-6 flex flex-col">
        <div className="grid grid-cols-2 gap-4">
          <BigStat
            label="TEMPO"
            value={fmtDuracao(seconds)}
            timerRole
          />
          <BigStat
            label="DISTÂNCIA"
            value={usaGPS ? km.toFixed(2) : "--"}
            unit="km"
          />
          <BigStat
            label="RITMO"
            value={usaGPS ? ritmoStr : "--:--"}
            unit="/km"
          />
          <BigStat label="CALORIAS" value={String(calorias)} unit="kcal" />
        </div>

        <div className="mt-auto flex gap-3 pt-6">
          <motion.button
            onClick={() => setRunning((r) => !r)}
            whileTap={{ scale: 0.96 }}
            aria-label={running ? "Pausar treino" : "Retomar treino"}
            className="flex-1 h-16 rounded-2xl glass-card font-black tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
            style={{ minHeight: 48 }}
          >
            {running ? (
              <>
                <Pause className="h-5 w-5 text-primary-light" /> PAUSAR
              </>
            ) : (
              <>
                <Play className="h-5 w-5 text-primary-light" /> RETOMAR
              </>
            )}
          </motion.button>

          <motion.button
            onClick={encerrar}
            whileTap={{ scale: 0.96 }}
            aria-label="Encerrar treino"
            className="flex-1 h-16 rounded-2xl bg-danger text-white font-black tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
            style={{ minHeight: 48 }}
          >
            <Square className="h-5 w-5 fill-current" /> ENCERRAR
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="border-b border-border/10 pb-2 last:border-0">
      <div className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">
        {label}
      </div>
      <div className="text-xl font-black font-mono mt-1 text-primary-light">
        {value}
        {unit && (
          <span className="text-xs text-muted-foreground font-bold ml-1 uppercase">{unit}</span>
        )}
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  timerRole,
}: {
  label: string;
  value: string;
  unit?: string;
  timerRole?: boolean;
}) {
  return (
    <div
      className="glass-card p-5 select-none relative overflow-hidden"
      {...(timerRole ? { role: "timer", "aria-live": "polite" as const } : {})}
    >
      <div className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mb-1">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black font-mono leading-none tracking-tight">{value}</span>
        {unit && (
          <span className="text-xs font-black text-muted-foreground uppercase">{unit}</span>
        )}
      </div>
    </div>
  );
}
