import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

function loadToolCounts() {
  globalThis.window = globalThis;
  const countsPath = path.join(projectRoot, "js/qwickton-category-tool-counts.js");
  return import(pathToFileURL(countsPath).href).then(() => {
    const map = globalThis.QwicktonCategoryToolCounts;
    assert.ok(map && typeof map === "object", "QwicktonCategoryToolCounts should be defined");
    return map;
  });
}

function slugsFromHomeAdvanced() {
  const homePath = path.join(projectRoot, "js/home-advanced.js");
  const text = fs.readFileSync(homePath, "utf8");
  const inRegistry = text.indexOf("const CATEGORY_REGISTRY");
  const afterRegistry = text.indexOf("].map((entry)", inRegistry);
  assert.ok(inRegistry !== -1 && afterRegistry !== -1, "Could not find CATEGORY_REGISTRY block");
  const block = text.slice(inRegistry, afterRegistry);
  const blockSlugs = [];
  let m2;
  const re2 = /\{\s*slug:\s*"([a-z0-9-]+)"/g;
  while ((m2 = re2.exec(block)) !== null) {
    blockSlugs.push(m2[1]);
  }
  return blockSlugs;
}

test("category tool counts map matches home registry slugs", async () => {
  const counts = await loadToolCounts();
  const expectedSlugs = slugsFromHomeAdvanced();
  const countKeys = Object.keys(counts).sort();
  const slugSorted = [...expectedSlugs].sort();
  assert.deepEqual(countKeys, slugSorted, "Tool count keys must match CATEGORY_REGISTRY slugs exactly");

  for (const slug of expectedSlugs) {
    const n = counts[slug];
    assert.equal(typeof n, "number", `Count for ${slug} must be a number`);
    assert.ok(Number.isInteger(n) && n >= 1, `Count for ${slug} must be a positive integer`);
  }
});

test("home page loads tool counts before home-advanced", () => {
  const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const countsIdx = indexHtml.indexOf("qwickton-category-tool-counts.js");
  const homeIdx = indexHtml.indexOf("home-advanced.js");
  assert.ok(countsIdx !== -1 && homeIdx !== -1 && countsIdx < homeIdx);
});
