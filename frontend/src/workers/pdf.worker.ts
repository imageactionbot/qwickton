/// <reference lib="webworker" />
import { PDFDocument, degrees } from "pdf-lib";
import { parsePageIndices } from "../lib/pdf/pageSpec";

const MAX_FILE_BYTES = 45 * 1024 * 1024;
const MAX_MERGE_TOTAL_BYTES = 160 * 1024 * 1024;
const MAX_PAGES = 800;

async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocument> {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new Error(`Each PDF must be under ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.`);
  }
  try {
    return await PDFDocument.load(buffer);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (/encrypt|password|Encrypted/i.test(raw)) {
      throw new Error("This PDF is encrypted or password-protected. Unlock it first, then try again.");
    }
    throw new Error("Invalid or damaged PDF. Re-export from the original app or try Re-save / repair.");
  }
}

function assertPageBudget(count: number): void {
  if (count > MAX_PAGES) {
    throw new Error(`This PDF has too many pages (max ${MAX_PAGES}). Split the file and try again.`);
  }
}

type PdfAction =
  | "merge"
  | "split"
  | "rotate"
  | "watermark"
  | "page-numbers"
  | "sign-pdf"
  | "extract-pages"
  | "remove-pages"
  | "resave-pdf"
  | "text-overlay"
  | "metadata-clean";
type PdfJobInput = {
  files: ArrayBuffer[];
  action: PdfAction;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  signatureText?: string;
  signaturePosX?: number;
  signaturePosY?: number;
  signatureFontSize?: number;
  pageSpec?: string;
  pageNumberStyle?: "page-of-total" | "page-only";
  /** 1 = 90°, 2 = 180°, 3 = 270° (default 1). */
  rotationQuarterTurns?: number;
  splitHalf?: "first" | "second";
  overlayText?: string;
  overlayPosX?: number;
  overlayPosY?: number;
  overlayFontSize?: number;
  overlayOpacity?: number;
};

function toTransferableBuffer(data: Uint8Array): ArrayBuffer {
  const u8 = new Uint8Array(data);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

async function extractPages(buffer: ArrayBuffer, pageSpec: string): Promise<Uint8Array> {
  const src = await loadPdf(buffer);
  const count = src.getPageCount();
  assertPageBudget(count);
  const indices = parsePageIndices(pageSpec, count);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((page) => out.addPage(page));
  return out.save();
}

async function removePages(buffer: ArrayBuffer, pageSpec: string): Promise<Uint8Array> {
  const src = await loadPdf(buffer);
  const count = src.getPageCount();
  assertPageBudget(count);
  const remove = new Set(parsePageIndices(pageSpec, count));
  const keep = [...Array(count).keys()].filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("Cannot delete every page.");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((page) => out.addPage(page));
  return out.save();
}

/** Re-save PDF (fixes some broken exports). Password-protected files are not supported. */
async function resavePdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  return doc.save();
}

/** Strip common document info fields before sharing (privacy). */
async function cleanMetadataPdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  try {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setCreator("");
    doc.setProducer("");
  } catch {
    /* pdf-lib may omit some fields on odd files */
  }
  return doc.save();
}

/** Lightweight PDF "editor": draw custom text on every page (multi-line supported). */
async function overlayTextPdf(
  buffer: ArrayBuffer,
  text: string,
  posX: number,
  posY: number,
  fontSize: number,
  opacity: number
): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  const raw = (text || "").trim();
  const lines = raw ? raw.split(/\r?\n/) : ["Your text"];
  const displayLines = lines.some((l) => l.trim().length) ? lines : ["Your text"];
  const pages = doc.getPages();
  const size = Math.max(6, Math.min(72, fontSize));
  const op = Math.max(0.08, Math.min(1, opacity));
  const lineHeight = Math.max(12, size * 1.28);
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const x = (Math.min(95, Math.max(2, posX)) / 100) * width;
    const yBase = (Math.min(95, Math.max(2, posY)) / 100) * height;
    displayLines.forEach((line, i) => {
      page.drawText(line || " ", {
        x,
        y: yBase - i * lineHeight,
        size,
        opacity: op,
      });
    });
  });
  return doc.save();
}

async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const totalBytes = buffers.reduce((s, b) => s + b.byteLength, 0);
  if (totalBytes > MAX_MERGE_TOTAL_BYTES) {
    throw new Error("Combined PDFs exceed safe merge size. Merge fewer files or compress first.");
  }
  const out = await PDFDocument.create();
  let totalPages = 0;
  for (const buffer of buffers) {
    const src = await loadPdf(buffer);
    totalPages += src.getPageCount();
    assertPageBudget(totalPages);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((page) => out.addPage(page));
  }
  return out.save();
}

