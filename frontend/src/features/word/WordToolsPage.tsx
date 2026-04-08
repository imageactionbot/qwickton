import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import { formatUserFacingMessage } from "../../lib/errors/userFacingError";
import { convertDocxToHtml, extractDocxRawText, sanitizeDocxHtml } from "../../lib/docx/docxToHtml";
import { validateDocxFile } from "../../lib/docx/validateDocx";
import { htmlElementToPdfBlob, openHtmlPrintWindow } from "../../lib/docx/clientPdf";
import { scrollWordCatalogToolIntoView } from "./wordToolQuery";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";
import { QWICKTON_TOOL_WORK_ID } from "../shared/scrollToolWorkArea";

function bytesToMb(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function countTextStats(text: string): { words: number; chars: number; lines: number } {
  const trimmed = text.trim();
  return {
    chars: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split(/\r?\n/).length : 0,
  };
}

const GUIDE = {
  what:
    "Parses DOCX (Office Open XML) in your browser for preview, plain-text extraction (DCR), and client-side PDF — file bytes are not uploaded to us.",
  bestFor:
    "Quick PDF sharing and copyable text when desktop Word is not available. Layout may not match Word exactly (tables and images are often usable).",
};

export function WordToolsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [parserNotes, setParserNotes] = useState<string[]>([]);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [sanitizedHtml, setSanitizedHtml] = useState("");

  const [extractLoading, setExtractLoading] = useState(false);
  const [rawText, setRawText] = useState("");

  const [pdfLoading, setPdfLoading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  useHubSeo(location.pathname, searchParams, {
    title: "Word & DOCX tools",
    description:
      "Local DOCX: formatted preview, document content reader (plain text), PDF via html2pdf, print to PDF. DOCX only — not legacy .doc.",
  });

  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const wordCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Word", to: "/word" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);

  useEffect(() => {
    scrollWordCatalogToolIntoView(searchParams);
  }, [searchParams]);

  const fileLine = useMemo(() => {
    if (!file) return null;
    return `${file.name} · ${file.type || "document"} · ${bytesToMb(file.size)}`;
  }, [file]);

  const textStats = useMemo(() => (rawText ? countTextStats(rawText) : null), [rawText]);

  usePendingWorkFiles(
    (incoming) => {
      const f = incoming[0];
      if (!f) return;
      setError("");
      if (!validateDocxFile(f, setError)) return;
      setFile(f);
      setSanitizedHtml("");
      setRawText("");
      setParserNotes([]);
    },
    { scrollToWorkId: QWICKTON_TOOL_WORK_ID }
  );

  const resetOutputs = () => {
    setSanitizedHtml("");
    setRawText("");
    setParserNotes([]);
    setError("");
  };

  const onPickFiles = (files: File[]) => {
    setError("");
    const f = files[0];
    if (!f || !validateDocxFile(f, setError)) return;
    setFile(f);
    resetOutputs();
  };

  const runPreview = async () => {
    if (!file) return;
    setPreviewLoading(true);
    setError("");
    const start = performance.now();
    try {
      const buffer = await file.arrayBuffer();
      const { html, messages } = await convertDocxToHtml(buffer);
      setSanitizedHtml(sanitizeDocxHtml(html));
      setParserNotes(messages);
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Word & DOCX"]));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-preview",
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: file.size,
      });
    } catch (e) {
      setError(formatUserFacingMessage(e));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-preview",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: file.size,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const runExtract = async () => {
    if (!file) return;
    setExtractLoading(true);
    setError("");
    const start = performance.now();
    try {
      const buffer = await file.arrayBuffer();
      const { text, messages } = await extractDocxRawText(buffer);
      setRawText(text);
      setParserNotes((prev) => [...new Set([...messages, ...prev])]);
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Word & DOCX"]));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-dcr-text",
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: file.size,
      });
    } catch (e) {
      setError(formatUserFacingMessage(e));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-dcr-text",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: file.size,
      });
    } finally {
      setExtractLoading(false);
    }
  };

  const runPrint = () => {
    if (!sanitizedHtml) return;
    const w = openHtmlPrintWindow(sanitizedHtml, "DOCX print");
    if (!w) setError("Print window blocked — allow popups or use Download PDF.");
  };

  const runPdf = async () => {
    const el = previewRef.current;
    if (!el || !sanitizedHtml || !file) return;
    setPdfLoading(true);
    setError("");
    const start = performance.now();
    try {
      const blob = await htmlElementToPdfBlob(el);
      const base = file.name.replace(/\.docx$/i, "") || "document";
      triggerDownload(blob, `qwickton-${base}.pdf`);
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Word & DOCX"]));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-to-pdf",
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: file.size,
        bytesOut: blob.size,
      });
    } catch (e) {
      setError(formatUserFacingMessage(e));
      await sendSafeAnalytics({
        event: "process_word",
        tool: "docx-to-pdf",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: file.size,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadExtractedTxt = () => {
    if (!rawText || !file) return;
    const base = file.name.replace(/\.docx$/i, "") || "document";
    triggerDownload(new Blob([rawText], { type: "text/plain;charset=utf-8" }), `qwickton-${base}.txt`);
    void sendSafeAnalytics({
      event: "process_word",
      tool: "docx-txt-download",
      success: true,
      bytesIn: file.size,
      bytesOut: new Blob([rawText]).size,
    });
  };

  return (
    <ToolPageShell title={catalogEntry?.title ?? "Word & DOCX"} breadcrumbs={wordCrumbs}>
      <ToolGuideBlurb what={GUIDE.what} bestFor={GUIDE.bestFor} />

      {fileLine && (
        <div className="pdf-meta-card word-file-meta">
          <p>
            <strong>Current file</strong>
          </p>
          <p>{fileLine}</p>
          {textStats && rawText && (
            <p className="cost-note">
              Extracted text: {textStats.words} words · {textStats.chars} chars · {textStats.lines} lines
            </p>
          )}
        </div>
      )}

      <section id="word-studio" className="word-hub-section">
        <h3>Studio — preview & PDF</h3>
        <p className="cost-note">
          <strong>.docx</strong> only. Load the preview first, then use raster PDF (approximate layout) or Print → Save as PDF
          (often closer to the original visually).
        </p>
        <Dropzone
          id="qwickton-tool-work"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          maxFiles={1}
          maxSizeMb={12}
          onError={setError}
          onFiles={onPickFiles}
        />
        <div className="toolbar">
          <button
            type="button"
            className="qk-btn qk-btn--primary"
            disabled={!file || previewLoading}
            onClick={() => runPreview().catch(() => undefined)}
          >
            {previewLoading ? "Loading…" : "Load formatted preview"}
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--primary"
            disabled={!sanitizedHtml || pdfLoading}
            onClick={() => runPdf().catch(() => undefined)}
          >
            {pdfLoading ? "PDF…" : "Download PDF"}
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--primary"
            disabled={!sanitizedHtml}
            onClick={runPrint}
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            onClick={() => {
              setFile(null);
              resetOutputs();
            }}
            disabled={!file && !sanitizedHtml && !rawText}
          >
            Clear
          </button>
        </div>
        {parserNotes.length > 0 && (
          <p className="cost-note">
            <strong>Parser notes:</strong> {parserNotes.slice(0, 6).join(" · ")}
            {parserNotes.length > 6 ? " …" : ""}
          </p>
        )}
        {sanitizedHtml ? (
          <div
            ref={previewRef}
            className="docx-preview-root"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          file &&
          !previewLoading && <p className="cost-note">Use “Load formatted preview” to show output here.</p>
        )}
      </section>

      <section id="word-extract" className="word-hub-section">
        <h3>DCR — document content reader (plain text)</h3>
        <p className="cost-note">
          Mammoth <code>extractRawText</code>: fast text for search, copy-paste, and lightweight pipelines. This is not a
          formatted layout view — only a readable body text stream.
        </p>
        <div className="toolbar">
          <button
            type="button"
            className="qk-btn qk-btn--primary"
            disabled={!file || extractLoading}
            onClick={() => runExtract().catch(() => undefined)}
          >
            {extractLoading ? "Extracting…" : "Extract plain text"}
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--primary"
            disabled={!rawText}
            onClick={downloadExtractedTxt}
          >
            Download .txt
          </button>
          <button
            type="button"
            className="qk-btn qk-btn--quiet"
            disabled={!rawText}
            onClick={() => void navigator.clipboard.writeText(rawText).catch(() => undefined)}
          >
            Copy text
          </button>
        </div>
        {rawText ? (
          <textarea className="text-workspace word-extract-textarea" readOnly value={rawText} spellCheck={false} />
        ) : (
          file &&
          !extractLoading && <p className="cost-note">With a DOCX selected, click “Extract plain text”.</p>
        )}
      </section>

      <section id="word-doc-legacy" className="word-hub-section">
        <h3>Legacy .doc (binary) — policy</h3>
        <p className="cost-note">
          Legacy <strong>.doc</strong> (binary) files cannot be opened reliably in the browser. In Word or LibreOffice, use{" "}
          <strong>Save As → .docx</strong>, then upload here. Files that fail the ZIP structure check (including some
          renamed or corrupt files) may be rejected.
        </p>
      </section>

      {error && <UserFacingErrorBlock message={error} technicalDetails={error} />}
      <RelatedToolsLinks category="word" excludeId={catalogEntry?.id} handoffFiles={file ? [file] : undefined} />
    </ToolPageShell>
  );
}
