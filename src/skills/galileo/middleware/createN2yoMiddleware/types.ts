import { FetchIssPassesFunction } from "../../httpClients/fetchIssPasses.ts";

export interface N2yoApiContext {
  n2yoApi: {
    fetchIssPasses: FetchIssPassesFunction;
  };
}
