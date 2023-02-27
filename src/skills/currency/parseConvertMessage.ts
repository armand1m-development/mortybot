import { CurrencyCode } from "./httpClients/convertCurrencyValue.ts";

// Message example: 150 EUR to BRL
export const parseConvertMessage = (message: string) => {
  const regex = /^(\d+) ([A-Z]{3}) to ([A-Z]{3})$/;
  const match = message.match(regex);

  if (!match) {
    return {
      parseError: "Failed to parse message for currency conversion.",
    };
  }

  const amount = parseInt(match[1]);
  const fromCurrency = match[2] as CurrencyCode;
  const toCurrency = match[3] as CurrencyCode;

  return {
    amount,
    fromCurrency,
    toCurrency,
  };
};
