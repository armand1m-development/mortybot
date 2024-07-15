export interface FetchNextEvents {
  city: string;
}

export const fetchNextEvents = async ({ city }: FetchNextEvents) => {
  const endpoint = new URL(
    "https://radar.squat.net/api/1.2/search/events.json",
  );
  endpoint.searchParams.append("facets[city][]", city);
  endpoint.searchParams.append("limit", "50");
  endpoint.searchParams.append(
    "fields",
    "title,url,uuid,image,category,body,date_time,offline",
  );

  const response = await fetch(endpoint);
  const payload = (await response.json()) as FetchNextEventsResponse;

  return payload;
};

export type FetchNextEventsFunction = typeof fetchNextEvents;

export interface FetchNextEventsResponse {
  result: Result;
  count: number;
}

export type Result = Record<string, EventEntry>;

export interface EventEntry {
  body: Body;
  category: Category[];
  date_time: DateTime[];
  image: unknown[];
  offline: Offline[];
  title: string;
  url: string;
  uuid: string;
}

export interface Body {
  value: string;
  summary: string;
  format: string;
}

export interface Category {
  uri: string;
  id: string;
  resource: string;
  name: string;
}

export interface DateTime {
  value: string;
  value2: string;
  duration: number;
  time_start: string;
  time_end: string;
  rrule?: string;
}

export interface Offline {
  uri: string;
  id: string;
  resource: string;
  title: string;
}
