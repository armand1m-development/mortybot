import { User } from "grammy/types.ts";

export interface Filter {
  filterMessage: string;
  refMessageId: string;
  ownerId: User["id"];
}

export interface FilterSessionData {
  filters: Filter[];
}
