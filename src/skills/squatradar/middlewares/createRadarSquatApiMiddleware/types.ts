import type { FetchNextEventsFunction } from "/src/skills/squatradar/httpClients/fetchNextEvents.ts";

export interface RadarSquatApiContext {
  radarSquatApi: {
    fetchNextEvents: FetchNextEventsFunction;
  };
}
