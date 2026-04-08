import { afterEach, describe, expect, it, vi } from "vitest";
import { sendSafeAnalytics, sendTextToolAnalytics, shouldEmitTextAnalytics } from "./analytics";

describe("analytics", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shouldEmitTextAnalytics rate-limits rapid repeats", () => {
    vi.useFakeTimers();
    expect(shouldEmitTextAnalytics("lines-trim")).toBe(true);
    expect(shouldEmitTextAnalytics("lines-trim")).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(shouldEmitTextAnalytics("lines-trim")).toBe(true);
    vi.useRealTimers();
  });

  it("sendTextToolAnalytics skips when throttled", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await sendTextToolAnalytics({ event: "process_text", tool: "x", success: true });
    await sendTextToolAnalytics({ event: "process_text", tool: "x", success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("sendSafeAnalytics always attempts fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await sendSafeAnalytics({ event: "process_pdf", tool: "merge", success: true, bytesIn: 100 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
