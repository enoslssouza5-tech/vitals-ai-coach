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
  Activity,
  Calendar,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplets,
  Footprints,
  Info,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Thermometer,
  TrendingUp,
  Wind,
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
};

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const fallbackBriefing =
    "Hoje pede controle: comece leve, mantenha ritmo sustentavel e termine com sobra. O treino bom e o que voce consegue repetir.";
  const [briefing, setBriefing] = useState(fallbackBriefing);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const perfil = useMemo(() => lerPerfil(), []);
  const recuperacao = useMemo(() => lerRecuperacao().at(-1), []);
  const treinos = useMemo(() => listarTreinos(), []);
  const firstName = (perfil.nome || "Atleta").split(" ")[0];

  useEffect(() => {
    let cancelled = false;
    async function carregarBriefing() {
      try {
        const climaAtual = await obterClimaAtual();
        if (cancelled) return;
        setClima(climaAtual);
        const texto = await gerarTextoAnthropic({
          system:
            "Voce e um coach esportivo. Gere uma recomendacao curta, especifica e humana em portugues. Use Pulse Coach, nunca use o termo IA.",
          prompt: JSON.stringify({ ultimoTreino: ultimoTreino(), recuperacao, clima: climaAtual }),
          fallback: fallbackBriefing,
          storageKey: `briefing-${dataISO(new Date())}`,
        });
        if (!cancelled) setBriefing(texto);
      } catch {
        if (!cancelled) setBriefing(fallbackBriefing);
      }
    }
    carregarBriefing();
    return () => {
      cancelled = true;
    };
  }, [fallbackBriefing, recuperacao]);

  return (
    <AppScreen>
      <AppHeader title={<>Bom dia, {firstName}</>} subtitle="Seu painel de evolucao esta pronto." />

      <motion.div className="space-y-4" variants={containerVariants} initial={false} animate="show">
        <DesignCard variants={itemVariants} className="border-[#C8FF00]/25">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#0A0A0A] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C8FF00]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
                Pulse Coach
              </div>
              <h2 className="max-w-[190px] text-[30px] font-black leading-[0.95] tracking-[-0.04em] text-white">
                Proximo nivel, sem quebrar.
              </h2>
            </div>
            <ReadinessRing value={82} />
          </div>

          <p className="text-[15px] leading-relaxed text-[#A0A0A0]">{briefing}</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <SignalMetric label="TSB" value="-4" status="ideal" />
            <SignalMetric label="Sono" value="7h20" status="ok" />
            <SignalMetric label="VITALs" value="78" status="bom" />
          </div>

          <div className="mt-5">
            <CoachButton>Ver treino recomendado</CoachButton>
          </div>
        </DesignCard>

        <DesignCard variants={itemVariants}>
          <SectionTitle
            title="Semana"
            icon={<Calendar className="h-5 w-5 text-[#C8FF00]" strokeWidth={1.5} />}
            action={
              <span className="flex items-center gap-1">
                Detalhes <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
          <WeeklySummary />
        </DesignCard>

        <DesignCard variants={itemVariants} className="p-0">
          <WeatherCard city={perfil.cidade || "Sao Paulo"} />
        </DesignCard>

        {clima && clima.temp > 30 && (
          <DesignCard variants={itemVariants} className="border-[#C8FF00]/20 py-4">
            <p className="text-sm leading-relaxed text-[#A0A0A0]">
              Calor alto hoje: {clima.temp} C. Hidrate-se antes do treino.
            </p>
          </DesignCard>
        )}

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <ReadinessCard score={78} />
          <WeeklyFocusCard currentKm={42.6} targetKm={50} />
        </motion.div>

        <DesignCard variants={itemVariants}>
          <SectionTitle title="Atividades" action="Ver todas" />
          <ActivityList treinos={treinos} showBadge limit={3} />
        </DesignCard>
      </motion.div>
    </AppScreen>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid h-[112px] w-[112px] shrink-0 place-items-center">
      <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#0A0A0A" strokeWidth="9" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#C8FF00"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (value / 100)} ${circumference}`}
        />
      </svg>
      <div className="text-center">
        <div className="text-[30px] font-black leading-none text-white">{value}%</div>
        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#888888]">
          Prep.
        </div>
      </div>
    </div>
  );
}

function SignalMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#555555]">
        {label}
      </div>
      <div className="mt-2 text-[20px] font-black leading-none text-white">{value}</div>
      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#C8FF00]">
        {status}
      </div>
    </div>
  );
}

