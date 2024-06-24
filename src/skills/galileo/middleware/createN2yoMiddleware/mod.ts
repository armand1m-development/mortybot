import type { MiddlewareFn } from "grammy/composer.ts";

import type { BotContext } from "/src/context/mod.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { fetchIssPasses } from "../../httpClients/fetchIssPasses.ts";

export const createN2yoMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    const token = ctx.configuration.n2yoApiToken;

    ctx.n2yoApi = { fetchIssPasses: injectToken(token, fetchIssPasses) };

    return next();
  };

  return middleware;
};
