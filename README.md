# Weather MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides real-time weather data to Claude using the [Open-Meteo API](https://open-meteo.com) — free, no API key required.

**Live UI:** [ui-plum-five-69.vercel.app](https://ui-plum-five-69.vercel.app)

## Tool

**`getWeather`** — Returns current weather for a given city.

| Parameter | Type   | Description             |
|-----------|--------|-------------------------|
| `city`    | string | Name of the city to look up |

**Response includes:**
- Condition (e.g. Clear sky, Rain, Thunderstorm)
- Temperature (°C)
- Humidity (%)
- Wind speed (km/h)

## How it works

1. Geocodes the city name using the [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
2. Fetches live weather using the [Open-Meteo Forecast API](https://open-meteo.com/en/docs)

No API key or account needed.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Register the MCP server with Claude Code:
   ```bash
   claude mcp add weather-example npx tsx /path/to/main.ts
   ```

3. Restart Claude Code — the `getWeather` tool will be available in your session.

## Usage

Once registered, ask Claude things like:

- "What's the weather in Tokyo?"
- "Get the weather for New York"
- "Is it raining in London?"

## UI

A React web app with city search and animated 5-day forecast is available at:
**https://ui-plum-five-69.vercel.app**

To run it locally:
```bash
cd ui
npm install
npm run dev
```

## Requirements

- Node.js 18+
- [Claude Code](https://claude.ai/code)
