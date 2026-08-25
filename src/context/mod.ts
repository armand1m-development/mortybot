/**
 * TODO: Check if you can generate these types based on the skills defined
 */
import type { Context, SessionFlavor } from "grammy";
import type { FileFlavor } from "@grammyjs/files";
import type { ConfigurationContext } from "/src/platform/configuration/middlewares/types.ts";
import type { CurrencyApiContext } from "/src/skills/currency/middlewares/createCurrencyApiMiddleware/types.ts";
import type { WeatherApiContext } from "/src/skills/weather/middlewares/createWeatherApiMiddleware/types.ts";
import type { ThirdBridgeApiContext } from "/src/skills/espiritosanto/middlewares/createThirdBridgeApiMiddleware/types.ts";
import type { LocationsApiContext } from "/src/skills/horeca/middlewares/createLocationsApiMiddleware/types.ts";
import type { FilterSessionData } from "/src/skills/filters/sessionData/types.ts";
import type { GoodbyeCounterSessionData } from "/src/skills/goodbye/sessionData/types.ts";
import type { HashtagChannelSessionData } from "/src/skills/hashtags/sessionData/types.ts";
import type { N2yoApiContext } from "/src/skills/galileo/middleware/createN2yoMiddleware/types.ts";
import type { MemeTemplateSessionData } from "/src/skills/image/sessionData/types.ts";
import type { RadarSquatApiContext } from "/src/skills/squatradar/middlewares/createRadarSquatApiMiddleware/types.ts";
import type { AssistantApiContext } from "/src/skills/assistant/middlewares/createAssistantApiMiddleware/types.ts";
import type { AssistantSessionData } from "/src/skills/assistant/sessionData/types.ts";
import type { SkillCommandToolsContext } from "/src/platform/skillModules/SkillCommandToolRegistry.ts";
import type { I18nContext, LanguageSessionData } from "/src/i18n/types.ts";

export type SessionData =
  & FilterSessionData
  & GoodbyeCounterSessionData
  & HashtagChannelSessionData
  & MemeTemplateSessionData
  & LanguageSessionData
  & AssistantSessionData;

export type BotContext =
  & FileFlavor<Context>
  & CurrencyApiContext
  & WeatherApiContext
  & ThirdBridgeApiContext
  & N2yoApiContext
  & ConfigurationContext
  & LocationsApiContext
  & RadarSquatApiContext
  & AssistantApiContext
  & SkillCommandToolsContext
  & I18nContext
  & SessionFlavor<SessionData>;
