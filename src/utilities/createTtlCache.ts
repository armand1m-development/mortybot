export interface TtlCacheOptions<T> {
  failureTtlMs?: number;
  ttlMs: number | ((value: T, loadedAt: number) => number);
  now?: () => number;
}

export interface TtlCache<T> {
  clear(): void;
  get(load: () => Promise<T>): Promise<T>;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface FailureEntry {
  error: unknown;
  expiresAt: number;
}

export const createTtlCache = <T>({
  failureTtlMs,
  ttlMs,
  now = Date.now,
}: TtlCacheOptions<T>): TtlCache<T> => {
  let entry: CacheEntry<T> | undefined;
  let failure: FailureEntry | undefined;
  let pendingLoad: Promise<T> | undefined;

  if (
    failureTtlMs !== undefined &&
    (!Number.isFinite(failureTtlMs) || failureTtlMs <= 0)
  ) {
    throw new RangeError("Failure-cache TTL must be a positive duration.");
  }

  const getTtlMs = (value: T, loadedAt: number) => {
    const duration = typeof ttlMs === "function"
      ? ttlMs(value, loadedAt)
      : ttlMs;

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError("Cache TTL must be a positive, finite duration.");
    }

    return duration;
  };

  return {
    clear() {
      entry = undefined;
      failure = undefined;
    },
    get(load) {
      const currentTime = now();

      if (entry && currentTime < entry.expiresAt) {
        return Promise.resolve(entry.value);
      }

      if (failure && currentTime < failure.expiresAt) {
        return Promise.reject(failure.error);
      }

      if (pendingLoad) {
        return pendingLoad;
      }

      const loadPromise = Promise.resolve()
        .then(load)
        .then((value) => {
          const loadedAt = now();
          failure = undefined;
          entry = {
            expiresAt: loadedAt + getTtlMs(value, loadedAt),
            value,
          };

          return value;
        })
        .catch((error) => {
          if (failureTtlMs !== undefined) {
            failure = {
              error,
              expiresAt: now() + failureTtlMs,
            };
          }

          throw error;
        })
        .finally(() => {
          if (pendingLoad === loadPromise) {
            pendingLoad = undefined;
          }
        });

      pendingLoad = loadPromise;
      return loadPromise;
    },
  };
};
