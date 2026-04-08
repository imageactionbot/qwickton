/** 0-based page indices, sorted. Used by PDF worker and tests. */
export function parsePageIndices(spec: string, totalPages: number): number[] {
  const out = new Set<number>();
  const trimmed = spec.trim();
  if (!trimmed) throw new Error("Enter page range, e.g. 1-3 or 1,4,6-8.");
  const parts = trimmed.split(/[\s,]+/).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((s) => Number(s.trim()));
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Invalid range: ${part}`);
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let p = start; p <= end; p += 1) {
        if (p >= 1 && p <= totalPages) out.add(p - 1);
      }
    } else {
      const p = Number(part);
      if (!Number.isFinite(p)) throw new Error(`Invalid page: ${part}`);
      if (p >= 1 && p <= totalPages) out.add(p - 1);
    }
  }
  if (!out.size) throw new Error("No valid pages in range.");
  return [...out].sort((x, y) => x - y);
}
