import * as log from "std/log/mod.ts";
import * as dotenv from "std/dotenv/mod.ts";
import { Configuration } from "/src/platform/configuration/middlewares/types.ts";

export const loadEnvironment = async (): Promise<Configuration> => {
  const logger = log.getLogger();

  logger.debug("Loading environment..");

  await dotenv.load({
    export: true,
  });

  return {
    dataPath: Deno.env.get("DATA_PATH")!,
    botToken: Deno.env.get("BOT_TOKEN")!,
    exchangeApiToken: Deno.env.get("EXCHANGE_API_TOKEN")!,
    openWeatherMapApiToken: Deno.env.get("OPENWEATHERMAP_API_TOKEN")!,
    googleMapsApiToken: Deno.env.get("GOOGLEMAPS_API_TOKEN")!,
    n2yoApiToken: Deno.env.get("N2YO_API_TOKEN")!,
    inlineQuerySourceChatId: Deno.env.get("INLINE_QUERY_SOURCE_CHAT_ID")!,
    mainMemeTemplateChatSessionPath: Deno.env.get(
      "MAIN_MEME_TEMPLATE_CHAT_SESSION_PATH",
    )!,
    apiPort: parseInt(Deno.env.get("API_PORT")!),
  };
};
