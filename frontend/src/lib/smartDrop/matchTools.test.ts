import { describe, expect, it } from "vitest";
import { buildSmartToolGroups, classifyFile } from "./matchTools";

function mockFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("classifyFile", () => {
  it("classifies pdf by extension", () => {
    expect(classifyFile(mockFile("a.PDF", ""))).toBe("pdf");
  });
  it("classifies jpeg", () => {
    expect(classifyFile(mockFile("a.jpg", "image/jpeg"))).toBe("image");
  });
  it("classifies docx", () => {
    expect(
      classifyFile(
        mockFile("z.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      )
    ).toBe("docx");
  });
});

describe("buildSmartToolGroups", () => {
  it("returns image group for jpeg with pdf-from-image entries", () => {
    const { groups } = buildSmartToolGroups([mockFile("p.jpg", "image/jpeg")]);
    expect(groups.some((g) => g.id === "image")).toBe(true);
    const ig = groups.find((g) => g.id === "image")!;
    const paths = ig.tools.map((t) => t.path).join(" ");
    expect(paths).toContain("jpg-to-pdf");
    expect(paths).toContain("/image?");
  });
  it("excludes images-to-pdf for a single image", () => {
    const { groups } = buildSmartToolGroups([mockFile("p.jpg", "image/jpeg")]);
    const ig = groups.find((g) => g.id === "image")!;
    expect(ig.tools.some((t) => t.id === "images-to-pdf")).toBe(false);
  });
  it("includes images-to-pdf for two images", () => {
    const { groups } = buildSmartToolGroups([
      mockFile("a.jpg", "image/jpeg"),
      mockFile("b.jpg", "image/jpeg"),
    ]);
    const ig = groups.find((g) => g.id === "image")!;
    expect(ig.tools.some((t) => t.id === "images-to-pdf")).toBe(true);
  });
});
