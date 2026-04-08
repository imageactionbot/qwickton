/** Canonical site origin for OG URLs and sitemaps. Set `VITE_SITE_URL` in production (no trailing slash). */
export function getSiteOrigin(): string {
  const env = import.meta.env.VITE_SITE_URL;
  if (typeof env === "string" && env.trim()) {
    return env.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function absoluteUrl(pathnameAndSearch: string): string {
  const origin = getSiteOrigin();
  const path = pathnameAndSearch.startsWith("/") ? pathnameAndSearch : `/${pathnameAndSearch}`;
  return origin ? `${origin}${path}` : path;
}

export function defaultOgImageUrl(): string {
  return absoluteUrl("/og-image.svg");
}
