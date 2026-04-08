import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import JSZip from "jszip";
import { Dropzone } from "../shared/Dropzone";
import { useProcessingPipeline } from "../shared/useProcessingPipeline";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import type { ImageAction } from "./imageTypes";
import { parseImageToolQuery } from "./imageToolQuery";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { ProcessingStatusPanel } from "../shared/ProcessingStatusPanel";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { QWICKTON_TOOL_WORK_ID, scrollToolWorkAreaById } from "../shared/scrollToolWorkArea";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";

type ImageConvertTarget = "image/webp" | "image/jpeg" | "image/png";

const ACTION_GUIDE: Record<ImageAction, { what: string; bestFor: string }> = {
  compress: {
    what: "Lowers JPEG quality to shrink file size.",
    bestFor: "Upload limits; staying under email or messaging size caps.",
  },
  resize: {
    what: "Scales width and height by your chosen percentage (aspect ratio kept).",
    bestFor: "Forms, thumbnails, and web images.",
  },
  convert: {
    what: "Exports the same image as WEBP, JPEG, or PNG.",
    bestFor: "Format requirements (PNG transparency, smaller WEBP).",
  },
  "document-scan": {
    what: "Applies a high-contrast black-and-white document look.",
    bestFor: "Service-center style forms, school paperwork, ID scans.",
  },
  "auto-enhance": {
    what: "Boosts contrast for better readability (gentle color correction).",
    bestFor: "Dark or flat phone photos.",
  },
  "compress-to-size": {
    what: "Tweaks quality until the file fits under a target size in KB.",
    bestFor: "Strict portal limits (for example 200 KB).",
  },
  "rotate-flip": {
    what: "Rotation in 90° steps plus horizontal or vertical flip.",
    bestFor: "Sideways shots and mirrored images.",
  },
};

function extensionForDownload(action: ImageAction, convertTarget: ImageConvertTarget, blob: Blob): string {
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  if (action === "convert") {
    if (convertTarget === "image/png") return "png";
    if (convertTarget === "image/webp") return "webp";
    return "jpg";
  }
  return "jpg";
}

