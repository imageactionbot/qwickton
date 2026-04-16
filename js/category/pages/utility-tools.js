/**
 * UTILITY TOOLS - Complete JavaScript
 * Tools: QR Pattern Generator, UUID & Token Generator, Text Checksum
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
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function localeOptions() {
    const presets = [
      { code: "en-US", label: "United States" },
      { code: "en-IN", label: "India" },
      { code: "en-GB", label: "United Kingdom" },
      { code: "de-DE", label: "Germany" },
      { code: "fr-FR", label: "France" },
      { code: "ja-JP", label: "Japan" }
    ];
    return presets.map((item) => `<option value="${item.code}">${item.label} (${item.code})</option>`).join("");
  }
  
  function secureRandomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-utility-history";
  
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } 
    catch { return []; }
  }
  
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
    } catch (error) {
      void error;
    }
  }
  
  function pushHistory(type, text, renderFn) {
    if (!text) return;
    writeHistory([{ type, text: String(text).slice(0, 160), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initUtilityTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.utilityToolsInitialized === "true") return;
    grid.dataset.utilityToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "util-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="util-card-header">
          <div class="util-card-icon">${icon}</div>
          <h3 class="util-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary util-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary util-focus-inline-close" type="button" data-focus-close>Close</button>
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
      const historyContainer = historyCardEl.querySelector("#utilHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No utility outputs yet.</span>';
        return;
      }
      historyContainer.innerHTML = items.map((item, idx) => 
        `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`
      ).join("");
      historyContainer.querySelectorAll("[data-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          copyText(items[idx]?.text || "");
        });
      });
    }

    // ============================================
    // QR PATTERN GENERATOR CARD
    // ============================================
    const qrCard = makeCard("qr", "📱", "QR Pattern Generator Pro", `
      <div><label>Text or URL</label><input id="qrInput" type="text" placeholder="Enter text or URL to encode" value="Qwickton"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="qrBtn">✨ Generate Pattern</button>
        <button class="btn btn-secondary" type="button" id="qrDownloadBtn">💾 Download PNG</button>
      </div>
      <div class="preview-wrap"><canvas id="qrCanvas" width="240" height="240"></canvas></div>
      <div id="qrMeta" class="result">Ready - Enter text and click Generate</div>
      <div class="small">🔍 Visual QR-like pattern generator. Perfect for local utility use.</div>
    `);

    const canvas = qrCard.querySelector("#qrCanvas");
    const ctx = canvas.getContext("2d");
    
    function drawPattern(text) {
      const size = 29;
      const cell = Math.floor(canvas.width / size);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--util-surface').trim() || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      function hash(i, j) {
        let h = 0;
        const str = `${text}-${i}-${j}`;
        for (let k = 0; k < str.length; k++) h = (h * 31 + str.charCodeAt(k)) % 9973;
        return h;
      }
      
      const darkColor = getComputedStyle(document.body).getPropertyValue('--util-text').trim() || "#111827";
      const lightColor = getComputedStyle(document.body).getPropertyValue('--util-surface').trim() || "#ffffff";
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const finder = (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
          const on = finder || hash(x, y) % 2 === 0;
          ctx.fillStyle = on ? darkColor : lightColor;
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
      qrCard.querySelector("#qrMeta").innerHTML = `✅ Pattern generated for "${text.length > 50 ? text.slice(0, 50) + '...' : text}"`;
    }
    
    qrCard.querySelector("#qrBtn").onclick = () => {
      const text = qrCard.querySelector("#qrInput").value || "Qwickton";
      drawPattern(text);
      pushHistory("QR Pattern", text, renderHistory);
    };
    
    qrCard.querySelector("#qrDownloadBtn").onclick = () => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "qr-pattern.png";
      link.click();
    };
    
    // Initial draw
    drawPattern("Qwickton");

    // ============================================
    // UUID & TOKEN GENERATOR CARD
    // ============================================
    const uuidCard = makeCard("uuid", "🔑", "UUID & Token Generator", `
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="uuidBtn">🔐 Generate UUID</button>
        <button class="btn btn-secondary" type="button" id="tokenBtn">🎲 Generate Token</button>
        <button class="btn btn-secondary" type="button" id="uuidCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="uuidDownloadBtn">⬇️ TXT</button>
      </div>
      <textarea id="uuidRes" class="result" rows="3" placeholder="Generated UUID or token will appear here..."></textarea>
    `);

    uuidCard.querySelector("#uuidBtn").onclick = () => {
      let out;
      if (window.crypto && crypto.randomUUID) {
        out = crypto.randomUUID();
      } else {
        out = `${Date.now().toString(16)}-${secureRandomInt(1e9).toString(16)}-${secureRandomInt(1e9).toString(16)}`;
      }
      uuidCard.querySelector("#uuidRes").value = out;
      pushHistory("UUID", out, renderHistory);
    };
    
    uuidCard.querySelector("#tokenBtn").onclick = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      let out = "";
      for (let i = 0; i < 40; i++) out += chars[secureRandomInt(chars.length)];
      uuidCard.querySelector("#uuidRes").value = out;
      pushHistory("Token", out.slice(0, 30) + "...", renderHistory);
    };
    
    uuidCard.querySelector("#uuidCopyBtn").onclick = () => copyText(uuidCard.querySelector("#uuidRes").value);
    uuidCard.querySelector("#uuidDownloadBtn").onclick = () => downloadTextFile("uuid-token-output.txt", uuidCard.querySelector("#uuidRes").value);

    // ============================================
    // TEXT CHECKSUM CARD
    // ============================================
    const checksumCard = makeCard("checksum", "🔢", "Simple Text Checksum", `
      <div><label>Input Text</label><textarea id="utilChecksumInput" rows="5" placeholder="Paste text to generate checksum..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="utilChecksumBtn">🔢 Generate Checksum</button>
        <button class="btn btn-secondary" type="button" id="utilChecksumCopy">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="utilChecksumDownload">⬇️ TXT</button>
      </div>
      <div id="utilChecksumResult" class="result">Checksum: -</div>
    `);

    checksumCard.querySelector("#utilChecksumBtn").onclick = () => {
      const value = checksumCard.querySelector("#utilChecksumInput").value || "";
      if (!value) {
        checksumCard.querySelector("#utilChecksumResult").innerHTML = "⚠️ Please enter some text";
        return;
      }
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
      }
      const out = `🔢 Checksum: ${hash.toString(16).padStart(8, "0")} (decimal: ${hash})`;
      checksumCard.querySelector("#utilChecksumResult").innerHTML = out;
      pushHistory("Checksum", out.slice(0, 60), renderHistory);
    };
    
    checksumCard.querySelector("#utilChecksumCopy").onclick = () => copyText(checksumCard.querySelector("#utilChecksumResult").innerHTML);
    checksumCard.querySelector("#utilChecksumDownload").onclick = () => downloadTextFile("checksum-result.txt", checksumCard.querySelector("#utilChecksumResult").textContent);

    // ============================================
    // JSON PRETTY + SORT KEYS
    // ============================================
    const jsonCard = makeCard("jsonsort", "{ }", "JSON Sort Keys", `
      <div><label>JSON</label><textarea id="jsIn" rows="4" placeholder='{"b":1,"a":2}'></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="jsBtn">Format</button>
        <button class="btn btn-secondary" id="jsCopy">Copy</button>
      </div>
      <textarea id="jsOut" class="result" rows="6" readonly></textarea>
    `);
    function sortObj(obj) {
      if (obj === null || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(sortObj);
      return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortObj(obj[k]); return acc; }, {});
    }
    jsonCard.querySelector("#jsBtn").onclick = () => {
      try {
        const o = JSON.parse(jsonCard.querySelector("#jsIn").value || "{}");
        jsonCard.querySelector("#jsOut").value = JSON.stringify(sortObj(o), null, 2);
      } catch (e) {
        jsonCard.querySelector("#jsOut").value = "Invalid JSON: " + e.message;
      }
    };
    jsonCard.querySelector("#jsCopy").onclick = () => copyText(jsonCard.querySelector("#jsOut").value);

    // ============================================
    // PERCENT CHANGE
    // ============================================
    const pctCard = makeCard("pctchg", "📈", "Percent Change", `
      <div class="grid-2">
        <div><label>Old value</label><input type="number" id="pcO" value="100"></div>
        <div><label>New value</label><input type="number" id="pcN" value="115"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="pcBtn">Calculate</button>
      </div>
      <div id="pcOut" class="result"></div>
    `);
    pctCard.querySelector("#pcBtn").onclick = () => {
      const o = safeNum(pctCard.querySelector("#pcO").value, 0);
      const n = safeNum(pctCard.querySelector("#pcN").value, 0);
      if (o === 0) { pctCard.querySelector("#pcOut").textContent = "Old value cannot be 0."; return; }
      const ch = ((n - o) / o) * 100;
      pctCard.querySelector("#pcOut").textContent = `Change: ${ch >= 0 ? "+" : ""}${ch.toFixed(2)}% (${o} → ${n})`;
    };

    // ============================================
    // COUNTDOWN TO DATE
    // ============================================
    const cdCard = makeCard("countdown", "⏳", "Countdown to Date", `
      <div><label>Target datetime</label><input type="datetime-local" id="cdT"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="cdBtn">Update</button>
        <button class="btn btn-secondary" id="cdCopy">Copy text</button>
      </div>
      <div id="cdOut" class="result"></div>
    `);
    cdCard.querySelector("#cdBtn").onclick = () => {
      const v = cdCard.querySelector("#cdT").value;
      if (!v) return;
      const end = new Date(v);
      const now = new Date();
      const ms = end - now;
      if (ms < 0) { cdCard.querySelector("#cdOut").textContent = "Date is in the past."; return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      cdCard.querySelector("#cdOut").textContent = `${d}d ${h}h until target`;
    };
    cdCard.querySelector("#cdCopy").onclick = () => copyText(cdCard.querySelector("#cdOut").textContent);

    // ============================================
    // TEXT TO ASCII BYTES
    // ============================================
    const byteCard = makeCard("utf8hex", "0x", "UTF-8 Hex View", `
      <div><label>Text</label><input type="text" id="uhIn" value="Hi"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="uhBtn">Show hex</button>
        <button class="btn btn-secondary" id="uhCopy">Copy</button>
      </div>
      <div id="uhOut" class="result" style="word-break:break-all;font-family:monospace;font-size:0.8rem"></div>
    `);
    byteCard.querySelector("#uhBtn").onclick = () => {
      const enc = new TextEncoder().encode(byteCard.querySelector("#uhIn").value);
      byteCard.querySelector("#uhOut").textContent = [...enc].map((b) => b.toString(16).padStart(2, "0")).join(" ");
    };
    byteCard.querySelector("#uhCopy").onclick = () => copyText(byteCard.querySelector("#uhOut").textContent);

    // ============================================
    // ROLLING / DICE SUM
    // ============================================
    const diceSumCard = makeCard("dicesum", "🎲", "Dice Sum Roller", `
      <div class="grid-2">
        <div><label>Dice count</label><input type="number" id="dsN" value="2" min="1" max="20"></div>
        <div><label>Sides</label><input type="number" id="dsS" value="6" min="2" max="100"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="dsBtn">Roll</button>
        <button class="btn btn-secondary" id="dsCopy">Copy</button>
      </div>
      <div id="dsOut" class="result"></div>
    `);
    diceSumCard.querySelector("#dsBtn").onclick = () => {
      const n = Math.max(1, Math.min(20, safeNum(diceSumCard.querySelector("#dsN").value, 2)));
      const s = Math.max(2, Math.min(100, safeNum(diceSumCard.querySelector("#dsS").value, 6)));
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const r = 1 + secureRandomInt(s);
        rolls.push(r);
        sum += r;
      }
      diceSumCard.querySelector("#dsOut").textContent = `Rolled: ${rolls.join("+")} = ${sum}`;
    };
    diceSumCard.querySelector("#dsCopy").onclick = () => copyText(diceSumCard.querySelector("#dsOut").textContent);

    // ============================================
    // BROWSER INFO SNIPPET
    // ============================================
    const navCard = makeCard("navinfo", "🌐", "Browser Quick Info", `
      <div class="inline-row">
        <button class="btn btn-primary" id="nvBtn">Collect</button>
        <button class="btn btn-secondary" id="nvCopy">Copy</button>
      </div>
      <textarea id="nvOut" class="result" rows="5" readonly></textarea>
    `);
    navCard.querySelector("#nvBtn").onclick = () => {
      navCard.querySelector("#nvOut").value = [
        `User agent: ${navigator.userAgent}`,
        `Language: ${navigator.language}`,
        `Platform: ${navigator.platform || "n/a"}`,
        `Viewport: ${window.innerWidth}×${window.innerHeight}`,
        `Device pixel ratio: ${window.devicePixelRatio || 1}`,
        `Online: ${navigator.onLine}`
      ].join("\n");
    };
    navCard.querySelector("#nvCopy").onclick = () => copyText(navCard.querySelector("#nvOut").value);

    // ============================================
    // LOCALE NUMBER/DATE FORMATTER
    // ============================================
    const localeCard = makeCard("locale", "🌍", "Global Locale Formatter", `
      <div class="grid-2">
        <div><label>Number</label><input type="number" id="locNum" value="1234567.89" step="0.01"></div>
        <div><label>Locale / Country</label><select id="locSel">${localeOptions()}</select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="locBtn">Format</button>
        <button class="btn btn-secondary" type="button" id="locCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="locDownload">⬇️ TXT</button>
      </div>
      <textarea id="locOut" class="result" rows="5" readonly></textarea>
    `);
    localeCard.querySelector("#locBtn").onclick = () => {
      const value = safeNum(localeCard.querySelector("#locNum").value, 0);
      const locale = localeCard.querySelector("#locSel").value || "en-US";
      const now = new Date();
      const out = [
        `Locale: ${locale}`,
        `Number: ${new Intl.NumberFormat(locale).format(value)}`,
        `Currency-ish: ${new Intl.NumberFormat(locale, { style: "currency", currency: locale === "en-IN" ? "INR" : locale === "ja-JP" ? "JPY" : "USD" }).format(value)}`,
        `Percent: ${new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(value / 100)}`,
        `Date: ${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(now)}`
      ].join("\n");
      localeCard.querySelector("#locOut").value = out;
      pushHistory("Locale Format", `${locale} ${value}`, renderHistory);
    };
    localeCard.querySelector("#locCopy").onclick = () => copyText(localeCard.querySelector("#locOut").value);
    localeCard.querySelector("#locDownload").onclick = () => downloadTextFile("locale-format-output.txt", localeCard.querySelector("#locOut").value);

    // ============================================
    // TIMEZONE PLANNER
    // ============================================
    const tzCard = makeCard("timezone", "🕒", "Timezone Planner", `
      <div class="grid-2">
        <div><label>Date</label><input type="date" id="tzDate"></div>
        <div><label>Time</label><input type="time" id="tzTime" value="10:00"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="tzBtn">Build Schedule</button>
        <button class="btn btn-secondary" type="button" id="tzCopy">Copy</button>
      </div>
      <textarea id="tzOut" class="result" rows="6" readonly></textarea>
    `);
    tzCard.querySelector("#tzBtn").onclick = () => {
      const date = tzCard.querySelector("#tzDate").value;
      const time = tzCard.querySelector("#tzTime").value;
      if (!date || !time) {
        tzCard.querySelector("#tzOut").value = "Please select both date and time.";
        return;
      }
      const dt = new Date(`${date}T${time}:00`);
      const zones = ["UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"];
      const lines = ["Timezone schedule:"];
      zones.forEach((zone) => {
        lines.push(`${zone}: ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(dt)}`);
      });
      tzCard.querySelector("#tzOut").value = lines.join("\n");
      pushHistory("Timezone Plan", `${date} ${time}`, renderHistory);
    };
    tzCard.querySelector("#tzCopy").onclick = () => copyText(tzCard.querySelector("#tzOut").value);
    const tzToday = new Date().toISOString().slice(0, 10);
    tzCard.querySelector("#tzDate").value = tzToday;

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Utility Outputs", `
      <div id="utilHistory" class="chip-list"><span class="empty-hint">No utility outputs yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="clearUtilHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearUtilHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "util-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "util-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);

    let activeFocusedCard = null;
    let focusPlaceholder = null;
    let focusOpenTimer = null;

    function openToolFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false") return;
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
      document.body.classList.add("util-modal-open");
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
      document.body.classList.remove("util-modal-open");
    }

    grid.querySelectorAll(".util-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".util-card")));
    });
    
    grid.querySelectorAll(".util-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".util-card[data-focusable='true'] .util-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".util-card"));
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

    grid.querySelectorAll("button:not([type])").forEach((button) => {
      button.setAttribute("type", "button");
    });
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const localeSelect = document.getElementById("locSel");
    if (localeSelect && Array.from(localeSelect.options).some((opt) => opt.value === browserLocale)) {
      localeSelect.value = browserLocale;
    }
    localeCard.querySelector("#locBtn").click();

    // ============================================
    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["utility-tools"] = initUtilityTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initUtilityTools(null);
    }
  });
})();