import { createBot } from "/src/bot.ts";
import { run } from "grammy_runner/mod.ts";
import * as log from "std/log/mod.ts";
import * as dotenv from "std/dotenv/mod.ts";

await log.setup({
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

const bot = await createBot({
  dataPath: Deno.env.get("DATA_PATH")!,
  botToken: Deno.env.get("BOT_TOKEN")!,
  exchangeApiToken: Deno.env.get("EXCHANGE_API_TOKEN")!,
  openWeatherMapApiToken: Deno.env.get("OPENWEATHERMAP_API_TOKEN")!,
});
// const configuration = await dotenv.load({
//   export: true
// });

// const bot = await createBot({
//   dataPath: configuration.DATA_PATH,
//   botToken: configuration.BOT_TOKEN,
//   exchangeApiToken: configuration.EXCHANGE_API_TOKEN,
//   openWeatherMapApiToken: configuration.OPENWEATHERMAP_API_TOKEN,
// });

const runner = run(bot);

// Stopping the bot when the Deno process
// is about to be terminated
const stopRunner = () => runner.isRunning() && runner.stop();
Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);
