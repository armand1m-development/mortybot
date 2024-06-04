import { MessageEntity, User } from "grammy/types.ts";

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

export interface Audio {
  id: string;
  name: string;
  file_hash: string;
  file_name: string;
  extension: string;
  tag_names: string[];
}

export interface FilterSettings {
  caseSensitive: boolean;
}

export interface FilterSessionData {
  filters: Map<string, Filter>;
  audioDatabase?: Audio[];
  filterSettings: FilterSettings;
}
