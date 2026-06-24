# ☀️ Weather MCP Server

> Real-time weather data for Claude — powered by [Open-Meteo](https://open-meteo.com). No API key required.

**[🌍 Live UI →](https://ui-plum-five-69.vercel.app)**

---

## What is this?

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude the ability to fetch live weather and 5-day forecasts for any city in the world. Pair it with the included React UI for a standalone weather app.

---

## MCP Tools

### `getWeather`
Returns current conditions for a given city.

| Parameter | Type | Description |
|-----------|------|-------------|
| `city` | `string` | Name of the city |

**Returns:** condition, temperature (°C), humidity (%), wind speed (km/h)

### `getForecast`
Returns a 5-day daily forecast.

| Parameter | Type | Description |
|-----------|------|-------------|
| `latitude` | `number` | Latitude |
| `longitude` | `number` | Longitude |

**Returns:** daily high/low, precipitation, wind, weather code

---

## Quickstart

**1. Install dependencies**
```bash
npm install
```

**2. Register with Claude Code**
```bash
claude mcp add weather-example npx tsx /path/to/main.ts
```

**3. Ask Claude about the weather**
```
What's the weather in Tokyo?
Will it rain in London this week?
Is it cold in New York right now?
```

---

## Web UI

A React + Tailwind app with live city search, animated weather icons, current conditions, and a 5-day forecast strip.

**[→ ui-plum-five-69.vercel.app](https://ui-plum-five-69.vercel.app)**

**Run locally:**
```bash
cd ui
npm install
npm run dev
```

---

## How it works

```
Claude → MCP tool call
           ↓
  Open-Meteo Geocoding API   (city name → lat/lon)
           ↓
  Open-Meteo Forecast API    (lat/lon → weather data)
           ↓
        Claude
```

Everything is free and open — no accounts, no keys, no rate limits for reasonable usage.

---

## Requirements

- Node.js 18+
- [Claude Code](https://claude.ai/code)
