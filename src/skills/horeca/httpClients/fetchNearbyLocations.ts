import { OmitToken } from "/src/types/OmitToken.ts";

export interface FetchNearbyLocationsParams {
  token: string;
  keyword: string;
  latitude: number;
  longitude: number;
}

export const fetchNearbyLocations = async ({
  token,
  keyword,
  latitude,
  longitude,
}: FetchNearbyLocationsParams) => {
  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  );

  // https://developers.google.com/maps/documentation/places/web-service/search-nearby#PlaceSearchRequests
  endpoint.searchParams.append("location", `${latitude},${longitude}`);
  endpoint.searchParams.append("radius", "2000");
  endpoint.searchParams.append("keyword", keyword);
  endpoint.searchParams.append("opennow", "true");
  endpoint.searchParams.append("key", token);

  const response = await fetch(endpoint);
  const payload = await response.json() as FetchNearbyLocationsResponse;

  return payload;
};

export type FetchNearbyLocationsFunction = OmitToken<
  typeof fetchNearbyLocations
>;

export interface FetchNearbyLocationsResponse {
  html_attributions: unknown[];
  next_page_token: string;
  results: Result[];
  status: string;
}

export interface Result {
  business_status: string;
  geometry: Geometry;
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  opening_hours: OpeningHours;
  photos: Photo[];
  place_id: string;
  plus_code: PlusCode;
  price_level?: number;
  rating: number;
  reference: string;
  scope: string;
  types: string[];
  user_ratings_total: number;
  vicinity: string;
}

export interface Geometry {
  location: Location;
  viewport: Viewport;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Viewport {
  northeast: Northeast;
  southwest: Southwest;
}

export interface Northeast {
  lat: number;
  lng: number;
}

export interface Southwest {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  open_now: boolean;
}

export interface Photo {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
}

export interface PlusCode {
  compound_code: string;
  global_code: string;
}
