import { useEffect, useState } from "react";

export interface RealWeather {
  temp: number;
  humidity: number;
  condition: string;
  rainSoon: boolean;
  loading: boolean;
  error: string | null;
}

const SP_COORDS = { lat: -23.5505, lon: -46.6333 };

// Open-Meteo WMO weather codes -> rótulo PT
function codeToCondition(code: number): { label: string; rainSoon: boolean } {
  if (code === 0) return { label: "Ensolarado", rainSoon: false };
  if ([1, 2].includes(code)) return { label: "Parcialmente nublado", rainSoon: false };
  if (code === 3) return { label: "Nublado", rainSoon: false };
  if ([45, 48].includes(code)) return { label: "Neblina", rainSoon: false };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Garoa", rainSoon: true };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Chuva", rainSoon: true };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Neve", rainSoon: true };
  if ([95, 96, 99].includes(code)) return { label: "Tempestade", rainSoon: true };
  return { label: "Indefinido", rainSoon: false };
}

async function fetchWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=precipitation_probability&forecast_hours=3&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Open-Meteo error");
  const j = await r.json();
  const code = j?.current?.weather_code ?? 0;
  const { label, rainSoon } = codeToCondition(code);
  const probs: number[] = j?.hourly?.precipitation_probability ?? [];
  const willRain = probs.slice(0, 3).some((p) => p >= 50);
  return {
    temp: Math.round(j?.current?.temperature_2m ?? 0),
    humidity: Math.round(j?.current?.relative_humidity_2m ?? 0),
    condition: label,
    rainSoon: rainSoon || willRain,
  };
}

export function useRealWeather(): RealWeather {
  const [state, setState] = useState<RealWeather>({
    temp: 0,
    humidity: 0,
    condition: "Carregando...",
    rainSoon: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async (lat: number, lon: number) => {
      try {
        const w = await fetchWeather(lat, lon);
        if (!cancelled) setState({ ...w, loading: false, error: null });
      } catch (e) {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: "Falha ao buscar clima" }));
      }
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => run(pos.coords.latitude, pos.coords.longitude),
        () => run(SP_COORDS.lat, SP_COORDS.lon),
        { timeout: 5000, maximumAge: 600_000 },
      );
    } else {
      run(SP_COORDS.lat, SP_COORDS.lon);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
