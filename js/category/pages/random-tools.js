(function() {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-random-history-v2";
  const LOCALE_PRESETS = {
    IN: { label: "India (en-IN)", locale: "en-IN", timeZone: "Asia/Kolkata" },
    US: { label: "United States (en-US)", locale: "en-US", timeZone: "America/New_York" },
    GB: { label: "United Kingdom (en-GB)", locale: "en-GB", timeZone: "Europe/London" },
    AE: { label: "UAE (ar-AE)", locale: "ar-AE", timeZone: "Asia/Dubai" },
    SA: { label: "Saudi Arabia (ar-SA)", locale: "ar-SA", timeZone: "Asia/Riyadh" },
    SG: { label: "Singapore (en-SG)", locale: "en-SG", timeZone: "Asia/Singapore" },
    AU: { label: "Australia (en-AU)", locale: "en-AU", timeZone: "Australia/Sydney" },
    ZA: { label: "South Africa (en-ZA)", locale: "en-ZA", timeZone: "Africa/Johannesburg" },
    JP: { label: "Japan (ja-JP)", locale: "ja-JP", timeZone: "Asia/Tokyo" },
    BR: { label: "Brazil (pt-BR)", locale: "pt-BR", timeZone: "America/Sao_Paulo" },
    DE: { label: "Germany (de-DE)", locale: "de-DE", timeZone: "Europe/Berlin" },
    FR: { label: "France (fr-FR)", locale: "fr-FR", timeZone: "Europe/Paris" }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
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
  function fail(message) {
    throw new Error(message);
  }
  
  function downloadTextFile(filename, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  async function loadJsPdf() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window.jspdf?.jsPDF || null;
  }
  
  async function downloadPdfFromText(fileName, title, text) {
    const JsPdf = await loadJsPdf();
    if (!JsPdf) return;
    const doc = new JsPdf({ unit: "pt", format: "a4" });
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(title || "Qwickton Export", 40, 40);
    const lines = doc.splitTextToSize(String(text || ""), 520);
    doc.text(lines, 40, 60);
    doc.save(fileName);
  }
  
  function downloadImageFromText(fileName, text, mimeType) {
    const lines = String(text || "").split("\n");
    const width = 1400;
    const lineHeight = 30;
    const padding = 48;
    const height = Math.min(5000, Math.max(400, padding * 2 + lines.length * lineHeight));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#111827";
    ctx.font = "20px JetBrains Mono, monospace";
    lines.forEach((line, i) => ctx.fillText(line.slice(0, 180), padding, padding + (i + 1) * lineHeight));
    const a = document.createElement("a");
    a.href = canvas.toDataURL(mimeType, 0.95);
    a.download = fileName;
    a.click();
  }
  
  function wireExport(card, prefix, title, getText) {
    const txt = card.querySelector(`[data-export='${prefix}-txt']`);
    const pdf = card.querySelector(`[data-export='${prefix}-pdf']`);
    const png = card.querySelector(`[data-export='${prefix}-png']`);
    const jpg = card.querySelector(`[data-export='${prefix}-jpg']`);
    txt?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    pdf?.addEventListener("click", async () => downloadPdfFromText(`${prefix}.pdf`, title, getText()));
    png?.addEventListener("click", () => downloadImageFromText(`${prefix}.png`, getText(), "image/png"));
    jpg?.addEventListener("click", () => downloadImageFromText(`${prefix}.jpg`, getText(), "image/jpeg"));
  }

  // Secure random number generator
  function secureRandom(max) {
    if (window.crypto && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function secureRandomFloat01() {
    if (window.crypto && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 4294967296;
    }
    return Math.random();
  }
  function randomIntInRange(maxExclusive) {
    if (maxExclusive <= 0) return 0;
    if (maxExclusive <= 0xffffffff) return secureRandom(maxExclusive);
    return Math.floor(secureRandomFloat01() * maxExclusive);
  }

  function localeOptions() {
    return Object.keys(LOCALE_PRESETS)
      .sort((a, b) => LOCALE_PRESETS[a].label.localeCompare(LOCALE_PRESETS[b].label))
      .map((code) => `<option value="${code}">${LOCALE_PRESETS[code].label}</option>`)
      .join("");
  }

  function detectLocalePreset() {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const region = (locale.split("-")[1] || "US").toUpperCase();
    return LOCALE_PRESETS[region] ? region : "US";
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } 
    catch { return []; }
  }
  
  function writeHistory(items) { 
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20))); 
    } catch (error) {
      void error;
    }
  }
  
  function pushHistory(type, text, renderFn) {
    if (!text) return;
    writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initRandomTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.randomToolsInitialized === "true") return;
    grid.dataset.randomToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("article");
      card.className = `tool-card bt-card rt-card ${options.fullWidth ? "full-width" : ""}`;
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `
        <div class="bt-card-header rt-card-header">
          <div class="bt-card-icon card-icon">${icon}</div>
          <h3 class="bt-card-title rt-card-title">${escapeHtml(title)}</h3>
          ${options.focusable !== false ? '<button class="btn btn-secondary bt-focus-btn" data-focus-open type="button">Open</button><button class="btn btn-secondary bt-focus-inline-close" data-focus-close type="button">Close</button>' : ""}
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
      const historyContainer = historyCardEl.querySelector("#randomHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No random results yet.</span>';
        return;
      }
      historyContainer.innerHTML = items.map((item, idx) => 
        `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`
      ).join("");
      historyContainer.querySelectorAll("[data-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          copyText(readHistory()[idx]?.text || "");
        });
      });
    }

    // Helper for simple tools with export
    function simpleTool(id, icon, title, fields, compute, opts = {}) {
      const card = makeCard(id, icon, title, `
        <div class="grid-2">${fields.map((f) => `<div><label>${f.label}</label>${f.html}</div>`).join("")}</div>
        <div class="inline-row"><button class="btn btn-primary" type="button" data-run>Generate</button><button class="btn btn-secondary" type="button" data-copy>Copy</button><button class="btn btn-secondary" type="button" data-export="${id}-txt">TXT</button>${opts.pdf !== false ? `<button class="btn btn-secondary" type="button" data-export="${id}-pdf">PDF</button>` : ""}${opts.png !== false ? `<button class="btn btn-secondary" type="button" data-export="${id}-png">PNG</button><button class="btn btn-secondary" type="button" data-export="${id}-jpg">JPG</button>` : ""}</div>
        <textarea class="result-area" data-out rows="${opts.rows || 4}"></textarea>
      `);
      let text = "";
      const run = (saveHistory) => {
        try {
          const result = compute(card);
          text = result.text;
          card.querySelector("[data-out]").value = text;
          if (saveHistory && result.history) pushHistory(result.history.type, result.history.text, renderHistory);
          renderHistory();
        } catch (error) {
          text = `Error: ${error?.message || "unexpected error"}`;
          card.querySelector("[data-out]").value = text;
        }
      };
      card.querySelector("[data-run]").addEventListener("click", () => run(true));
      card.querySelector("[data-copy]").addEventListener("click", () => copyText(text));
      card.addEventListener("input", () => run(false));
      run(false);
      wireExport(card, id, title, () => text);
      return card;
    }

    // ============================================
    // COIN TOSS MODULE (with 3D animation)
    // ============================================
    const coinCard = makeCard("coin", "🪙", "3D Coin Toss Pro", `
      <div class="coin-container">
        <canvas id="coinCanvas" width="200" height="200"></canvas>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="tossBtn">🔄 Toss Coin</button>
        <button class="btn btn-secondary" type="button" id="resetStatsBtn">Reset Stats</button>
      </div>
      <div class="inline-row">
        <button class="btn btn-secondary" data-export="coin-txt" type="button">TXT</button>
        <button class="btn btn-secondary" data-export="coin-pdf" type="button">PDF</button>
        <button class="btn btn-secondary" data-export="coin-png" type="button">PNG</button>
        <button class="btn btn-secondary" data-export="coin-jpg" type="button">JPG</button>
      </div>
      <div id="tossResult" class="result-area">✨ Ready to toss</div>
      <div class="stats-panel">
        <div class="stat-item"><div class="stat-label">Heads</div><div class="stat-value" id="headsCount">0</div></div>
        <div class="stat-item"><div class="stat-label">Tails</div><div class="stat-value" id="tailsCount">0</div></div>
        <div class="stat-item"><div class="stat-label">Total</div><div class="stat-value" id="totalTosses">0</div></div>
        <div class="stat-item"><div class="stat-label">Streak</div><div class="stat-value" id="streakValue">-</div></div>
      </div>
    `);

    const coinCanvas = coinCard.querySelector("#coinCanvas");
    const coinCtx = coinCanvas?.getContext("2d");
    let coinStats = { heads: 0, tails: 0, total: 0, streak: 0, streakFace: "" };
    let isAnimating = false;
    let currentCoinText = "";

    function drawCoin(face, squash = 1) {
      if (!coinCtx || !coinCanvas) return;
      const w = coinCanvas.width, h = coinCanvas.height, cx = w/2, cy = h/2, radius = 80;
      coinCtx.clearRect(0, 0, w, h);
      coinCtx.save();
      coinCtx.translate(cx, cy);
      coinCtx.scale(Math.max(0.1, squash), 1);
      const gradient = coinCtx.createLinearGradient(-radius, -radius, radius, radius);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      coinCtx.fillStyle = gradient;
      coinCtx.beginPath();
      coinCtx.arc(0, 0, radius, 0, Math.PI * 2);
      coinCtx.fill();
      coinCtx.fillStyle = '#fff8e1';
      coinCtx.beginPath();
      coinCtx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
      coinCtx.fill();
      coinCtx.fillStyle = '#7c2d12';
      coinCtx.font = 'bold 42px "JetBrains Mono", monospace';
      coinCtx.textAlign = 'center';
      coinCtx.textBaseline = 'middle';
      coinCtx.fillText(face === 'Heads' ? 'H' : 'T', 0, 0);
      coinCtx.restore();
    }

    function updateCoinStatsUI() {
      coinCard.querySelector("#headsCount").textContent = coinStats.heads;
      coinCard.querySelector("#tailsCount").textContent = coinStats.tails;
      coinCard.querySelector("#totalTosses").textContent = coinStats.total;
      coinCard.querySelector("#streakValue").textContent = coinStats.streak > 0 ? `${coinStats.streakFace} x${coinStats.streak}` : '-';
    }

    function animateToss() {
      if (isAnimating) return;
      isAnimating = true;
      const target = secureRandom(2) === 0 ? 'Heads' : 'Tails';
      const spins = 12 + secureRandom(8);
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / 1000);
        const eased = 1 - Math.pow(1 - progress, 2.5);
        const angle = eased * Math.PI * spins;
        const squash = Math.abs(Math.cos(angle));
        const currentFace = Math.cos(angle) >= 0 ? 'Heads' : 'Tails';
        drawCoin(currentFace, squash);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          drawCoin(target, 1);
          coinStats.total++;
          if (target === 'Heads') coinStats.heads++;
          else coinStats.tails++;
          if (coinStats.streakFace === target) coinStats.streak++;
          else { coinStats.streakFace = target; coinStats.streak = 1; }
          updateCoinStatsUI();
          currentCoinText = `Result: ${target}`;
          coinCard.querySelector("#tossResult").innerHTML = currentCoinText;
          pushHistory("Coin Toss", target, renderHistory);
          isAnimating = false;
        }
      }
      requestAnimationFrame(animate);
    }

    coinCard.querySelector("#tossBtn").onclick = animateToss;
    coinCard.querySelector("#resetStatsBtn").onclick = () => {
      coinStats = { heads: 0, tails: 0, total: 0, streak: 0, streakFace: "" };
      updateCoinStatsUI();
      coinCard.querySelector("#tossResult").innerHTML = "✨ Ready to toss";
      drawCoin('Heads', 1);
    };
    drawCoin('Heads', 1);
    updateCoinStatsUI();
    wireExport(coinCard, "coin", "Coin Toss", () => currentCoinText || coinCard.querySelector("#tossResult").innerHTML);

    // ============================================
    // DICE ROLLER
    // ============================================
    simpleTool("dice", "🎲", "Advanced Dice Roller", [
      { label: "Number of Dice", html: '<input type="number" id="diceCount" value="1" min="1" max="10">' },
      { label: "Sides per Die", html: '<input type="number" id="diceSides" value="6" min="2" max="100">' }
    ], (card) => {
      const count = Math.min(10, Math.max(1, Number(card.querySelector("#diceCount").value) || 1));
      const sides = Math.min(100, Math.max(2, Number(card.querySelector("#diceSides").value) || 6));
      const results = [];
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const roll = secureRandom(sides) + 1;
        results.push(roll);
        sum += roll;
      }
      const output = results.join(', ');
      return {
        text: `🎲 Roll: ${output}\n📊 Sum: ${sum} | Average: ${(sum/count).toFixed(2)}\n🎯 ${count}d${sides}`,
        history: { type: "Dice Roll", text: `${count}d${sides}: ${output.slice(0, 50)}` }
      };
    }, { rows: 3 });

    // ============================================
    // RANDOM PICKER
    // ============================================
    const pickerCard = makeCard("picker", "🎯", "Smart Random Picker", `
      <div class="form-group"><label class="form-label">Options (one per line)</label><textarea id="pickerInput" rows="5" placeholder="Apple&#10;Banana&#10;Cherry&#10;Date"></textarea></div>
      <label style="display:flex;align-items:center;gap:0.5rem;margin:0.5rem 0"><input type="checkbox" id="noRepeatPick"> Pick without repetition</label>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="pickBtn">🎲 Pick Random</button>
        <button class="btn btn-secondary" type="button" id="copyPickBtn">Copy Result</button>
        <button class="btn btn-secondary" type="button" id="resetPickBtn">Reset Pool</button>
      </div>
      <div class="inline-row">
        <button class="btn btn-secondary" data-export="picker-txt" type="button">TXT</button>
        <button class="btn btn-secondary" data-export="picker-pdf" type="button">PDF</button>
        <button class="btn btn-secondary" data-export="picker-png" type="button">PNG</button>
        <button class="btn btn-secondary" data-export="picker-jpg" type="button">JPG</button>
      </div>
      <div id="pickResult" class="result-area">✨ Ready to pick</div>
      <div id="pickerMeta" class="stats-panel" style="margin-top:0.5rem">📋 Pool: 0 items</div>
    `);

    let originalPool = [], currentPool = [], currentPickText = "";
    
    function refreshPool() {
      const raw = pickerCard.querySelector("#pickerInput").value;
      originalPool = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      currentPool = [...originalPool];
      const remaining = pickerCard.querySelector("#noRepeatPick").checked ? currentPool.length : originalPool.length;
      pickerCard.querySelector("#pickerMeta").innerHTML = `📋 Pool: ${originalPool.length} items | Remaining: ${remaining}`;
    }
    
    pickerCard.querySelector("#pickBtn").onclick = () => {
      const noRepeat = pickerCard.querySelector("#noRepeatPick").checked;
      let pool = noRepeat ? currentPool : originalPool;
      if (pool.length === 0) {
        pickerCard.querySelector("#pickResult").innerHTML = "⚠️ No options available! Add items or reset pool.";
        return;
      }
      const idx = secureRandom(pool.length);
      const picked = pool[idx];
      currentPickText = `🎯 Picked: ${picked}`;
      pickerCard.querySelector("#pickResult").innerHTML = currentPickText;
      if (noRepeat) { currentPool.splice(idx, 1); refreshPool(); }
      pushHistory("Random Pick", picked, renderHistory);
    };
    
    pickerCard.querySelector("#copyPickBtn").onclick = () => copyText(currentPickText || pickerCard.querySelector("#pickResult").innerText);
    pickerCard.querySelector("#resetPickBtn").onclick = () => { currentPool = [...originalPool]; refreshPool(); pickerCard.querySelector("#pickResult").innerHTML = "✨ Ready to pick"; };
    pickerCard.querySelector("#pickerInput").addEventListener("input", refreshPool);
    pickerCard.querySelector("#noRepeatPick").addEventListener("change", refreshPool);
    refreshPool();
    wireExport(pickerCard, "picker", "Random Picker", () => currentPickText || pickerCard.querySelector("#pickResult").innerHTML);

    // ============================================
    // NUMBER GENERATOR
    // ============================================
    simpleTool("rng", "🔢", "Secure Number Generator", [
      { label: "Min Value", html: '<input type="number" id="rngMin" value="1">' },
      { label: "Max Value", html: '<input type="number" id="rngMax" value="100">' },
      { label: "Count", html: '<input type="number" id="rngCount" value="5" min="1" max="200">' },
      { label: "Unique Only", html: '<label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" id="rngUnique"> Unique Numbers</label>' }
    ], (card) => {
      let min = Math.floor(Number(card.querySelector("#rngMin").value) || 1);
      let max = Math.floor(Number(card.querySelector("#rngMax").value) || 100);
      if (min > max) [min, max] = [max, min];
      let count = Math.min(200, Math.max(1, Number(card.querySelector("#rngCount").value) || 5));
      const unique = card.querySelector("#rngUnique").checked;
      const range = max - min + 1;
      if (unique && count > range) return { text: "Error: Count exceeds unique range!", history: null };
      const results = [];
      while (results.length < count) {
        const val = min + secureRandom(range);
        if (unique && results.includes(val)) continue;
        results.push(val);
      }
      const output = results.join(", ");
      return {
        text: `🔢 Random Numbers (${count}x)\n📊 Range: ${min} - ${max}\n${unique ? '✨ Unique numbers' : '🔄 May repeat'}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${output}`,
        history: { type: "Number Gen", text: `${count}x [${min}-${max}]: ${output.slice(0, 60)}` }
      };
    }, { rows: 5 });

    // ============================================
    // YES / NO
    // ============================================
    simpleTool("yesno", "❓", "Yes / No Decision", [
      { label: "Question (optional)", html: '<input type="text" id="ynQ" placeholder="Should I…">' }
    ], () => {
      const yes = secureRandom(2) === 0;
      return {
        text: `${yes ? "✅ YES" : "❌ NO"}\n\n(Random flip — not legal or medical advice.)`,
        history: { type: "Yes/No", text: yes ? "YES" : "NO" }
      };
    }, { rows: 3, pdf: false, png: false });

    // ============================================
    // SHUFFLE LINES
    // ============================================
    simpleTool("shuffle", "🔀", "Shuffle List", [
      { label: "Lines to shuffle", html: '<textarea id="shufIn" rows="4" placeholder="One item per line"></textarea>' }
    ], (card) => {
      const lines = card.querySelector("#shufIn").value.split(/\r?\n/).filter((l) => l.length);
      for (let i = lines.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      return {
        text: lines.join("\n"),
        history: { type: "Shuffle", text: `${lines.length} lines` }
      };
    }, { rows: 6 });

    // ============================================
    // MEMORABLE PIN / PHRASE
    // ============================================
    simpleTool("memphrase", "💬", "Memorable Random Phrase", [
      { label: "Words", html: '<input type="number" id="mpW" value="4" min="3" max="8">' }
    ], (card) => {
      const dict = ["swift", "river", "coral", "matrix", "falcon", "nova", "amber", "pixel", "orbit", "summit", "cipher", "velvet", "quartz", "harbor", "ember", "nimbus", "atlas", "violet", "chrome", "delta"];
      const n = Math.max(3, Math.min(8, Number(card.querySelector("#mpW").value) || 4));
      const picked = [];
      const used = new Set();
      while (picked.length < n) {
        const w = dict[secureRandom(dict.length)];
        if (used.has(w)) continue;
        used.add(w);
        picked.push(w);
      }
      const phrase = picked.join("-") + "-" + (1000 + secureRandom(9000));
      return { text: phrase, history: { type: "Phrase", text: phrase.slice(0, 40) } };
    }, { rows: 2 });

    // ============================================
    // RANDOM HEX COLOR
    // ============================================
    simpleTool("randcolor", "🎨", "Random Color (HEX)", [
      { label: "Count", html: '<input type="number" id="rcN" value="5" min="1" max="20">' }
    ], (card) => {
      const cnt = Math.max(1, Math.min(20, Number(card.querySelector("#rcN").value) || 5));
      const lines = [];
      for (let i = 0; i < cnt; i++) {
        let bytes = [secureRandom(256), secureRandom(256), secureRandom(256)];
        if (window.crypto && crypto.getRandomValues) {
          const arr = new Uint8Array(3);
          crypto.getRandomValues(arr);
          bytes = [...arr];
        }
        const hex = "#" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
        lines.push(hex);
      }
      return { text: lines.join("\n"), history: { type: "Colors", text: lines[0] } };
    }, { rows: 6, pdf: false });

    // ============================================
    // WEIGHTED PICK (simple)
    // ============================================
    simpleTool("weighted", "⚖️", "Weighted Random Pick", [
      { label: "Options (label:weight per line)", html: '<textarea id="wtIn" rows="5" placeholder="Option A:3&#10;Option B:1&#10;Option C:1"></textarea>' }
    ], (card) => {
      const rows = card.querySelector("#wtIn").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const opts = [];
      let total = 0;
      for (const row of rows) {
        const m = /^(.+?):(\d+(?:\.\d+)?)\s*$/.exec(row);
        if (!m) continue;
        const w = Math.max(0, Number(m[2]));
        if (!w) continue;
        opts.push({ label: m[1].trim(), w });
        total += w;
      }
      if (!opts.length) return { text: "Add lines like Apple:3", history: null };
      let r = Math.random() * total;
      let pick = opts[0].label;
      for (const o of opts) {
        r -= o.w;
        if (r <= 0) { pick = o.label; break; }
      }
      return { text: `Weighted pick: ${pick}\n(total weight ${total})`, history: { type: "Weighted", text: pick } };
    }, { rows: 4 });

    // ============================================
    // TEAM SPLITTER
    // ============================================
    simpleTool("teams", "👥", "Random Team Splitter", [
      { label: "Names (one per line)", html: '<textarea id="teamNames" rows="5" placeholder="Ava&#10;Noah&#10;Liam&#10;Emma&#10;Mia"></textarea>' },
      { label: "Number of Teams", html: '<input type="number" id="teamCount" value="2" min="2" max="12">' }
    ], (card) => {
      const names = card.querySelector("#teamNames").value
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);
      const teamCount = Math.max(2, Math.min(12, Number(card.querySelector("#teamCount").value) || 2));
      if (names.length < teamCount) fail("Names should be at least equal to number of teams.");
      const shuffled = [...names];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const teams = Array.from({ length: teamCount }, () => []);
      shuffled.forEach((name, index) => teams[index % teamCount].push(name));
      const lines = teams.map((team, index) => `Team ${index + 1} (${team.length})\n- ${team.join("\n- ")}`);
      return {
        text: `RANDOM TEAM SPLIT\n========================================\nMembers: ${names.length}\nTeams: ${teamCount}\n\n${lines.join("\n\n")}`,
        history: { type: "Teams", text: `${names.length} into ${teamCount}` }
      };
    }, { rows: 14 });

    // ============================================
    // RANDOM DATE/TIME
    // ============================================
    const guessedPreset = detectLocalePreset();
    simpleTool("dates", "🌍", "Random Date & Time Generator", [
      { label: "Country / Locale Preset", html: `<select id="rdPreset">${localeOptions()}</select>` },
      { label: "Start Date", html: '<input type="date" id="rdStart">' },
      { label: "End Date", html: '<input type="date" id="rdEnd">' },
      { label: "How Many", html: '<input type="number" id="rdCount" value="5" min="1" max="50">' },
      { label: "Include Time", html: '<label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" id="rdTime" checked> Yes</label>' }
    ], (card) => {
      const preset = LOCALE_PRESETS[card.querySelector("#rdPreset").value] || LOCALE_PRESETS.US;
      const startRaw = card.querySelector("#rdStart").value;
      const endRaw = card.querySelector("#rdEnd").value;
      const count = Math.max(1, Math.min(50, Number(card.querySelector("#rdCount").value) || 5));
      const withTime = card.querySelector("#rdTime").checked;
      if (!startRaw || !endRaw) {
        return {
          text: "Choose start and end date to generate random localized date/time values.",
          history: null
        };
      }
      const startMs = new Date(startRaw).getTime();
      const endMs = new Date(endRaw).getTime() + 86399999;
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) fail("Invalid date range.");
      if (startMs > endMs) fail("Start date must be before end date.");
      const formatter = new Intl.DateTimeFormat(preset.locale, withTime
        ? { dateStyle: "medium", timeStyle: "short", timeZone: preset.timeZone }
        : { dateStyle: "medium", timeZone: preset.timeZone });
      const lines = [];
      for (let i = 0; i < count; i++) {
        const ms = startMs + randomIntInRange(Math.max(1, endMs - startMs + 1));
        lines.push(`${i + 1}. ${formatter.format(new Date(ms))}`);
      }
      return {
        text: `RANDOM DATE/TIME OUTPUT\n========================================\nPreset: ${preset.label}\nRange: ${startRaw} to ${endRaw}\nCount: ${count}\n\n${lines.join("\n")}`,
        history: { type: "Random Date", text: `${preset.label} (${count})` }
      };
    }, { rows: 10 });
    const datesCard = document.getElementById("card-dates");
    if (datesCard) {
      datesCard.querySelector("#rdPreset").value = guessedPreset;
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 1);
      datesCard.querySelector("#rdStart").value = start.toISOString().slice(0, 10);
      datesCard.querySelector("#rdEnd").value = today.toISOString().slice(0, 10);
    }

    // ============================================
    // SECURE TOKEN GENERATOR
    // ============================================
    simpleTool("token", "🔐", "Secure Token Generator", [
      { label: "Token Length", html: '<input type="number" id="tkLen" value="24" min="8" max="128">' },
      { label: "How Many Tokens", html: '<input type="number" id="tkCount" value="3" min="1" max="30">' },
      { label: "Charset", html: '<select id="tkCharset"><option value="alnum">A-Z, a-z, 0-9</option><option value="base64url">Base64URL</option><option value="hex">Hex</option><option value="numeric">Digits only</option></select>' },
      { label: "Prefix (optional)", html: '<input type="text" id="tkPrefix" placeholder="QWK_">' }
    ], (card) => {
      const len = Math.max(8, Math.min(128, Number(card.querySelector("#tkLen").value) || 24));
      const count = Math.max(1, Math.min(30, Number(card.querySelector("#tkCount").value) || 3));
      const charsetType = card.querySelector("#tkCharset").value;
      const prefix = card.querySelector("#tkPrefix").value.trim();
      const alphabets = {
        alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        base64url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
        hex: "0123456789abcdef",
        numeric: "0123456789"
      };
      const alphabet = alphabets[charsetType] || alphabets.alnum;
      const tokens = [];
      for (let i = 0; i < count; i++) {
        let token = "";
        for (let j = 0; j < len; j++) token += alphabet[secureRandom(alphabet.length)];
        tokens.push(prefix ? `${prefix}${token}` : token);
      }
      return {
        text: `SECURE TOKENS\n========================================\nCharset: ${charsetType}\nLength: ${len}\nCount: ${count}\n\n${tokens.join("\n")}`,
        history: { type: "Token", text: `${count} x ${len}` }
      };
    }, { rows: 8 });

    // ============================================
    // HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Random History Log", `
      <div id="randomHistory" class="history-list"></div>
      <div class="inline-row">
        <button class="btn btn-secondary" type="button" id="clearHistoryBtn" style="flex:1">🗑️ Clear All History</button>
      </div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearHistoryBtn").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const overlay = document.createElement("div");
    overlay.className = "bt-focus-overlay";
    const host = document.createElement("div");
    host.className = "bt-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    
    let focusedCard = null;
    let placeholder = null;
    
    function openFocus(card) {
      if (!card || card.dataset.focusable === "false" || focusedCard === card) return;
      if (focusedCard) closeFocus();
      placeholder = document.createElement("div");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.parentNode.insertBefore(placeholder, card);
      host.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      host.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("bt-modal-open");
      focusedCard = card;
    }
    
    function closeFocus() {
      if (!focusedCard) return;
      focusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      focusedCard.querySelector("[data-focus-close]")?.classList.remove("active");
      focusedCard.classList.remove("is-focused");
      placeholder?.parentNode?.insertBefore(focusedCard, placeholder);
      placeholder?.remove();
      focusedCard = null;
      host.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("bt-modal-open");
    }
    
    document.querySelectorAll(".bt-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openFocus(e.target.closest(".bt-card")));
    });
    
    document.querySelectorAll(".bt-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeFocus(); });
    });
    
    document.querySelectorAll(".bt-card[data-focusable='true'] .bt-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openFocus(e.currentTarget.closest(".bt-card"));
      });
    });
    
    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFocus(); });

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
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => openFocus(card), 160);
      });
    });

    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  window.QwicktonCategoryInits["random-tools"] = initRandomTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initRandomTools(null);
    }
  });
})();