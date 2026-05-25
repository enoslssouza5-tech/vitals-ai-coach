import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AppScreen,
  DesignCard,
  PageActionHeader,
  SectionTitle,
  SimpleMetric,
} from "@/components/PulseUI";
import { useRealWeather } from "@/lib/weather";
import {
  fmtDuracao,
  listarTreinos,
  MODALIDADE_INFO,
  type TreinoRegistro,
} from "@/lib/treino-history";
import { Activity, Cloud, Footprints, MapPin, Play, Thermometer, Timer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

const TYPES = ["running", "cycling", "walking", "hiking", "workout"] as const;
type TipoKey = (typeof TYPES)[number];

function TreinoPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<TipoKey>("running");
  const [historico, setHistorico] = useState<TreinoRegistro[]>([]);
  const weather = useRealWeather();
  const info = MODALIDADE_INFO[type];

  useEffect(() => {
    setHistorico(listarTreinos().slice(0, 3));
  }, []);

  const start = () => {
    toast.success("GPS pronto. Treino iniciado.");
    navigate({ to: "/treino-ativo", search: { type } });
  };

  return (
    <AppScreen>
      <PageActionHeader title="Pulse Coach" />

      <div className="space-y-5">
        <DesignCard>
          <SectionTitle title="Treino recomendado" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPES.map((key) => {
              const active = key === type;
              const item = MODALIDADE_INFO[key];
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`h-11 rounded-xl border px-4 text-sm font-bold whitespace-nowrap ${
                    active
                      ? "border-[#C8FF00] bg-[#1A2A00] text-[#C8FF00]"
                      : "border-white/[0.06] text-[#888888]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <h2 className="mt-6 text-[28px] font-black leading-tight text-white">
            {info.label} em ritmo controlado
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#888888]">{info.descricao}</p>
          <button
            onClick={start}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF00] text-sm font-black text-black"
          >
            <Play className="h-5 w-5 fill-current" /> INICIAR TREINO
          </button>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Condições ambientais" />
          <div className="grid grid-cols-3 gap-3">
            <SimpleMetric
              icon={<Thermometer className="h-5 w-5" strokeWidth={1.5} />}
              value={weather.loading ? "--" : `${weather.temp}°`}
              label="Temp"
            />
            <SimpleMetric
              icon={<Cloud className="h-5 w-5" strokeWidth={1.5} />}
              value={weather.condition || "Limpo"}
              label="Clima"
            />
            <SimpleMetric
              icon={<Activity className="h-5 w-5" strokeWidth={1.5} />}
              value={weather.rainSoon ? "Ajustar" : "Ideal"}
              label="Plano"
            />
          </div>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Últimos treinos" action="Ver todas" />
          <div className="divide-y divide-white/[0.06]">
            {historico.map((treino) => (
              <div
                key={treino.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-lg font-bold text-white">
                    {MODALIDADE_INFO[treino.modalidade]?.label ?? treino.modalidade}
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-[#888888]">
                    <span className="flex items-center gap-1">
                      <Footprints className="h-4 w-4" />{" "}
                      {(treino.distanciaMetros / 1000).toFixed(2)} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-4 w-4" /> {fmtDuracao(treino.duracaoSeg)}
                    </span>
                  </div>
                </div>
                <MapPin className="h-5 w-5 text-[#555555]" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </DesignCard>
      </div>
    </AppScreen>
  );
}
