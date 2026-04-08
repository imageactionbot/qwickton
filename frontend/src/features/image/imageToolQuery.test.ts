import { describe, expect, it } from "vitest";
import { parseImageToolQuery } from "./imageToolQuery";

describe("parseImageToolQuery", () => {
  it("sets flip flags for catalog synonyms", () => {
    expect(parseImageToolQuery(new URLSearchParams("tool=vertical-flip-photo"))).toEqual({
      action: "rotate-flip",
      rotateQuarter: 0,
      flipH: false,
      flipV: true,
    });
  });

  it("sets 180° rotation for upside-down helper ids", () => {
    expect(parseImageToolQuery(new URLSearchParams("tool=fix-upside-down-photo"))).toEqual({
      action: "rotate-flip",
      rotateQuarter: 2,
      flipH: false,
      flipV: false,
    });
    expect(parseImageToolQuery(new URLSearchParams("tool=rotate-image-180"))?.rotateQuarter).toBe(2);
  });

  it("maps extended compress alias", () => {
    expect(parseImageToolQuery(new URLSearchParams("tool=optimize-jpeg"))?.action).toBe("compress");
  });
});
