import { useEffect } from "react";
import { defaultOgImageUrl, getSiteOrigin } from "./siteUrl";

/** Shown after the pipe in `document.title` and Open Graph titles. */
export const SITE_BRAND_NAME = "Qwickton";

export type PageSeoOptions = {
  keywords?: string;
  /** Override brand suffix (default Qwickton). Rare; keep consistent for trust. */
  brand?: string;
  /**
   * Longer title for og:title / twitter:title when the tab title should stay short.
   * If omitted, social titles match the document title.
   */
  openGraphTitle?: string;
  /** Absolute image URL for social cards; defaults to site OG asset. */
  imageUrl?: string;
  /** Schema.org JSON-LD (e.g. SoftwareApplication) for rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

const HREFLANG_ATTR = "data-qk-hreflang";

/** Single-language site: x-default + en point at the same URL (global audience, English UI). */
function setHreflangAlternates(canonicalUrl: string): void {
  document.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach((el) => el.remove());
  for (const lang of ["x-default", "en"]) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = lang;
    link.href = canonicalUrl;
    link.setAttribute(HREFLANG_ATTR, "1");
    document.head.appendChild(link);
  }
}

const JSON_LD_SCRIPT_ID = "qwickton-page-jsonld";

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined): void {
  const existing = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null;
  if (!data) {
    existing?.remove();
    return;
  }
  const blocks = Array.isArray(data) ? data : [data];
  let el = existing;
  if (!el) {
    el = document.createElement("script");
    el.id = JSON_LD_SCRIPT_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks);
}

function formatDocTitle(pageTitle: string, brand: string): string {
  const t = pageTitle.trim();
  const b = brand.trim() || SITE_BRAND_NAME;
  if (!t) return b;
  return `${t} | ${b}`;
}

/** Title + meta description + Open Graph + Twitter card + canonical (client-side SPA). */
export function usePageSeo(title: string, description: string, options?: PageSeoOptions): void {
  useEffect(() => {
    const brand = options?.brand?.trim() || SITE_BRAND_NAME;
    const docTitle = formatDocTitle(title, brand);
    const socialTitle = options?.openGraphTitle?.trim() || docTitle;
    document.title = docTitle;
    document.documentElement.lang = "en";

    setMetaByName("description", description);
    setMetaByName("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    if (options?.keywords) {
      setMetaByName("keywords", options.keywords);
    }

    setMetaByProperty("og:title", socialTitle);
    setMetaByProperty("og:site_name", SITE_BRAND_NAME);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:locale", "en_US");
    const origin = getSiteOrigin();
    const pathWithQuery = `${window.location.pathname}${window.location.search}`.split("#")[0];
    /** Avoid infinite /search?q=… canonical variants; deep links elsewhere keep their query string. */
    const canonicalPath = window.location.pathname === "/search" ? "/search" : pathWithQuery;
    const url = origin ? `${origin}${canonicalPath}` : `${window.location.origin}${canonicalPath}`;
    setMetaByProperty("og:url", url);

    const image = options?.imageUrl || defaultOgImageUrl();
    if (image) {
      setMetaByProperty("og:image", image);
      setMetaByName("twitter:image", image);
    }

    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", socialTitle);
    setMetaByName("twitter:description", description);

    setCanonical(url);
    setHreflangAlternates(url);

    setJsonLd(options?.jsonLd);
    return () => {
      setJsonLd(undefined);
      document.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach((el) => el.remove());
    };
  }, [
    title,
    description,
    options?.brand,
    options?.openGraphTitle,
    options?.keywords,
    options?.imageUrl,
    options?.jsonLd,
  ]);
}
