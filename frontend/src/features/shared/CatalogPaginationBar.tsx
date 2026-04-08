import { CATALOG_PAGE_SIZE, catalogTotalPages } from "../../lib/catalogPagination";
import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";

type Props = {
  page: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
  /** Scroll target after page change (element id). */
  scrollTargetId?: string;
};

export function CatalogPaginationBar({ page, totalItems, onPageChange, scrollTargetId }: Props) {
  const totalPages = catalogTotalPages(totalItems, CATALOG_PAGE_SIZE);
  if (totalItems === 0 || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    onPageChange(clamped);
    if (scrollTargetId && typeof document !== "undefined") {
      scrollToIdBelowStickyHeaderAfterPaint(scrollTargetId);
    }
  };

  return (
    <nav className="catalog-pagination" aria-label="Catalog pages">
      <button
        type="button"
        className="catalog-pagination-btn qk-btn qk-btn--quiet"
        disabled={safePage <= 1}
        onClick={() => go(safePage - 1)}
      >
        Previous
      </button>
      <p className="catalog-pagination-status">
        Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
      </p>
      <button
        type="button"
        className="catalog-pagination-btn qk-btn qk-btn--quiet"
        disabled={safePage >= totalPages}
        onClick={() => go(safePage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
