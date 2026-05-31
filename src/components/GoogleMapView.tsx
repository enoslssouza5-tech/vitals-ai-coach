import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Map } from "lucide-react";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MapboxMap,
  Marker as MapboxMarker,
} from "mapbox-gl";
import { simplifyPath, type LatLngTuple } from "@/lib/google-maps";

type MapMode = "hybrid" | "satellite" | "terrain" | "roadmap";
type MarkerKind = "start" | "end" | "current" | "km";
type LngLatTuple = [number, number];

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
  strokeColor?: string;
  strokeWeight?: number;
  tilt?: number;
  heading?: number;
  ariaLabel?: string;
  heatmap?: boolean;
  terrain?: boolean;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

let mapboxPromise: Promise<typeof import("mapbox-gl").default> | null = null;

async function loadMapbox() {
  mapboxPromise ??= Promise.all([
    import("mapbox-gl"),
    import("mapbox-gl/dist/mapbox-gl.css"),
  ]).then(([module]) => {
    module.default.accessToken = MAPBOX_TOKEN;
    return module.default;
  });
  return mapboxPromise;
}

export function hasMapboxToken() {
  return Boolean(MAPBOX_TOKEN);
}

export function simplifyCoords(coords: LatLngTuple[], maxPoints = 500) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  return coords.filter((_, index) => index % step === 0);
}

export function calculateDistance([lng1, lat1]: LngLatTuple, [lng2, lat2]: LngLatTuple) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  strokeColor = "#C8FF00",
  strokeWeight = 5,
  tilt = 0,
  heading = 0,
  ariaLabel = "Mapa",
  heatmap = false,
  terrain = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRefs = useRef<MapboxMarker[]>([]);
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(!hasMapboxToken());

  const simplifiedPaths = useMemo(
    () => paths.map((path) => simplifyCoords(simplifyPath(path).filter(Boolean))),
    [paths],
  );
  const flatPath = useMemo(() => simplifiedPaths.flat(), [simplifiedPaths]);
  const lastPoint = flatPath[flatPath.length - 1];

  useEffect(() => setMode(defaultMode), [defaultMode]);

  useEffect(() => {
    if (!hostRef.current || mapRef.current || error) return;
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !hostRef.current) return;
        const center = toLngLat(flatPath[0] ?? defaultCenter);
        mapRef.current = new mapboxgl.Map({
          container: hostRef.current,
          style: styleForMode(mode),
          center,
          zoom: defaultZoom,
          pitch: terrain || tilt > 0 ? Math.max(tilt, terrain ? 60 : 30) : 0,
          bearing: heading,
          antialias: true,
          attributionControl: false,
          interactive,
        });

        mapRef.current.on("load", () => {
          if (!mapRef.current) return;
          reinitializeLayers(mapRef.current, {
            paths: simplifiedPaths,
            strokeColor,
            strokeWeight,
            opacity,
            heatmap,
            terrain,
          });
          setReady(true);
        });
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(styleForMode(mode));
    map.once("style.load", () => {
      reinitializeLayers(map, {
        paths: simplifiedPaths,
        strokeColor,
        strokeWeight,
        opacity,
        heatmap,
        terrain,
      });
    });
  }, [heatmap, mode, opacity, ready, simplifiedPaths, strokeColor, strokeWeight, terrain]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    updateRouteSources(map, simplifiedPaths, heatmap);

    if (flatPath.length > 1 && fitToPath) {
      map.fitBounds(boundsFromPath(flatPath), { padding: 20, duration: 0, pitch: tilt || 30 });
    } else if (lastPoint && followLastPoint) {
      map.easeTo({
        center: toLngLat(lastPoint),
        bearing: heading,
        pitch: terrain ? 60 : tilt,
        zoom: defaultZoom,
        duration: 800,
        easing: (t) => t,
      });
    }
  }, [defaultZoom, fitToPath, flatPath, followLastPoint, heading, heatmap, lastPoint, ready, simplifiedPaths, terrain, tilt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];
    loadMapbox().then((mapboxgl) => {
      markerRefs.current = markers
        .filter((marker) => marker.position)
        .map((marker) =>
          new mapboxgl.Marker({ element: markerElement(marker), anchor: "center" })
            .setLngLat(toLngLat(marker.position))
            .addTo(map),
        );
    });
  }, [markers, ready]);

  useEffect(() => {
    const center = () => {
      const map = mapRef.current;
      if (!map || !lastPoint) return;
      map.easeTo({
        center: toLngLat(lastPoint),
        zoom: defaultZoom,
        pitch: terrain ? 60 : tilt,
        bearing: heading,
        duration: 600,
      });
    };
    window.addEventListener("pulse-map-center", center);
    return () => window.removeEventListener("pulse-map-center", center);
  }, [defaultZoom, heading, lastPoint, terrain, tilt]);

  if (error) {
    return <MapboxPlaceholder className={className} ariaLabel={ariaLabel} />;
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} aria-label={ariaLabel}>
      <div ref={hostRef} className="h-full w-full" />
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button type="button" onClick={() => setMode(toggleMode(mode))} className="mapbox-pill">
            <Map className="h-3.5 w-3.5" />
            {mode === "satellite" || mode === "hybrid" ? "Satelite" : "Mapa"}
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("pulse-map-center"))}
            className="mapbox-center"
            aria-label="Centralizar mapa na posicao atual"
          >
            <Crosshair className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
});

