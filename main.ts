import { createBot } from "/src/bot.ts";
import { run } from "grammy_runner/mod.ts";
import { serveDir } from "std/http/file_server.ts";
import { Application, Router, serve } from "oak";
import * as log from "std/log/mod.ts";
import * as dotenv from "std/dotenv/mod.ts";
import * as path from "std/path/mod.ts";
import { bold, yellow } from "std/fmt/colors.ts";
import { reviver } from "/src/utilities/jsonParsing.ts";
import { replacer } from "./src/utilities/jsonParsing.ts";

async function readJsonFile(filePath: string) {
  const jsonContent = await Deno.readTextFile(filePath);
  const data = JSON.parse(jsonContent, reviver);
  return data;
}

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

const INLINE_QUERY_SOURCE_CHAT_ID = Deno.env.get(
  "INLINE_QUERY_SOURCE_CHAT_ID",
)!;

const { bot, configuration } = await createBot({
  dataPath: Deno.env.get("DATA_PATH")!,
  botToken: Deno.env.get("BOT_TOKEN")!,
  exchangeApiToken: Deno.env.get("EXCHANGE_API_TOKEN")!,
  openWeatherMapApiToken: Deno.env.get("OPENWEATHERMAP_API_TOKEN")!,
  googleMapsApiToken: Deno.env.get("GOOGLEMAPS_API_TOKEN")!,
  n2yoApiToken: Deno.env.get("N2YO_API_TOKEN")!,
  inlineQuerySourceChatId: INLINE_QUERY_SOURCE_CHAT_ID,
});

const botInstance = run(bot);

const serverAbortController = new AbortController();

const router = new Router();

router.get("/templates", async (ctx) => {
  const dataBase = await readJsonFile(
    path.join(
      configuration.dataPath,
      `/sessions/66/${INLINE_QUERY_SOURCE_CHAT_ID}.json`,
    ),
  );
  console.log(dataBase);
  ctx.response.body = JSON.stringify(dataBase, replacer);
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.use(serve((req: Request) => {
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
}));

app.addEventListener("listen", ({ hostname, port, serverType }) => {
  console.log(
    bold("Start listening on ") + yellow(`${hostname}:${port}`),
  );
  console.log(bold("  using HTTP server: " + yellow(serverType)));
});

app.listen({ port: 8000, signal: serverAbortController.signal });

const stopServers = () => {
  botInstance.isRunning() && botInstance.stop();
  serverAbortController.abort("shutdown");
};

Deno.addSignalListener("SIGINT", stopServers);
Deno.addSignalListener("SIGTERM", stopServers);
