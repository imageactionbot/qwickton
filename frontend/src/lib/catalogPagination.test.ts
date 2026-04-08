import { describe, expect, it } from "vitest";
import {
  CATALOG_PAGE_SIZE,
  catalogDisplayRange,
  catalogSlicePage,
  catalogTotalPages,
} from "./catalogPagination";

describe("catalogPagination", () => {
  it("catalogTotalPages", () => {
    expect(catalogTotalPages(0, 40)).toBe(1);
    expect(catalogTotalPages(1, 40)).toBe(1);
    expect(catalogTotalPages(40, 40)).toBe(1);
    expect(catalogTotalPages(41, 40)).toBe(2);
    expect(catalogTotalPages(80, 40)).toBe(2);
    expect(catalogTotalPages(81, 40)).toBe(3);
  });

  it("catalogSlicePage clamps page and slices", () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    expect(catalogSlicePage(items, 1, 40)).toHaveLength(40);
    expect(catalogSlicePage(items, 2, 40)).toHaveLength(5);
    expect(catalogSlicePage(items, 999, 40)).toHaveLength(5);
    expect(catalogSlicePage(items, 0, 40)[0]).toBe(0);
  });

  it("catalogDisplayRange", () => {
    expect(catalogDisplayRange(1, 0, 40)).toEqual({ from: 0, to: 0 });
    expect(catalogDisplayRange(1, 45, 40)).toEqual({ from: 1, to: 40 });
    expect(catalogDisplayRange(2, 45, 40)).toEqual({ from: 41, to: 45 });
    expect(catalogDisplayRange(99, 45, 40)).toEqual({ from: 41, to: 45 });
  });

  it("default page size constant", () => {
    expect(CATALOG_PAGE_SIZE).toBeGreaterThan(0);
  });
});
