import { uint8ArrayToArrayBuffer } from "./pdfBlob";

export type ImagePdfPageFormat = "a4" | "letter";

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

const PAGE_POINTS: Record<ImagePdfPageFormat, { width: number; height: number }> = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
};

async function fileToScannedJpegBytes(file: File): Promise<ArrayBuffer | null> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const v = gray > 145 ? 255 : 20;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return blob ? blob.arrayBuffer() : null;
}

/**
 * Build a multi-page PDF from image files (normal or high-contrast "scan" pipeline).
 */
export async function buildPdfFromImages(
  files: File[],
  options: { mode: "normal" | "scan"; pageFormat: ImagePdfPageFormat },
  signal?: AbortSignal
): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const pageSize = PAGE_POINTS[options.pageFormat];

  for (const file of files) {
    throwIfAborted(signal);
    let bytes = await file.arrayBuffer();
    if (options.mode === "scan") {
      const scanned = await fileToScannedJpegBytes(file);
      if (scanned) bytes = scanned;
    }

    const image =
      options.mode === "scan"
        ? await pdf.embedJpg(bytes)
        : file.type.includes("png")
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);

    const page = pdf.addPage([pageSize.width, pageSize.height]);
    const margin = 32;
    const maxW = pageSize.width - margin * 2;
    const maxH = pageSize.height - margin * 2;
    const ratio = Math.min(maxW / image.width, maxH / image.height);
    const drawW = image.width * ratio;
    const drawH = image.height * ratio;
    page.drawImage(image, {
      x: (pageSize.width - drawW) / 2,
      y: (pageSize.height - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  throwIfAborted(signal);
  const out = await pdf.save();
  return new Blob([uint8ArrayToArrayBuffer(new Uint8Array(out))], { type: "application/pdf" });
}
