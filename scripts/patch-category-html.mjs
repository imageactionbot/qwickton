/**
 * Rewrites category HTML files to use split CSS/JS bundles.
 */
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.join(import.meta.dirname, "..");
const categoriesDir = path.join(projectRoot, "categories");

const skip = new Set(["template-category.html"]);

for (const file of fs.readdirSync(categoriesDir).filter((f) => f.endsWith(".html"))) {
  if (skip.has(file)) continue;
  const slug = file.replace(/\.html$/, "");
  const full = path.join(categoriesDir, file);
  let html = fs.readFileSync(full, "utf8");

  if (!html.includes('data-category-page="')) {
    console.log("skip (no data-category-page):", file);
    continue;
  }

  const pageCss = `    <link rel="stylesheet" href="../css/pages/${slug}.css" />`;

  if (!html.includes(`css/pages/${slug}.css`)) {
    html = html.replace(
      /<link rel="stylesheet" href="\.\.\/css\/styles\.css" \/>/,
      `<link rel="stylesheet" href="../css/styles.css" />\n${pageCss}`
    );
  }

  const lines = ["    <script src=\"../js/app.js\"></script>"];
  if (slug === "image-tools") {
    lines.push('    <script src="../js/image-lab-templates.js"></script>');
  }
  lines.push(
    '    <script src="../js/category/category-core.js"></script>',
    '    <script src="../js/category/category-meta.js"></script>',
    `    <script src="../js/category/pages/${slug}.js"></script>`,
    '    <script src="../js/category/category-bootstrap.js"></script>'
  );
  const scriptBlock = lines.join("\n");

  html = html.replace(
    /<script src="\.\.\/js\/app\.js"><\/script>[\s\S]*?<\/body>/,
    `${scriptBlock}\n  </body>`
  );

  html = html.replace(/<!-- filler-line-\d+ -->\s*/g, "");

  fs.writeFileSync(full, html, "utf8");
  console.log("patched", file);
}