async function processImage(
  input: {
    file: File;
    action: ImageAction;
    targetKb?: number;
    rotateQuarter?: number;
    flipH?: boolean;
    flipV?: boolean;
    resizeScale?: number;
    jpegQuality?: number;
    outputType: ImageConvertTarget | "image/jpeg";
  },
  signal: AbortSignal
): Promise<Blob> {
  const worker = new Worker(new URL("../../workers/image.worker.ts", import.meta.url), {
    type: "module",
  });
  const buffer = await input.file.arrayBuffer();
  const outputType =
    input.action === "convert" ? input.outputType : ("image/jpeg" as const);
  return new Promise((resolve, reject) => {
    const jobId = crypto.randomUUID();
    const onAbort = () => {
      worker.terminate();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
    worker.onmessage = (event: MessageEvent<{ jobId: string; output?: ArrayBuffer; error?: string }>) => {
      if (event.data.jobId !== jobId) return;
      signal.removeEventListener("abort", onAbort);
      if (event.data.error) {
        worker.terminate();
        reject(new Error(event.data.error));
        return;
      }
      if (!event.data.output) return;
      worker.terminate();
      resolve(new Blob([event.data.output], { type: outputType }));
    };
    worker.postMessage(
      {
        jobId,
        payload: {
          fileBuffer: buffer,
          action: input.action,
          outputType,
          targetKb: input.targetKb,
          rotateQuarter: input.rotateQuarter,
          flipH: input.flipH,
          flipV: input.flipV,
          resizeScale: input.resizeScale,
          jpegQuality: input.jpegQuality,
        },
      },
      [buffer]
    );
  });
}

export function ImageToolsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [file, setFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const batchAbortRef = useRef<AbortController | null>(null);
  const [action, setAction] = useState<ImageAction>("compress");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [toolError, setToolError] = useState<string>("");
  const [targetKb, setTargetKb] = useState<number>(200);
  const [resizePercent, setResizePercent] = useState(50);
  const [jpegQualityPercent, setJpegQualityPercent] = useState(() => {
    try {
      const raw = localStorage.getItem("qwickton_image_jpeg_quality");
      const n = raw ? parseInt(raw, 10) : NaN;
      if (Number.isFinite(n) && n >= 30 && n <= 100) return n;
    } catch {
      /* ignore */
    }
    return 60;
  });
  const [convertTarget, setConvertTarget] = useState<ImageConvertTarget>("image/webp");
  const [rotateQuarter, setRotateQuarter] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const pipeline = useProcessingPipeline(processImage);
  const hasPreview = useMemo(() => Boolean(sourceUrl || previewUrl), [sourceUrl, previewUrl]);
  const etaSec =
    pipeline.progress > 0
      ? Math.max(0, Math.round((pipeline.elapsedMs / 1000) * ((100 - pipeline.progress) / pipeline.progress)))
      : null;
  useHubSeo(location.pathname, searchParams, {
    title: "Image Tools",
    description:
      "Resize, compress, convert WEBP/JPEG/PNG, scan look, enhance, and target KB — all in your browser, locally.",
  });
  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const imageCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Image", to: "/image" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);
  const guide = useMemo(() => ACTION_GUIDE[action], [action]);
  const isIOS = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);
  const canRun = Boolean(file || batchFiles.length > 0);

  usePendingWorkFiles(
    (incoming) => {
      setToolError("");
      const slice = incoming.slice(0, 10);
      setBatchFiles(slice);
      setFile(slice[0] ?? null);
    },
    { scrollToWorkId: QWICKTON_TOOL_WORK_ID }
  );

  const setJpegQualityPersisted = (n: number) => {
    setJpegQualityPercent(n);
    try {
      localStorage.setItem("qwickton_image_jpeg_quality", String(n));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const parsed = parseImageToolQuery(searchParams);
    if (!parsed) return;
    setAction(parsed.action);
    setRotateQuarter(parsed.rotateQuarter);
    setFlipH(parsed.flipH);
    setFlipV(parsed.flipV);
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get("tool")) return;
    scrollToolWorkAreaById(QWICKTON_TOOL_WORK_ID);
  }, [searchParams]);

  useEffect(() => {
    setZipBlob(null);
  }, [file, batchFiles, action]);

  useEffect(() => {
    if (!file) {
      setSourceUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!pipeline.result) return;
    const url = URL.createObjectURL(pipeline.result as Blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [pipeline.result]);

  const runProcess = async () => {
    localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Image Tools"]));
    const resizeScale = resizePercent / 100;
    const jpegQ = jpegQualityPercent / 100;
    const outputTypeForJob: ImageConvertTarget | "image/jpeg" =
      action === "convert" ? convertTarget : "image/jpeg";

    const payloadBase = {
      action,
      targetKb,
      rotateQuarter,
      flipH,
      flipV,
      resizeScale,
      jpegQuality: action === "compress" || action === "compress-to-size" ? jpegQ : undefined,
      outputType: outputTypeForJob,
    };

    const files = batchFiles.length ? batchFiles.slice(0, 10) : file ? [file] : [];
    if (!files.length) return;

    setZipBlob(null);
    const start = performance.now();

    if (files.length > 1) {
      let bytesIn = 0;
      const zip = new JSZip();
      const ac = new AbortController();
      batchAbortRef.current = ac;
      setBatchBusy(true);
      setToolError("");
      try {
        for (let i = 0; i < files.length; i += 1) {
          const f = files[i];
          bytesIn += f.size;
          const blob = await processImage({ file: f, ...payloadBase }, ac.signal);
          const ext = extensionForDownload(action, convertTarget, blob);
          const baseName = f.name.replace(/\.[^/.]+$/, "") || `image-${i}`;
          zip.file(`${baseName}-qwickton.${ext}`, blob);
        }
        const zipped = await zip.generateAsync({ type: "blob" });
        setZipBlob(zipped);
        await sendSafeAnalytics({
          event: "process_image",
          tool: `${action}-batch-zip`,
          durationMs: Math.round(performance.now() - start),
          success: true,
          bytesIn,
          bytesOut: zipped.size,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setToolError("Batch cancelled.");
        } else {
          setToolError(err instanceof Error ? err.message : "Batch processing failed.");
        }
        await sendSafeAnalytics({
          event: "process_image",
          tool: `${action}-batch-zip`,
          durationMs: Math.round(performance.now() - start),
          success: false,
          bytesIn,
        });
      } finally {
        batchAbortRef.current = null;
        setBatchBusy(false);
      }
      return;
    }

    let ok = true;
    let bytesIn = 0;
    let lastOut: Blob | null = null;
    for (const f of files) {
      bytesIn += f.size;
      const { ok: oneOk, output } = await pipeline.run({ file: f, ...payloadBase });
      if (!oneOk) ok = false;
      if (output) lastOut = output as Blob;
    }
    await sendSafeAnalytics({
      event: "process_image",
      tool: action,
      durationMs: Math.round(performance.now() - start),
      success: ok,
      bytesIn,
      bytesOut: lastOut?.size,
    });
  };

  const busy = pipeline.state === "processing" || pipeline.state === "validating" || batchBusy;

  const cancelAll = () => {
    pipeline.cancel();
    batchAbortRef.current?.abort();
  };

  return (
    <ToolPageShell
      title={catalogEntry?.title ?? "Image Tools"}
      busy={busy}
      breadcrumbs={imageCrumbs}
    >
      <Dropzone
        id={QWICKTON_TOOL_WORK_ID}
        accept="image/*"
        multiple
        maxFiles={10}
        maxSizeMb={15}
        onError={setToolError}
        onFiles={(files) => {
          setToolError("");
          setBatchFiles(files);
          setFile(files[0] ?? null);
        }}
      />
      {isIOS && (
        <p className="cost-note" role="note">
          <strong>iPhone tip:</strong> If a HEIC/HEIF file does not load here, use <strong>Share → Save to Files</strong> in
          Photos (as JPEG), or set Settings → Camera → Formats → <strong>Most Compatible</strong>, then pick the file again.
        </p>
      )}
      <ToolGuideBlurb what={guide.what} bestFor={guide.bestFor} />
      <div className="toolbar">
        <select value={action} onChange={(e) => setAction(e.target.value as ImageAction)} aria-label="Image action">
          <option value="compress">Compress Image</option>
          <option value="resize">Resize Image</option>
          <option value="convert">Convert format</option>
          <option value="document-scan">Document Scan (CSC/School)</option>
          <option value="auto-enhance">Auto Enhance</option>
          <option value="compress-to-size">Compress To Target Size</option>
          <option value="rotate-flip">Rotate / Flip</option>
        </select>
        {action === "resize" && (
          <select
            value={resizePercent}
            onChange={(e) => setResizePercent(Number(e.target.value))}
            aria-label="Resize scale percent"
          >
            <option value={25}>25% size</option>
            <option value={50}>50% size</option>
            <option value={75}>75% size</option>
            <option value={100}>100% (copy dimensions)</option>
          </select>
        )}
        {action === "compress" && (
          <label className="toolbar-check">
            Quality {jpegQualityPercent}%
            <input
              type="range"
              min={35}
              max={95}
              value={jpegQualityPercent}
              onChange={(e) => setJpegQualityPersisted(Number(e.target.value))}
            />
          </label>
        )}
        {action === "compress-to-size" && (
          <>
            <input
              className="search-input"
              type="number"
              min={20}
              max={2048}
              value={targetKb}
              onChange={(e) => setTargetKb(Number(e.target.value || 200))}
              placeholder="Target KB"
            />
            <label className="toolbar-check">
              Max quality cap {jpegQualityPercent}%
              <input
                type="range"
                min={50}
                max={98}
                value={jpegQualityPercent}
                onChange={(e) => setJpegQualityPersisted(Number(e.target.value))}
              />
            </label>
          </>
        )}
        {action === "convert" && (
          <select
            value={convertTarget}
            onChange={(e) => setConvertTarget(e.target.value as ImageConvertTarget)}
          >
            <option value="image/webp">WEBP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        )}
        {action === "rotate-flip" && (
          <>
            <select
              value={rotateQuarter}
              onChange={(e) => setRotateQuarter(Number(e.target.value))}
              aria-label="Rotation"
            >
              <option value={0}>0°</option>
              <option value={1}>90°</option>
              <option value={2}>180°</option>
              <option value={3}>270°</option>
            </select>
            <label className="toolbar-check">
              <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />
              Flip H
            </label>
            <label className="toolbar-check">
              <input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} />
              Flip V
            </label>
          </>
        )}
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!canRun}
          onClick={() => runProcess().catch(() => undefined)}
        >
          Run
        </button>
      </div>
      {batchFiles.length > 1 ? (
        <p className="cost-note">Batch: up to 10 images per run — download a ZIP when processing finishes.</p>
      ) : null}
      <p>Batch queue: {batchFiles.length} file(s) (max 10 per run)</p>
      <ProcessingStatusPanel
        state={batchBusy ? "processing" : pipeline.state}
        progress={batchBusy ? 55 : pipeline.progress}
        elapsedMs={pipeline.elapsedMs}
        etaSec={batchBusy ? null : etaSec}
      />
      {hasPreview && (
        <div className="preview-grid">
          <div>
            <p>Original</p>
            {sourceUrl && <img src={sourceUrl} className="preview-image" alt="Original" />}
          </div>
          <div>
            <p>Result</p>
            {previewUrl && <img src={previewUrl} className="preview-image" alt="Result" />}
            {!previewUrl && <p className="cost-note">Run the tool to see the result here.</p>}
          </div>
        </div>
      )}
      {toolError && <UserFacingErrorBlock message={toolError} technicalDetails={toolError} />}
      {pipeline.error && (
        <UserFacingErrorBlock message={pipeline.error} technicalDetails={pipeline.error} />
      )}
      {zipBlob && (
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          onClick={() => triggerDownload(zipBlob, `qwickton-${action}-batch.zip`)}
        >
          Download ZIP (batch)
        </button>
      )}
      {pipeline.result && !zipBlob && (
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          onClick={() =>
            triggerDownload(
              pipeline.result as Blob,
              `qwickton-${action}.${extensionForDownload(action, convertTarget, pipeline.result as Blob)}`
            )
          }
        >
          Download
        </button>
      )}
      {(pipeline.state === "processing" || pipeline.state === "validating" || batchBusy) && (
        <button type="button" className="qk-btn qk-btn--quiet" onClick={cancelAll}>
          Cancel
        </button>
      )}
      <RelatedToolsLinks
        category="image"
        excludeId={catalogEntry?.id}
        handoffFiles={batchFiles.length ? batchFiles : file ? [file] : undefined}
      />
    </ToolPageShell>
  );
}
