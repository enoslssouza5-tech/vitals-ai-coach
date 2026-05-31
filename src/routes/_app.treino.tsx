import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
  Save,
  Square,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { estimarCalorias, fmtDuracao, salvarTreino } from "@/lib/treino-history";
import { demoPath } from "@/lib/pulse-design-data";
import { motion, AnimatePresence } from "framer-motion";

const stageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

type Stage = "setup" | "active" | "finished";

const sportCategories = [
  {
    icon: "🏃",
    name: "Corrida e Caminhada",
    sports: [
      "Corrida de rua",
      "Trail running",
      "Corrida na esteira",
      "Caminhada",
      "Corrida com obstáculos (OCR)",
      "Marcha atlética",
    ],
  },
  {
    icon: "🚴",
    name: "Ciclismo",
    sports: [
      "Ciclismo de estrada",
      "Mountain bike (MTB)",
      "Ciclismo indoor / Spinning",
      "BMX / Urbano",
      "Cicloturismo",
      "Gravel",
    ],
  },
  {
    icon: "🏊",
    name: "Natação e Água",
    sports: [
      "Natação em piscina",
      "Natação em águas abertas",
      "Triathlon",
      "Remo",
      "Canoagem / Kayak",
      "Stand Up Paddle (SUP)",
    ],
  },
  {
    icon: "⚽",
    name: "Esportes Coletivos",
    sports: [
      "Futebol",
      "Futsal",
      "Basquete",
      "Vôlei / Vôlei de praia",
      "Handebol",
      "Rugby",
      "Futebol americano",
      "Hóquei",
    ],
  },
  {
    icon: "🎾",
    name: "Esportes de Raquete",
    sports: [
      "Tênis",
      "Padel",
      "Beach tennis",
      "Squash",
      "Badminton",
      "Pickleball",
      "Tênis de mesa",
    ],
  },
  {
    icon: "🥊",
    name: "Lutas e Artes Marciais",
    sports: [
      "Musculação / Ginástica",
      "CrossFit / HIIT",
      "Boxe / Muay Thai",
      "Jiu-jitsu / MMA",
      "Judô / Caratê",
      "Wrestling",
      "Esgrima",
    ],
  },
  {
    icon: "🧘",
    name: "Bem-estar e Mobilidade",
    sports: [
      "Yoga",
      "Pilates",
      "Alongamento / Mobilidade",
      "Meditação ativa",
      "Dança",
      "Ginástica artística",
    ],
  },
  {
    icon: "🏋️",
    name: "Força e Potência",
    sports: [
      "Musculação",
      "Powerlifting",
      "Weightlifting (Halterofilismo)",
      "Calistenia",
      "Treinamento funcional",
    ],
  },
  {
    icon: "🏔",
    name: "Aventura e Outdoor",
    sports: [
      "Trilha / Hiking",
      "Escalada",
      "Rapel",
      "Ski / Snowboard",
      "Surfe",
      "Kitesurf / Windsurf",
      "Parapente",
      "Parkour",
    ],
  },
  {
    icon: "🏇",
    name: "Outros Esportes",
    sports: ["Equitação", "Golfe", "Boliche", "Patinação", "Esports físicos", "Outro"],
  },
];

const recentSports = ["Corrida de rua", "Musculação", "Ciclismo de estrada"];

function TreinoPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [sport, setSport] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [target, setTarget] = useState("Livre");
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (stage !== "active" || paused) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, stage]);

  const distance = useMemo(() => {
    if (stage === "setup") return 0;
    const speed =
      sportType(sport) === "cycling" ? 0.0062 : sportType(sport) === "workout" ? 0 : 0.00285;
    return seconds * speed;
  }, [seconds, sport, stage]);

  const calories = estimarCalorias(sportType(sport), seconds || 1);
  const pace = distance > 0 ? seconds / 60 / distance : 0;
  const paceText =
    pace > 0
      ? `${Math.floor(pace)}'${String(Math.round((pace % 1) * 60)).padStart(2, "0")}”`
      : "--";

  const start = () => {
    if (!sport) return;
    setSeconds(0);
    setPaused(false);
    setStage("active");
  };

  const finish = () => {
    setPaused(true);
    setStage("finished");
  };

  const save = () => {
    salvarTreino({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      data: new Date().toISOString(),
      modalidade: sportType(sport),
      duracaoSeg: seconds,
      distanciaMetros: Math.round(distance * 1000),
      caloriasKcal: calories,
      ritmoMedio: paceText === "--" ? null : `${paceText}/km`,
      coordenadas: demoPath,
      analiseIA: note || "Treino salvo pelo Pulse Coach.",
    });
    toast.success("Atividade salva.");
    setStage("setup");
    setSeconds(0);
    setNote("");
  };

  return (
    <main className="screen-container bg-[#0A0A0A] pt-safe text-white">
      <AnimatePresence mode="wait" initial={false}>
      {stage === "setup" && (
        <motion.div key="setup" variants={stageVariants} initial="initial" animate="animate" exit="exit">
          <Header title="Treino de hoje" subtitle={new Date().toLocaleDateString("pt-BR")} />
          <section className="space-y-5">
            <CoachBriefing
              open={coachOpen}
              weekOpen={weekOpen}
              onToggle={() => setCoachOpen((current) => !current)}
              onWeekToggle={() => setWeekOpen((current) => !current)}
            />

            <div>
              <h2 className="mb-3 text-lg font-bold">Esporte</h2>
              <SportSelector
                selectedSport={sport}
                openCategory={openCategory}
                onOpenCategory={setOpenCategory}
                onSelect={(nextSport) => {
                  setSport(nextSport);
                  setOpenCategory(null);
                }}
              />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold">Configurações rápidas</h2>
              <div className="grid grid-cols-3 gap-2">
                {["Distância alvo", "Tempo alvo", "Livre"].map((item) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item}
                    onClick={() => setTarget(item)}
                    className={`min-h-12 rounded-xl border px-2 text-xs font-bold ${
                      target === item
                        ? "border-[#C8FF00] bg-[#C8FF00] text-black"
                        : "border-white/[0.08] bg-[#1A1A1A] text-[#888888]"
                    }`}
                  >
                    {item}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={start}
              disabled={!sport}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-black ${
                sport ? "bg-[#C8FF00] text-black" : "bg-[#333333] text-[#555555]"
              }`}
            >
              <Play className="h-5 w-5 fill-current" /> INICIAR TREINO
            </motion.button>
          </section>
        </motion.div>
      )}

      {stage === "active" && (
        <motion.div key="active" variants={stageVariants} initial="initial" animate="animate" exit="exit">
          <Header title="Treino ativo" subtitle={paused ? "Pausado" : "Gravando agora"} />
          <MapStage active={!paused} />
          <section className="mt-5 grid grid-cols-3 gap-3">
            <LiveMetric label="Tempo" value={fmtDuracao(seconds)} />
            <LiveMetric label="Distância" value={`${distance.toFixed(2)} km`} />
            <LiveMetric label="Pace atual" value={`${paceText}/km`} />
          </section>
          <section className="mt-6 grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPaused((current) => !current)}
              className={`flex h-14 items-center justify-center gap-2 rounded-xl text-sm font-black ${
                paused ? "bg-[#C8FF00] text-black" : "bg-[#ff9900] text-black"
              }`}
            >
              {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5" />}
              {paused ? "RETOMAR" : "PAUSAR"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={finish}
              className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#ff4466] text-sm font-black text-white"
            >
              <Square className="h-5 w-5 fill-current" /> ENCERRAR
            </motion.button>
          </section>
        </motion.div>
      )}

      {stage === "finished" && (
        <motion.div key="finished" variants={stageVariants} initial="initial" animate="animate" exit="exit">
          <Header title="Treino concluído! 🎉" subtitle="Resumo pronto para salvar" />
          <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
            <div className="mb-4 inline-flex rounded-md bg-[#1A2A00] px-3 py-1 text-sm font-bold text-[#C8FF00]">
              {distance > 5 || seconds > 2400 ? "Excelente" : "Muito bom"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Distância" value={`${distance.toFixed(2)} km`} />
              <MiniStat label="Tempo" value={fmtDuracao(seconds)} />
              <MiniStat label="Pace médio" value={`${paceText}/km`} />
              <MiniStat label="Calorias" value={`${calories}`} />
            </div>
          </section>
          <div className="mt-5">
            <MapStage active={false} withRoute />
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Como foi o treino? Adicione uma nota..."
            className="mt-5 min-h-[112px] w-full resize-none rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4 text-white outline-none placeholder:text-[#888888]"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={save}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF00] text-sm font-black text-black"
          >
            <Save className="h-5 w-5" /> Salvar atividade
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStage("setup")}
            className="mt-3 h-12 w-full rounded-xl text-sm font-bold text-[#888888]"
          >
            Descartar
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="pt-7 pb-6">
      <h1 className="text-2xl font-bold tracking-[-0.3px]">{title}</h1>
      <p className="mt-1 text-[15px] text-[#888888]">{subtitle}</p>
    </header>
  );
}

function CoachBriefing({
  open,
  weekOpen,
  onToggle,
  onWeekToggle,
}: {
  open: boolean;
  weekOpen: boolean;
  onToggle: () => void;
  onWeekToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-white/[0.06] border-l-[#C8FF00] border-l-[3px] bg-[#1A1A1A] p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#C8FF00]">
            ✦ PULSE COACH
          </div>
          <h2 className="mt-2 truncate text-lg font-bold">
            Ritmo controlado para evoluir sem quebrar.
          </h2>
        </div>
        {open ? (
          <ChevronLeft className="mt-4 h-5 w-5 shrink-0 text-[#C8FF00]" />
        ) : (
          <ChevronRight className="mt-4 h-5 w-5 shrink-0 text-[#C8FF00]" />
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-4" onClick={(event) => event.stopPropagation()}>
          <p className="text-[15px] leading-relaxed text-[#888888]">
            Hoje o foco é consistência: aquecimento leve, bloco principal confortável e final
            progressivo. Se a perna pesar, mantenha a zona 2 e preserve a sequência.
          </p>
          <div>
            <div className="mb-2 text-sm font-bold text-white">Plano de hoje</div>
            <div className="grid grid-cols-3 gap-2">
              <CoachMetric label="Distância" value="6 km" />
              <CoachMetric label="Tempo" value="35min" />
              <CoachMetric label="Intensidade" value="Moderada" />
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-white">Análise da semana</div>
            <ul className="space-y-2 text-sm text-[#888888]">
              <li>✓ 5 dias consecutivos de treino</li>
              <li>⚠ Pace caiu 3% — considere recuperação</li>
              <li>→ Foco: cadência acima de 175spm</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onWeekToggle}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#C8FF00] text-sm font-bold text-[#C8FF00]"
          >
            Ver plano completo de 7 dias <ChevronRight className="h-4 w-4" />
          </button>
          {weekOpen && <SevenDayPlan />}
        </div>
      )}
    </button>
  );
}

function CoachMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0A0A0A] p-3 text-center">
      <div className="truncate text-[10px] font-bold uppercase text-[#555555]">{label}</div>
      <div className="mt-2 truncate text-[16px] font-black text-[#C8FF00]">{value}</div>
    </div>
  );
}

function SevenDayPlan() {
  const plan = [
    ["Hoje", "Rodagem controlada", "6 km"],
    ["Ter", "Força e mobilidade", "35 min"],
    ["Qua", "Tiros curtos", "8 x 400m"],
    ["Qui", "Recuperação", ""],
    ["Sex", "Tempo run", "5 km"],
    ["Sáb", "Longão leve", "10 km"],
    ["Dom", "Recuperação", ""],
  ];
  return (
    <div className="space-y-2">
      {plan.map(([day, type, metric], index) => {
        const today = index === 0;
        const rest = type === "Recuperação";
        return (
          <div
            key={day}
            className={`rounded-xl border border-white/[0.06] p-3 ${
              today ? "border-l-[3px] border-l-[#C8FF00] bg-[#C8FF0011]" : "bg-[#0A0A0A]"
            } ${index > 0 ? "opacity-70" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-white">{day}</div>
                <div className={rest ? "text-sm text-[#555555]" : "text-sm text-[#888888]"}>
                  {type}
                </div>
              </div>
              {metric && <div className="text-sm font-bold text-[#C8FF00]">{metric}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SportSelector({
  selectedSport,
  openCategory,
  onOpenCategory,
  onSelect,
}: {
  selectedSport: string;
  openCategory: string | null;
  onOpenCategory: (category: string | null) => void;
  onSelect: (sport: string) => void;
}) {
  const category = sportCategories.find((item) => item.name === openCategory);
  if (category) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenCategory(null)}
            className="flex h-10 items-center gap-1 text-sm font-bold text-[#C8FF00]"
          >
            <ChevronLeft className="h-4 w-4" /> voltar
          </button>
          <div className="min-w-0 truncate font-bold">{category.name}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {category.sports.map((sport) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={sport}
              type="button"
              onClick={() => onSelect(sport)}
              className={`min-h-11 rounded-xl px-3 text-sm font-bold ${
                selectedSport === sport
                  ? "bg-[#C8FF00] text-black"
                  : "border border-white/10 bg-[#1A1A1A] text-white"
              }`}
            >
              {sport}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <span className="flex h-9 shrink-0 items-center text-xs font-bold text-[#888888]">
          Recentes:
        </span>
        {recentSports.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => onSelect(sport)}
            className={`h-9 shrink-0 rounded-full border px-3 text-xs font-bold ${
              selectedSport === sport
                ? "border-[#C8FF00] bg-[#C8FF00] text-black"
                : "border-white/[0.08] bg-[#1A1A1A] text-[#888888]"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {sportCategories.map((categoryItem) => {
          const selectedInCategory = categoryItem.sports.includes(selectedSport);
          return (
            <button
              key={categoryItem.name}
              type="button"
              onClick={() => onOpenCategory(categoryItem.name)}
              className="flex w-full items-center gap-3 rounded-xl bg-[#1A1A1A] p-4 text-left"
            >
              <span className="text-2xl">{categoryItem.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-white">{categoryItem.name}</div>
                <div className="mt-1 truncate text-sm text-[#888888]">
                  {selectedInCategory ? (
                    <span className="text-[#C8FF00]">{selectedSport}</span>
                  ) : (
                    `${categoryItem.sports.length} esportes`
                  )}
                </div>
              </div>
              {selectedInCategory ? (
                <Check className="h-5 w-5 shrink-0 text-[#C8FF00]" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-[#888888]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="truncate text-[11px] text-[#888888]">{label}</div>
      <div className="mt-2 truncate text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function LiveMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-3 text-center">
      <Timer className="mx-auto h-5 w-5 text-[#C8FF00]" />
      <div className="mt-3 truncate text-lg font-bold">{value}</div>
      <div className="mt-1 truncate text-[11px] text-[#888888]">{label}</div>
    </div>
  );
}

function MapStage({ active, withRoute }: { active: boolean; withRoute?: boolean }) {
  return (
    <div className="relative h-[50vh] min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1A1A1A]">
      <svg viewBox="0 0 320 420" className="h-full w-full" preserveAspectRatio="none">
        <rect width="320" height="420" fill="#1A1A1A" />
        <path
          d="M0 70H320M0 140H320M0 210H320M0 280H320M0 350H320M70 0V420M140 0V420M210 0V420M280 0V420"
          stroke="rgba(255,255,255,0.06)"
        />
        {withRoute && (
          <path
            d="M58 332 L86 258 L132 276 L172 178 L232 144 L218 236 L266 306"
            fill="none"
            stroke="#C8FF00"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={`grid h-16 w-16 place-items-center rounded-full bg-[#C8FF0022] text-[#C8FF00] ${
            active ? "animate-pulse" : ""
          }`}
        >
          <MapPin className="h-8 w-8" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

function sportType(sport: string) {
  if (/ciclismo|bike|mtb|bmx|gravel|spinning/i.test(sport)) return "cycling";
  if (
    /musculação|crossfit|hiit|funcional|ginástica|powerlifting|weightlifting|calistenia/i.test(
      sport,
    )
  ) {
    return "workout";
  }
  if (/caminhada|hiking|trilha/i.test(sport)) return "walking";
  return "running";
}
