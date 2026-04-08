/** Tools per page on home + /search catalog grids (keeps DOM light as the catalog grows). */
export const CATALOG_PAGE_SIZE = 40;

export function catalogTotalPages(total: number, pageSize = CATALOG_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

export function catalogSlicePage<T>(items: T[], page: number, pageSize = CATALOG_PAGE_SIZE): T[] {
  const safePage = Math.min(Math.max(1, page), catalogTotalPages(items.length, pageSize));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function catalogDisplayRange(
  page: number,
  total: number,
  pageSize = CATALOG_PAGE_SIZE
): { from: number; to: number } {
  const pages = catalogTotalPages(total, pageSize);
  const safePage = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  return { from, to };
}
