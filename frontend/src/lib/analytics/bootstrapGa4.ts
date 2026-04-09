/**
 * GA4 gtag.js is loaded from index.html (G-J3HZE1D5M6). This file only sends SPA page_view on route changes.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA4_MEASUREMENT_ID = "G-J3HZE1D5M6";

export function syncGa4PageView(pathWithSearch: string): void {
  if (typeof window.gtag !== "function") return;
  const page_location = `${window.location.origin}${pathWithSearch}`;
  window.gtag("event", "page_view", {
    page_path: pathWithSearch,
    page_location,
    page_title: document.title,
  });
}
