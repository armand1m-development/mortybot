import { User } from "grammy/types.ts";

type TagName = string;

export interface TagChannel {
  tagName: TagName;
  participants: User["id"][];
}

export interface TagChannelSessionData {
  tagChannels: Map<TagName, TagChannel>;
}
