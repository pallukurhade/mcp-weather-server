import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
	name: "Weather Service",
	version: "1.0.0",
});

const WMO_CODES: Record<number, string> = {
	0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
	45: "Fog", 48: "Icy fog",
	51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
	61: "Light rain", 63: "Rain", 65: "Heavy rain",
	71: "Light snow", 73: "Snow", 75: "Heavy snow",
	80: "Light showers", 81: "Showers", 82: "Heavy showers",
	95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

server.tool(
	"getWeather",
	{ city: z.string().describe("Name of the city to get weather for") },
	async ({ city }) => {
		const geoRes = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
		);
		const geoData = await geoRes.json() as any;

		if (!geoData.results?.length) {
			return { content: [{ type: "text", text: `Could not find city: ${city}` }] };
		}

		const { latitude, longitude, name, country } = geoData.results[0];

		const weatherRes = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
			`&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode` +
			`&temperature_unit=celsius&wind_speed_unit=kmh`
		);
		const weatherData = await weatherRes.json() as any;
		const c = weatherData.current;
		const condition = WMO_CODES[c.weathercode] ?? "Unknown";

		return {
			content: [{
				type: "text",
				text: `Weather in ${name}, ${country}:\n` +
					`Condition: ${condition}\n` +
					`Temperature: ${c.temperature_2m}°C\n` +
					`Humidity: ${c.relative_humidity_2m}%\n` +
					`Wind: ${c.wind_speed_10m} km/h`,
			}],
		};
	}
);

const transport = new StdioServerTransport();
await server.connect(transport);
