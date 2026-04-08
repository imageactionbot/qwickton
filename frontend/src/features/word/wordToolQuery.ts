import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";

/** Map catalog `?tool=` ids to in-page section anchors on `/word`. */
const WORD_TOOL_SECTION: Record<string, string> = {
  "word-to-pdf": "word-studio",
  "docx-to-pdf": "word-studio",
  "microsoft-word-pdf": "word-studio",
  "document-docx-pdf": "word-studio",
  "office-word-convert-pdf": "word-studio",
  "docx-preview": "word-studio",
  "docx-html-preview": "word-studio",
  "docx-text-extract": "word-extract",
  "extract-docx-text": "word-extract",
  "docx-plain-text": "word-extract",
  "document-content-reader": "word-extract",
  "dcr-docx": "word-extract",
  "microsoft-word-text": "word-extract",
  "legacy-doc-help": "word-doc-legacy",
  "doc-vs-docx": "word-doc-legacy",
  "old-word-doc-file": "word-doc-legacy",
  "google-docs-save-docx": "word-studio",
  "resume-docx-to-pdf": "word-studio",
  "contract-docx-preview": "word-studio",
  "report-docx-print-pdf": "word-studio",
  "assignment-docx-convert": "word-studio",
};

export function scrollWordCatalogToolIntoView(searchParams: URLSearchParams): void {
  const raw = searchParams.get("tool");
  if (!raw) return;
  const sectionId = WORD_TOOL_SECTION[raw];
  if (!sectionId) return;
  if (sectionId === "word-studio") {
    scrollToIdBelowStickyHeaderAfterPaint("qwickton-tool-work");
  } else {
    scrollToIdBelowStickyHeaderAfterPaint(sectionId);
  }
}

export function getRelatedWordCatalogToolIds(excludeId: string): string[] | null {
  const sec = WORD_TOOL_SECTION[excludeId];
  if (!sec) return null;
  return Object.entries(WORD_TOOL_SECTION)
    .filter(([id, s]) => id !== excludeId && s === sec)
    .map(([id]) => id);
}
