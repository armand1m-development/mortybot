import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { queryWeather } from "../../httpClients/queryWeather.ts";
import { queryForecast } from "../../httpClients/queryForecast.ts";

export const createWeatherApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    const token = ctx.configuration.openWeatherMapApiToken;

    ctx.weatherApi = {
      queryWeather: injectToken(token, queryWeather),
      queryForecast: injectToken(token, queryForecast),
    };

    return next();
  };

  return middleware;
};
