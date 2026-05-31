import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { AppScreen, DesignCard, PageActionHeader, SectionTitle } from "@/components/PulseUI";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/historico")({ component: Historico });

type ActivityRecord = {
  id: string;
  type?: string | null;
  title?: string | null;
  started_at: string;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  ai_insights?: string | null;
};

function Historico() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", "all", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(50);
      return (data ?? []) as ActivityRecord[];
    },
  });

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atividade removida.");
    setSelectedActivity(null);
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  return (
    <AppScreen>
      <PageActionHeader title="Atividades" />
      <DesignCard>
        <SectionTitle title="Atividades registradas" />
        {isLoading && (
          <p className="py-8 text-center text-sm text-[#888888]">Avaliando sua semana...</p>
        )}
        {!isLoading && (activities?.length ?? 0) === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-[#888888]">Nenhuma atividade registrada ainda.</p>
            <Link
              to="/treino"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-[#C8FF00] px-5 text-sm font-black text-black"
            >
              INICIAR TREINO
            </Link>
          </div>
        )}
        <div className="divide-y divide-white/[0.06]">
          {activities?.map((activity) => {
            const km = (Number(activity.distance_meters ?? 0) / 1000).toFixed(2);
            const min = Math.round((activity.duration_seconds ?? 0) / 60);
            return (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-lg font-bold text-white">
                    {activity.title ?? activity.type}
                  </div>
                  <div className="mt-1 text-sm text-[#888888]">
                    {new Date(activity.started_at).toLocaleDateString("pt-BR")} • {min} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{km}</div>
                  <div className="text-sm text-[#888888]">km</div>
                </div>
              </button>
            );
          })}
        </div>
      </DesignCard>

      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-5"
          onClick={() => setSelectedActivity(null)}
        >
          <div className="pulse-card w-full p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 text-lg font-bold text-white">
              {selectedActivity.title ?? selectedActivity.type}
            </div>
            <div className="space-y-2">
              <Action
                icon={<Share2 className="h-4 w-4" />}
                text="Compartilhar atividade"
                onClick={() => toast.info("Compartilhando atividade...")}
              />
              <Action
                icon={<Eye className="h-4 w-4" />}
                text="Ver insights do coach"
                onClick={() => toast.info(selectedActivity.ai_insights ?? "Foco na resistência.")}
              />
              <Action
                icon={<Trash2 className="h-4 w-4" />}
                text="Excluir treino"
                danger
                onClick={() => deleteActivity(selectedActivity.id)}
              />
            </div>
          </div>
        </div>
      )}
    </AppScreen>
  );
}

function Action({
  icon,
  text,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-3 rounded-xl border border-white/[0.06] px-4 text-left text-sm font-bold ${
        danger ? "text-[#ff4d4d]" : "text-[#C8FF00]"
      }`}
    >
      {icon} {text}
    </button>
  );
}
