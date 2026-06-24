import { useState, useEffect, useRef } from "react";
import { searchCities, fetchForecast } from "./weather";
import type { GeoResult, ForecastDay } from "./weather";
import "./index.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weatherGradient(code: number): string {
  if (code === 0 || code === 1)        return "from-amber-400 via-orange-300 to-sky-400";
  if (code === 2 || code === 3)        return "from-slate-400 via-slate-300 to-blue-400";
  if (code >= 45 && code <= 48)        return "from-slate-500 via-slate-400 to-slate-300";
  if (code >= 51 && code <= 67)        return "from-blue-600 via-blue-400 to-slate-400";
  if (code >= 71 && code <= 77)        return "from-sky-200 via-blue-100 to-slate-200";
  if (code >= 80 && code <= 82)        return "from-blue-500 via-sky-400 to-slate-400";
  if (code >= 95)                      return "from-slate-800 via-purple-900 to-slate-700";
  return "from-sky-500 via-blue-400 to-indigo-500";
}

function ForecastCard({ day, isToday, index }: { day: ForecastDay; isToday: boolean; index: number }) {
  const date = new Date(day.date + "T00:00:00");
  const label = isToday ? "Today" : DAYS[date.getDay()];

  return (
    <div
      className={`card-enter flex flex-col items-center gap-3 rounded-3xl p-5 transition-all duration-300 cursor-default
        ${isToday
          ? "bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl scale-105 text-white"
          : "bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 hover:scale-102 text-white/90"}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? "text-white" : "text-white/60"}`}>
        {label}
      </span>
      <span className="text-5xl drop-shadow-md">{day.emoji}</span>
      <span className="text-xs font-medium text-center leading-snug text-white/80">{day.label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold">{Math.round(day.maxTemp)}°</span>
        <span className="text-sm text-white/50">{Math.round(day.minTemp)}°</span>
      </div>
      <div className="w-full border-t border-white/20 pt-2 flex flex-col items-center gap-1 text-xs text-white/60">
        <span>💧 {day.precipitation} mm</span>
        <span>💨 {day.maxWind} km/h</span>
      </div>
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="card-enter flex flex-col items-center gap-3 rounded-3xl p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="skeleton h-3 w-10 rounded-full" />
      <div className="skeleton h-12 w-12 rounded-full" />
      <div className="skeleton h-3 w-16 rounded-full" />
      <div className="skeleton h-5 w-14 rounded-full" />
      <div className="skeleton h-8 w-full rounded-xl mt-1" />
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(query);
      setSuggestions(results);
      setShowDropdown(true);
    }, 300);
  }, [query]);

  async function selectCity(city: GeoResult) {
    setSelected(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    setShowDropdown(false);
    setForecast([]);
    setLoading(true);
    try {
      const data = await fetchForecast(city.latitude, city.longitude);
      setForecast(data);
    } finally {
      setLoading(false);
    }
  }

  const todayCode = forecast[0]?.code ?? -1;
  const gradient = todayCode >= 0 ? weatherGradient(todayCode) : "from-slate-700 via-slate-600 to-slate-800";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} transition-all duration-1000 flex items-center justify-center p-6`}>
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10 fade-in">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Weather MCP Server
          </h1>
          <p className="text-white/60 mt-2 text-sm tracking-wide">5-day forecast · powered by Open-Meteo</p>
        </div>

        {/* Search box */}
        <div className="relative mb-8">
          <div className="flex items-center bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl focus-within:bg-white/30 focus-within:border-white/50 transition-all duration-300">
            <span className="pl-5 text-white/50 text-lg select-none">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => suggestions.length && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search for a city..."
              className="flex-1 bg-transparent text-white placeholder-white/40 px-4 py-4 outline-none text-lg font-medium"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSuggestions([]); setForecast([]); setSelected(null); }}
                className="pr-5 text-white/40 hover:text-white transition-colors text-lg"
              >✕</button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-10 mt-3 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden fade-in">
              {suggestions.map((city, i) => (
                <button
                  key={city.id}
                  onMouseDown={() => selectCity(city)}
                  className={`w-full text-left px-5 py-3.5 hover:bg-blue-50 transition-colors flex items-center gap-3
                    ${i !== suggestions.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <span className="text-lg">📍</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm">{city.name}</span>
                    <span className="text-slate-400 text-xs">
                      {[city.admin1, city.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skeleton loader */}
        {loading && (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        )}

        {/* Forecast cards */}
        {!loading && forecast.length > 0 && (
          <div className="fade-in">
            <p className="text-white/70 text-center text-sm mb-5 font-medium tracking-wide">
              📍 {selected?.name}{selected?.admin1 ? `, ${selected.admin1}` : ""} · {selected?.country}
            </p>
            <div className="grid grid-cols-5 gap-3">
              {forecast.map((day, i) => (
                <ForecastCard key={day.date} day={day} isToday={i === 0} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !forecast.length && (
          <div className="text-center text-white/40 py-16 fade-in">
            <div className="text-7xl mb-4 drop-shadow">🌍</div>
            <p className="text-sm tracking-wide">Search for a city to see the forecast</p>
          </div>
        )}
      </div>
    </div>
  );
}
