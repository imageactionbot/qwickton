import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { useProcessingPipeline } from "../shared/useProcessingPipeline";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { TOOL_CATALOG } from "../../app/toolCatalog";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import { ProcessingStatusPanel } from "../shared/ProcessingStatusPanel";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolWorkflowStrip } from "../shared/ToolWorkflowStrip";
import { QWICKTON_TOOL_WORK_ID, scrollToolWorkAreaById } from "../shared/scrollToolWorkArea";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";
import { classifyFile } from "../../lib/smartDrop/matchTools";
import {
  type PassportCountryPreset,
  PASSPORT_PRESET_GROUPS,
  PRESET_GUIDE,
  PRESET_SIZES,
  isPassportPreset,
} from "../../lib/passport/passportPresets";

type PassportSheetDpi = 200 | 300 | 600;

type CropTune = {
  rotationDeg: number;
  zoom: number;
  panX: number;
  panY: number;
  brightnessPct: number;
  contrastPct: number;
};

function defaultCropTune(): CropTune {
  return {
    rotationDeg: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    brightnessPct: 100,
    contrastPct: 100,
  };
}

const A4_MM = { w: 210, h: 297 };
const BASE_DPI_REF = 300;

const PASSPORT_MARGIN_X = 180;
const PASSPORT_MARGIN_Y = 240;
const PASSPORT_GAP_X = 40;
const PASSPORT_GAP_Y = 40;

function sheetPixels(dpi: number): { w: number; h: number } {
  return {
    w: Math.round((A4_MM.w * dpi) / 25.4),
    h: Math.round((A4_MM.h * dpi) / 25.4),
  };
}

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / 25.4);
}

