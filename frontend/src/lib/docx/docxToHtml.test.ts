import { describe, expect, it } from "vitest";
import { convertDocxToHtml, extractDocxRawText, sanitizeDocxHtml } from "./docxToHtml";

describe("sanitizeDocxHtml", () => {
  it("strips script tags", () => {
    const dirty = `<p>Hi</p><script>alert(1)</script><p>Bye</p>`;
    expect(sanitizeDocxHtml(dirty)).not.toMatch(/script/i);
    expect(sanitizeDocxHtml(dirty)).toContain("Hi");
  });
});

describe("convertDocxToHtml", () => {
  it("rejects non-ZIP buffer before calling parser", async () => {
    const garbage = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer;
    await expect(convertDocxToHtml(garbage)).rejects.toThrow(/not a valid DOCX/i);
  });

  it("rejects empty buffer", async () => {
    await expect(convertDocxToHtml(new ArrayBuffer(0))).rejects.toThrow(/empty/i);
  });
});

describe("extractDocxRawText", () => {
  it("rejects non-ZIP buffer", async () => {
    const garbage = new Uint8Array([9, 9, 9, 9]).buffer;
    await expect(extractDocxRawText(garbage)).rejects.toThrow(/not a valid DOCX/i);
  });
});