function ReadinessCard({ score }: { score: number }) {
  const markers = [
    { label: "Sono", value: "7h20", icon: Moon },
    { label: "Recup.", value: "84%", icon: ActivityIcon },
  ];

  return (
    <DesignCard className="h-full min-h-[220px]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-black text-white">
            Prontidao <Info className="h-4 w-4 shrink-0 text-[#888888]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#555555]">
            Hoje
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
      </div>

      <div className="flex items-end gap-2">
        <div className="text-[36px] font-black leading-none text-[#C8FF00]">{score}</div>
        <div className="pb-1 text-xs font-black text-[#888888]">/100</div>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-[#888888]">
        Corpo pronto para rodagem moderada. Evite intensidade maxima hoje.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {markers.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-[#0A0A0A] p-2">
            <Icon className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
            <div className="mt-2 text-sm font-black text-white">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#888888]">
              {label}
            </div>
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
    <DesignCard className="h-full min-h-[220px]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-black text-white">
            Meta <Info className="h-4 w-4 shrink-0 text-[#888888]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#555555]">
            50 km
          </div>
        </div>
        <Target className="h-5 w-5 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
      </div>

      <div className="flex items-end gap-1">
        <div className="text-[32px] font-black leading-none text-white">
          {currentKm.toFixed(1).replace(".", ",")}
        </div>
        <div className="pb-1 text-sm font-black text-[#888888]">km</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#333333]">
        <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.08em] text-[#888888]">
        <span>{progress}%</span>
        <span>{remaining.toFixed(1).replace(".", ",")} km</span>
      </div>

      <div className="mt-4 rounded-2xl bg-[#0A0A0A] p-3">
        <div className="flex items-center gap-2 text-[13px] font-black text-white">
          <Footprints className="h-4 w-4 text-[#C8FF00]" strokeWidth={1.7} />
          Proximo
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
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C8FF00]">
            Clima inteligente
          </div>
          <p className="mt-2 text-[13px] text-[#888888]">{city}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0A0A0A] text-[#C8FF00]">
          {hasWeather ? weatherIcon(weather.icon) : <Cloud className="h-6 w-6 text-[#555555]" />}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-[36px] font-black leading-none text-white">
          {weather ? weather.temp : "--"}
        </span>
        <span className="pb-1 text-lg font-black text-white">C</span>
        <p className="min-w-0 flex-1 truncate pb-1 text-[13px] text-[#888888]">
          {weather
            ? weather.condition
            : loading
              ? "Preparando clima local..."
              : "Configure a API do clima nas variaveis de ambiente"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <WeatherInfo
          icon={<Thermometer />}
          label="Sens."
          value={weather ? `${weather.feelsLike} C` : "--"}
        />
        <WeatherInfo icon={<Droplets />} label="Umid." value={weather ? `${weather.humidity}%` : "--"} />
        <WeatherInfo icon={<Wind />} label="Vento" value={weather ? `${weather.wind}` : "--"} />
        <WeatherInfo icon={<CloudRain />} label="Chuva" value={weather ? `${weather.rain}%` : "--"} />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {(weather?.forecast ?? fallbackForecast()).map((day, index) => (
          <div
            key={`${day.label}-${index}`}
            className={`min-w-[76px] rounded-2xl border bg-[#0A0A0A] p-3 text-center ${
              index === 0 ? "border-[#C8FF00]" : "border-white/[0.06]"
            }`}
          >
            <div className="text-xs font-black text-[#888888]">{day.label}</div>
            <div className="mt-2 flex justify-center text-[#C8FF00]">{weatherIcon(day.icon)}</div>
            <div className="mt-2 text-sm font-black text-white">
              {day.max ? `${day.max} C` : "--"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-[#888888]">
        {weather
          ? recommendation
          : "Quando a API estiver configurada, o Pulse ajusta a recomendacao ao clima local."}
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
    <div className="min-w-0 rounded-2xl bg-[#0A0A0A] p-2">
      <div className="flex justify-center text-[#555555] [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div className="mt-2 truncate text-center text-[9px] font-black uppercase tracking-[0.08em] text-[#555555]">
        {label}
      </div>
      <div className="mt-1 truncate text-center text-[12px] font-black text-white">{value}</div>
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
  if (rain > 50) return "Chuva provavel - considere treino indoor.";
  if (temp < 15) return "Frio - vista camadas e comece em ritmo mais lento.";
  if (temp <= 25) return "Clima ideal para treinar.";
  if (temp <= 32) return "Quente - hidrate-se bem e reduza o pace.";
  return "Muito quente - prefira horarios mais frescos.";
}

function fallbackForecast(): WeatherDay[] {
  return ["Hoje", "Amanha", "Depois", "Sexta"].map((label) => ({ label, icon: "Clouds", max: 0 }));
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
