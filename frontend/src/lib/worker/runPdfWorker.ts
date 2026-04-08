export type PdfWorkerPayload = {
  files: ArrayBuffer[];
  action: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  signatureText?: string;
  signaturePosX?: number;
  signaturePosY?: number;
  signatureFontSize?: number;
  pageSpec?: string;
  pageNumberStyle?: "page-of-total" | "page-only";
  rotationQuarterTurns?: number;
  splitHalf?: "first" | "second";
  overlayText?: string;
  overlayPosX?: number;
  overlayPosY?: number;
  overlayFontSize?: number;
  overlayOpacity?: number;
};

export function runPdfWorkerJob(payload: PdfWorkerPayload, signal?: AbortSignal): Promise<Blob> {
  const worker = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url), {
    type: "module",
  });
  const buffers = payload.files;
  return new Promise((resolve, reject) => {
    const jobId = crypto.randomUUID();
    const onAbort = () => {
      worker.terminate();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
    worker.onmessage = (event: MessageEvent<{ jobId: string; output?: ArrayBuffer; error?: string }>) => {
      if (event.data.jobId !== jobId) return;
      signal?.removeEventListener("abort", onAbort);
      if (event.data.error) {
        worker.terminate();
        reject(new Error(event.data.error));
        return;
      }
      const output = event.data.output;
      if (!output) {
        worker.terminate();
        reject(new Error("PDF worker returned empty output"));
        return;
      }
      worker.terminate();
      resolve(new Blob([output], { type: "application/pdf" }));
    };
    worker.postMessage({ jobId, payload }, buffers);
  });
}
