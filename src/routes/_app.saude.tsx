import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useState } from "react";
import {
  AppScreen,
  CoachButton,
  DesignCard,
  PageActionHeader,
  SectionTitle,
  VitalsHex,
} from "@/components/PulseUI";
import { dataISO, lerRecuperacao, salvarRecuperacaoDia } from "@/lib/pulse-data";
import { Activity, Moon, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/saude")({ component: SaudePage });

function SaudePage() {
  const today = dataISO(new Date());
  const recuperacoes = useMemo(() => lerRecuperacao(), []);
  const atual = recuperacoes.find((item) => item.data === today) ?? recuperacoes.at(-1);
  const [sleep, setSleep] = useState(atual?.sono ?? 7);
  const [energy, setEnergy] = useState(atual?.energia ?? 7);
  const [soreness, setSoreness] = useState(atual?.dor ?? 3);
  const score = Math.round((sleep / 10) * 40 + (energy / 10) * 40 + ((10 - soreness) / 10) * 20);

  const save = () => {
    salvarRecuperacaoDia({ data: today, sono: sleep, energia: energy, dor: soreness, score });
    toast.success("Check-in salvo.");
  };

  return (
    <AppScreen>
      <PageActionHeader title="VITALs" />
      <div className="space-y-5">
        <DesignCard className="text-center">
          <SectionTitle title="Diagnóstico de hoje" />
          <div className="flex justify-center">
            <VitalsHex value={score} />
          </div>
          <div className="mt-3 text-lg font-bold text-[#C8FF00]">
            {score >= 80 ? "Excelente" : score >= 60 ? "Bom" : "Atenção"}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#888888]">
            Continue acompanhando sono, energia e dor muscular para ajustar a carga.
          </p>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Registrar check-in diário" />
          <div className="space-y-5">
            <Slider
              label="Sono"
              icon={<Moon className="h-5 w-5" />}
              value={sleep}
              onChange={setSleep}
            />
            <Slider
              label="Energia"
              icon={<Zap className="h-5 w-5" />}
              value={energy}
              onChange={setEnergy}
            />
            <Slider
              label="Dor muscular"
              icon={<Activity className="h-5 w-5" />}
              value={soreness}
              onChange={setSoreness}
            />
          </div>
          <button
            onClick={save}
            className="mt-6 h-14 w-full rounded-xl bg-[#C8FF00] text-sm font-black text-black"
          >
            SALVAR CHECK-IN
          </button>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Recomendação esportiva" />
          <p className="text-sm leading-relaxed text-[#888888]">
            {score >= 70
              ? "Boa recuperação. Treino moderado em Zona 2 é ideal."
              : "Reduza intensidade e foque em descanso ativo."}
          </p>
          <div className="mt-5">
            <CoachButton>Ver treino recomendado</CoachButton>
          </div>
        </DesignCard>
      </div>
    </AppScreen>
  );
}

function Slider({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-[#888888]">
          <span className="text-[#C8FF00]">{icon}</span>
          {label}
        </span>
        <span className="text-lg font-black text-white">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#C8FF00]"
      />
    </div>
  );
}
