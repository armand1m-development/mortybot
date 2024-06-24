import type { User } from "grammy/types.ts";
import { markdown } from "/src/utilities/formatMarkdown.ts";

export const createMemberMention = (
  user: User,
  silenced = false,
) => {
  const username = user.username ? `@${user.username}` : user.first_name;

  if (silenced) {
    return markdown.monospace(username);
  }

  return markdown.userMention(username, user.id);
};
