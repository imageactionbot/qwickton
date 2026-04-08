import { describe, expect, it } from "vitest";
import { formatProcessingError, formatUserFacingMessage } from "./userFacingError";

describe("userFacingError", () => {
  it("formats encrypted PDF hints", () => {
    expect(formatUserFacingMessage(new Error("Password required to parse PDF"))).toMatch(/password-protected/i);
  });

  it("passes through page range errors", () => {
    expect(formatUserFacingMessage(new Error("No valid pages in range."))).toBe("No valid pages in range.");
  });

  it("handles AbortError", () => {
    expect(formatProcessingError(new DOMException("Aborted", "AbortError"))).toBe("Cancelled.");
  });
});