function scaleMargin(baseAt300: number, dpi: number): number {
  return Math.round((baseAt300 * dpi) / BASE_DPI_REF);
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

async function yieldToMain(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function rotateImageBitmap(bitmap: ImageBitmap, deg: number): Promise<ImageBitmap> {
  const norm = ((deg % 360) + 360) % 360;
  if (norm === 0) return bitmap;
  const rad = (norm * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = bitmap.width;
  const h = bitmap.height;
  const nw = Math.round(w * cos + h * sin);
  const nh = Math.round(h * cos + w * sin);
  const c = document.createElement("canvas");
  c.width = nw;
  c.height = nh;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  ctx.drawImage(bitmap, -w / 2, -h / 2);
  const out = await createImageBitmap(c);
  if (out !== bitmap) bitmap.close();
  return out;
}

function applyCropTune(
  bitmapW: number,
  bitmapH: number,
  sx: number,
  sy: number,
  faceBox: number,
  tune: CropTune
): { sx: number; sy: number; faceBox: number } {
  const zoom = Math.max(1, tune.zoom);
  let box = faceBox / zoom;
  const cx = sx + faceBox / 2 + tune.panX;
  const cy = sy + faceBox / 2 + tune.panY;
  let nsx = Math.round(cx - box / 2);
  let nsy = Math.round(cy - box / 2);
  if (nsx < 0) nsx = 0;
  if (nsy < 0) nsy = 0;
  if (nsx + box > bitmapW) nsx = Math.max(0, bitmapW - box);
  if (nsy + box > bitmapH) nsy = Math.max(0, bitmapH - box);
  if (nsx + box > bitmapW) box = bitmapW - nsx;
  if (nsy + box > bitmapH) box = bitmapH - nsy;
  return { sx: nsx, sy: nsy, faceBox: Math.max(8, Math.round(box)) };
}

function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tick: number
): void {
  ctx.save();
  ctx.strokeStyle = "#666";
  ctx.lineWidth = Math.max(1, Math.round(tick / 12));
  const t = tick;
  const segments: [number, number, number, number][] = [
    [x - t, y, x, y],
    [x, y - t, x, y],
    [x + w + t, y, x + w, y],
    [x + w, y - t, x + w, y],
    [x + w + t, y + h, x + w, y + h],
    [x + w, y + h + t, x + w, y + h],
    [x - t, y + h, x, y + h],
    [x, y + h + t, x, y + h],
  ];
  for (const [x0, y0, x1, y1] of segments) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

function passportLayoutForPreset(
  preset: PassportCountryPreset,
  dpi: PassportSheetDpi
): {
  cols: number;
  rows: number;
  maxCells: number;
  photoW: number;
  photoH: number;
  sheetW: number;
  sheetH: number;
} {
  const { w: sheetW, h: sheetH } = sheetPixels(dpi);
  const photoW = mmToPx(PRESET_SIZES[preset].widthMm, dpi);
  const photoH = mmToPx(PRESET_SIZES[preset].heightMm, dpi);
  const marginX = scaleMargin(PASSPORT_MARGIN_X, dpi);
  const marginY = scaleMargin(PASSPORT_MARGIN_Y, dpi);
  const gapX = scaleMargin(PASSPORT_GAP_X, dpi);
  const gapY = scaleMargin(PASSPORT_GAP_Y, dpi);
  const cols = Math.max(
    1,
    Math.floor((sheetW - marginX * 2 + gapX) / (photoW + gapX))
  );
  const rows = Math.max(
    1,
    Math.floor((sheetH - marginY * 2 + gapY) / (photoH + gapY))
  );
  return { cols, rows, maxCells: cols * rows, photoW, photoH, sheetW, sheetH };
}

async function createPassportSheet(input: {
  file: File;
  preset: PassportCountryPreset;
  bgColor: string;
  autoRemoveBg: boolean;
  photoCount: number;
  dpi: PassportSheetDpi;
  cutMarks: boolean;
  cropTune: CropTune;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  input.onProgress?.(5);
  throwIfAborted(input.signal);
  await yieldToMain();

  const sourceFile = input.autoRemoveBg
    ? await (async () => {
        const bgModule = await import("@imgly/background-removal");
        const removed = await bgModule.removeBackground(input.file, {
          model: "isnet_fp16",
          output: { format: "image/png", quality: 0.95 },
          progress: (_, current, total) => {
            const ratio = total > 0 ? current / total : 0;
            input.onProgress?.(10 + Math.round(ratio * 52));
          },
        });
        await yieldToMain();
        return new File([removed], "subject.png", { type: "image/png" });
      })()
    : input.file;
  throwIfAborted(input.signal);
  input.onProgress?.(64);
  await yieldToMain();

  let bitmap = await createImageBitmap(sourceFile);
  throwIfAborted(input.signal);
  bitmap = await rotateImageBitmap(bitmap, input.cropTune.rotationDeg);
  throwIfAborted(input.signal);
  input.onProgress?.(68);

  const { w: SHEET_W, h: SHEET_H } = sheetPixels(input.dpi);
  const marginX = scaleMargin(PASSPORT_MARGIN_X, input.dpi);
  const marginY = scaleMargin(PASSPORT_MARGIN_Y, input.dpi);
  const gapX = scaleMargin(PASSPORT_GAP_X, input.dpi);
  const gapY = scaleMargin(PASSPORT_GAP_Y, input.dpi);
  const photoW = mmToPx(PRESET_SIZES[input.preset].widthMm, input.dpi);
  const photoH = mmToPx(PRESET_SIZES[input.preset].heightMm, input.dpi);

  const sheetCanvas = document.createElement("canvas");
  sheetCanvas.width = SHEET_W;
  sheetCanvas.height = SHEET_H;
  const sheetCtx = sheetCanvas.getContext("2d");
  if (!sheetCtx) {
    bitmap.close();
    throw new Error("Canvas not available.");
  }

  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

  let sx = 0;
  let sy = 0;
  let faceBox = Math.min(bitmap.width, bitmap.height);

  const Detector = (window as Window & { FaceDetector?: new () => FaceDetector }).FaceDetector;
  if (Detector) {
    const detector = new Detector();
    const detected = await detector.detect(bitmap);
    await yieldToMain();
    if (detected.length > 0) {
      const box = detected[0].boundingBox;
      faceBox = Math.round(Math.max(box.width, box.height) * 1.6);
      sx = Math.max(0, Math.round(box.x + box.width / 2 - faceBox / 2));
      sy = Math.max(0, Math.round(box.y + box.height / 2 - faceBox / 2));
      faceBox = Math.min(faceBox, bitmap.width - sx, bitmap.height - sy);
    } else {
      sx = Math.round((bitmap.width - faceBox) / 2);
      sy = Math.round((bitmap.height - faceBox) / 2);
    }
  } else {
    sx = Math.round((bitmap.width - faceBox) / 2);
    sy = Math.round((bitmap.height - faceBox) / 2);
  }

  const tuned = applyCropTune(bitmap.width, bitmap.height, sx, sy, faceBox, input.cropTune);
  sx = tuned.sx;
  sy = tuned.sy;
  faceBox = tuned.faceBox;

  const photoCanvas = document.createElement("canvas");
  photoCanvas.width = photoW;
  photoCanvas.height = photoH;
  const photoCtx = photoCanvas.getContext("2d");
  if (!photoCtx) {
    bitmap.close();
    throw new Error("Photo canvas unavailable.");
  }
  photoCtx.fillStyle = input.bgColor;
  photoCtx.fillRect(0, 0, photoW, photoH);
  const b = Math.max(30, Math.min(200, input.cropTune.brightnessPct));
  const c = Math.max(30, Math.min(200, input.cropTune.contrastPct));
  photoCtx.filter = `brightness(${b}%) contrast(${c}%)`;
  photoCtx.drawImage(bitmap, sx, sy, faceBox, faceBox, 0, 0, photoW, photoH);
  photoCtx.filter = "none";
  bitmap.close();
  input.onProgress?.(78);
  await yieldToMain();

  const cols = Math.max(1, Math.floor((sheetCanvas.width - marginX * 2 + gapX) / (photoW + gapX)));
  const rows = Math.max(1, Math.floor((sheetCanvas.height - marginY * 2 + gapY) / (photoH + gapY)));
  const maxCells = cols * rows;
  const count = Math.min(Math.max(1, input.photoCount), maxCells);

  const basePositions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    basePositions.push({
      x: marginX + col * (photoW + gapX),
      y: marginY + row * (photoH + gapY),
    });
  }

  let dx = 0;
  let dy = 0;
  if (basePositions.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of basePositions) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + photoW);
      maxY = Math.max(maxY, p.y + photoH);
    }
    const blockW = maxX - minX;
    const blockH = maxY - minY;
    dx = (SHEET_W - blockW) / 2 - minX;
    dy = (SHEET_H - blockH) / 2 - minY;
  }

  const cutTick = scaleMargin(22, input.dpi);
  let index = 0;
  for (const p of basePositions) {
    throwIfAborted(input.signal);
    const x = Math.round(p.x + dx);
    const y = Math.round(p.y + dy);
    sheetCtx.strokeStyle = "#111";
    sheetCtx.lineWidth = Math.max(1, scaleMargin(2, input.dpi));
    sheetCtx.strokeRect(x, y, photoW, photoH);
    sheetCtx.drawImage(photoCanvas, x, y);
    if (input.cutMarks) drawCutMarks(sheetCtx, x, y, photoW, photoH, cutTick);
    index += 1;
    if (index % 2 === 0) {
      input.onProgress?.(78 + Math.min(18, Math.round((index / count) * 18)));
      await yieldToMain();
    }
  }

  sheetCtx.fillStyle = "#111";
  const fontPx = Math.max(16, scaleMargin(28, input.dpi));
  sheetCtx.font = `${fontPx}px Arial`;
  sheetCtx.fillText(
    `Qwickton Passport Sheet - ${PRESET_SIZES[input.preset].label} @ ${input.dpi} DPI`,
    scaleMargin(180, input.dpi),
    scaleMargin(115, input.dpi)
  );
  input.onProgress?.(98);
  await yieldToMain();
  const blob = await new Promise<Blob | null>((resolve) => sheetCanvas.toBlob(resolve, "image/jpeg", 0.97));
  if (!blob) throw new Error("Passport sheet generation failed.");
  input.onProgress?.(100);
  return blob;
}

