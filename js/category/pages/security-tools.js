(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-security-history-v2";
  const COMMON_PASSWORDS = new Set([
    "123456", "password", "qwerty", "admin", "welcome", "iloveyou", "123123", "abc123",
    "letmein", "password1", "india123", "qwerty123", "000000", "111111", "asdfgh"
  ]);
  const WORD_BANK = [
    "anchor", "orbit", "cipher", "valley", "ember", "nova", "harbor", "matrix",
    "zenith", "pixel", "falcon", "summit", "delta", "ranger", "fusion", "aurora"
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
  function downloadJson(name, data) {
    downloadText(name, JSON.stringify(data, null, 2));
  }
  function randomBytes(length) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return arr;
  }
  function securePick(str) {
    return str[randomBytes(1)[0] % str.length];
  }
  function toHex(bytes) {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function toBase64Url(bytes) {
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromBase64Url(str) {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }
  function utf8ToB64(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }
  function b64ToUtf8(text) {
    return decodeURIComponent(escape(atob(text)));
  }
  function estimateEntropy(text) {
    if (!text) return 0;
    let pool = 0;
    if (/[a-z]/.test(text)) pool += 26;
    if (/[A-Z]/.test(text)) pool += 26;
    if (/\d/.test(text)) pool += 10;
    if (/[^A-Za-z0-9]/.test(text)) pool += 33;
    if (!pool) return 0;
    return Number((text.length * Math.log2(pool)).toFixed(1));
  }
  function strengthLabel(text) {
    const entropy = estimateEntropy(text);
    if (entropy >= 90) return { label: "Very Strong", entropy };
    if (entropy >= 72) return { label: "Strong", entropy };
    if (entropy >= 54) return { label: "Good", entropy };
    if (entropy >= 40) return { label: "Weak", entropy };
    return { label: "Very Weak", entropy };
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

  function initSecurityTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.securityToolsInitialized === "true") return;
    grid.dataset.securityToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, body, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "sec-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="sec-card-header"><div class="sec-card-icon">${icon}</div><h3 class="sec-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary sec-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary sec-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${body}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function pushHistory(type, text) {
      if (!text) return;
      writeHistory([{ type, text: String(text).slice(0, 200), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const host = historyCardEl.querySelector("#secHistory");
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No recent activity yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" data-i="${i}"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.i);
        copyText(`${items[idx]?.type}: ${items[idx]?.text}`);
      }));
    }

    // 1 Password studio
    const passCard = makeCard("password", "🔐", "Password Studio", `
      <div class="grid-2">
        <div><label>Length (6-128)</label><input id="pwLen" type="number" min="6" max="128" value="16"></div>
        <div><label>Count (1-20)</label><input id="pwCount" type="number" min="1" max="20" value="5"></div>
      </div>
      <div class="inline-row">
        <label><input id="pwUp" type="checkbox" checked> Upper</label>
        <label><input id="pwLow" type="checkbox" checked> Lower</label>
        <label><input id="pwNum" type="checkbox" checked> Number</label>
        <label><input id="pwSym" type="checkbox" checked> Symbol</label>
        <label><input id="pwNoAmb" type="checkbox" checked> No ambiguous</label>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="pwRun">Generate</button><button class="btn btn-secondary" id="pwCopy">Copy First</button><button class="btn btn-secondary" id="pwTxt">TXT</button></div>
      <textarea id="pwOut" class="result" rows="6" readonly></textarea>
      <div id="pwMeta" class="result">Strength: -</div>
    `);
    passCard.querySelector("#pwRun").addEventListener("click", () => {
      const len = Math.max(6, Math.min(128, safeNum(passCard.querySelector("#pwLen").value, 16)));
      const count = Math.max(1, Math.min(20, safeNum(passCard.querySelector("#pwCount").value, 5)));
      const noAmb = passCard.querySelector("#pwNoAmb").checked;
      const groups = [];
      if (passCard.querySelector("#pwUp").checked) groups.push(noAmb ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      if (passCard.querySelector("#pwLow").checked) groups.push(noAmb ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz");
      if (passCard.querySelector("#pwNum").checked) groups.push(noAmb ? "23456789" : "0123456789");
      if (passCard.querySelector("#pwSym").checked) groups.push("!@#$%^&*()_+-=[]{}:;,.?");
      if (!groups.length) {
        passCard.querySelector("#pwOut").value = "Select at least one character group.";
        return;
      }
      const pool = groups.join("");
      const lines = [];
      for (let i = 0; i < count; i += 1) {
        let p = "";
        groups.forEach((g) => { p += securePick(g); });
        while (p.length < len) p += securePick(pool);
        const arr = p.split("");
        for (let j = arr.length - 1; j > 0; j -= 1) {
          const k = randomBytes(1)[0] % (j + 1);
          [arr[j], arr[k]] = [arr[k], arr[j]];
        }
        lines.push(arr.join(""));
      }
      passCard.querySelector("#pwOut").value = lines.join("\n");
      const s = strengthLabel(lines[0]);
      passCard.querySelector("#pwMeta").textContent = `Strength: ${s.label} | Entropy: ~${s.entropy} bits`;
      pushHistory("Password", lines[0].slice(0, 30));
    });
    passCard.querySelector("#pwCopy").addEventListener("click", () => copyText((passCard.querySelector("#pwOut").value || "").split("\n")[0] || ""));
    passCard.querySelector("#pwTxt").addEventListener("click", () => downloadText("passwords.txt", passCard.querySelector("#pwOut").value));

    // 2 Passphrase
    const phraseCard = makeCard("phrase", "🔑", "Passphrase Generator", `
      <div class="grid-2">
        <div><label>Words (3-10)</label><input id="phWords" type="number" min="3" max="10" value="4"></div>
        <div><label>Separator</label><select id="phSep"><option value="-">-</option><option value="_">_</option><option value=".">.</option><option value=" ">Space</option></select></div>
      </div>
      <div class="inline-row"><label><input id="phCap" type="checkbox" checked> Capitalize</label><label><input id="phNum" type="checkbox" checked> Add 2 digits</label></div>
      <div class="inline-row"><button class="btn btn-primary" id="phRun">Generate</button><button class="btn btn-secondary" id="phCopy">Copy</button><button class="btn btn-secondary" id="phTxt">TXT</button></div>
      <div id="phOut" class="result">-</div>
    `);
    phraseCard.querySelector("#phRun").addEventListener("click", () => {
      const words = Math.max(3, Math.min(10, safeNum(phraseCard.querySelector("#phWords").value, 4)));
      const sep = phraseCard.querySelector("#phSep").value;
      const cap = phraseCard.querySelector("#phCap").checked;
      const addNum = phraseCard.querySelector("#phNum").checked;
      const parts = [];
      for (let i = 0; i < words; i += 1) {
        let w = WORD_BANK[randomBytes(1)[0] % WORD_BANK.length];
        if (cap) w = `${w[0].toUpperCase()}${w.slice(1)}`;
        parts.push(w);
      }
      if (addNum) parts.push(String(randomBytes(1)[0] % 10), String(randomBytes(1)[0] % 10));
      const out = parts.join(sep);
      phraseCard.querySelector("#phOut").textContent = out;
      pushHistory("Passphrase", out);
    });
    phraseCard.querySelector("#phCopy").addEventListener("click", () => copyText(phraseCard.querySelector("#phOut").textContent));
    phraseCard.querySelector("#phTxt").addEventListener("click", () => downloadText("passphrase.txt", phraseCard.querySelector("#phOut").textContent));

    // 3 Hash
    const hashCard = makeCard("hash", "🔒", "SHA Hash Generator", `
      <div><label>Text Input</label><textarea id="hashIn" rows="4" placeholder="Enter text"></textarea></div>
      <div><label>Optional File</label><input id="hashFile" type="file"></div>
      <div class="inline-row"><button class="btn btn-primary" id="h256">SHA-256 Text</button><button class="btn btn-secondary" id="h512">SHA-512 Text</button><button class="btn btn-secondary" id="hFile">SHA-256 File</button><button class="btn btn-secondary" id="hCopy">Copy</button><button class="btn btn-secondary" id="hTxt">TXT</button></div>
      <textarea id="hashOut" class="result" rows="6" readonly></textarea>
    `);
    async function digest(algo, data) {
      const d = await crypto.subtle.digest(algo, data);
      return toHex(new Uint8Array(d));
    }
    hashCard.querySelector("#h256").addEventListener("click", async () => {
      const text = hashCard.querySelector("#hashIn").value;
      if (!text) return;
      const out = await digest("SHA-256", new TextEncoder().encode(text));
      hashCard.querySelector("#hashOut").value = out;
      pushHistory("SHA-256", out.slice(0, 32));
    });
    hashCard.querySelector("#h512").addEventListener("click", async () => {
      const text = hashCard.querySelector("#hashIn").value;
      if (!text) return;
      const out = await digest("SHA-512", new TextEncoder().encode(text));
      hashCard.querySelector("#hashOut").value = out;
      pushHistory("SHA-512", out.slice(0, 32));
    });
    hashCard.querySelector("#hFile").addEventListener("click", async () => {
      const file = hashCard.querySelector("#hashFile").files?.[0];
      if (!file) return;
      const out = await digest("SHA-256", await file.arrayBuffer());
      hashCard.querySelector("#hashOut").value = `File: ${file.name}\nSize: ${file.size} bytes\nSHA-256: ${out}`;
      pushHistory("SHA-256 File", file.name);
    });
    hashCard.querySelector("#hCopy").addEventListener("click", () => copyText(hashCard.querySelector("#hashOut").value));
    hashCard.querySelector("#hTxt").addEventListener("click", () => downloadText("hash-output.txt", hashCard.querySelector("#hashOut").value));

    // 4 encoding
    const encCard = makeCard("encoding", "📦", "Encoding Toolkit", `
      <div><label>Input</label><textarea id="encIn" rows="5" placeholder="Text / Base64 / URL encoded"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="eB64">Base64 Encode</button><button class="btn btn-secondary" id="dB64">Base64 Decode</button><button class="btn btn-secondary" id="eUrl">URL Encode</button><button class="btn btn-secondary" id="dUrl">URL Decode</button><button class="btn btn-secondary" id="encCopy">Copy</button><button class="btn btn-secondary" id="encTxt">TXT</button></div>
      <textarea id="encOut" class="result" rows="6" readonly></textarea>
    `);
    function setEnc(value, action) {
      encCard.querySelector("#encOut").value = value;
      pushHistory(action, String(value).slice(0, 80));
    }
    encCard.querySelector("#eB64").addEventListener("click", () => setEnc(utf8ToB64(encCard.querySelector("#encIn").value), "Base64 Encode"));
    encCard.querySelector("#dB64").addEventListener("click", () => {
      try { setEnc(b64ToUtf8(encCard.querySelector("#encIn").value.trim()), "Base64 Decode"); }
      catch { encCard.querySelector("#encOut").value = "Invalid Base64 input."; }
    });
    encCard.querySelector("#eUrl").addEventListener("click", () => setEnc(encodeURIComponent(encCard.querySelector("#encIn").value), "URL Encode"));
    encCard.querySelector("#dUrl").addEventListener("click", () => {
      try { setEnc(decodeURIComponent(encCard.querySelector("#encIn").value), "URL Decode"); }
      catch { encCard.querySelector("#encOut").value = "Invalid URL encoded input."; }
    });
    encCard.querySelector("#encCopy").addEventListener("click", () => copyText(encCard.querySelector("#encOut").value));
    encCard.querySelector("#encTxt").addEventListener("click", () => downloadText("encoding-output.txt", encCard.querySelector("#encOut").value));

    // 5 JWT inspector
    const jwtCard = makeCard("jwt", "🪪", "JWT Inspector (Decode Only)", `
      <p class="sec-hint">Local decode only. Signature verification needs public key workflow.</p>
      <div><label>JWT Token</label><textarea id="jwtIn" rows="5" placeholder="eyJ..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="jwtRun">Inspect</button><button class="btn btn-secondary" id="jwtCopy">Copy JSON</button><button class="btn btn-secondary" id="jwtJson">Download JSON</button></div>
      <textarea id="jwtOut" class="result" rows="8" readonly></textarea>
    `);
    let jwtParsed = null;
    jwtCard.querySelector("#jwtRun").addEventListener("click", () => {
      const token = jwtCard.querySelector("#jwtIn").value.trim();
      const parts = token.split(".");
      if (parts.length < 2) {
        jwtCard.querySelector("#jwtOut").value = "Invalid JWT format.";
        return;
      }
      try {
        const header = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
        const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1])));
        const now = Math.floor(Date.now() / 1000);
        const expStatus = typeof payload.exp === "number" ? (payload.exp < now ? "expired" : "active") : "no exp claim";
        jwtParsed = { header, payload, meta: { expStatus, hasSignature: parts.length === 3 } };
        jwtCard.querySelector("#jwtOut").value = JSON.stringify(jwtParsed, null, 2);
        pushHistory("JWT", expStatus);
      } catch {
        jwtParsed = null;
        jwtCard.querySelector("#jwtOut").value = "Failed to decode JWT.";
      }
    });
    jwtCard.querySelector("#jwtCopy").addEventListener("click", () => copyText(jwtCard.querySelector("#jwtOut").value));
    jwtCard.querySelector("#jwtJson").addEventListener("click", () => downloadJson("jwt-inspection.json", jwtParsed || { error: "No parsed JWT yet" }));

    // 6 HMAC signer
    const hmacCard = makeCard("hmac", "✍️", "HMAC Sign / Verify", `
      <div><label>Secret Key</label><input id="hmacKey" type="text" placeholder="Shared secret"></div>
      <div><label>Message</label><textarea id="hmacMsg" rows="4" placeholder="Message"></textarea></div>
      <div><label>Expected Signature (optional verify)</label><input id="hmacExpected" type="text" placeholder="hex signature"></div>
      <div class="inline-row"><button class="btn btn-primary" id="hmacRun">Generate HMAC-SHA256</button><button class="btn btn-secondary" id="hmacCopy">Copy</button><button class="btn btn-secondary" id="hmacTxt">TXT</button></div>
      <textarea id="hmacOut" class="result" rows="5" readonly></textarea>
    `);
    async function runHmac(secret, message) {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
      return toHex(new Uint8Array(sig));
    }
    hmacCard.querySelector("#hmacRun").addEventListener("click", async () => {
      const secret = hmacCard.querySelector("#hmacKey").value;
      const msg = hmacCard.querySelector("#hmacMsg").value;
      if (!secret || !msg) {
        hmacCard.querySelector("#hmacOut").value = "Secret and message required.";
        return;
      }
      const sig = await runHmac(secret, msg);
      const exp = hmacCard.querySelector("#hmacExpected").value.trim().toLowerCase();
      const verifyLine = exp ? `\nMatch: ${exp === sig ? "YES" : "NO"}` : "";
      hmacCard.querySelector("#hmacOut").value = `HMAC-SHA256: ${sig}${verifyLine}`;
      pushHistory("HMAC", sig.slice(0, 24));
    });
    hmacCard.querySelector("#hmacCopy").addEventListener("click", () => copyText(hmacCard.querySelector("#hmacOut").value));
    hmacCard.querySelector("#hmacTxt").addEventListener("click", () => downloadText("hmac-output.txt", hmacCard.querySelector("#hmacOut").value));

    // 7 tokens
    const tokenCard = makeCard("token", "🎫", "Secure Token Generator", `
      <div class="grid-2">
        <div><label>Byte Length (8-64)</label><input id="tokLen" type="number" min="8" max="64" value="32"></div>
        <div><label>Format</label><select id="tokFmt"><option value="hex">Hex</option><option value="b64url">Base64URL</option></select></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="tokRun">Generate</button><button class="btn btn-secondary" id="tokCopy">Copy</button><button class="btn btn-secondary" id="tokTxt">TXT</button></div>
      <textarea id="tokOut" class="result" rows="5" readonly></textarea>
    `);
    tokenCard.querySelector("#tokRun").addEventListener("click", () => {
      const len = Math.max(8, Math.min(64, safeNum(tokenCard.querySelector("#tokLen").value, 32)));
      const bytes = randomBytes(len);
      const out = tokenCard.querySelector("#tokFmt").value === "b64url" ? toBase64Url(bytes) : toHex(bytes);
      tokenCard.querySelector("#tokOut").value = out;
      pushHistory("Token", `${len} bytes`);
    });
    tokenCard.querySelector("#tokCopy").addEventListener("click", () => copyText(tokenCard.querySelector("#tokOut").value));
    tokenCard.querySelector("#tokTxt").addEventListener("click", () => downloadText("security-token.txt", tokenCard.querySelector("#tokOut").value));

    // 8 UUID generator
    const uuidCard = makeCard("uuid", "🆔", "UUID Generator", `
      <div class="grid-2"><div><label>Count (1-100)</label><input id="uuidCount" type="number" min="1" max="100" value="10"></div><div><label>Version</label><select id="uuidVer"><option value="v4">UUID v4</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="uuidRun">Generate</button><button class="btn btn-secondary" id="uuidCopy">Copy</button><button class="btn btn-secondary" id="uuidTxt">TXT</button></div>
      <textarea id="uuidOut" class="result" rows="7" readonly></textarea>
    `);
    function uuidv4() {
      const b = randomBytes(16);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = toHex(b);
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
    uuidCard.querySelector("#uuidRun").addEventListener("click", () => {
      const count = Math.max(1, Math.min(100, safeNum(uuidCard.querySelector("#uuidCount").value, 10)));
      const list = [];
      for (let i = 0; i < count; i += 1) list.push(uuidv4());
      uuidCard.querySelector("#uuidOut").value = list.join("\n");
      pushHistory("UUID", `${count} generated`);
    });
    uuidCard.querySelector("#uuidCopy").addEventListener("click", () => copyText(uuidCard.querySelector("#uuidOut").value));
    uuidCard.querySelector("#uuidTxt").addEventListener("click", () => downloadText("uuids.txt", uuidCard.querySelector("#uuidOut").value));

    // 9 Password auditor
    const auditCard = makeCard("audit", "📋", "Password Auditor", `
      <div><label>Password</label><input id="audIn" type="text" placeholder="Enter password"></div>
      <div class="inline-row"><button class="btn btn-primary" id="audRun">Audit</button><button class="btn btn-secondary" id="audCopy">Copy Report</button><button class="btn btn-secondary" id="audTxt">TXT</button></div>
      <textarea id="audOut" class="result" rows="8" readonly></textarea>
    `);
    auditCard.querySelector("#audRun").addEventListener("click", () => {
      const p = auditCard.querySelector("#audIn").value;
      if (!p) {
        auditCard.querySelector("#audOut").value = "Password required.";
        return;
      }
      const s = strengthLabel(p);
      const checks = [
        ["Length >= 12", p.length >= 12],
        ["Lowercase present", /[a-z]/.test(p)],
        ["Uppercase present", /[A-Z]/.test(p)],
        ["Digit present", /\d/.test(p)],
        ["Symbol present", /[^A-Za-z0-9]/.test(p)],
        ["Not common password", !COMMON_PASSWORDS.has(p.toLowerCase())],
        ["No repeated triple chars", !/(.)\1{2,}/.test(p)]
      ];
      const report = [
        `Strength: ${s.label}`,
        `Entropy: ~${s.entropy} bits`,
        "",
        ...checks.map((c) => `${c[1] ? "PASS" : "FAIL"} - ${c[0]}`)
      ].join("\n");
      auditCard.querySelector("#audOut").value = report;
      pushHistory("Password Audit", s.label);
    });
    auditCard.querySelector("#audCopy").addEventListener("click", () => copyText(auditCard.querySelector("#audOut").value));
    auditCard.querySelector("#audTxt").addEventListener("click", () => downloadText("password-audit.txt", auditCard.querySelector("#audOut").value));

    // 10 Breach checker (local weak list)
    const weakCard = makeCard("breach", "🚨", "Weak Password Checker", `
      <p class="sec-hint">Offline quick check against common weak patterns. This does not query external breach APIs.</p>
      <div><label>Password</label><input id="wkIn" type="text" placeholder="Check quickly"></div>
      <div class="inline-row"><button class="btn btn-primary" id="wkRun">Check</button><button class="btn btn-secondary" id="wkCopy">Copy</button></div>
      <div id="wkOut" class="result">-</div>
    `);
    weakCard.querySelector("#wkRun").addEventListener("click", () => {
      const p = weakCard.querySelector("#wkIn").value.trim();
      if (!p) {
        weakCard.querySelector("#wkOut").textContent = "Password required.";
        return;
      }
      const low = p.toLowerCase();
      const weak = COMMON_PASSWORDS.has(low) || /12345|password|qwerty|admin/.test(low);
      const out = weak ? "High risk: common/guessable pattern detected." : "No common weak pattern detected in local list.";
      weakCard.querySelector("#wkOut").textContent = out;
      pushHistory("Weak Check", weak ? "high risk" : "not found");
    });
    weakCard.querySelector("#wkCopy").addEventListener("click", () => copyText(weakCard.querySelector("#wkOut").textContent));

    // 11 mask sensitive text
    const maskCard = makeCard("mask", "🙈", "Sensitive Text Masker", `
      <div><label>Input</label><input id="mskIn" type="text" placeholder="email, card, phone"></div>
      <div class="grid-2"><div><label>Show Start</label><input id="mskA" type="number" min="0" max="10" value="2"></div><div><label>Show End</label><input id="mskB" type="number" min="0" max="10" value="2"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="mskRun">Mask</button><button class="btn btn-secondary" id="mskCopy">Copy</button><button class="btn btn-secondary" id="mskTxt">TXT</button></div>
      <div id="mskOut" class="result">-</div>
    `);
    maskCard.querySelector("#mskRun").addEventListener("click", () => {
      const text = maskCard.querySelector("#mskIn").value;
      if (!text) return;
      const a = Math.max(0, Math.min(10, safeNum(maskCard.querySelector("#mskA").value, 2)));
      const b = Math.max(0, Math.min(10, safeNum(maskCard.querySelector("#mskB").value, 2)));
      let out = "";
      if (text.length <= a + b) out = "*".repeat(text.length);
      else out = `${text.slice(0, a)}${"*".repeat(text.length - a - b)}${text.slice(-b)}`;
      maskCard.querySelector("#mskOut").textContent = out;
      pushHistory("Mask", out.slice(0, 30));
    });
    maskCard.querySelector("#mskCopy").addEventListener("click", () => copyText(maskCard.querySelector("#mskOut").textContent));
    maskCard.querySelector("#mskTxt").addEventListener("click", () => downloadText("masked-output.txt", maskCard.querySelector("#mskOut").textContent));

    // 12 Security headers analyzer
    const hdrCard = makeCard("headers", "🛡️", "Security Headers Analyzer", `
      <p class="sec-hint">Paste HTTP response headers and get a quick security posture summary.</p>
      <div><label>Raw Headers</label><textarea id="hdrIn" rows="7" placeholder="strict-transport-security: max-age=31536000&#10;content-security-policy: default-src 'self'"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="hdrRun">Analyze</button><button class="btn btn-secondary" id="hdrCopy">Copy</button><button class="btn btn-secondary" id="hdrTxt">TXT</button></div>
      <textarea id="hdrOut" class="result" rows="8" readonly></textarea>
    `);
    hdrCard.querySelector("#hdrRun").addEventListener("click", () => {
      const raw = hdrCard.querySelector("#hdrIn").value.toLowerCase();
      if (!raw.trim()) {
        hdrCard.querySelector("#hdrOut").value = "Paste headers first.";
        return;
      }
      const checks = [
        ["Strict-Transport-Security", /strict-transport-security\s*:/.test(raw)],
        ["Content-Security-Policy", /content-security-policy\s*:/.test(raw)],
        ["X-Frame-Options / frame-ancestors", /x-frame-options\s*:|frame-ancestors/.test(raw)],
        ["X-Content-Type-Options", /x-content-type-options\s*:/.test(raw)],
        ["Referrer-Policy", /referrer-policy\s*:/.test(raw)],
        ["Permissions-Policy", /permissions-policy\s*:/.test(raw)]
      ];
      const score = checks.filter((c) => c[1]).length;
      const report = [
        `Security headers score: ${score}/${checks.length}`,
        ...checks.map((c) => `${c[1] ? "PASS" : "MISS"} - ${c[0]}`)
      ].join("\n");
      hdrCard.querySelector("#hdrOut").value = report;
      pushHistory("Headers", `${score}/${checks.length}`);
    });
    hdrCard.querySelector("#hdrCopy").addEventListener("click", () => copyText(hdrCard.querySelector("#hdrOut").value));
    hdrCard.querySelector("#hdrTxt").addEventListener("click", () => downloadText("security-headers-report.txt", hdrCard.querySelector("#hdrOut").value));

    // 13 checklist
    const checklistCard = makeCard("checklist", "✅", "Account Security Checklist", `
      <div class="inline-row"><button class="btn btn-primary" id="clRun">Generate</button><button class="btn btn-secondary" id="clCopy">Copy</button><button class="btn btn-secondary" id="clTxt">TXT</button></div>
      <textarea id="clOut" class="result" rows="10" readonly></textarea>
    `);
    checklistCard.querySelector("#clRun").addEventListener("click", () => {
      const out = [
        "Account Security Checklist",
        "- Unique password for every account",
        "- Enable MFA for email, banking, and cloud",
        "- Save backup codes offline",
        "- Review active sessions monthly",
        "- Rotate API tokens and revoke stale apps",
        "- Keep OS/browser auto-updates enabled",
        "- Verify domain before login (anti-phishing)",
        `Generated: ${new Date().toLocaleString()}`
      ].join("\n");
      checklistCard.querySelector("#clOut").value = out;
      pushHistory("Checklist", "generated");
    });
    checklistCard.querySelector("#clCopy").addEventListener("click", () => copyText(checklistCard.querySelector("#clOut").value));
    checklistCard.querySelector("#clTxt").addEventListener("click", () => downloadText("security-checklist.txt", checklistCard.querySelector("#clOut").value));

    // 14 history
    historyCardEl = makeCard("history", "📜", "Recent Security Activity", `
      <div id="secHistory" class="chip-list"><span class="empty-hint">No recent activity yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="histClear">Clear</button><button class="btn btn-secondary" id="histExport">Export TXT</button></div>
    `, { focusable: false });
    historyCardEl.classList.add("full-width");
    historyCardEl.querySelector("#histClear").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCardEl.querySelector("#histExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`security-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // Focus system
    const overlay = document.createElement("div");
    overlay.className = "sec-focus-overlay";
    const host = document.createElement("div");
    host.className = "sec-focus-host";
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
      document.body.classList.add("sec-modal-open");
      overlay.classList.add("active");
      host.classList.add("active");
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
      document.body.classList.remove("sec-modal-open");
      overlay.classList.remove("active");
      host.classList.remove("active");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".sec-card"))));
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

  window.QwicktonCategoryInits["security-tools"] = initSecurityTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initSecurityTools();
  });
})();
/**
 * SECURITY TOOLS - Complete JavaScript
 * Tools: Password Generator, Passphrase Generator, Encoder/Decoder, Hash Generator, Password Auditor
 * Architecture: IIFE module, global register, double-init protection
 */

