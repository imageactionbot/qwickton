import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { TOOL_CATALOG } from "../src/app/toolCatalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const site =
  (typeof process.env.VITE_SITE_URL === "string" && process.env.VITE_SITE_URL.trim()) || "https://www.qwickton.com";
const origin = site.replace(/\/+$/, "");

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const staticPaths = [
  "/",
  "/search",
  "/smart-drop",
  "/pdf",
  "/image",
  "/passport",
  "/background-remove",
  "/converter",
  "/word",
  "/text",
  "/about",
  "/privacy",
  "/terms",
  "/cookies",
];

const catalogPaths = TOOL_CATALOG.map((t) => t.path);
const allPaths = [...new Set([...staticPaths, ...catalogPaths])];
const lastmod = new Date().toISOString().slice(0, 10);

const urlEntries = allPaths
  .map((p) => {
    const loc = escapeXml(origin + (p.startsWith("/") ? p : `/${p}`));
    return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.85"}</priority>
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "sitemap.xml"), sitemap, "utf8");

const robots = `User-agent: *
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

writeFileSync(join(publicDir, "robots.txt"), robots, "utf8");

const prerenderList = allPaths.map((p) => `${origin}${p.startsWith("/") ? p : `/${p}`}`).join("\n");
writeFileSync(join(publicDir, "prerender-urls.txt"), `${prerenderList}\n`, "utf8");

console.log(`SEO: wrote public/sitemap.xml (${allPaths.length} URLs), robots.txt, and prerender-urls.txt for ${origin}`);
