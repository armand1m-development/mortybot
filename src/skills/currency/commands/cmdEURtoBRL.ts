import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdEURtoBRL: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const convertedValue = await ctx.currencyApi.convertCurrencyValue({
      amount: 1,
      fromCurrency: "EUR",
      toCurrency: "BRL",
    });

    return ctx.reply(ctx.t("currency.result", {
      amount: 1,
      currency: "EUR",
      value: convertedValue,
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("currency.error"));
  }
};
