import { demoPath } from "@/lib/pulse-design-data";
import type { LatLngTuple } from "@/lib/google-maps";

export type PulseActivity = {
  id: string;
  title: string;
  sport: string;
  date: string;
  distance: string;
  distanceKm: number;
  pace: string;
  time: string;
  calories: string;
  elevation: string;
  steps: string;
  quality: "Muito bom" | "Excelente";
  route: LatLngTuple[];
  splits: { km: number; time: string; pace: string }[];
  paceBars: number[];
};

function shiftedRoute(offset: number): LatLngTuple[] {
  return demoPath.map(([lat, lng], index) => [lat + offset + index * 0.00008, lng - offset]);
}

export const pulseActivities: PulseActivity[] = [
  {
    id: "rodagem-5k",
    title: "5km • Rodagem",
    sport: "Corrida",
    date: "Hoje • 07:15",
    distance: "5,02 km",
    distanceKm: 5.02,
    pace: "5'21” /km",
    time: "26:52",
    calories: "426",
    elevation: "48 m",
    steps: "6.812",
    quality: "Muito bom",
    route: shiftedRoute(0),
    splits: [
      { km: 1, time: "5:28", pace: "5'28”" },
      { km: 2, time: "5:23", pace: "5'23”" },
      { km: 3, time: "5:18", pace: "5'18”" },
      { km: 4, time: "5:21", pace: "5'21”" },
      { km: 5, time: "5:22", pace: "5'22”" },
    ],
    paceBars: [62, 68, 74, 70, 72],
  },
  {
    id: "longao-10k",
    title: "10km • Longão",
    sport: "Corrida",
    date: "Ontem • 06:48",
    distance: "10,01 km",
    distanceKm: 10.01,
    pace: "5'08” /km",
    time: "51:35",
    calories: "842",
    elevation: "96 m",
    steps: "13.420",
    quality: "Excelente",
    route: shiftedRoute(0.006),
    splits: [
      { km: 1, time: "5:16", pace: "5'16”" },
      { km: 2, time: "5:12", pace: "5'12”" },
      { km: 3, time: "5:06", pace: "5'06”" },
      { km: 4, time: "5:05", pace: "5'05”" },
      { km: 5, time: "5:03", pace: "5'03”" },
      { km: 6, time: "5:08", pace: "5'08”" },
    ],
    paceBars: [66, 70, 76, 78, 82, 74],
  },
  {
    id: "tempo-7k",
    title: "7km • Tempo Run",
    sport: "Corrida",
    date: "Sáb • 07:02",
    distance: "7,01 km",
    distanceKm: 7.01,
    pace: "4'58” /km",
    time: "34:42",
    calories: "588",
    elevation: "72 m",
    steps: "9.240",
    quality: "Muito bom",
    route: shiftedRoute(-0.004),
    splits: [
      { km: 1, time: "5:04", pace: "5'04”" },
      { km: 2, time: "4:59", pace: "4'59”" },
      { km: 3, time: "4:55", pace: "4'55”" },
      { km: 4, time: "4:57", pace: "4'57”" },
      { km: 5, time: "4:58", pace: "4'58”" },
    ],
    paceBars: [70, 76, 84, 80, 78],
  },
  {
    id: "bike-24k",
    title: "24km • Giro leve",
    sport: "Bike",
    date: "Qui • 18:20",
    distance: "24,40 km",
    distanceKm: 24.4,
    pace: "2'18” /km",
    time: "56:12",
    calories: "712",
    elevation: "184 m",
    steps: "0",
    quality: "Excelente",
    route: shiftedRoute(0.011),
    splits: [
      { km: 1, time: "2:24", pace: "2'24”" },
      { km: 2, time: "2:21", pace: "2'21”" },
      { km: 3, time: "2:16", pace: "2'16”" },
      { km: 4, time: "2:18", pace: "2'18”" },
    ],
    paceBars: [64, 68, 76, 72],
  },
  {
    id: "funcional-45",
    title: "45min • Funcional",
    sport: "Funcional",
    date: "Ter • 19:10",
    distance: "0,00 km",
    distanceKm: 0,
    pace: "--",
    time: "45:00",
    calories: "504",
    elevation: "0 m",
    steps: "1.240",
    quality: "Muito bom",
    route: [],
    splits: [
      { km: 1, time: "15:00", pace: "Bloco 1" },
      { km: 2, time: "15:00", pace: "Bloco 2" },
      { km: 3, time: "15:00", pace: "Bloco 3" },
    ],
    paceBars: [52, 74, 68],
  },
];

export const periodStats = {
  "Esta semana": ["42,6 km", "4h 32m", "5'22”", "2.896"],
  "Este mês": ["148,2 km", "15h 44m", "5'28”", "10.842"],
  "Este ano": ["1.284 km", "132h", "5'34”", "94.210"],
  Tudo: ["4.918 km", "512h", "5'41”", "356k"],
};

export const performanceSeries = {
  Distância: [
    { label: "Nov", value: 26 },
    { label: "Dez", value: 29 },
    { label: "Jan", value: 36 },
    { label: "Fev", value: 32 },
    { label: "Mar", value: 35 },
    { label: "Abr", value: 42.6 },
  ],
  Pace: [
    { label: "Nov", value: 6.02 },
    { label: "Dez", value: 5.55 },
    { label: "Jan", value: 5.42 },
    { label: "Fev", value: 5.38 },
    { label: "Mar", value: 5.31 },
    { label: "Abr", value: 5.22 },
  ],
  Tempo: [
    { label: "Nov", value: 168 },
    { label: "Dez", value: 184 },
    { label: "Jan", value: 226 },
    { label: "Fev", value: 212 },
    { label: "Mar", value: 238 },
    { label: "Abr", value: 272 },
  ],
  Calorias: [
    { label: "Nov", value: 1840 },
    { label: "Dez", value: 2110 },
    { label: "Jan", value: 2480 },
    { label: "Fev", value: 2310 },
    { label: "Mar", value: 2620 },
    { label: "Abr", value: 2896 },
  ],
};

export const followingAthletes = [
  { name: "Juliana Costa", city: "São Paulo, SP", km: "42,6 km", following: true },
  { name: "Pedro Henrique", city: "Rio de Janeiro, RJ", km: "38,1 km", following: true },
  { name: "Marcos Vinicius", city: "Belo Horizonte, MG", km: "31,8 km", following: true },
  { name: "Ana Ribeiro", city: "Curitiba, PR", km: "28,4 km", following: false },
];

export const clubs = [
  { name: "Pulse Runners SP", members: "2.481 membros", next: "Terça • 06:30", joined: true },
  { name: "Longão de Sábado", members: "842 membros", next: "Sábado • 05:50", joined: false },
  { name: "Zona 2 Club", members: "1.109 membros", next: "Quinta • 19:00", joined: false },
];

export const weeklyRanking = [
  { rank: 1, name: "Juliana Costa", km: "42,6 km" },
  { rank: 2, name: "Pedro Henrique", km: "38,1 km" },
  { rank: 3, name: "Lucas Martins", km: "34,7 km", me: true },
  { rank: 8, name: "Você", km: "24,2 km", me: true },
];
