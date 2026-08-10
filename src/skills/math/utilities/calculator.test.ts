import { assertEquals, assertThrows } from "@std/assert";
import type { ExchangeRateResponse } from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import {
  CurrencyRatesRequiredError,
  evaluateCalculation,
  formatCalculationResult,
} from "./calculator.ts";

const calculate = (
  expression: string,
  exchangeRates?: ExchangeRateResponse,
) => formatCalculationResult(evaluateCalculation(expression, exchangeRates));

const exchangeRates: ExchangeRateResponse = {
  result: "success",
  documentation: "",
  terms_of_use: "",
  time_last_update_unix: 0,
  time_last_update_utc: "",
  time_next_update_unix: 0,
  time_next_update_utc: "",
  base_code: "USD",
  conversion_rates: {
    BRL: 5,
    EUR: 0.8,
    USD: 1,
  },
};

Deno.test("calculator observes arithmetic precedence", () => {
  assertEquals(calculate("2 + 3 * 4"), "14");
  assertEquals(calculate("2^3^2"), "512");
  assertEquals(calculate("-2^2"), "-4");
  assertEquals(calculate("(2 + 3) * 4"), "20");
  assertEquals(calculate("0.1 + 0.2"), "0.3");
});

Deno.test("calculator supports constants, functions, factorial, and percentages", () => {
  assertEquals(calculate("sqrt(81) + abs(-4)"), "13");
  assertEquals(calculate("sin(90 deg)"), "1");
  assertEquals(calculate("round(pi * 100) / 100"), "3.14");
  assertEquals(calculate("5!"), "120");
  assertEquals(calculate("50% * 10"), "5");
  assertEquals(calculate("10 % 3"), "1");
});

Deno.test("calculator converts and combines measurement units", () => {
  assertEquals(calculate("2 km + 300 m to m"), "2300.00 m");
  assertEquals(calculate("36 km/h to m/s"), "10.00 m/s");
  assertEquals(calculate("2 m * 3 m"), "6.00 m^2");
  assertEquals(calculate("1 gal to L"), "3.79 L");
});

Deno.test("calculator converts upper- and lower-case currencies", () => {
  assertEquals(calculate("10 EUR to BRL", exchangeRates), "62.50 BRL");
  assertEquals(calculate("10 eur to brl", exchangeRates), "62.50 BRL");
});

Deno.test("calculator requests exchange rates only for currency expressions", () => {
  assertThrows(
    () => evaluateCalculation("10 EUR to BRL"),
    CurrencyRatesRequiredError,
  );
  assertEquals(calculate("10 m to cm"), "1000.00 cm");
});

Deno.test("calculator rejects unsafe or incompatible expressions", () => {
  assertThrows(() => evaluateCalculation("globalThis.process.exit()"));
  assertThrows(() => evaluateCalculation("1 m + 1 kg"));
  assertThrows(() => evaluateCalculation("1 / 0"));
  assertThrows(() => evaluateCalculation("unknown(1)"));
});
