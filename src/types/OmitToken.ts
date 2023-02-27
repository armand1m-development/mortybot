export type OmitToken<T extends (...args: any) => any> = (
  params: Omit<Parameters<T>[0], "token">,
) => ReturnType<T>;
