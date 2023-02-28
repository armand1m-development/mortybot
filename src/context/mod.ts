/**
 * TODO: Check if you can generate these types based on the skills defined
 */
import { Context, SessionFlavor } from "grammy/mod.ts";
import { FileFlavor } from "grammy_files/mod.ts";
import { ConfigurationContext } from "/src/platform/configuration/middlewares/types.ts";
import { CurrencyApiContext } from "/src/skills/currency/middlewares/createCurrencyApiMiddleware/types.ts";
import { WeatherApiContext } from "/src/skills/weather/middlewares/createWeatherApiMiddleware/types.ts";
import { FilterSessionData } from "/src/skills/filters/sessionData/types.ts";
import { GoodbyeCounterSessionData } from "/src/skills/goodbye/sessionData/types.ts";

export type SessionData = FilterSessionData & GoodbyeCounterSessionData;

export type BotContext =
  & FileFlavor<Context>
  & CurrencyApiContext
  & WeatherApiContext
  & ConfigurationContext
  & SessionFlavor<SessionData>;