(function() {
  "use strict";

  // Register in global QwicktonCategoryInits
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function safeNum(v, d = 0) { let n = Number(v); return isFinite(n) ? n : d; }
  
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function copyText(text) { 
    if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); 
  }
  
  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  
  function base64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str)));
  }
  
  function secureRandomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  
  function shuffleString(input) {
    const arr = input.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }
  
  function scorePassword(value) {
    if (!value) return { score: 0, label: "Very Weak", entropy: 0 };
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);
    let pool = 0;
    if (hasUpper) pool += 26;
    if (hasLower) pool += 26;
    if (hasDigit) pool += 10;
    if (hasSymbol) pool += 33;
    const entropy = value.length * Math.log2(pool || 1);
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (value.length >= 16) score++;
    if (hasUpper && hasLower) score++;
    if (hasDigit) score++;
    if (hasSymbol) score++;
    const label = score >= 6 ? "Very Strong" : score >= 5 ? "Strong" : score >= 4 ? "Good" : score >= 3 ? "Medium" : "Weak";
    return { score, label, entropy: Number(entropy.toFixed(1)) };
  }
  
  async function digestText(text, algorithm) {
    if (!window.crypto?.subtle) throw new Error("Web Crypto not available");
    const buffer = await window.crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Word bank for passphrases
  const WORD_BANK = [
    "aurora", "shield", "matrix", "titan", "quantum", "harbor", "falcon", "nebula",
    "cipher", "vertex", "prairie", "ember", "delta", "zenith", "atlas", "pixel",
    "omega", "ranger", "zen", "sierra", "echo", "novel", "pioneer", "horizon",
    "cascade", "phoenix", "radiant", "solace", "tempo", "valiant"
  ];

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-security-history";
  
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } 
    catch { return []; }
  }
  
  function writeHistory(items) { 
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10))); 
  }
  
  function pushHistory(label, value, renderFn) {
    if (!value) return;
    writeHistory([{ label, value: String(value).slice(0, 160), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initSecurityTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.securityToolsInitialized === "true") return;
    grid.dataset.securityToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "sec-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="sec-card-header">
          <div class="sec-card-icon">${icon}</div>
          <h3 class="sec-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary sec-focus-btn" data-focus-open>Open</button>
            <button class="btn btn-secondary sec-focus-inline-close" data-focus-close>Close</button>
          ` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    // ============================================
    // RENDER HISTORY FUNCTION
    // ============================================
    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const historyContainer = historyCardEl.querySelector("#securityHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No recent activity yet.</span>';
        return;
      }
      historyContainer.innerHTML = items.map((item, idx) => 
        `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</button>`
      ).join("");
      historyContainer.querySelectorAll("[data-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          copyText(items[idx]?.value || "");
        });
      });
    }

    // ============================================
    // PASSWORD GENERATOR CARD
    // ============================================
    const passCard = makeCard("password", "🔐", "Password Studio Pro", `
      <div class="grid-2">
        <div><label>Length (6-128)</label><input id="pLen" type="number" value="16" min="6" max="128"></div>
        <div><label>Count (1-10)</label><input id="pCount" type="number" value="1" min="1" max="10"></div>
      </div>
      <div class="inline-row">
        <label><input type="checkbox" id="pUpper" checked> A-Z</label>
        <label><input type="checkbox" id="pLower" checked> a-z</label>
        <label><input type="checkbox" id="pDigits" checked> 0-9</label>
        <label><input type="checkbox" id="pSymbols" checked> !@#$%</label>
        <label><input type="checkbox" id="pNoAmbiguous" checked> Avoid ambiguous</label>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="pGen">✨ Generate Passwords</button>
        <button class="btn btn-secondary" id="pCopy">📋 Copy First</button>
      </div>
      <div><label>Generated Passwords</label><textarea id="pRes" class="result" placeholder="Passwords will appear here..."></textarea></div>
      <div id="pMeta" class="result" style="margin-top:0.5rem;">Strength: - | Entropy: -</div>
    `);

    passCard.querySelector("#pGen").onclick = () => {
      const len = Math.min(128, Math.max(6, safeNum(passCard.querySelector("#pLen").value, 16)));
      const count = Math.min(10, Math.max(1, safeNum(passCard.querySelector("#pCount").value, 1)));
      const noAmbiguous = passCard.querySelector("#pNoAmbiguous").checked;
      
      let groups = [];
      if (passCard.querySelector("#pUpper").checked)
        groups.push(noAmbiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      if (passCard.querySelector("#pLower").checked)
        groups.push(noAmbiguous ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz");
      if (passCard.querySelector("#pDigits").checked)
        groups.push(noAmbiguous ? "23456789" : "0123456789");
      if (passCard.querySelector("#pSymbols").checked)
        groups.push("!@#$%^&*()_+-=[]{}|;:,.<>?~");
      
      if (!groups.length) groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789"];
      
      const chars = groups.join("");
      const passwords = [];
      for (let c = 0; c < count; c++) {
        let out = "";
        groups.forEach(group => out += group[secureRandomInt(group.length)]);
        while (out.length < len) out += chars[secureRandomInt(chars.length)];
        passwords.push(shuffleString(out));
      }
      
      const output = passwords.join("\n");
      const first = passwords[0] || "";
      const score = scorePassword(first);
      
      passCard.querySelector("#pRes").value = output;
      passCard.querySelector("#pMeta").innerHTML = `🔒 Strength: ${score.label} (${score.score}/6) | 🔐 Entropy: ~${score.entropy} bits`;
      pushHistory("Password", first.slice(0, 30), renderHistory);
    };
    
    passCard.querySelector("#pCopy").onclick = () => {
      const first = (passCard.querySelector("#pRes").value || "").split("\n")[0] || "";
      copyText(first);
    };

    // ============================================
    // PASSPHRASE GENERATOR CARD
    // ============================================
    const phraseCard = makeCard("phrase", "🔑", "Passphrase Generator", `
      <div class="grid-2">
        <div><label>Number of Words (3-8)</label><input id="phraseWords" type="number" min="3" max="8" value="4"></div>
        <div><label>Separator</label><select id="phraseSep">
          <option value="-">Hyphen (-)</option>
          <option value="_">Underscore (_)</option>
          <option value=".">Dot (.)</option>
          <option value=" ">Space</option>
        </select></div>
      </div>
      <div class="inline-row">
        <label><input type="checkbox" id="phraseCap" checked> Capitalize words</label>
        <label><input type="checkbox" id="phraseDigits" checked> Add ending digits</label>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="phraseGen">✨ Generate Passphrase</button>
        <button class="btn btn-secondary" id="phraseCopy">📋 Copy</button>
      </div>
      <div id="phraseRes" class="result">-</div>
    `);

    phraseCard.querySelector("#phraseGen").onclick = () => {
      const wordsCount = Math.min(8, Math.max(3, safeNum(phraseCard.querySelector("#phraseWords").value, 4)));
      const sep = phraseCard.querySelector("#phraseSep").value;
      const cap = phraseCard.querySelector("#phraseCap").checked;
      const addDigits = phraseCard.querySelector("#phraseDigits").checked;
      
      const words = [];
      for (let i = 0; i < wordsCount; i++) {
        const pick = WORD_BANK[secureRandomInt(WORD_BANK.length)];
        words.push(cap ? pick.charAt(0).toUpperCase() + pick.slice(1) : pick);
      }
      let passphrase = words.join(sep);
      if (addDigits) passphrase += `${sep}${secureRandomInt(10)}${secureRandomInt(10)}`;
      
      phraseCard.querySelector("#phraseRes").innerHTML = passphrase;
      pushHistory("Passphrase", passphrase, renderHistory);
    };
    
    phraseCard.querySelector("#phraseCopy").onclick = () => copyText(phraseCard.querySelector("#phraseRes").innerHTML);

    // ============================================
    // ENCODING TOOLKIT CARD
    // ============================================
    const codecCard = makeCard("encoding", "📦", "Encoding Toolkit", `
      <div><label>Input Text</label><textarea id="codecInput" rows="4" placeholder="Enter text to encode/decode..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="bEnc">📦 Base64 Encode</button>
        <button class="btn btn-primary" id="bDec">📂 Base64 Decode</button>
        <button class="btn btn-secondary" id="urlEnc">🔗 URL Encode</button>
        <button class="btn btn-secondary" id="urlDec">🔓 URL Decode</button>
      </div>
      <div><label>Output</label><textarea id="codecRes" class="result" placeholder="Output will appear here..."></textarea></div>
    `);

    const codecInput = codecCard.querySelector("#codecInput");
    const codecRes = codecCard.querySelector("#codecRes");

    codecCard.querySelector("#bEnc").onclick = () => {
      try {
        const out = utf8ToBase64(codecInput.value);
        codecRes.value = out;
        pushHistory("Base64 Encode", out.slice(0, 50), renderHistory);
      } catch (e) {
        codecRes.value = `Error: ${e.message}`;
      }
    };
    
    codecCard.querySelector("#bDec").onclick = () => {
      try {
        const out = base64ToUtf8(codecInput.value);
        codecRes.value = out;
        pushHistory("Base64 Decode", out.slice(0, 50), renderHistory);
      } catch (e) {
        codecRes.value = `Error: Invalid Base64 input`;
      }
    };
    
    codecCard.querySelector("#urlEnc").onclick = () => {
      try {
        const out = encodeURIComponent(codecInput.value);
        codecRes.value = out;
        pushHistory("URL Encode", out.slice(0, 50), renderHistory);
      } catch (e) {
        codecRes.value = `Error: ${e.message}`;
      }
    };
    
    codecCard.querySelector("#urlDec").onclick = () => {
      try {
        const out = decodeURIComponent(codecInput.value);
        codecRes.value = out;
        pushHistory("URL Decode", out.slice(0, 50), renderHistory);
      } catch (e) {
        codecRes.value = `Error: Invalid URL encoded input`;
      }
    };

    // ============================================
    // HASH GENERATOR CARD
    // ============================================
    const hashCard = makeCard("hash", "🔒", "Hash Generator (SHA)", `
      <div><label>Input Text</label><textarea id="hashInput" rows="4" placeholder="Enter text to hash..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="sha256Btn">🔐 SHA-256</button>
        <button class="btn btn-secondary" id="sha512Btn">🔐 SHA-512</button>
        <button class="btn btn-secondary" id="hashCopyBtn">📋 Copy Hash</button>
      </div>
      <div><label>Hash Output</label><textarea id="hashRes" class="result" placeholder="Hash will appear here..."></textarea></div>
      <div id="hashMeta" class="result" style="margin-top:0.5rem;">Ready</div>
    `);

    async function runHash(algorithm) {
      const input = hashCard.querySelector("#hashInput").value;
      if (!input) {
        hashCard.querySelector("#hashMeta").innerHTML = "⚠️ Please enter text to hash";
        return;
      }
      try {
        const out = await digestText(input, algorithm);
        hashCard.querySelector("#hashRes").value = out;
        hashCard.querySelector("#hashMeta").innerHTML = `✅ ${algorithm} generated (${out.length} hex chars)`;
        pushHistory(algorithm, out.slice(0, 40), renderHistory);
      } catch (e) {
        hashCard.querySelector("#hashMeta").innerHTML = `❌ Hash generation failed: ${e.message}`;
      }
    }

    hashCard.querySelector("#sha256Btn").onclick = () => runHash("SHA-256");
    hashCard.querySelector("#sha512Btn").onclick = () => runHash("SHA-512");
    hashCard.querySelector("#hashCopyBtn").onclick = () => copyText(hashCard.querySelector("#hashRes").value);

    // ============================================
    // PASSWORD AUDITOR CARD
    // ============================================
    const auditCard = makeCard("audit", "📋", "Password Policy Auditor", `
      <div><label>Password to Audit</label><textarea id="policyInput" rows="3" placeholder="Enter password to check against security policy..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="policyAuditBtn">🔍 Run Audit</button>
        <button class="btn btn-secondary" id="policyCopyBtn">📋 Copy Report</button>
      </div>
      <div><label>Audit Report</label><textarea id="policyResult" class="result" rows="6" placeholder="Audit results will appear here..."></textarea></div>
    `);

    auditCard.querySelector("#policyAuditBtn").onclick = () => {
      const value = (auditCard.querySelector("#policyInput").value || "").trim();
      if (!value) {
        auditCard.querySelector("#policyResult").value = "⚠️ Please enter a password to audit";
        return;
      }
      
      const checks = [
        { label: "Length >= 12 characters", pass: value.length >= 12 },
        { label: "Contains uppercase letter (A-Z)", pass: /[A-Z]/.test(value) },
        { label: "Contains lowercase letter (a-z)", pass: /[a-z]/.test(value) },
        { label: "Contains digit (0-9)", pass: /\d/.test(value) },
        { label: "Contains special character (!@#$%^&*)", pass: /[^A-Za-z0-9]/.test(value) },
        { label: "No common patterns (repeated chars)", pass: !/(.)\1{2,}/.test(value) }
      ];
      
      const passed = checks.filter(c => c.pass).length;
      const score = scorePassword(value);
      
      const report = [
        "╔══════════════════════════════════════════════════════════════╗",
        "║                    PASSWORD AUDIT REPORT                     ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        `📊 Overall Strength: ${score.label} (${score.score}/6)`,
        `🔐 Entropy: ~${score.entropy} bits`,
        "",
        "📋 Policy Checks:",
        ...checks.map(c => `${c.pass ? "✅ PASS" : "❌ FAIL"} - ${c.label}`),
        "",
        `📈 Score: ${passed}/${checks.length} requirements met`,
        "",
        score.label === "Very Strong" ? "🎉 This password meets excellent security standards!" :
        score.label === "Strong" ? "👍 Good password, consider making it longer or adding symbols." :
        "⚠️ This password is weak. Consider using the password generator above."
      ].join("\n");
      
      auditCard.querySelector("#policyResult").value = report;
      pushHistory("Password Audit", `${score.label} (${score.score}/6)`, renderHistory);
    };
    
    auditCard.querySelector("#policyCopyBtn").onclick = () => copyText(auditCard.querySelector("#policyResult").value);

    // ============================================
    // RANDOM HEX TOKEN
    // ============================================
    const tokCard = makeCard("token", "🎫", "Random Hex Token", `
      <div class="grid-2">
        <div><label>Byte length</label><input type="number" id="tokN" value="32" min="8" max="64"></div>
        <div><label>Format</label><select id="tokFmt"><option value="hex">Lowercase hex</option><option value="b64">Base64url</option></select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="tokGen">Generate</button>
        <button class="btn btn-secondary" id="tokCopy">Copy</button>
      </div>
      <textarea id="tokOut" class="result" rows="3" readonly></textarea>
    `);
    function randBytes(n) {
      const u = new Uint8Array(n);
      crypto.getRandomValues(u);
      return u;
    }
    tokCard.querySelector("#tokGen").onclick = () => {
      const n = Math.max(8, Math.min(64, safeNum(tokCard.querySelector("#tokN").value, 32)));
      const b = randBytes(n);
      if (tokCard.querySelector("#tokFmt").value === "b64") {
        let bin = "";
        b.forEach((x) => { bin += String.fromCharCode(x); });
        tokCard.querySelector("#tokOut").value = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      } else {
        tokCard.querySelector("#tokOut").value = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
      }
      pushHistory("Token", "generated", renderHistory);
    };
    tokCard.querySelector("#tokCopy").onclick = () => copyText(tokCard.querySelector("#tokOut").value);

    // ============================================
    // NUMERIC PIN
    // ============================================
    const pinCard = makeCard("pin", "🔢", "Numeric PIN Generator", `
      <div class="grid-2">
        <div><label>Digits</label><input type="number" id="pinLen" value="6" min="4" max="12"></div>
        <div><label>Count</label><input type="number" id="pinCnt" value="3" min="1" max="10"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="pinGen">Generate</button>
        <button class="btn btn-secondary" id="pinCopy">Copy</button>
      </div>
      <textarea id="pinOut" class="result" rows="4" readonly></textarea>
    `);
    pinCard.querySelector("#pinGen").onclick = () => {
      const len = Math.max(4, Math.min(12, safeNum(pinCard.querySelector("#pinLen").value, 6)));
      const cnt = Math.max(1, Math.min(10, safeNum(pinCard.querySelector("#pinCnt").value, 3)));
      const lines = [];
      for (let i = 0; i < cnt; i++) {
        let s = "";
        const b = randBytes(len);
        for (let j = 0; j < len; j++) s += String(b[j] % 10);
        lines.push(s);
      }
      pinCard.querySelector("#pinOut").value = lines.join("\n");
    };
    pinCard.querySelector("#pinCopy").onclick = () => copyText(pinCard.querySelector("#pinOut").value);

    // ============================================
    // MASK SENSITIVE STRING
    // ============================================
    const maskCard = makeCard("mask", "🙈", "Mask Sensitive Text", `
      <div><label>Input</label><input type="text" id="mskIn" placeholder="Email, phone, card…"></div>
      <div class="grid-2">
        <div><label>Visible start</label><input type="number" id="mskA" value="2" min="0" max="8"></div>
        <div><label>Visible end</label><input type="number" id="mskB" value="2" min="0" max="8"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="mskRun">Mask</button>
        <button class="btn btn-secondary" id="mskCopy">Copy</button>
      </div>
      <div id="mskOut" class="result" style="font-family:monospace">—</div>
    `);
    maskCard.querySelector("#mskRun").onclick = () => {
      const raw = maskCard.querySelector("#mskIn").value.trim();
      if (!raw) return;
      const a = Math.max(0, Math.min(8, safeNum(maskCard.querySelector("#mskA").value, 2)));
      const b = Math.max(0, Math.min(8, safeNum(maskCard.querySelector("#mskB").value, 2)));
      if (raw.length <= a + b) {
        maskCard.querySelector("#mskOut").textContent = "•".repeat(raw.length);
        return;
      }
      maskCard.querySelector("#mskOut").textContent = raw.slice(0, a) + "•".repeat(raw.length - a - b) + raw.slice(-b);
    };
    maskCard.querySelector("#mskCopy").onclick = () => copyText(maskCard.querySelector("#mskOut").textContent);

    // ============================================
    // SECURITY CHECKLIST
    // ============================================
    const chkCard = makeCard("secchk", "✅", "Account Security Checklist", `
      <div class="inline-row">
        <button class="btn btn-primary" id="chkGen">Generate checklist</button>
        <button class="btn btn-secondary" id="chkCopy">Copy</button>
      </div>
      <textarea id="chkOut" class="result" rows="12" readonly></textarea>
    `);
    chkCard.querySelector("#chkGen").onclick = () => {
      chkCard.querySelector("#chkOut").value = [
        "Account security checklist",
        "☐ Unique password per site (use a password manager)",
        "☐ Multi-factor authentication enabled where available",
        "☐ Recovery codes stored offline",
        "☐ Review active sessions / devices monthly",
        "☐ Revoke unused API keys and app tokens",
        "☐ Verify email and phone for account recovery",
        "☐ Beware phishing — check domain before login",
        `Generated ${new Date().toLocaleString()} · Qwickton`
      ].join("\n");
    };
    chkCard.querySelector("#chkCopy").onclick = () => copyText(chkCard.querySelector("#chkOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Security Activity", `
      <div id="securityHistory" class="chip-list"><span class="empty-hint">No recent activity yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="clearSecurityHistory">🗑️ Clear Activity</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearSecurityHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "sec-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "sec-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);

    let activeFocusedCard = null;
    let focusPlaceholder = null;
    let focusOpenTimer = null;

    function openToolFocus(card) {
      if (!card) return;
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (activeFocusedCard === card) return;
      if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused");
      activeFocusedCard = card;
      focusPlaceholder = document.createElement("div");
      focusPlaceholder.style.height = card.offsetHeight + "px";
      card.parentNode.insertBefore(focusPlaceholder, card);
      focusHost.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      document.body.classList.add("sec-modal-open");
      focusOverlay.classList.add("active");
      focusHost.classList.add("active");
      setTimeout(() => {
        const firstInput = card.querySelector("input, select, textarea, button");
        firstInput?.focus();
      }, 40);
    }

    function closeToolFocus() {
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (!activeFocusedCard) return;
      activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeFocusedCard.classList.remove("is-focused");
      if (focusPlaceholder?.parentNode) {
        focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder);
        focusPlaceholder.remove();
      }
      focusPlaceholder = null;
      activeFocusedCard = null;
      focusHost.classList.remove("active");
      focusOverlay.classList.remove("active");
      document.body.classList.remove("sec-modal-open");
    }

    grid.querySelectorAll(".sec-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".sec-card")));
    });
    
    grid.querySelectorAll(".sec-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".sec-card[data-focusable='true'] .sec-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".sec-card"));
      });
    });
    
    focusOverlay.addEventListener("click", () => closeToolFocus());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeToolFocus(); });

    // ============================================
    // NAVIGATION BUTTONS
    // ============================================
    document.querySelectorAll(".tool-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-target");
        const card = document.getElementById(`card-${target}`);
        if (!card) return;
        const mobileLike = window.matchMedia("(max-width: 768px)").matches;
        if (mobileLike) {
          openToolFocus(card);
        } else {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          focusOpenTimer = setTimeout(() => openToolFocus(card), 200);
        }
      });
    });

    // ============================================
    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["security-tools"] = initSecurityTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initSecurityTools(null);
    }
  });
})();