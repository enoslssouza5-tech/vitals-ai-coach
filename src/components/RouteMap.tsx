import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  pontos: [number, number][];
  className?: string;
}

export function RouteMap({ pontos, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const center: [number, number] = pontos[0] ?? [-23.5505, -46.6333];
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView(center, 16);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    lineRef.current = L.polyline([], {
      color: "#22d3a8",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      lineRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const line = lineRef.current;
    if (!map || !line || pontos.length === 0) return;
    line.setLatLngs(pontos);
    const last = pontos[pontos.length - 1];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(last, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#22d3a8",
        fillOpacity: 1,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(last);
    }
    map.setView(last, map.getZoom(), { animate: true });
  }, [pontos]);

  return <div ref={ref} className={className} style={{ width: "100%", height: "100%" }} />;
}
