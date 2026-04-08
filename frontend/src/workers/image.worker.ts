/// <reference lib="webworker" />
type ImageAction =
  | "compress"
  | "resize"
  | "convert"
  | "document-scan"
  | "auto-enhance"
  | "compress-to-size"
  | "rotate-flip";

type ImageInput = {
  fileBuffer: ArrayBuffer;
  action: ImageAction;
  outputType: "image/jpeg" | "image/png" | "image/webp";
  targetKb?: number;
  /** 0–3 clockwise quarter turns after optional flip. */
  rotateQuarter?: number;
  flipH?: boolean;
  flipV?: boolean;
  /** Resize scale 0.1–1 (fraction of original width/height). Default 0.5. */
  resizeScale?: number;
  /** JPEG / WEBP quality 0.05–0.98. Compress defaults 0.6; others default in caller. */
  jpegQuality?: number;
};

function blobFromBuffer(buffer: ArrayBuffer): Blob {
  return new Blob([buffer]);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const workerScope = self as DedicatedWorkerGlobalScope;

const MAX_INPUT_BYTES = 22 * 1024 * 1024;
const MAX_PIXELS = 48_000_000;

workerScope.onmessage = async (event: MessageEvent<{ jobId: string; payload: ImageInput }>) => {
  const { jobId, payload } = event.data;
  try {
    if (payload.fileBuffer.byteLength > MAX_INPUT_BYTES) {
      throw new Error(`Image exceeds maximum size (${Math.floor(MAX_INPUT_BYTES / (1024 * 1024))} MB).`);
    }
    workerScope.postMessage({ jobId, progress: 20 });
    const sourceBlob = blobFromBuffer(payload.fileBuffer);
    const bitmap = await createImageBitmap(sourceBlob);
    if (bitmap.width * bitmap.height > MAX_PIXELS) {
      bitmap.close();
      throw new Error("Image resolution is too large for this browser. Resize the image first.");
    }

    const scale = payload.action === "resize" ? clamp(payload.resizeScale ?? 0.5, 0.1, 1) : 1;
    let outW =
      payload.action === "resize" ? Math.max(1, Math.round(bitmap.width * scale)) : bitmap.width;
    let outH =
      payload.action === "resize" ? Math.max(1, Math.round(bitmap.height * scale)) : bitmap.height;

    if (payload.action === "rotate-flip") {
      const q = (((payload.rotateQuarter ?? 0) % 4) + 4) % 4;
      outW = q % 2 === 1 ? bitmap.height : bitmap.width;
      outH = q % 2 === 1 ? bitmap.width : bitmap.height;
    }

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available in worker");

    if (payload.action === "rotate-flip") {
      const q = (((payload.rotateQuarter ?? 0) % 4) + 4) % 4;
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((q * Math.PI) / 2);
      let sx = 1;
      let sy = 1;
      if (payload.flipH) sx = -1;
      if (payload.flipV) sy = -1;
      ctx.scale(sx, sy);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    } else {
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }

    if (payload.action === "document-scan" || payload.action === "auto-enhance") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        if (payload.action === "document-scan") {
          const v = gray > 145 ? 255 : 20;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else {
          const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.25 + 128));
          data[i] = boosted;
          data[i + 1] = Math.min(255, boosted + 4);
          data[i + 2] = Math.max(0, boosted - 4);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    bitmap.close();
    workerScope.postMessage({ jobId, progress: 70 });

    const defaultHi = clamp(payload.jpegQuality ?? 0.92, 0.2, 0.98);
    const compressQ = clamp(payload.jpegQuality ?? 0.6, 0.35, 0.95);

    let outBlob: Blob;
    if (payload.action === "compress-to-size") {
      const targetBytes = Math.max(20 * 1024, (payload.targetKb ?? 200) * 1024);
      let low = 0.2;
      let high = defaultHi;
      let bestBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: high });
      for (let i = 0; i < 7; i += 1) {
        const mid = (low + high) / 2;
        const trial = await canvas.convertToBlob({ type: "image/jpeg", quality: mid });
        if (trial.size <= targetBytes) {
          bestBlob = trial;
          low = mid;
        } else {
          high = mid;
        }
      }
      outBlob = bestBlob;
    } else {
      const quality = payload.action === "compress" ? compressQ : defaultHi;
      const outType = payload.outputType;
      if (outType === "image/png") {
        outBlob = await canvas.convertToBlob({ type: outType });
      } else {
        outBlob = await canvas.convertToBlob({ type: outType, quality });
      }
    }
    const output = await outBlob.arrayBuffer();
    workerScope.postMessage({ jobId, progress: 100, output });
  } catch (err) {
    workerScope.postMessage({
      jobId,
      error: err instanceof Error ? err.message : "Image processing failed",
    });
  }
};
