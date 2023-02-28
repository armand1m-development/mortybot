import { User } from "grammy/types.ts";

export interface Filter {
  filterTrigger: string;
  ownerId: User["id"];
  active: boolean;
  message: {
    caption?: string;
    animation?: {
      fileId: string;
    };
    document?: {
      fileId: string;
    };
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
    voice?: {
      path: string;
      fileId: string;
    };
    sticker?: {
      fileId: string;
    };
    videoNote?: {
      fileId: string;
    };
  };
}

export interface FilterSessionData {
  filters: Map<string, Filter>;
}
