const TELEGRAM_API_BASE = "https://api.telegram.org";
const PROGRESS_EDIT_TIMEOUT_MS = 5_000;

/**
 * Best-effort edit of the progress message. Uses a raw fetch so it bypasses
 * the bot's auto-retry middleware: a progress update that fails is simply
 * skipped, never retried, and never allowed to pile up behind the ticker.
 */
export const editProgressMessage = async (
  token: string,
  chatId: number,
  messageId: number,
  text: string,
): Promise<void> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PROGRESS_EDIT_TIMEOUT_MS,
  );
  try {
    await fetch(`${TELEGRAM_API_BASE}/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
      signal: controller.signal,
    });
  } catch {
    // Progress updates are cosmetic; ignore failures.
  } finally {
    clearTimeout(timeout);
  }
};
