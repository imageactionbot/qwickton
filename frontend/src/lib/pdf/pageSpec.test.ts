import { describe, expect, it } from "vitest";
import { parsePageIndices } from "./pageSpec";

describe("parsePageIndices", () => {
  it("parses single page and ranges (1-based)", () => {
    expect(parsePageIndices("1", 5)).toEqual([0]);
    expect(parsePageIndices("1-3", 5)).toEqual([0, 1, 2]);
    expect(parsePageIndices("5,2", 5)).toEqual([1, 4]);
  });

  it("ignores out-of-range parts", () => {
    expect(parsePageIndices("4-10", 5)).toEqual([3, 4]);
  });

  it("throws when empty or no valid pages", () => {
    expect(() => parsePageIndices("", 3)).toThrow(/Enter page range/);
    expect(() => parsePageIndices("9-12", 5)).toThrow(/No valid pages/);
  });
});
