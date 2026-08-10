import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdTemperature: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const { main: { temp, feels_like } } = await ctx.weatherApi.queryWeather({
      query,
      language: ctx.language,
    });
    return ctx.reply(ctx.t("weather.temperature", {
      feelsLike: feels_like,
      query,
      temperature: temp,
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("weather.temperatureError"));
  }
};
