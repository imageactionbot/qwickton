import { TOOL_CATALOG, type ToolEntry } from "../../app/toolCatalog";
import { parsePdfToolQuery } from "../../features/pdf/pdfToolQuery";

export type ClassifiedKind = "image" | "pdf" | "docx" | "spreadsheet" | "csv" | "text" | "unknown";

export function classifyFile(file: File): ClassifiedKind {
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  const mime = (file.type || "").toLowerCase();

  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (ext === "heic" || ext === "heif") return "image";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return "docx";
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    return "spreadsheet";
  }
  if (mime === "text/csv" || ext === "csv") return "csv";
  if (mime.startsWith("text/") || ext === "txt" || ext === "md") return "text";
  if (ext === "json") return "text";
  return "unknown";
}

function pathSearchParams(path: string): URLSearchParams {
  const i = path.indexOf("?");
  return new URLSearchParams(i >= 0 ? path.slice(i + 1) : "");
}

function pdfToolUsesRasterInput(entry: ToolEntry): boolean {
  if (entry.category !== "pdf") return false;
  const parsed = parsePdfToolQuery(pathSearchParams(entry.path));
  return parsed?.action === "jpg-to-pdf" || parsed?.action === "scan-to-pdf";
}

function pdfToolUsesPdfDocuments(entry: ToolEntry): boolean {
  if (entry.category !== "pdf") return false;
  const parsed = parsePdfToolQuery(pathSearchParams(entry.path));
  if (!parsed) return true;
  return parsed.action !== "jpg-to-pdf" && parsed.action !== "scan-to-pdf";
}

function dedupeByPath(tools: ToolEntry[]): ToolEntry[] {
  const seen = new Set<string>();
  const out: ToolEntry[] = [];
  for (const t of tools) {
    if (seen.has(t.path)) continue;
    seen.add(t.path);
    out.push(t);
  }
  return out;
}

const TEXT_PRIORITY_IDS = new Set([
  "word-count",
  "stats-text",
  "json-pretty",
  "json-minify",
  "validate-json",
  "slugify",
  "trim-lines",
]);

function sortByTitle(tools: ToolEntry[]): ToolEntry[] {
  return [...tools].sort((a, b) => a.title.localeCompare(b.title));
}

export type SmartToolGroup = {
  id: string;
  label: string;
  files: File[];
  tools: ToolEntry[];
};

function partitionByKind(files: File[]): Map<ClassifiedKind, File[]> {
  const map = new Map<ClassifiedKind, File[]>();
  for (const f of files) {
    const k = classifyFile(f);
    const arr = map.get(k) ?? [];
    arr.push(f);
    map.set(k, arr);
  }
  return map;
}

function summaryForPartition(files: File[], parts: Map<ClassifiedKind, File[]>): string {
  const kinds = [...parts.keys()].filter((k) => k !== "unknown");
  if (parts.has("unknown") && kinds.length === 0) {
    return "Could not match these files to a supported category.";
  }
  if (kinds.length === 1) {
    const k = kinds[0];
    const n = files.length;
    const kindLabel =
      k === "image"
        ? "Image"
        : k === "pdf"
          ? "PDF"
          : k === "docx"
            ? "Word DOCX"
            : k === "spreadsheet"
              ? "Spreadsheet"
              : k === "csv"
                ? "CSV"
                : k === "text"
                  ? "Text"
                  : "File";
    if (n === 1) return `Detected: ${kindLabel} · ${files[0].name}`;
    return `Detected: ${n} ${kindLabel} files`;
  }
  const bits = [...parts.entries()]
    .filter(([k]) => k !== "unknown")
    .map(([k, arr]) => `${arr.length}× ${k}`)
    .join(", ");
  return `Mixed selection · ${bits}`;
}

export function buildSmartToolGroups(files: File[]): { summary: string; groups: SmartToolGroup[] } {
  if (!files.length) return { summary: "", groups: [] };

  const parts = partitionByKind(files);
  const summary = summaryForPartition(files, parts);
  const groups: SmartToolGroup[] = [];

  const unknownOnly = parts.size === 1 && parts.has("unknown");
  if (unknownOnly) {
    return { summary, groups: [] };
  }

  const push = (id: string, label: string, bucket: File[], tools: ToolEntry[]) => {
    const deduped = dedupeByPath(sortByTitle(tools));
    if (!deduped.length || !bucket.length) return;
    groups.push({ id, label, files: bucket, tools: deduped });
  };

  if (parts.has("image")) {
    const bucket = parts.get("image")!;
    const multi = bucket.length > 1;
    let imageTools = TOOL_CATALOG.filter((t) => t.category === "image");
    if (!multi) {
      imageTools = imageTools.filter((t) => t.id !== "batch-image-process");
    }
    let pdfFromImage = TOOL_CATALOG.filter(pdfToolUsesRasterInput);
    if (!multi) {
      pdfFromImage = pdfFromImage.filter((t) => t.id !== "images-to-pdf");
    }
    const bg = TOOL_CATALOG.filter((t) => t.category === "background");
    const pass = TOOL_CATALOG.filter((t) => t.category === "passport");
    const conv = TOOL_CATALOG.filter((t) => t.category === "converter" && t.path.includes("tab=image"));
    const merged = [...imageTools, ...pdfFromImage, ...bg, ...pass, ...conv];
    push("image", multi ? `Photos & images (${bucket.length} files)` : "Photos & images", bucket, merged);
  }

  if (parts.has("pdf")) {
    const bucket = parts.get("pdf")!;
    const pdfTools = TOOL_CATALOG.filter(pdfToolUsesPdfDocuments);
    push(
      "pdf",
      bucket.length > 1 ? `PDF documents (${bucket.length} files)` : "PDF documents",
      bucket,
      pdfTools
    );
  }

  if (parts.has("docx")) {
    const bucket = parts.get("docx")!;
    push("docx", "Word DOCX", bucket, TOOL_CATALOG.filter((t) => t.category === "word"));
  }

  if (parts.has("spreadsheet")) {
    const bucket = parts.get("spreadsheet")!;
    push(
      "sheet",
      "Excel / spreadsheets",
      bucket,
      TOOL_CATALOG.filter((t) => t.category === "converter" && t.path.includes("tab=excel"))
    );
  }

  if (parts.has("csv")) {
    const bucket = parts.get("csv")!;
    push(
      "csv",
      "CSV files",
      bucket,
      TOOL_CATALOG.filter((t) => t.category === "converter" && t.path.includes("tab=csv"))
    );
  }

  if (parts.has("text")) {
    const bucket = parts.get("text")!;
    const prioritized = TOOL_CATALOG.filter((t) => t.category === "text" && TEXT_PRIORITY_IDS.has(t.id));
    const rest = TOOL_CATALOG.filter((t) => t.category === "text" && !TEXT_PRIORITY_IDS.has(t.id));
    const ordered = [...sortByTitle(prioritized), ...sortByTitle(rest)];
    push("text", "Text & JSON utilities", bucket, ordered);
  }

  return { summary, groups };
}
