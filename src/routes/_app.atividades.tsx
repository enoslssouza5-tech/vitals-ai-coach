import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ActivityList,
  AppScreen,
  DesignCard,
  PageActionHeader,
  SectionTitle,
  WeeklySummary,
} from "@/components/PulseUI";
import { listarTreinos } from "@/lib/treino-history";

export const Route = createFileRoute("/_app/atividades")({ component: Atividades });

function Atividades() {
  const treinos = useMemo(() => listarTreinos(), []);
  return (
    <AppScreen>
      <PageActionHeader title="Atividades" />
      <div className="space-y-5">
        <DesignCard>
          <SectionTitle title="Esta semana" />
          <WeeklySummary showComparisons={false} />
        </DesignCard>
        <DesignCard>
          <SectionTitle title="Atividades recentes" action="Ver todas" />
          <ActivityList treinos={treinos} showBadge={false} limit={8} />
        </DesignCard>
      </div>
    </AppScreen>
  );
}
