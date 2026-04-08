import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { triggerDownload } from "../shared/download";
import { sendTextToolAnalytics } from "../../lib/privacy/analytics";
import { useHubSeo } from "../../lib/seo/useHubSeo";
import { findCatalogEntry } from "../../lib/seo/catalogMatch";
import { ToolPageShell } from "../shared/ToolPageShell";
import { RelatedToolsLinks } from "../shared/RelatedToolsLinks";
import { ToolGuideBlurb } from "../shared/ToolGuideBlurb";
import { UserFacingErrorBlock } from "../shared/UserFacingErrorBlock";
import { TEXT_TOOL_SECTION_BY_ID } from "./textToolSections";
import { usePendingWorkFiles } from "../../lib/routing/pendingWorkFiles";
import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";
import { QWICKTON_TEXT_WORKSPACE_ID } from "../shared/scrollToolWorkArea";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";

const SECTION_BLURB: Record<string, string> = {
  "text-json": "Parse, pretty-print, minify, or validate — everything stays in this tab locally.",
  "text-base64": "Encode or decode UTF-8 bytes as Base64 strings.",
  "text-encode": "Percent-style encoding for query strings and form values (encodeURIComponent).",
  "text-html": "Escape entities for safe HTML display or recover plain text.",
  "text-case": "UPPER, lower, and title case using English word boundaries.",
  "text-lines": "Multiline tools: trim, filter empty lines, sort A–Z or Z–A, and dedupe.",
  "text-hash": "SHA-256 in hexadecimal — useful for checksums; runs locally with Web Crypto.",
  "text-misc": "Reverse characters and build URL-friendly ASCII slugs.",
  "text-generate": "Insert UUIDs or append a sample paragraph.",
  "text-stats": "Live character, word, and line counts below.",
};

