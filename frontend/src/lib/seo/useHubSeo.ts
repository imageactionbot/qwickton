import { useMemo } from "react";
import { keywordsForToolEntry, type ToolEntry } from "../../app/toolCatalog";
import { findCatalogEntry, searchParamsForCatalogMatch } from "./catalogMatch";
import { absoluteUrl } from "./siteUrl";
import { SITE_BRAND_NAME, usePageSeo } from "./usePageSeo";

type HubFallback = { title: string; description: string };

const CATEGORY_HUB: Record<ToolEntry["category"], { label: string; path: string }> = {
  pdf: { label: "PDF tools", path: "/pdf" },
  image: { label: "Image tools", path: "/image" },
  passport: { label: "Passport studio", path: "/passport" },
  background: { label: "Background removal", path: "/background-remove" },
  converter: { label: "Converters", path: "/converter" },
  text: { label: "Text tools", path: "/text" },
  word: { label: "Word & DOCX", path: "/word" },
};

function categoryBrowseMeta(category: ToolEntry["category"]): { label: string; path: string } {
  return CATEGORY_HUB[category];
}

/** Hub-level SEO with per-catalog-entry titles and descriptions when URL matches the tool catalog. */
export function useHubSeo(pathname: string, searchParams: URLSearchParams, hubFallback: HubFallback): void {
  const searchKey = searchParams.toString();
  const entry = useMemo(
    () => findCatalogEntry(pathname, new URLSearchParams(searchKey)),
    [pathname, searchKey]
  );
  const title = entry?.title ?? hubFallback.title;
  const description = entry?.description ?? hubFallback.description;
  const seoExtras = useMemo(() => {
    const keywords = entry
      ? keywordsForToolEntry(entry)
      : `Qwickton, ${hubFallback.title}, free tools, privacy, browser`;
    const forUrl = searchParamsForCatalogMatch(new URLSearchParams(searchKey));
    const q = forUrl.toString();
    const pathWithQuery = `${pathname}${q ? `?${q}` : ""}`;
    const toolPageUrl = absoluteUrl(pathWithQuery);
    const openGraphTitle = entry
      ? `${entry.title} — Free online in your browser | ${SITE_BRAND_NAME}`
      : undefined;

    const softwareLd =
      entry &&
      ({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: entry.title,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isAccessibleForFree: true,
        description: entry.description,
        url: toolPageUrl,
        availableLanguage: ["en"],
        featureList: [
          "Runs locally in the browser",
          "No server file upload for core processing",
          "Privacy-first tools",
          "English UI; usable worldwide in modern browsers",
        ],
        inLanguage: "en",
      } satisfies Record<string, unknown>);

    const breadcrumbLd = entry
      ? (() => {
          const hub = categoryBrowseMeta(entry.category);
          return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: absoluteUrl("/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: hub.label,
                item: absoluteUrl(hub.path),
              },
              {
                "@type": "ListItem",
                position: 3,
                name: entry.title,
                item: toolPageUrl,
              },
            ],
          } satisfies Record<string, unknown>;
        })()
      : undefined;

    const jsonLdBlocks = [softwareLd, breadcrumbLd].filter(Boolean) as Record<string, unknown>[];
    const jsonLd = jsonLdBlocks.length > 0 ? (jsonLdBlocks.length === 1 ? jsonLdBlocks[0] : jsonLdBlocks) : undefined;

    return {
      keywords,
      ...(openGraphTitle ? { openGraphTitle } : {}),
      ...(jsonLd ? { jsonLd } : {}),
    };
  }, [entry, hubFallback.title, pathname, searchKey]);

  usePageSeo(title, description, seoExtras);
}
