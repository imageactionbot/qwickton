import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { triggerDownload } from "../shared/download";
import { sendSafeAnalytics } from "../../lib/privacy/analytics";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { formatUserFacingMessage } from "../../lib/errors/userFacingError";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";
import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";
import { classifyFile } from "../../lib/smartDrop/matchTools";

type ImageConvertTarget = "image/png" | "image/jpeg" | "image/webp";
type ConverterTab = "image" | "excel" | "csv";

function extensionForMime(mime: ImageConvertTarget): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

const TAB_GUIDE: Record<ConverterTab, { what: string; bestFor: string }> = {
  image: {
    what: "Re-encodes the same image as PNG, JPG, or WEBP (dimensions unchanged).",
    bestFor: "Sites that require a specific format; file size may change slightly by format.",
  },
  excel: {
    what: "Exports the first sheet as UTF-8 CSV text.",
    bestFor: "Using spreadsheet data in scripts, databases, or lightweight tools.",
  },
  csv: {
    what: "Packs CSV rows into a single-sheet XLSX workbook.",
    bestFor: "Opening comma-separated data in Excel when you only have a CSV file.",
  },
};

function scrollToSection(tab: ConverterTab): void {
  scrollToIdBelowStickyHeaderAfterPaint(`converter-tool-work-${tab}`);
}

