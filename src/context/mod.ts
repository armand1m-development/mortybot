/**
 * TODO: Check if you can generate these types based on the skills defined
 */
import type { Context, SessionFlavor } from "grammy/mod.ts";
import type { FileFlavor } from "grammy_files/mod.ts";
import type { ConfigurationContext } from "/src/platform/configuration/middlewares/types.ts";
import type { CurrencyApiContext } from "/src/skills/currency/middlewares/createCurrencyApiMiddleware/types.ts";
import type { WeatherApiContext } from "/src/skills/weather/middlewares/createWeatherApiMiddleware/types.ts";
import type { RodosolApiContext } from "/src/skills/espiritosanto/middlewares/createRodosolApiMiddleware/types.ts";
import type { LocationsApiContext } from "/src/skills/horeca/middlewares/createLocationsApiMiddleware/types.ts";
import type { FilterSessionData } from "/src/skills/filters/sessionData/types.ts";
import type { GoodbyeCounterSessionData } from "/src/skills/goodbye/sessionData/types.ts";
import type { HashtagChannelSessionData } from "/src/skills/hashtags/sessionData/types.ts";
import type { N2yoApiContext } from "/src/skills/galileo/middleware/createN2yoMiddleware/types.ts";
import type { MemeTemplateSessionData } from "/src/skills/image/sessionData/types.ts";

export type SessionData =
  & FilterSessionData
  & GoodbyeCounterSessionData
  & HashtagChannelSessionData
  & MemeTemplateSessionData;

export type BotContext =
  & FileFlavor<Context>
  & CurrencyApiContext
  & WeatherApiContext
  & RodosolApiContext
  & N2yoApiContext
  & ConfigurationContext
  & LocationsApiContext
  & SessionFlavor<SessionData>;
