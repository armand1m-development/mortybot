export const injectToken =
  <T extends (...args: any) => any>(token: string, fn: T) =>
  (params: Omit<Parameters<T>[0], "token">) =>
    fn({
      ...params,
      token,
    });
