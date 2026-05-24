import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
  cargaTreinoDia,
  dataISO,
  formatarDataCurta,
  lerRecuperacao,
  obterClimaAtual,
  salvarRecuperacaoDia,
  ultimoTreino,
  type ClimaAtual,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { toast } from "sonner";
import {
  Activity as ActivityIcon,
  BarChart3,
  ChevronRight,
  Droplets,
  Moon,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/saude")({ component: SaudePage });

function SaudePage() {
  const today = dataISO(new Date());
  const recuperacoes = useMemo(() => lerRecuperacao(), []);
  const atual = recuperacoes.find((r) => r.data === today) ?? recuperacoes.at(-1);
  const [sleep, setSleep] = useState<number>(atual?.sono ?? 7);
  const [energy, setEnergy] = useState<number>(atual?.energia ?? 7);
  const [soreness, setSoreness] = useState<number>(atual?.dor ?? 3);
  const [diagnostico, setDiagnostico] = useState("Analisando seus últimos 14 dias...");
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const treinos = useMemo(() => listarTreinos(), []);

  const score = Math.round((sleep / 10) * 40 + (energy / 10) * 40 + ((10 - soreness) / 10) * 20);
  const historico = useMemo(
    () => montarHistorico14Dias(recuperacoes, treinos),
    [recuperacoes, treinos],
  );
  const ultimo = ultimoTreino();
  const treinouUltimas24h = ultimo
    ? Date.now() - new Date(ultimo.data).getTime() <= 86_400_000
    : false;

  useEffect(() => {
    let cancelled = false;
    obterClimaAtual()
      .then((value) => !cancelled && setClima(value))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function analisar() {
      const hoje = new Date();
      const segunda = hoje.getDay() === 1;
      const ultimaData = localStorage.getItem("pulse_diagnostico_data");
      const cache = localStorage.getItem("pulse_diagnostico_texto");
      if (!segunda && cache) {
        setDiagnostico(cache);
        return;
      }
      if (ultimaData === today && cache) {
        setDiagnostico(cache);
        return;
      }
      const fallback =
        "Seu padrão mostra que recuperação e carga precisam andar juntas. Nesta semana, mantenha um treino leve após dias de score abaixo de 60.";
      const texto = await gerarTextoAnthropic({
        system:
          "Você é um coach de recuperação esportiva. Analise os dados dos últimos 14 dias (score de recuperação e carga de treino) e identifique padrões problemáticos. Dê 1 insight específico e 1 recomendação prática. Máximo 3 linhas. Responda em português.",
        prompt: JSON.stringify(historico),
        fallback,
        storageKey: `diagnostico-${today}`,
      });
      if (!cancelled) {
        setDiagnostico(texto);
        localStorage.setItem("pulse_diagnostico_data", today);
        localStorage.setItem("pulse_diagnostico_texto", texto);
      }
    }
    analisar();
    return () => {
      cancelled = true;
    };
  }, [historico, today]);

  const save = () => {
    salvarRecuperacaoDia({ data: today, sono: sleep, energia: energy, dor: soreness, score });
    toast.success("Check-in de recuperação salvo.");
  };

  const rec =
    score >= 80
      ? "Excelente recuperação. Bom dia para treino intenso ou intervalado."
      : score >= 60
        ? "Boa recuperação. Treino moderado em Zona 2 é ideal."
        : score >= 40
          ? "Recuperação parcial. Reduza intensidade e foque em técnica."
          : "Recuperação baixa. Priorize descanso ativo: caminhada e alongamento.";

  return (
    <div>
      <HeroHeader
        image="cycling"
        title="RECUPERAÇÃO"
        subtitle="DIAGNÓSTICO DIÁRIO E SAÚDE"
        height="34vh"
      />

      <motion.div
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Card className="flex flex-col items-center text-center">
          <div className="athletic-label tracking-widest text-[10px] mb-4">Diagnóstico de hoje</div>
          <RecoveryRing score={score} size={140} />
          <h3 className="font-black text-lg mt-5 tracking-tight">SCORE DE RECUPERAÇÃO</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed font-semibold">
            {rec}
          </p>
        </Card>

        <Card>
          <div className="athletic-label tracking-widest text-[10px] mb-4">
            Registrar check-in diário
          </div>
          <div className="space-y-4">
            <SliderRow
              label="Sono"
              icon={Moon}
              value={sleep}
              min={0}
              max={10}
              step={1}
              unit="/10"
              onChange={setSleep}
            />
            <SliderRow
              label="Energia"
              icon={Zap}
              value={energy}
              min={1}
              max={10}
              step={1}
              unit="/10"
              onChange={setEnergy}
            />
            <SliderRow
              label="Dor muscular"
              icon={ActivityIcon}
              value={soreness}
              min={0}
              max={10}
              step={1}
              unit="/10"
              onChange={setSoreness}
            />
          </div>
          <motion.button
            onClick={save}
            whileTap={{ scale: 0.97 }}
            aria-label="Salvar check-in de recuperação"
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs mt-6 cursor-pointer select-none glow-primary-sm active:scale-[0.97] transition"
          >
            SALVAR CHECK-IN
          </motion.button>
        </Card>

        {clima && clima.temp > 28 && treinouUltimas24h && (
          <Card className="border-primary-light/40 bg-primary/10">
            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-primary-light" />
              <p className="text-xs font-black leading-relaxed">
                💧 Você treinou com calor recentemente. Beba pelo menos 3L de água hoje.
              </p>
            </div>
          </Card>
        )}

        <Card>
          <div className="athletic-label tracking-widest text-[10px] mb-4">Últimos 14 dias</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="oklch(0.30 0.05 250 / 0.35)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="oklch(0.72 0.02 250)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.72 0.02 250)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0B1023",
                    border: "1px solid oklch(0.45 0.10 250 / 0.4)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Recuperação"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="carga"
                  name="Carga"
                  stroke="#fb923c"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest mb-3 uppercase">
            <BarChart3 className="h-3.5 w-3.5" /> Análise semanal
          </div>
          <p className="text-[10px] text-muted-foreground font-black tracking-widest mb-3 uppercase">
            Atualiza toda segunda-feira
          </p>
          <p className="text-xs leading-relaxed font-semibold whitespace-pre-line">{diagnostico}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest mb-3 uppercase">
            <Star className="h-3.5 w-3.5" /> Recomendação esportiva
          </div>
          <p className="text-xs leading-relaxed font-semibold">{rec}</p>
          <Link
            to="/treino"
            className="mt-5 inline-flex h-12 px-4 rounded-xl glass-card text-xs font-black tracking-widest items-center gap-1 active:scale-[0.97] transition"
            aria-label="Começar treino agora"
          >
            COMEÇAR AGORA <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>
      </motion.div>
    </div>
  );
}

function montarHistorico14Dias(
  recuperacoes: ReturnType<typeof lerRecuperacao>,
  treinos: ReturnType<typeof listarTreinos>,
) {
  const byDate = new Map(recuperacoes.map((r) => [r.data, r]));
  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = dataISO(date);
    return {
      data: key,
      label: formatarDataCurta(date),
      score: byDate.get(key)?.score ?? null,
      carga: cargaTreinoDia(key, treinos),
    };
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`glass-card p-5 select-none animate-fade-in ${className}`}
      variants={cardVariants}
      whileTap={{ scale: 0.98 }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

function SliderRow({
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  icon: typeof Moon;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3 border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-muted-foreground">
          <div className="icon-circle h-7 w-7">
            <Icon className="h-3.5 w-3.5 text-primary-light" />
          </div>
          {label}
        </span>
        <span className="text-sm font-black num text-primary-light">
          {value}
          {unit}
        </span>
      </div>
      <input
        aria-label={`Ajustar ${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="cursor-pointer"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
