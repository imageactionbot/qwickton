import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const categoriesDir = path.join(projectRoot, "categories");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function allHtmlFiles() {
  const rootFiles = ["index.html"];
  const categoryFiles = fs
    .readdirSync(categoriesDir)
    .filter((name) => name.endsWith(".html"))
    .filter((name) => name !== "template-category.html")
    .map((name) => `categories/${name}`);
  return [...rootFiles, ...categoryFiles];
}

test("every page has title, lang, and description", () => {
  for (const relativePath of allHtmlFiles()) {
    const html = read(path.join(projectRoot, relativePath));
    assert.match(html, /<html\s+lang="/i, `Missing html lang attribute in ${relativePath}`);
    assert.match(html, /<title>[^<]+<\/title>/i, `Missing title in ${relativePath}`);
    assert.match(
      html,
      /<meta\s+name="description"\s+content="[^"]+"/i,
      `Missing description meta in ${relativePath}`
    );
  }
});

test("all pages load shared app runtime", () => {
  for (const relativePath of allHtmlFiles()) {
    const html = read(path.join(projectRoot, relativePath));
    if (relativePath === "index.html") {
      assert.match(html, /<script src="js\/app\.js"><\/script>/, `Missing app runtime in ${relativePath}`);
    } else {
      assert.match(
        html,
        /<script src="\.\.\/js\/app\.js"><\/script>/,
        `Missing app runtime in ${relativePath}`
      );
    }
  }
});

test("all category pages include bootstrap runtime chain", () => {
  for (const relativePath of allHtmlFiles()) {
    if (relativePath === "index.html") continue;
    const html = read(path.join(projectRoot, relativePath));
    assert.match(
      html,
      /<script src="\.\.\/js\/category\/category-core\.js"><\/script>/,
      `Missing category core in ${relativePath}`
    );
    assert.match(
      html,
      /<script src="\.\.\/js\/category\/category-meta\.js"><\/script>/,
      `Missing category meta in ${relativePath}`
    );
    assert.match(
      html,
      /<script src="\.\.\/js\/category\/category-bootstrap\.js"><\/script>/,
      `Missing category bootstrap in ${relativePath}`
    );
    assert.match(
      html,
      /data-category-page="/,
      `Missing data-category-page attribute in ${relativePath}`
    );
  }
});
