import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityList,
  AppHeader,
  AppScreen,
  CoachButton,
  DesignCard,
  SectionTitle,
  TrainingLoadCard,
  VitalsHex,
  WeeklySummary,
} from "@/components/PulseUI";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
  dataISO,
  lerPerfil,
  lerRecuperacao,
  obterClimaAtual,
  ultimoTreino,
  type ClimaAtual,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { Calendar, ChevronRight, Info, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [briefing, setBriefing] = useState(
    "Com base no seu desempenho, seu treino ideal hoje é um treino de ritmo moderado com foco em resistência.",
  );
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const perfil = useMemo(() => lerPerfil(), []);
  const recuperacao = useMemo(() => lerRecuperacao().at(-1), []);
  const treinos = useMemo(() => listarTreinos(), []);
  const firstName = (perfil.nome || "Lucas").split(" ")[0];

  useEffect(() => {
    let cancelled = false;
    async function carregarBriefing() {
      try {
        const climaAtual = await obterClimaAtual();
        if (cancelled) return;
        setClima(climaAtual);
        const texto = await gerarTextoAnthropic({
          system:
            "Voce e um coach esportivo. Gere uma recomendacao curta, especifica e humana em portugues.",
          prompt: JSON.stringify({ ultimoTreino: ultimoTreino(), recuperacao, clima: climaAtual }),
          fallback:
            "Com base no seu desempenho, seu treino ideal hoje é um treino de ritmo moderado com foco em resistência.",
          storageKey: `briefing-${dataISO(new Date())}`,
        });
        if (!cancelled) setBriefing(texto);
      } catch {
        if (!cancelled)
          setBriefing(
            "Com base no seu desempenho, seu treino ideal hoje é um treino de ritmo moderado com foco em resistência.",
          );
      }
    }
    carregarBriefing();
    return () => {
      cancelled = true;
    };
  }, [recuperacao]);

  return (
    <AppScreen>
      <AppHeader title={<>Bom dia, {firstName}! 👋</>} subtitle="Pronto para mais uma corrida?" />

      <div className="space-y-5">
        <DesignCard>
          <SectionTitle
            title="Resumo da semana"
            icon={<Calendar className="h-5 w-5 text-[#C8FF00]" strokeWidth={1.5} />}
            action={
              <span className="flex items-center gap-1">
                Ver detalhes <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
          <WeeklySummary />
        </DesignCard>

        <DesignCard>
          <div className="grid grid-cols-[1fr_auto] gap-5">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-[#C8FF00]">
                <Sparkles className="h-5 w-5 fill-current" strokeWidth={1.5} /> PULSE COACH
              </div>
              <h2 className="text-[25px] font-black leading-tight tracking-[-0.04em] text-white">
                Seu próximo nível começa agora.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#888888]">{briefing}</p>
            </div>
            <div className="relative grid h-[132px] w-[132px] shrink-0 place-items-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#1A1A1A" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#C8FF00"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48 * 0.82} ${2 * Math.PI * 48}`}
                />
              </svg>
              <div className="text-center">
                <div className="text-[32px] font-black text-white">82%</div>
                <div className="text-sm text-[#888888]">Preparado</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <CoachButton>Ver treino recomendado</CoachButton>
          </div>
        </DesignCard>

        {clima && clima.temp > 30 && (
          <DesignCard className="py-4">
            <p className="text-sm text-[#888888]">
              Calor alto hoje: {clima.temp}°C. Hidrate-se antes do treino.
            </p>
          </DesignCard>
        )}

        <DesignCard>
          <SectionTitle title="Atividades recentes" action="Ver todas" />
          <ActivityList treinos={treinos} showBadge limit={3} />
        </DesignCard>

        <div className="grid grid-cols-2 gap-4">
          <DesignCard className="min-h-[196px]">
            <div className="mb-3 flex items-center gap-2 text-lg font-bold">
              VITALs Score <Info className="h-4 w-4 text-[#888888]" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-3">
              <VitalsHex value={78} small />
              <div>
                <div className="text-lg font-bold text-[#C8FF00]">Bom</div>
                <div className="mt-2 text-sm text-[#888888]">Continue assim!</div>
              </div>
            </div>
          </DesignCard>
          <TrainingLoadCard />
        </div>
      </div>
    </AppScreen>
  );
}
