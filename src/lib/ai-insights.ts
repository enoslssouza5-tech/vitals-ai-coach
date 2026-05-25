// Simulação do Pulse Coach baseada em regras (MVP sem custos de API)
export interface HealthSnapshot {
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  energy_level?: number | null;
  muscle_soreness?: number | null;
  recovery_score?: number | null;
}

export interface WeatherSnapshot {
  temp: number;
  humidity: number;
  condition: string;
  rainSoon?: boolean;
}

export function computeRecoveryScore(h: HealthSnapshot): number {
  let score = 75;
  if (h.sleep_hours != null) {
    if (h.sleep_hours >= 7.5) score += 12;
    else if (h.sleep_hours >= 6.5) score += 4;
    else if (h.sleep_hours < 5.5) score -= 18;
  }
  if (h.sleep_quality) score += (h.sleep_quality - 3) * 4;
  if (h.energy_level) score += (h.energy_level - 5) * 2;
  if (h.muscle_soreness) score -= (h.muscle_soreness - 3) * 3;
  return Math.max(10, Math.min(100, Math.round(score)));
}

export function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function generateDailyInsights(opts: {
  health: HealthSnapshot;
  weather: WeatherSnapshot;
  recovery: number;
  name?: string;
}): { headline: string; recommendation: string; alerts: string[] } {
  const { health, weather, recovery } = opts;
  const alerts: string[] = [];

  if (weather.temp > 32)
    alerts.push(`Temperatura elevada (${weather.temp}°C). Hidrate-se bem e reduza a intensidade.`);
  if (weather.humidity > 80)
    alerts.push("Umidade alta — esforço cardiovascular será maior que o usual.");
  if (weather.rainSoon)
    alerts.push("🌧️ Risco de chuva nas próximas horas. Treine agora ou após o ciclo.");

  let headline = "Dia equilibrado para treinar.";
  let recommendation = "Treino moderado de 30–45 min em Zona 2.";

  if (recovery >= 85) {
    headline = "Recuperação excelente — bom dia para intensidade.";
    recommendation = "Treino intervalado curto ou tempo run de 5–8 km.";
  } else if (recovery >= 70) {
    headline = "Recuperação boa — mantenha o ritmo.";
    recommendation = "Corrida leve a moderada de 4–6 km em Zona 2.";
  } else if (recovery >= 50) {
    headline = "Recuperação parcial — atenção ao volume.";
    recommendation = "Treino aeróbio leve de 25–35 min, sem intensidade.";
  } else {
    headline = "Recuperação baixa — priorize o descanso.";
    recommendation = "Descanso ativo: caminhada leve 20 min + alongamento.";
  }

  if (health.sleep_hours != null && health.sleep_hours < 6) {
    alerts.push("Sono abaixo do ideal nas últimas noites — reduza intensidade hoje.");
  }

  return { headline, recommendation, alerts };
}

// Mock weather (sem chamadas externas no MVP)
export function getMockWeather(): WeatherSnapshot {
  const variations: WeatherSnapshot[] = [
    { temp: 24, humidity: 65, condition: "Parcialmente nublado", rainSoon: true },
    { temp: 19, humidity: 72, condition: "Nublado" },
    { temp: 28, humidity: 55, condition: "Ensolarado" },
    { temp: 31, humidity: 78, condition: "Quente e úmido" },
  ];
  const idx = new Date().getDate() % variations.length;
  return variations[idx];
}
