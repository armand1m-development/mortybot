import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { getLanguageLocale } from "/src/i18n/mod.ts";

export const cmdForecast: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const forecast = await ctx.weatherApi.queryForecast({
      query,
      language: ctx.language,
    });

    const firstFourEvents = forecast.list.slice(0, 4).map(
      (forecast) => {
        const hourFormat = new Intl.DateTimeFormat(
          getLanguageLocale(ctx.language),
          {
            hourCycle: "h24",
            hour: "numeric",
          },
        );

        const description = forecast.weather[0].description.toUpperCase();

        return ctx.t("weather.forecastEntry", {
          description,
          time: hourFormat.format(new Date(forecast.dt_txt)),
        });
      },
    );

    const message = [
      ctx.t("weather.forecastHeading", { query }),
      "",
      ...firstFourEvents,
    ]
      .join("\n");

    return ctx.reply(message);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("weather.forecastError"));
  }
};
