(function() {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITIES
  // ============================================
  function safeNum(v, d = 0) { let n = Number(v); return isFinite(n) ? n : d; }
  function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function secureRandomInt(maxExclusive) {
    const max = Math.max(1, Math.floor(maxExclusive));
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function localeOptions() {
    const presets = [
      { code: "en-US", label: "United States" },
      { code: "en-IN", label: "India" },
      { code: "en-GB", label: "United Kingdom" },
      { code: "de-DE", label: "Germany" },
      { code: "fr-FR", label: "France" },
      { code: "ja-JP", label: "Japan" },
      { code: "ar-SA", label: "Saudi Arabia" }
    ];
    return presets.map((item) => `<option value="${item.code}">${item.label} (${item.code})</option>`).join("");
  }
  function timezoneOptions() {
    return [
      "UTC",
      "Asia/Kolkata",
      "Europe/London",
      "America/New_York",
      "Asia/Tokyo",
      "Australia/Sydney"
    ].map((tz) => `<option value="${tz}">${tz}</option>`).join("");
  }

  function utf8ToBase64(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch(e) { return "Error encoding"; } }
  function base64ToUtf8(str) { try { return decodeURIComponent(escape(atob(str))); } catch(e) { return "Error decoding"; } }
  function b64UrlDecode(segment) { const normalized = segment.replace(/-/g, "+").replace(/_/g, "/"); const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4); return base64ToUtf8(normalized + padding); }
  function simpleHash(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return Math.abs(hash).toString(16); }
  function hexToRgb(hex) { const h = hex.replace("#", ""); const num = parseInt(h, 16); return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }; }
  function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }

  function minifyHtml(html) { return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim(); }
  function minifyCss(css) { return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/}\s+/g, '}').trim(); }
  function minifyJs(js) { return js.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim(); }

  function testRegex(pattern, text) { try { const regex = new RegExp(pattern, 'g'); const matches = text.match(regex); return matches ? matches.length + " matches found:\n" + matches.slice(0, 20).join("\n") : "No matches found"; } catch(e) { return "Invalid regex pattern: " + e.message; } }

  function textDiff(a, b) { if (a === b) return "Texts are identical"; const aLines = a.split('\n'), bLines = b.split('\n'); let diff = []; const maxLen = Math.max(aLines.length, bLines.length); for (let i = 0; i < maxLen; i++) { const aLine = aLines[i] || '(missing)', bLine = bLines[i] || '(missing)'; if (aLine !== bLine) diff.push(`Line ${i+1}: "${aLine}" → "${bLine}"`); } return diff.length ? diff.join('\n') : "Texts are identical"; }

  function generatePassword(len, useUpper, useLower, useDigits, useSymbols) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ", lower = "abcdefghijkmnopqrstuvwxyz", digits = "23456789", symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let chars = ""; if (useUpper) chars += upper; if (useLower) chars += lower; if (useDigits) chars += digits; if (useSymbols) chars += symbols;
    if (!chars) chars = lower + digits;
    let password = "";
    for (let i = 0; i < len; i++) password += chars[secureRandomInt(chars.length)];
    return password;
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-dev-history";
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (error) {
      void error;
    }
  }
  function pushHistory(type, text, renderFn) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CARD CREATION
  // ============================================
  function initDeveloperTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.developerToolsInitialized === "true") return;
    grid.dataset.developerToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "dev-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `<div class="dev-card-header"><div class="dev-card-icon">${icon}</div><h3 class="dev-card-title">${escapeHtml(title)}</h3>${options.focusable !== false ? `<button class="btn btn-secondary dev-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary dev-focus-inline-close" data-focus-close>Close</button>` : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#devHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No developer outputs yet.</span>'; return; }
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
      <div><label>Input JSON</label><textarea id="jsonInput" rows="6" placeholder='{"name":"Qwickton","tools":["json","dev"]}'></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jsonFormatBtn">Format</button><button class="btn btn-secondary" id="jsonMinifyBtn">Minify</button><button class="btn btn-secondary" id="jsonValidateBtn">Validate</button><button class="btn btn-secondary" id="jsonCopyBtn">Copy</button><button class="btn btn-secondary" data-export="json-txt">TXT</button></div>
      <textarea id="jsonRes" class="result" rows="8" placeholder="Formatted JSON..."></textarea>
      <div id="jsonMeta" class="result">Status: waiting</div>
    `);
    const jsonInput = jsonCard.querySelector("#jsonInput"), jsonRes = jsonCard.querySelector("#jsonRes"), jsonMeta = jsonCard.querySelector("#jsonMeta");
    jsonCard.querySelector("#jsonFormatBtn").onclick = () => { try { const parsed = JSON.parse(jsonInput.value); jsonRes.value = JSON.stringify(parsed, null, 2); jsonMeta.textContent = "✅ Valid JSON | Formatted"; pushHistory("JSON Format", "Formatted", renderHistory); } catch(e) { jsonRes.value = ""; jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonMinifyBtn").onclick = () => { try { const parsed = JSON.parse(jsonInput.value); jsonRes.value = JSON.stringify(parsed); jsonMeta.textContent = "✅ Minified"; pushHistory("JSON Minify", "Minified", renderHistory); } catch(e) { jsonRes.value = ""; jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonValidateBtn").onclick = () => { try { JSON.parse(jsonInput.value); jsonMeta.textContent = "✅ Valid JSON"; } catch(e) { jsonMeta.textContent = `❌ Invalid JSON: ${e.message}`; } };
    jsonCard.querySelector("#jsonCopyBtn").onclick = () => copyText(jsonRes.value);
    wireExport(jsonCard, "json", "JSON", () => jsonRes.value);

    // ============================================
    // 2. JWT DECODER
    // ============================================
    const jwtCard = makeCard("jwt", "🔑", "JWT Decoder", `
      <div><label>JWT Token</label><textarea id="jwtInput" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jwtBtn">Decode JWT</button><button class="btn btn-secondary" id="jwtCopyBtn">Copy</button><button class="btn btn-secondary" data-export="jwt-txt">TXT</button></div>
      <textarea id="jwtRes" class="result" rows="8" placeholder="Decoded JWT..."></textarea>
      <div id="jwtMeta" class="result">Status: waiting</div>
    `);
    jwtCard.querySelector("#jwtBtn").onclick = () => {
      const token = jwtCard.querySelector("#jwtInput").value.trim();
      const parts = token.split('.');
      if (parts.length < 2) { jwtCard.querySelector("#jwtRes").value = "❌ Invalid JWT format"; jwtCard.querySelector("#jwtMeta").textContent = "❌ Invalid"; return; }
      try {
        const header = JSON.parse(b64UrlDecode(parts[0]));
        const payload = JSON.parse(b64UrlDecode(parts[1]));
        const out = `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}\n\nSignature: ${parts[2] ? "Present" : "Missing"}`;
        jwtCard.querySelector("#jwtRes").value = out;
        jwtCard.querySelector("#jwtMeta").textContent = "✅ Decoded successfully";
        pushHistory("JWT Decode", "Decoded JWT", renderHistory);
      } catch(e) { jwtCard.querySelector("#jwtRes").value = `❌ Error: ${e.message}`; jwtCard.querySelector("#jwtMeta").textContent = "❌ Decode failed"; }
    };
    jwtCard.querySelector("#jwtCopyBtn").onclick = () => copyText(jwtCard.querySelector("#jwtRes").value);
    wireExport(jwtCard, "jwt", "JWT", () => jwtCard.querySelector("#jwtRes").value);

    // ============================================
    // 3. cURL BUILDER
    // ============================================
    const curlCard = makeCard("curl", "📡", "cURL Command Builder", `
      <div class="grid-2"><div><label>Method</label><input id="curlMethod" value="GET"></div><div><label>URL</label><input id="curlUrl" placeholder="https://api.example.com/users"></div>
      <div><label>Headers</label><input id="curlHeader" placeholder="Authorization: Bearer token"></div><div><label>Body (JSON)</label><textarea id="curlBody" rows="2" placeholder='{"name":"John"}'></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="curlBtn">Build cURL</button><button class="btn btn-secondary" id="curlCopyBtn">Copy</button><button class="btn btn-secondary" data-export="curl-txt">TXT</button></div>
      <textarea id="curlRes" class="result" rows="6" placeholder="cURL command..."></textarea>
    `);
    curlCard.querySelector("#curlBtn").onclick = () => {
      const method = curlCard.querySelector("#curlMethod").value.toUpperCase();
      const url = curlCard.querySelector("#curlUrl").value.trim();
      const header = curlCard.querySelector("#curlHeader").value.trim();
      const body = curlCard.querySelector("#curlBody").value.trim();
      if (!url) { curlCard.querySelector("#curlRes").value = "❌ Please enter URL"; return; }
      let cmd = `curl -X ${method} "${url}"`;
      if (header) cmd += ` \\\n  -H "${header.replace(/"/g, '\\"')}"`;
      if (body && (method === "POST" || method === "PUT" || method === "PATCH")) cmd += ` \\\n  -H "Content-Type: application/json" \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
      curlCard.querySelector("#curlRes").value = cmd;
      pushHistory("cURL", method, renderHistory);
    };
    curlCard.querySelector("#curlCopyBtn").onclick = () => copyText(curlCard.querySelector("#curlRes").value);
    wireExport(curlCard, "curl", "cURL", () => curlCard.querySelector("#curlRes").value);

    // ============================================
    // 4. BASE64 ENCODER/DECODER
    // ============================================
    const base64Card = makeCard("base64", "📦", "Base64 Encoder/Decoder", `
      <div><label>Input Text</label><textarea id="b64Input" rows="4" placeholder="Enter text..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="b64EncodeBtn">Encode</button><button class="btn btn-secondary" id="b64DecodeBtn">Decode</button><button class="btn btn-secondary" id="b64CopyBtn">Copy</button><button class="btn btn-secondary" data-export="base64-txt">TXT</button></div>
      <textarea id="b64Res" class="result" rows="6" placeholder="Result..."></textarea>
    `);
    const b64Input = base64Card.querySelector("#b64Input"), b64Res = base64Card.querySelector("#b64Res");
    base64Card.querySelector("#b64EncodeBtn").onclick = () => { const encoded = utf8ToBase64(b64Input.value); b64Res.value = encoded; pushHistory("Base64 Encode", encoded.slice(0, 50), renderHistory); };
    base64Card.querySelector("#b64DecodeBtn").onclick = () => { const decoded = base64ToUtf8(b64Input.value); b64Res.value = decoded; pushHistory("Base64 Decode", decoded.slice(0, 50), renderHistory); };
    base64Card.querySelector("#b64CopyBtn").onclick = () => copyText(b64Res.value);
    wireExport(base64Card, "base64", "Base64", () => b64Res.value);

    // ============================================
    // 5. TIMESTAMP CONVERTER
    // ============================================
    const timestampCard = makeCard("timestamp", "⏰", "Timestamp Converter", `
      <div class="grid-2"><div><label>Unix Timestamp</label><input id="tsInput" type="number" value="${Math.floor(Date.now()/1000)}"></div><div><label>Date Time</label><input id="dateInput" type="datetime-local"></div></div>
      <div class="grid-2"><div><label>Locale/Country</label><select id="tsLocale">${localeOptions()}</select></div><div><label>Timezone</label><select id="tsZone">${timezoneOptions()}</select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="tsToDateBtn">Timestamp → Date</button><button class="btn btn-secondary" id="dateToTsBtn">Date → Timestamp</button><button class="btn btn-secondary" id="tsCopyBtn">Copy</button><button class="btn btn-secondary" data-export="timestamp-txt">TXT</button></div>
      <div id="tsRes" class="result">-</div>
    `);
    const tsInput = timestampCard.querySelector("#tsInput"), dateInput = timestampCard.querySelector("#dateInput"), tsRes = timestampCard.querySelector("#tsRes");
    const tsLocale = timestampCard.querySelector("#tsLocale"), tsZone = timestampCard.querySelector("#tsZone");
    const now = new Date(); dateInput.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    timestampCard.querySelector("#tsToDateBtn").onclick = () => {
      const ts = safeNum(tsInput.value, 0);
      if (!ts) { tsRes.textContent = "❌ Enter valid timestamp"; return; }
      const d = new Date(ts * 1000);
      const locale = tsLocale.value || "en-US";
      const zone = tsZone.value || "UTC";
      const inZone = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "long", timeZone: zone }).format(d);
      tsRes.textContent = `📅 ${zone} (${locale}): ${inZone}\n🌍 UTC: ${d.toUTCString()}`;
      pushHistory("Timestamp", `${ts} (${zone})`, renderHistory);
    };
    timestampCard.querySelector("#dateToTsBtn").onclick = () => {
      const val = dateInput.value;
      if (!val) { tsRes.textContent = "❌ Select date"; return; }
      const ts = Math.floor(new Date(val).getTime() / 1000);
      tsRes.textContent = `🔢 Unix Timestamp: ${ts}`;
      tsInput.value = ts;
      pushHistory("Timestamp", `${ts}`, renderHistory);
    };
    tsLocale.addEventListener("change", () => timestampCard.querySelector("#tsToDateBtn").click());
    tsZone.addEventListener("change", () => timestampCard.querySelector("#tsToDateBtn").click());
    timestampCard.querySelector("#tsCopyBtn").onclick = () => copyText(tsRes.textContent);
    timestampCard.querySelector("#tsToDateBtn").click();
    wireExport(timestampCard, "timestamp", "Timestamp", () => tsRes.textContent);

    // ============================================
    // 6. HASH GENERATOR
    // ============================================
    const hashCard = makeCard("hash", "🔒", "Hash Generator", `
      <div><label>Input Text</label><textarea id="hashInput" rows="3" placeholder="Enter text..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="hashBtn">Generate Hash</button><button class="btn btn-secondary" id="hashCopyBtn">Copy</button><button class="btn btn-secondary" data-export="hash-txt">TXT</button></div>
      <textarea id="hashRes" class="result" rows="4" placeholder="Hash..."></textarea>
    `);
    hashCard.querySelector("#hashBtn").onclick = () => {
      const input = hashCard.querySelector("#hashInput").value;
      const hash = simpleHash(input);
      hashCard.querySelector("#hashRes").value = `Input: ${input}\nHash: ${hash}\nLength: ${hash.length}`;
      pushHistory("Hash", hash, renderHistory);
    };
    hashCard.querySelector("#hashCopyBtn").onclick = () => copyText(hashCard.querySelector("#hashRes").value);
    wireExport(hashCard, "hash", "Hash", () => hashCard.querySelector("#hashRes").value);

    // ============================================
    // 7. REGEX TESTER
    // ============================================
    const regexCard = makeCard("regex", "📝", "Regex Tester", `
      <div class="grid-2"><div><label>Regex Pattern</label><input id="regexPattern" placeholder="\\d+"></div><div><label>Test Text</label><textarea id="regexText" rows="4" placeholder="Enter text to test..."></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="regexBtn">Test Regex</button><button class="btn btn-secondary" id="regexCopyBtn">Copy</button><button class="btn btn-secondary" data-export="regex-txt">TXT</button></div>
      <textarea id="regexRes" class="result" rows="6" placeholder="Results..."></textarea>
    `);
    regexCard.querySelector("#regexBtn").onclick = () => {
      const pattern = regexCard.querySelector("#regexPattern").value;
      const text = regexCard.querySelector("#regexText").value;
      if (!pattern) { regexCard.querySelector("#regexRes").value = "❌ Enter regex pattern"; return; }
      const result = testRegex(pattern, text);
      regexCard.querySelector("#regexRes").value = result;
      pushHistory("Regex Test", pattern, renderHistory);
    };
    regexCard.querySelector("#regexCopyBtn").onclick = () => copyText(regexCard.querySelector("#regexRes").value);
    wireExport(regexCard, "regex", "Regex", () => regexCard.querySelector("#regexRes").value);

    // ============================================
    // 8. TEXT DIFF
    // ============================================
    const diffCard = makeCard("diff", "≠", "Text Diff Tool", `
      <div class="grid-2"><div><label>Original Text</label><textarea id="diffA" rows="5" placeholder="Original..."></textarea></div><div><label>Modified Text</label><textarea id="diffB" rows="5" placeholder="Modified..."></textarea></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="diffBtn">Compare</button><button class="btn btn-secondary" id="diffCopyBtn">Copy</button><button class="btn btn-secondary" data-export="diff-txt">TXT</button></div>
      <textarea id="diffRes" class="result" rows="6" placeholder="Differences..."></textarea>
    `);
    diffCard.querySelector("#diffBtn").onclick = () => {
      const result = textDiff(diffCard.querySelector("#diffA").value, diffCard.querySelector("#diffB").value);
      diffCard.querySelector("#diffRes").value = result;
      pushHistory("Text Diff", "Compared texts", renderHistory);
    };
    diffCard.querySelector("#diffCopyBtn").onclick = () => copyText(diffCard.querySelector("#diffRes").value);
    wireExport(diffCard, "diff", "Diff", () => diffCard.querySelector("#diffRes").value);

    // ============================================
    // 9. QR CODE GENERATOR
    // ============================================
    const qrCard = makeCard("qr", "📱", "QR Code Generator", `
      <div><label>Text/URL</label><input id="qrText" placeholder="https://qwickton.com" value="https://qwickton.com"></div>
      <div class="inline-row"><button class="btn btn-primary" id="qrBtn">Generate QR</button><button class="btn btn-secondary" id="qrCopyBtn">Copy URL</button><button class="btn btn-secondary" data-export="qr-txt">TXT</button></div>
      <div id="qrPreview" class="preview-box"><canvas id="qrCanvas" width="200" height="200"></canvas></div>
    `);
    qrCard.querySelector("#qrBtn").onclick = () => {
      const text = qrCard.querySelector("#qrText").value;
      if (!text) { return; }
      const canvas = qrCard.querySelector("#qrCanvas");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = "#000000";
      const size = 29;
      const cell = Math.floor(200 / size);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const finder = (i < 7 && j < 7) || (i > size - 8 && j < 7) || (i < 7 && j > size - 8);
          let on = finder;
          if (!finder) {
            let h = 0;
            const str = `${text}-${i}-${j}`;
            for (let k = 0; k < str.length; k++) h = (h * 31 + str.charCodeAt(k)) % 9973;
            on = h % 2 === 0;
          }
          ctx.fillStyle = on ? "#000000" : "#ffffff";
          ctx.fillRect(j * cell, i * cell, cell, cell);
        }
      }
      pushHistory("QR Code", text, renderHistory);
    };
    qrCard.querySelector("#qrCopyBtn").onclick = () => copyText(qrCard.querySelector("#qrText").value);
    qrCard.querySelector("#qrBtn").click();
    wireExport(qrCard, "qr", "QR", () => qrCard.querySelector("#qrText").value);

    // ============================================
    // 10. PASSWORD GENERATOR
    // ============================================
    const passwordCard = makeCard("password", "🔐", "Password Generator", `
      <div class="grid-2"><div><label>Length</label><input id="passLen" type="number" value="16" min="6" max="128"></div>
      <div><label>Count</label><input id="passCount" type="number" value="1" min="1" max="10"></div></div>
      <div class="inline-row"><label><input type="checkbox" id="passUpper" checked> A-Z</label><label><input type="checkbox" id="passLower" checked> a-z</label><label><input type="checkbox" id="passDigits" checked> 0-9</label><label><input type="checkbox" id="passSymbols" checked> !@#$%</label></div>
      <div class="inline-row"><button class="btn btn-primary" id="passBtn">Generate</button><button class="btn btn-secondary" id="passCopyBtn">Copy First</button><button class="btn btn-secondary" data-export="password-txt">TXT</button></div>
      <textarea id="passRes" class="result" rows="4" placeholder="Passwords..."></textarea>
    `);
    passwordCard.querySelector("#passBtn").onclick = () => {
      const len = Math.min(128, Math.max(6, safeNum(passwordCard.querySelector("#passLen").value, 16)));
      const count = Math.min(10, Math.max(1, safeNum(passwordCard.querySelector("#passCount").value, 1)));
      const useUpper = passwordCard.querySelector("#passUpper").checked;
      const useLower = passwordCard.querySelector("#passLower").checked;
      const useDigits = passwordCard.querySelector("#passDigits").checked;
      const useSymbols = passwordCard.querySelector("#passSymbols").checked;
      const passwords = [];
      for (let i = 0; i < count; i++) passwords.push(generatePassword(len, useUpper, useLower, useDigits, useSymbols));
      passwordCard.querySelector("#passRes").value = passwords.join("\n");
      pushHistory("Password", passwords[0], renderHistory);
    };
    passwordCard.querySelector("#passCopyBtn").onclick = () => copyText(passwordCard.querySelector("#passRes").value.split("\n")[0]);
    passwordCard.querySelector("#passBtn").click();
    wireExport(passwordCard, "password", "Password", () => passwordCard.querySelector("#passRes").value);

    // ============================================
    // 11. HTML/CSS/JS MINIFIER
    // ============================================
    const minifierCard = makeCard("minifier", "📦", "Code Minifier", `
      <div><label>Input Code</label><textarea id="minInput" rows="6" placeholder="<div>  Hello World  </div>"></textarea></div>
      <div class="grid-2"><div><label>Language</label><select id="minLang"><option value="html">HTML</option><option value="css">CSS</option><option value="js">JavaScript</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="minBtn">Minify</button><button class="btn btn-secondary" id="minCopyBtn">Copy</button><button class="btn btn-secondary" data-export="minifier-txt">TXT</button></div>
      <textarea id="minRes" class="result" rows="6" placeholder="Minified code..."></textarea>
    `);
    minifierCard.querySelector("#minBtn").onclick = () => {
      const input = minifierCard.querySelector("#minInput").value;
      const lang = minifierCard.querySelector("#minLang").value;
      const output = lang === "html" ? minifyHtml(input) : lang === "css" ? minifyCss(input) : minifyJs(input);
      minifierCard.querySelector("#minRes").value = output;
      pushHistory("Minifier", `${lang} minified`, renderHistory);
    };
    minifierCard.querySelector("#minCopyBtn").onclick = () => copyText(minifierCard.querySelector("#minRes").value);
    wireExport(minifierCard, "minifier", "Minifier", () => minifierCard.querySelector("#minRes").value);

    // ============================================
    // 12. COLOR PICKER/CONVERTER
    // ============================================
    const colorCard = makeCard("color", "🎨", "Color Picker & Converter", `
      <div class="grid-2"><div><label>Hex Color</label><input id="colorHex" type="text" value="#10b981"></div><div><label>RGB</label><input id="colorRgb" type="text" value="rgb(16,185,129)"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="colorConvertBtn">Convert</button><button class="btn btn-secondary" id="colorCopyBtn">Copy</button><button class="btn btn-secondary" data-export="color-txt">TXT</button></div>
      <div id="colorPreview" class="color-preview" style="background:#10b981"></div>
    `);
    function runColor() {
      const hex = colorCard.querySelector("#colorHex").value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const rgb = hexToRgb(hex);
        colorCard.querySelector("#colorRgb").value = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
        colorCard.querySelector("#colorPreview").style.background = hex;
        pushHistory("Color", hex, renderHistory);
      } else {
        const rgbMatch = colorCard.querySelector("#colorRgb").value.match(/\d+/g);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[0]), g = parseInt(rgbMatch[1]), b = parseInt(rgbMatch[2]);
          const hexVal = rgbToHex(r, g, b);
          colorCard.querySelector("#colorHex").value = hexVal;
          colorCard.querySelector("#colorPreview").style.background = hexVal;
          pushHistory("Color", hexVal, renderHistory);
        }
      }
    }
    colorCard.querySelector("#colorConvertBtn").onclick = runColor;
    colorCard.querySelector("#colorCopyBtn").onclick = () => copyText(colorCard.querySelector("#colorHex").value);
    runColor();
    wireExport(colorCard, "color", "Color", () => colorCard.querySelector("#colorHex").value);

    // ============================================
    // 13. USER AGENT PARSER
    // ============================================
    const uaCard = makeCard("useragent", "🖥️", "User Agent Parser", `
      <div><label>User Agent String</label><textarea id="uaInput" rows="3" placeholder="Mozilla/5.0...">${navigator.userAgent}</textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="uaBtn">Parse</button><button class="btn btn-secondary" id="uaCopyBtn">Copy</button><button class="btn btn-secondary" data-export="useragent-txt">TXT</button></div>
      <textarea id="uaRes" class="result" rows="8" placeholder="Parsed info..."></textarea>
    `);
    uaCard.querySelector("#uaBtn").onclick = () => {
      const ua = uaCard.querySelector("#uaInput").value;
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
      const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
      const isFirefox = /Firefox/i.test(ua);
      const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
      const isEdge = /Edg/i.test(ua);
      let browser = "Unknown";
      if (isChrome) browser = "Chrome"; else if (isFirefox) browser = "Firefox"; else if (isSafari) browser = "Safari"; else if (isEdge) browser = "Edge";
      const os = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : /Android/i.test(ua) ? "Android" : /iOS|iPhone|iPad/i.test(ua) ? "iOS" : "Unknown";
      const out = [`📱 Browser: ${browser}`, `💻 OS: ${os}`, `📱 Mobile: ${isMobile ? "Yes" : "No"}`, `📝 Full UA: ${ua}`].join("\n");
      uaCard.querySelector("#uaRes").value = out;
      pushHistory("User Agent", browser, renderHistory);
    };
    uaCard.querySelector("#uaCopyBtn").onclick = () => copyText(uaCard.querySelector("#uaRes").value);
    uaCard.querySelector("#uaBtn").click();
    wireExport(uaCard, "useragent", "UserAgent", () => uaCard.querySelector("#uaRes").value);

    // ============================================
    // 14. UUID / TOKEN GENERATOR
    // ============================================
    const uuidCard = makeCard("uuid", "🧬", "UUID & Token Generator", `
      <div class="grid-2"><div><label>Format</label><select id="uuidType"><option value="uuid" selected>UUID v4</option><option value="token">Hex Token</option></select></div><div><label>Count</label><input id="uuidCount" type="number" value="3" min="1" max="20"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="uuidBtn">Generate</button><button class="btn btn-secondary" id="uuidCopyBtn">Copy First</button><button class="btn btn-secondary" data-export="uuid-txt">TXT</button></div>
      <textarea id="uuidRes" class="result" rows="6" placeholder="Generated IDs..."></textarea>
    `);
    function createUuidV4() {
      const bytes = new Uint8Array(16);
      if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        window.crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    function createHexToken() {
      const bytes = new Uint8Array(20);
      if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        window.crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
    uuidCard.querySelector("#uuidBtn").onclick = () => {
      const type = uuidCard.querySelector("#uuidType").value;
      const count = Math.min(20, Math.max(1, Math.floor(safeNum(uuidCard.querySelector("#uuidCount").value, 3))));
      const results = [];
      for (let i = 0; i < count; i++) results.push(type === "uuid" ? createUuidV4() : createHexToken());
      uuidCard.querySelector("#uuidRes").value = results.join("\n");
      pushHistory("UUID/Token", results[0], renderHistory);
    };
    uuidCard.querySelector("#uuidCopyBtn").onclick = () => copyText(uuidCard.querySelector("#uuidRes").value.split("\n")[0] || "");
    uuidCard.querySelector("#uuidBtn").click();
    wireExport(uuidCard, "uuid", "UUID", () => uuidCard.querySelector("#uuidRes").value);

    // ============================================
    // 15. HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Developer Outputs", `
      <div id="devHistory" class="chip-list"><span class="empty-hint">No developer outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clearDevHistory">Clear History</button><button class="btn btn-secondary" id="exportDevHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearDevHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportDevHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`dev-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "dev-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "dev-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || card.getAttribute("data-focusable") === "false" || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("dev-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("dev-modal-open"); }
    document.querySelectorAll(".dev-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".dev-card"))));
    document.querySelectorAll(".dev-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    grid.querySelectorAll("button:not([type])").forEach((button) => button.setAttribute("type", "button"));
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    if (tsLocale && Array.from(tsLocale.options).some((opt) => opt.value === browserLocale)) {
      tsLocale.value = browserLocale;
      timestampCard.querySelector("#tsToDateBtn").click();
    }
    document.getElementById("year").textContent = new Date().getFullYear();
  }
  window.QwicktonCategoryInits["developer-tools"] = initDeveloperTools;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDeveloperTools(null); });
})();