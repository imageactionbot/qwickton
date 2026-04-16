import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const requiredFiles = [
  "index.html",
  "404.html",
  "manifest.webmanifest",
  "sw.js",
  "robots.txt",
  "sitemap.xml",
  "css/styles.css",
  "js/app.js",
  "js/qwickton-category-tool-counts.js",
  "js/home-advanced.js",
  "categories/daily-tools.html",
  "categories/image-tools.html",
  "categories/passport-photo-maker.html",
];

test("critical files exist", () => {
  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(projectRoot, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, `Missing required file: ${relativePath}`);
  }
});

test("index includes manifest and core scripts", () => {
  const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  assert.match(indexHtml, /<link rel="manifest" href="manifest\.webmanifest"\s*\/?>/);
  assert.match(
    indexHtml,
    /<link rel="stylesheet" href="\.\/css\/styles\.css" id="qw-site-styles"\s*\/?>/
  );
  assert.match(indexHtml, /<script src="js\/app\.js"><\/script>/);
  assert.match(indexHtml, /<script src="js\/qwickton-category-tool-counts\.js"><\/script>/);
  assert.match(indexHtml, /<script src="js\/home-advanced\.js"><\/script>/);
  const countsIdx = indexHtml.indexOf("qwickton-category-tool-counts.js");
  const homeIdx = indexHtml.indexOf("home-advanced.js");
  assert.ok(countsIdx !== -1 && homeIdx !== -1 && countsIdx < homeIdx, "Tool counts script must load before home-advanced.js");
});

test("manifest contains PWA identity fields", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "manifest.webmanifest"), "utf8")
  );
  assert.equal(typeof manifest.name, "string");
  assert.equal(typeof manifest.short_name, "string");
  assert.equal(typeof manifest.start_url, "string");
  assert.equal(Array.isArray(manifest.icons), true, "Manifest should define icons");
});

test("service worker precaches category pages", () => {
  const sw = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");
  assert.match(sw, /CORE_ASSETS/);
  assert.match(sw, /404\.html/);
  assert.match(sw, /robots\.txt/);
  assert.match(sw, /sitemap\.xml/);
  assert.match(sw, /categories\/daily-tools\.html/);
  assert.match(sw, /categories\/image-tools\.html/);
  assert.match(sw, /categories\/passport-photo-maker\.html/);
});

test("robots references sitemap and sitemap includes homepage", () => {
  const robots = fs.readFileSync(path.join(projectRoot, "robots.txt"), "utf8");
  assert.match(robots, /Sitemap:\s*https:\/\/qwickton\.com\/sitemap\.xml/i);

  const sitemap = fs.readFileSync(path.join(projectRoot, "sitemap.xml"), "utf8");
  assert.match(sitemap, /<urlset[^>]*>/);
  assert.match(sitemap, /<loc>https:\/\/qwickton\.com\/<\/loc>/);
  assert.match(sitemap, /categories\/image-tools\.html/);
});

test("daily tools avoids dynamic code execution", () => {
  const dailyTools = fs.readFileSync(path.join(projectRoot, "js/tools-daily.js"), "utf8");
  assert.doesNotMatch(dailyTools, /\bFunction\s*\(/);
  assert.match(dailyTools, /evaluateExpressionSafely/);
});

test("netlify config includes critical security headers", () => {
  const netlifyToml = fs.readFileSync(path.join(projectRoot, "netlify.toml"), "utf8");
  assert.match(netlifyToml, /Content-Security-Policy/);
  assert.match(netlifyToml, /X-Content-Type-Options/);
  assert.match(netlifyToml, /X-Frame-Options/);
  assert.match(netlifyToml, /Strict-Transport-Security/);
});
