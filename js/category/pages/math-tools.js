/**
 * MATH TOOLS - Complete JavaScript
 * Tools: Percentage Calculator, Ratio Solver (GCD/LCM), Expression Evaluator
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

  function gcd(x, y) {
    let a = Math.abs(Math.round(x));
    let b = Math.abs(Math.round(y));
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function lcm(x, y) {
    if (!x || !y) return 0;
    return Math.abs(Math.round((x * y) / gcd(x, y)));
  }
  function evaluateMathExpression(input) {
    const clean = String(input || "").replace(/\s+/g, "");
    if (!clean) throw new Error("Expression is empty.");
    if (!/^[0-9+\-*/%().]+$/.test(clean)) throw new Error("Invalid characters in expression.");

    const tokens = [];
    for (let i = 0; i < clean.length;) {
      const ch = clean[i];
      const prev = tokens[tokens.length - 1];
      const unaryMinus = ch === "-" && (!prev || prev === "(" || prev === "+" || prev === "-" || prev === "*" || prev === "/" || prev === "%");
      if ((ch >= "0" && ch <= "9") || ch === "." || unaryMinus) {
        let j = i + (unaryMinus ? 1 : 0);
        while (j < clean.length && /[0-9.]/.test(clean[j])) j++;
        const n = Number(clean.slice(i, j));
        if (!Number.isFinite(n)) throw new Error("Invalid number format.");
        tokens.push(n);
        i = j;
      } else if ("+-*/%()".includes(ch)) {
        tokens.push(ch);
        i++;
      } else {
        throw new Error("Unsupported token.");
      }
    }

    const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
    const out = [];
    const ops = [];
    for (const token of tokens) {
      if (typeof token === "number") out.push(token);
      else if (token === "(") ops.push(token);
      else if (token === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
        if (ops.pop() !== "(") throw new Error("Mismatched parentheses.");
      } else {
        while (ops.length && prec[ops[ops.length - 1]] >= prec[token]) out.push(ops.pop());
        ops.push(token);
      }
    }
    while (ops.length) {
      const op = ops.pop();
      if (op === "(" || op === ")") throw new Error("Mismatched parentheses.");
      out.push(op);
    }

    const stack = [];
    for (const token of out) {
      if (typeof token === "number") stack.push(token);
      else {
        const b = stack.pop();
        const a = stack.pop();
        if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("Invalid expression structure.");
        if (token === "+") stack.push(a + b);
        else if (token === "-") stack.push(a - b);
        else if (token === "*") stack.push(a * b);
        else if (token === "/") {
          if (b === 0) throw new Error("Division by zero.");
          stack.push(a / b);
        } else if (token === "%") {
          if (b === 0) throw new Error("Modulo by zero.");
          stack.push(a % b);
        }
      }
    }
    if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error("Could not evaluate expression.");
    return stack[0];
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-math-history";
  
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
  function initMathTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.mathToolsInitialized === "true") return;
    grid.dataset.mathToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "math-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="math-card-header">
          <div class="math-card-icon">${icon}</div>
          <h3 class="math-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary math-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary math-focus-inline-close" type="button" data-focus-close>Close</button>
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
      const historyContainer = historyCardEl.querySelector("#mathHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No math results yet.</span>';
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
    // PERCENTAGE SUITE CARD
    // ============================================
    const percentCard = makeCard("percentage", "📊", "Percentage Suite Pro", `
      <div class="grid-2">
        <div><label>Value</label><input id="pctVal" type="number" placeholder="Value" value="25"></div>
        <div><label>Total</label><input id="pctTotal" type="number" placeholder="Total" value="200"></div>
        <div><label>Base Value</label><input id="pctBase" type="number" placeholder="Base value" value="1000"></div>
        <div><label>Change %</label><input id="pctChange" type="number" placeholder="Change percentage" value="12"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="pctBtn">🧮 Calculate</button>
        <button class="btn btn-secondary" type="button" id="pctCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="pctDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="pctRes" class="result">-</div>
      <div id="pctMeta" class="result" style="margin-top:0.5rem;">-</div>
    `);

    percentCard.querySelector("#pctBtn").onclick = () => {
      const val = safeNum(percentCard.querySelector("#pctVal").value);
      const total = safeNum(percentCard.querySelector("#pctTotal").value, 1);
      const base = safeNum(percentCard.querySelector("#pctBase").value, 0);
      const chg = safeNum(percentCard.querySelector("#pctChange").value, 0);
      
      const partPct = total > 0 ? ((val / total) * 100).toFixed(2) : "0.00";
      const increased = base * (1 + chg / 100);
      const decreased = base * (1 - chg / 100);
      
      const result = `📊 ${val} is ${partPct}% of ${total}`;
      const meta = `📈 +${chg}%: ${increased.toFixed(2)} | 📉 -${chg}%: ${decreased.toFixed(2)}`;
      
      percentCard.querySelector("#pctRes").textContent = result;
      percentCard.querySelector("#pctMeta").textContent = meta;
      pushHistory("Percentage", result, renderHistory);
    };
    
    percentCard.querySelector("#pctCopyBtn").onclick = () => {
      const text = `${percentCard.querySelector("#pctRes").textContent} | ${percentCard.querySelector("#pctMeta").textContent}`;
      copyText(text);
    };
    percentCard.querySelector("#pctDownloadBtn").onclick = () => {
      const text = `${percentCard.querySelector("#pctRes").textContent}\n${percentCard.querySelector("#pctMeta").textContent}`;
      downloadTextFile("percentage-suite-output.txt", text);
    };

    // ============================================
    // RATIO & GCD/LCM CARD
    // ============================================
    const ratioCard = makeCard("ratio", "📐", "Ratio, GCD & LCM Calculator", `
      <div class="grid-2">
        <div><label>Number A</label><input id="rA" type="number" placeholder="First number" value="84"></div>
        <div><label>Number B</label><input id="rB" type="number" placeholder="Second number" value="36"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="ratioBtn">🔢 Solve</button>
        <button class="btn btn-secondary" type="button" id="ratioCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="ratioDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="ratioRes" class="result">-</div>
    `);

    ratioCard.querySelector("#ratioBtn").onclick = () => {
      const a = safeNum(ratioCard.querySelector("#rA").value);
      const b = safeNum(ratioCard.querySelector("#rB").value);
      if (!a || !b) {
        ratioCard.querySelector("#ratioRes").textContent = "⚠️ Please enter both numbers";
        return;
      }
      const g = gcd(a, b);
      const l = lcm(a, b);
      const ratioA = Math.round(a / g);
      const ratioB = Math.round(b / g);
      
      const result = `📐 Ratio: ${ratioA}:${ratioB} | 🔢 GCD: ${g} | 🔢 LCM: ${l}`;
      ratioCard.querySelector("#ratioRes").textContent = result;
      pushHistory("Ratio/GCD/LCM", `${a} & ${b} → GCD:${g} LCM:${l}`, renderHistory);
    };
    
    ratioCard.querySelector("#ratioCopyBtn").onclick = () => copyText(ratioCard.querySelector("#ratioRes").textContent);
    ratioCard.querySelector("#ratioDownloadBtn").onclick = () => downloadTextFile("ratio-gcd-lcm-output.txt", ratioCard.querySelector("#ratioRes").textContent);

    // ============================================
    // EXPRESSION EVALUATOR CARD
    // ============================================
    const exprCard = makeCard("expression", "📝", "Expression Evaluator", `
      <div><label>Math Expression</label><input id="exprInput" type="text" placeholder="Example: (12.5 * 4 + 18) / 3 - 5%"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="exprBtn">⚡ Evaluate</button>
        <button class="btn btn-secondary" type="button" id="exprCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="exprDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="exprRes" class="result">-</div>
      <div id="exprMeta" class="result" style="margin-top:0.5rem; font-size:0.75rem;">Allowed: numbers, + - * / % ( ) . and spaces</div>
    `);

    exprCard.querySelector("#exprBtn").onclick = () => {
      const input = (exprCard.querySelector("#exprInput").value || "").trim();
      if (!input) {
        exprCard.querySelector("#exprRes").textContent = "⚠️ Please enter an expression";
        return;
      }
      
      try {
        const result = evaluateMathExpression(input);
        const output = `📝 ${input} = ${result.toFixed(6)}`;
        exprCard.querySelector("#exprRes").textContent = output;
        pushHistory("Expression", `${input} = ${result.toFixed(4)}`, renderHistory);
      } catch (e) {
        exprCard.querySelector("#exprRes").textContent = `❌ ${e?.message || "Could not evaluate expression. Check syntax."}`;
      }
    };
    
    exprCard.querySelector("#exprCopyBtn").onclick = () => copyText(exprCard.querySelector("#exprRes").textContent);
    exprCard.querySelector("#exprDownloadBtn").onclick = () => downloadTextFile("expression-evaluation.txt", exprCard.querySelector("#exprRes").textContent);

    // ============================================
    // PRIME CHECK
    // ============================================
    const primeCard = makeCard("prime", "🔢", "Prime Checker", `
      <div><label>Integer</label><input type="number" id="prN" value="97" min="2"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="prBtn">Check</button>
        <button class="btn btn-secondary" id="prCopy">Copy</button>
      </div>
      <div id="prOut" class="result">—</div>
    `);
    function isPrime(n) {
      if (n < 2 || n > Number.MAX_SAFE_INTEGER) return false;
      if (n === 2) return true;
      if (n % 2 === 0) return false;
      for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
      return true;
    }
    primeCard.querySelector("#prBtn").onclick = () => {
      const n = Math.floor(safeNum(primeCard.querySelector("#prN").value, 2));
      if (n < 2) { primeCard.querySelector("#prOut").textContent = "Enter n ≥ 2"; return; }
      primeCard.querySelector("#prOut").textContent = isPrime(n) ? `${n} is prime.` : `${n} is composite.`;
      pushHistory("Prime", String(n), renderHistory);
    };
    primeCard.querySelector("#prCopy").onclick = () => copyText(primeCard.querySelector("#prOut").textContent);

    // ============================================
    // FACTORIAL
    // ============================================
    const factCard = makeCard("fact", "❗", "Factorial", `
      <div><label>n (0–170)</label><input type="number" id="fcN" value="10" min="0" max="170"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="fcBtn">n!</button>
        <button class="btn btn-secondary" id="fcCopy">Copy</button>
      </div>
      <div id="fcOut" class="result">—</div>
    `);
    factCard.querySelector("#fcBtn").onclick = () => {
      let n = Math.floor(safeNum(factCard.querySelector("#fcN").value, 0));
      n = Math.max(0, Math.min(170, n));
      let x = 1n;
      for (let i = 2n; i <= BigInt(n); i++) x *= i;
      factCard.querySelector("#fcOut").textContent = `${n}! = ${x.toString()}`;
    };
    factCard.querySelector("#fcCopy").onclick = () => copyText(factCard.querySelector("#fcOut").textContent);

    // ============================================
    // FIBONACCI
    // ============================================
    const fibCard = makeCard("fib", "🌀", "Fibonacci Sequence", `
      <div><label>Terms</label><input type="number" id="fbK" value="15" min="1" max="50"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="fbBtn">Generate</button>
        <button class="btn btn-secondary" id="fbCopy">Copy</button>
      </div>
      <textarea id="fbOut" class="result" rows="3" readonly></textarea>
    `);
    fibCard.querySelector("#fbBtn").onclick = () => {
      const k = Math.max(1, Math.min(50, Math.floor(safeNum(fibCard.querySelector("#fbK").value, 15))));
      const arr = [0, 1];
      for (let i = 2; i < k; i++) arr.push(arr[i - 1] + arr[i - 2]);
      fibCard.querySelector("#fbOut").value = arr.slice(0, k).join(", ");
    };
    fibCard.querySelector("#fbCopy").onclick = () => copyText(fibCard.querySelector("#fbOut").value);

    // ============================================
    // QUADRATIC SOLVER
    // ============================================
    const quadCard = makeCard("quad", "📐", "Quadratic Solver (ax²+bx+c=0)", `
      <div class="grid-3">
        <div><label>a</label><input type="number" id="qdA" value="1" step="any"></div>
        <div><label>b</label><input type="number" id="qdB" value="-3" step="any"></div>
        <div><label>c</label><input type="number" id="qdC" value="2" step="any"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="qdBtn">Solve</button>
        <button class="btn btn-secondary" id="qdCopy">Copy</button>
      </div>
      <div id="qdOut" class="result">—</div>
    `);
    quadCard.querySelector("#qdBtn").onclick = () => {
      const a = safeNum(quadCard.querySelector("#qdA").value, 0);
      const b = safeNum(quadCard.querySelector("#qdB").value, 0);
      const c = safeNum(quadCard.querySelector("#qdC").value, 0);
      if (a === 0) { quadCard.querySelector("#qdOut").textContent = "a must not be 0."; return; }
      const D = b * b - 4 * a * c;
      if (D < 0) {
        const re = -b / (2 * a);
        const im = Math.sqrt(-D) / (2 * a);
        quadCard.querySelector("#qdOut").textContent = `Roots: ${re.toFixed(4)} ± ${im.toFixed(4)}i`;
      } else if (D === 0) {
        const x = -b / (2 * a);
        quadCard.querySelector("#qdOut").textContent = `One root: x = ${x}`;
      } else {
        const s = Math.sqrt(D);
        const x1 = (-b + s) / (2 * a);
        const x2 = (-b - s) / (2 * a);
        quadCard.querySelector("#qdOut").textContent = `x₁ = ${x1.toFixed(6)}, x₂ = ${x2.toFixed(6)}`;
      }
    };
    quadCard.querySelector("#qdCopy").onclick = () => copyText(quadCard.querySelector("#qdOut").textContent);

    // ============================================
    // MEAN / MEDIAN / MODE
    // ============================================
    const statCard = makeCard("stats", "📊", "Mean · Median · Mode", `
      <div><label>Numbers (comma or space)</label><input type="text" id="stIn" value="3,7,7,2,9"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="stBtn">Calculate</button>
        <button class="btn btn-secondary" id="stCopy">Copy</button>
      </div>
      <div id="stOut" class="result">—</div>
    `);
    statCard.querySelector("#stBtn").onclick = () => {
      const nums = statCard.querySelector("#stIn").value.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n));
      if (!nums.length) return;
      const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      const freq = new Map();
      nums.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
      let mode = sorted[0];
      let mf = 0;
      freq.forEach((f, n) => { if (f > mf) { mf = f; mode = n; } });
      statCard.querySelector("#stOut").textContent = `Mean: ${mean.toFixed(4)} | Median: ${median} | Mode: ${mode} (${mf}×)`;
    };
    statCard.querySelector("#stCopy").onclick = () => copyText(statCard.querySelector("#stOut").textContent);

    // ============================================
    // PERCENT OF / IS WHAT PERCENT
    // ============================================
    const pct2Card = makeCard("pct2", "💯", "Percent Relationships", `
      <div class="grid-2">
        <div><label>What is p% of x?</label><div class="grid-2"><input type="number" id="p2p" placeholder="p" value="15"><input type="number" id="p2x" placeholder="x" value="200"></div></div>
        <div><label>y is what % of x?</label><div class="grid-2"><input type="number" id="p2y" placeholder="y" value="30"><input type="number" id="p2z" placeholder="x" value="120"></div></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="p2Btn">Compute</button>
        <button class="btn btn-secondary" type="button" id="p2Copy">Copy</button>
      </div>
      <div id="p2Out" class="result">—</div>
    `);
    pct2Card.querySelector("#p2Btn").onclick = () => {
      const p = safeNum(pct2Card.querySelector("#p2p").value, 0);
      const x = safeNum(pct2Card.querySelector("#p2x").value, 0);
      const y = safeNum(pct2Card.querySelector("#p2y").value, 0);
      const z = safeNum(pct2Card.querySelector("#p2z").value, 0);
      const a = (p / 100) * x;
      const b = z ? (y / z) * 100 : 0;
      pct2Card.querySelector("#p2Out").textContent = `${p}% of ${x} = ${a.toFixed(4)} | ${y} is ${b.toFixed(2)}% of ${z}`;
    };
    pct2Card.querySelector("#p2Copy").onclick = () => copyText(pct2Card.querySelector("#p2Out").textContent);

    // ============================================
    // BASE CONVERTER
    // ============================================
    const baseCard = makeCard("base", "🔁", "Number Base Converter", `
      <div class="grid-2">
        <div><label>Input Base</label><select id="bcInBase"><option value="2">Binary</option><option value="8">Octal</option><option value="10" selected>Decimal</option><option value="16">Hex</option></select></div>
        <div><label>Number</label><input type="text" id="bcValue" value="255"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="bcBtn">Convert</button>
        <button class="btn btn-secondary" type="button" id="bcCopy">Copy</button>
      </div>
      <textarea id="bcOut" class="result" rows="4" readonly></textarea>
    `);
    baseCard.querySelector("#bcBtn").onclick = () => {
      const base = Number(baseCard.querySelector("#bcInBase").value || 10);
      const raw = (baseCard.querySelector("#bcValue").value || "").trim();
      if (!raw) {
        baseCard.querySelector("#bcOut").value = "Please enter a number value.";
        return;
      }
      const parsed = Number.parseInt(raw, base);
      if (!Number.isFinite(parsed)) {
        baseCard.querySelector("#bcOut").value = "Invalid number for selected input base.";
        return;
      }
      baseCard.querySelector("#bcOut").value = [
        `Decimal: ${parsed.toString(10)}`,
        `Binary: ${parsed.toString(2)}`,
        `Octal: ${parsed.toString(8)}`,
        `Hex: ${parsed.toString(16).toUpperCase()}`
      ].join("\n");
      pushHistory("Base Convert", `${raw} (base ${base})`, renderHistory);
    };
    baseCard.querySelector("#bcCopy").onclick = () => copyText(baseCard.querySelector("#bcOut").value);

    // ============================================
    // LOCALE NUMBER FORMATTER
    // ============================================
    const localeCard = makeCard("locale", "🌍", "Global Number Formatter", `
      <div class="grid-2">
        <div><label>Number</label><input type="number" id="lnValue" value="1234567.89" step="any"></div>
        <div><label>Locale</label><select id="lnLocale"><option value="en-US">US</option><option value="en-IN">India</option><option value="en-GB">UK</option><option value="de-DE">Germany</option><option value="fr-FR">France</option><option value="ar-SA">Saudi</option><option value="ja-JP">Japan</option><option value="pt-BR">Brazil</option></select></div>
      </div>
      <div class="grid-2">
        <div><label>Currency</label><select id="lnCurrency"><option value="USD">USD</option><option value="INR">INR</option><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="SAR">SAR</option><option value="JPY">JPY</option><option value="BRL">BRL</option></select></div>
        <div><label>Percent Value</label><input type="number" id="lnPercent" value="0.154" step="any"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="lnBtn">Format</button>
        <button class="btn btn-secondary" type="button" id="lnCopy">Copy</button>
      </div>
      <textarea id="lnOut" class="result" rows="5" readonly></textarea>
    `);
    localeCard.querySelector("#lnBtn").onclick = () => {
      const value = safeNum(localeCard.querySelector("#lnValue").value, 0);
      const locale = localeCard.querySelector("#lnLocale").value || "en-US";
      const currency = localeCard.querySelector("#lnCurrency").value || "USD";
      const pctValue = safeNum(localeCard.querySelector("#lnPercent").value, 0);
      const out = [
        `Locale: ${locale}`,
        `Number: ${new Intl.NumberFormat(locale).format(value)}`,
        `Currency: ${new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)}`,
        `Percent: ${new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(pctValue)}`
      ].join("\n");
      localeCard.querySelector("#lnOut").value = out;
      pushHistory("Locale Format", `${locale} / ${value}`, renderHistory);
    };
    localeCard.querySelector("#lnCopy").onclick = () => copyText(localeCard.querySelector("#lnOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Math Results", `
      <div id="mathHistory" class="chip-list"><span class="empty-hint">No math results yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" type="button" id="clearMathHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearMathHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "math-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "math-focus-host";
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
      document.body.classList.add("math-modal-open");
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
      document.body.classList.remove("math-modal-open");
    }

    grid.querySelectorAll(".math-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".math-card")));
    });
    
    grid.querySelectorAll(".math-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".math-card[data-focusable='true'] .math-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".math-card"));
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
  window.QwicktonCategoryInits["math-tools"] = initMathTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initMathTools(null);
    }
  });
})();