import { FetchNearbyLocationsFunction } from "../../httpClients/fetchNearbyLocations.ts";

export interface LocationsApiContext {
  locationsApi: {
    fetchNearbyLocations: FetchNearbyLocationsFunction;
  };
}