type PassportPipelineInput = {
  file: File;
  preset: PassportCountryPreset;
  bgColor: string;
  autoRemoveBg: boolean;
  photoCount: number;
  dpi: PassportSheetDpi;
  cutMarks: boolean;
  cropTune: CropTune;
  onProgress?: (progress: number) => void;
};

async function runPassportPipelineJob(input: PassportPipelineInput, signal: AbortSignal): Promise<Blob> {
  return createPassportSheet({ ...input, signal });
}

export function PassportStudioPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<PassportCountryPreset>("india");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [photoCount, setPhotoCount] = useState(1);
  const [sheetDpi, setSheetDpi] = useState<PassportSheetDpi>(300);
  const [cutMarks, setCutMarks] = useState(false);
  const [cropTune, setCropTune] = useState<CropTune>(() => defaultCropTune());
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string>("");
  const [toolError, setToolError] = useState("");
  const pipeline = useProcessingPipeline(runPassportPipelineJob);
  const sizeText = useMemo(() => PRESET_SIZES[preset], [preset]);
  const layout = useMemo(() => passportLayoutForPreset(preset, sheetDpi), [preset, sheetDpi]);
  const { maxCells, cols, rows, sheetW, sheetH, photoW, photoH } = layout;
  const presetGuide = useMemo(() => PRESET_GUIDE[preset], [preset]);
  const etaSec =
    pipeline.progress > 0
      ? Math.max(0, Math.round((pipeline.elapsedMs / 1000) * ((100 - pipeline.progress) / pipeline.progress)))
      : null;
  useHubSeo(location.pathname, searchParams, {
    title: "Passport Photo Studio",
    description:
      "Passport and visa photo sheets for 30+ countries (Canada, China, Brazil, Gulf, Asia-Pacific, Americas, Africa, Europe) on A4 — optional on-device background removal, crop tuning, and DPI.",
  });

  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const passportCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Passport", to: "/passport" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);
  const canGenerate = Boolean(file);

  usePendingWorkFiles(
    (incoming) => {
      setToolError("");
      const img = incoming.find((x) => classifyFile(x) === "image");
      const pick = img ?? incoming[0];
      if (pick) setFile(pick);
    },
    { scrollToWorkId: QWICKTON_TOOL_WORK_ID }
  );

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (tool) {
      const meta = TOOL_CATALOG.find((t) => t.id === tool && t.category === "passport");
      if (meta) {
        const u = new URL(meta.path, "https://qk.local");
        const p = u.searchParams.get("preset");
        if (p && isPassportPreset(p)) setPreset(p);
        return;
      }
    }
    const p = searchParams.get("preset");
    if (p && isPassportPreset(p)) setPreset(p);
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get("tool")) return;
    scrollToolWorkAreaById(QWICKTON_TOOL_WORK_ID);
  }, [searchParams]);

  useEffect(() => {
    const raw = searchParams.get("copies");
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 1) {
      setPhotoCount(Math.min(n, maxCells));
    } else {
      setPhotoCount(maxCells);
    }
  }, [searchParams, maxCells]);

  const syncCopiesToUrl = (n: number) => {
    const clamped = Math.min(Math.max(1, n), maxCells);
    setPhotoCount(clamped);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clamped >= maxCells) next.delete("copies");
        else next.set("copies", String(clamped));
        return next;
      },
      { replace: true }
    );
  };

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
    setSheetPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [pipeline.result]);

  useEffect(() => {
    if (!file) return;
    setCropTune(defaultCropTune());
  }, [file]);

  const runGenerate = async () => {
    if (!file) return;
    localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Passport Studio"]));
    const start = performance.now();
    const { ok, output } = await pipeline.run({
      file,
      preset,
      bgColor,
      autoRemoveBg,
      photoCount,
      dpi: sheetDpi,
      cutMarks,
      cropTune,
      onProgress: (progress) => pipeline.setProgress(progress),
    });
    const outBlob = ok && output ? (output as Blob) : null;
    await sendSafeAnalytics({
      event: "process_passport",
      tool: preset,
      durationMs: Math.round(performance.now() - start),
      success: ok,
      bytesIn: file.size,
      bytesOut: outBlob?.size,
    });
  };

  const busy = pipeline.state === "processing" || pipeline.state === "validating";
  const tuneReset = () => setCropTune(defaultCropTune());

  return (
    <section className="tool-page" aria-labelledby="passport-title" aria-busy={busy ? true : undefined}>
      {passportCrumbs.length > 0 && (
        <nav className="tool-breadcrumbs" aria-label="Breadcrumb">
          <ol className="tool-breadcrumbs-list">
            {passportCrumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="tool-breadcrumbs-item">
                {i > 0 ? (
                  <span className="tool-breadcrumbs-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {c.to ? (
                  <Link to={c.to} className="tool-breadcrumbs-link">
                    {c.label}
                  </Link>
                ) : (
                  <span className="tool-breadcrumbs-current" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h2 id="passport-title">{catalogEntry?.title ?? "Passport Photo Studio"}</h2>
      {busy ? (
        <p className="sr-only" aria-live="polite">
          Processing in this tab. Please wait until it finishes.
        </p>
      ) : null}
      <ToolWorkflowStrip variant="files" />
      <Dropzone
        id={QWICKTON_TOOL_WORK_ID}
        accept="image/*"
        maxFiles={1}
        maxSizeMb={10}
        onError={setToolError}
        onFiles={(files) => {
          setToolError("");
          setFile(files[0] ?? null);
        }}
      />
      <p className="cost-note">
        <strong>What it does:</strong> {presetGuide.what}
      </p>
      <p className="cost-note">
        <strong>Best for:</strong> {presetGuide.bestFor}
      </p>
      <p className="cost-note">
        Output: JPEG sheet {sheetW}×{sheetH} px (A4 @ {sheetDpi} DPI). Each cell ≈ {photoW}×{photoH} px (
        {sizeText.label}). Grid up to {cols}×{rows} = {maxCells} photos; unused space stays blank.
      </p>
      <div className="toolbar">
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as PassportCountryPreset)}
          aria-label="Country or region preset"
        >
          {PASSPORT_PRESET_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.presets.map((p) => (
                <option key={p} value={p}>
                  {PRESET_SIZES[p].label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={sheetDpi}
          onChange={(e) => setSheetDpi(Number(e.target.value) as PassportSheetDpi)}
          aria-label="Print DPI"
        >
          <option value={200}>200 DPI (smaller file)</option>
          <option value={300}>300 DPI (standard)</option>
          <option value={600}>600 DPI (sharp print)</option>
        </select>
        <select value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Photo backdrop color">
          <option value="#ffffff">White</option>
          <option value="#87CEFA">Light blue</option>
          <option value="#e8f0e8">Mint</option>
          <option value="#f5f0e6">Warm cream</option>
          <option value="#f4f4f4">Light gray</option>
        </select>
        <label className="toolbar-check">
          <input type="checkbox" checked={autoRemoveBg} onChange={(e) => setAutoRemoveBg(e.target.checked)} />
          Auto remove background (AI)
        </label>
        <label className="toolbar-check">
          <input type="checkbox" checked={cutMarks} onChange={(e) => setCutMarks(e.target.checked)} />
          Cut marks on sheet
        </label>
        <label className="toolbar-check" style={{ gap: "0.5rem" }}>
          <span>Photos on sheet</span>
          <input
            type="number"
            min={1}
            max={maxCells}
            value={photoCount}
            onChange={(e) => syncCopiesToUrl(parseInt(e.target.value, 10) || 1)}
            aria-label="Number of passport photos on sheet"
            style={{ width: "4.5rem" }}
          />
        </label>
        <button type="button" className="qk-btn qk-btn--quiet" onClick={() => syncCopiesToUrl(maxCells)}>
          Fill sheet ({maxCells})
        </button>
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!canGenerate}
          onClick={() => runGenerate().catch(() => undefined)}
        >
          Generate sheet
        </button>
      </div>

      <details className="tool-guide-blurb passport-pro-panel" style={{ marginTop: "0.75rem" }}>
        <summary>Fine-tune face crop (rotation, zoom, color)</summary>
        <p className="cost-note" style={{ marginTop: "0.5rem" }}>
          Use when the automatic face box is wrong or your photo is sideways. Changes apply on the next Generate.
        </p>
        <div className="toolbar passport-tune-toolbar" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <span className="passport-tune-label">Rotate</span>
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              className={`qk-btn qk-btn--segment ${cropTune.rotationDeg === deg ? "is-selected" : ""}`}
              onClick={() => setCropTune((t) => ({ ...t, rotationDeg: deg }))}
            >
              {deg}°
            </button>
          ))}
          <span className="passport-tune-label">Zoom in</span>
          <input
            type="range"
            min={100}
            max={300}
            value={Math.round(cropTune.zoom * 100)}
            onChange={(e) =>
              setCropTune((t) => ({ ...t, zoom: Math.max(1, parseInt(e.target.value, 10) / 100) }))
            }
            aria-label="Crop zoom"
          />
          <span className="passport-tune-value">{Math.round(cropTune.zoom * 100)}%</span>
          <span className="passport-tune-label">Pan</span>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            title="Nudge subject left in frame"
            onClick={() => setCropTune((t) => ({ ...t, panX: t.panX + 12 }))}
          >
            ←
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            title="Nudge subject right in frame"
            onClick={() => setCropTune((t) => ({ ...t, panX: t.panX - 12 }))}
          >
            →
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            title="Nudge subject up in frame"
            onClick={() => setCropTune((t) => ({ ...t, panY: t.panY + 12 }))}
          >
            ↑
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            title="Nudge subject down in frame"
            onClick={() => setCropTune((t) => ({ ...t, panY: t.panY - 12 }))}
          >
            ↓
          </button>
          <span className="passport-tune-label">Brightness</span>
          <input
            type="range"
            min={70}
            max={130}
            value={cropTune.brightnessPct}
            onChange={(e) => setCropTune((t) => ({ ...t, brightnessPct: parseInt(e.target.value, 10) }))}
            aria-label="Brightness percent"
          />
          <span className="passport-tune-value">{cropTune.brightnessPct}%</span>
          <span className="passport-tune-label">Contrast</span>
          <input
            type="range"
            min={70}
            max={140}
            value={cropTune.contrastPct}
            onChange={(e) => setCropTune((t) => ({ ...t, contrastPct: parseInt(e.target.value, 10) }))}
            aria-label="Contrast percent"
          />
          <span className="passport-tune-value">{cropTune.contrastPct}%</span>
          <button type="button" className="qk-btn qk-btn--quiet" onClick={tuneReset}>
            Reset tuning
          </button>
        </div>
      </details>

      {!canGenerate && <p className="cost-note">Choose a clear face photo first, then click Generate sheet.</p>}
      <p>
        Target: {sizeText.label} @ {sheetDpi} DPI — {photoW}×{photoH} px per photo on the sheet.
      </p>
      <ProcessingStatusPanel
        state={pipeline.state}
        progress={pipeline.progress}
        elapsedMs={pipeline.elapsedMs}
        etaSec={etaSec}
      />
      {(sourceUrl || sheetPreviewUrl) && (
        <div className="preview-grid">
          <div>
            <p>Original photo</p>
            {sourceUrl && <img src={sourceUrl} className="preview-image" alt="Passport input preview" />}
            {!sourceUrl && <p className="cost-note">Photo preview appears here.</p>}
          </div>
          <div>
            <p>Print sheet</p>
            {sheetPreviewUrl && (
              <img src={sheetPreviewUrl} className="preview-image" alt="Passport sheet preview" />
            )}
            {!sheetPreviewUrl && <p className="cost-note">Generate the sheet to preview it here.</p>}
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
          onClick={() => triggerDownload(pipeline.result as Blob, `qwickton-passport-${preset}-${sheetDpi}dpi.jpg`)}
        >
          Download sheet
        </button>
      )}
      {(pipeline.state === "processing" || pipeline.state === "validating") && (
        <button type="button" className="qk-btn qk-btn--quiet" onClick={pipeline.cancel}>
          Cancel
        </button>
      )}
      <RelatedToolsLinks category="passport" excludeId={catalogEntry?.id} handoffFiles={file ? [file] : undefined} />
    </section>
  );
}
