import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pause, Play, Square, Activity as ActivityIcon } from "lucide-react";
import { z } from "zod";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { type } = Route.useSearch();

  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0); // meters
  const [hr, setHr] = useState(135);
  const startedAt = useRef(new Date());
  const [finished, setFinished] = useState(false);

  // Simulated tick — distance progresses with time at a varied pace
  useEffect(() => {
    if (!running || finished) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
      // pace ~ 5:30/km => 3.03 m/s, vary slightly
      setDistance((d) => d + 2.8 + Math.random() * 0.6);
      setHr((h) => Math.max(110, Math.min(175, h + Math.round((Math.random() - 0.5) * 4))));
    }, 1000);
    return () => clearInterval(t);
  }, [running, finished]);

  const pace = distance > 0 ? (seconds / 60) / (distance / 1000) : 0; // min/km
  const paceStr = pace > 0 && isFinite(pace) ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}` : "--:--";
  const calories = Math.round(seconds * 0.18);

  const save = async () => {
    if (!user) return;
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

  if (finished) {
    return (
      <div className="min-h-screen px-5 pt-safe pb-10 flex flex-col">
        <h1 className="text-2xl font-bold mt-4">Treino finalizado</h1>
        <p className="text-sm text-muted-foreground">Resumo da sessão</p>

        <div className="glass-card p-5 mt-6">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <Stat label="Distância" value={(distance / 1000).toFixed(2)} unit="km" />
            <Stat label="Tempo" value={fmt(seconds)} />
            <Stat label="Ritmo médio" value={paceStr} unit="/km" />
            <Stat label="FC média" value={String(hr)} unit="bpm" />
            <Stat label="Calorias" value={String(calories)} unit="kcal" />
          </div>
        </div>

        <div className="glass-card p-5 mt-4">
          <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Análise IA</div>
          <p className="text-sm leading-relaxed">
            {distance / 1000 > 5
              ? "Sessão consistente. Frequência cardíaca dentro da Zona 2-3. Bom para evolução aeróbica."
              : "Boa sessão curta. Ideal como base ou descanso ativo."}
          </p>
        </div>

        <div className="mt-auto space-y-2 pt-6">
          <button onClick={save} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition glow-primary-sm">
            Salvar treino
          </button>
          <button onClick={() => navigate({ to: "/dashboard" })} className="w-full h-12 rounded-xl bg-surface border border-border font-medium text-muted-foreground active:scale-[0.98] transition">
            Descartar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Faux map area */}
      <div className="relative h-[40vh] bg-gradient-to-br from-surface-2 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, var(--color-primary) 0%, transparent 50%), radial-gradient(circle at 70% 60%, var(--color-accent) 0%, transparent 50%)",
        }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <path d={`M 50 350 Q 100 ${250 - seconds % 50} 180 220 T 350 50`} stroke="var(--color-primary-light)"
            strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="800" strokeDashoffset={Math.max(0, 800 - seconds * 4)} />
          <circle cx="50" cy="350" r="8" fill="var(--color-primary)" />
        </svg>
        <div className="absolute top-safe left-5 right-5 flex justify-between">
          <span className="px-3 py-1.5 rounded-full bg-background/70 backdrop-blur text-xs font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse" /> GRAVANDO
          </span>
          <span className="px-3 py-1.5 rounded-full bg-background/70 backdrop-blur text-xs font-mono">{type}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <BigStat label="Distância" value={(distance / 1000).toFixed(2)} unit="km" />
          <BigStat label="Ritmo" value={paceStr} unit="/km" />
          <BigStat label="Freq. card." value={String(hr)} unit="bpm" />
          <BigStat label="Tempo" value={fmt(seconds)} />
        </div>

        {seconds > 15 && seconds < 30 && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary-light animate-fade-in">
            ✨ Bom ritmo! Mantenha essa cadência.
          </div>
        )}

        <div className="mt-auto flex gap-3 pt-6">
          <button onClick={() => setRunning((r) => !r)}
            className="flex-1 h-16 rounded-2xl bg-surface border border-border font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
            {running ? <><Pause className="h-5 w-5" /> Pausar</> : <><Play className="h-5 w-5" /> Continuar</>}
          </button>
          <button onClick={() => setFinished(true)}
            className="flex-1 h-16 rounded-2xl bg-danger text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
            <Square className="h-5 w-5 fill-current" /> Parar
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold num mt-0.5">{value}{unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}</div>
    </div>
  );
}

function BigStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold num">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
