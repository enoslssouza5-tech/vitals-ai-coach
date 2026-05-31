import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityList,
  AppHeader,
  AppScreen,
  CoachButton,
  DesignCard,
  SectionTitle,
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
import {
  Calendar,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplets,
  Footprints,
  Info,
  Moon,
  Target,
  Sparkles,
  Sun,
  Thermometer,
  TrendingUp,
  Wind,
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

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

      <motion.div 
        className="space-y-5"
        variants={containerVariants}
        initial={false}
        animate="show"
      >
        <DesignCard variants={itemVariants} className="p-0 border-0 bg-transparent">
          <WeatherCard city={perfil.cidade || "São Paulo"} />
        </DesignCard>

        <DesignCard variants={itemVariants}>
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

        <DesignCard variants={itemVariants}>
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
          <DesignCard variants={itemVariants} className="py-4">
            <p className="text-sm text-[#888888]">
              Calor alto hoje: {clima.temp}°C. Hidrate-se antes do treino.
            </p>
          </DesignCard>
        )}

        <DesignCard variants={itemVariants}>
          <SectionTitle title="Atividades recentes" action="Ver todas" />
          <ActivityList treinos={treinos} showBadge limit={3} />
        </DesignCard>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <ReadinessCard score={78} />
          <WeeklyFocusCard currentKm={42.6} targetKm={50} />
        </motion.div>
      </motion.div>
    </AppScreen>
  );
}

