import type { User } from "grammy/types";

export interface GoodbyeMetadata {
  count: number;
  user: User;
  /**
   * @deprecated Don't use this property. Prefer user.id instead.
   */
  userId: User["id"];
}

export interface GoodbyeCounterSessionData {
  goodbyeCounter: Map<number, GoodbyeMetadata>;
}
