/**
 * After `vite build`, writes dist/ads.txt for Google AdSense when VITE_ADSENSE_CLIENT is set.
 * @see https://support.google.com/adsense/answer/7532444
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

/** Vite injects .env.production into the build, but this script runs in a separate Node process — mirror those vars. */
function loadEnvFile(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

loadEnvFile(".env.production");
loadEnvFile(".env.local");

function toAdsTxtPubId(raw) {
  const s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith("ca-pub-")) return s.slice(3);
  if (s.startsWith("pub-")) return s;
  if (/^\d+$/.test(s)) return `pub-${s}`;
  return null;
}

const pub = toAdsTxtPubId(process.env.VITE_ADSENSE_CLIENT ?? "");
if (!pub) {
  process.exit(0);
}

const line = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
writeFileSync(join(dist, "ads.txt"), line, "utf8");
console.log("write-ads-txt: wrote dist/ads.txt");
