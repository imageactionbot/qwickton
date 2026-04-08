import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { ToolEntry } from "../../app/toolCatalog";
import { rankToolEntriesWithScores } from "../../lib/fuzzyRank";

type Props = {
  open: boolean;
  onClose: () => void;
  tools: ToolEntry[];
};

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return t.isContentEditable;
}

export function CommandPalette({ open, onClose, tools }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => rankToolEntriesWithScores(tools, q), [tools, q]);
  const results = useMemo(() => ranked.map((r) => r.entry), [ranked]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-palette-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open, results.length]);

  if (!open) return null;

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const onBackdropPointerDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].path);
    }
  };

  return createPortal(
    <div
      className="cmd-palette-backdrop no-print"
      role="presentation"
      onMouseDown={onBackdropPointerDown}
    >
      <div
        className="cmd-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmd-palette-head">
          <span className="cmd-palette-kicker">
            <img
              className="cmd-palette-kicker-logo"
              src="/logo.svg"
              width="20"
              height="20"
              alt=""
              decoding="async"
            />
            Intent search
          </span>
          <button type="button" className="cmd-palette-close" onClick={onClose} aria-label="Close">
            Esc
          </button>
        </div>
        <input
          ref={inputRef}
          className="cmd-palette-input"
          placeholder={`Describe a job — ${tools.length}+ tools, typo-tolerant (mearge, pasport, docx…)`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onInputKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls="cmd-palette-listbox"
        />
        <div
          id="cmd-palette-listbox"
          ref={listRef}
          className="cmd-palette-list"
          role="listbox"
          aria-activedescendant={results[active] ? `palette-opt-${active}` : undefined}
        >
          {results.length === 0 ? (
            <p className="cmd-palette-empty" role="status">
              No tools match that query. Try shorter initials (e.g. “mrg” for merge).
            </p>
          ) : (
            results.map((tool, i) => {
              const isTop = i === 0 && q.trim().length > 0 && (ranked[0]?.score ?? 0) > 0;
              return (
                <button
                  key={`${tool.path}-${tool.id}`}
                  type="button"
                  id={`palette-opt-${i}`}
                  data-palette-index={i}
                  role="option"
                  aria-selected={i === active}
                  className={`cmd-palette-item${i === active ? " is-active" : ""}${isTop ? " is-top-match" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(tool.path)}
                >
                  <span className="cmd-palette-item-main">
                    <span className="cmd-palette-item-title">{tool.title}</span>
                    {isTop ? (
                      <span className="cmd-palette-top-badge" title="Highest intent match for your phrase">
                        Top match
                      </span>
                    ) : null}
                  </span>
                  <span className="cmd-palette-item-meta">{tool.category}</span>
                </button>
              );
            })
          )}
        </div>
        <p className="cmd-palette-hint">
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close · ranks by intent, not just spelling
        </p>
      </div>
    </div>,
    document.body
  );
}

export function isEditableDomTarget(target: EventTarget | null): boolean {
  return isEditableTarget(target);
}
