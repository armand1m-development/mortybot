import * as log from "@std/log";
import { Application, Router, serve } from "oak";
import { replacer, reviverToObject } from "/src/utilities/jsonParsing.ts";
import { bold, yellow } from "@std/fmt/colors";
import { serveDir } from "@std/http/file-server";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import * as path from "@std/path";
import { skills } from "/src/skills/skills.ts";
import { setupSkillRouteLoader } from "/src/platform/skillModules/setupSkillRouteLoader.ts";

export type ApplicationContext = {
  configuration: Configuration;
};

export const createApi = async (configuration: Configuration) => {
  const logger = log.getLogger();
  const abortController = new AbortController();
  const mainRouter = new Router();

  const app = new Application<ApplicationContext>({
    jsonBodyReplacer: replacer,
    jsonBodyReviver: reviverToObject,
  });

  logger.debug(bold("Loading skill routes..."));

  await setupSkillRouteLoader(
    skills,
    mainRouter,
  );

  logger.debug(bold("Setting up HTTP router..."));
  app
    .use((ctx, next) => {
      ctx.state.configuration = configuration;
      return next();
    })
    .use(mainRouter.routes())
    .use(serve((req, ctx) => {
      const pathname = new URL(req.url).pathname;

      if (pathname.startsWith("/audio/")) {
        return serveDir(req, {
          fsRoot: path.join(configuration.dataPath, "audio"),
          urlRoot: "audio",
          showIndex: false,
        });
      }

      return ctx.throw(404, "No such path here.");
    }));

  app.addEventListener("listen", ({ hostname, port, serverType }) => {
    logger.info(
      bold("Oak HTTP Server listening on ") + yellow(`${hostname}:${port}`),
    );
    logger.info(bold("using HTTP server: " + yellow(serverType)));
  });

  const start = () => {
    return app.listen({
      port: configuration.apiPort,
      signal: abortController.signal,
    });
  };

  return { app, start, abortController };
};
