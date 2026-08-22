export interface ProgressTickerOptions {
  intervalMs?: number;
  onTick: () => Promise<void> | void;
}

export interface ProgressTicker {
  start(): void;
  stop(): Promise<void>;
}

/**
 * Periodically invokes onTick while running. Awaiting stop() resolves only
 * after any in-flight tick has settled, so callers can safely replace the
 * message immediately after stopping.
 */
export const createProgressTicker = ({
  intervalMs = 4000,
  onTick,
}: ProgressTickerOptions): ProgressTicker => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight: Promise<void> | null = null;

  return {
    start() {
      if (timer !== null) {
        return;
      }
      timer = setInterval(() => {
        inFlight = Promise.resolve(onTick()).catch(() => {});
      }, intervalMs);
    },
    async stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      if (inFlight) {
        await inFlight;
        inFlight = null;
      }
    },
  };
};
