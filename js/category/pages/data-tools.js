(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-data-history-v2";
  const LOCALE_PRESETS = [
    { code: "en-US", label: "United States (en-US)", date: "MM/DD/YYYY", decimal: ".", delimiter: "," },
    { code: "en-GB", label: "United Kingdom (en-GB)", date: "DD/MM/YYYY", decimal: ".", delimiter: "," },
    { code: "fr-FR", label: "France (fr-FR)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "de-DE", label: "Germany (de-DE)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "es-ES", label: "Spain (es-ES)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "it-IT", label: "Italy (it-IT)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "pt-BR", label: "Brazil (pt-BR)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "ru-RU", label: "Russia (ru-RU)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "ja-JP", label: "Japan (ja-JP)", date: "YYYY/MM/DD", decimal: ".", delimiter: "," },
    { code: "ko-KR", label: "South Korea (ko-KR)", date: "YYYY.MM.DD", decimal: ".", delimiter: "," },
    { code: "zh-CN", label: "China (zh-CN)", date: "YYYY/MM/DD", decimal: ".", delimiter: "," },
    { code: "hi-IN", label: "India (hi-IN)", date: "DD-MM-YYYY", decimal: ".", delimiter: "," },
    { code: "ar-SA", label: "Saudi Arabia (ar-SA)", date: "DD/MM/YYYY", decimal: ".", delimiter: "," },
    { code: "tr-TR", label: "Turkey (tr-TR)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "vi-VN", label: "Vietnam (vi-VN)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "id-ID", label: "Indonesia (id-ID)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" }
  ];

  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }
  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function q(root, sel) {
    return root.querySelector(sel);
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

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
  }

  function parseCsv(text, delimiter = ",") {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    return lines.map((line) => {
      const out = [];
      let cur = "";
      let quote = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
          if (quote && line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else quote = !quote;
        } else if (ch === delimiter && !quote) {
          out.push(cur);
          cur = "";
        } else cur += ch;
      }
      out.push(cur);
      return out;
    });
  }
  function csvEscape(cell, delimiter = ",") {
    const str = String(cell ?? "");
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }
  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str)));
  }
  function b64UrlDecode(str) {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
    return b64ToUtf8(base64);
  }
  async function sha256(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function initDataTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.dataToolsInitialized === "true") return;
    grid.dataset.dataToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "data-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="data-card-header"><div class="data-card-icon">${icon}</div><h3 class="data-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary data-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary data-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
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
      const host = q(historyCard, "#dataHistory");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No data outputs yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" type="button" data-i="${i}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const it = items[Number(btn.dataset.i)];
        if (it) copyText(`${it.type}: ${it.text}`);
      }));
    }
    function bindCommon(card, id, getOutput) {
      card.querySelector("[data-copy]")?.addEventListener("click", () => copyText(getOutput()));
      card.querySelector("[data-export]")?.addEventListener("click", () => downloadText(`${id}.txt`, getOutput()));
    }

    const jsonCard = makeCard("json", "📋", "JSON Formatter & Validator", `
      <div><label>JSON Input</label><textarea id="jIn" rows="7" placeholder='{"name":"Qwickton","country":"India"}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jFmt">Format</button><button class="btn btn-secondary" id="jMin">Minify</button><button class="btn btn-secondary" id="jVal">Validate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="jOut" class="result" rows="8" readonly></textarea><div id="jMeta" class="result">Status: ready</div>
    `);
    function setJMeta(msg) { q(jsonCard, "#jMeta").textContent = msg; }
    q(jsonCard, "#jFmt").addEventListener("click", () => {
      try {
        const out = JSON.stringify(JSON.parse(q(jsonCard, "#jIn").value), null, 2);
        q(jsonCard, "#jOut").value = out;
        setJMeta(`Valid JSON | ${out.length} chars`);
        pushHistory("JSON Format", `${out.length} chars`);
      } catch (e) {
        q(jsonCard, "#jOut").value = "";
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    q(jsonCard, "#jMin").addEventListener("click", () => {
      try {
        const out = JSON.stringify(JSON.parse(q(jsonCard, "#jIn").value));
        q(jsonCard, "#jOut").value = out;
        setJMeta(`Minified | ${out.length} chars`);
      } catch (e) {
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    q(jsonCard, "#jVal").addEventListener("click", () => {
      try {
        JSON.parse(q(jsonCard, "#jIn").value);
        setJMeta("Valid JSON");
      } catch (e) {
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    bindCommon(jsonCard, "json-tool", () => q(jsonCard, "#jOut").value);

    const csvCard = makeCard("csv", "📊", "CSV <-> JSON Converter", `
      <div><label>Input CSV or JSON</label><textarea id="cIn" rows="7" placeholder="name,age&#10;Avi,28"></textarea></div>
      <div class="grid-2"><div><label>Mode</label><select id="cMode"><option value="csv2json">CSV to JSON</option><option value="json2csv">JSON to CSV</option></select></div><div><label>Delimiter</label><select id="cDel"><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="\t">Tab (TSV)</option><option value="|">Pipe (|)</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="cOut" class="result" rows="8" readonly></textarea>
    `);
    q(csvCard, "#cRun").addEventListener("click", () => {
      const mode = q(csvCard, "#cMode").value;
      const delRaw = q(csvCard, "#cDel").value;
      const delimiter = delRaw === "\\t" ? "\t" : delRaw;
      const input = q(csvCard, "#cIn").value.trim();
      if (!input) {
        q(csvCard, "#cOut").value = "Input required.";
        return;
      }
      try {
        if (mode === "csv2json") {
          const rows = parseCsv(input, delimiter);
          const header = rows[0] || [];
          const arr = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
          q(csvCard, "#cOut").value = JSON.stringify(arr, null, 2);
          pushHistory("CSV->JSON", `${arr.length} rows`);
        } else {
          const arr = JSON.parse(input);
          if (!Array.isArray(arr) || !arr.length) throw new Error("JSON must be non-empty array.");
          const keys = Array.from(arr.reduce((s, o) => { Object.keys(o || {}).forEach((k) => s.add(k)); return s; }, new Set()));
          const lines = [keys.map((k) => csvEscape(k, delimiter)).join(delimiter)];
          arr.forEach((obj) => lines.push(keys.map((k) => csvEscape(obj?.[k], delimiter)).join(delimiter)));
          q(csvCard, "#cOut").value = lines.join("\n");
          pushHistory("JSON->CSV", `${arr.length} rows`);
        }
      } catch (e) {
        q(csvCard, "#cOut").value = `Error: ${e.message}`;
      }
    });
    bindCommon(csvCard, "csv-json", () => q(csvCard, "#cOut").value);

    const xmlCard = makeCard("xml", "📄", "XML to JSON Converter", `
      <div><label>XML Input</label><textarea id="xIn" rows="7" placeholder="<root><name>Avi</name></root>"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="xRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="xOut" class="result" rows="8" readonly></textarea>
    `);
    q(xmlCard, "#xRun").addEventListener("click", () => {
      const xml = q(xmlCard, "#xIn").value.trim();
      if (!xml) return;
      try {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("Invalid XML.");
        const root = doc.documentElement;
        const obj = {};
        Array.from(root.children).forEach((el) => { obj[el.nodeName] = el.textContent; });
        q(xmlCard, "#xOut").value = JSON.stringify({ [root.nodeName]: obj }, null, 2);
        pushHistory("XML->JSON", root.nodeName);
      } catch (e) {
        q(xmlCard, "#xOut").value = `Error: ${e.message}`;
      }
    });
    bindCommon(xmlCard, "xml-json", () => q(xmlCard, "#xOut").value);

    const yamlCard = makeCard("yaml", "📝", "YAML to JSON Converter", `
      <div><label>YAML Input</label><textarea id="yIn" rows="7" placeholder="name: Avi&#10;country: India"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="yRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="yOut" class="result" rows="8" readonly></textarea>
    `);
    q(yamlCard, "#yRun").addEventListener("click", () => {
      const out = {};
      q(yamlCard, "#yIn").value.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
        if (!m) return;
        let v = m[2].trim();
        if (v === "true") v = true;
        else if (v === "false") v = false;
        else if (v !== "" && !Number.isNaN(Number(v))) v = Number(v);
        out[m[1]] = v;
      });
      q(yamlCard, "#yOut").value = JSON.stringify(out, null, 2);
      pushHistory("YAML->JSON", `${Object.keys(out).length} keys`);
    });
    bindCommon(yamlCard, "yaml-json", () => q(yamlCard, "#yOut").value);

    const sqlCard = makeCard("sql", "🗄️", "SQL Formatter", `
      <div><label>SQL Input</label><textarea id="sIn" rows="7" placeholder="select id,name from users where active=1 order by name"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="sRun">Format</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="sOut" class="result" rows="8" readonly></textarea>
    `);
    q(sqlCard, "#sRun").addEventListener("click", () => {
      let sql = q(sqlCard, "#sIn").value.replace(/\s+/g, " ").trim();
      ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LEFT JOIN", "RIGHT JOIN", "JOIN", "HAVING", "LIMIT"].forEach((k) => {
        sql = sql.replace(new RegExp(`\\b${k}\\b`, "gi"), `\n${k}\n  `);
      });
      q(sqlCard, "#sOut").value = sql.trim();
      pushHistory("SQL Format", "formatted");
    });
    bindCommon(sqlCard, "sql", () => q(sqlCard, "#sOut").value);

    const b64Card = makeCard("base64", "📦", "Base64 Encoder / Decoder", `
      <div><label>Text Input</label><textarea id="bIn" rows="6" placeholder="Enter text"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="bEnc">Encode</button><button class="btn btn-secondary" id="bDec">Decode</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="bOut" class="result" rows="7" readonly></textarea>
    `);
    q(b64Card, "#bEnc").addEventListener("click", () => {
      q(b64Card, "#bOut").value = utf8ToB64(q(b64Card, "#bIn").value);
      pushHistory("Base64 Encode", "done");
    });
    q(b64Card, "#bDec").addEventListener("click", () => {
      try {
        q(b64Card, "#bOut").value = b64ToUtf8(q(b64Card, "#bIn").value.trim());
        pushHistory("Base64 Decode", "done");
      } catch {
        q(b64Card, "#bOut").value = "Invalid Base64 input.";
      }
    });
    bindCommon(b64Card, "base64", () => q(b64Card, "#bOut").value);

    const jwtCard = makeCard("jwt", "🔑", "JWT Decoder", `
      <div><label>JWT Token</label><textarea id="jwIn" rows="5" placeholder="eyJ..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jwRun">Decode</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="jwOut" class="result" rows="8" readonly></textarea>
    `);
    q(jwtCard, "#jwRun").addEventListener("click", () => {
      const token = q(jwtCard, "#jwIn").value.trim();
      const parts = token.split(".");
      if (parts.length < 2) {
        q(jwtCard, "#jwOut").value = "Invalid JWT format.";
        return;
      }
      try {
        const header = JSON.parse(b64UrlDecode(parts[0]));
        const payload = JSON.parse(b64UrlDecode(parts[1]));
        q(jwtCard, "#jwOut").value = `HEADER\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(payload, null, 2)}\n\nSIGNATURE: ${parts[2] ? "present" : "missing"}`;
        pushHistory("JWT Decode", "decoded");
      } catch {
        q(jwtCard, "#jwOut").value = "Could not decode JWT token.";
      }
    });
    bindCommon(jwtCard, "jwt", () => q(jwtCard, "#jwOut").value);

    const hashCard = makeCard("hash", "🔒", "SHA-256 Hash Tool", `
      <div><label>Text Input</label><textarea id="hIn" rows="5" placeholder="Enter text"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="hRun">Generate Hash</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="hOut" class="result" rows="6" readonly></textarea>
    `);
    q(hashCard, "#hRun").addEventListener("click", async () => {
      const input = q(hashCard, "#hIn").value;
      if (!input) return;
      const out = await sha256(input);
      q(hashCard, "#hOut").value = out;
      pushHistory("SHA-256", out.slice(0, 16));
    });
    bindCommon(hashCard, "hash", () => q(hashCard, "#hOut").value);

    const diffCard = makeCard("diff", "≠", "Text Diff Checker", `
      <div class="grid-2"><div><label>Text A</label><textarea id="dA" rows="6"></textarea></div><div><label>Text B</label><textarea id="dB" rows="6"></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="dRun">Compare</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="dOut" class="result" rows="8" readonly></textarea>
    `);
    q(diffCard, "#dRun").addEventListener("click", () => {
      const a = q(diffCard, "#dA").value.split(/\r?\n/);
      const b = q(diffCard, "#dB").value.split(/\r?\n/);
      const max = Math.max(a.length, b.length);
      const lines = [];
      for (let i = 0; i < max; i += 1) {
        const la = a[i] ?? "";
        const lb = b[i] ?? "";
        if (la !== lb) lines.push(`Line ${i + 1}\nA: ${la}\nB: ${lb}\n`);
      }
      q(diffCard, "#dOut").value = lines.length ? lines.join("\n") : "Texts are identical.";
      pushHistory("Text Diff", lines.length ? `${lines.length} changes` : "no change");
    });
    bindCommon(diffCard, "text-diff", () => q(diffCard, "#dOut").value);

    const inspCard = makeCard("inspect", "🔍", "JSON Inspector", `
      <div><label>JSON Input</label><textarea id="iIn" rows="7" placeholder='{"users":[{"name":"Avi"}]}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="iRun">Inspect</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="iOut" class="result" rows="8" readonly></textarea>
    `);
    q(inspCard, "#iRun").addEventListener("click", () => {
      try {
        const parsed = JSON.parse(q(inspCard, "#iIn").value);
        const isArr = Array.isArray(parsed);
        const keys = isArr ? Array.from(new Set(parsed.flatMap((x) => (x && typeof x === "object" ? Object.keys(x) : [])))) : Object.keys(parsed || {});
        q(inspCard, "#iOut").value = [
          "JSON Inspection Report",
          "========================================",
          `Top Type: ${isArr ? "Array" : typeof parsed}`,
          `Top Size: ${isArr ? parsed.length : keys.length}`,
          `Unique Keys: ${keys.length}`,
          `Key List: ${keys.join(", ") || "-"}`,
          `Serialized Size: ${JSON.stringify(parsed).length} chars`
        ].join("\n");
        pushHistory("JSON Inspect", `${keys.length} keys`);
      } catch (e) {
        q(inspCard, "#iOut").value = `Invalid JSON: ${e.message}`;
      }
    });
    bindCommon(inspCard, "json-inspector", () => q(inspCard, "#iOut").value);

    const dedupeCard = makeCard("dedupe", "🗑️", "CSV Deduplicate Rows", `
      <div><label>CSV Input</label><textarea id="ddIn" rows="7" placeholder="name,city&#10;Avi,Mumbai&#10;Avi,Mumbai"></textarea></div>
      <div class="grid-2"><div><label>Delimiter</label><select id="ddDel"><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select></div><div><label><input id="ddHead" type="checkbox" checked> First row is header</label></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="ddRun">Deduplicate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="ddOut" class="result" rows="8" readonly></textarea>
    `);
    q(dedupeCard, "#ddRun").addEventListener("click", () => {
      const delimiter = q(dedupeCard, "#ddDel").value === "\\t" ? "\t" : q(dedupeCard, "#ddDel").value;
      const rows = parseCsv(q(dedupeCard, "#ddIn").value, delimiter);
      if (!rows.length) return;
      const hasHeader = q(dedupeCard, "#ddHead").checked;
      const header = hasHeader ? rows[0] : null;
      const body = hasHeader ? rows.slice(1) : rows;
      const set = new Set();
      const uniq = body.filter((r) => {
        const key = r.join("\u001f");
        if (set.has(key)) return false;
        set.add(key);
        return true;
      });
      const outputRows = hasHeader ? [header, ...uniq] : uniq;
      q(dedupeCard, "#ddOut").value = outputRows.map((r) => r.map((c) => csvEscape(c, delimiter)).join(delimiter)).join("\n");
      pushHistory("CSV Dedupe", `${body.length} -> ${uniq.length}`);
    });
    bindCommon(dedupeCard, "csv-dedupe", () => q(dedupeCard, "#ddOut").value);

    const regCard = makeCard("regional", "🌍", "Regional Format Helper", `
      <p class="dt-hint">Configure data style by country/locale: date, decimal and CSV delimiter.</p>
      <div class="grid-2"><div><label>Country/Locale</label><select id="rLoc">${LOCALE_PRESETS.map((l) => `<option value="${l.code}">${l.label}</option>`).join("")}</select></div><div><label>Sample Number</label><input id="rNum" type="number" value="1234567.89" step="0.01"></div><div><label>Sample Date</label><input id="rDate" type="date"></div><div><label>Sample CSV Row</label><input id="rCsv" type="text" value="name,amount,date"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="rRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="rOut" class="result" rows="8" readonly></textarea>
    `);
    q(regCard, "#rDate").value = new Date().toISOString().slice(0, 10);
    q(regCard, "#rRun").addEventListener("click", () => {
      const code = q(regCard, "#rLoc").value;
      const preset = LOCALE_PRESETS.find((x) => x.code === code) || LOCALE_PRESETS[0];
      const num = safeNum(q(regCard, "#rNum").value, 0);
      const date = q(regCard, "#rDate").value ? new Date(q(regCard, "#rDate").value) : new Date();
      const csv = q(regCard, "#rCsv").value;
      const formattedNum = new Intl.NumberFormat(code).format(num);
      const formattedDate = new Intl.DateTimeFormat(code).format(date);
      const formattedCsv = csv.split(",").join(preset.delimiter);
      q(regCard, "#rOut").value = [
        `Locale: ${preset.label}`,
        `Date Style: ${preset.date}`,
        `Decimal Symbol: ${preset.decimal}`,
        `CSV Delimiter: ${preset.delimiter}`,
        `Formatted Number: ${formattedNum}`,
        `Formatted Date: ${formattedDate}`,
        `CSV Example: ${formattedCsv}`
      ].join("\n");
      pushHistory("Regional Format", preset.code);
    });
    q(regCard, "#rRun").click();
    bindCommon(regCard, "regional-format", () => q(regCard, "#rOut").value);

    historyCard = makeCard("history", "📜", "Recent Data Outputs", `
      <div id="dataHistory" class="chip-list"><span class="empty-hint">No data outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="dhClear">Clear</button><button class="btn btn-secondary" id="dhExport">Export TXT</button></div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    q(historyCard, "#dhClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    q(historyCard, "#dhExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`data-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    const overlay = document.createElement("div");
    overlay.className = "data-focus-overlay";
    const host = document.createElement("div");
    host.className = "data-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let activeCard = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false" || activeCard === card) return;
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
      document.body.classList.add("data-modal-open");
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
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("data-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".data-card"))));
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

  window.QwicktonCategoryInits["data-tools"] = initDataTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDataTools();
  });
})();
/*
(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-data-history-v2";
  const LOCALE_PRESETS = [
    { code: "en-US", label: "United States (en-US)", date: "MM/DD/YYYY", decimal: ".", delimiter: "," },
    { code: "en-GB", label: "United Kingdom (en-GB)", date: "DD/MM/YYYY", decimal: ".", delimiter: "," },
    { code: "fr-FR", label: "France (fr-FR)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "de-DE", label: "Germany (de-DE)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "es-ES", label: "Spain (es-ES)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "it-IT", label: "Italy (it-IT)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "pt-BR", label: "Brazil (pt-BR)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "ru-RU", label: "Russia (ru-RU)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "ja-JP", label: "Japan (ja-JP)", date: "YYYY/MM/DD", decimal: ".", delimiter: "," },
    { code: "ko-KR", label: "South Korea (ko-KR)", date: "YYYY.MM.DD", decimal: ".", delimiter: "," },
    { code: "zh-CN", label: "China (zh-CN)", date: "YYYY/MM/DD", decimal: ".", delimiter: "," },
    { code: "hi-IN", label: "India (hi-IN)", date: "DD-MM-YYYY", decimal: ".", delimiter: "," },
    { code: "ar-SA", label: "Saudi Arabia (ar-SA)", date: "DD/MM/YYYY", decimal: ".", delimiter: "," },
    { code: "tr-TR", label: "Turkey (tr-TR)", date: "DD.MM.YYYY", decimal: ",", delimiter: ";" },
    { code: "vi-VN", label: "Vietnam (vi-VN)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" },
    { code: "id-ID", label: "Indonesia (id-ID)", date: "DD/MM/YYYY", decimal: ",", delimiter: ";" }
  ];

  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }
  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function q(root, sel) {
    return root.querySelector(sel);
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

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
  }

  function parseCsv(text, delimiter = ",") {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    return lines.map((line) => {
      const out = [];
      let cur = "";
      let quote = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
          if (quote && line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else quote = !quote;
        } else if (ch === delimiter && !quote) {
          out.push(cur);
          cur = "";
        } else cur += ch;
      }
      out.push(cur);
      return out;
    });
  }
  function csvEscape(cell, delimiter = ",") {
    const str = String(cell ?? "");
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }
  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str)));
  }
  function b64UrlDecode(str) {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
    return b64ToUtf8(base64);
  }
  async function sha256(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function initDataTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.dataToolsInitialized === "true") return;
    grid.dataset.dataToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "data-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="data-card-header"><div class="data-card-icon">${icon}</div><h3 class="data-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary data-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary data-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
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
      const host = q(historyCard, "#dataHistory");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No data outputs yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" type="button" data-i="${i}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const it = items[Number(btn.dataset.i)];
        if (it) copyText(`${it.type}: ${it.text}`);
      }));
    }
    function bindCommon(card, id, getOutput) {
      card.querySelector("[data-copy]")?.addEventListener("click", () => copyText(getOutput()));
      card.querySelector("[data-export]")?.addEventListener("click", () => downloadText(`${id}.txt`, getOutput()));
    }

    // 1 JSON tool
    const jsonCard = makeCard("json", "📋", "JSON Formatter & Validator", `
      <div><label>JSON Input</label><textarea id="jIn" rows="7" placeholder='{"name":"Qwickton","country":"India"}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jFmt">Format</button><button class="btn btn-secondary" id="jMin">Minify</button><button class="btn btn-secondary" id="jVal">Validate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="jOut" class="result" rows="8" readonly></textarea><div id="jMeta" class="result">Status: ready</div>
    `);
    function setJMeta(msg) { q(jsonCard, "#jMeta").textContent = msg; }
    q(jsonCard, "#jFmt").addEventListener("click", () => {
      try {
        const out = JSON.stringify(JSON.parse(q(jsonCard, "#jIn").value), null, 2);
        q(jsonCard, "#jOut").value = out;
        setJMeta(`Valid JSON | ${out.length} chars`);
        pushHistory("JSON Format", `${out.length} chars`);
      } catch (e) {
        q(jsonCard, "#jOut").value = "";
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    q(jsonCard, "#jMin").addEventListener("click", () => {
      try {
        const out = JSON.stringify(JSON.parse(q(jsonCard, "#jIn").value));
        q(jsonCard, "#jOut").value = out;
        setJMeta(`Minified | ${out.length} chars`);
      } catch (e) {
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    q(jsonCard, "#jVal").addEventListener("click", () => {
      try {
        JSON.parse(q(jsonCard, "#jIn").value);
        setJMeta("Valid JSON");
      } catch (e) {
        setJMeta(`Invalid JSON: ${e.message}`);
      }
    });
    bindCommon(jsonCard, "json-tool", () => q(jsonCard, "#jOut").value);

    // 2 CSV <-> JSON
    const csvCard = makeCard("csv", "📊", "CSV <-> JSON Converter", `
      <div><label>Input CSV or JSON</label><textarea id="cIn" rows="7" placeholder="name,age&#10;Avi,28"></textarea></div>
      <div class="grid-2"><div><label>Mode</label><select id="cMode"><option value="csv2json">CSV to JSON</option><option value="json2csv">JSON to CSV</option></select></div><div><label>Delimiter</label><select id="cDel"><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="\t">Tab (TSV)</option><option value="|">Pipe (|)</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="cOut" class="result" rows="8" readonly></textarea>
    `);
    q(csvCard, "#cRun").addEventListener("click", () => {
      const mode = q(csvCard, "#cMode").value;
      const delRaw = q(csvCard, "#cDel").value;
      const delimiter = delRaw === "\\t" ? "\t" : delRaw;
      const input = q(csvCard, "#cIn").value.trim();
      if (!input) {
        q(csvCard, "#cOut").value = "Input required.";
        return;
      }
      try {
        if (mode === "csv2json") {
          const rows = parseCsv(input, delimiter);
          const header = rows[0] || [];
          const arr = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
          q(csvCard, "#cOut").value = JSON.stringify(arr, null, 2);
          pushHistory("CSV->JSON", `${arr.length} rows`);
        } else {
          const arr = JSON.parse(input);
          if (!Array.isArray(arr) || !arr.length) throw new Error("JSON must be non-empty array.");
          const keys = Array.from(arr.reduce((s, o) => { Object.keys(o || {}).forEach((k) => s.add(k)); return s; }, new Set()));
          const lines = [keys.map((k) => csvEscape(k, delimiter)).join(delimiter)];
          arr.forEach((obj) => lines.push(keys.map((k) => csvEscape(obj?.[k], delimiter)).join(delimiter)));
          q(csvCard, "#cOut").value = lines.join("\n");
          pushHistory("JSON->CSV", `${arr.length} rows`);
        }
      } catch (e) {
        q(csvCard, "#cOut").value = `Error: ${e.message}`;
      }
    });
    bindCommon(csvCard, "csv-json", () => q(csvCard, "#cOut").value);

    // 3 XML -> JSON
    const xmlCard = makeCard("xml", "📄", "XML to JSON Converter", `
      <div><label>XML Input</label><textarea id="xIn" rows="7" placeholder="<root><name>Avi</name></root>"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="xRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="xOut" class="result" rows="8" readonly></textarea>
    `);
    q(xmlCard, "#xRun").addEventListener("click", () => {
      const xml = q(xmlCard, "#xIn").value.trim();
      if (!xml) return;
      try {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("Invalid XML.");
        const root = doc.documentElement;
        const obj = {};
        Array.from(root.children).forEach((el) => { obj[el.nodeName] = el.textContent; });
        q(xmlCard, "#xOut").value = JSON.stringify({ [root.nodeName]: obj }, null, 2);
        pushHistory("XML->JSON", root.nodeName);
      } catch (e) {
        q(xmlCard, "#xOut").value = `Error: ${e.message}`;
      }
    });
    bindCommon(xmlCard, "xml-json", () => q(xmlCard, "#xOut").value);

    // 4 YAML->JSON (simple)
    const yamlCard = makeCard("yaml", "📝", "YAML to JSON Converter", `
      <div><label>YAML Input</label><textarea id="yIn" rows="7" placeholder="name: Avi&#10;country: India"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="yRun">Convert</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="yOut" class="result" rows="8" readonly></textarea>
    `);
    q(yamlCard, "#yRun").addEventListener("click", () => {
      const out = {};
      q(yamlCard, "#yIn").value.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
        if (!m) return;
        let v = m[2].trim();
        if (v === "true") v = true;
        else if (v === "false") v = false;
        else if (v !== "" && !Number.isNaN(Number(v))) v = Number(v);
        out[m[1]] = v;
      });
      q(yamlCard, "#yOut").value = JSON.stringify(out, null, 2);
      pushHistory("YAML->JSON", `${Object.keys(out).length} keys`);
    });
    bindCommon(yamlCard, "yaml-json", () => q(yamlCard, "#yOut").value);

    // 5 SQL formatter
    const sqlCard = makeCard("sql", "🗄️", "SQL Formatter", `
      <div><label>SQL Input</label><textarea id="sIn" rows="7" placeholder="select id,name from users where active=1 order by name"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="sRun">Format</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="sOut" class="result" rows="8" readonly></textarea>
    `);
    q(sqlCard, "#sRun").addEventListener("click", () => {
      let sql = q(sqlCard, "#sIn").value.replace(/\s+/g, " ").trim();
      ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LEFT JOIN", "RIGHT JOIN", "JOIN", "HAVING", "LIMIT"].forEach((k) => {
        sql = sql.replace(new RegExp(`\\b${k}\\b`, "gi"), `\n${k}\n  `);
      });
      q(sqlCard, "#sOut").value = sql.trim();
      pushHistory("SQL Format", "formatted");
    });
    bindCommon(sqlCard, "sql", () => q(sqlCard, "#sOut").value);

    // 6 Base64
    const b64Card = makeCard("base64", "📦", "Base64 Encoder / Decoder", `
      <div><label>Text Input</label><textarea id="bIn" rows="6" placeholder="Enter text"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="bEnc">Encode</button><button class="btn btn-secondary" id="bDec">Decode</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="bOut" class="result" rows="7" readonly></textarea>
    `);
    q(b64Card, "#bEnc").addEventListener("click", () => {
      q(b64Card, "#bOut").value = utf8ToB64(q(b64Card, "#bIn").value);
      pushHistory("Base64 Encode", "done");
    });
    q(b64Card, "#bDec").addEventListener("click", () => {
      try {
        q(b64Card, "#bOut").value = b64ToUtf8(q(b64Card, "#bIn").value.trim());
        pushHistory("Base64 Decode", "done");
      } catch {
        q(b64Card, "#bOut").value = "Invalid Base64 input.";
      }
    });
    bindCommon(b64Card, "base64", () => q(b64Card, "#bOut").value);

    // 7 JWT decoder
    const jwtCard = makeCard("jwt", "🔑", "JWT Decoder", `
      <div><label>JWT Token</label><textarea id="jwIn" rows="5" placeholder="eyJ..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jwRun">Decode</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="jwOut" class="result" rows="8" readonly></textarea>
    `);
    q(jwtCard, "#jwRun").addEventListener("click", () => {
      const token = q(jwtCard, "#jwIn").value.trim();
      const parts = token.split(".");
      if (parts.length < 2) {
        q(jwtCard, "#jwOut").value = "Invalid JWT format.";
        return;
      }
      try {
        const header = JSON.parse(b64UrlDecode(parts[0]));
        const payload = JSON.parse(b64UrlDecode(parts[1]));
        q(jwtCard, "#jwOut").value = `HEADER\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(payload, null, 2)}\n\nSIGNATURE: ${parts[2] ? "present" : "missing"}`;
        pushHistory("JWT Decode", "decoded");
      } catch {
        q(jwtCard, "#jwOut").value = "Could not decode JWT token.";
      }
    });
    bindCommon(jwtCard, "jwt", () => q(jwtCard, "#jwOut").value);

    // 8 Hash
    const hashCard = makeCard("hash", "🔒", "SHA-256 Hash Tool", `
      <div><label>Text Input</label><textarea id="hIn" rows="5" placeholder="Enter text"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="hRun">Generate Hash</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="hOut" class="result" rows="6" readonly></textarea>
    `);
    q(hashCard, "#hRun").addEventListener("click", async () => {
      const input = q(hashCard, "#hIn").value;
      if (!input) return;
      const out = await sha256(input);
      q(hashCard, "#hOut").value = out;
      pushHistory("SHA-256", out.slice(0, 16));
    });
    bindCommon(hashCard, "hash", () => q(hashCard, "#hOut").value);

    // 9 Text diff
    const diffCard = makeCard("diff", "≠", "Text Diff Checker", `
      <div class="grid-2"><div><label>Text A</label><textarea id="dA" rows="6"></textarea></div><div><label>Text B</label><textarea id="dB" rows="6"></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="dRun">Compare</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="dOut" class="result" rows="8" readonly></textarea>
    `);
    q(diffCard, "#dRun").addEventListener("click", () => {
      const a = q(diffCard, "#dA").value.split(/\r?\n/);
      const b = q(diffCard, "#dB").value.split(/\r?\n/);
      const max = Math.max(a.length, b.length);
      const lines = [];
      for (let i = 0; i < max; i += 1) {
        const la = a[i] ?? "";
        const lb = b[i] ?? "";
        if (la !== lb) lines.push(`Line ${i + 1}\nA: ${la}\nB: ${lb}\n`);
      }
      q(diffCard, "#dOut").value = lines.length ? lines.join("\n") : "Texts are identical.";
      pushHistory("Text Diff", lines.length ? `${lines.length} changes` : "no change");
    });
    bindCommon(diffCard, "text-diff", () => q(diffCard, "#dOut").value);

    // 10 JSON inspector
    const inspCard = makeCard("inspect", "🔍", "JSON Inspector", `
      <div><label>JSON Input</label><textarea id="iIn" rows="7" placeholder='{"users":[{"name":"Avi"}]}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="iRun">Inspect</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="iOut" class="result" rows="8" readonly></textarea>
    `);
    q(inspCard, "#iRun").addEventListener("click", () => {
      try {
        const parsed = JSON.parse(q(inspCard, "#iIn").value);
        const isArr = Array.isArray(parsed);
        const keys = isArr ? Array.from(new Set(parsed.flatMap((x) => (x && typeof x === "object" ? Object.keys(x) : [])))) : Object.keys(parsed || {});
        q(inspCard, "#iOut").value = [
          "JSON Inspection Report",
          "========================================",
          `Top Type: ${isArr ? "Array" : typeof parsed}`,
          `Top Size: ${isArr ? parsed.length : keys.length}`,
          `Unique Keys: ${keys.length}`,
          `Key List: ${keys.join(", ") || "-"}`,
          `Serialized Size: ${JSON.stringify(parsed).length} chars`
        ].join("\n");
        pushHistory("JSON Inspect", `${keys.length} keys`);
      } catch (e) {
        q(inspCard, "#iOut").value = `Invalid JSON: ${e.message}`;
      }
    });
    bindCommon(inspCard, "json-inspector", () => q(inspCard, "#iOut").value);

    // 11 CSV dedupe
    const dedupeCard = makeCard("dedupe", "🗑️", "CSV Deduplicate Rows", `
      <div><label>CSV Input</label><textarea id="ddIn" rows="7" placeholder="name,city&#10;Avi,Mumbai&#10;Avi,Mumbai"></textarea></div>
      <div class="grid-2"><div><label>Delimiter</label><select id="ddDel"><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select></div><div><label><input id="ddHead" type="checkbox" checked> First row is header</label></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="ddRun">Deduplicate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="ddOut" class="result" rows="8" readonly></textarea>
    `);
    q(dedupeCard, "#ddRun").addEventListener("click", () => {
      const delimiter = q(dedupeCard, "#ddDel").value === "\\t" ? "\t" : q(dedupeCard, "#ddDel").value;
      const rows = parseCsv(q(dedupeCard, "#ddIn").value, delimiter);
      if (!rows.length) return;
      const hasHeader = q(dedupeCard, "#ddHead").checked;
      const header = hasHeader ? rows[0] : null;
      const body = hasHeader ? rows.slice(1) : rows;
      const set = new Set();
      const uniq = body.filter((r) => {
        const key = r.join("\u001f");
        if (set.has(key)) return false;
        set.add(key);
        return true;
      });
      const outputRows = hasHeader ? [header, ...uniq] : uniq;
      q(dedupeCard, "#ddOut").value = outputRows.map((r) => r.map((c) => csvEscape(c, delimiter)).join(delimiter)).join("\n");
      pushHistory("CSV Dedupe", `${body.length} -> ${uniq.length}`);
    });
    bindCommon(dedupeCard, "csv-dedupe", () => q(dedupeCard, "#ddOut").value);

    // 12 Regional format helper (global countries support)
    const regCard = makeCard("regional", "🌍", "Regional Format Helper", `
      <p class="dt-hint">Configure data output style for countries/locales: date, decimal symbol, and CSV delimiter.</p>
      <div class="grid-2"><div><label>Country/Locale</label><select id="rLoc">${LOCALE_PRESETS.map((l) => `<option value="${l.code}">${l.label}</option>`).join("")}</select></div><div><label>Sample Number</label><input id="rNum" type="number" value="1234567.89" step="0.01"></div><div><label>Sample Date (YYYY-MM-DD)</label><input id="rDate" type="date"></div><div><label>Sample CSV Row</label><input id="rCsv" type="text" value="name,amount,date"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="rRun">Generate Regional Output</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="rOut" class="result" rows="8" readonly></textarea>
    `);
    const today = new Date().toISOString().slice(0, 10);
    q(regCard, "#rDate").value = today;
    q(regCard, "#rRun").addEventListener("click", () => {
      const code = q(regCard, "#rLoc").value;
      const preset = LOCALE_PRESETS.find((x) => x.code === code) || LOCALE_PRESETS[0];
      const num = safeNum(q(regCard, "#rNum").value, 0);
      const dateValue = q(regCard, "#rDate").value ? new Date(q(regCard, "#rDate").value) : new Date();
      const csvRow = q(regCard, "#rCsv").value;
      const numOut = new Intl.NumberFormat(code).format(num);
      const dateOut = new Intl.DateTimeFormat(code).format(dateValue);
      const csvOut = csvRow.split(",").join(preset.delimiter);
      q(regCard, "#rOut").value = [
        `Locale: ${preset.label}`,
        `Date Style: ${preset.date}`,
        `Decimal Symbol: ${preset.decimal}`,
        `CSV Delimiter: ${preset.delimiter === "\t" ? "TAB" : preset.delimiter}`,
        `Formatted Number: ${numOut}`,
        `Formatted Date: ${dateOut}`,
        `CSV Example (${preset.label}): ${csvOut}`
      ].join("\n");
      pushHistory("Regional Format", preset.code);
    });
    bindCommon(regCard, "regional-format", () => q(regCard, "#rOut").value);
    q(regCard, "#rRun").click();

    // 13 History
    historyCard = makeCard("history", "📜", "Recent Data Outputs", `
      <div id="dataHistory" class="chip-list"><span class="empty-hint">No data outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="dhClear">Clear</button><button class="btn btn-secondary" id="dhExport">Export TXT</button></div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    q(historyCard, "#dhClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    q(historyCard, "#dhExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`data-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // Focus modal
    const overlay = document.createElement("div");
    overlay.className = "data-focus-overlay";
    const host = document.createElement("div");
    host.className = "data-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let activeCard = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false" || activeCard === card) return;
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
      document.body.classList.add("data-modal-open");
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
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("data-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".data-card"))));
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

  window.QwicktonCategoryInits["data-tools"] = initDataTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDataTools();
  });
})();
(function() {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(name, text) { const a = document.createElement("a"); a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(String(text || "")); a.download = name; a.click(); }

  function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    return lines.map(line => {
      const result = []; let inQuote = false; let current = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQuote = !inQuote;
        else if (ch === ',' && !inQuote) { result.push(current); current = ''; }
        else current += ch;
      }
      result.push(current);
      return result.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
    });
  }
  function csvEscape(cell) {
    if (cell === undefined || cell === null) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  }

  function simpleHash(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return Math.abs(hash).toString(16); }
  function utf8ToBase64(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch(e) { return "Error encoding"; } }
  function base64ToUtf8(str) { try { return decodeURIComponent(escape(atob(str))); } catch(e) { return "Error decoding"; } }
  
  function b64UrlDecode(str) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return base64ToUtf8(base64);
  }
  function decodeJwt(token) {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const header = JSON.parse(b64UrlDecode(parts[0]));
      const payload = JSON.parse(b64UrlDecode(parts[1]));
      return { header, payload, signature: parts[2] || null };
    } catch(e) { return null; }
  }

  function xmlToJson(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) return { error: "Invalid XML" };
    function parseNode(node) {
      if (node.nodeType === 3) return node.textContent.trim();
      if (node.nodeType !== 1) return null;
      const obj = {};
      if (node.attributes.length) {
        obj._attributes = {};
        for (let i = 0; i < node.attributes.length; i++) obj._attributes[node.attributes[i].name] = node.attributes[i].value;
      }
      const children = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = parseNode(node.childNodes[i]);
        if (child !== null && child !== '') children.push(child);
      }
      if (children.length === 1 && typeof children[0] === 'string') obj[node.nodeName] = children[0];
      else if (children.length > 0) obj[node.nodeName] = children;
      else obj[node.nodeName] = {};
      return obj;
    }
    const result = {};
    for (let i = 0; i < xmlDoc.documentElement.childNodes.length; i++) {
      const parsed = parseNode(xmlDoc.documentElement.childNodes[i]);
      if (parsed) Object.assign(result, parsed);
    }
    return result;
  }

  function yamlToJson(yaml) {
    const lines = yaml.split('\n');
    const result = {};
    let currentKey = '';
    for (const line of lines) {
      if (line.match(/^\s*[a-zA-Z0-9_-]+:/)) {
        const match = line.match(/^\s*([a-zA-Z0-9_-]+):\s*(.*)/);
        if (match) {
          currentKey = match[1];
          let value = match[2].trim();
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (!isNaN(value) && value !== '') value = Number(value);
          result[currentKey] = value;
        }
      }
    }
    return result;
  }

  function formatSql(sql) {
    let formatted = sql.replace(/\s+/g, ' ').trim();
    formatted = formatted.replace(/SELECT/gi, '\nSELECT\n  ');
    formatted = formatted.replace(/FROM/gi, '\nFROM\n  ');
    formatted = formatted.replace(/WHERE/gi, '\nWHERE\n  ');
    formatted = formatted.replace(/ORDER BY/gi, '\nORDER BY\n  ');
    formatted = formatted.replace(/GROUP BY/gi, '\nGROUP BY\n  ');
    formatted = formatted.replace(/JOIN/gi, '\nJOIN\n  ');
    formatted = formatted.replace(/ON/gi, '\n  ON ');
    return formatted;
  }

  function textDiff(a, b) {
    if (a === b) return "Texts are identical";
    const aLines = a.split('\n'), bLines = b.split('\n');
    let diff = [];
    const maxLen = Math.max(aLines.length, bLines.length);
    for (let i = 0; i < maxLen; i++) {
      const aLine = aLines[i] || '(missing)';
      const bLine = bLines[i] || '(missing)';
      if (aLine !== bLine) diff.push(`Line ${i+1}: "${aLine}" → "${bLine}"`);
    }
    return diff.length ? diff.join('\n') : "Texts are identical";
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-data-history";
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20))); }
  function pushHistory(type, text, renderFn) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CARD CREATION
  // ============================================
  function initDataTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.dataToolsInitialized === "true") return;
    grid.dataset.dataToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "data-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `<div class="data-card-header"><div class="data-card-icon">${icon}</div><h3 class="data-card-title">${escapeHtml(title)}</h3>${options.focusable !== false ? `<button class="btn btn-secondary data-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary data-focus-inline-close" data-focus-close>Close</button>` : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#dataHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No data outputs yet.</span>'; return; }
      container.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`).join("");
      container.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => copyText(readHistory()[Number(btn.dataset.idx)]?.text || "")));
    }

    function wireExport(card, prefix, title, getText) {
      card.querySelector(`[data-export='${prefix}-txt']`)?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    }

    // ============================================
    // 1. JSON FORMATTER
    // ============================================
    const jsonCard = makeCard("json", "📋", "JSON Formatter Pro", `
      <div><label>Input JSON</label><textarea id="jsonInput" rows="6" placeholder='{"name":"Qwickton","tools":["json","csv"]}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jsonFormatBtn">Format</button><button class="btn btn-secondary" id="jsonMinifyBtn">Minify</button><button class="btn btn-secondary" id="jsonValidateBtn">Validate</button><button class="btn btn-secondary" id="jsonCopyBtn">Copy</button><button class="btn btn-secondary" data-export="json-txt">TXT</button></div>
      <textarea id="jsonRes" class="result" rows="8" placeholder="Formatted JSON will appear here..."></textarea>
      <div id="jsonMeta" class="result" style="margin-top:0.5rem">Status: waiting for input</div>
    `);
    const jsonInput = jsonCard.querySelector("#jsonInput"), jsonRes = jsonCard.querySelector("#jsonRes"), jsonMeta = jsonCard.querySelector("#jsonMeta");
    jsonCard.querySelector("#jsonFormatBtn").onclick = () => { try { const parsed = JSON.parse(jsonInput.value); const out = JSON.stringify(parsed, null, 2); jsonRes.value = out; jsonMeta.textContent = `✅ Valid JSON | Formatted | Size: ${out.length} chars`; pushHistory("JSON Format", `Formatted ${out.length} chars`, renderHistory); } catch(e) { jsonRes.value = ""; jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonMinifyBtn").onclick = () => { try { const out = JSON.stringify(JSON.parse(jsonInput.value)); jsonRes.value = out; jsonMeta.textContent = `✅ Minified | Size: ${out.length} chars`; pushHistory("JSON Minify", `Minified ${out.length} chars`, renderHistory); } catch(e) { jsonRes.value = ""; jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonValidateBtn").onclick = () => { try { JSON.parse(jsonInput.value); jsonMeta.textContent = "✅ Valid JSON"; } catch(e) { jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonCopyBtn").onclick = () => copyText(jsonRes.value);
    wireExport(jsonCard, "json", "JSON", () => jsonRes.value);

    // ============================================
    // 2. CSV TO JSON
    // ============================================
    const csv2jsonCard = makeCard("csv", "📊", "CSV to JSON Pro", `
      <div><label>Input CSV</label><textarea id="csvInput" rows="6" placeholder="name,age,city&#10;John,25,New York&#10;Jane,30,London"></textarea></div>
      <div class="inline-row"><label><input type="checkbox" id="csvHeader" checked> First row is header</label></div>
      <div class="inline-row"><button class="btn btn-primary" id="csvBtn">Convert to JSON</button><button class="btn btn-secondary" id="csvCopyBtn">Copy</button><button class="btn btn-secondary" data-export="csv-txt">TXT</button></div>
      <textarea id="csvRes" class="result" rows="8" placeholder="Converted JSON will appear here..."></textarea>
      <div id="csvMeta" class="result">Rows: 0 | Columns: 0</div>
    `);
    const csvInput = csv2jsonCard.querySelector("#csvInput"), csvRes = csv2jsonCard.querySelector("#csvRes"), csvMeta = csv2jsonCard.querySelector("#csvMeta");
    csv2jsonCard.querySelector("#csvBtn").onclick = () => {
      const rows = parseCsv(csvInput.value);
      if (!rows.length) { csvRes.value = ""; csvMeta.textContent = "Rows: 0 | Columns: 0"; return; }
      const hasHeader = csv2jsonCard.querySelector("#csvHeader").checked;
      const headers = hasHeader ? rows[0] : rows[0].map((_, i) => `col_${i+1}`);
      const dataRows = hasHeader ? rows.slice(1) : rows;
      const out = dataRows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
      const pretty = JSON.stringify(out, null, 2);
      csvRes.value = pretty;
      csvMeta.textContent = `Rows: ${out.length} | Columns: ${headers.length}`;
      pushHistory("CSV→JSON", `${out.length} rows, ${headers.length} cols`, renderHistory);
    };
    csv2jsonCard.querySelector("#csvCopyBtn").onclick = () => copyText(csvRes.value);
    wireExport(csv2jsonCard, "csv", "CSV2JSON", () => csvRes.value);

    // ============================================
    // 3. JSON TO CSV
    // ============================================
    const json2csvCard = makeCard("json2csv", "📄", "JSON to CSV Pro", `
      <div><label>Input JSON Array</label><textarea id="j2cInput" rows="6" placeholder='[{"name":"John","age":25},{"name":"Jane","age":30}]'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="j2cBtn">Convert to CSV</button><button class="btn btn-secondary" id="j2cCopyBtn">Copy</button><button class="btn btn-secondary" data-export="json2csv-txt">TXT</button></div>
      <textarea id="j2cRes" class="result" rows="8" placeholder="Converted CSV will appear here..."></textarea>
      <div id="j2cMeta" class="result">Rows: 0 | Columns: 0</div>
    `);
    const j2cInput = json2csvCard.querySelector("#j2cInput"), j2cRes = json2csvCard.querySelector("#j2cRes"), j2cMeta = json2csvCard.querySelector("#j2cMeta");
    json2csvCard.querySelector("#j2cBtn").onclick = () => {
      try {
        const arr = JSON.parse(j2cInput.value);
        if (!Array.isArray(arr) || !arr.length) { j2cRes.value = "Error: Provide a non-empty JSON array."; return; }
        const keySet = new Set(); arr.forEach(obj => Object.keys(obj || {}).forEach(k => keySet.add(k)));
        const keys = Array.from(keySet);
        const lines = [keys.map(k => csvEscape(k)).join(",")];
        arr.forEach(obj => lines.push(keys.map(k => csvEscape(obj?.[k])).join(",")));
        const out = lines.join("\n");
        j2cRes.value = out;
        j2cMeta.textContent = `Rows: ${arr.length} | Columns: ${keys.length}`;
        pushHistory("JSON→CSV", `${arr.length} rows, ${keys.length} cols`, renderHistory);
      } catch(e) { j2cRes.value = `Error: ${e.message}`; }
    };
    json2csvCard.querySelector("#j2cCopyBtn").onclick = () => copyText(j2cRes.value);
    wireExport(json2csvCard, "json2csv", "JSON2CSV", () => j2cRes.value);

    // ============================================
    // 4. XML TO JSON (NEW)
    // ============================================
    const xmlCard = makeCard("xml", "📄", "XML to JSON Converter", `
      <div><label>Input XML</label><textarea id="xmlInput" rows="6" placeholder="&lt;root&gt;&lt;name&gt;John&lt;/name&gt;&lt;age&gt;25&lt;/age&gt;&lt;/root&gt;"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="xmlBtn">Convert to JSON</button><button class="btn btn-secondary" id="xmlCopyBtn">Copy</button><button class="btn btn-secondary" data-export="xml-txt">TXT</button></div>
      <textarea id="xmlRes" class="result" rows="8" placeholder="Converted JSON will appear here..."></textarea>
      <div id="xmlMeta" class="result">Status: waiting for input</div>
    `);
    const xmlInput = xmlCard.querySelector("#xmlInput"), xmlRes = xmlCard.querySelector("#xmlRes"), xmlMeta = xmlCard.querySelector("#xmlMeta");
    xmlCard.querySelector("#xmlBtn").onclick = () => {
      try {
        const result = xmlToJson(xmlInput.value);
        if (result.error) throw new Error(result.error);
        const out = JSON.stringify(result, null, 2);
        xmlRes.value = out;
        xmlMeta.textContent = "✅ Converted XML to JSON";
        pushHistory("XML→JSON", `Converted successfully`, renderHistory);
      } catch(e) { xmlRes.value = ""; xmlMeta.textContent = `❌ Error: ${e.message}`; }
    };
    xmlCard.querySelector("#xmlCopyBtn").onclick = () => copyText(xmlRes.value);
    wireExport(xmlCard, "xml", "XML2JSON", () => xmlRes.value);

    // ============================================
    // 5. YAML TO JSON (NEW)
    // ============================================
    const yamlCard = makeCard("yaml", "📝", "YAML to JSON Converter", `
      <div><label>Input YAML</label><textarea id="yamlInput" rows="6" placeholder="name: John&#10;age: 25&#10;city: New York"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="yamlBtn">Convert to JSON</button><button class="btn btn-secondary" id="yamlCopyBtn">Copy</button><button class="btn btn-secondary" data-export="yaml-txt">TXT</button></div>
      <textarea id="yamlRes" class="result" rows="8" placeholder="Converted JSON will appear here..."></textarea>
      <div id="yamlMeta" class="result">Status: waiting for input</div>
    `);
    const yamlInput = yamlCard.querySelector("#yamlInput"), yamlRes = yamlCard.querySelector("#yamlRes"), yamlMeta = yamlCard.querySelector("#yamlMeta");
    yamlCard.querySelector("#yamlBtn").onclick = () => {
      try {
        const result = yamlToJson(yamlInput.value);
        const out = JSON.stringify(result, null, 2);
        yamlRes.value = out;
        yamlMeta.textContent = "✅ Converted YAML to JSON";
        pushHistory("YAML→JSON", `Converted successfully`, renderHistory);
      } catch(e) { yamlRes.value = ""; yamlMeta.textContent = `❌ Error: ${e.message}`; }
    };
    yamlCard.querySelector("#yamlCopyBtn").onclick = () => copyText(yamlRes.value);
    wireExport(yamlCard, "yaml", "YAML2JSON", () => yamlRes.value);

    // ============================================
    // 6. SQL FORMATTER (NEW)
    // ============================================
    const sqlCard = makeCard("sql", "🗄️", "SQL Formatter", `
      <div><label>Input SQL</label><textarea id="sqlInput" rows="6" placeholder="SELECT id,name FROM users WHERE age>18 ORDER BY name"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="sqlBtn">Format SQL</button><button class="btn btn-secondary" id="sqlCopyBtn">Copy</button><button class="btn btn-secondary" data-export="sql-txt">TXT</button></div>
      <textarea id="sqlRes" class="result" rows="8" placeholder="Formatted SQL will appear here..."></textarea>
      <div id="sqlMeta" class="result">Status: ready</div>
    `);
    const sqlInput = sqlCard.querySelector("#sqlInput"), sqlRes = sqlCard.querySelector("#sqlRes"), sqlMeta = sqlCard.querySelector("#sqlMeta");
    sqlCard.querySelector("#sqlBtn").onclick = () => {
      try {
        const formatted = formatSql(sqlInput.value);
        sqlRes.value = formatted;
        sqlMeta.textContent = "✅ SQL formatted successfully";
        pushHistory("SQL Formatter", `Formatted SQL`, renderHistory);
      } catch(e) { sqlRes.value = ""; sqlMeta.textContent = `❌ Error: ${e.message}`; }
    };
    sqlCard.querySelector("#sqlCopyBtn").onclick = () => copyText(sqlRes.value);
    wireExport(sqlCard, "sql", "SQL", () => sqlRes.value);

    // ============================================
    // 7. BASE64 ENCODER/DECODER (NEW)
    // ============================================
    const base64Card = makeCard("base64", "📦", "Base64 Encoder/Decoder", `
      <div><label>Input Text</label><textarea id="b64Input" rows="4" placeholder="Enter text to encode/decode..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="b64EncodeBtn">Encode</button><button class="btn btn-secondary" id="b64DecodeBtn">Decode</button><button class="btn btn-secondary" id="b64CopyBtn">Copy</button><button class="btn btn-secondary" data-export="base64-txt">TXT</button></div>
      <textarea id="b64Res" class="result" rows="6" placeholder="Result will appear here..."></textarea>
    `);
    const b64Input = base64Card.querySelector("#b64Input"), b64Res = base64Card.querySelector("#b64Res");
    base64Card.querySelector("#b64EncodeBtn").onclick = () => { const encoded = utf8ToBase64(b64Input.value); b64Res.value = encoded; pushHistory("Base64 Encode", encoded.slice(0, 50), renderHistory); };
    base64Card.querySelector("#b64DecodeBtn").onclick = () => { const decoded = base64ToUtf8(b64Input.value); b64Res.value = decoded; pushHistory("Base64 Decode", decoded.slice(0, 50), renderHistory); };
    base64Card.querySelector("#b64CopyBtn").onclick = () => copyText(b64Res.value);
    wireExport(base64Card, "base64", "Base64", () => b64Res.value);

    // ============================================
    // 8. JWT DECODER (NEW)
    // ============================================
    const jwtCard = makeCard("jwt", "🔑", "JWT Decoder", `
      <div><label>JWT Token</label><textarea id="jwtInput" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jwtBtn">Decode JWT</button><button class="btn btn-secondary" id="jwtCopyBtn">Copy</button><button class="btn btn-secondary" data-export="jwt-txt">TXT</button></div>
      <textarea id="jwtRes" class="result" rows="8" placeholder="Decoded JWT will appear here..."></textarea>
      <div id="jwtMeta" class="result">Status: waiting for input</div>
    `);
    const jwtInput = jwtCard.querySelector("#jwtInput"), jwtRes = jwtCard.querySelector("#jwtRes"), jwtMeta = jwtCard.querySelector("#jwtMeta");
    jwtCard.querySelector("#jwtBtn").onclick = () => {
      const decoded = decodeJwt(jwtInput.value);
      if (!decoded) { jwtRes.value = "Invalid JWT format"; jwtMeta.textContent = "❌ Invalid JWT"; return; }
      const out = `HEADER:\n${JSON.stringify(decoded.header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(decoded.payload, null, 2)}\n\nSIGNATURE: ${decoded.signature ? "Present" : "Missing"}`;
      jwtRes.value = out;
      jwtMeta.textContent = "✅ JWT decoded successfully";
      pushHistory("JWT Decode", `Decoded JWT`, renderHistory);
    };
    jwtCard.querySelector("#jwtCopyBtn").onclick = () => copyText(jwtRes.value);
    wireExport(jwtCard, "jwt", "JWT", () => jwtRes.value);

    // ============================================
    // 9. HASH GENERATOR (NEW)
    // ============================================
    const hashCard = makeCard("hash", "🔒", "Hash Generator", `
      <div><label>Input Text</label><textarea id="hashInput" rows="3" placeholder="Enter text to hash..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="hashBtn">Generate Hash</button><button class="btn btn-secondary" id="hashCopyBtn">Copy</button><button class="btn btn-secondary" data-export="hash-txt">TXT</button></div>
      <textarea id="hashRes" class="result" rows="4" placeholder="Hash will appear here..."></textarea>
    `);
    const hashInput = hashCard.querySelector("#hashInput"), hashRes = hashCard.querySelector("#hashRes");
    hashCard.querySelector("#hashBtn").onclick = () => {
      const hash = simpleHash(hashInput.value);
      hashRes.value = `Input: ${hashInput.value}\nHash: ${hash}\nLength: ${hash.length} chars`;
      pushHistory("Hash", hash, renderHistory);
    };
    hashCard.querySelector("#hashCopyBtn").onclick = () => copyText(hashRes.value);
    wireExport(hashCard, "hash", "Hash", () => hashRes.value);

    // ============================================
    // 10. TEXT DIFF (NEW)
    // ============================================
    const diffCard = makeCard("diff", "≠", "Text Diff Tool", `
      <div class="grid-2"><div><label>Original Text</label><textarea id="diffA" rows="5" placeholder="Original text..."></textarea></div>
      <div><label>Modified Text</label><textarea id="diffB" rows="5" placeholder="Modified text..."></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="diffBtn">Compare Texts</button><button class="btn btn-secondary" id="diffCopyBtn">Copy</button><button class="btn btn-secondary" data-export="diff-txt">TXT</button></div>
      <textarea id="diffRes" class="result" rows="6" placeholder="Differences will appear here..."></textarea>
    `);
    const diffA = diffCard.querySelector("#diffA"), diffB = diffCard.querySelector("#diffB"), diffRes = diffCard.querySelector("#diffRes");
    diffCard.querySelector("#diffBtn").onclick = () => {
      const result = textDiff(diffA.value, diffB.value);
      diffRes.value = result;
      pushHistory("Text Diff", `Compared texts`, renderHistory);
    };
    diffCard.querySelector("#diffCopyBtn").onclick = () => copyText(diffRes.value);
    wireExport(diffCard, "diff", "Diff", () => diffRes.value);

    // ============================================
    // 11. JSON INSPECTOR
    // ============================================
    const inspectCard = makeCard("inspect", "🔍", "JSON Inspector", `
      <div><label>Input JSON</label><textarea id="inspectInput" rows="6" placeholder='{"users":[{"name":"John"},{"name":"Jane"}],"total":2}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="inspectBtn">Inspect JSON</button><button class="btn btn-secondary" id="inspectCopyBtn">Copy</button><button class="btn btn-secondary" data-export="inspect-txt">TXT</button></div>
      <textarea id="inspectRes" class="result" rows="8" placeholder="Inspection report will appear here..."></textarea>
    `);
    const inspectInput = inspectCard.querySelector("#inspectInput"), inspectRes = inspectCard.querySelector("#inspectRes");
    inspectCard.querySelector("#inspectBtn").onclick = () => {
      try {
        const parsed = JSON.parse(inspectInput.value);
        const isArr = Array.isArray(parsed);
        const topType = isArr ? "Array" : typeof parsed === "object" && parsed !== null ? "Object" : typeof parsed;
        const topSize = isArr ? parsed.length : parsed && typeof parsed === "object" ? Object.keys(parsed).length : 1;
        const keys = isArr ? Array.from(new Set(parsed.flatMap(item => item && typeof item === "object" ? Object.keys(item) : []))) : parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
        const report = [`📊 JSON INSPECTION REPORT`, `========================================`, `📌 Type: ${topType}`, `📏 Size: ${topSize}`, `🔑 Unique Keys: ${keys.length}`, `🏷️ Keys: ${keys.slice(0, 20).join(", ") || "-"}`].join("\n");
        inspectRes.value = report;
        pushHistory("JSON Inspect", `${topType} with ${keys.length} keys`, renderHistory);
      } catch(e) { inspectRes.value = `❌ Invalid JSON: ${e.message}`; }
    };
    inspectCard.querySelector("#inspectCopyBtn").onclick = () => copyText(inspectRes.value);
    wireExport(inspectCard, "inspect", "Inspect", () => inspectRes.value);

    // ============================================
    // 12. CSV DEDUPLICATE
    // ============================================
    const dedupeCard = makeCard("dedupe", "🗑️", "CSV Deduplicate Rows", `
      <div><label>Input CSV</label><textarea id="dedupeInput" rows="6" placeholder="name,city&#10;John,NYC&#10;John,NYC&#10;Jane,LA"></textarea></div>
      <div class="inline-row"><label><input type="checkbox" id="dedupeHeader" checked> First row is header</label></div>
      <div class="inline-row"><button class="btn btn-primary" id="dedupeBtn">Remove Duplicates</button><button class="btn btn-secondary" id="dedupeCopyBtn">Copy</button><button class="btn btn-secondary" data-export="dedupe-txt">TXT</button></div>
      <textarea id="dedupeOutput" class="result" rows="8" placeholder="Deduplicated CSV will appear here..."></textarea>
    `);
    const dedupeInput = dedupeCard.querySelector("#dedupeInput"), dedupeOutput = dedupeCard.querySelector("#dedupeOutput");
    dedupeCard.querySelector("#dedupeBtn").onclick = () => {
      const rows = parseCsv(dedupeInput.value);
      if (!rows.length) { dedupeOutput.value = ""; return; }
      const hasHeader = dedupeCard.querySelector("#dedupeHeader").checked;
      const header = hasHeader ? rows[0] : null;
      const dataRows = hasHeader ? rows.slice(1) : rows;
      const seen = new Set();
      const unique = dataRows.filter(row => { const key = row.join("\u001f"); if (seen.has(key)) return false; seen.add(key); return true; });
      const lines = (header ? [header, ...unique] : unique).map(row => row.map(cell => csvEscape(cell)).join(","));
      const output = lines.join("\n");
      dedupeOutput.value = output;
      pushHistory("CSV Dedupe", `${dataRows.length} → ${unique.length} rows`, renderHistory);
    };
    dedupeCard.querySelector("#dedupeCopyBtn").onclick = () => copyText(dedupeOutput.value);
    wireExport(dedupeCard, "dedupe", "Dedupe", () => dedupeOutput.value);

    // ============================================
    // 13. HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Data Outputs", `
      <div id="dataHistory" class="chip-list"><span class="empty-hint">No data outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clearDataHistory">Clear History</button><button class="btn btn-secondary" id="exportDataHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearDataHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportDataHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`data-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "data-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "data-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("data-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("data-modal-open"); }
    document.querySelectorAll(".data-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".data-card"))));
    document.querySelectorAll(".data-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    document.getElementById("year").textContent = new Date().getFullYear();
  }
window.QwicktonCategoryInits["data-tools"] = initDataTools;
document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDataTools(null); });
})();
*/