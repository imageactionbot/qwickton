import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const categoriesDir = path.join(projectRoot, "categories");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listCategoryFiles() {
  return fs
    .readdirSync(categoriesDir)
    .filter((name) => name.endsWith(".html"))
    .sort();
}

test("all category pages include shared app shell script", () => {
  const categories = listCategoryFiles();
  assert.ok(categories.length > 0, "Expected at least one category page");
  for (const fileName of categories) {
    const html = read(path.join(categoriesDir, fileName));
    assert.match(
      html,
      /<script src="\.\.\/js\/app\.js"><\/script>/,
      `Category page missing app script: ${fileName}`
    );
  }
});

test("service worker precache list includes all category pages", () => {
  const sw = read(path.join(projectRoot, "sw.js"));
  const categories = listCategoryFiles();
  for (const fileName of categories) {
    const normalized = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      sw,
      new RegExp(`\\./categories/${normalized}`),
      `Service worker missing category asset: ${fileName}`
    );
  }
});

test("vercel config contains critical security headers", () => {
  const vercel = JSON.parse(read(path.join(projectRoot, "vercel.json")));
  assert.ok(Array.isArray(vercel.headers), "vercel headers must be defined");
  const siteHeaders = vercel.headers.find((item) => item.source === "/(.*)");
  assert.ok(siteHeaders, "site-wide headers missing");
  const keys = new Set(siteHeaders.headers.map((header) => header.key));
  assert.ok(keys.has("Content-Security-Policy"), "CSP header missing");
  assert.ok(keys.has("X-Content-Type-Options"), "X-Content-Type-Options header missing");
  assert.ok(keys.has("X-Frame-Options"), "X-Frame-Options header missing");
  assert.ok(keys.has("Strict-Transport-Security"), "HSTS header missing");
});

test("404 page is production-ready", () => {
  const html = read(path.join(projectRoot, "404.html"));
  assert.match(html, /<meta name="robots" content="noindex,nofollow"/);
  assert.match(html, /<script src="js\/app\.js"><\/script>/);
  assert.match(html, /href="index\.html"/);
});

test("runtime SEO contract normalizes canonical, og:url, and JSON-LD", () => {
  const appJs = read(path.join(projectRoot, "js/app.js"));
  assert.match(appJs, /link\[rel='canonical'\]/, "Canonical normalization missing");
  assert.match(appJs, /meta\[property='og:url'\]/, "OG URL normalization missing");
  assert.match(appJs, /ensureJsonLdScript\("webpage"/, "WebPage JSON-LD injection missing");
  assert.match(appJs, /ensureJsonLdScript\("breadcrumb"/, "Breadcrumb JSON-LD injection missing");
});

test("business tools page relies on runtime SEO source", () => {
  const html = read(path.join(categoriesDir, "business-tools.html"));
  assert.doesNotMatch(html, /rel="canonical"/, "Business page should not hardcode canonical");
  assert.doesNotMatch(html, /property="og:url"/, "Business page should not hardcode og:url");
  assert.doesNotMatch(
    html,
    /type="application\/ld\+json"/,
    "Business page should not hardcode JSON-LD"
  );
});
