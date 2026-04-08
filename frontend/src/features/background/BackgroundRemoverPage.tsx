import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { ProcessingStatusPanel } from "../shared/ProcessingStatusPanel";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { formatUserFacingMessage } from "../../lib/errors/userFacingError";
import { QWICKTON_TOOL_WORK_ID, scrollToolWorkAreaById } from "../shared/scrollToolWorkArea";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";
import { classifyFile } from "../../lib/smartDrop/matchTools";
import type { ProcessingState } from "../shared/useProcessingPipeline";

const GUIDE = {
  what: "The on-device AI separates the foreground; you can export a flat fill color or a transparent PNG.",
  bestFor: "Passport-style cutouts, product shots, and profile photos — all in the browser without server uploads.",
};

export function BackgroundRemoverPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparentOutput, setTransparentOutput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  useHubSeo(location.pathname, searchParams, {
    title: "AI Background Remover",
    description:
      "Remove image backgrounds locally with AI; export transparent PNG or a solid fill — runs in your browser.",
  });

  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const bgCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Background", to: "/background-remove" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);

  usePendingWorkFiles(
    (incoming) => {
      setError("");
      const img = incoming.find((x) => classifyFile(x) === "image");
      const pick = img ?? incoming[0];
      if (pick) setFile(pick);
    },
    { scrollToWorkId: QWICKTON_TOOL_WORK_ID }
  );

  const etaSec =
    progress > 0 && progress < 100 && startedAt
      ? Math.max(0, Math.round((elapsedMs / 1000) * ((100 - progress) / progress)))
      : null;

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
    if (!file) {
      setResultBlob(null);
      setError("");
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, [file]);

  useEffect(() => {
    if (!resultBlob) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return;
    }
    const url = URL.createObjectURL(resultBlob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [resultBlob]);

  useEffect(() => {
    if (!loading || !startedAt) return;
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => window.clearInterval(id);
  }, [loading, startedAt]);

  const canRun = Boolean(file);

  const process = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    setProgress(0);
    setStartedAt(Date.now());
    setElapsedMs(0);
    const start = performance.now();
    try {
      const bgModule = await import("@imgly/background-removal");
      setProgress(5);
      const foregroundBlob = await bgModule.removeBackground(file, {
        model: "isnet_fp16",
        output: { format: "image/png", quality: 0.98 },
        progress: (_, current, total) => {
          const ratio = total > 0 ? current / total : 0;
          setProgress(10 + Math.round(ratio * 80));
        },
      });

      if (transparentOutput) {
        setProgress(95);
        setResultBlob(foregroundBlob);
        setProgress(100);
        localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Background Remove"]));
        await sendSafeAnalytics({
          event: "process_background",
          tool: "transparent-png",
          durationMs: Math.round(performance.now() - start),
          success: true,
          bytesIn: file.size,
          bytesOut: foregroundBlob.size,
        });
        return;
      }

      const fgBitmap = await createImageBitmap(foregroundBlob);
      const canvas = document.createElement("canvas");
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fgBitmap.close();
        throw new Error("Canvas not available.");
      }
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fgBitmap, 0, 0);
      fgBitmap.close();
      setProgress(92);
      const outBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.95)
      );
      if (!outBlob) throw new Error("Output generation failed.");
      setResultBlob(outBlob);
      setProgress(100);
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Background Remove"]));
      await sendSafeAnalytics({
        event: "process_background",
        tool: `solid-${bgColor}`,
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: file.size,
        bytesOut: outBlob.size,
      });
    } catch (errN) {
      setError(formatUserFacingMessage(errN));
      await sendSafeAnalytics({
        event: "process_background",
        tool: transparentOutput ? "transparent-png" : "solid",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: file.size,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchParams.get("tool")) return;
    scrollToolWorkAreaById(QWICKTON_TOOL_WORK_ID);
  }, [searchParams]);

  const guideLines = useMemo(
    () =>
      transparentOutput
        ? "Output: PNG with alpha (some apps show transparency as a checkerboard)."
        : "Output: PNG with flat background color (print / forms friendly).",
    [transparentOutput]
  );

  const panelState: ProcessingState = loading
    ? "processing"
    : error
      ? "error"
      : resultBlob
        ? "done"
        : "idle";

  return (
    <ToolPageShell
      title={catalogEntry?.title ?? "AI Background Remover"}
      busy={loading}
      breadcrumbs={bgCrumbs}
    >
      <Dropzone
        id={QWICKTON_TOOL_WORK_ID}
        accept="image/*"
        maxFiles={1}
        maxSizeMb={12}
        onError={setError}
        onFiles={(files) => {
          setError("");
          setFile(files[0] ?? null);
        }}
      />
      <ToolGuideBlurb what={GUIDE.what} bestFor={GUIDE.bestFor} />
      <p className="cost-note">{guideLines}</p>
      <div className="toolbar">
        <label className="toolbar-check">
          <input
            type="checkbox"
            checked={transparentOutput}
            onChange={(e) => setTransparentOutput(e.target.checked)}
          />
          Transparent PNG (no fill)
        </label>
        {!transparentOutput && (
          <select value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Background fill color">
            <option value="#ffffff">White</option>
            <option value="#87CEFA">Blue</option>
            <option value="#f4f4f4">Light gray</option>
            <option value="#00b894">Green</option>
          </select>
        )}
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!canRun || loading}
          onClick={() => process().catch(() => undefined)}
        >
          {loading ? "Removing…" : "Remove background"}
        </button>
      </div>
      {!canRun && <p className="cost-note">Select an image first, then click Remove background.</p>}
      <ProcessingStatusPanel
        state={panelState}
        progress={progress}
        elapsedMs={elapsedMs}
        etaSec={loading ? etaSec : null}
      />
      {(sourceUrl || previewUrl) && (
        <div className="preview-grid">
          <div>
            <p>Original</p>
            {sourceUrl && <img src={sourceUrl} className="preview-image" alt="Original" />}
          </div>
          <div>
            <p>Result</p>
            {previewUrl && <img src={previewUrl} className="preview-image" alt="Background removed" />}
            {!previewUrl && <p className="cost-note">Remove background to see the result here.</p>}
          </div>
        </div>
      )}
      {error && <UserFacingErrorBlock message={error} technicalDetails={error} />}
      {resultBlob && (
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          onClick={() => triggerDownload(resultBlob, "qwickton-background-removed.png")}
        >
          Download PNG
        </button>
      )}
      <RelatedToolsLinks
        category="background"
        excludeId={catalogEntry?.id}
        handoffFiles={file ? [file] : undefined}
      />
    </ToolPageShell>
  );
}
