import { Context, SessionFlavor } from "grammy/mod.ts";
import { ConfigurationContext } from "/src/skills/platform/configuration/types.ts";
import { CurrencyApiContext } from "/src/skills/currency/createCurrencyApiMiddleware/types.ts";
import { WeatherApiContext } from "/src/skills/weather/createWeatherApiMiddleware/types.ts";
import { FilterSessionData } from "/src/skills/filters/types.ts";

export type SessionData = FilterSessionData;

export type BotContext =
  & Context
  & CurrencyApiContext
  & WeatherApiContext
  & ConfigurationContext
  & SessionFlavor<SessionData>;
