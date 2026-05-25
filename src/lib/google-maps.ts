import { Loader } from "@googlemaps/js-api-loader";

export type LatLngTuple = [number, number];

export const GOOGLE_MAPS_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0B1023" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#aaaacc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B1023" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#243044" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d2016" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY || "";

let loader: Loader | null = null;
let googlePromise: Promise<typeof google> | null = null;

export function hasGoogleMapsKey() {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== "SUA_CHAVE_AQUI");
}

export function loadGoogleMaps() {
  if (!hasGoogleMapsKey()) {
    return Promise.reject(new Error("GOOGLE_MAPS_API_KEY ausente."));
  }
  if (!loader) {
    loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"],
    });
  }
  googlePromise ??= loader.load();
  return googlePromise;
}

export function toLatLng(point: LatLngTuple): google.maps.LatLngLiteral {
  return { lat: point[0], lng: point[1] };
}

export function boundsFromPath(path: LatLngTuple[]) {
  const bounds = new google.maps.LatLngBounds();
  path.forEach((point) => bounds.extend(toLatLng(point)));
  return bounds;
}

export function simplifyPath(points: LatLngTuple[], tolerance = 0.00005): LatLngTuple[] {
  if (points.length <= 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], first, last);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, index + 1), tolerance);
    const right = simplifyPath(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point: LatLngTuple, start: LatLngTuple, end: LatLngTuple) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

export async function snapToRoad(points: LatLngTuple[]) {
  if (!hasGoogleMapsKey() || points.length < 2) return points;
  const sampled = points.slice(-100);
  const path = sampled.map(([lat, lng]) => `${lat},${lng}`).join("|");
  const response = await fetch(
    `https://roads.googleapis.com/v1/snapToRoads?interpolate=true&path=${encodeURIComponent(path)}&key=${GOOGLE_MAPS_API_KEY}`,
  );
  if (!response.ok) return points;
  const json = await response.json();
  const snapped = json.snappedPoints?.map(
    (item: { location: { latitude: number; longitude: number } }) =>
      [item.location.latitude, item.location.longitude] as LatLngTuple,
  );
  return snapped?.length ? snapped : points;
}

export async function fetchElevation(points: LatLngTuple[]) {
  if (!hasGoogleMapsKey() || points.length < 2) return [];
  const simplified = simplifyPath(points, 0.0002).slice(0, 64);
  const locations = simplified.map(([lat, lng]) => `${lat},${lng}`).join("|");
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${encodeURIComponent(locations)}&key=${GOOGLE_MAPS_API_KEY}`,
  );
  if (!response.ok) return [];
  const json = await response.json();
  return (json.results ?? []).map((item: { elevation: number }) => Math.round(item.elevation));
}

export function openGoogleMapsDirections(points: LatLngTuple[]) {
  if (points.length < 2) return;
  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = simplifyPath(points, 0.0005)
    .slice(1, -1)
    .slice(0, 8)
    .map(([lat, lng]) => `${lat},${lng}`)
    .join("|");
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${origin[0]},${origin[1]}`);
  url.searchParams.set("destination", `${destination[0]},${destination[1]}`);
  if (waypoints) url.searchParams.set("waypoints", waypoints);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
