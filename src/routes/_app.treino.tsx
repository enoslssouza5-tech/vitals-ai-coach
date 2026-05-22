import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import { useRealWeather } from "@/lib/weather";
import { MODALIDADE_INFO, listarTreinos, fmtDuracao, type TreinoRegistro } from "@/lib/treino-history";
import { Cloud, Play, Droplets, Thermometer, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/treino")({ component: TreinoPage });

const TYPES = ["running", "cycling", "walking", "hiking", "workout"] as const;
type TipoKey = (typeof TYPES)[number];

function TreinoPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<TipoKey>("running");
  const weather = useRealWeather();
  const [historico, setHistorico] = useState<TreinoRegistro[]>([]);

  useEffect(() => {
    setHistorico(listarTreinos().slice(0, 3));
  }, []);

  const info = MODALIDADE_INFO[type];
  const start = () => navigate({ to: "/treino-ativo", search: { type } });

  return (
    <div>
      <HeroHeader
        image={type === "cycling" ? "cycling" : "running"}
        title="INICIAR TREINO"
        subtitle="SELECIONE SUA PRÓXIMA CONQUISTA"
        height="34vh"
        top={
          <div className="workout-header-modes" role="listbox" aria-label="Modalidades de treino">
            {TYPES.map((k) => {
              const t = MODALIDADE_INFO[k];
              const on = type === k;
              return (
                <motion.button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.05 }}
                  className={`workout-header-mode ${on ? "workout-header-mode--active" : ""}`}
                  aria-label={`Selecionar modalidade ${t.label}`}
                  aria-selected={on}
                  role="option"
                  style={{ minWidth: 48, minHeight: 48 }}
                >
                  <img src={t.icon} alt="" className="workout-header-mode__icon" loading="eager" />
                </motion.button>
              );
            })}
          </div>
        }
      />

      <div className="px-5 space-y-5 pb-28 -mt-4 relative z-10">
        {/* Descrição dinâmica da modalidade */}
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-card p-4"
        >
          <div className="athletic-label tracking-widest text-[10px] mb-2">
            ● {info.label.toUpperCase()}
          </div>
          <p className="text-sm font-semibold leading-relaxed">{info.descricao}</p>
        </motion.div>

        {/* Clima real */}
        <div className="glass-card p-5 select-none">
          <div className="athletic-label tracking-widest text-[10px] mb-4">
            CONDIÇÕES AMBIENTAIS {weather.loading && "(carregando...)"}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center items-center">
            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Thermometer className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-2xl font-black num">{weather.loading ? "--" : `${weather.temp}°`}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">TEMP</div>
            </div>

            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Droplets className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-2xl font-black num">{weather.loading ? "--" : `${weather.humidity}%`}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">UMIDADE</div>
            </div>

            <div>
              <div className="icon-circle h-8 w-8 mx-auto mb-1.5 glow-primary-sm">
                <Cloud className="h-4 w-4 text-primary-light" />
              </div>
              <div className="text-sm font-black tracking-wider uppercase leading-tight">
                {weather.condition}
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase mt-0.5">CLIMA</div>
            </div>
          </div>

          {weather.rainSoon && (
            <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning font-semibold leading-relaxed">
              🌧️ Risco de chuva nas próximas horas. Considere antecipar o treino.
            </div>
          )}
          {weather.error && (
            <div className="mt-3 text-[10px] text-muted-foreground">
              Não foi possível obter o clima. Usando dados padrão.
            </div>
          )}
        </div>

        {/* Botão iniciar com pulso */}
        <div className="pt-2">
          <motion.button
            onClick={start}
            aria-label="Iniciar treino"
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-base flex items-center justify-center gap-3 cursor-pointer select-none"
            style={{ minHeight: 48 }}
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 16px oklch(0.62 0.20 250 / 0.4)",
                "0 0 32px oklch(0.62 0.20 250 / 0.7)",
                "0 0 16px oklch(0.62 0.20 250 / 0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="h-5 w-5 fill-current" /> INICIAR TREINO
          </motion.button>
        </div>

        <p className="text-[10px] font-black text-center text-muted-foreground tracking-widest uppercase">
          Mantenha o dispositivo próximo. O GPS será ativado para rastreamento.
        </p>

        {/* Últimos treinos */}
        {historico.length > 0 && (
          <div className="pt-4">
            <div className="athletic-label tracking-widest text-[10px] mb-3">● ÚLTIMOS TREINOS</div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
              {historico.map((t, idx) => {
                const info = MODALIDADE_INFO[t.modalidade] ?? MODALIDADE_INFO.running;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.35 }}
                    className="glass-card p-4 min-w-[180px] snap-start"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <img src={info.icon} alt="" className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {info.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-black uppercase">
                      {new Date(t.data).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-black font-mono">
                      <Clock className="h-3.5 w-3.5 text-primary-light" />
                      {fmtDuracao(t.duracaoSeg)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm font-black font-mono">
                      <MapPin className="h-3.5 w-3.5 text-primary-light" />
                      {(t.distanciaMetros / 1000).toFixed(2)} km
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
