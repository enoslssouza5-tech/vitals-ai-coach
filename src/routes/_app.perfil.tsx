import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Counter } from "@/components/Counter";
import { HeroHeader } from "@/components/HeroHeader";
import {
  calcularStreak,
  dataISO,
  formatarDataCurta,
  kmTreino,
  lerPerfil,
  lerRecuperacao,
  nomeModalidade,
  salvarPerfil,
  type PerfilPulse,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { toast } from "sonner";
import { Award, Download, History, Lock, Share2, Sparkles } from "lucide-react";
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

export const Route = createFileRoute("/_app/perfil")({ component: Perfil });

const objetivos = [
  { value: "emagrecer", label: "Emagrecer" },
  { value: "performance", label: "Performance" },
  { value: "saude", label: "Saúde" },
  { value: "provas", label: "Completar provas" },
] as const;

function Perfil() {
  const [perfil, setPerfil] = useState<PerfilPulse>(() => lerPerfil());
  const [cardAberto, setCardAberto] = useState(false);
  const treinos = useMemo(() => listarTreinos(), []);
  const recuperacao = useMemo(() => lerRecuperacao(), []);
  const streak = useMemo(() => calcularStreak(treinos), [treinos]);
  const stats = useMemo(() => montarStats(treinos, recuperacao), [treinos, recuperacao]);
  const paceData = useMemo(() => montarPaceData(treinos), [treinos]);
  const conquistas = useMemo(() => montarConquistas(treinos, streak), [treinos, streak]);
  const paceMelhorou = calcularMelhoraPace(paceData);
  const principal = modalidadePrincipal(treinos);

  const salvar = () => {
    salvarPerfil(perfil);
    toast.success("Perfil salvo com sucesso.");
  };

  return (
    <div>
      <HeroHeader
        image="running"
        title="PERFIL"
        subtitle="DADOS E EVOLUÇÃO DO ATLETA"
        height="28vh"
      />

      <motion.div
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10 select-none"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="glass-card p-5" variants={itemVariants}>
          <div className="athletic-label tracking-widest text-[10px] mb-4">Dados pessoais</div>
          <div className="space-y-3">
            <Field
              label="Nome"
              value={perfil.nome}
              onChange={(value) => setPerfil({ ...perfil, nome: value })}
            />
            <Field
              label="Cidade"
              value={perfil.cidade}
              onChange={(value) => setPerfil({ ...perfil, cidade: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Peso (kg)"
                type="number"
                value={String(perfil.peso)}
                onChange={(value) => setPerfil({ ...perfil, peso: Number(value) })}
              />
              <Field
                label="Altura (cm)"
                type="number"
                value={String(perfil.altura)}
                onChange={(value) => setPerfil({ ...perfil, altura: Number(value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Meta semanal (km)"
                type="number"
                value={String(perfil.metaSemanalKm)}
                onChange={(value) => setPerfil({ ...perfil, metaSemanalKm: Number(value) })}
              />
              <div>
                <label className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">
                  Objetivo
                </label>
                <select
                  value={perfil.objetivo}
                  onChange={(e) =>
                    setPerfil({ ...perfil, objetivo: e.target.value as PerfilPulse["objetivo"] })
                  }
                  className="mt-2 h-12 w-full rounded-xl bg-background border border-border px-3 text-xs font-bold outline-none"
                >
                  {objetivos.map((objetivo) => (
                    <option key={objetivo.value} value={objetivo.value}>
                      {objetivo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={salvar}
            className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground text-xs font-black tracking-widest active:scale-[0.97] transition"
            aria-label="Salvar perfil"
          >
            SALVAR PERFIL
          </button>
        </motion.div>

        <motion.div className="grid grid-cols-4 gap-2" variants={itemVariants}>
          <Stat n={stats.totalTreinos} l="TREINOS" />
          <Stat n={stats.totalKm} l="KM" decimals={1} />
          <Stat n={stats.horas} l="HORAS" decimals={1} />
          <Stat n={stats.mediaRecuperacao} l="REC." />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            to="/historico"
            className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition block"
          >
            <div className="flex items-center gap-3">
              <div className="icon-circle h-10 w-10 glow-primary-sm">
                <History className="h-5 w-5 text-primary-light" />
              </div>
              <div className="font-black text-sm tracking-wide">HISTÓRICO DE ATIVIDADES</div>
            </div>
          </Link>
        </motion.div>

        <motion.div className="glass-card p-5" variants={itemVariants}>
          <div className="athletic-label tracking-widest text-[10px] mb-4">
            Linha do tempo da evolução
          </div>
          {paceMelhorou > 0 && (
            <div className="mb-4 inline-flex rounded-full bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 text-[10px] font-black text-emerald-300">
              📈 Seu pace melhorou {paceMelhorou}% no último mês
            </div>
          )}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
                />
                <Tooltip
                  contentStyle={{
                    background: "#0B1023",
                    border: "1px solid oklch(0.45 0.10 250 / 0.4)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  name="Pace min/km"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass-card p-5" variants={itemVariants}>
          <div className="athletic-label tracking-widest text-[10px] mb-4">Conquistas</div>
          <div className="grid grid-cols-2 gap-3">
            {conquistas.map((badge) => (
              <div
                key={badge.titulo}
                className={`rounded-2xl p-4 border animate-fade-in ${badge.desbloqueado ? "border-primary/30 bg-primary/10 badge-shimmer" : "border-border/30 bg-muted/10 grayscale opacity-70"}`}
              >
                <div className="flex items-center gap-2">
                  {badge.desbloqueado ? (
                    <Award className="h-5 w-5 text-primary-light" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className="text-xs font-black">{badge.titulo}</p>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground font-semibold">
                  {badge.desbloqueado ? "Desbloqueado" : badge.criterio}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="glass-card p-5" variants={itemVariants}>
          <div className="flex items-center gap-1.5 text-xs text-primary-light font-black tracking-widest mb-3 uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Card do atleta
          </div>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Gere um resumo visual com seus números do mês para compartilhar.
          </p>
          <button
            onClick={() => setCardAberto(true)}
            className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground text-xs font-black tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition"
            aria-label="Gerar meu card do mês"
          >
            <Share2 className="h-4 w-4" /> GERAR MEU CARD DO MÊS
          </button>
        </motion.div>
      </motion.div>

      {cardAberto && (
        <AtletaCard
          perfil={perfil}
          stats={stats}
          streak={streak}
          principal={principal}
          melhorPace={melhorPace(paceData)}
          onClose={() => setCardAberto(false)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-xl bg-background border border-border px-3 text-xs font-bold outline-none"
        aria-label={label}
      />
    </div>
  );
}

function Stat({ n, l, decimals = 0 }: { n: number; l: string; decimals?: number }) {
  return (
    <div
      className="glass-card p-3 text-center cursor-pointer select-none"
      style={{ willChange: "transform" }}
    >
      <div className="text-xl font-black font-mono leading-none text-primary-light">
        <Counter to={n} decimals={decimals} />
      </div>
      <div className="text-[8px] text-muted-foreground font-black tracking-widest uppercase mt-2">
        {l}
      </div>
    </div>
  );
}

function montarStats(
  treinos: ReturnType<typeof listarTreinos>,
  recuperacao: ReturnType<typeof lerRecuperacao>,
) {
  const totalKm = treinos.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const horas = treinos.reduce((sum, treino) => sum + treino.duracaoSeg / 3600, 0);
  const mediaRecuperacao = recuperacao.length
    ? recuperacao.reduce((sum, r) => sum + r.score, 0) / recuperacao.length
    : 0;
  return { totalTreinos: treinos.length, totalKm, horas, mediaRecuperacao };
}

function montarPaceData(treinos: ReturnType<typeof listarTreinos>) {
  return [...treinos]
    .filter((treino) => treino.distanciaMetros > 0)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(-30)
    .map((treino) => ({
      label: formatarDataCurta(treino.data),
      pace: Number((treino.duracaoSeg / 60 / kmTreino(treino)).toFixed(2)),
    }));
}

function calcularMelhoraPace(data: { pace: number }[]) {
  if (data.length < 2) return 0;
  const primeiro = data[0].pace;
  const ultimo = data[data.length - 1].pace;
  if (ultimo >= primeiro) return 0;
  return Math.round(((primeiro - ultimo) / primeiro) * 100);
}

function melhorPace(data: { pace: number }[]) {
  if (!data.length) return "--";
  return Math.min(...data.map((d) => d.pace)).toFixed(2);
}

function modalidadePrincipal(treinos: ReturnType<typeof listarTreinos>) {
  const counts = treinos.reduce<Record<string, number>>((acc, treino) => {
    acc[treino.modalidade] = (acc[treino.modalidade] ?? 0) + 1;
    return acc;
  }, {});
  const key = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "running";
  return nomeModalidade(key);
}

function montarConquistas(treinos: ReturnType<typeof listarTreinos>, streak: number) {
  const mes = new Date().toISOString().slice(0, 7);
  const kmMes = treinos
    .filter((t) => t.data.slice(0, 7) === mes)
    .reduce((sum, treino) => sum + kmTreino(treino), 0);
  const madrugador = treinos.filter((t) => new Date(t.data).getHours() < 7).length;
  return [
    {
      titulo: "Primeira Corrida",
      desbloqueado: treinos.length > 0,
      criterio: "Registre seu primeiro treino",
    },
    {
      titulo: "Sequência de 7 dias",
      desbloqueado: streak >= 7,
      criterio: "Treine por 7 dias seguidos",
    },
    {
      titulo: "10km Concluído",
      desbloqueado: treinos.some((t) => kmTreino(t) >= 10),
      criterio: "Complete um treino de 10 km",
    },
    { titulo: "100km no Mês", desbloqueado: kmMes >= 100, criterio: "Some 100 km no mês" },
    {
      titulo: "Madrugador",
      desbloqueado: madrugador >= 3,
      criterio: "Faça 3 treinos antes das 7h",
    },
  ];
}

function AtletaCard({
  perfil,
  stats,
  streak,
  principal,
  melhorPace,
  onClose,
}: {
  perfil: PerfilPulse;
  stats: ReturnType<typeof montarStats>;
  streak: number;
  principal: string;
  melhorPace: string;
  onClose: () => void;
}) {
  const baixar = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0B1023";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#22d3ee";
    ctx.font = "900 72px Arial";
    ctx.fillText("PULSE", 72, 140);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px Arial";
    ctx.fillText(perfil.nome || "Atleta Pulse", 72, 290);
    ctx.font = "900 88px Arial";
    ctx.fillText(`${stats.totalKm.toFixed(1)} KM`, 72, 470);
    ctx.font = "700 38px Arial";
    ctx.fillText(`Modalidade: ${principal}`, 72, 590);
    ctx.fillText(`Melhor pace: ${melhorPace} min/km`, 72, 660);
    ctx.fillText(`Sequência: ${streak} dias`, 72, 730);
    const link = document.createElement("a");
    link.download = "pulse-card-atleta.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="glass-card p-5 w-full max-w-sm">
        <div className="rounded-2xl p-5 border border-primary/30 bg-background">
          <p className="text-primary-light font-black tracking-widest">PULSE</p>
          <p className="mt-8 text-lg font-black">{perfil.nome || "Atleta Pulse"}</p>
          <p className="mt-3 text-4xl font-black font-mono">{stats.totalKm.toFixed(1)} KM</p>
          <p className="mt-2 text-xs text-muted-foreground font-black uppercase">
            {principal} · Pace {melhorPace} · {streak} dias
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={baixar}
            className="h-12 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center justify-center gap-2 active:scale-[0.97] transition"
            aria-label="Baixar card do atleta"
          >
            <Download className="h-4 w-4" /> BAIXAR
          </button>
          <button
            onClick={onClose}
            className="h-12 rounded-xl glass-card text-xs font-black active:scale-[0.97] transition"
            aria-label="Fechar card do atleta"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
