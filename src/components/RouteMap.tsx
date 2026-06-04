import { memo, useMemo } from "react";
import { GoogleMapView, type GoogleRouteMarker } from "@/components/GoogleMapView";
import type { LatLngTuple } from "@/lib/google-maps";

interface Props {
  pontos: LatLngTuple[];
  className?: string;
  distanceMeters?: number;
  heading?: number;
  showMarkers?: boolean;
  darkMode?: boolean;
}

export const RouteMap = memo(function RouteMap({
  pontos,
  className,
  distanceMeters = 0,
  heading = 0,
  showMarkers = true,
  darkMode = false,
}: Props) {
  const markers = useMemo<GoogleRouteMarker[]>(() => {
    if (!showMarkers) return [];
    if (pontos.length === 0) return [];
    const completeKm = Math.floor(distanceMeters / 1000);
    const kmMarkers = Array.from({ length: completeKm })
      .map(
        (_, index) =>
          pontos[
            Math.min(
              pontos.length - 1,
              Math.round(((index + 1) / Math.max(1, completeKm + 1)) * (pontos.length - 1)),
            )
          ],
      )
      .filter(Boolean)
      .map((position, index) => ({
        position,
        kind: "km" as const,
        label: String(index + 1),
      }));

    return [
      { position: pontos[0], kind: "start" },
      ...kmMarkers,
      { position: pontos[pontos.length - 1], kind: "current" },
    ];
  }, [distanceMeters, pontos, showMarkers]);

  return (
    <GoogleMapView
      paths={[pontos]}
      markers={markers}
      className={className}
      followLastPoint
      fitToPath={false}
      defaultZoom={17}
      defaultMode={darkMode ? "roadmap" : "hybrid"}
      strokeWeight={5}
      tilt={darkMode ? 0 : 60}
      heading={heading}
      terrain={!darkMode}
      showControls={false}
      ariaLabel="Mapa do treino em tempo real"
    />
  );
});
