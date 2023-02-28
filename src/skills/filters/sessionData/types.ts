import { User } from "grammy/types.ts";

export interface Filter {
  filterTrigger: string;
  ownerId: User["id"];
  message: {
    caption?: string;
    image?: {
      path: string;
      fileId: string;
    };
    video?: {
      path: string;
      fileId: string;
    };
    audio?: {
      path: string;
      fileId: string;
    };
  };
}

export interface FilterSessionData {
  filters: Map<string, Filter>;
}
