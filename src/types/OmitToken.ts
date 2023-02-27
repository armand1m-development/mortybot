import { NoToken } from "./NoToken.ts";

export type OmitToken<T extends (...args: any) => any> = (
  params: NoToken<Parameters<T>[0]>,
) => ReturnType<T>;
