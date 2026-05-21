import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, ArrowRight } from "lucide-react";

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
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [level, setLevel] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
  }, [user, authLoading, navigate]);

  const next = () => setStep((s) => s + 1);
  const toggleGoal = (g: string) =>
    setGoals((arr) => (arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g]));

  const finish = async () => {
    if (!user) return;
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
    <div className="min-h-screen px-6 pt-safe pb-10 flex flex-col">
      <div className="flex gap-2 pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center animate-fade-in" key={step}>
        {step === 0 && (
          <div className="text-center">
            <div className="pulse-ring h-20 w-20 mx-auto rounded-full bg-primary grid place-items-center glow-primary mb-6">
              <Activity className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Bem-vindo ao Pulse</h1>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
              Seu treinador pessoal inteligente. Treine, recupere e evolua com base nos seus dados.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Conte sobre você</h2>
            <p className="text-muted-foreground text-sm mb-6">Para personalizar suas recomendações.</p>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="Peso (kg)" className="h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none" />
                <input value={height} onChange={(e) => setHeight(e.target.value)} type="number" placeholder="Altura (cm)" className="h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none" />
              </div>
            </div>
            <p className="text-sm font-semibold mt-6 mb-3">Nível de condicionamento</p>
            <div className="space-y-2">
              {LEVELS.map((l) => (
                <button key={l.key} onClick={() => setLevel(l.key)}
                  className={`w-full p-4 rounded-xl border text-left transition active:scale-[0.98] ${level === l.key ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                  <div className="font-semibold">{l.label}</div>
                  <div className="text-xs text-muted-foreground">{l.desc}</div>
                </button>
              ))}
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
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition active:scale-95 ${on ? "border-primary bg-primary/10 glow-primary-sm" : "border-border bg-surface"}`}>
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
        className="h-14 rounded-2xl bg-primary text-primary-foreground font-semibold glow-primary-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {step < 2 ? "Continuar" : saving ? "Salvando..." : "Começar a usar Pulse"}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
