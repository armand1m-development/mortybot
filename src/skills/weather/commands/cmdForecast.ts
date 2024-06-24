import { getLogger } from "std/log/mod.ts";
import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdForecast: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const forecast = await ctx.weatherApi.queryForecast({ query });

    const firstFourEvents = forecast.list.slice(0, 4).map(
      (forecast) => {
        const hourFormat = new Intl.DateTimeFormat("pt-BR", {
          hourCycle: "h24",
          hour: "numeric",
        });

        const description = forecast.weather[0].description.toUpperCase();

        return `${
          hourFormat.format(new Date(forecast.dt_txt))
        }h - ${description}`;
      },
    );

    const message = [
      `\u{26A0} Forecast for "${query}" \u{26A0} \n`,
      ...firstFourEvents,
    ].join("\n");

    return ctx.reply(message);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(
      `Failed to find forecast data regarding your query. Try again.`,
    );
  }
};
