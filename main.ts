import * as log from "std/log/mod.ts";
import { bold } from "std/fmt/colors.ts";
import { loadEnvironment } from "./src/environment.ts";
import { createBot } from "./src/bot.ts";
import { createApi } from "./src/api.ts";
import { startTracing } from "./src/tracing.ts";

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

const logger = log.getLogger();
const configuration = await loadEnvironment();

logger.debug(bold("Starting tracing..."));
startTracing(configuration);

const bot = await createBot(configuration);
logger.debug(bold("Starting bot instance..."));
const botInstance = bot.start();

const api = await createApi(configuration);
logger.debug(bold("Starting HTTP server instance..."));
api.start();

const stopServers = () => {
  logger.debug(bold("Stopping bot instance..."));
  botInstance.isRunning() && botInstance.stop();

  logger.debug(bold("Stopping HTTP server instance..."));
  api.abortController.abort("shutdown");
};

Deno.addSignalListener("SIGINT", stopServers);
Deno.addSignalListener("SIGTERM", stopServers);
