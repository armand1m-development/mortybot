import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { fetchNearbyLocations } from "../../httpClients/fetchNearbyLocations.ts";

export const createLocationsApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.locationsApi = {
      fetchNearbyLocations: injectToken(
        ctx.configuration.googleMapsApiToken,
        fetchNearbyLocations,
      ),
    };

    return next();
  };

  return middleware;
};