function countStats(text: string): { chars: number; words: number; lines: number } {
  const trimmed = text.trim();
  return {
    chars: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split(/\r?\n/).length : 0,
  };
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(n < 10240 ? 2 : 1)} KB`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function logTextTool(tool: string, success: boolean, start: number): void {
  void sendTextToolAnalytics({
    event: "process_text",
    tool,
    durationMs: Math.round(performance.now() - start),
    success,
  });
  if (success) {
    localStorage.setItem("qwickton_recent_tools", JSON.stringify(["Text Tools"]));
  }
}

const MAX_UNDO = 30;

export function TextToolsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [input, setInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const stats = useMemo(() => countStats(input), [input]);
  const utf8Bytes = useMemo(() => utf8ByteLength(input), [input]);
  const [relatedHandoffFiles, setRelatedHandoffFiles] = useState<File[] | undefined>();

  usePendingWorkFiles(
    (incoming) => {
      const f = incoming[0];
      if (!f) return;
      setRelatedHandoffFiles([f]);
      void f.text().then((t) => {
        setInput(t);
        setJsonError("");
      });
    },
    { scrollToWorkId: QWICKTON_TEXT_WORKSPACE_ID }
  );

  const commitInput = (next: string) => {
    if (next === input) return;
    setUndoStack((s) => [...s, input].slice(-MAX_UNDO));
    setInput(next);
  };

  const undoLast = () => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const copy = [...stack];
      const prev = copy.pop()!;
      setInput(prev);
      setJsonError("");
      return copy;
    });
  };

  useHubSeo(location.pathname, searchParams, {
    title: "Text Utilities",
    description:
      "Local JSON, Base64, URL/HTML encode, line tools, slugify, UUID — live buffer stats (chars, words, UTF-8 bytes), no server upload.",
  });

  const catalogEntry = useMemo(
    () => findCatalogEntry(location.pathname, new URLSearchParams(searchKey)),
    [location.pathname, searchKey]
  );
  const textCrumbs = useMemo(() => {
    const base: { label: string; to?: string }[] = [
      { label: "All tools", to: "/" },
      { label: "Text", to: "/text" },
    ];
    if (catalogEntry) base.push({ label: catalogEntry.title });
    return base;
  }, [catalogEntry]);

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (!tool) return;
    const id = TEXT_TOOL_SECTION_BY_ID[tool];
    if (!id) return;
    scrollToIdBelowStickyHeaderAfterPaint(id);
  }, [searchParams]);

  const prettyJson = () => {
    const start = performance.now();
    setJsonError("");
    try {
      const parsed = JSON.parse(input || "null");
      commitInput(JSON.stringify(parsed, null, 2));
      setLastActionLabel("JSON pretty print");
      logTextTool("json-pretty", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      logTextTool("json-pretty", false, start);
    }
  };

  const minifyJson = () => {
    const start = performance.now();
    setJsonError("");
    try {
      const parsed = JSON.parse(input || "null");
      commitInput(JSON.stringify(parsed));
      setLastActionLabel("JSON minify");
      logTextTool("json-minify", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      logTextTool("json-minify", false, start);
    }
  };

  const validateJson = () => {
    const start = performance.now();
    setJsonError("");
    try {
      JSON.parse(input || "null");
      setLastActionLabel("JSON validate (OK)");
      logTextTool("validate-json", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      logTextTool("validate-json", false, start);
    }
  };

  const toBase64 = () => {
    const start = performance.now();
    setJsonError("");
    try {
      const b = new TextEncoder().encode(input);
      let bin = "";
      b.forEach((byte) => {
        bin += String.fromCharCode(byte);
      });
      commitInput(btoa(bin));
      setLastActionLabel("Text to Base64");
      logTextTool("base64-encode", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Encode failed");
      logTextTool("base64-encode", false, start);
    }
  };

  const fromBase64 = () => {
    const start = performance.now();
    setJsonError("");
    try {
      const bin = atob(input.trim());
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      commitInput(new TextDecoder().decode(bytes));
      setLastActionLabel("Base64 to text");
      logTextTool("base64-decode", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid Base64");
      logTextTool("base64-decode", false, start);
    }
  };

  const urlEncode = () => {
    const start = performance.now();
    setJsonError("");
    try {
      commitInput(encodeURIComponent(input));
      setLastActionLabel("URL encode");
      logTextTool("url-encode", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Encode failed");
      logTextTool("url-encode", false, start);
    }
  };

  const urlDecode = () => {
    const start = performance.now();
    setJsonError("");
    try {
      commitInput(decodeURIComponent(input));
      setLastActionLabel("URL decode");
      logTextTool("url-decode", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Decode failed");
      logTextTool("url-decode", false, start);
    }
  };

  const doHtmlEscape = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(escapeHtml(input));
    setLastActionLabel("HTML escape");
    logTextTool("html-escape", true, start);
  };

  const doHtmlUnescape = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(unescapeHtml(input));
    setLastActionLabel("HTML unescape");
    logTextTool("html-unescape", true, start);
  };

  const sha256Hex = async () => {
    const start = performance.now();
    setJsonError("");
    if (!globalThis.crypto?.subtle) {
      setJsonError("SHA-256 needs a secure context (HTTPS or localhost).");
      logTextTool("sha-256-text", false, start);
      return;
    }
    try {
      const buf = new TextEncoder().encode(input);
      const hash = await crypto.subtle.digest("SHA-256", buf);
      const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
      commitInput(hex);
      setLastActionLabel("SHA-256 (hex)");
      logTextTool("sha-256-text", true, start);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Hash failed");
      logTextTool("sha-256-text", false, start);
    }
  };

  const doUpper = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(input.toUpperCase());
    setLastActionLabel("Uppercase");
    logTextTool("uppercase", true, start);
  };

  const doLower = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(input.toLowerCase());
    setLastActionLabel("Lowercase");
    logTextTool("lowercase", true, start);
  };

  const doTitle = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(input.toLowerCase().replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase()));
    setLastActionLabel("Title case");
    logTextTool("title-case", true, start);
  };

  const downloadTxt = () => {
    const start = performance.now();
    triggerDownload(new Blob([input], { type: "text/plain;charset=utf-8" }), "qwickton-text.txt");
    setLastActionLabel("Download .txt");
    logTextTool("download-txt", true, start);
  };

  const runLineOp = (fn: (lines: string[]) => string[], tool: string, label: string) => {
    const start = performance.now();
    setJsonError("");
    const lines = input.split(/\r?\n/);
    commitInput(fn(lines).join("\n"));
    setLastActionLabel(label);
    logTextTool(tool, true, start);
  };

  const doReverse = () => {
    const start = performance.now();
    setJsonError("");
    commitInput([...input].reverse().join(""));
    setLastActionLabel("Reverse characters");
    logTextTool("reverse-text", true, start);
  };

  const doSlugify = () => {
    const start = performance.now();
    setJsonError("");
    commitInput(
      input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
    setLastActionLabel("Slugify");
    logTextTool("slugify", true, start);
  };

  const appendUuid = () => {
    const start = performance.now();
    setJsonError("");
    commitInput((input ? `${input}\n` : "") + crypto.randomUUID());
    setLastActionLabel("Append UUID");
    logTextTool("uuid-append", true, start);
  };

  const insertLorem = () => {
    const start = performance.now();
    setJsonError("");
    commitInput((input ? `${input}\n\n` : "") + LOREM);
    setLastActionLabel("Insert Lorem");
    logTextTool("lorem-insert", true, start);
  };

  return (
    <ToolPageShell
      title={catalogEntry?.title ?? "Text and data utilities"}
      breadcrumbs={textCrumbs}
      workflow="text"
    >
      <ToolGuideBlurb
        what="Every transform runs in this browser tab — your text is not sent to our servers."
        bestFor="JSON debugging, Base64, URL/HTML encoding, line cleanup, slugs, and UUIDs."
        whatLabel="Overview:"
        privacyTip={false}
      />
      <p className="cost-note">Only paste sensitive data on devices you trust.</p>
      <div className="toolbar">
        <button type="button" disabled={undoStack.length === 0} onClick={undoLast}>
          Undo last tool
        </button>
      </div>

      <textarea
        id={QWICKTON_TEXT_WORKSPACE_ID}
        className="text-workspace"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setJsonError("");
        }}
        placeholder="Paste text, JSON, Base64, or encoded content here…"
        spellCheck={false}
      />

      <div className="pdf-meta-grid">
        <div className="pdf-meta-card">
          <p>
            <strong>Buffer</strong>
          </p>
          <p>
            {stats.chars} chars · {stats.words} words · {stats.lines} lines · {formatBytes(utf8Bytes)} UTF-8
          </p>
        </div>
        <div className="pdf-meta-card">
          <p>
            <strong>Last action</strong>
          </p>
          {lastActionLabel ? (
            <p className="cost-note">{lastActionLabel}</p>
          ) : (
            <p className="cost-note">Run any tool button — the action name will show here.</p>
          )}
        </div>
      </div>

      <div id="text-json" className="text-tool-block">
        <h3>JSON</h3>
        <p className="cost-note">{SECTION_BLURB["text-json"]}</p>
        <div className="toolbar">
          <button type="button" onClick={prettyJson}>
            Pretty print
          </button>
          <button type="button" onClick={minifyJson}>
            Minify
          </button>
          <button type="button" onClick={validateJson}>
            Validate
          </button>
        </div>
      </div>

      <div id="text-base64" className="text-tool-block">
        <h3>Base64</h3>
        <p className="cost-note">{SECTION_BLURB["text-base64"]}</p>
        <div className="toolbar">
          <button type="button" onClick={toBase64}>
            Text → Base64
          </button>
          <button type="button" onClick={fromBase64}>
            Base64 → Text
          </button>
        </div>
      </div>

      <div id="text-encode" className="text-tool-block">
        <h3>URL encoding</h3>
        <p className="cost-note">{SECTION_BLURB["text-encode"]}</p>
        <div className="toolbar">
          <button type="button" onClick={urlEncode}>
            Encode URI component
          </button>
          <button type="button" onClick={urlDecode}>
            Decode URI component
          </button>
        </div>
      </div>

      <div id="text-html" className="text-tool-block">
        <h3>HTML</h3>
        <p className="cost-note">{SECTION_BLURB["text-html"]}</p>
        <div className="toolbar">
          <button type="button" onClick={doHtmlEscape}>
            Escape entities
          </button>
          <button type="button" onClick={doHtmlUnescape}>
            Unescape entities
          </button>
        </div>
      </div>

      <div id="text-hash" className="text-tool-block">
        <h3>SHA-256</h3>
        <p className="cost-note">{SECTION_BLURB["text-hash"]}</p>
        <div className="toolbar">
          <button type="button" onClick={() => void sha256Hex()}>
            Replace buffer with SHA-256 (hex)
          </button>
        </div>
      </div>

      <div id="text-case" className="text-tool-block">
        <h3>Case</h3>
        <p className="cost-note">{SECTION_BLURB["text-case"]}</p>
        <div className="toolbar">
          <button type="button" onClick={doUpper}>
            UPPERCASE
          </button>
          <button type="button" onClick={doLower}>
            lowercase
          </button>
          <button type="button" onClick={doTitle}>
            Title Case
          </button>
        </div>
      </div>

      <div id="text-lines" className="text-tool-block">
        <h3>Lines</h3>
        <p className="cost-note">{SECTION_BLURB["text-lines"]}</p>
        <div className="toolbar">
          <button
            type="button"
            onClick={() => runLineOp((lines) => lines.map((l) => l.trim()), "lines-trim", "Trim lines")}
          >
            Trim each line
          </button>
          <button
            type="button"
            onClick={() =>
              runLineOp((lines) => lines.filter((l) => l.trim() !== ""), "lines-remove-empty", "Remove empty lines")
            }
          >
            Remove empty lines
          </button>
          <button
            type="button"
            onClick={() =>
              runLineOp((lines) => [...lines].sort((a, b) => a.localeCompare(b)), "lines-sort", "Sort lines")
            }
          >
            Sort A–Z
          </button>
          <button
            type="button"
            onClick={() =>
              runLineOp(
                (lines) => [...lines].sort((a, b) => b.localeCompare(a)),
                "sort-lines-desc",
                "Sort lines Z–A"
              )
            }
          >
            Sort Z–A
          </button>
          <button
            type="button"
            onClick={() => runLineOp((lines) => [...new Set(lines)], "lines-unique", "Unique lines")}
          >
            Unique lines
          </button>
        </div>
      </div>

      <div id="text-misc" className="text-tool-block">
        <h3>Transform</h3>
        <p className="cost-note">{SECTION_BLURB["text-misc"]}</p>
        <div className="toolbar">
          <button type="button" onClick={doReverse}>
            Reverse characters
          </button>
          <button type="button" onClick={doSlugify}>
            Slugify
          </button>
        </div>
      </div>

      <div id="text-generate" className="text-tool-block">
        <h3>Generate</h3>
        <p className="cost-note">{SECTION_BLURB["text-generate"]}</p>
        <div className="toolbar">
          <button type="button" onClick={appendUuid}>
            Append UUID v4
          </button>
          <button type="button" onClick={insertLorem}>
            Insert Lorem sample
          </button>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" onClick={downloadTxt}>
          Download .txt
        </button>
      </div>

      {jsonError && <UserFacingErrorBlock message={jsonError} technicalDetails={jsonError} />}

      <p id="text-stats" className="cost-note">
        {SECTION_BLURB["text-stats"]} — Characters: {stats.chars} · Words: {stats.words} · Lines: {stats.lines}
      </p>
      <RelatedToolsLinks category="text" excludeId={catalogEntry?.id} handoffFiles={relatedHandoffFiles} />
    </ToolPageShell>
  );
}