function reinitializeLayers(
  map: MapboxMap,
  options: {
    paths: LatLngTuple[][];
    strokeColor: string;
    strokeWeight: number;
    opacity: number;
    heatmap: boolean;
    terrain: boolean;
  },
) {
  if (!map.isStyleLoaded()) return;
  if (options.terrain) {
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: "mapbox-dem", exaggeration: options.heatmap ? 1.2 : 1.5 });
    if (!options.heatmap && !map.getLayer("3d-buildings")) {
      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#1E1E32",
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.85,
        },
      });
    }
  }

  const sourceId = options.heatmap ? "all-routes" : "route";
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data: routeData(options.paths, options.heatmap) });
  }

  if (options.heatmap) {
    if (!map.getLayer("heatmap-routes")) {
      map.addLayer({
        id: "heatmap-routes",
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#C8FF00", "line-width": 2, "line-opacity": 0.25 },
      });
    }
    return;
  }

  if (!map.getLayer("route-glow")) {
    map.addLayer({
      id: "route-glow",
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": options.strokeColor,
        "line-width": Math.max(8, options.strokeWeight * 2),
        "line-opacity": 0.25,
        "line-blur": 4,
      },
    });
  }
  if (!map.getLayer("route-line")) {
    map.addLayer({
      id: "route-line",
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": options.strokeColor,
        "line-width": options.strokeWeight,
        "line-opacity": options.opacity,
      },
    });
  }
}

function updateRouteSources(map: MapboxMap, paths: LatLngTuple[][], heatmap: boolean) {
  const source = map.getSource(heatmap ? "all-routes" : "route") as GeoJSONSource | undefined;
  source?.setData(routeData(paths, heatmap));
}

function routeData(paths: LatLngTuple[][], heatmap: boolean) {
  if (heatmap) {
    return {
      type: "FeatureCollection" as const,
      features: paths
        .filter((path) => path.length >= 2)
        .map((path) => ({
          type: "Feature" as const,
          properties: {},
          geometry: { type: "LineString" as const, coordinates: path.map(toLngLat) },
        })),
    };
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: (paths[0] ?? []).map(toLngLat),
    },
  };
}

function markerElement(marker: GoogleRouteMarker) {
  const el = document.createElement("div");
  if (marker.kind === "current") {
    el.className = "mapbox-position-dot";
    return el;
  }
  if (marker.kind === "km") {
    el.className = "mapbox-km-marker";
    el.textContent = marker.label ?? "";
    return el;
  }
  el.className = marker.kind === "end" ? "mapbox-end-marker" : "mapbox-start-marker";
  return el;
}

function MapboxPlaceholder({ className, ariaLabel }: { className?: string; ariaLabel: string }) {
  return (
    <div
      className={`grid place-items-center overflow-hidden bg-[#111111] ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      <div className="flex flex-col items-center gap-2">
        <Map className="h-8 w-8 text-[#333333]" strokeWidth={1.6} />
        <span className="text-[13px] font-semibold text-[#555555]">Mapa indisponível</span>
      </div>
    </div>
  );
}

function boundsFromPath(path: LatLngTuple[]): LngLatBoundsLike {
  const lngLats = path.map(toLngLat);
  const lngs = lngLats.map(([lng]) => lng);
  const lats = lngLats.map(([, lat]) => lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function toLngLat([lat, lng]: LatLngTuple): LngLatTuple {
  return [lng, lat];
}

function styleForMode(mode: MapMode) {
  return mode === "satellite" || mode === "hybrid" ? SATELLITE_STYLE : DARK_STYLE;
}

function toggleMode(mode: MapMode): MapMode {
  return mode === "satellite" || mode === "hybrid" ? "roadmap" : "satellite";
}
