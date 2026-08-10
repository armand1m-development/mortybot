export interface TtlCacheOptions<T> {
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

export const createTtlCache = <T>({
  ttlMs,
  now = Date.now,
}: TtlCacheOptions<T>): TtlCache<T> => {
  let entry: CacheEntry<T> | undefined;
  let pendingLoad: Promise<T> | undefined;

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
    },
    get(load) {
      const currentTime = now();

      if (entry && currentTime < entry.expiresAt) {
        return Promise.resolve(entry.value);
      }

      if (pendingLoad) {
        return pendingLoad;
      }

      const loadPromise = Promise.resolve()
        .then(load)
        .then((value) => {
          const loadedAt = now();
          entry = {
            expiresAt: loadedAt + getTtlMs(value, loadedAt),
            value,
          };

          return value;
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
