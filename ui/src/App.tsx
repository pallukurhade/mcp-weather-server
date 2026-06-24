import { useState, useRef } from "react";
import { searchCities, fetchWeather } from "./weather";
import type { GeoResult, ForecastDay, CurrentWeather } from "./weather";
import "./index.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weatherTheme(code: number): { from: string; via: string; to: string } {
  if (code === 0 || code === 1)   return { from: "#f97316", via: "#fb923c", to: "#38bdf8" };
  if (code === 2 || code === 3)   return { from: "#64748b", via: "#94a3b8", to: "#60a5fa" };
  if (code >= 45 && code <= 48)   return { from: "#475569", via: "#64748b", to: "#94a3b8" };
  if (code >= 51 && code <= 67)   return { from: "#1d4ed8", via: "#3b82f6", to: "#64748b" };
  if (code >= 71 && code <= 77)   return { from: "#bae6fd", via: "#e0f2fe", to: "#cbd5e1" };
  if (code >= 80 && code <= 82)   return { from: "#1e40af", via: "#3b82f6", to: "#64748b" };
  if (code >= 95)                 return { from: "#1e1b4b", via: "#4c1d95", to: "#1e293b" };
  return { from: "#0369a1", via: "#0ea5e9", to: "#6366f1" };
}

function ForecastCard({ day, isToday, index }: { day: ForecastDay; isToday: boolean; index: number }) {
  const date = new Date(day.date + "T00:00:00");
  const label = isToday ? "Today" : DAYS[date.getDay()];
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className={`card-enter flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 cursor-default
        ${isToday
          ? "bg-white/25 border border-white/40 shadow-2xl"
          : "bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30"}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? "text-white" : "text-white/50"}`}>
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
          <div className="text-white/30 text-[10px] uppercase tracking-wide">Rain</div>
          {day.precipitation}mm
        </div>
        <div className="text-xs text-white/50">
          <div className="text-white/30 text-[10px] uppercase tracking-wide">Wind</div>
          {day.maxWind}km/h
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/10 border border-white/15 rounded-2xl px-5 py-3">
      <span className="text-xl">{icon}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
      <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
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

  const theme = current ? weatherTheme(current.code) : { from: "#0f172a", via: "#1e293b", to: "#0f172a" };
  const bgStyle = {
    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 50%, ${theme.to} 100%)`,
  };

  const hasData = !loading && current && forecast.length > 0;

  return (
    <div className="min-h-screen transition-all duration-1000 flex flex-col items-center justify-center p-6" style={bgStyle}>
      <div className="w-full max-w-2xl flex flex-col gap-8">

        {/* Header */}
        <div className="text-center fade-in">
          <h1 className="text-3xl font-bold text-white/90 tracking-tight">
            Weather
          </h1>
          <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Powered by Open-Meteo</p>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl focus-within:bg-white/15 focus-within:border-white/35 transition-all duration-300">
            <span className="pl-4 text-white/40 text-base select-none">🔍</span>
            <input
              value={query}
              onChange={handleInput}
              onFocus={() => suggestions.length && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search for a city..."
              className="flex-1 bg-transparent text-white placeholder-white/30 px-3 py-4 outline-none text-base font-medium"
            />
            {query && (
              <button onClick={clearSearch} className="pr-4 text-white/30 hover:text-white/70 transition-colors text-base">
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

        {/* Current weather hero */}
        {loading && (
          <div className="fade-in text-center py-8">
            <div className="skeleton h-28 w-40 rounded-3xl mx-auto mb-4" />
            <div className="flex justify-center gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-24 rounded-2xl" />)}
            </div>
          </div>
        )}

        {hasData && (
          <div className="fade-in flex flex-col items-center gap-6">
            {/* Big temp + condition */}
            <div className="text-center">
              <div className="text-8xl mb-2 drop-shadow-2xl" style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.4))" }}>
                {current!.emoji}
              </div>
              <div className="text-8xl font-thin text-white tracking-tighter leading-none">
                {Math.round(current!.temp)}<span className="text-5xl align-top mt-3 inline-block">°C</span>
              </div>
              <div className="text-white/80 text-xl font-medium mt-2">{current!.label}</div>
              <div className="text-white/50 text-sm mt-1">
                📍 {selected?.name}{selected?.admin1 ? `, ${selected.admin1}` : ""}, {selected?.country}
              </div>
            </div>

            {/* Stat pills */}
            <div className="flex gap-3 flex-wrap justify-center">
              <StatPill icon="🌡️" label="Feels like" value={`${Math.round(current!.feelsLike)}°C`} />
              <StatPill icon="💧" label="Humidity" value={`${current!.humidity}%`} />
              <StatPill icon="💨" label="Wind" value={`${Math.round(current!.windSpeed)} km/h`} />
            </div>
          </div>
        )}

        {/* Forecast strip */}
        {loading && (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        )}

        {hasData && (
          <div className="fade-in">
            <p className="text-white/30 text-xs text-center mb-4 uppercase tracking-widest">5-Day Forecast</p>
            <div className="grid grid-cols-5 gap-3">
              {forecast.map((day, i) => (
                <ForecastCard key={day.date} day={day} isToday={i === 0} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !current && (
          <div className="text-center text-white/25 py-12 fade-in flex flex-col items-center gap-4">
            <div className="text-7xl opacity-60">🌍</div>
            <p className="text-sm tracking-widest uppercase">Search a city to see the weather</p>
          </div>
        )}

      </div>
    </div>
  );
}
