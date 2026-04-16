(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-design-history-v2";
  const ICONS = [
    "home", "search", "user", "settings", "heart", "star", "bell", "mail", "camera", "video",
    "folder", "file", "download", "upload", "share", "lock", "unlock", "eye", "trash", "edit",
    "plus", "minus", "check", "x", "chevron-left", "chevron-right", "arrow-up", "arrow-down"
  ];

  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }
  function copyText(text) {
    if (text) navigator.clipboard?.writeText(String(text)).catch(() => {});
  }
  function downloadText(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function q(root, sel) {
    return root.querySelector(sel);
  }
  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }
  function mixHex(a, b, ratio) {
    const c1 = hexToRgb(a);
    const c2 = hexToRgb(b);
    return rgbToHex(c1.r + (c2.r - c1.r) * ratio, c1.g + (c2.g - c1.g) * ratio, c1.b + (c2.b - c1.b) * ratio);
  }
  function contrastRatio(fg, bg) {
    const lum = (hex) => {
      const { r, g, b } = hexToRgb(hex);
      const map = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * map[0] + 0.7152 * map[1] + 0.0722 * map[2];
    };
    const l1 = lum(fg);
    const l2 = lum(bg);
    const high = Math.max(l1, l2);
    const low = Math.min(l1, l2);
    return (high + 0.05) / (low + 0.05);
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 35)));
  }

  function initDesignTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.designToolsInitialized === "true") return;
    grid.dataset.designToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "design-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="design-card-header"><div class="design-card-icon">${icon}</div><h3 class="design-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary design-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary design-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCard = null;
    function pushHistory(type, text) {
      if (!text) return;
      writeHistory([{ type, text: String(text).slice(0, 180), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCard) return;
      const host = q(historyCard, "#designHistory");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No recent design outputs.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" type="button" data-i="${i}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const it = items[Number(btn.dataset.i)];
        if (it) copyText(`${it.type}: ${it.text}`);
      }));
    }

    function bindCommon(card, id, getOutput) {
      q(card, "[data-copy]")?.addEventListener("click", () => copyText(getOutput()));
      q(card, "[data-export]")?.addEventListener("click", () => downloadText(`${id}.txt`, getOutput()));
    }

    // 1 Color palette
    const colorCard = makeCard("color", "🎨", "Color Palette System", `
      <div class="grid-2"><div><label>Color A</label><input id="cA" type="color" value="#2563eb"></div><div><label>Color B</label><input id="cB" type="color" value="#ec4899"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="cOut" class="result" rows="8" readonly></textarea>
    `);
    function runColor() {
      const a = q(colorCard, "#cA").value;
      const b = q(colorCard, "#cB").value;
      const shades = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9].map((r) => mixHex(a, b, r));
      const out = [":root {", `  --brand-50: ${mixHex("#ffffff", a, 0.25)};`, `  --brand-500: ${a};`, `  --accent-500: ${b};`, ...shades.map((s, i) => `  --mix-${i + 1}: ${s};`), "}"].join("\n");
      q(colorCard, "#cOut").value = out;
      pushHistory("Palette", `${a} + ${b}`);
    }
    q(colorCard, "#cRun").addEventListener("click", runColor);
    q(colorCard, "#cA").addEventListener("input", runColor);
    q(colorCard, "#cB").addEventListener("input", runColor);
    runColor();
    bindCommon(colorCard, "color-palette", () => q(colorCard, "#cOut").value);

    // 2 Gradient
    const gradCard = makeCard("gradient", "🌈", "Gradient Generator", `
      <div class="grid-2"><div><label>Color 1</label><input id="g1" type="color" value="#14b8a6"></div><div><label>Color 2</label><input id="g2" type="color" value="#8b5cf6"></div><div><label>Angle</label><input id="ga" type="number" value="135" min="0" max="360"></div><div><label>Type</label><select id="gt"><option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="gRun">Generate</button><button class="btn btn-secondary" id="gSwap">Swap</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <div id="gCss" class="result"></div><div id="gPreview" class="preview-gradient"></div>
    `);
    function runGradient() {
      const c1 = q(gradCard, "#g1").value;
      const c2 = q(gradCard, "#g2").value;
      const a = Math.max(0, Math.min(360, safeNum(q(gradCard, "#ga").value, 135)));
      const t = q(gradCard, "#gt").value;
      const css = t === "radial" ? `radial-gradient(circle, ${c1}, ${c2})` : t === "conic" ? `conic-gradient(from ${a}deg, ${c1}, ${c2})` : `linear-gradient(${a}deg, ${c1}, ${c2})`;
      q(gradCard, "#gCss").textContent = `background: ${css};`;
      q(gradCard, "#gPreview").style.background = css;
      pushHistory("Gradient", `${t} ${a}deg`);
    }
    q(gradCard, "#gRun").addEventListener("click", runGradient);
    q(gradCard, "#gSwap").addEventListener("click", () => {
      const a = q(gradCard, "#g1");
      const b = q(gradCard, "#g2");
      [a.value, b.value] = [b.value, a.value];
      runGradient();
    });
    runGradient();
    bindCommon(gradCard, "gradient", () => q(gradCard, "#gCss").textContent);

    // 3 CSS snippets
    const cssCard = makeCard("css", "💻", "CSS Snippet Builder", `
      <div class="grid-2"><div><label>Radius</label><input id="sr" type="number" value="14"></div><div><label>Blur</label><input id="sb" type="number" value="20"></div><div><label>Y Padding</label><input id="spy" type="number" value="12"></div><div><label>X Padding</label><input id="spx" type="number" value="18"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="sBtn">Button CSS</button><button class="btn btn-secondary" id="sGlass">Glass Card</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="sOut" class="result" rows="9" readonly></textarea>
    `);
    function buildButtonCss() {
      const r = safeNum(q(cssCard, "#sr").value, 14);
      const b = safeNum(q(cssCard, "#sb").value, 20);
      const py = safeNum(q(cssCard, "#spy").value, 12);
      const px = safeNum(q(cssCard, "#spx").value, 18);
      q(cssCard, "#sOut").value = `.btn-custom {\n  border-radius: ${r}px;\n  padding: ${py}px ${px}px;\n  box-shadow: 0 10px ${b}px rgba(0,0,0,.12);\n  transition: all .25s ease;\n}\n.btn-custom:hover {\n  transform: translateY(-2px);\n}`;
      pushHistory("CSS Snippet", "button");
    }
    function buildGlassCss() {
      const r = safeNum(q(cssCard, "#sr").value, 14);
      q(cssCard, "#sOut").value = `.glass-card {\n  border-radius: ${r}px;\n  background: rgba(255,255,255,.12);\n  border: 1px solid rgba(255,255,255,.25);\n  backdrop-filter: blur(12px);\n}`;
      pushHistory("CSS Snippet", "glass");
    }
    q(cssCard, "#sBtn").addEventListener("click", buildButtonCss);
    q(cssCard, "#sGlass").addEventListener("click", buildGlassCss);
    buildButtonCss();
    bindCommon(cssCard, "css-snippet", () => q(cssCard, "#sOut").value);

    // 4 Typography
    const typoCard = makeCard("typography", "📝", "Typography Scale", `
      <div class="grid-2"><div><label>Base Size (px)</label><input id="tb" type="number" value="16"></div><div><label>Ratio</label><select id="tr"><option value="1.125">Major second</option><option value="1.2">Minor third</option><option value="1.25">Major third</option><option value="1.333">Perfect fourth</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="tRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="tOut" class="result" rows="8" readonly></textarea>
    `);
    function runTypography() {
      const b = Math.max(8, safeNum(q(typoCard, "#tb").value, 16));
      const r = safeNum(q(typoCard, "#tr").value, 1.125);
      const levels = [0, 1, 2, 3, 4].map((n) => b * Math.pow(r, n));
      q(typoCard, "#tOut").value = `:root {\n  --font-base: ${b}px;\n  --font-sm: ${(b / r).toFixed(2)}px;\n  --font-lg: ${levels[1].toFixed(2)}px;\n  --font-xl: ${levels[2].toFixed(2)}px;\n  --font-2xl: ${levels[3].toFixed(2)}px;\n  --font-3xl: ${levels[4].toFixed(2)}px;\n}`;
      pushHistory("Typography", `base ${b}px`);
    }
    q(typoCard, "#tRun").addEventListener("click", runTypography);
    runTypography();
    bindCommon(typoCard, "typography", () => q(typoCard, "#tOut").value);

    // 5 Shadow
    const shadowCard = makeCard("shadow", "✨", "Box Shadow Generator", `
      <div class="grid-3"><div><label>X</label><input id="sx" type="number" value="0"></div><div><label>Y</label><input id="sy" type="number" value="12"></div><div><label>Blur</label><input id="sblur" type="number" value="30"></div><div><label>Spread</label><input id="sspread" type="number" value="-4"></div><div><label>Opacity %</label><input id="sop" type="number" value="18" min="0" max="100"></div><div><label>Color</label><input id="scol" type="color" value="#000000"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="shRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <div id="shCss" class="result"></div><div id="shPreview" class="preview-box">Preview</div>
    `);
    function runShadow() {
      const x = safeNum(q(shadowCard, "#sx").value, 0);
      const y = safeNum(q(shadowCard, "#sy").value, 12);
      const blur = safeNum(q(shadowCard, "#sblur").value, 30);
      const spread = safeNum(q(shadowCard, "#sspread").value, -4);
      const op = Math.max(0, Math.min(100, safeNum(q(shadowCard, "#sop").value, 18))) / 100;
      const rgb = hexToRgb(q(shadowCard, "#scol").value);
      const css = `box-shadow: ${x}px ${y}px ${blur}px ${spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${op.toFixed(2)});`;
      q(shadowCard, "#shCss").textContent = css;
      q(shadowCard, "#shPreview").style.boxShadow = css.replace("box-shadow: ", "").replace(";", "");
      pushHistory("Shadow", `${x}/${y}/${blur}`);
    }
    q(shadowCard, "#shRun").addEventListener("click", runShadow);
    runShadow();
    bindCommon(shadowCard, "box-shadow", () => q(shadowCard, "#shCss").textContent);

    // 6 Border radius
    const borderCard = makeCard("border", "🟦", "Border Radius Generator", `
      <div class="grid-2"><div><label>Top Left</label><input id="btl" type="number" value="12"></div><div><label>Top Right</label><input id="btr" type="number" value="12"></div><div><label>Bottom Right</label><input id="bbr" type="number" value="12"></div><div><label>Bottom Left</label><input id="bbl" type="number" value="12"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="bRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <div id="bCss" class="result"></div><div id="bPreview" class="preview-box">Preview</div>
    `);
    function runBorder() {
      const tl = safeNum(q(borderCard, "#btl").value, 12);
      const tr = safeNum(q(borderCard, "#btr").value, 12);
      const br = safeNum(q(borderCard, "#bbr").value, 12);
      const bl = safeNum(q(borderCard, "#bbl").value, 12);
      const css = `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
      q(borderCard, "#bCss").textContent = css;
      q(borderCard, "#bPreview").style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
      pushHistory("Border Radius", `${tl}/${tr}/${br}/${bl}`);
    }
    q(borderCard, "#bRun").addEventListener("click", runBorder);
    runBorder();
    bindCommon(borderCard, "border-radius", () => q(borderCard, "#bCss").textContent);

    // 7 Animation
    const animCard = makeCard("animation", "🎬", "Animation Keyframes", `
      <div class="grid-2"><div><label>Preset</label><select id="ap"><option value="fade">Fade</option><option value="slide">Slide</option><option value="bounce">Bounce</option><option value="pulse">Pulse</option><option value="spin">Spin</option></select></div><div><label>Duration (ms)</label><input id="ad" type="number" value="600"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="aRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="aOut" class="result" rows="9" readonly></textarea>
    `);
    function runAnim() {
      const p = q(animCard, "#ap").value;
      const d = Math.max(100, safeNum(q(animCard, "#ad").value, 600));
      const preset = p === "slide" ? "@keyframes slideIn { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }"
        : p === "bounce" ? "@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }"
          : p === "pulse" ? "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }"
            : p === "spin" ? "@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }"
              : "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }";
      q(animCard, "#aOut").value = `${preset}\n\n.anim-custom {\n  animation: ${p === "fade" ? "fadeIn" : p === "slide" ? "slideIn" : p} ${d}ms ease both;\n}`;
      pushHistory("Animation", `${p} ${d}ms`);
    }
    q(animCard, "#aRun").addEventListener("click", runAnim);
    runAnim();
    bindCommon(animCard, "animation", () => q(animCard, "#aOut").value);

    // 8 Icon finder
    const iconCard = makeCard("icon", "🔍", "Icon Finder", `
      <div><label>Search</label><input id="iQ" type="text" placeholder="heart, user, settings"></div>
      <div class="inline-row"><button class="btn btn-primary" id="iRun">Find</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="iOut" class="result" rows="8" readonly></textarea>
    `);
    function runIcons() {
      const term = q(iconCard, "#iQ").value.trim().toLowerCase();
      const list = term ? ICONS.filter((name) => name.includes(term)) : ICONS;
      q(iconCard, "#iOut").value = list.join("\n") || "No icons found.";
      pushHistory("Icon Finder", `${list.length} matches`);
    }
    q(iconCard, "#iRun").addEventListener("click", runIcons);
    runIcons();
    bindCommon(iconCard, "icons", () => q(iconCard, "#iOut").value);

    // 9 Contrast checker
    const conCard = makeCard("contrast", "👁️", "Contrast Checker", `
      <div class="grid-2"><div><label>Foreground</label><input id="cf" type="color" value="#111827"></div><div><label>Background</label><input id="cb" type="color" value="#ffffff"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cRun2">Check</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <div id="cOut2" class="result"></div><div id="cPreview2" class="preview-box">Accessibility preview text</div>
    `);
    function runContrastCard() {
      const fg = q(conCard, "#cf").value;
      const bg = q(conCard, "#cb").value;
      const ratio = contrastRatio(fg, bg);
      const aa = ratio >= 4.5;
      const aaa = ratio >= 7;
      const out = `Contrast Ratio: ${ratio.toFixed(2)}:1\nAA (normal text): ${aa ? "PASS" : "FAIL"}\nAAA (normal text): ${aaa ? "PASS" : "FAIL"}`;
      q(conCard, "#cOut2").textContent = out;
      q(conCard, "#cPreview2").style.color = fg;
      q(conCard, "#cPreview2").style.background = bg;
      pushHistory("Contrast", `${ratio.toFixed(2)}:1`);
    }
    q(conCard, "#cRun2").addEventListener("click", runContrastCard);
    q(conCard, "#cf").addEventListener("input", runContrastCard);
    q(conCard, "#cb").addEventListener("input", runContrastCard);
    runContrastCard();
    bindCommon(conCard, "contrast", () => q(conCard, "#cOut2").textContent);

    // 10 Spacing scale
    const spaceCard = makeCard("spacing", "📐", "Spacing Scale Builder", `
      <div class="grid-2"><div><label>Base (px)</label><input id="spBase" type="number" value="4"></div><div><label>Steps (3-20)</label><input id="spSteps" type="number" value="10" min="3" max="20"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="spRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="spOut" class="result" rows="8" readonly></textarea>
    `);
    function runSpacing() {
      const base = Math.max(1, safeNum(q(spaceCard, "#spBase").value, 4));
      const steps = Math.max(3, Math.min(20, safeNum(q(spaceCard, "#spSteps").value, 10)));
      const lines = [":root {"];
      for (let i = 1; i <= steps; i += 1) lines.push(`  --space-${i}: ${base * i}px;`);
      lines.push("}");
      q(spaceCard, "#spOut").value = lines.join("\n");
      pushHistory("Spacing", `${steps} steps`);
    }
    q(spaceCard, "#spRun").addEventListener("click", runSpacing);
    runSpacing();
    bindCommon(spaceCard, "spacing", () => q(spaceCard, "#spOut").value);

    // 11 CSS clamp builder
    const clampCard = makeCard("clamp", "📏", "CSS Clamp Builder", `
      <div class="grid-2"><div><label>Min Size (px)</label><input id="clMin" type="number" value="14"></div><div><label>Max Size (px)</label><input id="clMax" type="number" value="24"></div><div><label>Min Viewport (px)</label><input id="clVmin" type="number" value="320"></div><div><label>Max Viewport (px)</label><input id="clVmax" type="number" value="1440"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="clRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="clOut" class="result" rows="6" readonly></textarea>
    `);
    function runClamp() {
      const min = safeNum(q(clampCard, "#clMin").value, 14);
      const max = safeNum(q(clampCard, "#clMax").value, 24);
      const vmin = safeNum(q(clampCard, "#clVmin").value, 320);
      const vmax = safeNum(q(clampCard, "#clVmax").value, 1440);
      if (vmax <= vmin || max <= min) {
        q(clampCard, "#clOut").value = "Ensure max values are greater than min values.";
        return;
      }
      const slope = ((max - min) / (vmax - vmin)) * 100;
      const intercept = min - (slope * vmin) / 100;
      const out = `font-size: clamp(${min}px, ${intercept.toFixed(3)}px + ${slope.toFixed(3)}vw, ${max}px);`;
      q(clampCard, "#clOut").value = out;
      pushHistory("Clamp", `${min}-${max}px`);
    }
    q(clampCard, "#clRun").addEventListener("click", runClamp);
    runClamp();
    bindCommon(clampCard, "css-clamp", () => q(clampCard, "#clOut").value);

    // 12 Favicon emoji generator
    const favCard = makeCard("favicon", "🧩", "Emoji Favicon Generator", `
      <div class="grid-2"><div><label>Emoji</label><input id="fvEmoji" type="text" value="🚀" maxlength="2"></div><div><label>Background</label><input id="fvBg" type="color" value="#111827"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="fvRun">Generate PNG</button><button class="btn btn-secondary" id="fvDl">Download 64x64</button><button class="btn btn-secondary" data-copy>Copy Data URL</button></div>
      <textarea id="fvOut" class="result" rows="5" readonly></textarea>
    `);
    let favDataUrl = "";
    function runFavicon() {
      const emoji = q(favCard, "#fvEmoji").value.trim() || "⭐";
      const bg = q(favCard, "#fvBg").value;
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 64, 64);
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 32, 35);
      favDataUrl = canvas.toDataURL("image/png");
      q(favCard, "#fvOut").value = favDataUrl;
      pushHistory("Favicon", `${emoji} on ${bg}`);
    }
    q(favCard, "#fvRun").addEventListener("click", runFavicon);
    q(favCard, "#fvDl").addEventListener("click", () => {
      if (!favDataUrl) return;
      const a = document.createElement("a");
      a.href = favDataUrl;
      a.download = "favicon-emoji.png";
      a.click();
    });
    q(favCard, "[data-copy]")?.addEventListener("click", () => copyText(q(favCard, "#fvOut").value));
    runFavicon();

    // 13 history
    historyCard = makeCard("history", "📜", "Recent Design Outputs", `
      <div id="designHistory" class="chip-list"><span class="empty-hint">No recent design outputs.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="dhClear" type="button">Clear</button><button class="btn btn-secondary" id="dhExport" type="button">Export TXT</button></div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    q(historyCard, "#dhClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    q(historyCard, "#dhExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`design-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // focus modal
    const overlay = document.createElement("div");
    overlay.className = "design-focus-overlay";
    const host = document.createElement("div");
    host.className = "design-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let active = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false" || active === card) return;
      if (active) closeFocus();
      active = card;
      placeholder = document.createElement("div");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.parentNode.insertBefore(placeholder, card);
      host.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      overlay.classList.add("active");
      host.classList.add("active");
      document.body.classList.add("design-modal-open");
    }
    function closeFocus() {
      if (!active) return;
      active.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      active.querySelector("[data-focus-close]")?.classList.remove("active");
      active.classList.remove("is-focused");
      if (placeholder?.parentNode) {
        placeholder.parentNode.insertBefore(active, placeholder);
        placeholder.remove();
      }
      active = null;
      placeholder = null;
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("design-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".design-card"))));
    grid.querySelectorAll("[data-focus-close]").forEach((btn) => btn.addEventListener("click", closeFocus));
    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const card = document.getElementById(`card-${btn.dataset.target}`);
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => openFocus(card), 170);
      });
    });
  }

  window.QwicktonCategoryInits["design-tools"] = initDesignTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDesignTools();
  });
})();
(function() {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITIES
  // ============================================
  function safeNum(v, d = 0) { let n = Number(v); return isFinite(n) ? n : d; }
  function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(name, text) { const a = document.createElement("a"); a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(String(text || "")); a.download = name; a.click(); }

  // Color utilities
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const normalized = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    const num = parseInt(normalized, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  function mixHex(c1, c2, ratio) {
    const a = hexToRgb(c1), b = hexToRgb(c2);
    return rgbToHex(a.r + (b.r - a.r) * ratio, a.g + (b.g - a.g) * ratio, a.b + (b.b - a.b) * ratio);
  }
  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const toLinear = v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }
  function contrastRatio(hexA, hexB) {
    const l1 = luminance(hexA), l2 = luminance(hexB);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
  }

  // Typography scale
  const typographyScale = {
    xs: 0.75, sm: 0.875, base: 1, lg: 1.125, xl: 1.25, '2xl': 1.5, '3xl': 1.875, '4xl': 2.25, '5xl': 3
  };

  // Animation keyframes presets
  const animationPresets = {
    fadeIn: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
    slideIn: `@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}`,
    bounce: `@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25px); }
}`,
    pulse: `@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`,
    spin: `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`
  };

  // Icons database
  const iconDatabase = [
    "home", "search", "user", "settings", "heart", "star", "bell", "mail", "camera", "video",
    "music", "map", "calendar", "clock", "folder", "file", "download", "upload", "share", "lock",
    "unlock", "eye", "eye-off", "trash", "edit", "plus", "minus", "check", "x", "chevron-left",
    "chevron-right", "chevron-up", "chevron-down", "arrow-left", "arrow-right", "arrow-up", "arrow-down"
  ];

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-design-history";
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20))); }
  function pushHistory(label, value, renderFn) { if (!value) return; writeHistory([{ label, value: String(value).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CARD CREATION
  // ============================================
  function initDesignTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.designToolsInitialized === "true") return;
    grid.dataset.designToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "design-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `<div class="design-card-header"><div class="design-card-icon">${icon}</div><h3 class="design-card-title">${escapeHtml(title)}</h3>${options.focusable !== false ? `<button class="btn btn-secondary design-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary design-focus-inline-close" data-focus-close>Close</button>` : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#designHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No recent design outputs.</span>'; return; }
      container.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</button>`).join("");
      container.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => copyText(readHistory()[Number(btn.dataset.idx)]?.value || "")));
    }

    function wireExport(card, prefix, title, getText) {
      const txt = card.querySelector(`[data-export='${prefix}-txt']`);
      const pdf = card.querySelector(`[data-export='${prefix}-pdf']`);
      const png = card.querySelector(`[data-export='${prefix}-png']`);
      const jpg = card.querySelector(`[data-export='${prefix}-jpg']`);
      txt?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    }

    // ============================================
    // 1. COLOR PALETTE GENERATOR
    // ============================================
    const colorCard = makeCard("color", "🎨", "Color System Pro", `
      <div class="grid-2"><div><label>Primary Color</label><input id="colorPick" type="color" value="#0284c7"></div><div><label>Secondary Color</label><input id="colorPick2" type="color" value="#8b5cf6"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="colorGenBtn">Generate Palette</button><button class="btn btn-secondary" id="colorCopyBtn">Copy CSS</button><button class="btn btn-secondary" data-export="color-txt">TXT</button></div>
      <textarea id="colorRes" class="result" rows="8" placeholder="Palette values..."></textarea>
      <div id="colorMeta" class="result">Contrast: - | Accessibility: -</div>
    `);
    function runPalette() {
      const c1 = colorCard.querySelector("#colorPick").value, c2 = colorCard.querySelector("#colorPick2").value;
      const shades = [0.15, 0.3, 0.5, 0.7, 0.85].map(r => mixHex(c1, c2, r));
      const cssVars = [`:root {`, `  --color-primary: ${c1};`, `  --color-secondary: ${c2};`, ...shades.map((s, i) => `  --color-${i+1}00: ${s};`), `}`].join("\n");
      const ratio = contrastRatio(c1, c2);
      colorCard.querySelector("#colorRes").value = cssVars;
      colorCard.querySelector("#colorMeta").innerHTML = `🎨 Contrast: ${ratio}:1 | ${Number(ratio) >= 4.5 ? '✅ AA compliant' : '⚠️ Low contrast'}`;
      pushHistory("Color Palette", `${c1} + ${c2}`, renderHistory);
    }
    colorCard.querySelector("#colorGenBtn").onclick = runPalette;
    colorCard.querySelector("#colorCopyBtn").onclick = () => copyText(colorCard.querySelector("#colorRes").value);
    colorCard.querySelector("#colorPick").addEventListener("input", runPalette);
    colorCard.querySelector("#colorPick2").addEventListener("input", runPalette);
    runPalette();
    wireExport(colorCard, "color", "Color", () => colorCard.querySelector("#colorRes").value);

    // ============================================
    // 2. GRADIENT STUDIO
    // ============================================
    const gradCard = makeCard("gradient", "🌈", "Gradient Studio", `
      <div class="grid-2"><div><label>Color 1</label><input id="g1" type="color" value="#0284c7"></div><div><label>Color 2</label><input id="g2" type="color" value="#8b5cf6"></div>
      <div><label>Angle (0-360°)</label><input id="gAngle" type="number" min="0" max="360" value="135"></div><div><label>Type</label><select id="gType"><option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="gBtn">Generate CSS</button><button class="btn btn-secondary" id="gSwapBtn">Swap</button><button class="btn btn-secondary" id="gCopyBtn">Copy</button><button class="btn btn-secondary" data-export="gradient-txt">TXT</button></div>
      <div id="gRes" class="result">background: linear-gradient(135deg, #0284c7, #8b5cf6);</div>
      <div id="gradPreview" class="preview-gradient" style="background: linear-gradient(135deg, #0284c7, #8b5cf6);"></div>
    `);
    function runGradient() {
      const c1 = gradCard.querySelector("#g1").value, c2 = gradCard.querySelector("#g2").value;
      const angle = safeNum(gradCard.querySelector("#gAngle").value, 135), type = gradCard.querySelector("#gType").value;
      let css = type === "radial" ? `radial-gradient(circle, ${c1}, ${c2})` : type === "conic" ? `conic-gradient(from ${angle}deg, ${c1}, ${c2})` : `linear-gradient(${angle}deg, ${c1}, ${c2})`;
      const fullCss = `background: ${css};`;
      gradCard.querySelector("#gRes").innerHTML = fullCss;
      gradCard.querySelector("#gradPreview").style.background = css;
      pushHistory("Gradient", fullCss, renderHistory);
    }
    gradCard.querySelector("#gBtn").onclick = runGradient;
    gradCard.querySelector("#gCopyBtn").onclick = () => copyText(gradCard.querySelector("#gRes").innerHTML);
    gradCard.querySelector("#gSwapBtn").onclick = () => { const g1 = gradCard.querySelector("#g1"), g2 = gradCard.querySelector("#g2"); [g1.value, g2.value] = [g2.value, g1.value]; runGradient(); };
    gradCard.querySelector("#g1").addEventListener("input", runGradient);
    gradCard.querySelector("#g2").addEventListener("input", runGradient);
    gradCard.querySelector("#gAngle").addEventListener("input", runGradient);
    gradCard.querySelector("#gType").addEventListener("change", runGradient);
    runGradient();
    wireExport(gradCard, "gradient", "Gradient", () => gradCard.querySelector("#gRes").innerHTML);

    // ============================================
    // 3. UI SNIPPETS GENERATOR
    // ============================================
    const cssCard = makeCard("css", "💻", "UI Snippets Generator", `
      <div class="grid-2"><div><label>Border Radius (px)</label><input id="cssRadius" type="number" value="14"></div><div><label>Shadow Blur (px)</label><input id="cssShadow" type="number" value="24"></div>
      <div><label>Padding Y (px)</label><input id="cssPadY" type="number" value="12"></div><div><label>Padding X (px)</label><input id="cssPadX" type="number" value="18"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cssBtn">Button CSS</button><button class="btn btn-secondary" id="glassBtn">Glass Card</button><button class="btn btn-secondary" id="cssCopyBtn">Copy</button><button class="btn btn-secondary" data-export="css-txt">TXT</button></div>
      <textarea id="cssRes" class="result" rows="8" placeholder="Generated CSS snippets..."></textarea>
    `);
    function runButtonCss() {
      const r = safeNum(cssCard.querySelector("#cssRadius").value, 14), b = safeNum(cssCard.querySelector("#cssShadow").value, 24);
      const py = safeNum(cssCard.querySelector("#cssPadY").value, 12), px = safeNum(cssCard.querySelector("#cssPadX").value, 18);
      const out = `.btn-custom {\n  border-radius: ${r}px;\n  box-shadow: 0 10px ${b}px rgba(0,0,0,0.1);\n  padding: ${py}px ${px}px;\n  transition: all 0.3s ease;\n}\n.btn-custom:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 14px ${b+8}px rgba(0,0,0,0.15);\n}`;
      cssCard.querySelector("#cssRes").value = out;
      pushHistory("Button CSS", `radius ${r}px`, renderHistory);
    }
    function runGlassCss() {
      const r = safeNum(cssCard.querySelector("#cssRadius").value, 14);
      const out = `.glass-card {\n  border-radius: ${r}px;\n  background: rgba(255,255,255,0.1);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255,255,255,0.2);\n}`;
      cssCard.querySelector("#cssRes").value = out;
      pushHistory("Glass CSS", `radius ${r}px`, renderHistory);
    }
    cssCard.querySelector("#cssBtn").onclick = runButtonCss;
    cssCard.querySelector("#glassBtn").onclick = runGlassCss;
    cssCard.querySelector("#cssCopyBtn").onclick = () => copyText(cssCard.querySelector("#cssRes").value);
    runButtonCss();
    wireExport(cssCard, "css", "CSS", () => cssCard.querySelector("#cssRes").value);

    // ============================================
    // 4. TYPOGRAPHY SCALE
    // ============================================
    const typographyCard = makeCard("typography", "📝", "Typography Scale Generator", `
      <div class="grid-2"><div><label>Base Font Size (px)</label><input id="typoBase" type="number" value="16"></div><div><label>Scale Ratio</label><select id="typoRatio"><option value="1.067">Minor Second (1.067)</option><option value="1.125" selected>Major Second (1.125)</option><option value="1.2">Minor Third (1.2)</option><option value="1.25">Major Third (1.25)</option><option value="1.333">Perfect Fourth (1.333)</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="typoBtn">Generate Scale</button><button class="btn btn-secondary" id="typoCopyBtn">Copy</button><button class="btn btn-secondary" data-export="typo-txt">TXT</button></div>
      <textarea id="typoRes" class="result" rows="10" placeholder="Typography scale will appear here..."></textarea>
    `);
    typographyCard.querySelector("#typoBtn").onclick = () => {
      const base = safeNum(typographyCard.querySelector("#typoBase").value, 16);
      const ratio = safeNum(typographyCard.querySelector("#typoRatio").value, 1.125);
      const sizes = { xs: base / ratio / ratio, sm: base / ratio, base: base, lg: base * ratio, xl: base * ratio * ratio, '2xl': base * ratio * ratio * ratio };
      const lines = [`:root {`, `  --font-base: ${base}px;`, `  --font-xs: ${sizes.xs.toFixed(2)}px;`, `  --font-sm: ${sizes.sm.toFixed(2)}px;`, `  --font-lg: ${sizes.lg.toFixed(2)}px;`, `  --font-xl: ${sizes.xl.toFixed(2)}px;`, `  --font-2xl: ${sizes['2xl'].toFixed(2)}px;`, `}`];
      typographyCard.querySelector("#typoRes").value = lines.join("\n");
      pushHistory("Typography Scale", `base ${base}px, ratio ${ratio}`, renderHistory);
    };
    typographyCard.querySelector("#typoCopyBtn").onclick = () => copyText(typographyCard.querySelector("#typoRes").value);
    typographyCard.querySelector("#typoBtn").click();
    wireExport(typographyCard, "typo", "Typography", () => typographyCard.querySelector("#typoRes").value);

    // ============================================
    // 5. BOX SHADOW GENERATOR
    // ============================================
    const shadowCard = makeCard("shadow", "✨", "Box Shadow Generator", `
      <div class="grid-3"><div><label>Offset X (px)</label><input id="shadowX" type="number" value="0"></div><div><label>Offset Y (px)</label><input id="shadowY" type="number" value="10"></div>
      <div><label>Blur (px)</label><input id="shadowBlur" type="number" value="15"></div><div><label>Spread (px)</label><input id="shadowSpread" type="number" value="-3"></div>
      <div><label>Opacity (%)</label><input id="shadowOpacity" type="number" min="0" max="100" value="10"></div><div><label>Color</label><input id="shadowColor" type="color" value="#000000"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="shadowBtn">Generate CSS</button><button class="btn btn-secondary" id="shadowCopyBtn">Copy</button><button class="btn btn-secondary" data-export="shadow-txt">TXT</button></div>
      <div id="shadowRes" class="result">box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);</div>
      <div class="preview-box" id="shadowPreview" style="box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">Preview</div>
    `);
    function runShadow() {
      const x = safeNum(shadowCard.querySelector("#shadowX").value, 0), y = safeNum(shadowCard.querySelector("#shadowY").value, 10);
      const blur = safeNum(shadowCard.querySelector("#shadowBlur").value, 15), spread = safeNum(shadowCard.querySelector("#shadowSpread").value, -3);
      const opacity = safeNum(shadowCard.querySelector("#shadowOpacity").value, 10) / 100;
      const color = shadowCard.querySelector("#shadowColor").value;
      const rgb = hexToRgb(color);
      const css = `box-shadow: ${x}px ${y}px ${blur}px ${spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity});`;
      shadowCard.querySelector("#shadowRes").innerHTML = css;
      shadowCard.querySelector("#shadowPreview").style.boxShadow = css;
      pushHistory("Box Shadow", css, renderHistory);
    }
    shadowCard.querySelector("#shadowBtn").onclick = runShadow;
    shadowCard.querySelector("#shadowCopyBtn").onclick = () => copyText(shadowCard.querySelector("#shadowRes").innerHTML);
    shadowCard.querySelector("#shadowX").addEventListener("input", runShadow);
    shadowCard.querySelector("#shadowY").addEventListener("input", runShadow);
    shadowCard.querySelector("#shadowBlur").addEventListener("input", runShadow);
    shadowCard.querySelector("#shadowSpread").addEventListener("input", runShadow);
    shadowCard.querySelector("#shadowOpacity").addEventListener("input", runShadow);
    shadowCard.querySelector("#shadowColor").addEventListener("input", runShadow);
    runShadow();
    wireExport(shadowCard, "shadow", "Shadow", () => shadowCard.querySelector("#shadowRes").innerHTML);

    // ============================================
    // 6. BORDER RADIUS GENERATOR
    // ============================================
    const borderCard = makeCard("border", "🟦", "Border Radius Generator", `
      <div class="grid-4"><div><label>TL</label><input id="borderTL" type="number" value="12"></div><div><label>TR</label><input id="borderTR" type="number" value="12"></div>
      <div><label>BR</label><input id="borderBR" type="number" value="12"></div><div><label>BL</label><input id="borderBL" type="number" value="12"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="borderBtn">Generate CSS</button><button class="btn btn-secondary" id="borderCopyBtn">Copy</button><button class="btn btn-secondary" data-export="border-txt">TXT</button></div>
      <div id="borderRes" class="result">border-radius: 12px;</div>
      <div class="preview-box" id="borderPreview" style="border-radius: 12px;">Preview</div>
    `);
    function runBorder() {
      const tl = safeNum(borderCard.querySelector("#borderTL").value, 12), tr = safeNum(borderCard.querySelector("#borderTR").value, 12);
      const br = safeNum(borderCard.querySelector("#borderBR").value, 12), bl = safeNum(borderCard.querySelector("#borderBL").value, 12);
      const css = tl === tr && tr === br && br === bl ? `border-radius: ${tl}px;` : `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
      borderCard.querySelector("#borderRes").innerHTML = css;
      borderCard.querySelector("#borderPreview").style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
      pushHistory("Border Radius", css, renderHistory);
    }
    borderCard.querySelector("#borderBtn").onclick = runBorder;
    borderCard.querySelector("#borderCopyBtn").onclick = () => copyText(borderCard.querySelector("#borderRes").innerHTML);
    borderCard.querySelector("#borderTL").addEventListener("input", runBorder);
    borderCard.querySelector("#borderTR").addEventListener("input", runBorder);
    borderCard.querySelector("#borderBR").addEventListener("input", runBorder);
    borderCard.querySelector("#borderBL").addEventListener("input", runBorder);
    runBorder();
    wireExport(borderCard, "border", "Border", () => borderCard.querySelector("#borderRes").innerHTML);

    // ============================================
    // 7. ANIMATION KEYFRAMES GENERATOR
    // ============================================
    const animationCard = makeCard("animation", "🎬", "Animation Keyframes", `
      <div><label>Animation Type</label><select id="animType"><option value="fadeIn">Fade In</option><option value="slideIn">Slide In</option><option value="bounce">Bounce</option><option value="pulse">Pulse</option><option value="spin">Spin</option></select></div>
      <div class="inline-row"><button class="btn btn-primary" id="animBtn">Generate Keyframes</button><button class="btn btn-secondary" id="animCopyBtn">Copy</button><button class="btn btn-secondary" data-export="animation-txt">TXT</button></div>
      <textarea id="animRes" class="result" rows="8" placeholder="Keyframes will appear here..."></textarea>
    `);
    animationCard.querySelector("#animBtn").onclick = () => {
      const type = animationCard.querySelector("#animType").value;
      const keyframes = animationPresets[type] || animationPresets.fadeIn;
      animationCard.querySelector("#animRes").value = keyframes;
      pushHistory("Animation", type, renderHistory);
    };
    animationCard.querySelector("#animCopyBtn").onclick = () => copyText(animationCard.querySelector("#animRes").value);
    animationCard.querySelector("#animBtn").click();
    wireExport(animationCard, "animation", "Animation", () => animationCard.querySelector("#animRes").value);

    // ============================================
    // 8. ICON FINDER
    // ============================================
    const iconCard = makeCard("icon", "🔍", "Icon Finder", `
      <div><label>Search Icon</label><input id="iconSearch" type="text" placeholder="e.g., heart, user, settings"></div>
      <div class="inline-row"><button class="btn btn-primary" id="iconBtn">Search Icons</button><button class="btn btn-secondary" id="iconCopyBtn">Copy</button><button class="btn btn-secondary" data-export="icon-txt">TXT</button></div>
      <textarea id="iconRes" class="result" rows="8" placeholder="Icons will appear here..."></textarea>
    `);
    iconCard.querySelector("#iconBtn").onclick = () => {
      const search = iconCard.querySelector("#iconSearch").value.toLowerCase();
      const filtered = search ? iconDatabase.filter(icon => icon.includes(search)) : iconDatabase;
      iconCard.querySelector("#iconRes").value = filtered.join("\n");
      pushHistory("Icon Finder", `${filtered.length} icons found`, renderHistory);
    };
    iconCard.querySelector("#iconCopyBtn").onclick = () => copyText(iconCard.querySelector("#iconRes").value);
    iconCard.querySelector("#iconBtn").click();
    wireExport(iconCard, "icon", "Icon", () => iconCard.querySelector("#iconRes").value);

    // ============================================
    // 9. COLOR CONTRAST CHECKER
    // ============================================
    const contrastCard = makeCard("contrast", "👁️", "Color Contrast Checker", `
      <div class="grid-2"><div><label>Foreground Color</label><input id="contrastFg" type="color" value="#000000"></div><div><label>Background Color</label><input id="contrastBg" type="color" value="#ffffff"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="contrastBtn">Check Contrast</button><button class="btn btn-secondary" id="contrastCopyBtn">Copy</button><button class="btn btn-secondary" data-export="contrast-txt">TXT</button></div>
      <div id="contrastRes" class="result">Contrast ratio: 21:1</div>
      <div class="preview-box" id="contrastPreview" style="color: #000000; background: #ffffff; padding: 1rem;">Sample Text</div>
    `);
    function runContrast() {
      const fg = contrastCard.querySelector("#contrastFg").value, bg = contrastCard.querySelector("#contrastBg").value;
      const ratio = contrastRatio(fg, bg);
      const aaPass = ratio >= 4.5, aaLargePass = ratio >= 3;
      contrastCard.querySelector("#contrastRes").innerHTML = `Contrast Ratio: ${ratio}:1\nWCAG AA (normal text): ${aaPass ? '✅ PASS' : '❌ FAIL'}\nWCAG AA (large text): ${aaLargePass ? '✅ PASS' : '❌ FAIL'}`;
      contrastCard.querySelector("#contrastPreview").style.color = fg;
      contrastCard.querySelector("#contrastPreview").style.background = bg;
      pushHistory("Contrast", `${ratio}:1`, renderHistory);
    }
    contrastCard.querySelector("#contrastBtn").onclick = runContrast;
    contrastCard.querySelector("#contrastCopyBtn").onclick = () => copyText(contrastCard.querySelector("#contrastRes").innerHTML);
    contrastCard.querySelector("#contrastFg").addEventListener("input", runContrast);
    contrastCard.querySelector("#contrastBg").addEventListener("input", runContrast);
    runContrast();
    wireExport(contrastCard, "contrast", "Contrast", () => contrastCard.querySelector("#contrastRes").innerHTML);

    // ============================================
    // 10. SPACING SCALE GENERATOR
    // ============================================
    const spacingCard = makeCard("spacing", "📐", "Spacing Scale Generator", `
      <div class="grid-2"><div><label>Base Unit (px)</label><input id="spaceBase" type="number" value="4"></div><div><label>Steps</label><input id="spaceSteps" type="number" min="3" max="16" value="8"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="spaceGenBtn">Generate Scale</button><button class="btn btn-secondary" id="spaceCopyBtn">Copy</button><button class="btn btn-secondary" data-export="spacing-txt">TXT</button></div>
      <textarea id="spaceRes" class="result" rows="8" placeholder="Spacing tokens..."></textarea>
    `);
    spacingCard.querySelector("#spaceGenBtn").onclick = () => {
      const base = safeNum(spacingCard.querySelector("#spaceBase").value, 4);
      const steps = Math.min(16, Math.max(3, safeNum(spacingCard.querySelector("#spaceSteps").value, 8)));
      const lines = [`:root {`];
      for (let i = 1; i <= steps; i++) lines.push(`  --space-${i}: ${base * i}px;`);
      lines.push(`}`);
      spacingCard.querySelector("#spaceRes").value = lines.join("\n");
      pushHistory("Spacing Scale", `${steps} steps (base ${base}px)`, renderHistory);
    };
    spacingCard.querySelector("#spaceCopyBtn").onclick = () => copyText(spacingCard.querySelector("#spaceRes").value);
    spacingCard.querySelector("#spaceGenBtn").click();
    wireExport(spacingCard, "spacing", "Spacing", () => spacingCard.querySelector("#spaceRes").value);

    // ============================================
    // HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Design Outputs", `
      <div id="designHistory" class="chip-list"><span class="empty-hint">No recent design outputs.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clearDesignHistory">Clear History</button><button class="btn btn-secondary" id="exportDesignHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearDesignHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportDesignHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.label}: ${h.value}`).join("\n"); downloadTextFile(`design-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "design-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "design-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("design-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("design-modal-open"); }
    document.querySelectorAll(".design-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".design-card"))));
    document.querySelectorAll(".design-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    document.getElementById("year").textContent = new Date().getFullYear();
  }
  window.QwicktonCategoryInits["design-tools"] = initDesignTools;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDesignTools(null); });
})();