import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Counter } from "@/components/Counter";
import { HeroHeader } from "@/components/HeroHeader";
import { InstallPwaCard } from "@/components/InstallPwaCard";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
  calcularStreak,
  dataISO,
  kmTreino,
  lerPerfil,
  lerRecuperacao,
  obterClimaAtual,
  treinosDaSemana,
  ultimoTreino,
  type ClimaAtual,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { Bell, ChevronRight, Flame, Moon, Play, Sparkles, Sun, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [briefing, setBriefing] = useState("Carregando seu briefing do dia...");
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const treinos = useMemo(() => listarTreinos(), []);
  const perfil = useMemo(() => lerPerfil(), []);
  const recuperacao = useMemo(() => lerRecuperacao().at(-1), []);
  const semanal = useMemo(() => treinosDaSemana(treinos), [treinos]);
  const streak = useMemo(() => calcularStreak(treinos), [treinos]);
  const metaKm = perfil.metaSemanalKm || 20;
  const kmSemana = Number(semanal.reduce((sum, treino) => sum + kmTreino(treino), 0).toFixed(1));
  const progresso = Math.min(100, (kmSemana / metaKm) * 100);
  const totalMin = Math.round(semanal.reduce((sum, treino) => sum + treino.duracaoSeg, 0) / 60);
  const totalCal = semanal.reduce((sum, treino) => sum + treino.caloriasKcal, 0);
  const hour = new Date().getHours();
  const PeriodIcon = hour >= 6 && hour < 18 ? Sun : Moon;
  const firstName = (perfil.nome || "Atleta").split(" ")[0];

  useEffect(() => {
    let cancelled = false;
    async function carregarBriefing() {
      try {
        const climaAtual = await obterClimaAtual();
        if (cancelled) return;
        setClima(climaAtual);
        const ultimo = ultimoTreino();
        const fallback = montarBriefingFallback(
          ultimo?.modalidade,
          recuperacao?.score,
          climaAtual.temp,
        );
        const texto = await gerarTextoAnthropic({
          system:
            "Você é um coach esportivo brasileiro. Com base nos dados do atleta (último treino, score de recuperação, clima atual), gere um briefing diário motivacional em 2-3 linhas curtas. Seja direto, humano e nunca genérico. Responda sempre em português.",
          prompt: JSON.stringify({ ultimoTreino: ultimo, recuperacao, clima: climaAtual }),
          fallback,
          storageKey: `briefing-${dataISO(new Date())}`,
        });
        if (!cancelled) setBriefing(texto);
      } catch {
        if (!cancelled)
          setBriefing(
            "Hoje pede inteligência: aqueça bem, respeite seu corpo e transforme constância em evolução.",
          );
      }
    }
    carregarBriefing();
    return () => {
      cancelled = true;
    };
  }, [recuperacao]);

  const semana = useMemo(() => {
    const inicio = new Date();
    const diff = inicio.getDay() === 0 ? -6 : 1 - inicio.getDay();
    inicio.setDate(inicio.getDate() + diff);
    inicio.setHours(0, 0, 0, 0);
    return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label, index) => {
      const date = new Date(inicio);
      date.setDate(inicio.getDate() + index);
      const key = dataISO(date);
      const treinado = treinos.some((treino) => dataISO(new Date(treino.data)) === key);
      const hoje = key === dataISO(new Date());
      return {
        label,
        treinado,
        hoje,
        planejado: !treinado && date > new Date() && index % 2 === 0,
      };
    });
  }, [treinos]);

  return (
    <div>
      <HeroHeader
        image="running"
        title={`BOM TREINO, ${firstName}`.toUpperCase()}
        subtitle="INÍCIO INTELIGENTE DO SEU DIA"
        right={
          <button
            aria-label="Abrir notificações"
            className="icon-circle h-12 w-12 hover:scale-105 active:scale-95 transition relative"
          >
            <Bell className="h-5 w-5 text-primary-light" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary-light glow-primary-sm" />
          </button>
        }
      />

      <motion.div
        className="px-5 space-y-4 pb-28 -mt-4 relative z-10"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <Card>
          <div className="flex items-start gap-4">
            <div className="icon-circle h-12 w-12 glow-primary-sm shrink-0">
              <PeriodIcon className="h-6 w-6 text-primary-light" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest mb-2 uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Briefing diário com IA
              </div>
              <p className="text-sm font-bold leading-relaxed whitespace-pre-line">{briefing}</p>
            </div>
          </div>
        </Card>

        {clima && clima.temp > 30 && clima.humidity > 70 && (
          <Card className="border-warning/40 bg-warning/10">
            <p className="text-xs font-black leading-relaxed text-warning">
              ⚠️ Calor extremo hoje — {clima.temp}°C com {clima.humidity}% de umidade. Prefira
              treinar antes das 9h ou após as 17h.
            </p>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="athletic-label tracking-widest text-[10px]">Semana visual</div>
            <div className="text-[10px] font-black text-primary-light tracking-widest">
              {kmSemana} / {metaKm} km
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {semana.map((dia) => (
              <div key={dia.label} className="flex flex-col items-center gap-2">
                <div
                  className={[
                    "h-10 w-10 rounded-full grid place-items-center text-[10px] font-black transition",
                    dia.treinado
                      ? "bg-emerald-400 text-background shadow-[0_0_18px_rgba(52,211,153,0.55)]"
                      : "",
                    dia.planejado ? "border border-primary-light text-primary-light" : "",
                    !dia.treinado && !dia.planejado ? "bg-muted/30 text-muted-foreground" : "",
                    dia.hoje
                      ? "ring-2 ring-primary-light ring-offset-2 ring-offset-background"
                      : "",
                  ].join(" ")}
                >
                  {dia.label.slice(0, 1)}
                </div>
                <span className="text-[9px] font-black uppercase text-muted-foreground">
                  {dia.label}
                </span>
              </div>
            ))}
          </div>
          <div className="progress-bar mt-5" aria-label="Progresso da meta semanal">
            <motion.div
              className="progress-bar__fill"
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-bold">
            {kmSemana} / {metaKm} km esta semana
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="athletic-label tracking-widest text-[10px]">Sequência ativa</div>
              <p className="text-sm font-black">
                {streak === 0 ? "Comece hoje sua sequência 🔥" : `${streak} dias consecutivos`}
              </p>
            </div>
            <motion.div
              animate={streak >= 7 ? { scale: [1, 1.12, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="icon-circle h-14 w-14 glow-primary-sm"
            >
              <Flame className="h-7 w-7 text-primary-light" />
            </motion.div>
          </div>
        </Card>

        <Card>
          <div className="athletic-label tracking-widest text-[10px]">Volume semanal</div>
          <div className="grid grid-cols-3 gap-4">
            <Metric label="Distância" value={kmSemana} unit="km" decimals={1} />
            <Metric label="Tempo" value={totalMin} unit="min" />
            <Metric label="Calorias" value={totalCal} unit="kcal" />
          </div>
        </Card>

        <Card>
          <div className="athletic-label tracking-widest text-[10px]">Treino recomendado</div>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Use o briefing de hoje para escolher intensidade e duração. O melhor treino é o que você
            consegue repetir com qualidade.
          </p>
          <Link
            to="/treino"
            className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition"
            aria-label="Iniciar treino"
          >
            <Play className="h-4 w-4 fill-current" /> INICIAR TREINO
          </Link>
        </Card>

        <motion.div variants={cardVariants}>
          <Link
            to="/saude"
            className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition block"
          >
            <div className="flex items-center gap-3">
              <div className="icon-circle h-10 w-10 glow-primary-sm">
                <TrendingUp className="h-5 w-5 text-primary-light" />
              </div>
              <div>
                <div className="font-black text-sm tracking-wide">PROGRESSO E SAÚDE</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                  FAZER CHECK-IN DE RECUPERAÇÃO
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </motion.div>

        <motion.div variants={cardVariants}>
          <InstallPwaCard />
        </motion.div>
      </motion.div>
    </div>
  );
}

function montarBriefingFallback(modalidade?: string, score = 70, temp = 24) {
  if (score < 50)
    return `Seu corpo está pedindo controle hoje.\nFaça mobilidade ou treino leve, especialmente com ${temp}°C lá fora.`;
  if (modalidade)
    return `Você vem de um treino de ${modalidade}.\nHoje é dia de somar consistência: comece leve e aumente só se o corpo responder bem.`;
  return `Bom dia para construir base.\nFaça um treino confortável e termine com vontade de voltar amanhã.`;
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
      whileTap={{ scale: 0.97 }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

function Metric({
  label,
  value,
  unit,
  decimals = 0,
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">
        {label}
      </div>
      <div className="scoreboard-value text-2xl flex items-baseline">
        <Counter to={value} decimals={decimals} />
        <span className="scoreboard-unit">{unit}</span>
      </div>
    </div>
  );
}
