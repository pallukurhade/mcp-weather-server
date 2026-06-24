import { useState, useRef } from "react";
import { searchCities, fetchWeather } from "./weather";
import type { GeoResult, ForecastDay, CurrentWeather } from "./weather";
import "./index.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const QUICK_CITIES: { name: string; country: string; country_code: string; latitude: number; longitude: number; id: number }[] = [
  { id: 1, name: "New York",  country: "United States", country_code: "US", latitude: 40.7128,  longitude: -74.006  },
  { id: 2, name: "London",    country: "United Kingdom", country_code: "GB", latitude: 51.5074,  longitude: -0.1278  },
  { id: 3, name: "Tokyo",     country: "Japan",          country_code: "JP", latitude: 35.6762,  longitude: 139.6503 },
  { id: 4, name: "Sydney",    country: "Australia",      country_code: "AU", latitude: -33.8688, longitude: 151.2093 },
  { id: 5, name: "Paris",     country: "France",         country_code: "FR", latitude: 48.8566,  longitude: 2.3522   },
  { id: 6, name: "Dubai",     country: "UAE",            country_code: "AE", latitude: 25.2048,  longitude: 55.2708  },
];

function weatherTheme(code: number): { bg: string } {
  if (code === 0 || code === 1) return { bg: "linear-gradient(160deg, #f97316 0%, #fb923c 35%, #fbbf24 60%, #38bdf8 100%)" };
  if (code === 2 || code === 3) return { bg: "linear-gradient(160deg, #475569 0%, #64748b 40%, #94a3b8 70%, #60a5fa 100%)" };
  if (code >= 45 && code <= 48) return { bg: "linear-gradient(160deg, #334155 0%, #475569 50%, #64748b 100%)" };
  if (code >= 51 && code <= 67) return { bg: "linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 70%, #93c5fd 100%)" };
  if (code >= 71 && code <= 77) return { bg: "linear-gradient(160deg, #bae6fd 0%, #e0f2fe 50%, #f0f9ff 100%)" };
  if (code >= 80 && code <= 82) return { bg: "linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 100%)" };
  if (code >= 95)               return { bg: "linear-gradient(160deg, #1e1b4b 0%, #4c1d95 40%, #312e81 100%)" };
  return { bg: "linear-gradient(160deg, #0369a1 0%, #0ea5e9 50%, #6366f1 100%)" };
}

const DEFAULT_BG = "linear-gradient(160deg, #0ea5e9 0%, #6366f1 50%, #ec4899 100%)";

