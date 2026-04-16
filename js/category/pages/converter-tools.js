(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-converter-history-v2";
  const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CNY", "CAD", "AUD", "CHF", "SGD", "AED", "BRL", "MXN", "KRW", "RUB", "ZAR"];
  const EXCHANGE_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 148.2, CNY: 7.2, CAD: 1.35, AUD: 1.52, CHF: 0.88, SGD: 1.34, AED: 3.67, BRL: 5.05, MXN: 17.1, KRW: 1330, RUB: 91.5, ZAR: 18.9 };

  const CONVERTERS = [
    { id: "length", icon: "📏", title: "Length Converter", units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 }, labels: { mm: "Millimeter", cm: "Centimeter", m: "Meter", km: "Kilometer", in: "Inch", ft: "Foot", yd: "Yard", mi: "Mile" }, from: "m", to: "ft" },
    { id: "weight", icon: "⚖️", title: "Weight Converter", units: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592 }, labels: { mg: "Milligram", g: "Gram", kg: "Kilogram", t: "Ton", oz: "Ounce", lb: "Pound" }, from: "kg", to: "lb" },
    { id: "data", icon: "💾", title: "Data Converter", units: { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }, labels: { b: "Byte", kb: "Kilobyte", mb: "Megabyte", gb: "Gigabyte", tb: "Terabyte" }, from: "mb", to: "gb" },
    { id: "time", icon: "⏰", title: "Time Converter", units: { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, w: 604800 }, labels: { ms: "Millisecond", s: "Second", min: "Minute", h: "Hour", d: "Day", w: "Week" }, from: "h", to: "min" },
    { id: "speed", icon: "🚗", title: "Speed Converter", units: { mps: 1, kph: 0.277778, mph: 0.44704, knots: 0.514444 }, labels: { mps: "m/s", kph: "km/h", mph: "mph", knots: "Knots" }, from: "kph", to: "mph" },
    { id: "volume", icon: "🧴", title: "Volume Converter", units: { ml: 0.001, l: 1, m3: 1000, gal_us: 3.78541, gal_uk: 4.54609 }, labels: { ml: "Milliliter", l: "Liter", m3: "Cubic Meter", gal_us: "US Gallon", gal_uk: "UK Gallon" }, from: "l", to: "gal_us" },
    { id: "area", icon: "📐", title: "Area Converter", units: { mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000, sqft: 0.092903, acre: 4046.86 }, labels: { mm2: "mm²", cm2: "cm²", m2: "m²", km2: "km²", sqft: "sq ft", acre: "Acre" }, from: "m2", to: "sqft" },
    { id: "energy", icon: "⚡", title: "Energy Converter", units: { j: 1, kj: 1000, cal: 4.184, kcal: 4184, wh: 3600, kwh: 3600000 }, labels: { j: "Joule", kj: "Kilojoule", cal: "Calorie", kcal: "Kilocalorie", wh: "Watt-hour", kwh: "kWh" }, from: "j", to: "cal" },
    { id: "pressure", icon: "🎈", title: "Pressure Converter", units: { pa: 1, kpa: 1000, bar: 100000, psi: 6894.76, atm: 101325 }, labels: { pa: "Pascal", kpa: "kPa", bar: "Bar", psi: "PSI", atm: "Atmosphere" }, from: "pa", to: "psi" }
  ];

  function safeNum(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }
  function esc(s) { return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadText(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 35))); }

  function initConverterTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.converterToolsInitialized === "true") return;
    grid.dataset.converterToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "conv-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="conv-card-header"><div class="conv-card-icon">${icon}</div><h3 class="conv-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary conv-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary conv-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function pushHistory(type, text) {
      if (!text) return;
      writeHistory([{ type, text: String(text).slice(0, 180), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const host = historyCardEl.querySelector("#convHistory");
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No conversion history yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" data-i="${i}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => copyText(`${items[Number(btn.dataset.i)]?.type}: ${items[Number(btn.dataset.i)]?.text}`)));
    }

    // 1-9 unit converters
    CONVERTERS.forEach((cfg) => {
      const options = Object.keys(cfg.units).map((u) => `<option value="${u}">${cfg.labels[u]}</option>`).join("");
      const card = makeCard(cfg.id, cfg.icon, cfg.title, `
        <div class="grid-2">
          <div><label>Value</label><input id="${cfg.id}Val" type="number" value="1" step="any"></div>
          <div><label>Precision</label><input id="${cfg.id}Prec" type="number" value="4" min="0" max="10"></div>
          <div><label>From</label><select id="${cfg.id}From">${options}</select></div>
          <div><label>To</label><select id="${cfg.id}To">${options}</select></div>
        </div>
        <div class="inline-row"><button class="btn btn-primary" id="${cfg.id}Run">Convert</button><button class="btn btn-secondary" id="${cfg.id}Swap">Swap</button><button class="btn btn-secondary" id="${cfg.id}Copy">Copy</button><button class="btn btn-secondary" id="${cfg.id}Txt">TXT</button></div>
        <div id="${cfg.id}Res" class="result result-large">-</div>
      `);
      card.querySelector(`#${cfg.id}From`).value = cfg.from;
      card.querySelector(`#${cfg.id}To`).value = cfg.to;
      function run() {
        const val = safeNum(card.querySelector(`#${cfg.id}Val`).value, NaN);
        const prec = Math.max(0, Math.min(10, safeNum(card.querySelector(`#${cfg.id}Prec`).value, 4)));
        const from = card.querySelector(`#${cfg.id}From`).value;
        const to = card.querySelector(`#${cfg.id}To`).value;
        if (!Number.isFinite(val)) {
          card.querySelector(`#${cfg.id}Res`).textContent = "Enter valid value.";
          return;
        }
        const out = (val * cfg.units[from]) / cfg.units[to];
        const txt = `${val} ${cfg.labels[from]} = ${out.toFixed(prec)} ${cfg.labels[to]}`;
        card.querySelector(`#${cfg.id}Res`).textContent = txt;
        pushHistory(cfg.title, txt);
      }
      card.querySelector(`#${cfg.id}Run`).addEventListener("click", run);
      card.querySelector(`#${cfg.id}Swap`).addEventListener("click", () => {
        const f = card.querySelector(`#${cfg.id}From`);
        const t = card.querySelector(`#${cfg.id}To`);
        [f.value, t.value] = [t.value, f.value];
        run();
      });
      card.querySelector(`#${cfg.id}Copy`).addEventListener("click", () => copyText(card.querySelector(`#${cfg.id}Res`).textContent));
      card.querySelector(`#${cfg.id}Txt`).addEventListener("click", () => downloadText(`${cfg.id}-conversion.txt`, card.querySelector(`#${cfg.id}Res`).textContent));
      run();
    });

    // 10 temperature converter
    const tempCard = makeCard("temperature", "🌡️", "Temperature Converter", `
      <div class="grid-2">
        <div><label>Value</label><input id="tmpVal" type="number" value="25" step="any"></div>
        <div><label>Precision</label><input id="tmpPrec" type="number" value="2" min="0" max="8"></div>
        <div><label>From</label><select id="tmpFrom"><option value="C">Celsius</option><option value="F">Fahrenheit</option><option value="K">Kelvin</option></select></div>
        <div><label>To</label><select id="tmpTo"><option value="F">Fahrenheit</option><option value="C">Celsius</option><option value="K">Kelvin</option></select></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="tmpRun">Convert</button><button class="btn btn-secondary" id="tmpSwap">Swap</button><button class="btn btn-secondary" id="tmpCopy">Copy</button><button class="btn btn-secondary" id="tmpTxt">TXT</button></div>
      <div id="tmpRes" class="result result-large">-</div>
    `);
    function convertTemp(v, from, to) {
      let c = v;
      if (from === "F") c = ((v - 32) * 5) / 9;
      else if (from === "K") c = v - 273.15;
      if (to === "C") return c;
      if (to === "F") return (c * 9) / 5 + 32;
      return c + 273.15;
    }
    function runTemp() {
      const val = safeNum(tempCard.querySelector("#tmpVal").value, NaN);
      if (!Number.isFinite(val)) {
        tempCard.querySelector("#tmpRes").textContent = "Enter valid value.";
        return;
      }
      const from = tempCard.querySelector("#tmpFrom").value;
      const to = tempCard.querySelector("#tmpTo").value;
      const p = Math.max(0, Math.min(8, safeNum(tempCard.querySelector("#tmpPrec").value, 2)));
      const out = convertTemp(val, from, to);
      const txt = `${val}°${from} = ${out.toFixed(p)}°${to}`;
      tempCard.querySelector("#tmpRes").textContent = txt;
      pushHistory("Temperature", txt);
    }
    tempCard.querySelector("#tmpRun").addEventListener("click", runTemp);
    tempCard.querySelector("#tmpSwap").addEventListener("click", () => {
      const f = tempCard.querySelector("#tmpFrom");
      const t = tempCard.querySelector("#tmpTo");
      [f.value, t.value] = [t.value, f.value];
      runTemp();
    });
    tempCard.querySelector("#tmpCopy").addEventListener("click", () => copyText(tempCard.querySelector("#tmpRes").textContent));
    tempCard.querySelector("#tmpTxt").addEventListener("click", () => downloadText("temperature-conversion.txt", tempCard.querySelector("#tmpRes").textContent));
    runTemp();

    // 11 currency converter
    const curCard = makeCard("currency", "💱", "Currency Converter", `
      <p class="conv-hint">Offline snapshot rates for reliability. Verify before final business payments.</p>
      <div class="grid-2">
        <div><label>Amount</label><input id="curAmt" type="number" value="100" step="any"></div>
        <div><label>Precision</label><input id="curPrec" type="number" value="2" min="0" max="8"></div>
        <div><label>From</label><select id="curFrom">${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
        <div><label>To</label><select id="curTo">${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="curRun">Convert</button><button class="btn btn-secondary" id="curSwap">Swap</button><button class="btn btn-secondary" id="curCopy">Copy</button><button class="btn btn-secondary" id="curTxt">TXT</button></div>
      <div id="curRes" class="result result-large">-</div>
      <div id="curRate" class="result">Rate: -</div>
    `);
    curCard.querySelector("#curFrom").value = "USD";
    curCard.querySelector("#curTo").value = "EUR";
    function runCur() {
      const amt = safeNum(curCard.querySelector("#curAmt").value, NaN);
      if (!Number.isFinite(amt)) {
        curCard.querySelector("#curRes").textContent = "Enter valid amount.";
        return;
      }
      const p = Math.max(0, Math.min(8, safeNum(curCard.querySelector("#curPrec").value, 2)));
      const from = curCard.querySelector("#curFrom").value;
      const to = curCard.querySelector("#curTo").value;
      const rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
      const out = amt * rate;
      const txt = `${amt.toFixed(p)} ${from} = ${out.toFixed(p)} ${to}`;
      curCard.querySelector("#curRes").textContent = txt;
      curCard.querySelector("#curRate").textContent = `1 ${from} = ${rate.toFixed(6)} ${to}`;
      pushHistory("Currency", txt);
    }
    curCard.querySelector("#curRun").addEventListener("click", runCur);
    curCard.querySelector("#curSwap").addEventListener("click", () => {
      const f = curCard.querySelector("#curFrom");
      const t = curCard.querySelector("#curTo");
      [f.value, t.value] = [t.value, f.value];
      runCur();
    });
    curCard.querySelector("#curCopy").addEventListener("click", () => copyText(curCard.querySelector("#curRes").textContent));
    curCard.querySelector("#curTxt").addEventListener("click", () => downloadText("currency-conversion.txt", `${curCard.querySelector("#curRes").textContent}\n${curCard.querySelector("#curRate").textContent}`));
    runCur();

    // 12 color converter
    const colorCard = makeCard("color", "🎨", "Color Converter", `
      <div class="grid-2">
        <div><label>Hex</label><input id="colHex" type="text" value="#8b5cf6" placeholder="#RRGGBB"></div>
        <div><label>RGB (r,g,b)</label><input id="colRgb" type="text" value="139,92,246" placeholder="255,255,255"></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="colRun">Convert</button><button class="btn btn-secondary" id="colCopy">Copy</button><button class="btn btn-secondary" id="colTxt">TXT</button></div>
      <div id="colPreview" class="color-preview" style="background:#8b5cf6"></div>
      <div id="colRes" class="result">-</div>
    `);
    function rgbToHex(r, g, b) {
      const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
      return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }
    function parseHex(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
      if (!m) return null;
      const raw = m[1];
      return { r: parseInt(raw.slice(0, 2), 16), g: parseInt(raw.slice(2, 4), 16), b: parseInt(raw.slice(4, 6), 16), hex: `#${raw.toLowerCase()}` };
    }
    function parseRgb(s) {
      const m = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.exec(String(s || ""));
      if (!m) return null;
      const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
      if (r > 255 || g > 255 || b > 255) return null;
      return { r, g, b };
    }
    function runColor() {
      const hex = parseHex(colorCard.querySelector("#colHex").value);
      const rgb = parseRgb(colorCard.querySelector("#colRgb").value);
      let data = hex;
      if (!data && rgb) data = { ...rgb, hex: rgbToHex(rgb.r, rgb.g, rgb.b) };
      if (!data && hex) data = hex;
      if (!data) {
        colorCard.querySelector("#colRes").textContent = "Use valid HEX or RGB.";
        return;
      }
      const txt = `HEX: ${data.hex}\nRGB: ${data.r}, ${data.g}, ${data.b}`;
      colorCard.querySelector("#colHex").value = data.hex;
      colorCard.querySelector("#colRgb").value = `${data.r},${data.g},${data.b}`;
      colorCard.querySelector("#colPreview").style.background = data.hex;
      colorCard.querySelector("#colRes").textContent = txt;
      pushHistory("Color", txt.replace("\n", " | "));
    }
    colorCard.querySelector("#colRun").addEventListener("click", runColor);
    colorCard.querySelector("#colCopy").addEventListener("click", () => copyText(colorCard.querySelector("#colRes").textContent));
    colorCard.querySelector("#colTxt").addEventListener("click", () => downloadText("color-conversion.txt", colorCard.querySelector("#colRes").textContent));
    runColor();

    // 13 base64 text/file
    const b64Card = makeCard("base64", "📦", "Base64 Encoder / Decoder", `
      <div><label>Text Input</label><textarea id="b64In" rows="4" placeholder="Enter plain text or Base64"></textarea></div>
      <div><label>Optional File</label><input id="b64File" type="file"></div>
      <div class="inline-row"><button class="btn btn-primary" id="b64Enc">Encode Text</button><button class="btn btn-secondary" id="b64Dec">Decode Text</button><button class="btn btn-secondary" id="b64FileEnc">Encode File</button><button class="btn btn-secondary" id="b64Copy">Copy</button><button class="btn btn-secondary" id="b64Txt">TXT</button></div>
      <textarea id="b64Res" class="result" rows="6" placeholder="Output appears here"></textarea>
    `);
    function utf8ToB64(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch { return ""; } }
    function b64ToUtf8(s) { try { return decodeURIComponent(escape(atob(s))); } catch { return ""; } }
    b64Card.querySelector("#b64Enc").addEventListener("click", () => {
      const out = utf8ToB64(b64Card.querySelector("#b64In").value);
      b64Card.querySelector("#b64Res").value = out || "Unable to encode input.";
      if (out) pushHistory("Base64 Encode", out.slice(0, 80));
    });
    b64Card.querySelector("#b64Dec").addEventListener("click", () => {
      const out = b64ToUtf8(b64Card.querySelector("#b64In").value.trim());
      b64Card.querySelector("#b64Res").value = out || "Invalid Base64 text.";
      if (out) pushHistory("Base64 Decode", out.slice(0, 80));
    });
    b64Card.querySelector("#b64FileEnc").addEventListener("click", async () => {
      const file = b64Card.querySelector("#b64File").files?.[0];
      if (!file) {
        b64Card.querySelector("#b64Res").value = "Select a file first.";
        return;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = () => reject(new Error("Failed to read file."));
        r.readAsDataURL(file);
      }).catch(() => "");
      if (!dataUrl) {
        b64Card.querySelector("#b64Res").value = "Could not encode file.";
        return;
      }
      b64Card.querySelector("#b64Res").value = dataUrl;
      pushHistory("Base64 File", `${file.name} (${file.size} bytes)`);
    });
    b64Card.querySelector("#b64Copy").addEventListener("click", () => copyText(b64Card.querySelector("#b64Res").value));
    b64Card.querySelector("#b64Txt").addEventListener("click", () => downloadText("base64-output.txt", b64Card.querySelector("#b64Res").value));

    // 14 JSON/CSV converter
    const jcCard = makeCard("json", "📊", "JSON <-> CSV Converter", `
      <div><label>Input</label><textarea id="jcIn" rows="6" placeholder='Example JSON: [{"name":"A","score":10}]'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jcJ2C">JSON to CSV</button><button class="btn btn-secondary" id="jcC2J">CSV to JSON</button><button class="btn btn-secondary" id="jcCopy">Copy</button><button class="btn btn-secondary" id="jcTxt">TXT</button></div>
      <textarea id="jcRes" class="result" rows="8" placeholder="Output appears here"></textarea>
    `);
    function jsonToCsv(input) {
      const arr = JSON.parse(input);
      if (!Array.isArray(arr) || !arr.length) throw new Error("JSON must be a non-empty array.");
      const headers = Array.from(arr.reduce((set, row) => { Object.keys(row || {}).forEach((k) => set.add(k)); return set; }, new Set()));
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [headers.map(escape).join(",")];
      arr.forEach((row) => lines.push(headers.map((h) => escape(row?.[h])).join(",")));
      return lines.join("\n");
    }
    function csvToJson(input) {
      const lines = input.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV needs header + at least one row.");
      const parseLine = (line) => {
        const out = [];
        let cur = "";
        let q = false;
        for (let i = 0; i < line.length; i += 1) {
          const ch = line[i];
          if (ch === '"') {
            if (q && line[i + 1] === '"') { cur += '"'; i += 1; } else q = !q;
          } else if (ch === "," && !q) { out.push(cur); cur = ""; }
          else cur += ch;
        }
        out.push(cur);
        return out;
      };
      const headers = parseLine(lines[0]).map((h) => h.trim());
      const data = lines.slice(1).map((line) => {
        const values = parseLine(line);
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = values[idx] ?? ""; });
        return obj;
      });
      return JSON.stringify(data, null, 2);
    }
    function runJc(mode) {
      const input = jcCard.querySelector("#jcIn").value;
      if (!input.trim()) {
        jcCard.querySelector("#jcRes").value = "Input required.";
        return;
      }
      try {
        const out = mode === "j2c" ? jsonToCsv(input) : csvToJson(input);
        jcCard.querySelector("#jcRes").value = out;
        pushHistory("JSON/CSV", `Mode: ${mode}`);
      } catch (err) {
        jcCard.querySelector("#jcRes").value = `Error: ${err.message}`;
      }
    }
    jcCard.querySelector("#jcJ2C").addEventListener("click", () => runJc("j2c"));
    jcCard.querySelector("#jcC2J").addEventListener("click", () => runJc("c2j"));
    jcCard.querySelector("#jcCopy").addEventListener("click", () => copyText(jcCard.querySelector("#jcRes").value));
    jcCard.querySelector("#jcTxt").addEventListener("click", () => downloadText("json-csv-output.txt", jcCard.querySelector("#jcRes").value));

    // 15 SHA-256 hash
    const hashCard = makeCard("hash", "🔒", "SHA-256 Hash Generator", `
      <div><label>Text</label><textarea id="hashText" rows="4" placeholder="Enter text to hash"></textarea></div>
      <div><label>Optional File</label><input id="hashFile" type="file"></div>
      <div class="inline-row"><button class="btn btn-primary" id="hashRunText">Hash Text</button><button class="btn btn-secondary" id="hashRunFile">Hash File</button><button class="btn btn-secondary" id="hashCopy">Copy</button><button class="btn btn-secondary" id="hashTxt">TXT</button></div>
      <textarea id="hashRes" class="result" rows="5" placeholder="Hash output appears here"></textarea>
    `);
    async function sha256Buffer(buf) {
      const digest = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    hashCard.querySelector("#hashRunText").addEventListener("click", async () => {
      const text = hashCard.querySelector("#hashText").value;
      if (!text) {
        hashCard.querySelector("#hashRes").value = "Enter text first.";
        return;
      }
      const h = await sha256Buffer(new TextEncoder().encode(text));
      hashCard.querySelector("#hashRes").value = h;
      pushHistory("SHA-256 Text", h.slice(0, 80));
    });
    hashCard.querySelector("#hashRunFile").addEventListener("click", async () => {
      const file = hashCard.querySelector("#hashFile").files?.[0];
      if (!file) {
        hashCard.querySelector("#hashRes").value = "Select a file first.";
        return;
      }
      const h = await sha256Buffer(await file.arrayBuffer());
      hashCard.querySelector("#hashRes").value = `File: ${file.name}\nSize: ${file.size} bytes\nSHA-256: ${h}`;
      pushHistory("SHA-256 File", `${file.name} (${file.size} bytes)`);
    });
    hashCard.querySelector("#hashCopy").addEventListener("click", () => copyText(hashCard.querySelector("#hashRes").value));
    hashCard.querySelector("#hashTxt").addEventListener("click", () => downloadText("sha256-output.txt", hashCard.querySelector("#hashRes").value));

    // 16 history
    historyCardEl = makeCard("history", "📜", "Recent Conversions", `
      <div id="convHistory" class="chip-list"><span class="empty-hint">No conversion history yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clearHistory">Clear</button><button class="btn btn-secondary" id="exportHistory">Export TXT</button></div>
    `, { focusable: false });
    historyCardEl.classList.add("full-width");
    historyCardEl.querySelector("#clearHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCardEl.querySelector("#exportHistory").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`converter-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // Focus modal and nav open
    const overlay = document.createElement("div");
    overlay.className = "conv-focus-overlay";
    const host = document.createElement("div");
    host.className = "conv-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let activeCard = null;
    let placeholder = null;

    function openFocus(card) {
      if (!card || activeCard === card) return;
      if (activeCard) closeFocus();
      activeCard = card;
      placeholder = document.createElement("div");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.parentNode.insertBefore(placeholder, card);
      host.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      overlay.classList.add("active");
      host.classList.add("active");
      document.body.classList.add("conv-modal-open");
    }
    function closeFocus() {
      if (!activeCard) return;
      activeCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeCard.classList.remove("is-focused");
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(activeCard, placeholder);
        placeholder.remove();
      }
      activeCard = null;
      placeholder = null;
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("conv-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".conv-card"))));
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
        setTimeout(() => openFocus(card), 180);
      });
    });
  }

  window.QwicktonCategoryInits["converter-tools"] = initConverterTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initConverterTools();
  });
})();
