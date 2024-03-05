import { createBot } from "/src/bot.ts";
import { run } from "grammy_runner/mod.ts";
import { serveDir } from "std/http/file_server.ts";
import * as log from "std/log/mod.ts";
import * as dotenv from "std/dotenv/mod.ts";
import * as path from "std/path/mod.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

await dotenv.load({
  export: true,
});

const { bot, configuration } = await createBot({
  dataPath: Deno.env.get("DATA_PATH")!,
  botToken: Deno.env.get("BOT_TOKEN")!,
  exchangeApiToken: Deno.env.get("EXCHANGE_API_TOKEN")!,
  openWeatherMapApiToken: Deno.env.get("OPENWEATHERMAP_API_TOKEN")!,
  googleMapsApiToken: Deno.env.get("GOOGLEMAPS_API_TOKEN")!,
  n2yoApiToken: Deno.env.get("N2YO_API_TOKEN")!,
  inlineQuerySourceChatId: Deno.env.get("INLINE_QUERY_SOURCE_CHAT_ID")!,
});

const botInstance = run(bot);

const serverAbortController = new AbortController();
const staticServerInstance = Deno.serve({
  port: 3000,
  signal: serverAbortController.signal,
}, (req: Request) => {
  const pathname = new URL(req.url).pathname;

  if (pathname.startsWith("/audio")) {
    return serveDir(req, {
      fsRoot: path.join(configuration.dataPath, "audio"),
      urlRoot: "audio",
      showIndex: false,
    });
  }

  return new Response("404: Not Found", {
    status: 404,
  });
});

const stopServers = () => {
  botInstance.isRunning() && botInstance.stop();
  serverAbortController.abort("shutdown");
  staticServerInstance.finished.then(() => console.log("server has shutdown"));
};

Deno.addSignalListener("SIGINT", stopServers);
Deno.addSignalListener("SIGTERM", stopServers);
