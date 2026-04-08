import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { showToast } from "../../lib/toast/toastBus";

type Props = {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMb?: number;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  /** Also pop a short toast when validation fails (still calls onError). */
  toastErrors?: boolean;
  /** Anchor for deep-link scroll (e.g. id="qwickton-tool-work"). */
  id?: string;
};

export function Dropzone({
  accept,
  multiple,
  maxFiles,
  maxSizeMb,
  onFiles,
  onError,
  toastErrors = true,
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const reportError = (message: string) => {
    onError?.(message);
    if (toastErrors) showToast(message, "error", 5200);
  };

  const validate = (files: File[]) => {
    if (maxFiles && files.length > maxFiles) {
      reportError(`Maximum ${maxFiles} files allowed.`);
      return [];
    }
    if (maxSizeMb) {
      const maxBytes = maxSizeMb * 1024 * 1024;
      const oversized = files.find((f) => f.size > maxBytes);
      if (oversized) {
        reportError(`File "${oversized.name}" exceeds ${maxSizeMb} MB limit.`);
        return [];
      }
    }
    return files;
  };

  const acceptMatches = (file: File): boolean => {
    if (!accept || accept.trim() === "") return true;
    const name = file.name.toLowerCase();
    const mime = (file.type || "").toLowerCase();
    const parts = accept.split(",").map((p) => p.trim());
    for (const p of parts) {
      if (!p) continue;
      if (p.startsWith(".")) {
        if (name.endsWith(p.toLowerCase())) return true;
        continue;
      }
      if (p.endsWith("/*")) {
        const prefix = p.slice(0, -1);
        if (mime.startsWith(prefix)) return true;
        continue;
      }
      if (mime === p.toLowerCase()) return true;
    }
    return false;
  };

  const filterAccepted = (files: File[]): File[] => {
    if (!accept || accept.trim() === "") return files;
    const ok = files.filter(acceptMatches);
    const dropped = files.length - ok.length;
    if (ok.length === 0 && dropped > 0) {
      reportError("None of the pasted files match what this tool accepts. Try another format.");
      return [];
    }
    if (dropped > 0) {
      showToast(`Ignored ${dropped} file(s) that did not match this tool.`, "info", 3800);
    }
    return ok;
  };

  const isFileDrag = (e: DragEvent) => {
    const types = e.dataTransfer?.types;
    if (!types || types.length === 0) return false;
    for (let i = 0; i < types.length; i++) {
      if (types[i] === "Files") return true;
    }
    return false;
  };

  return (
    <div
      id={id}
      className={`dropzone${dragActive ? " dropzone--dragging" : ""}`}
      data-qk-drop-active={dragActive ? "true" : undefined}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isFileDrag(e)) return;
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        if (isFileDrag(e)) setDragActive(true);
      }}
      onDragLeave={(e) => {
        const rel = e.relatedTarget;
        if (rel instanceof Node && e.currentTarget.contains(rel)) return;
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        onFiles(validate(Array.from(e.dataTransfer.files)));
      }}
      onPaste={(e: ClipboardEvent) => {
        const items = e.clipboardData?.files;
        if (!items || items.length === 0) return;
        e.preventDefault();
        const list = filterAccepted(Array.from(items));
        if (list.length === 0) return;
        const ready = validate(list);
        if (ready.length === 0) return;
        onFiles(ready);
        showToast(`Added ${ready.length} file(s) from clipboard.`, "success", 2800);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={
        dragActive
          ? "Drop files to upload (release to add)"
          : "Choose files: drag and drop, paste from clipboard, or press Enter to browse"
      }
    >
      <span className="dropzone-icon" aria-hidden />
      <p className="dropzone-title">Drag &amp; drop files here</p>
      <p className="dropzone-sub">
        or tap / click to browse — you can also paste files when this tile is focused (⌘V / Ctrl+V)
      </p>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFiles(validate(Array.from(e.target.files ?? [])))}
      />
    </div>
  );
}
