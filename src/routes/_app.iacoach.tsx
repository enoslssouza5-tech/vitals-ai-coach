import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppScreen,
  CoachButton,
  DesignCard,
  PageActionHeader,
  SectionTitle,
  SimpleMetric,
} from "@/components/PulseUI";
import { Activity, Sparkles, Target, Timer } from "lucide-react";

export const Route = createFileRoute("/_app/iacoach")({ component: IACoach });

function IACoach() {
  return (
    <AppScreen>
      <PageActionHeader title="Pulse Coach" />
      <div className="space-y-5">
        <DesignCard>
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-[#C8FF00]">
            <Sparkles className="h-5 w-5 fill-current" /> PULSE COACH
          </div>
          <h2 className="text-[28px] font-black leading-tight text-white">
            Seu próximo nível começa agora.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#888888]">
            Com base no seu desempenho, seu treino ideal hoje é um treino de ritmo moderado com foco
            em resistência.
          </p>
          <div className="mt-6">
            <CoachButton>Ver treino recomendado</CoachButton>
          </div>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Plano de hoje" />
          <div className="grid grid-cols-3 gap-3">
            <SimpleMetric icon={<Target className="h-5 w-5" />} value="5,0 km" label="Distância" />
            <SimpleMetric icon={<Timer className="h-5 w-5" />} value="32 min" label="Tempo" />
            <SimpleMetric icon={<Activity className="h-5 w-5" />} value="Z2" label="Intensidade" />
          </div>
          <Link
            to="/treino"
            className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-[#C8FF00] text-sm font-black text-black"
          >
            INICIAR TREINO
          </Link>
        </DesignCard>
      </div>
    </AppScreen>
  );
}
