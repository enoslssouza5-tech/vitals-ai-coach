import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GoogleMapView } from "@/components/GoogleMapView";
import { AppScreen, DesignCard, PageActionHeader, SectionTitle } from "@/components/PulseUI";
import { demoPath } from "@/lib/pulse-design-data";
import { kmTreino, pontosDoTreino, type TreinoComRota } from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { MapPin, Navigation, Star, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rotas")({ component: Rotas });

const rotasVivas = [
  { nome: "Volta do Parque", distancia: "5,2 km", atletas: 18, tag: "Fácil" },
  { nome: "Subida Forte", distancia: "8,7 km", atletas: 9, tag: "Moderado" },
  { nome: "Longão de Domingo", distancia: "12,4 km", atletas: 14, tag: "Grupo" },
];

function Rotas() {
  const treinos = useMemo(() => listarTreinos() as TreinoComRota[], []);
  const rotas = useMemo(
    () => treinos.filter((treino) => pontosDoTreino(treino).length >= 2),
    [treinos],
  );
  const [selected, setSelected] = useState<TreinoComRota | null>(rotas[0] ?? null);
  const path = selected ? pontosDoTreino(selected) : demoPath;

  return (
    <AppScreen>
      <PageActionHeader title="Rotas" />

      <div className="space-y-5">
        <DesignCard className="overflow-hidden p-0">
          <GoogleMapView
            paths={[path]}
            markers={[
              { position: path[0], kind: "start" },
              { position: path[path.length - 1], kind: "end" },
            ]}
            className="h-[360px] bg-[#0A0A0A]"
            defaultMode="hybrid"
            strokeWeight={4}
            ariaLabel="Mapa de rotas"
          />
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Descobertas da comunidade" action="Ver todas" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {rotasVivas.map((rota) => (
              <button
                key={rota.nome}
                onClick={() => toast.success(`${rota.nome} selecionada.`)}
                className="min-w-[220px] rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-white">{rota.nome}</div>
                    <div className="mt-1 text-sm text-[#888888]">{rota.distancia}</div>
                  </div>
                  <span className="quality-badge">{rota.tag}</span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-[#888888]">
                  <Users className="h-4 w-4 text-[#C8FF00]" /> {rota.atletas} atletas hoje
                </div>
                <div className="mt-3 flex text-[#C8FF00]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Rotas salvas" />
          <div className="divide-y divide-white/[0.06]">
            {(rotas.length ? rotas : [null, null]).map((treino, index) => {
              const itemPath = treino ? pontosDoTreino(treino) : demoPath;
              return (
                <button
                  key={treino?.id ?? index}
                  onClick={() => treino && setSelected(treino)}
                  className="flex w-full items-center gap-4 py-4 text-left first:pt-0 last:pb-0"
                >
                  <GoogleMapView
                    paths={[itemPath]}
                    className="h-20 w-28 shrink-0 rounded-lg bg-[#0A0A0A]"
                    interactive={false}
                    showControls={false}
                    defaultMode="roadmap"
                    strokeWeight={3}
                    ariaLabel="Prévia da rota"
                  />
                  <div className="flex-1">
                    <div className="text-lg font-bold text-white">
                      {index === 0 ? "5km • Rodagem" : "10km • Longão"}
                    </div>
                    <div className="mt-1 text-sm text-[#888888]">
                      {treino
                        ? `${kmTreino(treino).toFixed(2)} km`
                        : index === 0
                          ? "5,02 km"
                          : "10,01 km"}
                    </div>
                  </div>
                  {index === 0 ? (
                    <Navigation className="h-5 w-5 text-[#C8FF00]" />
                  ) : (
                    <MapPin className="h-5 w-5 text-[#555555]" />
                  )}
                </button>
              );
            })}
          </div>
        </DesignCard>
      </div>
    </AppScreen>
  );
}
