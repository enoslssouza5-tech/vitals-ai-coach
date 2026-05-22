import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { HeroHeader } from "@/components/HeroHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { Counter } from "@/components/Counter";
import { InstallPwaCard } from "@/components/InstallPwaCard";
import { computeRecoveryScore, generateDailyInsights, getMockWeather, greetingByHour } from "@/lib/ai-insights";
import { Cloud, CloudRain, Sun, Wind, Droplets, Flame, Play, Sparkles, TrendingUp, ChevronRight, Bell } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: todayHealth } = useQuery({
    queryKey: ["health", "today", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).eq("date", today).maybeSingle();
      return data;
    },
  });

  const { data: weekActivities } = useQuery({
    queryKey: ["activities", "week", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 6);
      const { data } = await supabase.from("activities").select("*").eq("user_id", user!.id).gte("started_at", since.toISOString()).order("started_at", { ascending: true });
      return data ?? [];
    },
  });

  const weather = getMockWeather();
  const recovery = todayHealth?.recovery_score ?? computeRecoveryScore(todayHealth ?? {});
  const insights = generateDailyInsights({ health: todayHealth ?? {}, weather, recovery });

  const firstName = (profile?.full_name ?? user.user_metadata?.full_name ?? "Atleta").split(" ")[0];
  const greeting = `${greetingByHour()}, ${firstName}!`.toUpperCase();

  // Weekly aggregates
  const totalKm = Number(((weekActivities ?? []).reduce((s, a) => s + Number(a.distance_meters ?? 0), 0) / 1000).toFixed(1));
  const totalMin = Math.round((weekActivities ?? []).reduce((s, a) => s + Number(a.duration_seconds ?? 0), 0) / 60);
  const totalCal = (weekActivities ?? []).reduce((s, a) => s + (a.calories_burned ?? 0), 0);

  // Weekly bar data
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];
  const todayDate = new Date();
  const dayData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(todayDate); d.setDate(todayDate.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const km = ((weekActivities ?? []).filter((a) => a.started_at.slice(0, 10) === key)
      .reduce((s, a) => s + Number(a.distance_meters ?? 0), 0)) / 1000;
    return { day: days[d.getDay()], km, isToday: i === 6 };
  });
  const maxKm = Math.max(1, ...dayData.map((d) => d.km));

  const WeatherIcon = weather.condition.toLowerCase().includes("chuv") ? CloudRain
    : weather.condition.toLowerCase().includes("nubl") ? Cloud : Sun;

  // Staggered layout animation config
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div>
      {/* Hero Header with athletic reception layout (Uppercase left aligned + notification right aligned) */}
      <HeroHeader
        image="running"
        title={greeting}
        subtitle="VAMOS SUPERAR LIMITES HOJE?"
        right={
          <button className="icon-circle h-11 w-11 hover:scale-105 active:scale-95 transition relative">
            <Bell className="h-5 w-5 text-primary-light" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary-light glow-primary-sm" />
          </button>
        }
      />

      {/* Staggered Cards container */}
      <motion.div 
        className="px-5 space-y-4 pb-28 -mt-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* IA Recovery Card */}
        {/* TODO: trigger AuthModal for premium feature */}
        <motion.div 
          className="glass-card p-5 cursor-pointer select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          style={{ willChange: "transform" }}
        >
          <div className="flex items-start gap-4">
            <RecoveryRing score={recovery} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs text-primary-light font-bold mb-1 tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> IA SPORTS COACH
              </div>
              <p className="text-sm font-bold leading-snug">{insights.headline.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">{insights.recommendation}</p>
            </div>
          </div>
          {insights.alerts.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning font-semibold">
              ⚠️ {insights.alerts[0]}
            </div>
          )}
        </motion.div>

        {/* Clima Card */}
        <motion.div 
          className="glass-card p-5 cursor-pointer select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          style={{ willChange: "transform" }}
        >
          <div className="athletic-label tracking-widest text-[10px]">● CLIMA AGORA</div>
          
          <div className="flex items-end justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="scoreboard-value">
                <Counter to={weather.temp} />
              </span>
              <span className="text-xl font-black text-muted-foreground">°C</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-muted-foreground tracking-wider uppercase">{weather.condition}</span>
              <div className="icon-circle h-10 w-10 glow-primary-sm">
                <WeatherIcon className="h-5 w-5 text-primary-light" />
              </div>
            </div>
          </div>

          <div className="flex gap-5 mt-4 text-xs font-bold text-muted-foreground border-t border-border/20 pt-3">
            <span className="flex items-center gap-1.5"><Droplets className="h-4 w-4 text-primary-light" /> {weather.humidity}% UMIDADE</span>
            <span className="flex items-center gap-1.5"><Wind className="h-4 w-4 text-primary-light" /> 12 KM/H VENTO</span>
          </div>
        </motion.div>

        {/* Weekly summary with scoreboard numeric styles */}
        <motion.div 
          className="glass-card p-5 cursor-pointer select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          style={{ willChange: "transform" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="athletic-label tracking-widest text-[10px]">● VOLUME SEMANAL</div>
            {/* Shaking Streak indicator */}
            <motion.div 
              className="text-[10px] font-black text-primary-light tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full"
              animate={{ rotate: [-2, 2, -2, 2, 0] }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              🔥 ATLETA ATIVO
            </motion.div>
          </div>

          {/* Metrics scoreboards */}
          <div className="grid grid-cols-3 gap-4 mb-5 border-b border-border/20 pb-4">
            <div>
              <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">DISTÂNCIA</div>
              <div className="scoreboard-value text-2xl flex items-baseline">
                <Counter to={totalKm} decimals={1} />
                <span className="scoreboard-unit">km</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">TEMPO</div>
              <div className="scoreboard-value text-2xl flex items-baseline">
                <Counter to={totalMin} />
                <span className="scoreboard-unit">min</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">CALORIAS</div>
              <div className="scoreboard-value text-2xl flex items-baseline">
                <Counter to={totalCal} />
                <span className="scoreboard-unit">kcal</span>
              </div>
            </div>
          </div>

          {/* Staggered progress bars for weekly column */}
          <div className="flex items-end gap-2 h-16">
            {dayData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full rounded-md overflow-hidden flex-1 flex items-end" style={{ background: "oklch(0.22 0.04 250)" }}>
                  <motion.div 
                    className="w-full rounded-md"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.km / maxKm) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.3 + i * 0.05 }}
                    style={{
                      background: d.isToday
                        ? "linear-gradient(to top, var(--color-primary), var(--color-primary-light))"
                        : "oklch(0.45 0.12 250 / 0.5)",
                      boxShadow: d.isToday ? "0 0 12px oklch(0.72 0.18 250 / 0.4)" : "none"
                    }} 
                  />
                </div>
                <span className={`text-[10px] font-black ${d.isToday ? "text-primary-light" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan de Hoje - START WORKOUT pulsing button */}
        <motion.div 
          className="glass-card p-5 cursor-pointer select-none"
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          style={{ willChange: "transform" }}
        >
          <div className="athletic-label tracking-widest text-[10px]">● TREINO RECOMENDADO</div>
          <h3 className="text-xl font-black mt-2 tracking-tight">{insights.recommendation.split(":")[0] || "TREINO CARDIO"}</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-semibold">{insights.recommendation}</p>
          
          <div className="flex gap-4 mt-4 border-t border-border/10 pt-3 text-[10px] font-black text-muted-foreground">
            <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-primary-light" /> ~280 KCAL</span>
            <span className="flex items-center gap-1.5">⏱️ ~35 MINUTOS</span>
          </div>

          <Link to="/treino" className="block mt-5">
            {/* Pulsing Start button */}
            <motion.div 
              className="h-12 w-full rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs flex items-center justify-center gap-2"
              animate={{
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 0 12px oklch(0.62 0.20 250 / 0.4)",
                  "0 0 24px oklch(0.62 0.20 250 / 0.6)",
                  "0 0 12px oklch(0.62 0.20 250 / 0.4)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Play className="h-4 w-4 fill-current" /> START WORKOUT
            </motion.div>
          </Link>
        </motion.div>

        {/* Check-in Diário */}
        <motion.div 
          className="w-full"
          variants={cardVariants}
        >
          <Link to="/saude" className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition block">
            <div className="flex items-center gap-3">
              <div className="icon-circle h-10 w-10 glow-primary-sm">
                <TrendingUp className="h-5 w-5 text-primary-light" />
              </div>
              <div>
                <div className="font-black text-sm tracking-wide">MY PROGRESS & HEALTH</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">FAZER CHECK-IN DE RECUPERAÇÃO</div>
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
