/**
 * Google AdSense loader for Auto Ads + optional manual units later.
 * Set VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX in .env.production (full client id).
 * Production builds fall back to ADSENSE_CA_PUB_FULL so layout + meta stay aligned with index.html.
 *
 * Intrusive formats (fullscreen, vignette) are controlled in the AdSense console, not here.
 */
import { ADSENSE_CA_PUB_FULL } from "./adsensePublisherId";

const SCRIPT_HOST = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

let loaded = false;

export function getAdsenseClientId(): string | undefined {
  const raw = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
  if (!raw) return undefined;
  if (raw.startsWith("ca-pub-")) return raw;
  if (/^\d+$/.test(raw)) return `ca-pub-${raw}`;
  return raw;
}

/** Client id for this deployment (env override, else production default). */
export function getEffectiveAdsenseClientId(): string | undefined {
  return getAdsenseClientId() ?? (import.meta.env.PROD ? ADSENSE_CA_PUB_FULL : undefined);
}

function ensureAdsenseAccountMeta(client: string): void {
  if (document.querySelector('meta[name="google-adsense-account"]')) return;
  const el = document.createElement("meta");
  el.setAttribute("name", "google-adsense-account");
  el.setAttribute("content", client);
  document.head.prepend(el);
}

export function bootstrapAdsense(): void {
  if (typeof document === "undefined" || loaded) return;
  const client = getEffectiveAdsenseClientId();

  const existingHead = document.querySelector(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
  );
  if (existingHead) {
    loaded = true;
    if (client) {
      ensureAdsenseAccountMeta(client);
      document.documentElement.classList.add("qk-ads");
    }
    return;
  }

  if (!client) return;

  loaded = true;
  ensureAdsenseAccountMeta(client);
  document.documentElement.classList.add("qk-ads");

  const existing = document.querySelector(`script[data-qk-adsense="1"]`);
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `${SCRIPT_HOST}?client=${encodeURIComponent(client)}`;
  script.crossOrigin = "anonymous";
  script.dataset.qkAdsense = "1";
  document.head.appendChild(script);
}

export function isAdsenseConfigured(): boolean {
  return Boolean(getEffectiveAdsenseClientId());
}
