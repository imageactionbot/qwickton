import { describe, expect, it } from "vitest";
import type { ToolEntry } from "../app/toolCatalog";
import {
  fuzzyRank,
  levenshtein,
  rankToolEntriesWithScores,
  sortToolEntriesByFuzzy,
  sortToolsByFuzzy,
  suggestQueryCorrection,
  wordMatchScore,
} from "./fuzzyRank";

describe("fuzzyRank", () => {
  it("returns 0 when characters are missing in order", () => {
    expect(fuzzyRank("xyz", "merge pdf")).toBe(0);
  });

  it("scores higher for contiguous matches", () => {
    const a = fuzzyRank("merge", "Merge PDF");
    const b = fuzzyRank("merge", "M e r g e PDF extra");
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(a).toBeGreaterThanOrEqual(b);
  });
});

describe("typo-tolerant ranking", () => {
  it("levenshtein matches expectations", () => {
    expect(levenshtein("mearge", "merge")).toBe(1);
    expect(levenshtein("pasport", "passport")).toBe(1);
  });

  it("wordMatchScore prefers near matches", () => {
    expect(wordMatchScore("mearge", "merge")).toBeGreaterThan(100);
    expect(wordMatchScore("xyz123", "merge")).toBe(0);
  });

  it("surfaces merge PDF for common typo via token similarity", () => {
    const tools: ToolEntry[] = [
      {
        id: "merge-pdf",
        category: "pdf",
        title: "Merge PDF",
        path: "/pdf?tool=merge-pdf",
        description: "Combine multiple PDF files locally.",
        aliases: ["join pdf", "combine"],
      },
      {
        id: "other",
        category: "text",
        title: "Zebra clip",
        path: "/text?tool=other",
        description: "Unrelated",
      },
    ];
    const r = sortToolEntriesByFuzzy(tools, "mearge");
    expect(r[0]?.id).toBe("merge-pdf");
    const ranked = rankToolEntriesWithScores(tools, "mearge");
    expect(ranked[0]?.entry.id).toBe("merge-pdf");
    expect(ranked[0]?.score ?? 0).toBeGreaterThan(0);
  });

  it("suggestQueryCorrection offers a working alternate query", () => {
    const tools: ToolEntry[] = [
      {
        id: "merge-pdf",
        category: "pdf",
        title: "Merge PDF",
        path: "/pdf?tool=merge-pdf",
        description: "Combine PDFs",
        aliases: ["join"],
      },
    ];
    expect(suggestQueryCorrection("mearge", tools)).toBe("merge");
  });
});

describe("sortToolsByFuzzy", () => {
  const items = [
    { title: "Zebra export", category: "pdf" },
    { title: "Merge PDF", category: "pdf" },
    { title: "PNG to PDF", category: "pdf" },
  ];

  it("returns alphabetically when query empty (capped)", () => {
    const r = sortToolsByFuzzy(items, "");
    expect(r[0].title).toBe("Merge PDF");
    expect(r.length).toBe(3);
  });

  it("ranks merge ahead for mrg-like query when possible", () => {
    const big = Array.from({ length: 100 }, (_, i) => ({
      title: `Tool ${i}`,
      category: "pdf",
    }));
    big.push({ title: "Merge PDF", category: "pdf" });
    const r = sortToolsByFuzzy(big, "merge");
    expect(r[0].title).toBe("Merge PDF");
  });
});

describe("sortToolEntriesByFuzzy", () => {
  const tools: ToolEntry[] = [
    {
      id: "a",
      category: "pdf",
      title: "Zebra stamp",
      path: "/pdf?tool=a",
      description: "Unrelated pdf workflow",
    },
    {
      id: "merge-pdf",
      category: "pdf",
      title: "Merge PDF",
      path: "/pdf?tool=merge-pdf",
      description: "Combine files",
      aliases: ["combine pdfs", "join pdf"],
    },
  ];

  it("matches via aliases not present in title", () => {
    const r = sortToolEntriesByFuzzy(tools, "join");
    expect(r[0].id).toBe("merge-pdf");
  });

  it("returns alphabetical slice when query empty", () => {
    const r = sortToolEntriesByFuzzy(tools, "");
    expect(r.map((t) => t.id)).toEqual(["merge-pdf", "a"]);
  });
});
