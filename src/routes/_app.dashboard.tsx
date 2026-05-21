import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { computeRecoveryScore, generateDailyInsights, getMockWeather, greetingByHour } from "@/lib/ai-insights";
import { Cloud, CloudRain, Sun, Wind, Droplets, Flame, Play, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: todayHealth } = useQuery({
    queryKey: ["health", "today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).eq("date", today).maybeSingle();
      return data;
    },
  });

  const { data: weekActivities } = useQuery({
    queryKey: ["activities", "week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 6);
      const { data } = await supabase.from("activities").select("*").eq("user_id", user!.id).gte("started_at", since.toISOString()).order("started_at", { ascending: true });
      return data ?? [];
    },
  });

  const weather = getMockWeather();
  const recovery = todayHealth?.recovery_score ?? computeRecoveryScore(todayHealth ?? {});
  const insights = generateDailyInsights({ health: todayHealth ?? {}, weather, recovery });

  const firstName = (profile?.full_name ?? "atleta").split(" ")[0];

  // Weekly aggregates
  const totalKm = ((weekActivities ?? []).reduce((s, a) => s + Number(a.distance_meters ?? 0), 0) / 1000).toFixed(1);
  const totalMin = Math.round((weekActivities ?? []).reduce((s, a) => s + Number(a.duration_seconds ?? 0), 0) / 60);
  const totalCal = (weekActivities ?? []).reduce((s, a) => s + (a.calories_burned ?? 0), 0);

  // Weekly bar data
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];
  const today = new Date();
  const dayData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const km = ((weekActivities ?? []).filter((a) => a.started_at.slice(0, 10) === key)
      .reduce((s, a) => s + Number(a.distance_meters ?? 0), 0)) / 1000;
    return { day: days[d.getDay()], km, isToday: i === 6 };
  });
  const maxKm = Math.max(1, ...dayData.map((d) => d.km));

  const WeatherIcon = weather.condition.toLowerCase().includes("chuv") ? CloudRain
    : weather.condition.toLowerCase().includes("nubl") ? Cloud : Sun;

  return (
    <div>
      <PageHeader title={`${greetingByHour()}, ${firstName} 👋`} subtitle="Vamos treinar hoje?" />

      <div className="px-5 space-y-4 pb-6">
        {/* AI Recovery Card */}
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-start gap-4">
            <RecoveryRing score={recovery} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1">
                <Sparkles className="h-3.5 w-3.5" /> COACH IA
              </div>
              <p className="text-sm font-medium leading-snug">{insights.headline}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insights.recommendation}</p>
            </div>
          </div>
          {insights.alerts.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
              ⚠️ {insights.alerts[0]}
            </div>
          )}
        </div>

        {/* Weather */}
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Clima agora</div>
            <WeatherIcon className="h-5 w-5 text-primary-light" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold num">{weather.temp}°</span>
            <span className="text-sm text-muted-foreground mb-1.5">{weather.condition}</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {weather.humidity}% umidade</span>
            <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> 12 km/h</span>
          </div>
        </div>

        {/* Weekly summary */}
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Esta semana</h3>
            <span className="text-xs text-primary font-mono">🔥 streak</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div><div className="text-xl font-bold num">{totalKm}</div><div className="text-[10px] text-muted-foreground uppercase">km</div></div>
            <div><div className="text-xl font-bold num">{totalMin}</div><div className="text-[10px] text-muted-foreground uppercase">min</div></div>
            <div><div className="text-xl font-bold num">{totalCal}</div><div className="text-[10px] text-muted-foreground uppercase">kcal</div></div>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {dayData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-surface-2 rounded-md overflow-hidden flex-1 flex items-end">
                  <div className={`w-full rounded-md transition-all ${d.isToday ? "bg-primary glow-primary-sm" : "bg-primary/40"}`} style={{ height: `${(d.km / maxKm) * 100}%` }} />
                </div>
                <span className={`text-[10px] ${d.isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today plan */}
        <div className="glass-card p-5 animate-fade-in">
          <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Plano de hoje</div>
          <h3 className="text-lg font-bold">{insights.recommendation.split(":")[0] || "Treino recomendado"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{insights.recommendation}</p>
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5" /> ~280 kcal</div>
            <div className="text-xs text-muted-foreground">~35 min</div>
          </div>
          <Link to="/treino" className="mt-4 h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-primary-sm">
            <Play className="h-4 w-4 fill-current" /> Iniciar treino
          </Link>
        </div>

        {/* Insights */}
        <Link to="/saude" className="glass-card p-4 flex items-center justify-between animate-fade-in active:scale-[0.99] transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center">
              <TrendingUp className="h-5 w-5 text-primary-light" />
            </div>
            <div>
              <div className="font-semibold text-sm">Recuperação e saúde</div>
              <div className="text-xs text-muted-foreground">Faça seu check-in diário</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