function ForecastCard({ day, isToday, index }: { day: ForecastDay; isToday: boolean; index: number }) {
  const date = new Date(day.date + "T00:00:00");
  const label = isToday ? "Today" : DAYS[date.getDay()];
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className={`card-enter flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 cursor-default
        ${isToday
          ? "bg-white/25 border border-white/50 shadow-2xl"
          : "bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/35"}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? "text-white" : "text-white/55"}`}>
        {label}
      </span>
      <span className="text-xs text-white/40">{dateStr}</span>
      <span className="text-4xl my-1 drop-shadow-lg">{day.emoji}</span>
      <span className="text-xs font-medium text-center text-white/70 leading-tight min-h-[2rem] flex items-center">
        {day.label}
      </span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-bold text-white">{Math.round(day.maxTemp)}°</span>
        <span className="text-sm text-white/40">{Math.round(day.minTemp)}°</span>
      </div>
      <div className="w-full pt-2 border-t border-white/15 grid grid-cols-2 gap-1 text-center">
        <div className="text-xs text-white/50">
          <div className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Rain</div>
          {day.precipitation}mm
        </div>
        <div className="text-xs text-white/50">
          <div className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Wind</div>
          {day.maxWind}km/h
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white/15 border border-white/25 rounded-2xl px-6 py-4 min-w-[90px]">
      <span className="text-2xl">{icon}</span>
      <span className="text-white font-bold text-base">{value}</span>
      <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="card-enter flex flex-col items-center gap-3 rounded-2xl p-4 bg-white/5 border border-white/10"
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="skeleton h-2.5 w-10 rounded-full" />
      <div className="skeleton h-2 w-8 rounded-full" />
      <div className="skeleton h-10 w-10 rounded-full mt-1" />
      <div className="skeleton h-2.5 w-16 rounded-full" />
      <div className="skeleton h-5 w-12 rounded-full mt-1" />
      <div className="skeleton h-8 w-full rounded-xl mt-1" />
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(val);
      setSuggestions(results);
      setShowDropdown(true);
    }, 300);
  }

  async function selectCity(city: GeoResult) {
    setSelected(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    setShowDropdown(false);
    setCurrent(null);
    setForecast([]);
    setLoading(true);
    try {
      const data = await fetchWeather(city.latitude, city.longitude);
      setCurrent(data.current);
      setForecast(data.forecast);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSuggestions([]);
    setForecast([]);
    setCurrent(null);
    setSelected(null);
  }

  const bg = current ? weatherTheme(current.code).bg : DEFAULT_BG;
  const hasData = !loading && current && forecast.length > 0;
  const isEmpty = !loading && !current;

  return (
    <div className="min-h-screen transition-bg duration-1000 flex flex-col items-center justify-center p-6" style={{ background: bg }}>
      <div className="w-full max-w-2xl flex flex-col gap-8">

        {/* Header */}
        <div className="text-center fade-in">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-tight">
            {isEmpty ? "☀️ Weather" : "Weather"}
          </h1>
          <p className="text-white/50 text-xs mt-1.5 tracking-widest uppercase">Powered by Open-Meteo</p>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl focus-within:bg-white/25 focus-within:border-white/50 transition-all duration-300">
            <span className="pl-4 text-white/60 text-base select-none">🔍</span>
            <input
              value={query}
              onChange={handleInput}
              onFocus={() => suggestions.length && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search for a city..."
              className="flex-1 bg-transparent text-white placeholder-white/40 px-3 py-4 outline-none text-base font-medium"
            />
            {query && (
              <button onClick={clearSearch} className="pr-4 text-white/40 hover:text-white transition-colors text-base">
                ✕
              </button>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden fade-in">
              {suggestions.map((city, i) => (
                <button
                  key={city.id}
                  onMouseDown={() => selectCity(city)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3
                    ${i !== suggestions.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <span className="text-base">📍</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white text-sm">{city.name}</span>
                    <span className="text-white/40 text-xs">
                      {[city.admin1, city.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="fade-in flex flex-col items-center gap-8 py-6">
            {/* Floating emoji scene */}
            <div className="relative h-32 w-full flex items-center justify-center select-none">
              <span className="float-slow text-7xl absolute" style={{ left: "18%", top: "0" }}>⛅</span>
              <span className="float-med  text-5xl absolute" style={{ left: "58%", top: "10px" }}>🌤️</span>
              <span className="float-fast text-6xl absolute" style={{ left: "35%", top: "20px" }}>☀️</span>
              <span className="float-slow text-3xl absolute" style={{ left: "72%", top: "50px", opacity: 0.7 }}>🌈</span>
              <span className="float-med  text-3xl absolute" style={{ left: "8%",  top: "55px", opacity: 0.6 }}>🌦️</span>
            </div>

            <div className="text-center">
              <p className="text-white text-xl font-semibold drop-shadow">Where are you today?</p>
              <p className="text-white/50 text-sm mt-1">Search any city for a live 5-day forecast</p>
            </div>

            {/* Quick cities */}
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_CITIES.map(city => (
                <button
                  key={city.id}
                  onClick={() => selectCity(city as GeoResult)}
                  className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium
                    hover:bg-white/35 hover:border-white/50 hover:scale-105 transition-all duration-200 backdrop-blur-sm shadow"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading hero skeleton */}
        {loading && (
          <div className="fade-in text-center py-6 flex flex-col items-center gap-6">
            <div>
              <div className="skeleton h-16 w-16 rounded-full mx-auto mb-4" />
              <div className="skeleton h-20 w-44 rounded-2xl mx-auto mb-3" />
              <div className="skeleton h-5 w-28 rounded-full mx-auto" />
            </div>
            <div className="flex justify-center gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-24 rounded-2xl" />)}
            </div>
          </div>
        )}

        {/* Current weather hero */}
        {hasData && (
          <div className="fade-in flex flex-col items-center gap-6">
            <div className="text-center">
              <div className="text-8xl mb-2 drop-shadow-2xl weather-icon">
                {current!.emoji}
              </div>
              <div className="text-8xl font-thin text-white tracking-tighter leading-none drop-shadow-lg">
                {Math.round(current!.temp)}<span className="text-5xl align-top mt-3 inline-block">°C</span>
              </div>
              <div className="text-white/90 text-xl font-semibold mt-3">{current!.label}</div>
              <div className="text-white/50 text-sm mt-1.5">
                📍 {selected?.name}{selected?.admin1 ? `, ${selected.admin1}` : ""}, {selected?.country}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <StatPill icon="🌡️" label="Feels like" value={`${Math.round(current!.feelsLike)}°C`} />
              <StatPill icon="💧" label="Humidity"   value={`${current!.humidity}%`} />
              <StatPill icon="💨" label="Wind"       value={`${Math.round(current!.windSpeed)} km/h`} />
            </div>
          </div>
        )}

        {/* Forecast strip loading */}
        {loading && (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        )}

        {/* Forecast strip */}
        {hasData && (
          <div className="fade-in">
            <p className="text-white/40 text-xs text-center mb-4 uppercase tracking-widest">5-Day Forecast</p>
            <div className="grid grid-cols-5 gap-3">
              {forecast.map((day, i) => (
                <ForecastCard key={day.date} day={day} isToday={i === 0} index={i} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
