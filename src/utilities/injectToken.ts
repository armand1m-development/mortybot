/**
 * This function injects the token value in the bag
 * of parameters in a function by currying it.
 *
 * You can see examples of this function usage through
 * many skills middlewares.
 *
 * @param token Token value
 * @param fn function to be curried
 * @returns curried function with token injected
 */
export const injectToken =
  // deno-lint-ignore no-explicit-any
  <T extends (...args: any) => any>(token: string, fn: T) =>
  (params: Omit<Parameters<T>[0], "token">) =>
    fn({
      ...params,
      token,
    });
