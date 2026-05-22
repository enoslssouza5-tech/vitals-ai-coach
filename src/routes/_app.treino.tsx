import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import { getMockWeather } from "@/lib/ai-insights";
import { Cloud, Play, Droplets, Thermometer } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

const TYPES = [
  { key: "running", label: "Corrida", icon: "/images/mode-running.svg" },
  { key: "cycling", label: "Pedal", icon: "/images/mode-cycling.svg" },
  { key: "walking", label: "Caminhada", icon: "/images/mode-walking.svg" },
  { key: "hiking", label: "Trilha", icon: "/images/mode-hiking.svg" },
  { key: "workout", label: "Academia", icon: "/images/mode-workout.svg" },
] as const;

function TreinoPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("running");
  const weather = getMockWeather();

  const start = () => navigate({ to: "/treino-ativo", search: { type } });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div>
      <HeroHeader
        image={type === "cycling" ? "cycling" : "running"}
        title="INICIAR TREINO"
        subtitle="SELECIONE SUA PROXIMA CONQUISTA"
        height="34vh"
        top={
          <div className="workout-header-modes" role="listbox" aria-label="Modalidades de treino">
            {TYPES.map((t) => {
              const on = type === t.key;
              return (
                <motion.button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  whileTap={{ scale: 0.96 }}
                  className={`workout-header-mode ${on ? "workout-header-mode--active" : ""}`}
                  aria-label={t.label}
                  aria-selected={on}
                  role="option"
                >
                  <img src={t.icon} alt="" className="workout-header-mode__icon" loading="eager" />
                </motion.button>
              );
            })}
          </div>
        }
      />

      <motion.div
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
          className="glass-card p-5 select-none"
          style={{ willChange: "transform" }}
        >
          <div className="athletic-label tracking-widest text-[10px] mb-4">CONDICOES AMBIENTAIS</div>

          <div className="grid grid-cols-3 gap-2 text-center items-center">
            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Thermometer className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-2xl font-black num">{weather.temp}°</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">TEMP</div>
            </div>

            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Droplets className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-2xl font-black num">{weather.humidity}%</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">UMIDADE</div>
            </div>

            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Cloud className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-sm font-black tracking-wider uppercase">{weather.condition}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">CLIMA</div>
            </div>
          </div>

          {weather.rainSoon && (
            <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning font-semibold leading-relaxed">
              Risco de chuva nas proximas horas. Considere antecipar o treino.
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <motion.button
            onClick={start}
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-base flex items-center justify-center gap-3 cursor-pointer select-none"
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 16px oklch(0.62 0.20 250 / 0.4)",
                "0 0 32px oklch(0.62 0.20 250 / 0.7)",
                "0 0 16px oklch(0.62 0.20 250 / 0.4)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="h-5 w-5 fill-current" /> START WORKOUT
          </motion.button>
        </motion.div>

        <p className="text-[10px] font-black text-center text-muted-foreground tracking-widest uppercase">
          Mantenha o dispositivo proximo. O GPS sera ativado para rastreamento.
        </p>
      </motion.div>
    </div>
  );
}
