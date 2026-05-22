import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth, useAuthModal } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pause, Play, Square, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Counter } from "@/components/Counter";

const search = z.object({ type: z.string().default("running") });

export const Route = createFileRoute("/treino-ativo")({
  validateSearch: search,
  component: TreinoAtivo,
});

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
}

function TreinoAtivo() {
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const { type } = Route.useSearch();

  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [hr, setHr] = useState(135);
  const startedAt = useRef(new Date());
  const [finished, setFinished] = useState(false);
  const [focusMode, setFocusMode] = useState(false); // Fullscreen focus mode

  useEffect(() => {
    if (!running || finished) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
      setDistance((d) => d + 2.8 + Math.random() * 0.6);
      setHr((h) => Math.max(110, Math.min(175, h + Math.round((Math.random() - 0.5) * 4))));
    }, 1000);
    return () => clearInterval(t);
  }, [running, finished]);

  const pace = distance > 0 ? (seconds / 60) / (distance / 1000) : 0;
  const paceStr = pace > 0 && isFinite(pace) ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}` : "--:--";
  const calories = Math.round(seconds * 0.18);

  const save = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    const ended = new Date();
    const insights = distance / 1000 > 5
      ? "Treino sólido. Mantenha esse volume nas próximas sessões."
      : "Ótimo aquecimento. Tente estender o tempo gradualmente nas próximas saídas.";
    const { error } = await supabase.from("activities").insert({
      user_id: user.id,
      type, title: `${type === "running" ? "Corrida" : type === "cycling" ? "Pedal" : "Treino"} - ${ended.toLocaleDateString("pt-BR")}`,
      started_at: startedAt.current.toISOString(),
      ended_at: ended.toISOString(),
      duration_seconds: seconds,
      distance_meters: Math.round(distance),
      avg_heart_rate: hr,
      calories_burned: calories,
      ai_insights: insights,
    });
    if (error) return toast.error(error.message);
    toast.success("Treino salvo!");
    navigate({ to: "/historico" });
  };

  // 1. FINISHED SCREEN
  if (finished) {
    return (
      <div className="min-h-screen px-5 pt-safe pb-10 flex flex-col relative overflow-hidden select-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 20%, oklch(0.30 0.15 250 / 0.3) 0%, transparent 60%)"
        }} />
        
        <div className="relative z-10 my-4">
          <h1 className="text-3xl font-black tracking-tight text-left uppercase">TREINO CONCLUÍDO</h1>
          <p className="text-xs text-muted-foreground font-black tracking-widest mt-1 uppercase">● RESUMO DE PERFORMANCE</p>
        </div>

        <div className="glass-card p-6 mt-6 animate-slide-up relative z-10">
          <div className="grid grid-cols-2 gap-y-5 gap-x-3">
            <Stat label="DISTÂNCIA TOTAL" value={(distance / 1000).toFixed(2)} unit="km" />
            <Stat label="DURAÇÃO" value={fmt(seconds)} />
            <Stat label="RITMO MÉDIO" value={paceStr} unit="/km" />
            <Stat label="FC MÉDIA" value={String(hr)} unit="bpm" />
            <Stat label="CALORIAS ATIVAS" value={String(calories)} unit="kcal" />
          </div>
        </div>

        <div className="glass-card p-5 mt-5 animate-slide-up relative z-10" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" /> ANÁLISE IA SPORT
          </div>
          <p className="text-xs leading-relaxed font-semibold">
            {distance / 1000 > 5
              ? "Sessão consistente de alta qualidade. Frequência cardíaca ideal dentro das zonas de treinamento aeróbico. Excelente para ganho de resistência pulmonar e vascular."
              : "Treino curto e focado. Perfeito para manutenção de base e dias regenerativos para recuperação muscular ativa."}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-6 relative z-10">
          <motion.button 
            onClick={save} 
            whileTap={{ scale: 0.97 }}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs cursor-pointer glow-primary-sm"
          >
            SAVE WORKOUT
          </motion.button>
          
          <motion.button 
            onClick={() => navigate({ to: "/dashboard" })} 
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-2xl glass-card font-black tracking-widest text-xs text-muted-foreground cursor-pointer"
          >
            DISCARD
          </motion.button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE WORKOUT SCREEN
  return (
    <div className="min-h-screen flex flex-col bg-background select-none relative overflow-hidden">
      
      {/* Dynamic Screen Layout */}
      <AnimatePresence mode="wait">
        {!focusMode ? (
          /* GPS MAP INTERFACE */
          <motion.div 
            key="map-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "42vh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className="relative overflow-hidden w-full"
          >
            <img src="/images/hero-running.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to bottom, oklch(0.12 0.03 250 / 0.2) 0%, oklch(0.12 0.03 250 / 0.85) 60%, oklch(0.12 0.03 250 / 1) 100%)"
            }} />
            
            {/* Neon glowing polyline trail */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Blur backdrop for neon intensity */}
              <path 
                d={`M 50 350 Q 100 ${250 - seconds % 55} 180 220 T 350 70`} 
                stroke="oklch(0.62 0.20 250)"
                strokeWidth="10" fill="none" strokeLinecap="round"
                opacity="0.55"
                filter="url(#glow)"
              />
              
              {/* Core bright neon path line */}
              <path 
                d={`M 50 350 Q 100 ${250 - seconds % 55} 180 220 T 350 70`} 
                stroke="oklch(0.72 0.18 250)"
                strokeWidth="4" fill="none" strokeLinecap="round"
              />
              
              {/* Floating current position marker with pulse animation */}
              <circle cx="350" cy="70" r="8" fill="var(--color-primary-light)" className="animate-pulse" />
            </svg>

            {/* GPS HUD */}
            <div className="absolute top-safe left-5 right-5 flex justify-between items-center z-10">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5"
                style={{ background: "oklch(0.12 0.03 250 / 0.85)", border: "1px solid oklch(0.45 0.10 250 / 0.2)", backdropFilter: "blur(12px)" }}>
                <span className="h-2 w-2 rounded-full bg-danger animate-pulse" /> GRAVANDO GPS
              </span>
              
              {/* Toggle to fullscreen focus mode */}
              <button 
                onClick={() => setFocusMode(true)}
                className="icon-circle h-9 w-9 hover:scale-105 active:scale-95 transition"
              >
                <Maximize2 className="h-4.5 w-4.5 text-primary-light" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* FOCUS MODE HUD */
          <motion.div 
            key="focus-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-safe px-5 flex justify-between items-center relative z-20"
          >
            <span className="text-[10px] font-black tracking-widest text-primary-light flex items-center gap-1.5">
              ⚡ LIVE WORKOUT (MODO DE CONCENTRAÇÃO)
            </span>
            <button 
              onClick={() => setFocusMode(false)}
              className="icon-circle h-9 w-9 hover:scale-105 active:scale-95 transition"
            >
              <Minimize2 className="h-4.5 w-4.5 text-primary-light" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 CORE METRICS */}
      <div className="flex-1 px-5 py-6 flex flex-col justify-between relative z-10">
        <div className={`grid grid-cols-2 gap-4 ${focusMode ? "my-auto py-8" : ""}`}>
          <BigStat 
            label="DISTÂNCIA" 
            value={(distance / 1000).toFixed(2)} 
            unit="km" 
            live 
          />
          <BigStat 
            label="RITMO CORRENTE" 
            value={paceStr} 
            unit="/km" 
            live 
          />
          <BigStat 
            label="FREQUÊNCIA CARDÍACA" 
            value={String(hr)} 
            unit="bpm" 
            live 
          />
          <BigStat 
            label="TEMPO DE ATIVIDADE" 
            value={fmt(seconds)} 
            live 
          />
        </div>

        {seconds > 15 && seconds < 32 && !focusMode && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/30 text-[10px] font-black tracking-widest uppercase text-primary-light text-center animate-fade-in">
            ⚡ EXCELENTE RITMO! MANTENHA A CADÊNCIA
          </div>
        )}

        {/* WORKOUT CONTROLS */}
        <div className="mt-auto flex gap-3 pt-6">
          <motion.button 
            onClick={() => setRunning((r) => !r)}
            whileTap={{ scale: 0.96 }}
            style={{ willChange: "transform" }}
            className="flex-1 h-16 rounded-2xl glass-card font-black tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {running ? (
              <><Pause className="h-5 w-5 text-primary-light" /> PAUSE</>
            ) : (
              <><Play className="h-5 w-5 text-primary-light" /> RESUME</>
            )}
          </motion.button>
          
          <motion.button 
            onClick={() => setFinished(true)}
            whileTap={{ scale: 0.96 }}
            style={{ willChange: "transform" }}
            className="flex-1 h-16 rounded-2xl bg-danger text-white font-black tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Square className="h-5 w-5 fill-current" /> STOP
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="border-b border-border/10 pb-2 last:border-0">
      <div className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">{label}</div>
      <div className="text-xl font-black font-mono mt-1 text-primary-light">
        {value}
        {unit && <span className="text-xs text-muted-foreground font-bold ml-1 uppercase">{unit}</span>}
      </div>
    </div>
  );
}

function BigStat({ label, value, unit, live }: { label: string; value: string; unit?: string; live?: boolean }) {
  return (
    /* Breathing border applied dynamically to highlight active state during workout */
    <div className="glass-card p-5 breathing-border select-none relative overflow-hidden" style={{ willChange: "transform" }}>
      <div className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mb-1">{label}</div>
      
      <div className={`mt-2 flex items-baseline gap-1 ${live ? "live-flash" : ""}`}>
        <span className="text-3xl font-black font-mono leading-none tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-black text-muted-foreground uppercase">{unit}</span>
        )}
      </div>
    </div>
  );
}
