import { CurrencyCode } from "../httpClients/convertCurrencyValue.ts";

// Message example: 150 EUR to BRL
export const parseConvertMessage = (message: string) => {
  const regex = /^(\d+) ([a-zA-Z]{3}) to ([a-zA-Z]{3})$/;
  const match = message.match(regex);

  if (!match) {
    return {
      parseError: "Failed to parse message for currency conversion.",
    };
  }

  const amount = parseInt(match[1]);
  const fromCurrency = match[2].toUpperCase() as CurrencyCode;
  const toCurrency = match[3].toUpperCase() as CurrencyCode;

  return {
    amount,
    fromCurrency,
    toCurrency,
  };
};
