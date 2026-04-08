import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { useProcessingPipeline } from "../shared/useProcessingPipeline";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { buildPdfFromImages } from "../../lib/pdf/imagesToPdf";
import { runPdfWorkerJob } from "../../lib/worker/runPdfWorker";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import type { PdfAction } from "./pdfTypes";
import { parsePdfToolQuery } from "./pdfToolQuery";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { ProcessingStatusPanel } from "../shared/ProcessingStatusPanel";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { QWICKTON_TOOL_WORK_ID, scrollToolWorkAreaById } from "../shared/scrollToolWorkArea";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";

type PdfMeta = {
  label: string;
  sizeMb: string;
  pages: number | null;
};

const ACTION_GUIDE: Record<PdfAction, { what: string; bestFor: string }> = {
  merge: { what: "Combines multiple PDFs into one file.", bestFor: "Form packets, coursework, and office submissions." },
  split: { what: "Splits one PDF into the first or second half.", bestFor: "Quickly dividing large files." },
  rotate: { what: "Rotates every page by the angle you choose.", bestFor: "Fixing phone scan orientation." },
  watermark: { what: "Adds a custom text watermark on each page.", bestFor: "Draft, confidential, or internal copies." },
  "page-numbers": { what: "Adds page numbers across the document.", bestFor: "Reports, legal packets, and references." },
  "sign-pdf": { what: "Adds a text signature and optional timestamp.", bestFor: "Self-attested uploads and declarations." },
  "jpg-to-pdf": { what: "Turns images into clean PDF pages.", bestFor: "Photos, screenshots, and document photos." },
  "scan-to-pdf": { what: "Converts an image to a high-contrast scan-style PDF.", bestFor: "IDs, certificates, and school forms." },
  "extract-pages": { what: "Exports only the page range you select.", bestFor: "Submitting only the required pages." },
  "remove-pages": { what: "Deletes unwanted pages and saves a clean PDF.", bestFor: "Removing sensitive or extra pages." },
  "resave-pdf": { what: "Re-exports the PDF for better compatibility.", bestFor: "Fixing odd or corrupted exports." },
  "text-overlay": {
    what: "Draws your text on every page — multi-line notes, labels, or fill-in style overlays.",
    bestFor: "Quick edits when you only need typed text (not full vector editing).",
  },
  "metadata-clean": {
    what: "Clears title, author, subject, and similar document properties.",
    bestFor: "Sharing or uploading PDFs without leaking file history or author metadata.",
  },
};

