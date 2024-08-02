import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { markdown } from "/src/utilities/formatMarkdown.ts";
import { EventEntry } from "/src/skills/squatradar/httpClients/fetchNextEvents.ts";

export const cmdGetNextSquatEvents: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const city = ctx.match;
  const events = await ctx.radarSquatApi.fetchNextEvents({ city });

  const byCategory = Object.values(events.result).reduce(
    (acc, event) => {
      const category = event.category.length > 0
        ? event.category[0].name
        : "nocategory";

      return {
        ...acc,
        [category]: acc[category] ? [...acc[category], event] : [event],
      };
    },
    {} as Record<string, EventEntry[]>,
  );

  const eventEntries = Object.entries(byCategory).map(([category, events]) => {
    const allEvents = events
      .sort((a, b) => {
        const dateA = new Date(a.date_time[0].time_start);
        const dateB = new Date(b.date_time[0].time_start);
        return dateA.getTime() - dateB.getTime();
      })
      .map((event) => {
        const date = new Date(event.date_time[0].time_start);
        const formattedDate = new Intl.DateTimeFormat("en-GB", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Europe/Amsterdam",
        }).format(date);
        return `- (${formattedDate}) ${markdown.url(event.title, event.url)}`;
      });

    return `${markdown.bold(category)}:\n\n`.concat(allEvents.join("\n"));
  });

  const response = eventEntries.join("\n\n");

  return ctx.reply(response, {
    parse_mode: "Markdown",
  });
};
