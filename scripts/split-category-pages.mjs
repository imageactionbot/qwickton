/**
 * Regenerates js/category/pages/*.js from a restored monolithic source.
 * Archive: git history `js/category-pages.js` (removed after modular split).
 * Run: node scripts/split-category-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.join(import.meta.dirname, "..");
const srcPath = path.join(projectRoot, "js", "category-pages.js");
if (!fs.existsSync(srcPath)) {
  console.error("Missing source file:", srcPath, "(restore from git history to re-split).");
  process.exit(1);
}
const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);

const nameToSlug = {
  initPdfTools: "pdf-tools",
  initTextTools: "text-tools",
  initConverterTools: "converter-tools",
  initSecurityTools: "security-tools",
  initCalculatorTools: "calculator-tools",
  initDesignTools: "design-tools",
  initSocialTools: "social-media-tools",
  initBusinessTools: "business-tools",
  initDataTools: "data-tools",
  initRandomTools: "random-tools",
  initFileTools: "file-tools",
  initFontTools: "font-tools",
  initSeoTools: "seo-tools",
  initDocumentTools: "document-tools",
  initMathTools: "math-tools",
  initPersonalTools: "personal-tools",
  initProductivityTools: "productivity-tools",
  initDeveloperTools: "developer-tools",
  initUtilityTools: "utility-tools",
  initCreatorTools: "creator-tools",
  initStudyTools: "study-tools",
  initImageTools: "image-tools",
};

const initHeader = /^  function (init\w+)\([^)]*\) \{$/;
const allInits = [];
for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i].match(initHeader);
  if (m) {
    allInits.push({ name: m[1], index: i });
  }
}
const advancedIdx = allInits.find((x) => x.name === "initCategoryAdvancedLayer")?.index;
const inits = allInits.filter((x) => x.name !== "initCategoryAdvancedLayer");

function toFnName(slug) {
  return `init${slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("")}`;
}

function dedentBlock(rawLines) {
  const nonempty = rawLines.filter((l) => l.trim().length > 0);
  if (!nonempty.length) return rawLines;
  const min = Math.min(
    ...nonempty.map((l) => {
      const mm = l.match(/^(\s*)/);
      return mm[1].length;
    })
  );
  return rawLines.map((l) => {
    if (!l.trim()) return "";
    return l.length >= min ? l.slice(min) : l;
  });
}

const outDir = path.join(projectRoot, "js", "category", "pages");
fs.mkdirSync(outDir, { recursive: true });

for (let j = 0; j < inits.length; j += 1) {
  const { name, index: startIdx } = inits[j];
  const slug = nameToSlug[name];
  if (!slug) {
    console.warn("No slug mapping for", name);
    continue;
  }
  let nextIdx;
  if (j + 1 < inits.length) {
    nextIdx = inits[j + 1].index;
  } else if (typeof advancedIdx === "number") {
    nextIdx = advancedIdx;
  } else {
    nextIdx = lines.length;
  }
  const innerLines = lines.slice(startIdx + 1, nextIdx - 2);
  const inner = dedentBlock(innerLines).join("\n");
  const fnName = toFnName(slug);
  const indented = inner
    .split("\n")
    .map((l) => (l ? `    ${l}` : ""))
    .join("\n");

  const fileBody = `(function () {\n  "use strict";\n  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};\n\n  function ${fnName}(api) {\n    const {\n      createCard,\n      safeNum,\n      escapeHtml,\n      utf8ToBase64,\n      base64ToUtf8,\n      secureRandomInt,\n      downloadTextFile,\n      parseCsv,\n      csvEscape,\n      toolsGrid,\n      slug,\n    } = api;\n\n${indented}\n  }\n\n  window.QwicktonCategoryInits[${JSON.stringify(slug)}] = ${fnName};\n})();\n`;

  fs.writeFileSync(path.join(outDir, `${slug}.js`), fileBody, "utf8");
  console.log("Wrote", slug, "lines", startIdx + 1, "-", nextIdx - 2);
}

console.log("Done. Output:", outDir);
