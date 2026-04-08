import type { ToolEntry } from "../app/toolCatalog";
import { categoryDiscoveryHaystack } from "./seo/internationalSeo";

/** Fold accents; keep Latin + Devanagari word chars (Hindi / multilingual aliases). */
export function normalizeSearchText(s: string): string {
  let t = s;
  try {
    t = s.normalize("NFD").replace(/\p{M}/gu, "");
  } catch {
    t = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Levenshtein distance (short strings only; used for typo-tolerant search). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const t = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = t;
    }
  }
  return dp[n];
}

/**
 * Score for matching one query token to a haystack word.
 * Exact / prefix matches win; typos use edit distance with length-aware thresholds.
 */
export function wordMatchScore(qt: string, w: string): number {
  if (!qt.length || !w.length) return 0;
  if (qt === w) return 1000;
  if (qt.length === 1) return w === qt || w.startsWith(qt) ? 320 : 0;
  if (w.startsWith(qt)) return 850 - Math.min(220, (w.length - qt.length) * 18);
  if (qt.startsWith(w) && w.length >= 2) return 720 - Math.min(180, (qt.length - w.length) * 12);
  const maxL = Math.max(qt.length, w.length);
  const d = levenshtein(qt, w);
  if (maxL <= 4) {
    if (d > 2) return 0;
    return Math.round(((maxL - d) / maxL) * 620);
  }
  const maxDist = Math.min(3, Math.floor(maxL / 3));
  if (d > maxDist) return 0;
  return Math.round(((maxL - d) / maxL) * 560);
}

function hayWordsFromString(raw: string): string[] {
  const norm = normalizeSearchText(raw);
  return [...new Set(norm.split(" ").filter(Boolean))];
}

function hayWordsForEntry(t: ToolEntry): string[] {
  const raw = `${t.title} ${t.id} ${t.description} ${(t.aliases ?? []).join(" ")} ${t.category} ${t.seoKeywords ?? ""} ${categoryDiscoveryHaystack(t.category)}`;
  return hayWordsFromString(raw);
}

function typoTokenScore(qNorm: string, words: string[]): number {
  const tokens = qNorm.split(" ").filter(Boolean);
  if (!tokens.length) return 0;
  let sum = 0;
  for (const qt of tokens) {
    let best = 0;
    for (const w of words) {
      best = Math.max(best, wordMatchScore(qt, w));
    }
    if (best === 0) return 0;
    sum += best;
  }
  return Math.round(sum / tokens.length);
}

/**
 * Combined rank: subsequence fuzzy (fast typing) scaled up, plus typo-token signal.
 * If subsequence fails entirely, typo similarity can still surface iLovePDF / merge-style typos.
 */
function toolEntryCombinedScore(queryRaw: string, t: ToolEntry): number {
  const hay = toolEntryHaystack(t);
  const sub = fuzzyRank(queryRaw, t.title, hay);
  const qn = normalizeSearchText(queryRaw);
  if (!qn) return 0;
  const typo = typoTokenScore(qn, hayWordsForEntry(t));
  if (sub > 0) return sub * 1000 + typo;
  return typo;
}

function toolEntryHaystack(t: ToolEntry): string {
  return `${t.description} ${t.category} ${t.id} ${(t.aliases ?? []).join(" ")} ${t.seoKeywords ?? ""} ${categoryDiscoveryHaystack(t.category)}`;
}

function hayWordBankForTools(tools: ToolEntry[]): string[] {
  const bag = new Set<string>();
  for (const t of tools) {
    for (const w of hayWordsForEntry(t)) {
      if (w.length >= 2) bag.add(w);
    }
  }
  return [...bag];
}

/**
 * When the user types a close-but-wrong phrase, suggest a corrected query (must yield results).
 */
export function suggestQueryCorrection(query: string, tools: ToolEntry[]): string | null {
  const qn = normalizeSearchText(query);
  if (qn.length < 2) return null;
  const tokens = qn.split(" ").filter(Boolean);
  if (!tokens.length) return null;
  const bank = hayWordBankForTools(tools);
  const pieces: string[] = [];
  for (const qt of tokens) {
    let best = qt;
    let bestScore = 0;
    for (const w of bank) {
      const s = wordMatchScore(qt, w);
      if (s > bestScore) {
        bestScore = s;
        best = w;
      }
    }
    if (bestScore < 200) return null;
    pieces.push(best);
  }
  const candidate = pieces.join(" ");
  if (candidate === qn) return null;
  if (sortToolEntriesByFuzzyInner(tools, candidate).length === 0) return null;
  return candidate;
}

/** Sequential fuzzy match score; 0 = query not matched in order. */
export function fuzzyRank(query: string, title: string, extra = ""): number {
  const q = normalizeSearchText(query).replace(/\s+/g, "");
  const hay = normalizeSearchText(`${title} ${extra}`).replace(/\s+/g, "");
  if (!q) return 1;
  let qi = 0;
  let score = 0;
  let last = -1;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) {
      const contiguous = i === last + 1 ? 10 : 0;
      const early = i < 4 ? 6 : 0;
      score += 14 + contiguous + early;
      last = i;
      qi++;
    }
  }
  if (qi < q.length) return 0;
  score += Math.max(0, 48 - title.length * 0.15);
  return Math.round(score);
}

function combinedScoreSimple(queryRaw: string, title: string, category: string): number {
  const sub = fuzzyRank(queryRaw, title, category);
  const qn = normalizeSearchText(queryRaw);
  if (!qn) return 0;
  const words = hayWordsFromString(`${title} ${category}`);
  const typo = typoTokenScore(qn, words);
  if (sub > 0) return sub * 1000 + typo;
  return typo;
}

export function sortToolsByFuzzy<T extends { title: string; category: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim();
  if (!q) {
    return [...items].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 80);
  }
  const scored = items
    .map((t) => ({ t, s: combinedScoreSimple(q, t.title, t.category) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.title.localeCompare(b.t.title));
  return scored.map((x) => x.t).slice(0, 80);
}

/** Rank full catalog entries using title + description + aliases (homepage / search page / palette). */
export function sortToolEntriesByFuzzy(tools: ToolEntry[], query: string): ToolEntry[] {
  const q = query.trim();
  if (!q) {
    return [...tools].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 200);
  }
  return sortToolEntriesByFuzzyInner(tools, q);
}

function sortToolEntriesByFuzzyInner(tools: ToolEntry[], q: string): ToolEntry[] {
  const scored = tools
    .map((t) => ({ t, s: toolEntryCombinedScore(q, t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.title.localeCompare(b.t.title));
  return scored.map((x) => x.t).slice(0, 200);
}

/** Same ordering as {@link sortToolEntriesByFuzzy}, with raw scores for UI hints (e.g. “top match”). */
export function rankToolEntriesWithScores(
  tools: ToolEntry[],
  query: string
): { entry: ToolEntry; score: number }[] {
  const q = query.trim();
  if (!q) {
    return [...tools]
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 200)
      .map((entry) => ({ entry, score: 0 }));
  }
  const scored = tools
    .map((entry) => ({ entry, score: toolEntryCombinedScore(q, entry) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return scored.slice(0, 200);
}
