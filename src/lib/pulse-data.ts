import {
  haversine,
  listarTreinos,
  MODALIDADE_INFO,
  type TreinoRegistro,
} from "@/lib/treino-history";

export type Coordenada = [number, number];

export type TreinoComRota = TreinoRegistro & {
  coordenadas?: Coordenada[];
  pontos?: Coordenada[];
  rota?: Coordenada[];
};

export type RecuperacaoDia = {
  data: string;
  sono: number;
  energia: number;
  dor: number;
  score: number;
};

export type PerfilPulse = {
  nome: string;
  cidade: string;
  peso: number;
  altura: number;
  objetivo: "emagrecer" | "performance" | "saude" | "provas";
  metaSemanalKm: number;
  modalidadePreferida: string;
};

export type ClimaAtual = {
  temp: number;
  humidity: number;
  condition: string;
  weathercode?: number;
};

const PERFIL_PADRAO: PerfilPulse = {
  nome: "Atleta Pulse",
  cidade: "",
  peso: 70,
  altura: 175,
  objetivo: "performance",
  metaSemanalKm: 20,
  modalidadePreferida: "running",
};

export function lerJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function salvarJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function lerPerfil(): PerfilPulse {
  return { ...PERFIL_PADRAO, ...lerJSON<Partial<PerfilPulse>>("pulse_perfil", {}) };
}

export function salvarPerfil(perfil: PerfilPulse) {
  salvarJSON("pulse_perfil", perfil);
}

export function lerRecuperacao(): RecuperacaoDia[] {
  const value = lerJSON<RecuperacaoDia | RecuperacaoDia[] | null>("pulse_recuperacao", null);
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function salvarRecuperacaoDia(dia: RecuperacaoDia) {
  const atual = lerRecuperacao().filter((item) => item.data !== dia.data);
  salvarJSON(
    "pulse_recuperacao",
    [...atual, dia].sort((a, b) => a.data.localeCompare(b.data)).slice(-60),
  );
}

export function ultimoTreino(): TreinoRegistro | null {
  return (
    listarTreinos().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0] ??
    null
  );
}

export function treinosDaSemana(treinos = listarTreinos()) {
  const inicio = inicioDaSemana(new Date());
  return treinos.filter((t) => new Date(t.data) >= inicio);
}

export function inicioDaSemana(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dataISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function kmTreino(t: TreinoRegistro) {
  return Number(t.distanciaMetros ?? 0) / 1000;
}

export function calcularStreak(treinos = listarTreinos()) {
  const dias = new Set(treinos.map((t) => dataISO(new Date(t.data))));
  let count = 0;
  const cursor = new Date();
  while (dias.has(dataISO(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function cargaTreinoDia(data: string, treinos = listarTreinos()) {
  const minutos = treinos
    .filter((t) => dataISO(new Date(t.data)) === data)
    .reduce((sum, t) => sum + Number(t.duracaoSeg ?? 0) / 60, 0);
  return Number((minutos / 10).toFixed(1));
}

export function formatarDataCurta(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
    new Date(value),
  );
}

export function formatarDataLonga(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function nomeModalidade(modalidade: string) {
  return MODALIDADE_INFO[modalidade]?.label ?? modalidade;
}

export function pontosDoTreino(treino: TreinoComRota): Coordenada[] {
  return treino.coordenadas ?? treino.pontos ?? treino.rota ?? [];
}

export function rotasSimilares(treino: TreinoComRota, todos: TreinoComRota[]) {
  const pontos = pontosDoTreino(treino);
  if (pontos.length < 2) return [];
  const inicio = pontos[0];
  const fim = pontos[pontos.length - 1];
  return todos.filter((outro) => {
    const p = pontosDoTreino(outro);
    if (p.length < 2) return false;
    return haversine(inicio, p[0]) <= 200 && haversine(fim, p[p.length - 1]) <= 200;
  });
}

export function minutosMelhorados(rotas: TreinoComRota[]) {
  const ordenadas = [...rotas].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  );
  if (ordenadas.length < 2) return 0;
  return Math.max(
    0,
    Math.round((ordenadas[0].duracaoSeg - ordenadas[ordenadas.length - 1].duracaoSeg) / 60),
  );
}

export async function obterClimaAtual(): Promise<ClimaAtual> {
  const coords = await new Promise<{ lat: number; lon: number }>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: -23.5505, lon: -46.6333 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: -23.5505, lon: -46.6333 }),
      { timeout: 5000, maximumAge: 600_000 },
    );
  });
  const openWeatherKey =
    import.meta.env.VITE_OPENWEATHER_API_KEY ||
    import.meta.env.VITE_WEATHER_API_KEY ||
    import.meta.env.WEATHER_API_KEY ||
    "";
  if (openWeatherKey) {
    const params = new URLSearchParams({
      appid: openWeatherKey,
      units: "metric",
      lang: "pt_br",
      lat: String(coords.lat),
      lon: String(coords.lon),
    });
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    );
    if (response.ok) {
      const json = await response.json();
      return {
        temp: Math.round(json.main?.temp ?? 24),
        humidity: Math.round(json.main?.humidity ?? 60),
        condition: json.weather?.[0]?.description ?? "Clima atual",
        weathercode: json.weather?.[0]?.id,
      };
    }
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weathercode`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível buscar o clima agora.");
  const json = await response.json();
  return {
    temp: Math.round(json.current?.temperature_2m ?? 24),
    humidity: Math.round(json.current?.relative_humidity_2m ?? 60),
    condition: "Clima atual",
    weathercode: json.current?.weathercode,
  };
}

export function diasAtras(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  return `${Math.round(hours / 24)} d atrás`;
}
