(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const COUNTRY_PRESETS = {
    IN: { name: "India", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    US: { name: "United States", region: "North America", w: 51, h: 51, head: "50-69% of photo height" },
    CA: { name: "Canada", region: "North America", w: 50, h: 70, head: "31-36mm chin-to-crown" },
    MX: { name: "Mexico", region: "North America", w: 35, h: 45, head: "70-80% of photo height" },
    BR: { name: "Brazil", region: "South America", w: 50, h: 70, head: "70-80% of photo height" },
    AR: { name: "Argentina", region: "South America", w: 40, h: 40, head: "Centered, clear face" },
    GB: { name: "United Kingdom", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    IE: { name: "Ireland", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    FR: { name: "France", region: "Europe", w: 35, h: 45, head: "32-36mm chin-to-crown" },
    DE: { name: "Germany", region: "Europe", w: 35, h: 45, head: "32-36mm chin-to-crown" },
    IT: { name: "Italy", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    ES: { name: "Spain", region: "Europe", w: 32, h: 26, head: "Face centered" },
    NL: { name: "Netherlands", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    BE: { name: "Belgium", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    CH: { name: "Switzerland", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    PT: { name: "Portugal", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    SE: { name: "Sweden", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    NO: { name: "Norway", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    DK: { name: "Denmark", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    FI: { name: "Finland", region: "Europe", w: 36, h: 47, head: "32-36mm chin-to-crown" },
    PL: { name: "Poland", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    RU: { name: "Russia", region: "Europe/Asia", w: 35, h: 45, head: "70-80% of photo height" },
    UA: { name: "Ukraine", region: "Europe", w: 35, h: 45, head: "70-80% of photo height" },
    AU: { name: "Australia", region: "Oceania", w: 35, h: 45, head: "32-36mm chin-to-crown" },
    NZ: { name: "New Zealand", region: "Oceania", w: 35, h: 45, head: "70-80% of photo height" },
    CN: { name: "China", region: "Asia", w: 33, h: 48, head: "70-80% of photo height" },
    JP: { name: "Japan", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    KR: { name: "South Korea", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    SG: { name: "Singapore", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    MY: { name: "Malaysia", region: "Asia", w: 35, h: 50, head: "70-80% of photo height" },
    TH: { name: "Thailand", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    ID: { name: "Indonesia", region: "Asia", w: 40, h: 60, head: "70-80% of photo height" },
    PH: { name: "Philippines", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    PK: { name: "Pakistan", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    BD: { name: "Bangladesh", region: "Asia", w: 45, h: 55, head: "70-80% of photo height" },
    LK: { name: "Sri Lanka", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    NP: { name: "Nepal", region: "Asia", w: 35, h: 45, head: "70-80% of photo height" },
    AE: { name: "UAE", region: "Middle East", w: 40, h: 60, head: "70-80% of photo height" },
    SA: { name: "Saudi Arabia", region: "Middle East", w: 35, h: 45, head: "70-80% of photo height" },
    QA: { name: "Qatar", region: "Middle East", w: 35, h: 45, head: "70-80% of photo height" },
    KW: { name: "Kuwait", region: "Middle East", w: 40, h: 50, head: "70-80% of photo height" },
    ZA: { name: "South Africa", region: "Africa", w: 35, h: 45, head: "70-80% of photo height" },
    NG: { name: "Nigeria", region: "Africa", w: 35, h: 45, head: "70-80% of photo height" },
    KE: { name: "Kenya", region: "Africa", w: 35, h: 45, head: "70-80% of photo height" },
    EG: { name: "Egypt", region: "Africa", w: 40, h: 60, head: "70-80% of photo height" }
  };

  const HISTORY_KEY = "qw-passport-tools-history";

  function safeNum(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function mmToPx(mm, dpi) {
    return Math.max(1, Math.round((mm / 25.4) * dpi));
  }
  function pxToMm(px, dpi) {
    return (px * 25.4) / dpi;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }
  function copyText(text) {
    if (text) navigator.clipboard?.writeText(String(text)).catch(() => {});
  }
  function downloadDataUrl(name, dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function downloadText(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 24)));
  }
  function pushHistory(type, text, renderFn) {
    if (!text) return;
    writeHistory([{ type, text: String(text).slice(0, 200), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  function initPassportPhotoMaker() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.passportToolsInitialized === "true") return;
    grid.dataset.passportToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "pp-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="pp-card-header"><div class="pp-card-icon">${icon}</div><h3 class="pp-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary pp-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary pp-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const host = historyCardEl.querySelector("#ppHistoryList");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No passport outputs yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-idx]").forEach((btn) => btn.addEventListener("click", () => copyText(`${items[Number(btn.getAttribute("data-idx"))]?.type}: ${items[Number(btn.getAttribute("data-idx"))]?.text}`)));
    }

    let currentPresetCode = "IN";
    let lastPlanText = "";
    let lastSheetDataUrl = "";
    let lastPresetText = "";

    // 1) Country presets (global coverage)
    const presetCard = makeCard("preset", "🌍", "Country Passport Presets (Global)", `
      <p class="pp-hint">Select region/country. Presets are common values; always verify official local authority rules.</p>
      <div class="grid-2">
        <div><label>Region</label><select id="ppRegion"><option value="all">All regions</option><option value="Asia">Asia</option><option value="Europe">Europe</option><option value="North America">North America</option><option value="South America">South America</option><option value="Africa">Africa</option><option value="Middle East">Middle East</option><option value="Oceania">Oceania</option><option value="Europe/Asia">Europe/Asia</option></select></div>
        <div><label>DPI</label><select id="ppDpi"><option value="300">300 DPI</option><option value="600">600 DPI</option><option value="200">200 DPI</option></select></div>
      </div>
      <div><label>Country</label><select id="ppCountry"></select></div>
      <div class="inline-row"><button class="btn btn-primary" id="ppApplyPreset">Apply Preset</button><button class="btn btn-secondary" id="ppCopyPreset">Copy</button><button class="btn btn-secondary" id="ppSavePresetTxt">Download TXT</button></div>
      <div id="ppPresetResult" class="result">Choose a country and click apply.</div>
    `);
    const regionSel = presetCard.querySelector("#ppRegion");
    const countrySel = presetCard.querySelector("#ppCountry");
    function populateCountries() {
      const region = regionSel.value;
      const entries = Object.entries(COUNTRY_PRESETS).filter(([, p]) => region === "all" || p.region === region).sort((a, b) => a[1].name.localeCompare(b[1].name));
      countrySel.innerHTML = entries.map(([code, p]) => `<option value="${code}">${p.name} (${p.w}×${p.h}mm)</option>`).join("");
      if (entries.some(([code]) => code === currentPresetCode)) countrySel.value = currentPresetCode;
    }
    function applyPreset() {
      const code = countrySel.value;
      const p = COUNTRY_PRESETS[code];
      if (!p) return;
      currentPresetCode = code;
      const dpi = Math.max(72, safeNum(presetCard.querySelector("#ppDpi").value, 300));
      const pw = mmToPx(p.w, dpi);
      const ph = mmToPx(p.h, dpi);
      lastPresetText = `${p.name} (${code}) · ${p.w}×${p.h} mm · ${pw}×${ph}px @ ${dpi} DPI · Head guide: ${p.head}`;
      presetCard.querySelector("#ppPresetResult").textContent = lastPresetText;
      converterCard.querySelector("#ppWidthMm").value = String(p.w);
      converterCard.querySelector("#ppHeightMm").value = String(p.h);
      converterCard.querySelector("#ppDpiInput").value = String(dpi);
      editorCard.querySelector("#ppOutWidthMm").value = String(p.w);
      editorCard.querySelector("#ppOutHeightMm").value = String(p.h);
      editorCard.querySelector("#ppOutDpi").value = String(dpi);
      pushHistory("Preset", `${p.name} ${p.w}x${p.h}mm`, renderHistory);
    }
    regionSel.addEventListener("change", populateCountries);
    presetCard.querySelector("#ppApplyPreset").addEventListener("click", applyPreset);
    presetCard.querySelector("#ppCopyPreset").addEventListener("click", () => copyText(lastPresetText));
    presetCard.querySelector("#ppSavePresetTxt").addEventListener("click", () => downloadText("passport-preset.txt", lastPresetText));
    populateCountries();

    // 2) MM/PX converter
    const converterCard = makeCard("converter", "📐", "MM ↔ PX Converter", `
      <div class="grid-2"><div><label>Mode</label><select id="ppConvMode"><option value="m2p">MM → PX</option><option value="p2m">PX → MM</option></select></div><div><label>DPI</label><input type="number" id="ppDpiInput" value="300" min="72" max="1200"></div></div>
      <div class="grid-2"><div><label>Width</label><input type="number" id="ppWidthMm" value="35" min="1"></div><div><label>Height</label><input type="number" id="ppHeightMm" value="45" min="1"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="ppConvert">Convert</button><button class="btn btn-secondary" id="ppCopyConv">Copy</button></div>
      <div id="ppConvertResult" class="result">Result will appear here.</div>
    `);
    converterCard.querySelector("#ppConvert").addEventListener("click", () => {
      const mode = converterCard.querySelector("#ppConvMode").value;
      const dpi = Math.max(72, safeNum(converterCard.querySelector("#ppDpiInput").value, 300));
      const w = Math.max(1, safeNum(converterCard.querySelector("#ppWidthMm").value, 35));
      const h = Math.max(1, safeNum(converterCard.querySelector("#ppHeightMm").value, 45));
      const txt = mode === "m2p" ? `${w}×${h} mm @ ${dpi} DPI = ${mmToPx(w, dpi)}×${mmToPx(h, dpi)} px` : `${w}×${h} px @ ${dpi} DPI = ${pxToMm(w, dpi).toFixed(2)}×${pxToMm(h, dpi).toFixed(2)} mm`;
      converterCard.querySelector("#ppConvertResult").textContent = txt;
      pushHistory("Convert", txt, renderHistory);
    });
    converterCard.querySelector("#ppCopyConv").addEventListener("click", () => copyText(converterCard.querySelector("#ppConvertResult").textContent));

    // 3) Editor
    const editorCard = makeCard("editor", "📸", "Passport Photo Editor", `
      <div class="grid-2"><div><label>Upload</label><input type="file" id="ppUploadFile" accept="image/jpeg,image/png,image/webp"></div><div><label>Background</label><input type="color" id="ppBgColor" value="#ffffff"></div></div>
      <div class="grid-3"><div><label>Output width (mm)</label><input type="number" id="ppOutWidthMm" min="1" value="35"></div><div><label>Output height (mm)</label><input type="number" id="ppOutHeightMm" min="1" value="45"></div><div><label>DPI</label><input type="number" id="ppOutDpi" min="72" max="1200" value="300"></div></div>
      <div class="grid-2"><div><label>Zoom</label><input type="range" id="ppZoom" min="1" max="4" step="0.01" value="1.3"></div><div><label>Rotate</label><input type="range" id="ppRotate" min="-20" max="20" step="1" value="0"></div></div>
      <div class="inline-row"><button class="btn btn-secondary" id="ppCenterPhoto">Center</button><button class="btn btn-secondary" id="ppRenderPreview">Render</button><button class="btn btn-primary" id="ppDownloadJpg">Download JPG</button><button class="btn btn-secondary" id="ppDownloadPng">Download PNG</button></div>
      <div class="pp-canvas-wrap"><canvas id="ppEditorCanvas" width="420" height="540"></canvas></div>
      <div id="ppEditorResult" class="result">Upload a photo. Drag to reposition face.</div>
    `);
    const editorCanvas = editorCard.querySelector("#ppEditorCanvas");
    const editorCtx = editorCanvas.getContext("2d");
    const editorResult = editorCard.querySelector("#ppEditorResult");
    const editorState = { image: null, w: 0, h: 0, dx: 0, dy: 0, dragging: false, lastX: 0, lastY: 0 };

    function ensureEditorSize() {
      const wMm = Math.max(1, safeNum(editorCard.querySelector("#ppOutWidthMm").value, 35));
      const hMm = Math.max(1, safeNum(editorCard.querySelector("#ppOutHeightMm").value, 45));
      const ratio = wMm / hMm;
      const targetW = 420;
      const targetH = Math.max(280, Math.round(targetW / Math.max(0.2, ratio)));
      if (editorCanvas.width !== targetW || editorCanvas.height !== targetH) {
        editorCanvas.width = targetW;
        editorCanvas.height = targetH;
      }
    }
    function renderEditor() {
      ensureEditorSize();
      editorCtx.fillStyle = editorCard.querySelector("#ppBgColor").value || "#fff";
      editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
      if (!editorState.image) {
        editorCtx.fillStyle = "#6b7280";
        editorCtx.font = "15px system-ui, sans-serif";
        editorCtx.textAlign = "center";
        editorCtx.fillText("Upload a photo to start", editorCanvas.width / 2, editorCanvas.height / 2);
        return;
      }
      const zoom = Math.max(1, safeNum(editorCard.querySelector("#ppZoom").value, 1.3));
      const rotate = (safeNum(editorCard.querySelector("#ppRotate").value, 0) * Math.PI) / 180;
      const cover = Math.max(editorCanvas.width / Math.max(1, editorState.w), editorCanvas.height / Math.max(1, editorState.h));
      const drawScale = cover * zoom;
      const dw = editorState.w * drawScale;
      const dh = editorState.h * drawScale;
      const cx = editorCanvas.width / 2 + editorState.dx;
      const cy = editorCanvas.height / 2 + editorState.dy;
      editorCtx.save();
      editorCtx.translate(cx, cy);
      editorCtx.rotate(rotate);
      editorCtx.drawImage(editorState.image, -dw / 2, -dh / 2, dw, dh);
      editorCtx.restore();
      editorCtx.strokeStyle = "#0891b2";
      editorCtx.lineWidth = 2;
      editorCtx.strokeRect(10, 10, editorCanvas.width - 20, editorCanvas.height - 20);
    }
    function renderExportCanvas() {
      if (!editorState.image) return null;
      const outWmm = Math.max(1, safeNum(editorCard.querySelector("#ppOutWidthMm").value, 35));
      const outHmm = Math.max(1, safeNum(editorCard.querySelector("#ppOutHeightMm").value, 45));
      const dpi = Math.max(72, safeNum(editorCard.querySelector("#ppOutDpi").value, 300));
      const outWpx = mmToPx(outWmm, dpi);
      const outHpx = mmToPx(outHmm, dpi);
      const c = document.createElement("canvas");
      c.width = outWpx;
      c.height = outHpx;
      const x = c.getContext("2d");
      x.fillStyle = editorCard.querySelector("#ppBgColor").value || "#fff";
      x.fillRect(0, 0, c.width, c.height);
      const zoom = Math.max(1, safeNum(editorCard.querySelector("#ppZoom").value, 1.3));
      const rotate = (safeNum(editorCard.querySelector("#ppRotate").value, 0) * Math.PI) / 180;
      const cover = Math.max(c.width / Math.max(1, editorState.w), c.height / Math.max(1, editorState.h));
      const drawScale = cover * zoom;
      const dw = editorState.w * drawScale;
      const dh = editorState.h * drawScale;
      const cx = c.width / 2 + editorState.dx * (c.width / editorCanvas.width);
      const cy = c.height / 2 + editorState.dy * (c.height / editorCanvas.height);
      x.save();
      x.translate(cx, cy);
      x.rotate(rotate);
      x.drawImage(editorState.image, -dw / 2, -dh / 2, dw, dh);
      x.restore();
      return { canvas: c, wMm: outWmm, hMm: outHmm, dpi };
    }
    editorCard.querySelector("#ppUploadFile").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const obj = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        editorState.image = img;
        editorState.w = img.naturalWidth || img.width;
        editorState.h = img.naturalHeight || img.height;
        editorState.dx = 0;
        editorState.dy = 0;
        URL.revokeObjectURL(obj);
        renderEditor();
        editorResult.textContent = `Loaded ${f.name} · ${editorState.w}×${editorState.h}px`;
      };
      img.onerror = () => {
        URL.revokeObjectURL(obj);
        editorResult.textContent = "Could not decode image. Try JPEG/PNG/WebP.";
      };
      img.src = obj;
    });
    editorCard.querySelector("#ppCenterPhoto").addEventListener("click", () => {
      editorState.dx = 0;
      editorState.dy = 0;
      editorCard.querySelector("#ppZoom").value = "1.3";
      editorCard.querySelector("#ppRotate").value = "0";
      renderEditor();
    });
    editorCard.querySelector("#ppRenderPreview").addEventListener("click", () => {
      renderEditor();
      const outWmm = safeNum(editorCard.querySelector("#ppOutWidthMm").value, 35);
      const outHmm = safeNum(editorCard.querySelector("#ppOutHeightMm").value, 45);
      const dpi = safeNum(editorCard.querySelector("#ppOutDpi").value, 300);
      editorResult.textContent = `Preview ready: ${outWmm}×${outHmm} mm @ ${dpi} DPI`;
    });
    function exportEditor(kind) {
      const out = renderExportCanvas();
      if (!out) {
        editorResult.textContent = "Upload a photo first.";
        return;
      }
      const ext = kind === "image/png" ? "png" : "jpg";
      const url = out.canvas.toDataURL(kind, kind === "image/png" ? undefined : 0.95);
      downloadDataUrl(`passport-${out.wMm}x${out.hMm}-${out.dpi}dpi.${ext}`, url);
      const summary = `Exported ${out.wMm}×${out.hMm} mm @ ${out.dpi} DPI`;
      editorResult.textContent = summary;
      pushHistory("Export", summary, renderHistory);
    }
    editorCard.querySelector("#ppDownloadJpg").addEventListener("click", () => exportEditor("image/jpeg"));
    editorCard.querySelector("#ppDownloadPng").addEventListener("click", () => exportEditor("image/png"));
    editorCard.querySelectorAll("#ppBgColor, #ppOutWidthMm, #ppOutHeightMm, #ppOutDpi, #ppZoom, #ppRotate").forEach((el) => el.addEventListener("input", renderEditor));
    editorCanvas.addEventListener("pointerdown", (e) => {
      editorState.dragging = true;
      editorState.lastX = e.clientX;
      editorState.lastY = e.clientY;
      editorCanvas.setPointerCapture(e.pointerId);
    });
    editorCanvas.addEventListener("pointermove", (e) => {
      if (!editorState.dragging) return;
      editorState.dx += e.clientX - editorState.lastX;
      editorState.dy += e.clientY - editorState.lastY;
      editorState.lastX = e.clientX;
      editorState.lastY = e.clientY;
      renderEditor();
    });
    editorCanvas.addEventListener("pointerup", (e) => {
      editorState.dragging = false;
      editorCanvas.releasePointerCapture(e.pointerId);
    });
    editorCanvas.addEventListener("pointercancel", () => {
      editorState.dragging = false;
    });

    // 4) Planner + sheet + PDF
    const plannerCard = makeCard("planner", "📄", "Print Sheet Planner + PDF", `
      <p class="pp-hint">Generate printable sheet from your current edited photo, then download PNG/JPG or Save as PDF via print dialog.</p>
      <div class="grid-3"><div><label>Paper</label><select id="ppPaperSize"><option value="a4">A4 (210×297)</option><option value="letter">Letter (216×279)</option><option value="a5">A5 (148×210)</option></select></div><div><label>Margin (mm)</label><input type="number" id="ppSheetMargin" value="10" min="0" max="30"></div><div><label>Gap (mm)</label><input type="number" id="ppSheetGap" value="4" min="0" max="20"></div></div>
      <div class="grid-2"><div><label>Copies needed</label><input type="number" id="ppCopies" value="8" min="1" max="200"></div><div><label>Sheet DPI</label><input type="number" id="ppSheetDpi" value="300" min="150" max="600"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="ppPlanSheet">Generate Sheet</button><button class="btn btn-secondary" id="ppSheetPng">Download PNG</button><button class="btn btn-secondary" id="ppSheetJpg">Download JPG</button><button class="btn btn-secondary" id="ppSheetPdf">Download PDF</button><button class="btn btn-secondary" id="ppExportPlan">Export Plan TXT</button></div>
      <textarea id="ppSheetPlan" class="result" rows="6" placeholder="Plan appears here..." readonly></textarea>
      <div class="pp-canvas-wrap"><canvas id="ppSheetCanvas" width="640" height="900"></canvas></div>
    `);
    const sheetCanvas = plannerCard.querySelector("#ppSheetCanvas");
    const sheetCtx = sheetCanvas.getContext("2d");

    function getPaperMm(key) {
      if (key === "letter") return { w: 216, h: 279, name: "Letter" };
      if (key === "a5") return { w: 148, h: 210, name: "A5" };
      return { w: 210, h: 297, name: "A4" };
    }
    function generateSheet() {
      const out = renderExportCanvas();
      if (!out) {
        plannerCard.querySelector("#ppSheetPlan").value = "Upload and prepare photo in editor first.";
        return;
      }
      const paper = getPaperMm(plannerCard.querySelector("#ppPaperSize").value);
      const margin = Math.max(0, safeNum(plannerCard.querySelector("#ppSheetMargin").value, 10));
      const gap = Math.max(0, safeNum(plannerCard.querySelector("#ppSheetGap").value, 4));
      const copies = Math.max(1, Math.min(200, safeNum(plannerCard.querySelector("#ppCopies").value, 8)));
      const sheetDpi = Math.max(150, Math.min(600, safeNum(plannerCard.querySelector("#ppSheetDpi").value, 300)));
      const photoWmm = out.wMm;
      const photoHmm = out.hMm;
      const cols = Math.max(1, Math.floor((paper.w - margin * 2 + gap) / (photoWmm + gap)));
      const rows = Math.max(1, Math.floor((paper.h - margin * 2 + gap) / (photoHmm + gap)));
      const capacity = Math.max(1, cols * rows);
      const sheets = Math.ceil(copies / capacity);

      const pw = mmToPx(paper.w, sheetDpi);
      const ph = mmToPx(paper.h, sheetDpi);
      const mpx = mmToPx(margin, sheetDpi);
      const gpx = mmToPx(gap, sheetDpi);
      const fw = mmToPx(photoWmm, sheetDpi);
      const fh = mmToPx(photoHmm, sheetDpi);
      const photoImg = new Image();
      photoImg.onload = () => {
        sheetCanvas.width = pw;
        sheetCanvas.height = ph;
        sheetCtx.fillStyle = "#fff";
        sheetCtx.fillRect(0, 0, pw, ph);
        sheetCtx.strokeStyle = "#d1d5db";
        sheetCtx.lineWidth = 1;
        let placed = 0;
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            if (placed >= copies) break;
            const x = mpx + c * (fw + gpx);
            const y = mpx + r * (fh + gpx);
            sheetCtx.drawImage(photoImg, x, y, fw, fh);
            sheetCtx.strokeRect(x, y, fw, fh);
            placed += 1;
          }
        }
        lastSheetDataUrl = sheetCanvas.toDataURL("image/png");
        lastPlanText = [
          `Paper: ${paper.name} (${paper.w}×${paper.h} mm)`,
          `Photo: ${photoWmm}×${photoHmm} mm`,
          `Grid: ${cols}×${rows} = ${capacity}/sheet`,
          `Requested copies: ${copies}`,
          `Sheets needed: ${sheets}`,
          `Sheet DPI: ${sheetDpi}`
        ].join("\n");
        plannerCard.querySelector("#ppSheetPlan").value = lastPlanText;
        pushHistory("Sheet Plan", `${paper.name} ${copies} copies => ${sheets} sheet(s)`, renderHistory);
      };
      photoImg.src = out.canvas.toDataURL("image/png");
    }

    plannerCard.querySelector("#ppPlanSheet").addEventListener("click", generateSheet);
    plannerCard.querySelector("#ppSheetPng").addEventListener("click", () => {
      if (!lastSheetDataUrl) return;
      downloadDataUrl("passport-sheet.png", lastSheetDataUrl);
    });
    plannerCard.querySelector("#ppSheetJpg").addEventListener("click", () => {
      if (!lastSheetDataUrl) return;
      const c = document.createElement("canvas");
      c.width = sheetCanvas.width;
      c.height = sheetCanvas.height;
      c.getContext("2d").drawImage(sheetCanvas, 0, 0);
      downloadDataUrl("passport-sheet.jpg", c.toDataURL("image/jpeg", 0.95));
    });
    plannerCard.querySelector("#ppSheetPdf").addEventListener("click", () => {
      if (!lastSheetDataUrl) return;
      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!w) return;
      w.document.write(`<!doctype html><html><head><title>Passport Sheet PDF</title><style>body{margin:0;padding:16px;font-family:system-ui;background:#f3f4f6}img{max-width:100%;height:auto;display:block;margin:0 auto;border:1px solid #ddd;background:#fff}pre{white-space:pre-wrap;font-size:12px;color:#374151}</style></head><body><img src="${lastSheetDataUrl}" alt="Passport sheet"/><pre>${esc(lastPlanText)}</pre><script>setTimeout(()=>window.print(),120);<\/script></body></html>`);
      w.document.close();
      pushHistory("PDF", "Opened print dialog for PDF sheet download", renderHistory);
    });
    plannerCard.querySelector("#ppExportPlan").addEventListener("click", () => downloadText("passport-sheet-plan.txt", lastPlanText));

    // 5) Compliance checklist
    const checklistCard = makeCard("checklist", "✅", "Compliance Checklist", `
      <div class="inline-row">
        <label><input type="checkbox" class="ppCheck" value="Plain light background"> Plain light background</label>
        <label><input type="checkbox" class="ppCheck" value="Face centered"> Face centered</label>
        <label><input type="checkbox" class="ppCheck" value="Eyes visible"> Eyes visible</label>
        <label><input type="checkbox" class="ppCheck" value="No shadows"> No harsh shadows</label>
        <label><input type="checkbox" class="ppCheck" value="Neutral expression"> Neutral expression</label>
        <label><input type="checkbox" class="ppCheck" value="Correct dimensions"> Correct dimensions</label>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="ppChecklistSummary">Generate Summary</button></div>
      <div id="ppChecklistResult" class="result">Check items and generate summary.</div>
    `);
    checklistCard.querySelector("#ppChecklistSummary").addEventListener("click", () => {
      const all = Array.from(checklistCard.querySelectorAll(".ppCheck"));
      const done = all.filter((x) => x.checked);
      const pending = all.filter((x) => !x.checked);
      const pct = Math.round((done.length / all.length) * 100);
      const text = `Compliance: ${done.length}/${all.length} (${pct}%)\nCompleted: ${done.map((x) => x.value).join(", ") || "none"}\nPending: ${pending.map((x) => x.value).join(", ") || "none"}`;
      checklistCard.querySelector("#ppChecklistResult").textContent = text;
      pushHistory("Checklist", `${pct}%`, renderHistory);
    });

    // 6) Head-size guide
    const faceCard = makeCard("faceguide", "🧠", "Head Size Guide Calculator", `
      <div class="grid-3"><div><label>Photo height (mm)</label><input type="number" id="fgPhotoH" value="45" min="10"></div><div><label>Min head %</label><input type="number" id="fgMin" value="70" min="30" max="95"></div><div><label>Max head %</label><input type="number" id="fgMax" value="80" min="30" max="95"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="fgRun">Calculate</button><button class="btn btn-secondary" id="fgCopy">Copy</button></div>
      <div id="fgOut" class="result">Head size range appears here.</div>
    `);
    faceCard.querySelector("#fgRun").addEventListener("click", () => {
      const ph = Math.max(10, safeNum(faceCard.querySelector("#fgPhotoH").value, 45));
      const minp = Math.max(1, safeNum(faceCard.querySelector("#fgMin").value, 70));
      const maxp = Math.max(minp, safeNum(faceCard.querySelector("#fgMax").value, 80));
      const mmMin = (ph * minp) / 100;
      const mmMax = (ph * maxp) / 100;
      faceCard.querySelector("#fgOut").textContent = `For ${ph}mm photo: head should be about ${mmMin.toFixed(1)}mm to ${mmMax.toFixed(1)}mm`;
    });
    faceCard.querySelector("#fgCopy").addEventListener("click", () => copyText(faceCard.querySelector("#fgOut").textContent));

    // 7) Background swatches
    const bgCard = makeCard("ppbg", "🎨", "Background Color Helper", `
      <p class="pp-hint">Use light plain backgrounds. Click swatch to copy hex and apply in editor.</p>
      <div class="inline-row" id="ppBgSw" style="flex-wrap:wrap;gap:.4rem"></div>
      <div id="ppBgOut" class="result">Click a swatch.</div>
    `);
    ["#ffffff", "#f8f8f8", "#f5f5f0", "#f0f0eb", "#e8edf7"].forEach((hex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-swatch";
      btn.style.background = hex;
      btn.title = hex;
      btn.addEventListener("click", () => {
        bgCard.querySelector("#ppBgOut").textContent = hex;
        editorCard.querySelector("#ppBgColor").value = hex;
        renderEditor();
        copyText(hex);
      });
      bgCard.querySelector("#ppBgSw").appendChild(btn);
    });

    // 8) Filename helper
    const nameCard = makeCard("ppname", "📁", "Filename Templates", `
      <div class="grid-2"><div><label>Country code</label><input type="text" id="pnC" value="US" maxlength="4"></div><div><label>Initials</label><input type="text" id="pnI" value="AB" maxlength="6"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="pnBtn">Generate</button><button class="btn btn-secondary" id="pnCopy">Copy</button></div>
      <textarea id="pnOut" class="result" rows="3" readonly></textarea>
    `);
    nameCard.querySelector("#pnBtn").addEventListener("click", () => {
      const c = (nameCard.querySelector("#pnC").value.trim().toUpperCase() || "XX").replace(/[^A-Z0-9]/g, "");
      const i = (nameCard.querySelector("#pnI").value.trim().toUpperCase() || "X").replace(/[^A-Z0-9]/g, "");
      const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      nameCard.querySelector("#pnOut").value = [`passport-${c}-${i}-${d}.jpg`, `passport-${c}-${d}.png`, `${c}_passport_${i}.jpg`].join("\n");
    });
    nameCard.querySelector("#pnCopy").addEventListener("click", () => copyText(nameCard.querySelector("#pnOut").value));

    // 9) Size reference
    const refCard = makeCard("sizesref", "📋", "Common Country Sizes", `
      <div class="inline-row"><button class="btn btn-primary" id="refBtn">Load table</button><button class="btn btn-secondary" id="refCopy">Copy</button></div>
      <textarea id="refOut" class="result" rows="12" readonly></textarea>
    `);
    refCard.querySelector("#refBtn").addEventListener("click", () => {
      const lines = Object.entries(COUNTRY_PRESETS).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([code, p]) => `${p.name} (${code}) - ${p.w}x${p.h} mm`);
      refCard.querySelector("#refOut").value = ["Common passport sizes (verify official rules):", "", ...lines].join("\n");
    });
    refCard.querySelector("#refCopy").addEventListener("click", () => copyText(refCard.querySelector("#refOut").value));

    // 10) Country finder
    const findCard = makeCard("countryfind", "🔎", "Country Finder", `
      <div><label>Search country</label><input type="text" id="cfQuery" placeholder="e.g. Germany"></div>
      <div class="inline-row"><button class="btn btn-primary" id="cfRun">Find</button><button class="btn btn-secondary" id="cfCopy">Copy</button></div>
      <div id="cfOut" class="result">Search by country name to quickly apply size.</div>
    `);
    findCard.querySelector("#cfRun").addEventListener("click", () => {
      const q = findCard.querySelector("#cfQuery").value.trim().toLowerCase();
      const matches = Object.entries(COUNTRY_PRESETS).filter(([, p]) => p.name.toLowerCase().includes(q)).slice(0, 12);
      if (!q || !matches.length) {
        findCard.querySelector("#cfOut").textContent = "No match. Try a broader query.";
        return;
      }
      const txt = matches.map(([code, p]) => `${p.name} (${code}) - ${p.w}x${p.h} mm`).join("\n");
      findCard.querySelector("#cfOut").textContent = txt;
      const first = matches[0][0];
      currentPresetCode = first;
      regionSel.value = "all";
      populateCountries();
      countrySel.value = first;
      applyPreset();
    });
    findCard.querySelector("#cfCopy").addEventListener("click", () => copyText(findCard.querySelector("#cfOut").textContent));

    // 11) History
    const historyCard = makeCard("history", "📜", "Recent Passport Outputs", `
      <div id="ppHistoryList" class="chip-list"><span class="empty-hint">No passport outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="ppCopyHistory">Copy All</button><button class="btn btn-secondary" id="ppExportHistory">Export TXT</button><button class="btn btn-secondary" id="ppClearHistory">Clear</button></div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#ppCopyHistory").addEventListener("click", () => copyText(readHistory().map((x) => `${x.type}: ${x.text}`).join("\n")));
    historyCard.querySelector("#ppExportHistory").addEventListener("click", () => downloadText("passport-history.txt", readHistory().map((x, i) => `${i + 1}. ${x.type}: ${x.text}`).join("\n")));
    historyCard.querySelector("#ppClearHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // focus modal
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "pp-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "pp-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);
    let activeCard = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || activeCard === card) return;
      activeCard = card;
      placeholder = document.createElement("div");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.parentNode.insertBefore(placeholder, card);
      focusHost.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      focusOverlay.classList.add("active");
      focusHost.classList.add("active");
      document.body.classList.add("pp-modal-open");
    }
    function closeFocus() {
      if (!activeCard) return;
      activeCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeCard.classList.remove("is-focused");
      if (placeholder?.parentNode) {
        placeholder.parentNode.insertBefore(activeCard, placeholder);
        placeholder.remove();
      }
      activeCard = null;
      placeholder = null;
      focusOverlay.classList.remove("active");
      focusHost.classList.remove("active");
      document.body.classList.remove("pp-modal-open");
    }
    grid.querySelectorAll(".pp-card [data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.target.closest(".pp-card"))));
    grid.querySelectorAll(".pp-card [data-focus-close]").forEach((btn) => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFocus();
    }));
    focusOverlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFocus();
    });
    document.querySelectorAll(".tool-nav-btn").forEach((btn) => btn.addEventListener("click", () => {
      document.querySelectorAll(".tool-nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const card = document.getElementById(`card-${btn.getAttribute("data-target")}`);
      if (!card) return;
      const mobile = window.matchMedia("(max-width: 768px)").matches;
      if (mobile) openFocus(card);
      else card.scrollIntoView({ behavior: "smooth", block: "start" });
    }));

    applyPreset();
    renderEditor();
  }

  window.QwicktonCategoryInits["passport-photo-maker"] = initPassportPhotoMaker;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initPassportPhotoMaker();
  });
})();
