import { describe, expect, it } from "vitest";
import { parsePdfToolQuery } from "./pdfToolQuery";

describe("parsePdfToolQuery", () => {
  it("maps merge alias", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=merge-pdf"))).toEqual({ action: "merge" });
  });

  it("maps split with half", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=split-pdf-second-half"))).toEqual({
      action: "split",
      splitHalf: "second",
    });
  });

  it("returns null for unknown tool", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=unknown"))).toBeNull();
  });

  it("maps mobile-oriented catalog ids", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=iphone-pdf-join"))).toEqual({ action: "merge" });
    expect(parsePdfToolQuery(new URLSearchParams("tool=photo-album-pdf"))).toEqual({ action: "jpg-to-pdf" });
    expect(parsePdfToolQuery(new URLSearchParams("tool=whatsapp-doc-pdf"))).toEqual({ action: "merge" });
  });

  it("maps extended catalog synonyms", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=pdf-re-export"))).toEqual({ action: "resave-pdf" });
    expect(parsePdfToolQuery(new URLSearchParams("tool=turn-pages-right"))).toEqual({
      action: "rotate",
      rotationQuarterTurns: 1,
    });
    expect(parsePdfToolQuery(new URLSearchParams("tool=esign-text-pdf"))).toEqual({ action: "sign-pdf" });
  });

  it("maps editor and metadata catalog ids", () => {
    expect(parsePdfToolQuery(new URLSearchParams("tool=add-text-to-pdf"))).toEqual({ action: "text-overlay" });
    expect(parsePdfToolQuery(new URLSearchParams("tool=strip-pdf-metadata"))).toEqual({ action: "metadata-clean" });
  });
});
