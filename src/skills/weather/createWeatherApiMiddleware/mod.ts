import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { queryWeather } from "../httpClients/queryWeather.ts";
import { queryForecast } from "../httpClients/queryForecast.ts";

export const createWeatherApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    const withToken = <T>(params: T) => ({
      ...params,
      token: ctx.configuration.openWeatherMapApiToken,
    });

    ctx.weatherApi = {
      queryWeather: (params) => queryWeather(withToken(params)),
      queryForecast: (params) => queryForecast(withToken(params)),
    };

    return next();
  };

  return middleware;
};
