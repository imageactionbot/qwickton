import { TOOL_CATALOG, type ToolEntry } from "../../app/toolCatalog";

/** Query keys that do not change which catalog tool a URL refers to. */
const CATALOG_IGNORED_KEYS = new Set(["copies"]);

export function searchParamsForCatalogMatch(searchParams: URLSearchParams): URLSearchParams {
  const keys = [...new Set([...searchParams.keys()])].sort();
  const sp = new URLSearchParams();
  for (const k of keys) {
    if (CATALOG_IGNORED_KEYS.has(k)) continue;
    const vals = searchParams.getAll(k).sort();
    for (const v of vals) sp.append(k, v);
  }
  return sp;
}

/** Stable query ordering for matching catalog paths to current location. */
export function normalizeToolPath(pathWithQuery: string): string {
  const trimmed = pathWithQuery.trim();
  const base = trimmed.startsWith("/") ? `https://qk.local${trimmed}` : `https://qk.local/${trimmed}`;
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return trimmed;
  }
  const keys = [...new Set([...u.searchParams.keys()])].sort();
  const sp = new URLSearchParams();
  for (const k of keys) {
    const vals = u.searchParams.getAll(k).sort();
    for (const v of vals) sp.append(k, v);
  }
  const q = sp.toString();
  return `${u.pathname}${q ? `?${q}` : ""}`;
}

export function findCatalogEntry(pathname: string, searchParams: URLSearchParams): ToolEntry | null {
  const forMatch = searchParamsForCatalogMatch(searchParams);
  const raw = forMatch.toString();
  const current = normalizeToolPath(pathname + (raw ? `?${raw}` : ""));

  for (const t of TOOL_CATALOG) {
    if (normalizeToolPath(t.path) === current) return t;
  }

  const toolId = searchParams.get("tool");
  if (toolId) {
    const byId = TOOL_CATALOG.find((t) => t.id === toolId);
    if (byId) {
      const entryPath = byId.path.split("?")[0];
      if (entryPath === pathname) return byId;
    }
  }

  return null;
}
