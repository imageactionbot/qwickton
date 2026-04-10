/**
 * After `vite build`, renders each unique pathname from dist/prerender-urls.txt
 * into static HTML (nested index.html) for better crawler coverage.
 * Requires: playwright (chromium). Skips gracefully if playwright import fails.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const urlsFile = join(dist, "prerender-urls.txt");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("prerender: skipped (install playwright: npm i -D playwright && npx playwright install chromium)");
  process.exit(0);
}

let raw;
try {
  raw = readFileSync(urlsFile, "utf8");
} catch {
  console.warn("prerender: skipped (no dist/prerender-urls.txt — run npm run gen-seo && vite build first)");
  process.exit(0);
}

const lines = raw
  .trim()
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const pathnames = [
  ...new Set(
    lines.map((line) => {
      try {
        const u = new URL(line);
        return u.pathname || "/";
      } catch {
        return "/";
      }
    })
  ),
];

const port = await new Promise((resolve, reject) => {
  const srv = createServer();
  srv.listen(0, "127.0.0.1", () => {
    const addr = srv.address();
    const p = typeof addr === "object" && addr ? addr.port : null;
    srv.close((err) => {
      if (err) reject(err);
      else if (p) resolve(p);
      else reject(new Error("prerender: could not reserve preview port"));
    });
  });
  srv.on("error", reject);
});
const child = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => resolve(null), 20000);
  const onData = (buf) => {
    const s = String(buf);
    if (s.includes("Local:") || s.includes("localhost")) {
      clearTimeout(timeout);
      resolve(null);
    }
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code && code !== 0) {
      clearTimeout(timeout);
      reject(new Error(`preview exited ${code}`));
    }
  });
});

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.warn("prerender: skipped (run npx playwright install chromium):", (e && e.message) || e);
  try {
    child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  process.exit(0);
}

const page = await browser.newPage();
const base = `http://127.0.0.1:${port}`;

/** Prerender HTML must still carry AdSense tags for crawlers that do not run JS. */
function ensureAdsenseCrawlMarkup(html) {
  let out = html;
  if (!/name=["']google-adsense-account["']/i.test(out)) {
    out = out.replace(
      /<head([^>]*)>/i,
      `<head$1>\n    <meta name="google-adsense-account" content="ca-pub-5368355682383000" />`,
    );
  }
  if (!/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5368355682383000" crossorigin="anonymous"></script>\n  </head>`,
    );
  }
  return out;
}

try {
  for (const pathname of pathnames) {
    const url = base + (pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/");
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    await new Promise((r) => setTimeout(r, 600));
    const html = ensureAdsenseCrawlMarkup(await page.content());
    if (pathname === "/" || pathname === "") {
      writeFileSync(join(dist, "index.html"), html, "utf8");
    } else {
      const clean = pathname.replace(/^\//, "").replace(/\/$/, "");
      const dir = join(dist, clean);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), html, "utf8");
    }
  }
  console.log(`prerender: wrote ${pathnames.length} pages into dist/`);
} finally {
  await browser.close();
  child.kill("SIGTERM");
}
