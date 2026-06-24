import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export const WMO_CODES: Record<number, string> = {
	0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
	45: "Fog", 48: "Icy fog",
	51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
	61: "Light rain", 63: "Rain", 65: "Heavy rain",
	71: "Light snow", 73: "Snow", 75: "Heavy snow",
	80: "Light showers", 81: "Showers", 82: "Heavy showers",
	95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

async function geocode(city: string) {
	const res = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
	);
	const data = await res.json() as any;
	if (!data.results?.length) throw new Error(`City not found: ${city}`);
	return data.results[0] as { latitude: number; longitude: number; name: string; country: string };
}

export async function getWeatherData(city: string) {
	const { latitude, longitude, name, country } = await geocode(city);
	const res = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
		`&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode` +
		`&temperature_unit=celsius&wind_speed_unit=kmh`
	);
	const data = await res.json() as any;
	const c = data.current;
	return {
		name,
		country,
		condition: WMO_CODES[c.weathercode] ?? "Unknown",
		temperature: c.temperature_2m as number,
		humidity: c.relative_humidity_2m as number,
		wind: c.wind_speed_10m as number,
	};
}

export async function getForecastData(city: string) {
	const { latitude, longitude, name, country } = await geocode(city);
	const res = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
		`&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
		`&temperature_unit=celsius&wind_speed_unit=kmh&forecast_days=5`
	);
	const data = await res.json() as any;
	const d = data.daily;
	const days = (d.time as string[]).map((date, i) => ({
		date,
		condition: WMO_CODES[d.weathercode[i]] ?? "Unknown",
		maxTemp: d.temperature_2m_max[i] as number,
		minTemp: d.temperature_2m_min[i] as number,
		precipitation: d.precipitation_sum[i] as number,
		maxWind: d.wind_speed_10m_max[i] as number,
	}));
	return { name, country, days };
}

const server = new McpServer({
	name: "Weather Service",
	version: "1.0.0",
});

server.tool(
	"getWeather",
	{ city: z.string().describe("Name of the city to get weather for") },
	async ({ city }) => {
		try {
			const w = await getWeatherData(city);
			return {
				content: [{
					type: "text",
					text: `Weather in ${w.name}, ${w.country}:\n` +
						`Condition: ${w.condition}\n` +
						`Temperature: ${w.temperature}°C\n` +
						`Humidity: ${w.humidity}%\n` +
						`Wind: ${w.wind} km/h`,
				}],
			};
		} catch (e: any) {
			return { content: [{ type: "text", text: e.message }] };
		}
	}
);

server.tool(
	"getForecast",
	{ city: z.string().describe("Name of the city to get 5-day forecast for") },
	async ({ city }) => {
		try {
			const { name, country, days } = await getForecastData(city);
			const lines = days.map(d =>
				`${d.date}: ${d.condition}, ${d.minTemp}–${d.maxTemp}°C, ` +
				`${d.precipitation}mm rain, wind ${d.maxWind} km/h`
			);
			return {
				content: [{
					type: "text",
					text: `5-day forecast for ${name}, ${country}:\n${lines.join("\n")}`,
				}],
			};
		} catch (e: any) {
			return { content: [{ type: "text", text: e.message }] };
		}
	}
);

const transport = new StdioServerTransport();
await server.connect(transport);
