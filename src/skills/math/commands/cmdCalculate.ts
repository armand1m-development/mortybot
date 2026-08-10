import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { getLogger } from "@std/log";
import {
  CurrencyRatesRequiredError,
  evaluateCalculation,
  formatCalculationResult,
} from "../utilities/calculator.ts";
import { getExchangeRates } from "../utilities/exchangeRates.ts";

export const cmdCalculate: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    let result;

    try {
      result = evaluateCalculation(ctx.match);
    } catch (error) {
      if (!(error instanceof CurrencyRatesRequiredError)) {
        throw error;
      }

      const exchangeRates = await getExchangeRates(
        ctx.configuration.exchangeApiToken,
      );
      result = evaluateCalculation(ctx.match, exchangeRates);
    }

    return ctx.reply(formatCalculationResult(result));
  } catch (error) {
    getLogger().error("Received an invalid calculation expression.");
    getLogger().error(error);
    return ctx.reply(ctx.t("math.invalidExpression"));
  }
};