export function ConverterHubPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [activeTab, setActiveTab] = useState<ConverterTab>(() => {
    try {
      const v = localStorage.getItem("qwickton_converter_tab");
      if (v === "image" || v === "excel" || v === "csv") return v;
    } catch {
      /* ignore */
    }
    return "image";
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSourceUrl, setImageSourceUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageTarget, setImageTarget] = useState<ImageConvertTarget>("image/png");
  const [imageQualityPercent, setImageQualityPercent] = useState(92);
  const [imageResultBlob, setImageResultBlob] = useState<Blob | null>(null);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState("");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState("");

  const [error, setError] = useState("");

  useHubSeo(location.pathname, searchParams, {
    title: "Converter Hub",
    description:
      "Images PNG/JPG/WEBP with quality; Excel sheet → UTF-8 CSV; CSV → XLSX — all local. Word/DOCX: use the Word hub.",
  });

  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const converterCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Converter", to: "/converter" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);

  const tabGuide = useMemo(() => TAB_GUIDE[activeTab], [activeTab]);
  const converterHandoffFiles = useMemo(() => {
    const out: File[] = [];
    if (imageFile) out.push(imageFile);
    if (excelFile) out.push(excelFile);
    if (csvFile) out.push(csvFile);
    return out.length ? out : undefined;
  }, [imageFile, excelFile, csvFile]);

  usePendingWorkFiles((incoming) => {
    setError("");
    const first = incoming[0];
    if (!first) return;
    const k = classifyFile(first);
    if (k === "image") {
      setActiveTab("image");
      try {
        localStorage.setItem("qwickton_converter_tab", "image");
      } catch {
        /* ignore */
      }
      setImageFile(first);
      return;
    }
    if (k === "spreadsheet") {
      setActiveTab("excel");
      try {
        localStorage.setItem("qwickton_converter_tab", "excel");
      } catch {
        /* ignore */
      }
      setExcelFile(first);
      return;
    }
    if (k === "csv") {
      setActiveTab("csv");
      try {
        localStorage.setItem("qwickton_converter_tab", "csv");
      } catch {
        /* ignore */
      }
      setCsvFile(first);
    }
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "image" || tab === "excel" || tab === "csv") {
      setActiveTab(tab);
      try {
        localStorage.setItem("qwickton_converter_tab", tab);
      } catch {
        /* ignore */
      }
      scrollToSection(tab);
    }
    const out = searchParams.get("out");
    if (out === "png") setImageTarget("image/png");
    if (out === "jpeg" || out === "jpg") setImageTarget("image/jpeg");
    if (out === "webp") setImageTarget("image/webp");
  }, [searchParams]);

  useEffect(() => {
    const tool = searchParams.get("tool");
    const tabParam = searchParams.get("tab");
    if (!tool && !tabParam) return;
    const tab: ConverterTab =
      tabParam === "image" || tabParam === "excel" || tabParam === "csv" ? tabParam : activeTab;
    scrollToIdBelowStickyHeaderAfterPaint(`converter-tool-work-${tab}`);
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!imageFile) {
      setImageSourceUrl("");
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setImageSourceUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!imageFile) {
      setImageResultBlob(null);
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, [imageFile]);

  useEffect(() => {
    if (!imageResultBlob) {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return;
    }
    const url = URL.createObjectURL(imageResultBlob);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [imageResultBlob]);

  useEffect(() => {
    if (!excelFile) {
      setExcelPreview("");
    }
  }, [excelFile]);

  useEffect(() => {
    if (!csvFile) {
      setCsvPreview("");
    }
  }, [csvFile]);

  const convertImage = async () => {
    if (!imageFile) return;
    setError("");
    const start = performance.now();
    try {
      const bitmap = await createImageBitmap(imageFile);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        setError("Canvas not available.");
        await sendSafeAnalytics({
          event: "process_converter",
          tool: `image-${imageTarget}`,
          durationMs: Math.round(performance.now() - start),
          success: false,
          bytesIn: imageFile.size,
        });
        return;
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const q = imageQualityPercent / 100;
      const blob = await new Promise<Blob | null>((resolve) => {
        if (imageTarget === "image/png") {
          canvas.toBlob(resolve, imageTarget);
        } else {
          canvas.toBlob(resolve, imageTarget, q);
        }
      });
      if (!blob) {
        setError("Image conversion failed.");
        await sendSafeAnalytics({
          event: "process_converter",
          tool: `image-${imageTarget}`,
          durationMs: Math.round(performance.now() - start),
          success: false,
          bytesIn: imageFile.size,
        });
        return;
      }
      setImageResultBlob(blob);
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Converter Hub"]));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: `image-${imageTarget}`,
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: imageFile.size,
        bytesOut: blob.size,
      });
    } catch (e) {
      setError(formatUserFacingMessage(e));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: `image-${imageTarget}`,
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: imageFile.size,
      });
    }
  };

  const convertExcelToCsv = async () => {
    if (!excelFile) return;
    setError("");
    const start = performance.now();
    try {
      const xlsx = await import("xlsx");
      const buffer = await excelFile.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = xlsx.utils.sheet_to_csv(firstSheet);
      setExcelPreview(csv.split("\n").slice(0, 8).join("\n"));
      const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      triggerDownload(csvBlob, "qwickton-converted.csv");
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Converter Hub"]));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: "excel-to-csv",
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: excelFile.size,
        bytesOut: csvBlob.size,
      });
    } catch (err) {
      setError(formatUserFacingMessage(err));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: "excel-to-csv",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: excelFile.size,
      });
    }
  };

  const convertCsvToExcel = async () => {
    if (!csvFile) return;
    setError("");
    const start = performance.now();
    try {
      const xlsx = await import("xlsx");
      const csv = await csvFile.text();
      setCsvPreview(csv.split("\n").slice(0, 8).join("\n"));
      const parsed = xlsx.read(csv, { type: "string", raw: false });
      const firstName = parsed.SheetNames[0];
      if (!firstName) throw new Error("CSV appears empty.");
      const worksheet = parsed.Sheets[firstName];
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const xlsxArray = xlsx.write(workbook, { type: "array", bookType: "xlsx" });
      const outBlob = new Blob([xlsxArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      triggerDownload(outBlob, "qwickton-converted.xlsx");
      localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Converter Hub"]));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: "csv-to-excel",
        durationMs: Math.round(performance.now() - start),
        success: true,
        bytesIn: csvFile.size,
        bytesOut: outBlob.size,
      });
    } catch (err) {
      setError(formatUserFacingMessage(err));
      await sendSafeAnalytics({
        event: "process_converter",
        tool: "csv-to-excel",
        durationMs: Math.round(performance.now() - start),
        success: false,
        bytesIn: csvFile.size,
      });
    }
  };

  const goTab = (t: ConverterTab) => {
    setActiveTab(t);
    try {
      localStorage.setItem("qwickton_converter_tab", t);
    } catch {
      /* ignore */
    }
    scrollToSection(t);
  };

  return (
    <ToolPageShell
      title={catalogEntry?.title ?? "Converter Hub"}
      breadcrumbs={converterCrumbs}
    >
      <ToolGuideBlurb what={tabGuide.what} bestFor={tabGuide.bestFor} />
      <p className="cost-note">
        Word / DOCX tools (preview, PDF, plain text): <Link to="/word">Word hub</Link>.
      </p>
      <div className="toolbar">
        <button type="button" className="qk-btn qk-btn--segment" onClick={() => goTab("image")}>
          Image
        </button>
        <button type="button" className="qk-btn qk-btn--segment" onClick={() => goTab("excel")}>
          Excel → CSV
        </button>
        <button type="button" className="qk-btn qk-btn--segment" onClick={() => goTab("csv")}>
          CSV → Excel
        </button>
      </div>

      <h3 id="converter-section-image">Image Converter (JPG / PNG / WEBP)</h3>
      <Dropzone
        id="converter-tool-work-image"
        accept="image/*"
        maxFiles={1}
        maxSizeMb={15}
        onError={setError}
        onFiles={(files) => {
          setError("");
          setImageFile(files[0] ?? null);
        }}
      />
      <div className="toolbar">
        <select
          value={imageTarget}
          onChange={(e) => setImageTarget(e.target.value as ImageConvertTarget)}
          aria-label="Output image format"
        >
          <option value="image/png">Convert to PNG</option>
          <option value="image/jpeg">Convert to JPG</option>
          <option value="image/webp">Convert to WEBP</option>
        </select>
        {imageTarget !== "image/png" && (
          <label className="toolbar-check">
            Quality {imageQualityPercent}%
            <input
              type="range"
              min={70}
              max={98}
              value={imageQualityPercent}
              onChange={(e) => setImageQualityPercent(Number(e.target.value))}
            />
          </label>
        )}
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!imageFile}
          onClick={() => convertImage().catch(() => undefined)}
        >
          Convert image
        </button>
      </div>
      {imageFile && (
        <div className="preview-grid">
          <div>
            <p>Original</p>
            {imageSourceUrl && <img src={imageSourceUrl} className="preview-image" alt="Input" />}
          </div>
          <div>
            <p>Result</p>
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} className="preview-image" alt="Converted preview" />
            ) : (
              <p className="cost-note">Convert to see the result here.</p>
            )}
          </div>
        </div>
      )}

      {imageResultBlob && (
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          onClick={() =>
            triggerDownload(imageResultBlob, `qwickton-converted.${extensionForMime(imageTarget)}`)
          }
        >
          Download converted image
        </button>
      )}

      <h3 id="converter-section-excel">Excel to CSV</h3>
      <Dropzone
        id="converter-tool-work-excel"
        accept=".xlsx,.xls"
        maxFiles={1}
        maxSizeMb={20}
        onError={setError}
        onFiles={(files) => {
          setError("");
          setExcelFile(files[0] ?? null);
        }}
      />
      <div className="toolbar">
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!excelFile}
          onClick={() => convertExcelToCsv().catch(() => undefined)}
        >
          Convert Excel to CSV
        </button>
      </div>
      {excelPreview && <pre className="csv-preview">{excelPreview}</pre>}

      <h3 id="converter-section-csv">CSV to Excel</h3>
      <Dropzone
        id="converter-tool-work-csv"
        accept=".csv,text/csv"
        maxFiles={1}
        maxSizeMb={20}
        onError={setError}
        onFiles={(files) => {
          setError("");
          setCsvFile(files[0] ?? null);
        }}
      />
      <div className="toolbar">
        <button
          type="button"
          className="qk-btn qk-btn--primary"
          disabled={!csvFile}
          onClick={() => convertCsvToExcel().catch(() => undefined)}
        >
          Convert CSV to Excel
        </button>
      </div>
      {csvPreview && <pre className="csv-preview">{csvPreview}</pre>}

      {error && <UserFacingErrorBlock message={error} technicalDetails={error} />}
      <RelatedToolsLinks category="converter" excludeId={catalogEntry?.id} handoffFiles={converterHandoffFiles} />
    </ToolPageShell>
  );
}
