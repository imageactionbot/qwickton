export type SafeAnalyticsPayload = {
  event: string;
  tool: string;
  durationMs?: number;
  success?: boolean;
  /** Total input size when meaningful (e.g. sum of files). */
  bytesIn?: number;
  /** Output blob size when meaningful. */
  bytesOut?: number;
  /** PDF page count when known. */
  pageCount?: number;
};

const textAnalyticsLastAt = new Map<string, number>();
const TEXT_MIN_INTERVAL_MS = 1500;

/** Rate-limit noisy text-tool clicks (per tool id). Returns false if skipped. */
export function shouldEmitTextAnalytics(tool: string): boolean {
  const now = Date.now();
  const last = textAnalyticsLastAt.get(tool) ?? 0;
  if (now - last < TEXT_MIN_INTERVAL_MS) return false;
  textAnalyticsLastAt.set(tool, now);
  return true;
}

export async function sendSafeAnalytics(payload: SafeAnalyticsPayload): Promise<void> {
  try {
    await fetch("/tools/api/analytics-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking by design.
  }
}

/** Like sendSafeAnalytics but applies client cooldown for process_text events. */
export async function sendTextToolAnalytics(payload: SafeAnalyticsPayload): Promise<void> {
  if (payload.event === "process_text" && !shouldEmitTextAnalytics(payload.tool)) {
    return;
  }
  return sendSafeAnalytics(payload);
}
