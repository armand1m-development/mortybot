import * as log from "@std/log";
import { bold } from "@std/fmt/colors";

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();
logger.debug(bold("Generating new skills file..."));

import { generateSkillsFile } from "./generators/generateSkillsFile.ts";
await generateSkillsFile();

import { loadEnvironment } from "./src/environment.ts";
import { createBot } from "./src/bot.ts";
import { createApi } from "./src/api.ts";
import { startTracing } from "./src/tracing.ts";
import { getMcpRegistry } from "./src/skills/assistant/mcp/registry.ts";
import {
  createTailnetKeepalive,
  createTailnetKeepaliveTargets,
} from "./src/tailnetKeepalive.ts";

logger.debug(bold("Loading environment..."));
const configuration = await loadEnvironment();

logger.debug(bold("Starting tracing..."));
startTracing(configuration);

const bot = await createBot(configuration);
logger.debug(bold("Starting bot instance..."));
const botInstance = bot.start();

const api = await createApi(configuration);
logger.debug(bold("Starting HTTP server instance..."));
api.start();

const tailnetKeepalive = createTailnetKeepalive({
  targets: createTailnetKeepaliveTargets(configuration),
  intervalMs: configuration.tailnetKeepaliveIntervalMs,
});
if (configuration.tailnetKeepaliveEnabled) {
  logger.debug(bold("Starting tailnet keepalive..."));
  tailnetKeepalive.start();
}

const stopServers = () => {
  // Fire-and-forget: stop() clears the interval synchronously, and Fly's
  // kill_timeout must not be spent awaiting a probe that can take 5s.
  void tailnetKeepalive.stop();

  logger.debug(bold("Stopping bot instance..."));
  botInstance.isRunning() && botInstance.stop();

  logger.debug(bold("Stopping HTTP server instance..."));
  api.abortController.abort("shutdown");

  logger.debug(bold("Stopping MCP clients..."));
  void getMcpRegistry().close().catch((error) => logger.error(error));
};

Deno.addSignalListener("SIGINT", stopServers);
Deno.addSignalListener("SIGTERM", stopServers);
