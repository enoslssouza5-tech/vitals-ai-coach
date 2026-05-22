import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const LEVELS = [
  { key: "beginner", label: "Iniciante", desc: "Começando agora" },
  { key: "intermediate", label: "Intermediário", desc: "Treino com regularidade" },
  { key: "advanced", label: "Avançado", desc: "Atleta dedicado" },
];

const GOALS = [
  { key: "running", emoji: "🏃", label: "Correr" },
  { key: "cycling", emoji: "🚴", label: "Pedalar" },
  { key: "strength", emoji: "💪", label: "Academia" },
  { key: "wellness", emoji: "🧘", label: "Bem-estar" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [level, setLevel] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
  }, [user]);

  const next = () => setStep((s) => s + 1);
  const toggleGoal = (g: string) =>
    setGoals((arr) => (arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g]));

  const finish = async () => {
    if (!isAuthenticated) {
      navigate({ to: "/dashboard" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name,
      weight_kg: weight ? Number(weight) : null,
      height_cm: height ? Number(height) : null,
      fitness_level: level || null,
      primary_goals: goals,
      onboarded: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tudo pronto!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between px-6 pt-safe pb-10">
      {/* Background hero image with overlay */}
      <img src="/images/hero-running.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, oklch(0.12 0.03 250 / 0.7) 0%, oklch(0.12 0.03 250 / 0.95) 60%, oklch(0.12 0.03 250 / 1) 100%)"
      }} />

      <div className="relative z-10 w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= step
                  ? "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))"
                  : "oklch(0.22 0.04 250)"
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center my-8 animate-fade-in w-full max-w-sm mx-auto" key={step}>
        {step === 0 && (
          <div className="text-center">
            {/* Pulsing ring wrapping our new AppLogo */}
            <div className="pulse-ring rounded-full p-2 mb-6 mx-auto inline-block animate-glow-pulse" style={{ background: "oklch(0.18 0.04 250 / 0.5)", border: "1px solid oklch(0.45 0.10 250 / 0.2)" }}>
              <AppLogo size="lg" />
            </div>
            <h1 className="text-2xl font-bold mt-2">Bem-vindo ao Pulse</h1>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto text-sm leading-relaxed">
              Seu treinador pessoal inteligente. Treine, recupere e evolua com base nos seus dados.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Conte sobre você</h2>
            <p className="text-muted-foreground text-sm mb-6">Para personalizar suas recomendações.</p>
            
            <div className="glass-card p-5 space-y-3 mb-6">
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nome" 
                className="w-full h-12 px-4 rounded-xl bg-surface/50 border border-border focus:border-primary-light outline-none transition backdrop-blur" 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  type="number" 
                  placeholder="Peso (kg)" 
                  className="h-12 px-4 rounded-xl bg-surface/50 border border-border focus:border-primary-light outline-none transition backdrop-blur" 
                />
                <input 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)} 
                  type="number" 
                  placeholder="Altura (cm)" 
                  className="h-12 px-4 rounded-xl bg-surface/50 border border-border focus:border-primary-light outline-none transition backdrop-blur" 
                />
              </div>
            </div>

            <p className="text-sm font-semibold mb-3">Nível de condicionamento</p>
            <div className="space-y-2">
              {LEVELS.map((l) => {
                const on = level === l.key;
                return (
                  <button key={l.key} onClick={() => setLevel(l.key)}
                    className="w-full p-4 rounded-xl transition active:scale-[0.98] text-left glass-card"
                    style={on ? { borderColor: "oklch(0.62 0.20 250 / 0.6)", opacity: 1 } : { opacity: 0.7 }}
                  >
                    <div className="font-semibold text-sm">{l.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Seus objetivos</h2>
            <p className="text-muted-foreground text-sm mb-6">Escolha um ou mais.</p>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => {
                const on = goals.includes(g.key);
                return (
                  <button key={g.key} onClick={() => toggleGoal(g.key)}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition active:scale-95 glass-card"
                    style={on ? { borderColor: "oklch(0.62 0.20 250 / 0.6)", opacity: 1 } : { opacity: 0.7 }}
                  >
                    <span className="text-4xl">{g.emoji}</span>
                    <span className="font-semibold text-sm">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={step < 2 ? next : finish}
        disabled={saving || (step === 1 && !name)}
        className="relative z-10 h-14 w-full max-w-sm mx-auto rounded-2xl bg-primary text-primary-foreground font-semibold glow-primary-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {step < 2 ? "Continuar" : saving ? "Salvando..." : "Começar a usar Pulse"}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
