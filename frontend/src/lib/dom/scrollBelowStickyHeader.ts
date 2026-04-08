/** Scroll so element top sits just below a sticky header (or other offset). */
export function scrollElementBelowSticky(
  element: Element | null,
  options?: {
    stickySelector?: string;
    gapPx?: number;
    behavior?: ScrollBehavior;
  }
): void {
  if (!element || !(element instanceof HTMLElement)) return;
  const stickySel = options?.stickySelector ?? ".shell-header";
  const gap = options?.gapPx ?? 10;
  const sticky = document.querySelector(stickySel);
  const offset = (sticky?.getBoundingClientRect().height ?? 0) + gap;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = options?.behavior ?? (reduce ? "auto" : "smooth");
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function scrollToIdBelowStickyHeader(
  elementId: string,
  opts?: { stickySelector?: string; gapPx?: number; behavior?: ScrollBehavior }
): void {
  scrollElementBelowSticky(document.getElementById(elementId), opts);
}

/** Wait for layout after React commit, then scroll (double rAF for late paints). */
export function scrollToIdBelowStickyHeaderAfterPaint(elementId: string): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToIdBelowStickyHeader(elementId);
    });
  });
}
