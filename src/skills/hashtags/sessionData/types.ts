import type { User } from "grammy/types.ts";

export interface HashtagChannel {
  hashtag: string;
  participants: User["id"][];
}

export interface HashtagChannelSessionData {
  hashtagChannels: Map<string, HashtagChannel>;
}
