import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollWordCatalogToolIntoView } from "./wordToolQuery";
import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";

vi.mock("../../lib/dom/scrollBelowStickyHeader", () => ({
  scrollToIdBelowStickyHeaderAfterPaint: vi.fn(),
}));

afterEach(() => {
  vi.mocked(scrollToIdBelowStickyHeaderAfterPaint).mockClear();
});

describe("scrollWordCatalogToolIntoView", () => {
  it("scrolls when tool maps to studio (drop zone)", () => {
    scrollWordCatalogToolIntoView(new URLSearchParams("tool=word-to-pdf"));

    expect(scrollToIdBelowStickyHeaderAfterPaint).toHaveBeenCalledWith("qwickton-tool-work");
  });

  it("scrolls when tool maps to extract section", () => {
    scrollWordCatalogToolIntoView(new URLSearchParams("tool=docx-text-extract"));

    expect(scrollToIdBelowStickyHeaderAfterPaint).toHaveBeenCalledWith("word-extract");
  });
});
