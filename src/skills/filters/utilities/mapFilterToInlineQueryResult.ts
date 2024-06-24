import type { InlineQueryResult } from "grammy/types.ts";
import type { Filter } from "../sessionData/types.ts";

export const mapFilterToInlineQueryResult = (
  filter: Filter,
): InlineQueryResult => ({
  type: "article",
  id: crypto.randomUUID(),
  title: filter.filterTrigger,
  input_message_content: {
    message_text: filter.filterTrigger,
    entities: filter.message.captionEntities,
  },
});
