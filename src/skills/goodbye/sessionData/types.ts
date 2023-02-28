import { User } from "grammy/types.ts";

export interface GoodbyeMetadata {
  count: number;
  userId: User["id"];
}

export interface GoodbyeCounterSessionData {
  goodbyeCounter: Map<number, GoodbyeMetadata>;
}
