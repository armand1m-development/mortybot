import { assertEquals } from "@std/assert";
import { getQueryWeatherUrl } from "./queryWeather.ts";
import { getQueryForecastUrl } from "./queryForecast.ts";

Deno.test("weather URLs request descriptions in the selected language", () => {
  const weatherUrl = new URL(getQueryWeatherUrl({
    language: "pt",
    query: "Vitória, ES",
    token: "token",
  }));
  const forecastUrl = new URL(getQueryForecastUrl({
    language: "en",
    query: "Amsterdam, NL",
    token: "token",
  }));

  assertEquals(weatherUrl.searchParams.get("q"), "Vitória, ES");
  assertEquals(weatherUrl.searchParams.get("lang"), "pt_br");
  assertEquals(forecastUrl.searchParams.get("q"), "Amsterdam, NL");
  assertEquals(forecastUrl.searchParams.get("lang"), "en");
});
