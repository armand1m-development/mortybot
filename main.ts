import { createBot } from "/src/bot.ts";
import { run } from "grammy_runner/mod.ts";
import { config } from "dotenv/mod.ts";

const configuration = config({
  safe: true,
});

const bot = createBot({
  dataPath: configuration.DATA_PATH,
  botToken: configuration.BOT_TOKEN,
  exchangeApiToken: configuration.EXCHANGE_API_TOKEN,
  openWeatherMapApiToken: configuration.OPENWEATHERMAP_API_TOKEN,
});

const runner = run(bot);

// Stopping the bot when the Deno process
// is about to be terminated
const stopRunner = () => runner.isRunning() && runner.stop();
Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);
