/**
 * Google Analytics 4 (gtag.js). Set VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX in production.
 * When unset, nothing loads. SPA route changes send page_view via syncGa4PageView.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let bootstrapped = false;

export function getGa4MeasurementId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return undefined;
  return id;
}

export function bootstrapGa4(): void {
  if (typeof document === "undefined" || bootstrapped) return;
  const id = getGa4MeasurementId();
  if (!id) return;

  bootstrapped = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  if (document.querySelector("script[data-qk-ga4='1']")) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.qkGa4 = "1";
  document.head.appendChild(script);
}

/** Call on each React Router navigation (including initial mount). */
export function syncGa4PageView(pathWithSearch: string): void {
  if (!getGa4MeasurementId() || typeof window.gtag !== "function") return;
  const page_location = `${window.location.origin}${pathWithSearch}`;
  window.gtag("event", "page_view", {
    page_path: pathWithSearch,
    page_location,
    page_title: document.title,
  });
}