async function splitPdf(buffer: ArrayBuffer, half: "first" | "second"): Promise<Uint8Array> {
  const src = await loadPdf(buffer);
  assertPageBudget(src.getPageCount());
  const out = await PDFDocument.create();
  const pageCount = src.getPageCount();
  const mid = Math.floor(pageCount / 2);
  const indices =
    half === "first"
      ? [...Array(Math.max(1, mid)).keys()]
      : [...Array(Math.max(1, pageCount - mid)).keys()].map((i) => i + mid);
  const copied = await out.copyPages(src, indices);
  copied.forEach((page) => out.addPage(page));
  return out.save();
}

async function rotatePdf(buffer: ArrayBuffer, quarterTurns: number): Promise<Uint8Array> {
  const q = ((quarterTurns % 4) + 4) % 4;
  if (q === 0) {
    const doc = await loadPdf(buffer);
    assertPageBudget(doc.getPageCount());
    return doc.save();
  }
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  const angle = q * 90;
  doc.getPages().forEach((page) => page.setRotation(degrees(angle)));
  return doc.save();
}

async function watermarkPdf(
  buffer: ArrayBuffer,
  watermarkText: string,
  watermarkOpacity: number,
  watermarkAngle: number
): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  const pages = doc.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText || "Qwickton", {
      x: width * 0.08,
      y: height * 0.5,
      size: Math.max(20, Math.round(width * 0.04)),
      opacity: Math.max(0.05, Math.min(0.95, watermarkOpacity)),
      rotate: degrees(Math.max(-75, Math.min(75, watermarkAngle))),
    });
  });
  return doc.save();
}

async function addPageNumbers(
  buffer: ArrayBuffer,
  style: "page-of-total" | "page-only"
): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const label = style === "page-only" ? `${index + 1}` : `Page ${index + 1} of ${total}`;
    page.drawText(label, {
      x: Math.max(24, width - 170),
      y: 20,
      size: 10,
      opacity: 0.7,
    });
  });
  return doc.save();
}

async function signPdf(
  buffer: ArrayBuffer,
  signatureText: string,
  signaturePosX: number,
  signaturePosY: number,
  signatureFontSize: number
): Promise<Uint8Array> {
  const doc = await loadPdf(buffer);
  assertPageBudget(doc.getPageCount());
  const pages = doc.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const x = Math.round((Math.min(95, Math.max(5, signaturePosX)) / 100) * width);
    const y = Math.round((Math.min(95, Math.max(5, signaturePosY)) / 100) * height);
    page.drawText(signatureText || "Signed by Qwickton User", {
      x,
      y,
      size: Math.max(8, Math.min(42, signatureFontSize)),
      opacity: 0.85,
    });
    page.drawText(new Date().toLocaleString(), {
      x: Math.max(220, width - 170),
      y: 36,
      size: 9,
      opacity: 0.65,
    });
  });
  return doc.save();
}

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<{ jobId: string; payload: PdfJobInput }>) => {
  const { jobId, payload } = event.data;
  try {
    let output: Uint8Array;
    if (!payload.files.length) {
      throw new Error("Select at least one PDF.");
    }
    if (payload.action === "merge") {
      output = await mergePdfs(payload.files);
    } else if (payload.action === "split") {
      output = await splitPdf(payload.files[0], payload.splitHalf ?? "first");
    } else if (payload.action === "watermark") {
      output = await watermarkPdf(
        payload.files[0],
        payload.watermarkText ?? "Qwickton",
        payload.watermarkOpacity ?? 0.22,
        payload.watermarkAngle ?? 25
      );
    } else if (payload.action === "page-numbers") {
      output = await addPageNumbers(payload.files[0], payload.pageNumberStyle ?? "page-of-total");
    } else if (payload.action === "sign-pdf") {
      output = await signPdf(
        payload.files[0],
        payload.signatureText ?? "Signed by Qwickton User",
        payload.signaturePosX ?? 10,
        payload.signaturePosY ?? 8,
        payload.signatureFontSize ?? 11
      );
    } else if (payload.action === "extract-pages") {
      output = await extractPages(payload.files[0], payload.pageSpec ?? "1");
    } else if (payload.action === "remove-pages") {
      output = await removePages(payload.files[0], payload.pageSpec ?? "1");
    } else if (payload.action === "resave-pdf") {
      output = await resavePdf(payload.files[0]);
    } else if (payload.action === "metadata-clean") {
      output = await cleanMetadataPdf(payload.files[0]);
    } else if (payload.action === "text-overlay") {
      output = await overlayTextPdf(
        payload.files[0],
        payload.overlayText ?? "",
        payload.overlayPosX ?? 8,
        payload.overlayPosY ?? 85,
        payload.overlayFontSize ?? 14,
        payload.overlayOpacity ?? 0.95
      );
    } else {
      output = await rotatePdf(payload.files[0], payload.rotationQuarterTurns ?? 1);
    }
    workerScope.postMessage({ jobId, progress: 100, output: toTransferableBuffer(output) });
  } catch (err) {
    workerScope.postMessage({
      jobId,
      error: err instanceof Error ? err.message : "PDF processing failed",
    });
  }
};
