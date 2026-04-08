import type { PdfToolLinkState } from "./pdfTypes";

/** Every `tool` id used in `/pdf?tool=` from `toolCatalog.ts`. */
const PDF_TOOL_MAP: Record<string, PdfToolLinkState> = {
  "merge-pdf": { action: "merge" },
  "combine-pdf": { action: "merge" },
  "join-pdf": { action: "merge" },
  "append-pdf-pages": { action: "merge" },
  "split-pdf": { action: "split", splitHalf: "first" },
  "split-pdf-first-half": { action: "split", splitHalf: "first" },
  "split-pdf-second-half": { action: "split", splitHalf: "second" },
  "rotate-pdf": { action: "rotate", rotationQuarterTurns: 1 },
  "rotate-pdf-90": { action: "rotate", rotationQuarterTurns: 1 },
  "rotate-pdf-180": { action: "rotate", rotationQuarterTurns: 2 },
  "rotate-pdf-270": { action: "rotate", rotationQuarterTurns: 3 },
  "watermark-pdf": { action: "watermark" },
  "stamp-watermark-pdf": { action: "watermark" },
  "page-numbers-pdf": { action: "page-numbers" },
  "footer-numbers-pdf": { action: "page-numbers" },
  "sign-pdf": { action: "sign-pdf" },
  "text-signature-pdf": { action: "sign-pdf" },
  "jpg-to-pdf": { action: "jpg-to-pdf" },
  "png-to-pdf": { action: "jpg-to-pdf" },
  "images-to-pdf": { action: "jpg-to-pdf" },
  "scan-to-pdf": { action: "scan-to-pdf" },
  "high-contrast-pdf-scan": { action: "scan-to-pdf" },
  "extract-pdf-pages": { action: "extract-pages" },
  "save-pdf-page-range": { action: "extract-pages" },
  "remove-pdf-pages": { action: "remove-pages" },
  "delete-pdf-pages": { action: "remove-pages" },
  "resave-pdf": { action: "resave-pdf" },
  "fix-pdf-structure": { action: "resave-pdf" },
  "repair-pdf-file": { action: "resave-pdf" },
  "organize-pdf-rotation": { action: "rotate", rotationQuarterTurns: 1 },
  "iphone-pdf-join": { action: "merge" },
  "photo-album-pdf": { action: "jpg-to-pdf" },
  "whatsapp-doc-pdf": { action: "merge" },
  "pdf-re-export": { action: "resave-pdf" },
  "pdf-linearize-fix": { action: "resave-pdf" },
  "repair-export-pdf": { action: "resave-pdf" },
  "merge-scanned-documents": { action: "merge" },
  "bundle-pdf-files": { action: "merge" },
  "split-document-half": { action: "split", splitHalf: "first" },
  "divide-pdf-two-parts": { action: "split", splitHalf: "second" },
  "turn-pages-right": { action: "rotate", rotationQuarterTurns: 1 },
  "turn-pages-upside-down": { action: "rotate", rotationQuarterTurns: 2 },
  "turn-pages-left": { action: "rotate", rotationQuarterTurns: 3 },
  "draft-watermark-pdf": { action: "watermark" },
  "confidential-stamp-pdf": { action: "watermark" },
  "paginate-document-pdf": { action: "page-numbers" },
  "esign-text-pdf": { action: "sign-pdf" },
  "autograph-pdf": { action: "sign-pdf" },
  "camera-photos-to-pdf": { action: "jpg-to-pdf" },
  "scan-receipt-to-pdf": { action: "scan-to-pdf" },
  "whiteboard-photo-to-pdf": { action: "scan-to-pdf" },
  "pull-pdf-page-range": { action: "extract-pages" },
  "drop-pdf-page-range": { action: "remove-pages" },
  "add-text-to-pdf": { action: "text-overlay" },
  "pdf-text-overlay": { action: "text-overlay" },
  "edit-pdf-add-text": { action: "text-overlay" },
  "strip-pdf-metadata": { action: "metadata-clean" },
  "remove-pdf-metadata": { action: "metadata-clean" },
  "clean-pdf-properties": { action: "metadata-clean" },
};

export function parsePdfToolQuery(searchParams: URLSearchParams): PdfToolLinkState | null {
  const raw = searchParams.get("tool");
  if (!raw) return null;
  return PDF_TOOL_MAP[raw] ?? null;
}

/** Catalog tool ids that share the same underlying PDF action (for related-tool suggestions). */
export function getRelatedPdfCatalogToolIds(excludeId: string): string[] | null {
  const state = PDF_TOOL_MAP[excludeId];
  if (!state) return null;
  return Object.entries(PDF_TOOL_MAP)
    .filter(([id, s]) => id !== excludeId && s.action === state.action)
    .map(([id]) => id);
}
