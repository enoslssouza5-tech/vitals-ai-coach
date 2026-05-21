import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { computeRecoveryScore } from "@/lib/ai-insights";
import { toast } from "sonner";
import { Sparkles, Moon, Star, Zap, Activity as ActivityIcon } from "lucide-react";

export const Route = createFileRoute("/_app/saude")({ component: SaudePage });

function SaudePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: hm } = useQuery({
    queryKey: ["health", "today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).eq("date", today).maybeSingle();
      return data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["health", "history", user?.id],
    enabled: !!user,
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
    if (!user) return;
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

  return (
    <div>
      <PageHeader title="Recuperação" subtitle="Seu estado de hoje" />

      <div className="px-5 space-y-4 pb-6">
        <div className="glass-card p-6 flex flex-col items-center text-center animate-fade-in">
          <RecoveryRing score={score} size={140} />
          <h3 className="font-bold text-lg mt-4">Score de recuperação</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{rec}</p>
        </div>

        <div className="glass-card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Check-in diário</h3>

          <SliderRow label="Horas de sono" icon={Moon} value={sleep} min={0} max={12} step={0.5} unit="h" onChange={setSleep} />
          <SliderRow label="Qualidade do sono" icon={Star} value={quality} min={1} max={5} step={1} unit="/5" onChange={setQuality} />
          <SliderRow label="Energia" icon={Zap} value={energy} min={1} max={10} step={1} unit="/10" onChange={setEnergy} />
          <SliderRow label="Dor muscular" icon={ActivityIcon} value={soreness} min={1} max={10} step={1} unit="/10" onChange={setSoreness} />

          <button onClick={save} disabled={saving}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-4 active:scale-[0.98] transition disabled:opacity-60 glow-primary-sm">
            {saving ? "Salvando..." : "Salvar check-in"}
          </button>
        </div>

        {(history?.length ?? 0) > 1 && (
          <div className="glass-card p-5 animate-fade-in">
            <h3 className="font-semibold mb-4">Últimos 14 dias</h3>
            <div className="flex items-end gap-1 h-24">
              {history!.map((h, i) => (
                <div key={i} className="flex-1 bg-surface-2 rounded-sm overflow-hidden flex items-end">
                  <div className="w-full bg-primary rounded-sm" style={{ height: `${((h.recovery_score ?? 0) / maxHist) * 100}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> RECOMENDAÇÃO IA
          </div>
          <p className="text-sm leading-relaxed">{rec}</p>
          <Link to="/treino" className="mt-4 inline-flex h-10 px-4 rounded-xl bg-surface-2 border border-border text-sm font-medium active:scale-[0.98] transition">
            Ir para treino →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, icon: Icon, value, min, max, step, unit, onChange }: {
  label: string; icon: any; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary-light" />{label}</span>
        <span className="text-sm font-bold num text-primary">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2" />
    </div>
  );
}
