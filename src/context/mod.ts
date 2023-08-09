/**
 * TODO: Check if you can generate these types based on the skills defined
 */
import { Context, SessionFlavor } from "grammy/mod.ts";
import { FileFlavor } from "grammy_files/mod.ts";
import { ConfigurationContext } from "/src/platform/configuration/middlewares/types.ts";
import { CurrencyApiContext } from "/src/skills/currency/middlewares/createCurrencyApiMiddleware/types.ts";
import { WeatherApiContext } from "/src/skills/weather/middlewares/createWeatherApiMiddleware/types.ts";
import { RodosolApiContext } from "/src/skills/espiritosanto/middlewares/createRodosolApiMiddleware/types.ts";
import { LocationsApiContext } from "/src/skills/horeca/middlewares/createLocationsApiMiddleware/types.ts";
import { FilterSessionData } from "/src/skills/filters/sessionData/types.ts";
import { GoodbyeCounterSessionData } from "/src/skills/goodbye/sessionData/types.ts";
import { HashtagChannelSessionData } from "../skills/hashtags/sessionData/types.ts";

export type SessionData =
  & FilterSessionData
  & GoodbyeCounterSessionData
  & HashtagChannelSessionData;

export type BotContext =
  & FileFlavor<Context>
  & CurrencyApiContext
  & WeatherApiContext
  & RodosolApiContext
  & ConfigurationContext
  & LocationsApiContext
  & SessionFlavor<SessionData>;
