import { WeatherData } from '../types';

// Map Open-Meteo WMO weather interpretation codes to Indonesian descriptions & icons
function interpretWmoCode(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Cerah', icon: 'sun' };
  if (code === 1) return { description: 'Cerah Berawan', icon: 'cloud-sun' };
  if (code === 2) return { description: 'Berawan', icon: 'cloud' };
  if (code === 3) return { description: 'Sangat Berawan', icon: 'clouds' };
  if (code >= 45 && code <= 48) return { description: 'Berkabut', icon: 'cloud-fog' };
  if (code >= 51 && code <= 55) return { description: 'Gerimis', icon: 'cloud-drizzle' };
  if (code >= 61 && code <= 65) return { description: 'Hujan', icon: 'cloud-rain' };
  if (code >= 80 && code <= 82) return { description: 'Hujan Lebat', icon: 'cloud-rain-heavy' };
  if (code >= 95 && code <= 99) return { description: 'Hujan Petir', icon: 'cloud-lightning' };
  return { description: 'Cerah Berawan', icon: 'cloud-sun' };
}

const WEATHER_CACHE_KEY = 'masjid_tv_weather_cache';

export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  city: string = 'Lokasi Masjid'
): Promise<WeatherData | null> {
  // Check local cache first (valid for 30 minutes)
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (age < 30 * 60 * 1000 && Math.abs(parsed.lat - latitude) < 0.1) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore cache read error
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Weather fetch status: ${res.status}`);

    const data = await res.json();
    const current = data.current;
    const { description, icon } = interpretWmoCode(current.weather_code || 0);

    const result: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      weatherCode: current.weather_code,
      description,
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      city,
      icon,
      lastUpdated: new Date().toISOString(),
    };

    // Save to cache
    try {
      localStorage.setItem(
        WEATHER_CACHE_KEY,
        JSON.stringify({ lat: latitude, lng: longitude, data: result, lastUpdated: new Date().toISOString() })
      );
    } catch {
      // Ignore cache write error
    }

    return result;
  } catch (err) {
    console.warn('Weather service offline or timeout, attempting fallback to cache:', err);
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached).data;
      }
    } catch {
      // Ignore
    }
    return null;
  }
}