function ReadinessCard({ score }: { score: number }) {
  const markers = [
    { label: "Sono", value: "7h20", icon: Moon },
    { label: "Recup.", value: "84%", icon: ActivityIcon },
  ];

  return (
    <DesignCard className="min-h-[216px] h-full">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            Prontidão <Info className="h-4 w-4 shrink-0 text-[#888888]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-[#555555]">
            Hoje
          </div>
        </div>
        <div className="rounded-full bg-[#1A2A00] px-2 py-1 text-[11px] font-bold text-[#C8FF00]">
          Bom
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="text-[36px] font-black leading-none text-[#C8FF00]">{score}</div>
        <div className="pb-1 text-xs font-semibold text-[#888888]">/100</div>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-[#888888]">
        Corpo pronto para rodagem moderada. Evite intensidade máxima hoje.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {markers.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-[#0A0A0A] p-2">
            <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
            <div className="mt-2 text-sm font-bold text-white">{value}</div>
            <div className="text-[11px] text-[#888888]">{label}</div>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

function WeeklyFocusCard({ currentKm, targetKm }: { currentKm: number; targetKm: number }) {
  const progress = Math.min(100, Math.round((currentKm / targetKm) * 100));
  const remaining = Math.max(0, targetKm - currentKm);

  return (
    <DesignCard className="min-h-[216px] h-full">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            Foco semanal <Info className="h-4 w-4 shrink-0 text-[#888888]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-[#555555]">
            Meta 50 km
          </div>
        </div>
        <Target className="h-5 w-5 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
      </div>

      <div className="flex items-end gap-1">
        <div className="text-[32px] font-black leading-none text-white">
          {currentKm.toFixed(1).replace(".", ",")}
        </div>
        <div className="pb-1 text-sm font-bold text-[#888888]">km</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#333333]">
        <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#888888]">
        <span>{progress}% concluído</span>
        <span>{remaining.toFixed(1).replace(".", ",")} km faltam</span>
      </div>

      <div className="mt-4 rounded-xl bg-[#0A0A0A] p-3">
        <div className="flex items-center gap-2 text-[13px] font-bold text-white">
          <Footprints className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
          Próximo treino
        </div>
        <div className="mt-1 text-xs leading-snug text-[#888888]">
          7 km leve para fechar a semana sem sobrecarga.
        </div>
      </div>
    </DesignCard>
  );
}

function ActivityIcon(props: React.ComponentProps<typeof TrendingUp>) {
  return <TrendingUp {...props} />;
}

type WeatherDay = {
  label: string;
  icon: string;
  max: number;
};

type WeatherState = {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  rain: number;
  condition: string;
  icon: string;
  forecast: WeatherDay[];
};

function WeatherCard({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const apiKey =
    import.meta.env.VITE_WEATHER_API_KEY ||
    import.meta.env.WEATHER_API_KEY ||
    import.meta.env.VITE_OPENWEATHER_API_KEY ||
    "";

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      if (!apiKey) {
        setLoading(false);
        return;
      }
      try {
        const coords = await getWeatherCoords(city);
        const params = new URLSearchParams({
          appid: apiKey,
          units: "metric",
          lang: "pt_br",
        });
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lon", String(coords.lon));
        } else {
          params.set("q", city);
        }
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
        );
        if (!currentResponse.ok) throw new Error("weather");
        const current = await currentResponse.json();

        const forecastParams = new URLSearchParams({
          appid: apiKey,
          units: "metric",
          lang: "pt_br",
        });
        if (coords) {
          forecastParams.set("lat", String(coords.lat));
          forecastParams.set("lon", String(coords.lon));
        } else {
          forecastParams.set("q", city);
        }
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?${forecastParams.toString()}`,
        );
        if (!forecastResponse.ok) throw new Error("forecast");
        const forecast = await forecastResponse.json();
        if (cancelled) return;
        setWeather({
          temp: Math.round(current.main?.temp ?? 0),
          feelsLike: Math.round(current.main?.feels_like ?? current.main?.temp ?? 0),
          humidity: Math.round(current.main?.humidity ?? 0),
          wind: Math.round((current.wind?.speed ?? 0) * 3.6),
          rain: Math.round(
            current.rain?.["1h"] ? Math.min(100, Number(current.rain["1h"]) * 25) : 0,
          ),
          condition: capitalize(current.weather?.[0]?.description ?? "Clima local"),
          icon: current.weather?.[0]?.main ?? "Clouds",
          forecast: buildForecast(forecast.list ?? []),
        });
      } catch {
        if (!cancelled) setWeather(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [apiKey, city]);

  const hasWeather = Boolean(weather);
  const recommendation = weather ? weatherRecommendation(weather.temp, weather.rain) : "";

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0A0A0A] text-[#C8FF00]">
          {hasWeather ? weatherIcon(weather.icon) : <Cloud className="h-7 w-7 text-[#333333]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-1">
            <span className="text-[36px] font-black leading-none text-white">
              {weather ? weather.temp : "--"}
            </span>
            <span className="pb-1 text-lg font-bold text-white">°C</span>
          </div>
          <p className="mt-1 truncate text-[13px] text-[#888888]">
            {weather
              ? weather.condition
              : loading
                ? "Buscando clima local..."
                : "Configure a API do clima nas variáveis de ambiente"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <WeatherInfo
          icon={<Thermometer />}
          label="Sensação"
          value={weather ? `${weather.feelsLike}°C` : "--"}
        />
        <WeatherInfo
          icon={<Droplets />}
          label="Umidade"
          value={weather ? `${weather.humidity}%` : "--"}
        />
        <WeatherInfo
          icon={<Wind />}
          label="Vento"
          value={weather ? `${weather.wind} km/h` : "--"}
        />
        <WeatherInfo
          icon={<CloudRain />}
          label="Chuva"
          value={weather ? `${weather.rain}%` : "--"}
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(weather?.forecast ?? fallbackForecast()).map((day, index) => (
          <div
            key={`${day.label}-${index}`}
            className={`min-w-[76px] rounded-xl border bg-[#0A0A0A] p-3 text-center ${
              index === 0 ? "border-[#C8FF00]" : "border-white/[0.06]"
            }`}
          >
            <div className="text-xs font-bold text-[#888888]">{day.label}</div>
            <div className="mt-2 flex justify-center text-[#C8FF00]">{weatherIcon(day.icon)}</div>
            <div className="mt-2 text-sm font-black text-white">
              {day.max ? `${day.max}°` : "--°"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-[#888888]">
        {weather
          ? recommendation
          : "Quando a API estiver configurada, o Pulse ajusta a recomendação ao clima local."}
      </div>
    </section>
  );
}

function WeatherInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#0A0A0A] p-2">
      <div className="flex justify-center text-[#555555] [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div className="mt-2 truncate text-center text-[10px] font-bold uppercase text-[#555555]">
        {label}
      </div>
      <div className="mt-1 truncate text-center text-[13px] font-bold text-white">{value}</div>
    </div>
  );
}

function weatherIcon(icon: string) {
  if (/rain|drizzle|thunder/i.test(icon))
    return <CloudRain className="h-6 w-6" strokeWidth={1.7} />;
  if (/clear|sun/i.test(icon)) return <Sun className="h-6 w-6" strokeWidth={1.7} />;
  return <Cloud className="h-6 w-6" strokeWidth={1.7} />;
}

function weatherRecommendation(temp: number, rain: number) {
  if (rain > 50) return "🌧 Chuva provável — Considere treino indoor";
  if (temp < 15) return "🧤 Frio — Vista camadas, ritmo mais lento no início";
  if (temp <= 25) return "✅ Clima ideal para treinar!";
  if (temp <= 32) return "☀️ Quente — Hidrate-se bem, reduza o pace";
  return "🌡 Muito quente — Prefira horários frescos";
}

function fallbackForecast(): WeatherDay[] {
  return ["Hoje", "Amanhã", "Depois", "Sexta"].map((label) => ({ label, icon: "Clouds", max: 0 }));
}

function buildForecast(
  list: Array<{
    dt_txt?: string;
    main?: { temp_max?: number };
    weather?: Array<{ main?: string }>;
  }>,
): WeatherDay[] {
  const byDay = new Map<string, WeatherDay>();
  list.forEach((item) => {
    if (!item.dt_txt) return;
    const date = new Date(item.dt_txt.replace(" ", "T"));
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const existing = byDay.get(key);
    const max = Math.round(item.main?.temp_max ?? 0);
    byDay.set(key, {
      label: byDay.size === 0 ? "Hoje" : capitalize(label),
      icon: item.weather?.[0]?.main ?? existing?.icon ?? "Clouds",
      max: Math.max(existing?.max ?? -99, max),
    });
  });
  return Array.from(byDay.values()).slice(0, 4);
}

function getWeatherCoords(city: string): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(cityCoords(city));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(cityCoords(city)),
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 1000 * 60 * 30 },
    );
  });
}

function cityCoords(city: string) {
  if (/rio/i.test(city)) return { lat: -22.9068, lon: -43.1729 };
  if (/belo/i.test(city)) return { lat: -19.9167, lon: -43.9345 };
  if (/curitiba/i.test(city)) return { lat: -25.4284, lon: -49.2733 };
  return { lat: -23.5505, lon: -46.6333 };
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
