export type PdfAction =
  | "merge"
  | "split"
  | "rotate"
  | "watermark"
  | "page-numbers"
  | "jpg-to-pdf"
  | "scan-to-pdf"
  | "sign-pdf"
  | "extract-pages"
  | "remove-pages"
  | "resave-pdf"
  | "text-overlay"
  | "metadata-clean";

export type PdfToolLinkState = {
  action: PdfAction;
  splitHalf?: "first" | "second";
  rotationQuarterTurns?: number;
};
