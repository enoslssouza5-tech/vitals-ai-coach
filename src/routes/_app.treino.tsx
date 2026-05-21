import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getMockWeather } from "@/lib/ai-insights";
import { Footprints, Bike, MountainSnow, Dumbbell, MapPin, Cloud, Play } from "lucide-react";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

const TYPES = [
  { key: "running", label: "Corrida", icon: Footprints, color: "text-primary-light" },
  { key: "cycling", label: "Pedal", icon: Bike, color: "text-accent" },
  { key: "walking", label: "Caminhada", icon: MapPin, color: "text-warning" },
  { key: "hiking", label: "Trilha", icon: MountainSnow, color: "text-primary" },
  { key: "workout", label: "Academia", icon: Dumbbell, color: "text-danger" },
] as const;

function TreinoPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<string>("running");
  const weather = getMockWeather();

  const start = () => navigate({ to: "/treino-ativo", search: { type } });

  return (
    <div>
      <PageHeader title="Iniciar treino" subtitle="Escolha sua modalidade" />

      <div className="px-5 space-y-4 pb-6">
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          {TYPES.map((t) => {
            const on = type === t.key;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setType(t.key)}
                className={`p-5 rounded-2xl border transition active:scale-[0.97] flex flex-col items-start gap-3 ${on ? "border-primary bg-primary/10 glow-primary-sm" : "border-border bg-surface"}`}>
                <Icon className={`h-7 w-7 ${on ? "text-primary-light" : t.color}`} />
                <span className="font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-5 w-5 text-primary-light" />
            <span className="text-sm font-semibold">Condições agora</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl font-bold num">{weather.temp}°</div><div className="text-[10px] text-muted-foreground uppercase">temp</div></div>
            <div><div className="text-2xl font-bold num">{weather.humidity}%</div><div className="text-[10px] text-muted-foreground uppercase">umidade</div></div>
            <div><div className="text-xs font-semibold mt-2">{weather.condition}</div></div>
          </div>
          {weather.rainSoon && (
            <div className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
              🌧️ Risco de chuva nas próximas horas. Considere antecipar o treino.
            </div>
          )}
        </div>

        <button onClick={start}
          className="w-full h-20 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition glow-primary pulse-ring">
          <Play className="h-6 w-6 fill-current" /> INICIAR
        </button>

        <p className="text-xs text-center text-muted-foreground">Mantenha o celular com você durante o treino. GPS será ativado.</p>
      </div>
    </div>
  );
}