function bytesToMb(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

async function readPdfPageCountFromBlob(blob: Blob): Promise<number | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const bytes = await blob.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

async function processPdf(
  input: {
    files: File[];
    action: PdfAction;
    watermarkText?: string;
    watermarkOpacity?: number;
    watermarkAngle?: number;
    signatureText?: string;
    signatureFontSize?: number;
    pageFormat?: "a4" | "letter";
    signaturePosX?: number;
    signaturePosY?: number;
    pageSpec?: string;
    pageNumberStyle?: "page-of-total" | "page-only";
    splitHalf?: "first" | "second";
    rotationQuarterTurns?: number;
    overlayText?: string;
    overlayPosX?: number;
    overlayPosY?: number;
    overlayFontSize?: number;
    overlayOpacity?: number;
  },
  signal: AbortSignal
): Promise<Blob> {
  if (!input.files.length) {
    throw new Error("Select at least one PDF file.");
  }
  if (input.action === "jpg-to-pdf") {
    return buildPdfFromImages(input.files, { mode: "normal", pageFormat: input.pageFormat ?? "a4" }, signal);
  }
  if (input.action === "scan-to-pdf") {
    return buildPdfFromImages(input.files, { mode: "scan", pageFormat: input.pageFormat ?? "a4" }, signal);
  }
  const buffers = await Promise.all(input.files.map((f) => f.arrayBuffer()));
  return runPdfWorkerJob(
    {
      files: buffers,
      action: input.action,
      watermarkText: input.watermarkText,
      watermarkOpacity: input.watermarkOpacity,
      watermarkAngle: input.watermarkAngle,
      signatureText: input.signatureText,
      signatureFontSize: input.signatureFontSize,
      signaturePosX: input.signaturePosX,
      signaturePosY: input.signaturePosY,
      pageSpec: input.pageSpec,
      pageNumberStyle: input.pageNumberStyle,
      splitHalf: input.splitHalf,
      rotationQuarterTurns: input.rotationQuarterTurns,
      overlayText: input.overlayText,
      overlayPosX: input.overlayPosX,
      overlayPosY: input.overlayPosY,
      overlayFontSize: input.overlayFontSize,
      overlayOpacity: input.overlayOpacity,
    },
    signal
  );
}

export function PdfToolsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<File[]>([]);
  const [action, setAction] = useState<PdfAction>("merge");
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [resultPreview, setResultPreview] = useState<string>("");
  const [toolError, setToolError] = useState<string>("");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(22);
  const [watermarkAngle, setWatermarkAngle] = useState(25);
  const [pageNumberStyle, setPageNumberStyle] = useState<"page-of-total" | "page-only">("page-of-total");
  const [signatureText, setSignatureText] = useState("Digitally signed by Qwickton User");
  const [signatureFontSize, setSignatureFontSize] = useState(11);
  const [signaturePosX, setSignaturePosX] = useState(10);
  const [signaturePosY, setSignaturePosY] = useState(8);
  const [pageFormat, setPageFormat] = useState<"a4" | "letter">(() => {
    try {
      const v = localStorage.getItem("qwickton_pdf_page_format");
      if (v === "letter" || v === "a4") return v;
    } catch {
      /* ignore */
    }
    return "a4";
  });
  const [pageSpec, setPageSpec] = useState("1-1");
  const [splitHalf, setSplitHalf] = useState<"first" | "second">("first");
  const [rotationQuarterTurns, setRotationQuarterTurns] = useState(1);
  const [overlayText, setOverlayText] = useState("Approved — Qwickton review");
  const [overlayPosX, setOverlayPosX] = useState(8);
  const [overlayPosY, setOverlayPosY] = useState(88);
  const [overlayFontSize, setOverlayFontSize] = useState(14);
  const [overlayOpacityPct, setOverlayOpacityPct] = useState(92);
  const [inputMeta, setInputMeta] = useState<PdfMeta[]>([]);
  const pipeline = useProcessingPipeline(processPdf);
  const firstFile = files[0];
  const inputIsImage = Boolean(firstFile?.type.startsWith("image/"));
  const etaSec =
    pipeline.progress > 0
      ? Math.max(0, Math.round((pipeline.elapsedMs / 1000) * ((100 - pipeline.progress) / pipeline.progress)))
      : null;
  useHubSeo(location.pathname, searchParams, {
    title: "PDF Tools",
    description:
      "Advanced PDF tools: merge, split, rotate, watermark, page numbers, sign, text overlay editor, metadata removal, extract or remove pages, repair export, and images to PDF — all local in your browser.",
  });
  const searchKey = searchParams.toString();
  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const pdfCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "PDF", to: "/pdf" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);
  const guide = useMemo(() => ACTION_GUIDE[action], [action]);

  usePendingWorkFiles(
    (incoming) => {
      setToolError("");
      setFiles(incoming.slice(0, 8));
    },
    { scrollToWorkId: QWICKTON_TOOL_WORK_ID }
  );

  useEffect(() => {
    const parsed = parsePdfToolQuery(searchParams);
    if (!parsed) return;
    setAction(parsed.action);
    if (parsed.splitHalf) setSplitHalf(parsed.splitHalf);
    if (parsed.rotationQuarterTurns != null) setRotationQuarterTurns(parsed.rotationQuarterTurns);
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get("tool")) return;
    scrollToolWorkAreaById(QWICKTON_TOOL_WORK_ID);
  }, [searchParams]);

  useEffect(() => {
    if (!files.length) {
      setSourcePreview("");
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  useEffect(() => {
    if (!pipeline.result) return;
    const url = URL.createObjectURL(pipeline.result as Blob);
    setResultPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [pipeline.result]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!files.length) {
        setInputMeta([]);
        return;
      }
      const rows = await Promise.all(
        files.map(async (file) => {
          const pages = file.type.includes("pdf") ? await readPdfPageCountFromBlob(file) : null;
          return {
            label: file.name,
            sizeMb: bytesToMb(file.size),
            pages,
          } satisfies PdfMeta;
        })
      );
      if (!cancelled) setInputMeta(rows);
    }
    run().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [files]);

  const canRun = files.length > 0 && !(action === "split" && files.length !== 1);
  const bytesIn = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const busy = pipeline.state === "processing" || pipeline.state === "validating";

  return (
    <ToolPageShell title={catalogEntry?.title ?? "PDF Tools"} busy={busy} breadcrumbs={pdfCrumbs}>
      <Dropzone
        id={QWICKTON_TOOL_WORK_ID}
        accept={action === "jpg-to-pdf" || action === "scan-to-pdf" ? "image/jpeg,image/png" : "application/pdf"}
        multiple
        maxFiles={8}
        maxSizeMb={40}
        onError={setToolError}
        onFiles={(incoming) => {
          setToolError("");
          setFiles(incoming);
        }}
      />
      <ToolGuideBlurb what={guide.what} bestFor={guide.bestFor} bestForLabel="Best use:" />
      <div className="toolbar">
        <select value={action} onChange={(e) => setAction(e.target.value as PdfAction)} aria-label="PDF action">
          <option value="merge">Merge PDF</option>
          <option value="split">Split PDF (half)</option>
          <option value="rotate">Rotate all pages</option>
          <option value="watermark">Add Watermark</option>
          <option value="page-numbers">Add Page Numbers</option>
          <option value="sign-pdf">Sign PDF (Text Signature)</option>
          <option value="jpg-to-pdf">JPG/PNG to PDF</option>
          <option value="scan-to-pdf">Scan Images to PDF</option>
          <option value="extract-pages">Extract Pages</option>
          <option value="remove-pages">Remove Pages</option>
          <option value="resave-pdf">Re-save PDF (repair export)</option>
          <option value="text-overlay">Add text to PDF (editor)</option>
          <option value="metadata-clean">Remove metadata (privacy)</option>
        </select>
        {action === "watermark" && (
          <>
            <input
              className="search-input"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Watermark text"
            />
            <input
              className="search-input"
              type="number"
              min={5}
              max={95}
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(Number(e.target.value || 22))}
              placeholder="Opacity %"
            />
            <input
              className="search-input"
              type="number"
              min={-75}
              max={75}
              value={watermarkAngle}
              onChange={(e) => setWatermarkAngle(Number(e.target.value || 25))}
              placeholder="Angle"
            />
          </>
        )}
        {action === "page-numbers" && (
          <select value={pageNumberStyle} onChange={(e) => setPageNumberStyle(e.target.value as "page-of-total" | "page-only")}>
            <option value="page-of-total">Page X of Y</option>
            <option value="page-only">Page number only</option>
          </select>
        )}
        {action === "text-overlay" && (
          <>
            <textarea
              className="search-input"
              style={{ minWidth: "min(420px, 92vw)", minHeight: "4.5rem", verticalAlign: "middle" }}
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Text on every page (use new lines for multiple lines)"
              aria-label="Overlay text"
            />
            <input
              className="search-input"
              type="number"
              min={2}
              max={95}
              value={overlayPosX}
              onChange={(e) => setOverlayPosX(Number(e.target.value || 8))}
              placeholder="X % from left"
              aria-label="Text position X percent"
            />
            <input
              className="search-input"
              type="number"
              min={2}
              max={95}
              value={overlayPosY}
              onChange={(e) => setOverlayPosY(Number(e.target.value || 88))}
              placeholder="Y % from bottom"
              aria-label="Text position Y percent"
            />
            <input
              className="search-input"
              type="number"
              min={6}
              max={72}
              value={overlayFontSize}
              onChange={(e) => setOverlayFontSize(Number(e.target.value || 14))}
              placeholder="Font size"
            />
            <input
              className="search-input"
              type="number"
              min={15}
              max={100}
              value={overlayOpacityPct}
              onChange={(e) => setOverlayOpacityPct(Number(e.target.value || 92))}
              placeholder="Opacity %"
            />
          </>
        )}
        {action === "sign-pdf" && (
          <>
            <input
              className="search-input"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Signature text"
            />
            <input
              className="search-input"
              type="number"
              min={5}
              max={95}
              value={signaturePosX}
              onChange={(e) => setSignaturePosX(Number(e.target.value || 10))}
              placeholder="Sign X %"
            />
            <input
              className="search-input"
              type="number"
              min={5}
              max={95}
              value={signaturePosY}
              onChange={(e) => setSignaturePosY(Number(e.target.value || 8))}
              placeholder="Sign Y %"
            />
            <input
              className="search-input"
              type="number"
              min={8}
              max={42}
              value={signatureFontSize}
              onChange={(e) => setSignatureFontSize(Number(e.target.value || 11))}
              placeholder="Font size"
            />
          </>
        )}
        {(action === "jpg-to-pdf" || action === "scan-to-pdf") && (
          <select
            value={pageFormat}
            onChange={(e) => {
              const v = e.target.value as "a4" | "letter";
              setPageFormat(v);
              try {
                localStorage.setItem("qwickton_pdf_page_format", v);
              } catch {
                /* ignore */
              }
            }}
          >
            <option value="a4">A4 Page</option>
            <option value="letter">Letter Page</option>
          </select>
        )}
        {action === "split" && (
          <select value={splitHalf} onChange={(e) => setSplitHalf(e.target.value as "first" | "second")}>
            <option value="first">First half of pages</option>
            <option value="second">Second half of pages</option>
          </select>
        )}
        {action === "rotate" && (
          <select
            value={rotationQuarterTurns}
            onChange={(e) => setRotationQuarterTurns(Number(e.target.value))}
            aria-label="Rotation angle"
          >
            <option value={1}>90° clockwise</option>
            <option value={2}>180°</option>
            <option value={3}>270° clockwise</option>
          </select>
        )}
        {(action === "extract-pages" || action === "remove-pages") && (
          <>
            <input
              className="search-input"
              value={pageSpec}
              onChange={(e) => setPageSpec(e.target.value)}
              placeholder="Pages e.g. 1-3,5,8-10"
            />
            <button type="button" onClick={() => setPageSpec("1-1")}>
              First page
            </button>
            <button type="button" onClick={() => setPageSpec("1-3")}>
              First 3 pages
            </button>
            <button type="button" onClick={() => setPageSpec("2-5")}>
              2 to 5
            </button>
            {inputMeta[0]?.pages != null && (
              <span className="cost-note" style={{ display: "inline-block", marginLeft: "0.35rem" }}>
                PDF has <strong>{inputMeta[0].pages}</strong> pages (ranges are 1-based).
              </span>
            )}
          </>
        )}
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!canRun}
          onClick={async () => {
            localStorage.setItem("qwickton_recent_tools", JSON.stringify(["PDF Tools"]));
            const start = performance.now();
            const { ok, output } = await pipeline.run({
              files,
              action,
              watermarkText,
              watermarkOpacity: watermarkOpacity / 100,
              watermarkAngle,
              pageNumberStyle,
              signatureText,
              signatureFontSize,
              pageFormat,
              signaturePosX,
              signaturePosY,
              pageSpec,
              splitHalf,
              rotationQuarterTurns,
              overlayText,
              overlayPosX,
              overlayPosY,
              overlayFontSize,
              overlayOpacity: overlayOpacityPct / 100,
            });
            const outBlob = ok && output ? (output as Blob) : null;
            await sendSafeAnalytics({
              event: "process_pdf",
              tool: action,
              durationMs: Math.round(performance.now() - start),
              success: ok,
              bytesIn,
              bytesOut: outBlob?.size,
              pageCount: inputMeta[0]?.pages ?? undefined,
            });
          }}
        >
          Run
        </button>
      </div>
      {!canRun && action === "split" && <p className="error">Split needs exactly one PDF selected.</p>}
      <ProcessingStatusPanel
        state={pipeline.state}
        progress={pipeline.progress}
        elapsedMs={pipeline.elapsedMs}
        etaSec={etaSec}
      />
      {(sourcePreview || resultPreview) && (
        <div className="preview-grid">
          <div>
            <p>{inputIsImage ? "Input image" : "Input file"}</p>
            {sourcePreview &&
              (inputIsImage ? (
                <img src={sourcePreview} className="preview-image" alt="Input preview" />
              ) : (
                <embed src={sourcePreview} className="preview-pdf" type="application/pdf" />
              ))}
          </div>
          <div>
            <p>Output PDF</p>
            {resultPreview && <embed src={resultPreview} className="preview-pdf" type="application/pdf" />}
          </div>
        </div>
      )}
      {pipeline.error && (
        <UserFacingErrorBlock message={pipeline.error} technicalDetails={pipeline.error} />
      )}
      {toolError && <UserFacingErrorBlock message={toolError} technicalDetails={toolError} />}
      {pipeline.result && (
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          onClick={() => triggerDownload(pipeline.result as Blob, `qwickton-${action}.pdf`)}
        >
          Download
        </button>
      )}
      {(pipeline.state === "processing" || pipeline.state === "validating") && (
        <button type="button" className="qk-btn qk-btn--quiet" onClick={pipeline.cancel}>
          Cancel
        </button>
      )}
      <RelatedToolsLinks category="pdf" excludeId={catalogEntry?.id} handoffFiles={files.length ? files : undefined} />
    </ToolPageShell>
  );
}
