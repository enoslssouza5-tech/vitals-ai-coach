import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import {
  diasAtras,
  formatarDataCurta,
  kmTreino,
  lerJSON,
  lerPerfil,
  nomeModalidade,
  salvarJSON,
} from "@/lib/pulse-data";
import { listarTreinos, type TreinoRegistro } from "@/lib/treino-history";
import { Download, Heart, Share2, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/social")({ component: Social });

type FeedItem = {
  id: string;
  nome: string;
  modalidade: string;
  distanciaKm: number;
  data: string;
  mock?: boolean;
};

const amigos = [
  { nome: "Ana Ribeiro", kmSemana: 18.4 },
  { nome: "Bruno Costa", kmSemana: 24.1 },
  { nome: "Camila Torres", kmSemana: 12.8 },
];

const eventos = [
  {
    id: "run-sp-5k",
    nome: "Pulse Night Run",
    data: "2026-06-06",
    cidade: "São Paulo",
    modalidade: "Corrida",
    distancia: "5 km",
    base: 42,
  },
  {
    id: "bike-regiao",
    nome: "Giro da Região",
    data: "2026-06-14",
    cidade: "Campinas",
    modalidade: "Ciclismo",
    distancia: "30 km",
    base: 31,
  },
  {
    id: "trilha-br",
    nome: "Trilha Forte BR",
    data: "2026-06-21",
    cidade: "Atibaia",
    modalidade: "Trilha",
    distancia: "9 km",
    base: 18,
  },
];

function Social() {
  const perfil = useMemo(() => lerPerfil(), []);
  const treinos = useMemo(() => listarTreinos(), []);
  const [likes, setLikes] = useState<Record<string, number>>(() =>
    lerJSON("pulse_social_likes", {}),
  );
  const [joined, setJoined] = useState<string[]>(() => lerJSON("pulse_comunidades", []));
  const [duelo, setDuelo] = useState<string>(() => lerJSON("pulse_duelo_amigo", ""));
  const [presencas, setPresencas] = useState<string[]>(() => lerJSON("pulse_eventos", []));
  const [share, setShare] = useState<FeedItem | null>(null);

  const feed = useMemo<FeedItem[]>(() => {
    const locais = treinos.slice(0, 8).map((treino) => ({
      id: treino.id,
      nome: perfil.nome || "Você",
      modalidade: nomeModalidade(treino.modalidade),
      distanciaKm: kmTreino(treino),
      data: treino.data,
    }));
    const mocks: FeedItem[] = [
      {
        id: "mock-ana",
        nome: "Ana Ribeiro",
        modalidade: "Corrida",
        distanciaKm: 6.2,
        data: new Date(Date.now() - 3_600_000).toISOString(),
        mock: true,
      },
      {
        id: "mock-bruno",
        nome: "Bruno Costa",
        modalidade: "Ciclismo",
        distanciaKm: 32.5,
        data: new Date(Date.now() - 8_600_000).toISOString(),
        mock: true,
      },
      {
        id: "mock-camila",
        nome: "Camila Torres",
        modalidade: "Trilha",
        distanciaKm: 9.1,
        data: new Date(Date.now() - 22_600_000).toISOString(),
        mock: true,
      },
    ];
    return [...locais, ...mocks].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [perfil.nome, treinos]);

  const comunidades = [
    `Corredores de ${perfil.cidade || "sua cidade"}`,
    "Ciclistas da Região",
    "Trilheiros BR",
  ];
  const kmUsuarioSemana = treinos.reduce((sum, treino) => sum + kmTreino(treino), 0);
  const adversario = amigos.find((a) => a.nome === duelo);

  const curtir = (id: string) => {
    const next = { ...likes, [id]: (likes[id] ?? 0) + 1 };
    setLikes(next);
    salvarJSON("pulse_social_likes", next);
  };

  const entrar = (grupo: string) => {
    const next = joined.includes(grupo) ? joined : [...joined, grupo];
    setJoined(next);
    salvarJSON("pulse_comunidades", next);
    toast.success("Você entrou na comunidade.");
  };

  const confirmar = (id: string) => {
    const next = presencas.includes(id) ? presencas : [...presencas, id];
    setPresencas(next);
    salvarJSON("pulse_eventos", next);
    toast.success("Presença confirmada.");
  };

  return (
    <div>
      <HeroHeader
        image="running"
        title="COMUNIDADE"
        subtitle="AMIGOS E DESAFIOS COLETIVOS"
        height="30vh"
      />

      <motion.div
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10 select-none"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Section title="Feed de atividades">
          <div className="space-y-3">
            {feed.map((item) => (
              <div key={item.id} className="glass-card p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-black glow-primary-sm shrink-0">
                    {item.nome[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      {item.modalidade} · {item.distanciaKm.toFixed(2)} km · {diasAtras(item.data)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => curtir(item.id)}
                        aria-label={`Curtir atividade de ${item.nome}`}
                        className="h-12 px-4 rounded-xl glass-card text-xs font-black flex items-center gap-2 active:scale-[0.97] transition"
                      >
                        <Heart className="h-4 w-4 text-primary-light" />{" "}
                        {likes[item.id] ?? (item.mock ? 7 : 0)}
                      </button>
                      <button
                        onClick={() => setShare(item)}
                        aria-label={`Compartilhar atividade de ${item.nome}`}
                        className="h-12 px-4 rounded-xl glass-card text-xs font-black flex items-center gap-2 active:scale-[0.97] transition"
                      >
                        <Share2 className="h-4 w-4 text-primary-light" /> COMPARTILHAR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Comunidades">
          <div className="space-y-3">
            {comunidades.map((grupo, index) => (
              <div
                key={grupo}
                className="glass-card p-4 flex items-center justify-between gap-3 animate-fade-in"
              >
                <div>
                  <p className="text-sm font-black">{grupo}</p>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    {420 + index * 137} membros
                  </p>
                </div>
                <button
                  onClick={() => entrar(grupo)}
                  className="h-12 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black active:scale-[0.97] transition"
                  aria-label={`Entrar em ${grupo}`}
                >
                  {joined.includes(grupo) ? "MEMBRO" : "ENTRAR"}
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Duelo semanal">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {amigos.map((amigo) => (
              <button
                key={amigo.nome}
                onClick={() => {
                  setDuelo(amigo.nome);
                  salvarJSON("pulse_duelo_amigo", amigo.nome);
                }}
                className={`h-12 px-4 rounded-xl text-xs font-black whitespace-nowrap active:scale-[0.97] transition ${duelo === amigo.nome ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}
                aria-label={`Desafiar ${amigo.nome}`}
              >
                {amigo.nome.split(" ")[0]}
              </button>
            ))}
          </div>
          {adversario && (
            <div
              className={`mt-4 glass-card p-4 ${adversario.kmSemana > kmUsuarioSemana ? "border-warning/40" : ""}`}
            >
              <div className="flex items-center gap-2 text-xs font-black text-primary-light tracking-widest uppercase mb-3">
                <Trophy className="h-4 w-4" /> Placar ao vivo
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Placar
                  nome="Você"
                  km={kmUsuarioSemana}
                  ativo={kmUsuarioSemana >= adversario.kmSemana}
                />
                <Placar
                  nome={adversario.nome.split(" ")[0]}
                  km={adversario.kmSemana}
                  ativo={adversario.kmSemana > kmUsuarioSemana}
                />
              </div>
            </div>
          )}
        </Section>

        <Section title="Eventos próximos">
          <div className="space-y-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="glass-card p-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{evento.nome}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                      {formatarDataCurta(evento.data)} · {evento.cidade} · {evento.modalidade} ·{" "}
                      {evento.distancia}
                    </p>
                    <p className="text-[10px] text-primary-light font-black mt-2">
                      {evento.base + (presencas.includes(evento.id) ? 1 : 0)} confirmados
                    </p>
                  </div>
                  <button
                    onClick={() => confirmar(evento.id)}
                    className="h-12 px-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black active:scale-[0.97] transition"
                    aria-label={`Confirmar presença em ${evento.nome}`}
                  >
                    {presencas.includes(evento.id) ? "CONFIRMADO" : "CONFIRMAR"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {share && <ShareDialog item={share} onClose={() => setShare(null)} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section className="glass-card p-5" variants={cardVariants}>
      <div className="athletic-label tracking-widest text-[10px] mb-4">{title}</div>
      {children}
    </motion.section>
  );
}

function Placar({ nome, km, ativo }: { nome: string; km: number; ativo: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 ${ativo ? "bg-primary/20 border border-primary/30" : "bg-muted/20"}`}
    >
      <p className="text-[10px] text-muted-foreground font-black uppercase">{nome}</p>
      <p className="text-2xl font-black font-mono mt-1">
        {km.toFixed(1)}
        <span className="text-xs text-muted-foreground ml-1">km</span>
      </p>
    </div>
  );
}

function ShareDialog({ item, onClose }: { item: FeedItem; onClose: () => void }) {
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
    ctx.font = "900 56px Arial";
    ctx.fillText(item.nome, 72, 300);
    ctx.font = "900 96px Arial";
    ctx.fillText(`${item.distanciaKm.toFixed(2)} KM`, 72, 500);
    ctx.font = "700 42px Arial";
    ctx.fillText(item.modalidade.toUpperCase(), 72, 610);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 36px Arial";
    ctx.fillText(
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(item.data)),
      72,
      700,
    );
    const link = document.createElement("a");
    link.download = "pulse-atividade.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="glass-card p-5 w-full max-w-sm">
        <div className="rounded-2xl p-5 border border-primary/30 bg-background">
          <p className="text-primary-light font-black tracking-widest">PULSE</p>
          <p className="mt-8 text-lg font-black">{item.nome}</p>
          <p className="mt-3 text-4xl font-black font-mono">{item.distanciaKm.toFixed(2)} KM</p>
          <p className="mt-2 text-xs text-muted-foreground font-black uppercase">
            {item.modalidade} · {formatarDataCurta(item.data)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={baixar}
            className="h-12 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center justify-center gap-2 active:scale-[0.97] transition"
            aria-label="Baixar card como imagem"
          >
            <Download className="h-4 w-4" /> BAIXAR
          </button>
          <button
            onClick={onClose}
            className="h-12 rounded-xl glass-card text-xs font-black active:scale-[0.97] transition"
            aria-label="Fechar compartilhamento"
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
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
