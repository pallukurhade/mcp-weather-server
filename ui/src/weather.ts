export const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Clear sky",               emoji: "☀️" },
  1:  { label: "Mainly clear",             emoji: "🌤️" },
  2:  { label: "Partly cloudy",            emoji: "⛅" },
  3:  { label: "Overcast",                 emoji: "☁️" },
  45: { label: "Fog",                      emoji: "🌫️" },
  48: { label: "Icy fog",                  emoji: "🌫️" },
  51: { label: "Light drizzle",            emoji: "🌦️" },
  53: { label: "Drizzle",                  emoji: "🌦️" },
  55: { label: "Heavy drizzle",            emoji: "🌧️" },
  61: { label: "Light rain",               emoji: "🌧️" },
  63: { label: "Rain",                     emoji: "🌧️" },
  65: { label: "Heavy rain",               emoji: "🌧️" },
  71: { label: "Light snow",               emoji: "🌨️" },
  73: { label: "Snow",                     emoji: "❄️" },
  75: { label: "Heavy snow",               emoji: "❄️" },
  80: { label: "Light showers",            emoji: "🌦️" },
  81: { label: "Showers",                  emoji: "🌧️" },
  82: { label: "Heavy showers",            emoji: "⛈️" },
  95: { label: "Thunderstorm",             emoji: "⛈️" },
  96: { label: "Thunderstorm with hail",   emoji: "⛈️" },
  99: { label: "Thunderstorm, heavy hail", emoji: "⛈️" },
};

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  code: number;
  label: string;
  emoji: string;
}

export interface ForecastDay {
  date: string;
  code: number;
  label: string;
  emoji: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  maxWind: number;
}

export async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6`
  );
  const data = await res.json();
  return data.results ?? [];
}

export async function fetchWeather(lat: number, lon: number): Promise<{ current: CurrentWeather; forecast: ForecastDay[] }> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
    `&temperature_unit=celsius&wind_speed_unit=kmh&forecast_days=5`
  );
  const data = await res.json();

  const c = data.current;
  const code: number = c.weather_code;
  const info = WMO_CODES[code] ?? { label: "Unknown", emoji: "🌡️" };
  const current: CurrentWeather = {
    temp: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    code,
    label: info.label,
    emoji: info.emoji,
  };

  const d = data.daily;
  const forecast: ForecastDay[] = (d.time as string[]).map((date: string, i: number) => {
    const dc: number = d.weather_code[i];
    const di = WMO_CODES[dc] ?? { label: "Unknown", emoji: "🌡️" };
    return {
      date,
      code: dc,
      label: di.label,
      emoji: di.emoji,
      maxTemp: d.temperature_2m_max[i],
      minTemp: d.temperature_2m_min[i],
      precipitation: d.precipitation_sum[i],
      maxWind: d.wind_speed_10m_max[i],
    };
  });

  return { current, forecast };
}
