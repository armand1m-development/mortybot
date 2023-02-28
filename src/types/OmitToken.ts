// deno-lint-ignore no-explicit-any
export type OmitToken<T extends (...args: any) => any> = (
  params: Omit<Parameters<T>[0], "token">,
) => ReturnType<T>;
