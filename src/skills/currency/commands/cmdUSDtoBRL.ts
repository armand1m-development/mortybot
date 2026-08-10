import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdUSDtoBRL: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const convertedValue = await ctx.currencyApi.convertCurrencyValue({
      amount: 1,
      fromCurrency: "USD",
      toCurrency: "BRL",
    });

    return ctx.reply(ctx.t("currency.result", {
      amount: 1,
      currency: "USD",
      value: convertedValue,
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("currency.error"));
  }
};
