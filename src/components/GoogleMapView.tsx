import { memo, useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  boundsFromPath,
  GOOGLE_MAPS_DARK_STYLE,
  hasGoogleMapsKey,
  loadGoogleMaps,
  simplifyPath,
  toLatLng,
  type LatLngTuple,
} from "@/lib/google-maps";

type MapMode = "hybrid" | "satellite" | "terrain" | "roadmap";

type MarkerKind = "start" | "end" | "current" | "km";

export type GoogleRouteMarker = {
  position: LatLngTuple;
  kind: MarkerKind;
  label?: string;
};

type Props = {
  paths?: LatLngTuple[][];
  markers?: GoogleRouteMarker[];
  className?: string;
  interactive?: boolean;
  followLastPoint?: boolean;
  fitToPath?: boolean;
  defaultZoom?: number;
  defaultCenter?: LatLngTuple;
  defaultMode?: MapMode;
  showControls?: boolean;
  opacity?: number;
  strokeWeight?: number;
  tilt?: number;
  heading?: number;
  ariaLabel?: string;
};

const modeOrder: MapMode[] = ["hybrid", "satellite", "terrain", "roadmap"];

export const GoogleMapView = memo(function GoogleMapView({
  paths = [],
  markers = [],
  className,
  interactive = true,
  followLastPoint = false,
  fitToPath = true,
  defaultZoom = 16,
  defaultCenter = [-23.5505, -46.6333],
  defaultMode = "hybrid",
  showControls = true,
  opacity = 0.95,
  strokeWeight = 5,
  tilt = 0,
  heading = 0,
  ariaLabel = "Mapa Google",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(!hasGoogleMapsKey());

  const simplifiedPaths = useMemo(
    () => paths.map((path) => simplifyPath(path).filter(Boolean)),
    [paths],
  );
  const flatPath = useMemo(() => simplifiedPaths.flat(), [simplifiedPaths]);

  useEffect(() => {
    if (!hostRef.current || mapRef.current || error) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        const center = flatPath[0] ?? defaultCenter;
        mapRef.current = new google.maps.Map(hostRef.current, {
          center: toLatLng(center),
          zoom: defaultZoom,
          mapTypeId: mode,
          styles: mode === "roadmap" ? GOOGLE_MAPS_DARK_STYLE : undefined,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: interactive ? "greedy" : "none",
          draggable: interactive,
          scrollwheel: interactive,
          disableDoubleClickZoom: !interactive,
          keyboardShortcuts: interactive,
          minZoom: 10,
          maxZoom: 20,
          tilt,
          heading,
        });
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
    };
  }, [defaultCenter, defaultZoom, error, flatPath, heading, interactive, mode, tilt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setMapTypeId(mode);
    map.setOptions({
      styles: mode === "roadmap" ? GOOGLE_MAPS_DARK_STYLE : undefined,
      gestureHandling: interactive ? "greedy" : "none",
      draggable: interactive,
      scrollwheel: interactive,
      disableDoubleClickZoom: !interactive,
      keyboardShortcuts: interactive,
      tilt,
      heading,
    });
  }, [heading, interactive, mode, tilt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    polylinesRef.current.forEach((line) => line.setMap(null));
    polylinesRef.current = simplifiedPaths
      .filter((path) => path.length >= 2)
      .map(
        (path) =>
          new google.maps.Polyline({
            map,
            path: path.map(toLatLng),
            strokeColor: "#00ff88",
            strokeOpacity: opacity,
            strokeWeight,
            geodesic: true,
          }),
      );

    if (flatPath.length > 1 && fitToPath) {
      map.fitBounds(boundsFromPath(flatPath), 40);
    } else if (flatPath.length && followLastPoint) {
      map.panTo(toLatLng(flatPath[flatPath.length - 1]));
      map.setZoom(defaultZoom);
    }
  }, [
    defaultZoom,
    fitToPath,
    flatPath,
    followLastPoint,
    opacity,
    ready,
    simplifiedPaths,
    strokeWeight,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = markers.map((marker) => {
      const pin = new google.maps.Marker({
        map,
        position: toLatLng(marker.position),
        label:
          marker.kind === "km"
            ? {
                text: marker.label ?? "",
                color: "#0B1023",
                fontSize: "11px",
                fontWeight: "900",
              }
            : undefined,
        icon: markerIcon(marker.kind),
        clickable: false,
      });
      return pin;
    });
  }, [markers, ready]);

  const centerOnLast = () => {
    const map = mapRef.current;
    const last = flatPath[flatPath.length - 1];
    if (!map || !last) return;
    map.panTo(toLatLng(last));
    map.setZoom(defaultZoom);
    map.setTilt(tilt);
    map.setHeading(heading);
  };

  const cycleMode = () => {
    setMode((current) => modeOrder[(modeOrder.indexOf(current) + 1) % modeOrder.length]);
  };

  if (error) {
    return (
      <div
        className={`relative overflow-hidden bg-[#1A1A1A] ${className ?? ""}`}
        aria-label={ariaLabel}
      >
        <FallbackRoute paths={simplifiedPaths} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} aria-label={ariaLabel}>
      <div ref={hostRef} className="h-full w-full" />
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={cycleMode}
            className="h-10 px-3 rounded-full bg-background/85 border border-border/70 text-[9px] font-black tracking-widest uppercase text-foreground"
            aria-label="Alternar tipo do Google Maps"
          >
            {mode === "roadmap" ? "dark" : mode}
          </button>
          <button
            type="button"
            onClick={centerOnLast}
            className="h-10 w-10 rounded-full bg-background/85 border border-border/70 text-[13px] font-black text-foreground"
            aria-label="Centralizar mapa na posicao atual"
          >
            ◎
          </button>
        </div>
      )}
    </div>
  );
});

function markerIcon(kind: MarkerKind): google.maps.Symbol {
  const fillColor =
    kind === "end"
      ? "#ffffff"
      : kind === "km"
        ? "#00ccff"
        : kind === "current"
          ? "#00ff88"
          : "#00ff88";
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor,
    fillOpacity: kind === "current" ? 0.95 : 1,
    scale: kind === "km" ? 10 : kind === "current" ? 8 : 7,
    strokeColor: kind === "end" ? "#00ff88" : "#0B1023",
    strokeWeight: 2,
  };
}

function FallbackRoute({ paths }: { paths: LatLngTuple[][] }) {
  const path = paths[0] ?? [];
  const points = path.length
    ? path.map((_, index) => {
        const x = 8 + (index / Math.max(1, path.length - 1)) * 84;
        const y = 72 - ((index % 5) / 4) * 44 - (index % 2) * 10;
        return `${x},${y}`;
      })
    : ["8,66", "28,28", "50,56", "72,24", "92,42"];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-[#1A1A1A]">
      <svg
        viewBox="0 0 100 80"
        className="absolute inset-0 h-full w-full opacity-80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect width="100" height="80" fill="#1A1A1A" />
        <path
          d="M0 20H100M0 40H100M0 60H100M20 0V80M40 0V80M60 0V80M80 0V80"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
        {path.length >= 2 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#C8FF00"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {!path.length && (
        <div className="absolute inset-0 grid place-items-center">
          <MapPin className="h-8 w-8 text-[#333333]" strokeWidth={1.7} />
        </div>
      )}
    </div>
  );
}
