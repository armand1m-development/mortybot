import { Context, SessionFlavor } from "grammy/mod.ts";
import { ConfigurationContext } from "/src/skills/platform/configuration/types.ts";
import { CurrencyApiContext } from "/src/skills/currency/createCurrencyApiMiddleware/types.ts";
import { FilterSessionData } from "/src/skills/filters/types.ts";

export type SessionData = FilterSessionData;

export type BotContext =
  & Context
  & CurrencyApiContext
  & ConfigurationContext
  & SessionFlavor<SessionData>;
