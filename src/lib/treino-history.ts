export interface TreinoRegistro {
  id: string;
  data: string; // ISO
  modalidade: string;
  duracaoSeg: number;
  distanciaMetros: number;
  caloriasKcal: number;
  ritmoMedio?: string | null;
  fcMedia?: number | null;
  analiseIA?: string;
  coordenadas?: [number, number][];
}

const KEY = "pulse_treinos";

export function listarTreinos(): TreinoRegistro[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function salvarTreino(t: TreinoRegistro) {
  if (typeof window === "undefined") return;
  const atual = listarTreinos();
  atual.unshift(t);
  localStorage.setItem(KEY, JSON.stringify(atual.slice(0, 50)));
}

// MET aproximado por modalidade
const MET: Record<string, number> = {
  running: 9.8,
  cycling: 7.5,
  walking: 3.8,
  hiking: 6.0,
  workout: 6.0,
};

export function estimarCalorias(modalidade: string, duracaoSeg: number, pesoKg = 70): number {
  const met = MET[modalidade] ?? 6;
  const horas = duracaoSeg / 3600;
  return Math.round(met * pesoKg * horas);
}

export function fmtDuracao(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Haversine — distância entre dois pontos em metros
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const MODALIDADE_INFO: Record<
  string,
  { label: string; descricao: string; usaGPS: boolean; icon: string }
> = {
  running: {
    label: "Corrida",
    descricao: "Corrida livre — GPS ativado. Meta sugerida: 5 km em Zona 2.",
    usaGPS: true,
    icon: "/images/mode-running.svg",
  },
  cycling: {
    label: "Ciclismo",
    descricao: "Pedal livre — GPS ativado. Meta sugerida: 20 km, cadência constante.",
    usaGPS: true,
    icon: "/images/mode-cycling.svg",
  },
  walking: {
    label: "Caminhada",
    descricao: "Caminhada ativa — Passo moderado. Meta: 30 minutos contínuos.",
    usaGPS: true,
    icon: "/images/mode-walking.svg",
  },
  hiking: {
    label: "Trilha",
    descricao: "Trilha outdoor — GPS de alta precisão. Hidrate-se a cada 20 min.",
    usaGPS: true,
    icon: "/images/mode-hiking.svg",
  },
  workout: {
    label: "Funcional",
    descricao: "Treino funcional — Sem GPS. Cronômetro de séries ativado.",
    usaGPS: false,
    icon: "/images/mode-workout.svg",
  },
};
