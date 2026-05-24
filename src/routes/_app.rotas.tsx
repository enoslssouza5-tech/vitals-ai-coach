import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import { gerarTextoAnthropic } from "@/lib/anthropic-client";
import {
  formatarDataLonga,
  kmTreino,
  lerPerfil,
  lerRecuperacao,
  minutosMelhorados,
  nomeModalidade,
  obterClimaAtual,
  pontosDoTreino,
  rotasSimilares,
  type ClimaAtual,
  type Coordenada,
  type TreinoComRota,
} from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { Map, Navigation, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Polyline } from "leaflet";

export const Route = createFileRoute("/_app/rotas")({ component: Rotas });

function Rotas() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ L: typeof import("leaflet"); map: LeafletMap } | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const [selected, setSelected] = useState<TreinoComRota | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const perfil = useMemo(() => lerPerfil(), []);
  const recuperacao = useMemo(() => lerRecuperacao().at(-1), []);
  const treinos = useMemo(() => listarTreinos() as TreinoComRota[], []);
  const rotas = useMemo(
    () => treinos.filter((treino) => pontosDoTreino(treino).length >= 2),
    [treinos],
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    async function iniciarMapa() {
      if (!mapRef.current || leafletRef.current) return;
      const L = await import("leaflet");
      const centro = await obterCentroAtual();
      const map = L.map(mapRef.current, { zoomControl: false }).setView(centro, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      L.circleMarker(centro, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#22d3a8",
        fillOpacity: 1,
      }).addTo(map);
      leafletRef.current = { L, map };
      cleanup = () => map.remove();
    }
    iniciarMapa();
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    obterClimaAtual()
      .then(setClima)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selected || !leafletRef.current) return;
    const { L, map } = leafletRef.current;
    const pontos = pontosDoTreino(selected);
    if (lineRef.current) lineRef.current.remove();
    lineRef.current = L.polyline(pontos, {
      color: "#22d3a8",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);
    map.fitBounds(lineRef.current.getBounds(), { padding: [24, 24] });
  }, [selected]);

  const sugerirRota = async () => {
    setLoadingSuggestion(true);
    const mediaKm = treinos.length
      ? treinos.reduce((sum, t) => sum + kmTreino(t), 0) / treinos.length
      : 5;
    const fallback = `Rota ideal: ${Math.max(3, Math.round(mediaKm))} km em terreno plano.\nPrefira antes das 9h, com ritmo confortável.\nBoa escolha para evoluir sem pesar na recuperação.`;
    const texto = await gerarTextoAnthropic({
      system:
        "Você é um coach de corrida. Sugira uma rota em texto (sem coordenadas): distância ideal, tipo de terreno, horário recomendado e motivo. Máximo 4 linhas. Responda em português.",
      prompt: JSON.stringify({
        clima,
        recuperacao,
        modalidadePreferida: perfil.modalidadePreferida,
        mediaKm,
      }),
      fallback,
    });
    setSuggestion(texto);
    setLoadingSuggestion(false);
  };

  return (
    <div>
      <HeroHeader image="cycling" title="ROTAS" subtitle="SUAS DESCOBERTAS E MAPAS" height="30vh" />

      <motion.div
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10 select-none"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="glass-card overflow-hidden animate-fade-in" variants={cardVariants}>
          <div className="relative h-[60vh] min-h-[360px]">
            <div
              ref={mapRef}
              className="h-full w-full bg-card/50"
              aria-label="Mapa principal de rotas"
            />
            <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
              <button
                onClick={sugerirRota}
                disabled={loadingSuggestion}
                aria-label="Sugerir rota para hoje"
                className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />{" "}
                {loadingSuggestion ? "GERANDO..." : "SUGERIR ROTA PARA HOJE"}
              </button>
            </div>
            {suggestion && (
              <div className="absolute bottom-4 left-4 right-4 z-[400] glass-card p-4">
                <p className="text-xs font-bold leading-relaxed whitespace-pre-line">
                  {suggestion}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="glass-card p-5" variants={cardVariants}>
          <div className="athletic-label tracking-widest text-[10px] mb-4">Rotas salvas</div>
          {rotas.length === 0 ? (
            <div className="text-center py-8">
              <div className="icon-circle h-14 w-14 mx-auto mb-4 glow-primary-sm">
                <Map className="h-7 w-7 text-primary-light" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Nenhuma rota com coordenadas foi encontrada no histórico local. Quando houver
                treinos salvos com pontos GPS, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rotas.map((treino) => {
                const similares = rotasSimilares(treino, rotas);
                const ganho = minutosMelhorados(similares);
                return (
                  <button
                    key={treino.id}
                    onClick={() => setSelected(treino)}
                    className="w-full glass-card p-4 text-left active:scale-[0.98] transition animate-fade-in"
                    aria-label={`Ver rota de ${nomeModalidade(treino.modalidade)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase">
                          {nomeModalidade(treino.modalidade)}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                          {formatarDataLonga(treino.data)} · {kmTreino(treino).toFixed(2)} km
                        </p>
                      </div>
                      <Navigation className="h-5 w-5 text-primary-light" />
                    </div>
                    {ganho > 0 && (
                      <div className="mt-3 inline-flex rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-black text-primary-light">
                        📈 Você melhorou {ganho} min desde a primeira vez
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

async function obterCentroAtual(): Promise<Coordenada> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve([-23.5505, -46.6333]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => resolve([-23.5505, -46.6333]),
      { timeout: 5000, maximumAge: 600_000 },
    );
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
