import type { ImageAction } from "./imageTypes";

const IMAGE_TOOL_MAP: Record<string, ImageAction> = {
  "compress-image": "compress",
  "shrink-jpg": "compress",
  "resize-image": "resize",
  "convert-webp": "convert",
  "image-to-webp": "convert",
  "document-scan": "document-scan",
  "form-scan-image": "document-scan",
  "school-document-scan": "document-scan",
  "auto-enhance": "auto-enhance",
  "photo-enhance-local": "auto-enhance",
  "compress-to-size": "compress-to-size",
  "target-kb-compress": "compress-to-size",
  "rotate-flip": "rotate-flip",
  "rotate-photo": "rotate-flip",
  "flip-horizontal": "rotate-flip",
  "flip-vertical": "rotate-flip",
  "mirror-image": "rotate-flip",
  "batch-image-process": "compress",
  "quick-compress-upload": "compress",
  "id-card-scan-look": "document-scan",
  "iphone-photo-compress": "compress",
  "screenshot-compress": "compress",
  "whatsapp-status-compress": "compress",
  "optimize-jpeg": "compress",
  "shrink-photo-file": "compress",
  "email-attachment-compress": "compress",
  "jpeg-quality-reduce": "compress",
  "half-size-image": "resize",
  "thumbnail-resize": "resize",
  "png-to-webp-convert": "convert",
  "jpeg-to-webp-convert": "convert",
  "format-convert-image": "convert",
  "receipt-scan-look": "document-scan",
  "invoice-scan-mode": "document-scan",
  "brighten-scan-colors": "auto-enhance",
  "fix-underexposed-photo": "auto-enhance",
  "form-upload-kb-limit": "compress-to-size",
  "rotate-image-180": "rotate-flip",
  "fix-upside-down-photo": "rotate-flip",
  "vertical-flip-photo": "rotate-flip",
};

export type ImageToolLinkState = {
  action: ImageAction;
  rotateQuarter: number;
  flipH: boolean;
  flipV: boolean;
};

/** Catalog tool ids that share the same underlying image action. */
export function getRelatedImageCatalogToolIds(excludeId: string): string[] | null {
  const action = IMAGE_TOOL_MAP[excludeId];
  if (!action) return null;
  return Object.entries(IMAGE_TOOL_MAP)
    .filter(([id, a]) => id !== excludeId && a === action)
    .map(([id]) => id);
}

export function parseImageToolQuery(searchParams: URLSearchParams): ImageToolLinkState | null {
  const raw = searchParams.get("tool");
  if (!raw) return null;
  const action = IMAGE_TOOL_MAP[raw];
  if (!action) return null;

  let rotateQuarter = 0;
  let flipH = false;
  let flipV = false;

  if (action === "rotate-flip") {
    if (raw === "rotate-photo") rotateQuarter = 1;
    if (raw === "rotate-image-180" || raw === "fix-upside-down-photo") rotateQuarter = 2;
    if (raw === "flip-horizontal" || raw === "mirror-image") flipH = true;
    if (raw === "flip-vertical" || raw === "vertical-flip-photo") flipV = true;
  }

  return { action, rotateQuarter, flipH, flipV };
}
