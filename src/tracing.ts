import * as Sentry from "sentry";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";

export const startTracing = (configuration: Configuration) => {
  Sentry.init({
    environment: configuration.environment,
    dsn: configuration.sentryDSN,
    integrations: [],
    tracesSampleRate: 1.0,
  });
};
