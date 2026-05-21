import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Footprints, Bike, Dumbbell, MapPin, MountainSnow } from "lucide-react";

export const Route = createFileRoute("/_app/historico")({ component: Historico });

const ICONS: Record<string, any> = { running: Footprints, cycling: Bike, walking: MapPin, hiking: MountainSnow, workout: Dumbbell };

function Historico() {
  const { user } = useAuth();
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", "all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").eq("user_id", user!.id).order("started_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Histórico" subtitle="Suas atividades" />
      <div className="px-5 space-y-3 pb-6">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {!isLoading && (activities?.length ?? 0) === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Nenhuma atividade ainda. Que tal começar?</p>
            <Link to="/treino" className="inline-flex h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold items-center glow-primary-sm">
              Iniciar primeiro treino
            </Link>
          </div>
        )}
        {activities?.map((a) => {
          const Icon = ICONS[a.type] ?? Footprints;
          const d = new Date(a.started_at);
          const km = (Number(a.distance_meters ?? 0) / 1000).toFixed(2);
          const min = Math.round((a.duration_seconds ?? 0) / 60);
          return (
            <div key={a.id} className="glass-card p-4 flex items-center gap-4 animate-fade-in">
              <div className="h-12 w-12 rounded-xl bg-primary/15 grid place-items-center shrink-0">
                <Icon className="h-6 w-6 text-primary-light" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{a.title ?? a.type}</div>
                <div className="text-xs text-muted-foreground">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="text-right">
                <div className="font-bold num">{km}<span className="text-xs text-muted-foreground ml-0.5">km</span></div>
                <div className="text-xs text-muted-foreground num">{min} min</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
