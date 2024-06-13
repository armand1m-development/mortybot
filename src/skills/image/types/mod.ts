import * as queryString from "querystring";

export interface CommandInput {
  templateId: string;
  texts: queryString.ParsedQuery;
}
