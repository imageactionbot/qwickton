/**
 * Creates css/pages/<slug>.css placeholders for every category page bundle.
 */
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.join(import.meta.dirname, "..");
const pagesDir = path.join(projectRoot, "js", "category", "pages");
const cssDir = path.join(projectRoot, "css", "pages");
fs.mkdirSync(cssDir, { recursive: true });

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".js"));
for (const f of files) {
  const slug = f.replace(/\.js$/, "");
  const cssPath = path.join(cssDir, `${slug}.css`);
  if (!fs.existsSync(cssPath)) {
    const body = `/**\n * ${slug} — page-specific layout / SEO helpers.\n * Global styles: ../styles.css\n */\n\n/* Add overrides only for this category page. */\n`;
    fs.writeFileSync(cssPath, body, "utf8");
    console.log("created", cssPath);
  }
}
