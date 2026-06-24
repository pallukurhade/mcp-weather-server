import { describe, it, expect } from "vitest";
import { getWeatherData, getForecastData, WMO_CODES } from "./main.js";

describe("getWeatherData", () => {
	it("returns current weather for a valid city", async () => {
		const w = await getWeatherData("London");
		expect(w.name).toBe("London");
		expect(w.country).toBe("United Kingdom");
		expect(w.temperature).toBeTypeOf("number");
		expect(w.humidity).toBeTypeOf("number");
		expect(w.wind).toBeTypeOf("number");
		expect(w.condition).toBeTypeOf("string");
		expect(w.condition.length).toBeGreaterThan(0);
	});

	it("returns weather for a non-English city name", async () => {
		const w = await getWeatherData("Tokyo");
		expect(w.name).toBe("Tokyo");
		expect(w.country).toBe("Japan");
		expect(w.temperature).toBeTypeOf("number");
	});

	it("throws for an unknown city", async () => {
		await expect(getWeatherData("NotARealCity99999")).rejects.toThrow("City not found");
	});
});

describe("getForecastData", () => {
	it("returns 5-day forecast for a valid city", async () => {
		const { name, country, days } = await getForecastData("Paris");
		expect(name).toBe("Paris");
		expect(country).toBe("France");
		expect(days).toHaveLength(5);
		for (const day of days) {
			expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(day.condition).toBeTypeOf("string");
			expect(day.maxTemp).toBeTypeOf("number");
			expect(day.minTemp).toBeTypeOf("number");
			expect(day.maxTemp).toBeGreaterThanOrEqual(day.minTemp);
			expect(day.precipitation).toBeGreaterThanOrEqual(0);
			expect(day.maxWind).toBeGreaterThanOrEqual(0);
		}
	});

	it("throws for an unknown city", async () => {
		await expect(getForecastData("NotARealCity99999")).rejects.toThrow("City not found");
	});
});

describe("WMO_CODES", () => {
	it("maps code 0 to clear sky", () => {
		expect(WMO_CODES[0]).toBe("Clear sky");
	});

	it("maps code 95 to thunderstorm", () => {
		expect(WMO_CODES[95]).toBe("Thunderstorm");
	});
});
