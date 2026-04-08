import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TOOL_CATALOG, type ToolEntry } from "../../app/toolCatalog";
import { PENDING_WORK_FILES_KEY, type PendingWorkFilesState } from "../../lib/routing/pendingWorkFiles";
import { getRelatedImageCatalogToolIds } from "../image/imageToolQuery";
import { getRelatedPdfCatalogToolIds } from "../pdf/pdfToolQuery";
import { getRelatedWordCatalogToolIds } from "../word/wordToolQuery";
import { getRelatedTextCatalogToolIds } from "../text/textToolSections";

type Props = {
  category: ToolEntry["category"];
  /** Hide the current catalog tool (matched by id). */
  excludeId?: string;
  max?: number;
  /** Carry current files to the related hub (same as Smart Drop handoff). */
  handoffFiles?: File[];
};

function converterTabFromCatalogPath(path: string): "image" | "excel" | "csv" | null {
  try {
    const base = path.startsWith("/") ? `https://qk.local${path}` : path;
    const u = new URL(base);
    const t = u.searchParams.get("tab");
    if (t === "image" || t === "excel" || t === "csv") return t;
  } catch {
    /* ignore */
  }
  return null;
}

function getRelatedConverterCatalogToolIds(excludeId: string): string[] | null {
  const ex = TOOL_CATALOG.find((t) => t.id === excludeId && t.category === "converter");
  if (!ex) return null;
  const tab = converterTabFromCatalogPath(ex.path);
  if (!tab) return null;
  return TOOL_CATALOG.filter(
    (t) => t.category === "converter" && t.id !== excludeId && converterTabFromCatalogPath(t.path) === tab
  ).map((t) => t.id);
}

function handoffState(files: File[] | undefined): PendingWorkFilesState | undefined {
  if (!files?.length) return undefined;
  return { [PENDING_WORK_FILES_KEY]: files };
}

export function RelatedToolsLinks({ category, excludeId, max = 10, handoffFiles }: Props) {
  const links = useMemo(() => {
    const pool = TOOL_CATALOG.filter((t) => t.category === category && t.id !== excludeId);
    if (!excludeId) {
      return [...pool].sort((a, b) => a.title.localeCompare(b.title)).slice(0, max);
    }
    let preferredIds: string[] | null = null;
    if (category === "pdf") preferredIds = getRelatedPdfCatalogToolIds(excludeId);
    else if (category === "image") preferredIds = getRelatedImageCatalogToolIds(excludeId);
    else if (category === "word") preferredIds = getRelatedWordCatalogToolIds(excludeId);
    else if (category === "text") preferredIds = getRelatedTextCatalogToolIds(excludeId);
    else if (category === "converter") preferredIds = getRelatedConverterCatalogToolIds(excludeId);

    const idSet = preferredIds && preferredIds.length > 0 ? new Set(preferredIds) : null;
    const pick = idSet ? pool.filter((t) => idSet.has(t.id)) : pool;
    const sorted = [...pick].sort((a, b) => a.title.localeCompare(b.title));
    return sorted.slice(0, max);
  }, [category, excludeId, max]);

  if (links.length === 0) return null;

  return (
    <section className="related-tools-block" aria-labelledby="related-tools-title">
      <h3 id="related-tools-title">Related tools</h3>
      <p className="related-tools-lead">More {category} utilities on Qwickton (same privacy-first, in-browser flow).</p>
      <ul className="related-tools-list">
        {links.map((t) => (
          <li key={t.id}>
            <Link to={t.path} state={handoffState(handoffFiles)}>
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
      <p className="related-tools-search">
        <Link to="/search">Search all tools →</Link>
      </p>
    </section>
  );
}
