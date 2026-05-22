import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthModal } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { HeroHeader } from "@/components/HeroHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { computeRecoveryScore } from "@/lib/ai-insights";
import { toast } from "sonner";
import { Sparkles, Moon, Star, Zap, Activity as ActivityIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/saude")({ component: SaudePage });

function SaudePage() {
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: hm } = useQuery({
    queryKey: ["health", "today", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).eq("date", today).maybeSingle();
      return data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["health", "history", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 13);
      const { data } = await supabase.from("health_metrics").select("date,recovery_score")
        .eq("user_id", user!.id).gte("date", since.toISOString().slice(0, 10)).order("date");
      return data ?? [];
    },
  });

  const [sleep, setSleep] = useState<number>(hm?.sleep_hours ?? 7);
  const [quality, setQuality] = useState<number>(hm?.sleep_quality ?? 4);
  const [energy, setEnergy] = useState<number>(hm?.energy_level ?? 7);
  const [soreness, setSoreness] = useState<number>(hm?.muscle_soreness ?? 3);
  const [saving, setSaving] = useState(false);

  const score = computeRecoveryScore({ sleep_hours: sleep, sleep_quality: quality, energy_level: energy, muscle_soreness: soreness });

  const save = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("health_metrics").upsert({
      user_id: user.id, date: today,
      sleep_hours: sleep, sleep_quality: quality, energy_level: energy, muscle_soreness: soreness,
      recovery_score: score,
    }, { onConflict: "user_id,date" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Check-in salvo!");
    qc.invalidateQueries({ queryKey: ["health"] });
  };

  const rec = score >= 80 ? "Excelente recuperação. Bom dia para treino intenso ou intervalado."
    : score >= 60 ? "Boa recuperação. Treino moderado em Zona 2 é ideal."
    : score >= 40 ? "Recuperação parcial. Reduza intensidade e foque em técnica."
    : "Recuperação baixa. Priorize descanso ativo: caminhada e alongamento.";

  const maxHist = Math.max(100, ...(history ?? []).map((h) => h.recovery_score ?? 0));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <HeroHeader image="cycling" title="RECUPERAÇÃO" subtitle="DIAGNÓSTICO DIÁRIO E SAÚDE" height="34vh" />
      
      <motion.div 
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Score de recuperação */}
        <motion.div 
          className="glass-card p-6 flex flex-col items-center text-center cursor-pointer select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          style={{ willChange: "transform" }}
        >
          <div className="athletic-label tracking-widest text-[10px] mb-4">● DIAGNÓSTICO DE HOJE</div>
          <RecoveryRing score={score} size={140} />
          <h3 className="font-black text-lg mt-5 tracking-tight">SCORE DE RECUPERAÇÃO</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed font-semibold">{rec}</p>
        </motion.div>

        {/* Check-in diário */}
        <motion.div 
          className="glass-card p-5 select-none"
          variants={cardVariants}
        >
          <div className="athletic-label tracking-widest text-[10px] mb-4">● REGISTRAR CHECK-IN DIÁRIO</div>
          
          <div className="space-y-4">
            <SliderRow label="Horas de sono" icon={Moon} value={sleep} min={0} max={12} step={0.5} unit="h" onChange={setSleep} />
            <SliderRow label="Qualidade do sono" icon={Star} value={quality} min={1} max={5} step={1} unit="/5" onChange={setQuality} />
            <SliderRow label="Nível de energia" icon={Zap} value={energy} min={1} max={10} step={1} unit="/10" onChange={setEnergy} />
            <SliderRow label="Dor muscular" icon={ActivityIcon} value={soreness} min={1} max={10} step={1} unit="/10" onChange={setSoreness} />
          </div>

          <motion.button 
            onClick={save} 
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs mt-6 cursor-pointer select-none glow-primary-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            {saving ? "SALVANDO..." : "LOG HEALTH CHECK"}
          </motion.button>
        </motion.div>

        {/* TODO: trigger AuthModal for premium feature */}
        {/* Últimos 14 dias */}
        {(history?.length ?? 0) > 1 && (
          <motion.div 
            className="glass-card p-5 select-none"
            variants={cardVariants}
            whileTap={{ scale: 0.98 }}
            style={{ willChange: "transform" }}
          >
            <div className="athletic-label tracking-widest text-[10px] mb-4">● ÚLTIMOS 14 DIAS</div>
            <div className="flex items-end gap-1.5 h-24 mt-2">
              {history!.map((h, i) => (
                <div key={i} className="flex-1 rounded-md overflow-hidden flex items-end h-full" style={{ background: "oklch(0.22 0.04 250)" }}>
                  <motion.div 
                    className="w-full rounded-md" 
                    initial={{ height: 0 }}
                    animate={{ height: `${((h.recovery_score ?? 0) / maxHist) * 100}%` }}
                    transition={{ type: "spring" as const, stiffness: 100, delay: 0.2 + i * 0.04 }}
                    style={{ background: "linear-gradient(to top, var(--color-primary), var(--color-primary-light))" }} 
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recomendações do Coach */}
        <motion.div 
          className="glass-card p-5 select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.98 }}
          style={{ willChange: "transform" }}
        >
          <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest mb-3 uppercase">
            <Sparkles className="h-3.5 w-3.5" /> RECOMENDAÇÃO ESPORTIVA
          </div>
          <p className="text-xs leading-relaxed font-semibold">{rec}</p>
          <Link to="/treino" className="mt-5 inline-flex h-10 px-4 rounded-xl glass-card text-xs font-black tracking-widest items-center gap-1">
            START NOW <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SliderRow({ label, icon: Icon, value, min, max, step, unit, onChange }: {
  label: string; icon: any; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="py-3 border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-muted-foreground">
          <div className="icon-circle h-7 w-7"><Icon className="h-3.5 w-3.5 text-primary-light" /></div>
          {label}
        </span>
        <span className="text-sm font-black num text-primary-light">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        className="cursor-pointer"
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
