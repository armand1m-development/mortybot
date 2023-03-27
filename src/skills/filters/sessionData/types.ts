import { MessageEntity, User } from "grammy/types.ts";

export interface SpoilerOffsets {
  offset: number;
  length: number;
}

export interface Filter {
  isLoud: boolean;
  filterTrigger: string;
  ownerId: User["id"];
  active: boolean;
  message: {
    caption?: string;
    captionEntities?: MessageEntity[];
    animation?: {
      fileId: string;
    };
    document?: {
      fileId: string;
    };
    image?: {
      path?: string;
      fileId: string;
    };
    video?: {
      path?: string;
      fileId: string;
    };
    audio?: {
      path?: string;
      fileId: string;
    };
    voice?: {
      path?: string;
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
