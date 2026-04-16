(function () {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CNY", "CAD", "AUD"];
  let exchangeRates = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 148.2, CNY: 7.2, CAD: 1.35, AUD: 1.52 };
  let ratesFetchedAt = null;

  const HISTORY_KEY = "qw-daily-tools-history";

  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }

  async function copyText(text) {
    if (text == null || text === "") return;
    try {
      await navigator.clipboard.writeText(String(text));
    } catch {
      /* ignore */
    }
  }

  function downloadTextFile(name, text) {
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(String(text || ""));
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadCsv(name, rows) {
    const esc = (cell) => {
      const s = String(cell ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const text = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    downloadTextFile(name, text);
  }

  function moneyInr(n) {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
    } catch {
      return `₹${Number(n).toFixed(2)}`;
    }
  }

  function setFieldError(input, message) {
    if (!input) return;
    input.classList.toggle("dt-input-invalid", !!message);
    const id = input.getAttribute("aria-describedby");
    const err = id ? document.getElementById(id) : input.parentElement?.querySelector(".dt-error");
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
  }

  /** Safe arithmetic expression (+ - * / % parentheses), no eval/Function — aligned with js/tools-daily.js */
  function tokenizeExpression(expression) {
    const tokens = [];
    let i = 0;
    while (i < expression.length) {
      const ch = expression[i];
      if (/\s/.test(ch)) {
        i += 1;
        continue;
      }
      if (/[+\-*/()%]/.test(ch)) {
        tokens.push(ch);
        i += 1;
        continue;
      }
      if (/\d|\./.test(ch)) {
        let j = i + 1;
        while (j < expression.length && /[\d.]/.test(expression[j])) j += 1;
        const raw = expression.slice(i, j);
        if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) return null;
        tokens.push(raw);
        i = j;
        continue;
      }
      return null;
    }
    return tokens;
  }

  function toRpn(tokens) {
    const output = [];
    const ops = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
    let prev = null;

    for (const token of tokens) {
      if (/^\d+(\.\d+)?$|^\.\d+$/.test(token)) {
        output.push(token);
        prev = "num";
        continue;
      }
      if (token === "%") {
        if (prev !== "num") return null;
        output.push("%");
        prev = "num";
        continue;
      }
      if (token === "(") {
        ops.push(token);
        prev = "(";
        continue;
      }
      if (token === ")") {
        let found = false;
        while (ops.length) {
          const top = ops.pop();
          if (top === "(") {
            found = true;
            break;
          }
          output.push(top);
        }
        if (!found) return null;
        prev = "num";
        continue;
      }
      if (!(token in precedence)) return null;
      if (token === "-" && (prev === null || prev === "(" || prev === "op")) {
        output.push("0");
      } else if (prev === null || prev === "(" || prev === "op") {
        return null;
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (!(top in precedence) || precedence[top] < precedence[token]) break;
        output.push(ops.pop());
      }
      ops.push(token);
      prev = "op";
    }

    while (ops.length) {
      const top = ops.pop();
      if (top === "(" || top === ")") return null;
      output.push(top);
    }
    return output;
  }

  function evalRpn(rpn) {
    const stack = [];
    for (const token of rpn) {
      if (/^\d+(\.\d+)?$|^\.\d+$/.test(token)) {
        stack.push(Number(token));
        continue;
      }
      if (token === "%") {
        if (!stack.length) return null;
        const value = stack.pop();
        stack.push(value / 100);
        continue;
      }
      const right = stack.pop();
      const left = stack.pop();
      if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
      if (token === "+") stack.push(left + right);
      else if (token === "-") stack.push(left - right);
      else if (token === "*") stack.push(left * right);
      else if (token === "/") {
        if (right === 0) return null;
        stack.push(left / right);
      } else return null;
    }
    if (stack.length !== 1) return null;
    const value = stack[0];
    return Number.isFinite(value) ? value : null;
  }

  function evaluateExpressionSafely(expression) {
    const tokens = tokenizeExpression(expression);
    if (!tokens) return null;
    const rpn = toRpn(tokens);
    if (!rpn) return null;
    return evalRpn(rpn);
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 24)));
    } catch {
      /* quota */
    }
  }

  function addHistory(type, value, renderFn) {
    if (!value) return;
    writeHistory([{ type, value: String(value).slice(0, 200), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  async function fetchExchangeRates() {
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (res.ok) {
        const data = await res.json();
        exchangeRates = data.rates || exchangeRates;
        ratesFetchedAt = new Date();
      }
    } catch {
      ratesFetchedAt = null;
    }
  }

  function initDailyTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.dailyToolsInitialized === "true") return;
    grid.dataset.dailyToolsInitialized = "true";
    grid.innerHTML = "";

    let historyCardEl = null;

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "dt-card" + (options.fullWidth ? " full-width" : "");
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `
        <div class="dt-card-header"><div class="dt-card-icon">${icon}</div><h3 class="dt-card-title">${escapeHtml(title)}</h3>${
          options.focusable !== false
            ? `<button type="button" class="btn btn-secondary dt-focus-btn" data-focus-open>Open</button><button type="button" class="btn btn-secondary dt-focus-inline-close" data-focus-close>Close</button>`
            : ""
        }</div>${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    function setResultText(node, label, text, historyType, renderFn) {
      const out = `${label}: ${text}`;
      node.textContent = out;
      node.setAttribute("role", "status");
      addHistory(historyType, text, renderFn);
    }

    function wireExport(card, prefix, getText) {
      card.querySelector(`[data-export='${prefix}-txt']`)?.addEventListener("click", () => downloadTextFile(`${prefix}-result.txt`, getText()));
    }

    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#dailyHistoryList");
      if (!container) return;
      if (!items.length) {
        container.innerHTML = '<span class="empty-hint">No daily outputs yet.</span>';
        return;
      }
      container.innerHTML = items
        .map(
          (item, idx) =>
            `<button type="button" class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.value)}</button>`
        )
        .join("");
      container.querySelectorAll("[data-idx]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          copyText(`${items[idx]?.type}: ${items[idx]?.value}`);
        })
      );
    }

    /* ---------- 1. Smart calculator ---------- */
    const calcCard = makeCard("calculator", "🧮", "Smart Calculator", `
      <p class="dt-hint">Expression mode: digits, + − × ÷ (use * /), %, parentheses. No scripts or functions.</p>
      <div class="grid-2"><div><label for="calcA">Number A</label><input id="calcA" type="number" inputmode="decimal" value="10" aria-describedby="err-calcA"><span id="err-calcA" class="dt-error" hidden></span></div>
      <div><label for="calcB">Number B</label><input id="calcB" type="number" inputmode="decimal" value="5" aria-describedby="err-calcB"><span id="err-calcB" class="dt-error" hidden></span></div></div>
      <div><label for="calcExpr">Expression</label><input id="calcExpr" type="text" inputmode="decimal" placeholder="e.g. (120+8.5)*0.18" autocomplete="off"></div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="calcAdd">A + B</button><button type="button" class="btn btn-secondary" id="calcSub">A − B</button>
        <button type="button" class="btn btn-secondary" id="calcMul">A × B</button><button type="button" class="btn btn-secondary" id="calcDiv">A ÷ B</button>
        <button type="button" class="btn btn-secondary" id="calcEval">Evaluate expr</button>
      </div>
      <details class="dt-advanced"><summary>Advanced</summary>
        <div class="grid-2"><div><label for="calcPow">A^B (power)</label><button type="button" class="btn btn-secondary" id="calcPow">Compute A^B</button></div>
        <div><label for="calcMod">A mod B</label><button type="button" class="btn btn-secondary" id="calcMod">Compute mod</button></div></div>
      </details>
      <div id="calcRes" class="result result-large" role="status">Result: —</div>
      <div class="inline-row"><button type="button" class="btn btn-secondary" id="calcCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="calc-txt">Download .txt</button></div>
    `);
    const calcRes = calcCard.querySelector("#calcRes");
    function basicCalc(op) {
      const aEl = calcCard.querySelector("#calcA");
      const bEl = calcCard.querySelector("#calcB");
      setFieldError(aEl, "");
      setFieldError(bEl, "");
      const a = safeNum(aEl.value, NaN);
      const b = safeNum(bEl.value, NaN);
      if (!Number.isFinite(a)) {
        setFieldError(aEl, "Enter a valid number.");
        calcRes.textContent = "Result: fix inputs.";
        return;
      }
      if (!Number.isFinite(b)) {
        setFieldError(bEl, "Enter a valid number.");
        calcRes.textContent = "Result: fix inputs.";
        return;
      }
      let val;
      if (op === "+") val = a + b;
      else if (op === "-") val = a - b;
      else if (op === "*") val = a * b;
      else if (op === "/") val = b === 0 ? NaN : a / b;
      if (!Number.isFinite(val)) {
        calcRes.textContent = "Result: invalid operation (division by zero?).";
        return;
      }
      setResultText(calcRes, "Result", String(val), "Calculator", renderHistory);
    }
    calcCard.querySelector("#calcAdd").onclick = () => basicCalc("+");
    calcCard.querySelector("#calcSub").onclick = () => basicCalc("-");
    calcCard.querySelector("#calcMul").onclick = () => basicCalc("*");
    calcCard.querySelector("#calcDiv").onclick = () => basicCalc("/");
    calcCard.querySelector("#calcEval").onclick = () => {
      const expr = (calcCard.querySelector("#calcExpr").value || "").trim();
      if (!expr) {
        calcRes.textContent = "Result: enter an expression.";
        return;
      }
      if (!/^[0-9+\-*/().%\s]+$/.test(expr)) {
        calcRes.textContent = "Result: only digits and + - * / % ( ) allowed.";
        return;
      }
      const result = evaluateExpressionSafely(expr);
      if (result === null) {
        calcRes.textContent = "Result: could not evaluate (check parentheses / operators).";
        return;
      }
      setResultText(calcRes, "Result", String(result), "Expression", renderHistory);
    };
    calcCard.querySelector("#calcPow").onclick = () => {
      const a = safeNum(calcCard.querySelector("#calcA").value, NaN);
      const b = safeNum(calcCard.querySelector("#calcB").value, NaN);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        calcRes.textContent = "Result: need valid A and B.";
        return;
      }
      const v = Math.pow(a, b);
      if (!Number.isFinite(v)) {
        calcRes.textContent = "Result: out of range.";
        return;
      }
      setResultText(calcRes, "A^B", String(v), "Power", renderHistory);
    };
    calcCard.querySelector("#calcMod").onclick = () => {
      const a = safeNum(calcCard.querySelector("#calcA").value, NaN);
      const b = safeNum(calcCard.querySelector("#calcB").value, NaN);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) {
        calcRes.textContent = "Result: need valid A and non-zero B.";
        return;
      }
      setResultText(calcRes, "A mod B", String(((a % b) + b) % b), "Mod", renderHistory);
    };
    calcCard.querySelector("#calcCopy").onclick = () => copyText(calcRes.textContent.replace(/^Result:\s*/, ""));
    wireExport(calcCard, "calc", () => calcRes.textContent);

    /* ---------- 2. GST ---------- */
    const gstCard = makeCard("gst", "📊", "GST (India-style)", `
      <div class="grid-2"><div><label for="gstAmt">Amount (₹)</label><input id="gstAmt" type="number" inputmode="decimal" min="0" step="any" value="1000"></div>
      <div><label for="gstRate">GST rate (%)</label><input id="gstRate" type="number" inputmode="decimal" min="0" step="any" value="18"></div></div>
      <div class="grid-2"><div><label for="gstRound">Round line items</label><select id="gstRound"><option value="none">No rounding</option><option value="paise">2 decimals</option><option value="rupee">Nearest ₹1</option></select></div>
      <div><label><input type="checkbox" id="gstSplit"> Show CGST + SGST split (half rate each)</label></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="gstAdd">Add GST (exclusive base)</button><button type="button" class="btn btn-secondary" id="gstRemove">Remove GST (inclusive)</button></div>
      <div id="gstRes" class="result" role="status">GST: —</div>
      <div class="inline-row"><button type="button" class="btn btn-secondary" id="gstCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="gst-txt">Download .txt</button></div>
    `);
    const gstRes = gstCard.querySelector("#gstRes");
    function roundMoney(x, mode) {
      if (mode === "rupee") return Math.round(x);
      if (mode === "paise") return Math.round(x * 100) / 100;
      return x;
    }
    function parseGst() {
      const base = safeNum(gstCard.querySelector("#gstAmt").value, NaN);
      const rate = safeNum(gstCard.querySelector("#gstRate").value, NaN);
      if (!Number.isFinite(base) || !Number.isFinite(rate) || base < 0 || rate < 0) return null;
      return { base, rate };
    }
    gstCard.querySelector("#gstAdd").onclick = () => {
      const d = parseGst();
      if (!d) {
        gstRes.textContent = "Enter valid amount and rate (≥ 0).";
        return;
      }
      const mode = gstCard.querySelector("#gstRound").value;
      let tax = (d.base * d.rate) / 100;
      let total = d.base + tax;
      tax = roundMoney(tax, mode);
      total = roundMoney(total, mode);
      const split = gstCard.querySelector("#gstSplit").checked;
      let extra = "";
      if (split && d.rate > 0) {
        const half = roundMoney(tax / 2, mode);
        extra = ` | CGST ${half} + SGST ${half} (approx.)`;
      }
      const line = `Base ${moneyInr(d.base)} | Tax ${moneyInr(tax)} | Total ${moneyInr(total)}${extra}`;
      gstRes.textContent = line;
      addHistory("GST Add", line, renderHistory);
    };
    gstCard.querySelector("#gstRemove").onclick = () => {
      const d = parseGst();
      if (!d) {
        gstRes.textContent = "Enter valid inclusive amount and rate.";
        return;
      }
      const mode = gstCard.querySelector("#gstRound").value;
      const base = (d.base * 100) / (100 + d.rate);
      const tax = d.base - base;
      const b = roundMoney(base, mode);
      const t = roundMoney(tax, mode);
      const split = gstCard.querySelector("#gstSplit").checked;
      let extra = "";
      if (split && d.rate > 0) {
        const half = roundMoney(t / 2, mode);
        extra = ` | CGST ${half} + SGST ${half} (approx.)`;
      }
      const line = `Taxable ${moneyInr(b)} | Tax ${moneyInr(t)} | Inclusive ${moneyInr(d.base)}${extra}`;
      gstRes.textContent = line;
      addHistory("GST Remove", line, renderHistory);
    };
    gstCard.querySelector("#gstCopy").onclick = () => copyText(gstRes.textContent);
    wireExport(gstCard, "gst", () => gstRes.textContent);

    /* ---------- 3. Age & dates ---------- */
    const ageCard = makeCard("age", "📅", "Age & date tools", `
      <div class="grid-2"><div><label for="dob">Birth date</label><input id="dob" type="date"></div><div><label for="targetDate">As on</label><input id="targetDate" type="date"></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="ageBtn">Calculate age</button></div>
      <div id="ageRes" class="result" role="status">Age: —</div>
      <div class="grid-2" style="margin-top:1rem"><div><label for="startDate">Start</label><input id="startDate" type="date"></div><div><label for="endDate">End</label><input id="endDate" type="date"></div></div>
      <details class="dt-advanced"><summary>Advanced</summary>
        <p class="dt-hint">Business days exclude weekends only (not holidays).</p>
        <div class="inline-row"><button type="button" class="btn btn-secondary" id="diffBtn">Calendar days</button><button type="button" class="btn btn-secondary" id="bizBtn">Business days</button></div>
      </details>
      <div id="diffRes" class="result" role="status">Difference: —</div>
      <div class="inline-row"><button type="button" class="btn btn-secondary" data-export="age-txt">Download summary .txt</button></div>
    `);
    const ageRes = ageCard.querySelector("#ageRes");
    const diffRes = ageCard.querySelector("#diffRes");
    ageCard.querySelector("#ageBtn").onclick = () => {
      const dobVal = ageCard.querySelector("#dob").value;
      if (!dobVal) {
        ageRes.textContent = "Age: choose birth date.";
        return;
      }
      const targetVal = ageCard.querySelector("#targetDate").value;
      const dob = new Date(dobVal + "T12:00:00");
      const target = targetVal ? new Date(targetVal + "T12:00:00") : new Date();
      if (target < dob) {
        ageRes.textContent = "Age: “as on” must be on or after birth date.";
        return;
      }
      let years = target.getFullYear() - dob.getFullYear();
      let months = target.getMonth() - dob.getMonth();
      let days = target.getDate() - dob.getDate();
      if (days < 0) {
        months -= 1;
        days += new Date(target.getFullYear(), target.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      const nextBd = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBd < target) nextBd.setFullYear(nextBd.getFullYear() + 1);
      const msDay = 86400000;
      const daysToBd = Math.ceil((nextBd - target) / msDay);
      const summary = `${years}y ${months}m ${days}d · Next birthday in ${daysToBd} day(s)`;
      ageRes.textContent = `Age: ${summary}`;
      addHistory("Age", summary, renderHistory);
    };
    function countBizDays(a, b) {
      const start = a < b ? a : b;
      const end = a < b ? b : a;
      let n = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const w = d.getDay();
        if (w !== 0 && w !== 6) n += 1;
      }
      return n;
    }
    ageCard.querySelector("#diffBtn").onclick = () => {
      const startVal = ageCard.querySelector("#startDate").value;
      const endVal = ageCard.querySelector("#endDate").value;
      if (!startVal || !endVal) {
        diffRes.textContent = "Difference: select start and end.";
        return;
      }
      const a = new Date(startVal + "T12:00:00");
      const b = new Date(endVal + "T12:00:00");
      const days = Math.floor(Math.abs(b - a) / 86400000);
      diffRes.textContent = `Difference: ${days} calendar day(s)`;
      addHistory("Date diff", `${days} days`, renderHistory);
    };
    ageCard.querySelector("#bizBtn").onclick = () => {
      const startVal = ageCard.querySelector("#startDate").value;
      const endVal = ageCard.querySelector("#endDate").value;
      if (!startVal || !endVal) {
        diffRes.textContent = "Difference: select start and end.";
        return;
      }
      const a = new Date(startVal + "T12:00:00");
      const b = new Date(endVal + "T12:00:00");
      const n = countBizDays(a, b);
      diffRes.textContent = `Difference: ${n} business day(s) (Mon–Fri)`;
      addHistory("Biz days", String(n), renderHistory);
    };
    wireExport(ageCard, "age", () => `${ageRes.textContent}\n${diffRes.textContent}`);

    /* ---------- 4. Currency ---------- */
    const currencyCard = makeCard("currency", "💱", "Currency converter", `
      <p class="dt-hint" id="curHint">Rates: live when available (USD base). Fallback demo rates if offline.</p>
      <div class="grid-2"><div><label for="curAmt">Amount</label><input id="curAmt" type="number" inputmode="decimal" min="0" step="any" value="100"></div>
      <div><label for="curPrec">Decimals</label><input id="curPrec" type="number" inputmode="numeric" min="0" max="8" value="2"></div></div>
      <div class="grid-2"><div><label for="curFrom">From</label><select id="curFrom">${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
      <div><label for="curTo">To</label><select id="curTo">${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="curConvert">Convert</button><button type="button" class="btn btn-secondary" id="curSwap">Swap</button><button type="button" class="btn btn-secondary" id="curCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="currency-txt">Download .txt</button></div>
      <div id="curRes" class="result result-large" role="status">—</div><div id="curRate" class="result dt-muted" role="status">—</div>
    `);
    let curText = "";
    function runCurrency() {
      const amt = safeNum(currencyCard.querySelector("#curAmt").value, NaN);
      const prec = Math.max(0, Math.min(8, safeNum(currencyCard.querySelector("#curPrec").value, 2)));
      if (!Number.isFinite(amt) || amt < 0) {
        currencyCard.querySelector("#curRes").textContent = "Enter a valid non-negative amount.";
        return;
      }
      const from = currencyCard.querySelector("#curFrom").value;
      const to = currencyCard.querySelector("#curTo").value;
      const rf = exchangeRates[from];
      const rt = exchangeRates[to];
      if (!rf || !rt) {
        currencyCard.querySelector("#curRes").textContent = "Missing rate for selected currency.";
        return;
      }
      const rate = rt / rf;
      const result = amt * rate;
      curText = `${amt.toFixed(prec)} ${from} = ${result.toFixed(prec)} ${to}`;
      currencyCard.querySelector("#curRes").textContent = curText;
      currencyCard.querySelector("#curRate").textContent = `1 ${from} = ${rate.toFixed(6)} ${to}${ratesFetchedAt ? ` · updated ${ratesFetchedAt.toLocaleString()}` : ""}`;
      addHistory("Currency", curText, renderHistory);
    }
    currencyCard.querySelector("#curConvert").onclick = runCurrency;
    currencyCard.querySelector("#curSwap").onclick = () => {
      const f = currencyCard.querySelector("#curFrom");
      const t = currencyCard.querySelector("#curTo");
      [f.value, t.value] = [t.value, f.value];
      runCurrency();
    };
    currencyCard.querySelector("#curCopy").onclick = () => copyText(curText);
    fetchExchangeRates().then(runCurrency);
    wireExport(currencyCard, "currency", () => curText);

    /* ---------- 5. BMI ---------- */
    const bmiCard = makeCard("bmi", "⚖️", "BMI calculator", `
      <div class="grid-2"><div><label for="bmiW">Weight (kg)</label><input id="bmiW" type="number" inputmode="decimal" min="0" step="any" value="70"></div>
      <div><label for="bmiH">Height (cm)</label><input id="bmiH" type="number" inputmode="decimal" min="0" step="any" value="170"></div></div>
      <details class="dt-advanced"><summary>Imperial</summary>
        <div class="grid-2"><div><label for="bmiLb">Weight (lb)</label><input id="bmiLb" type="number" inputmode="decimal" placeholder="optional"></div>
        <div><label for="bmiFt">Height (decimal feet, e.g. 5.83 = 5′10″)</label><input id="bmiFt" type="text" inputmode="decimal" placeholder="5.83"></div></div>
        <p class="dt-hint">If imperial fields filled, they override kg/cm.</p>
        <button type="button" class="btn btn-secondary" id="bmiImpApply">Apply imperial → metric</button>
      </details>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="bmiCalc">Calculate</button><button type="button" class="btn btn-secondary" id="bmiCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="bmi-txt">Download .txt</button></div>
      <div id="bmiRes" class="result result-large" role="status">—</div>
      <p class="dt-hint">For medical decisions, consult a professional.</p>
    `);
    bmiCard.querySelector("#bmiImpApply").onclick = () => {
      const lb = safeNum(bmiCard.querySelector("#bmiLb").value, NaN);
      const raw = (bmiCard.querySelector("#bmiFt").value || "").trim();
      if (!Number.isFinite(lb) || lb <= 0 || !raw) return;
      let cm = NaN;
      if (/^\d+(\.\d+)?$/.test(raw)) {
        const ftDec = safeNum(raw, NaN);
        if (Number.isFinite(ftDec)) cm = ftDec * 30.48;
      } else {
        const parts = raw.split(/[.'\s]+/).filter(Boolean);
        const feet = safeNum(parts[0], NaN);
        const inches = parts.length > 1 ? safeNum(parts[1], 0) : 0;
        if (Number.isFinite(feet) && feet >= 0 && inches >= 0 && inches < 12) cm = (feet * 12 + inches) * 2.54;
      }
      if (!Number.isFinite(cm) || cm <= 0) return;
      const kg = lb * 0.45359237;
      bmiCard.querySelector("#bmiW").value = String(Math.round(kg * 100) / 100);
      bmiCard.querySelector("#bmiH").value = String(Math.round(cm * 10) / 10);
    };
    bmiCard.querySelector("#bmiCalc").onclick = () => {
      const w = safeNum(bmiCard.querySelector("#bmiW").value, 0);
      const hCm = safeNum(bmiCard.querySelector("#bmiH").value, 0);
      if (w <= 0 || hCm <= 0) {
        bmiCard.querySelector("#bmiRes").textContent = "Enter positive weight and height.";
        return;
      }
      const bmi = w / (hCm / 100) ** 2;
      const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
      const line = `BMI ${bmi.toFixed(2)} (${category})`;
      bmiCard.querySelector("#bmiRes").textContent = line;
      addHistory("BMI", line, renderHistory);
    };
    bmiCard.querySelector("#bmiCopy").onclick = () => copyText(bmiCard.querySelector("#bmiRes").textContent);
    wireExport(bmiCard, "bmi", () => bmiCard.querySelector("#bmiRes").textContent);

    /* ---------- 6. EMI + amortization ---------- */
    const emiCard = makeCard("emi", "🏦", "EMI & amortization", `
      <div class="grid-2"><div><label for="emiP">Principal (₹)</label><input id="emiP" type="number" inputmode="decimal" min="0" step="any" value="500000"></div>
      <div><label for="emiR">Interest % p.a.</label><input id="emiR" type="number" inputmode="decimal" min="0" step="any" value="10.5"></div></div>
      <div class="grid-2"><div><label for="emiM">Tenure (months)</label><input id="emiM" type="number" inputmode="numeric" min="1" value="36"></div>
      <div><label for="emiDown">Down payment (₹)</label><input id="emiDown" type="number" inputmode="decimal" min="0" step="any" value="0"></div></div>
      <details class="dt-advanced"><summary>Extra monthly prepayment</summary>
        <label for="emiExtra">Added to EMI each month (₹)</label><input id="emiExtra" type="number" inputmode="decimal" min="0" step="any" value="0">
      </details>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="emiCalc">Calculate</button><button type="button" class="btn btn-secondary" id="emiCsv">Download schedule CSV</button><button type="button" class="btn btn-secondary" id="emiCopy">Copy summary</button><button type="button" class="btn btn-secondary" data-export="emi-txt">Download .txt</button></div>
      <div id="emiRes" class="result" role="status">—</div>
    `);
    const emiRes = emiCard.querySelector("#emiRes");
    let lastEmiRows = [];
    let lastEmiSummary = "";
    function computeEmiSchedule() {
      const rawP = safeNum(emiCard.querySelector("#emiP").value, 0);
      const down = safeNum(emiCard.querySelector("#emiDown").value, 0);
      const principal = Math.max(0, rawP - down);
      const annualRate = safeNum(emiCard.querySelector("#emiR").value, 0);
      const months = Math.max(1, Math.floor(safeNum(emiCard.querySelector("#emiM").value, 1)));
      const extra = Math.max(0, safeNum(emiCard.querySelector("#emiExtra").value, 0));
      if (principal <= 0) return { error: "Principal after down payment must be > 0." };
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const rows = [["Month", "Opening", "Payment", "Principal", "Interest", "Closing"]];
      let bal = principal;
      let totalInt = 0;
      let m = 0;
      const maxRows = 600;
      while (bal > 0.01 && m < maxRows) {
        m += 1;
        const interest = bal * mr;
        let princPart = emi - interest + extra;
        let pay = emi + extra;
        if (princPart > bal) {
          princPart = bal;
          pay = interest + bal;
        }
        const open = bal;
        bal = Math.max(0, bal - princPart);
        totalInt += interest;
        rows.push([m, open.toFixed(2), pay.toFixed(2), princPart.toFixed(2), interest.toFixed(2), bal.toFixed(2)]);
        if (bal <= 0) break;
      }
      const totalPay = principal + totalInt;
      const summary = `EMI ${moneyInr(emi)}/mo · Months ${m} · Interest ${moneyInr(totalInt)} · Total ${moneyInr(totalPay)}${extra ? ` · incl. extra ${moneyInr(extra)}/mo` : ""}`;
      return { rows, summary, emi, months: m, totalInt, totalPay };
    }
    emiCard.querySelector("#emiCalc").onclick = () => {
      const r = computeEmiSchedule();
      if (r.error) {
        emiRes.textContent = r.error;
        lastEmiRows = [];
        lastEmiSummary = "";
        return;
      }
      lastEmiRows = r.rows;
      lastEmiSummary = r.summary;
      emiRes.textContent = r.summary;
      addHistory("EMI", r.summary, renderHistory);
    };
    emiCard.querySelector("#emiCsv").onclick = () => {
      if (!lastEmiRows.length) {
        emiCard.querySelector("#emiCalc").click();
      }
      if (lastEmiRows.length) downloadCsv("emi-schedule.csv", lastEmiRows);
    };
    emiCard.querySelector("#emiCopy").onclick = () => copyText(lastEmiSummary || emiRes.textContent);
    wireExport(emiCard, "emi", () => lastEmiSummary || emiRes.textContent);

    /* ---------- 7. Loan (years) ---------- */
    const loanCard = makeCard("loan", "🏠", "Loan (yearly term)", `
      <div class="grid-2"><div><label for="loanP">Principal (₹)</label><input id="loanP" type="number" inputmode="decimal" min="0" value="250000"></div>
      <div><label for="loanR">Interest % p.a.</label><input id="loanR" type="number" inputmode="decimal" min="0" value="7.5"></div></div>
      <div><label for="loanY">Term (years)</label><input id="loanY" type="number" inputmode="decimal" min="0.25" step="any" value="5"></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="loanCalc">Calculate</button><button type="button" class="btn btn-secondary" id="loanCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="loan-txt">Download .txt</button></div>
      <div id="loanRes" class="result" role="status">—</div>
    `);
    loanCard.querySelector("#loanCalc").onclick = () => {
      const principal = safeNum(loanCard.querySelector("#loanP").value, 0);
      const annualRate = safeNum(loanCard.querySelector("#loanR").value, 0);
      const years = safeNum(loanCard.querySelector("#loanY").value, 0);
      if (principal <= 0 || years <= 0) {
        loanCard.querySelector("#loanRes").textContent = "Enter valid principal and term.";
        return;
      }
      const months = Math.max(1, Math.round(years * 12));
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const total = emi * months;
      const interest = total - principal;
      const line = `Payment ${moneyInr(emi)}/mo (${months} mo) · Interest ${moneyInr(interest)} · Total ${moneyInr(total)}`;
      loanCard.querySelector("#loanRes").textContent = line;
      addHistory("Loan", line, renderHistory);
    };
    loanCard.querySelector("#loanCopy").onclick = () => copyText(loanCard.querySelector("#loanRes").textContent);
    wireExport(loanCard, "loan", () => loanCard.querySelector("#loanRes").textContent);

    /* ---------- 8. Tip ---------- */
    const tipCard = makeCard("tip", "🍽️", "Tip splitter", `
      <div class="grid-2"><div><label for="tipBill">Bill (₹)</label><input id="tipBill" type="number" inputmode="decimal" min="0" step="any" value="2500"></div>
      <div><label for="tipPct">Tip %</label><input id="tipPct" type="number" inputmode="decimal" min="0" value="15"></div></div>
      <div class="grid-2"><div><label for="tipPeople">People</label><input id="tipPeople" type="number" inputmode="numeric" min="1" value="2"></div>
      <div><label for="tipRound">Round per person to</label><select id="tipRound"><option value="0">No rounding</option><option value="1">₹1</option><option value="5">₹5</option><option value="10">₹10</option></select></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="tipCalc">Calculate</button><button type="button" class="btn btn-secondary" id="tipCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="tip-txt">Download .txt</button></div>
      <div id="tipRes" class="result" role="status">—</div>
    `);
    tipCard.querySelector("#tipCalc").onclick = () => {
      const bill = safeNum(tipCard.querySelector("#tipBill").value, NaN);
      const tipPct = safeNum(tipCard.querySelector("#tipPct").value, NaN);
      const people = Math.max(1, Math.floor(safeNum(tipCard.querySelector("#tipPeople").value, 1)));
      if (!Number.isFinite(bill) || bill < 0 || !Number.isFinite(tipPct) || tipPct < 0) {
        tipCard.querySelector("#tipRes").textContent = "Enter valid bill and tip %.";
        return;
      }
      const tip = (bill * tipPct) / 100;
      const total = bill + tip;
      let per = total / people;
      const rnd = safeNum(tipCard.querySelector("#tipRound").value, 0);
      if (rnd > 0) per = Math.ceil(per / rnd) * rnd;
      const line = `Tip ${moneyInr(tip)} · Total ${moneyInr(total)} · Per person ${moneyInr(per)} (${people} people)`;
      tipCard.querySelector("#tipRes").textContent = line;
      addHistory("Tip", line, renderHistory);
    };
    tipCard.querySelector("#tipCopy").onclick = () => copyText(tipCard.querySelector("#tipRes").textContent);
    wireExport(tipCard, "tip", () => tipCard.querySelector("#tipRes").textContent);

    /* ---------- 9. Unit converter (multi) ---------- */
    const LENGTH = { mm: 0.001, cm: 0.01, m: 1, km: 1000, ft: 0.3048, in: 0.0254, yd: 0.9144, mi: 1609.344 };
    const MASS = { mg: 0.001, g: 1, kg: 1000, lb: 453.59237, oz: 28.349523125 };
    const VOL = { ml: 1, l: 1000, "us_cup": 236.5882365, "us_gal": 3785.411784, "us_floz": 29.5735295625 };
    const converterCard = makeCard("converter", "⇄", "Unit converter", `
      <div><label for="convCat">Category</label><select id="convCat"><option value="length">Length</option><option value="mass">Mass</option><option value="temp">Temperature</option><option value="volume">Volume (US)</option></select></div>
      <div class="grid-3"><div><label for="convVal">Value</label><input id="convVal" type="number" inputmode="decimal" step="any" value="1"></div>
      <div><label for="convFrom">From</label><select id="convFrom"></select></div><div><label for="convTo">To</label><select id="convTo"></select></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="convBtn">Convert</button><button type="button" class="btn btn-secondary" id="convSwap">Swap</button><button type="button" class="btn btn-secondary" id="convCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="converter-txt">Download .txt</button></div>
      <div id="convRes" class="result result-large" role="status">—</div>
    `);
    function fillConvSelects(cat) {
      const from = converterCard.querySelector("#convFrom");
      const to = converterCard.querySelector("#convTo");
      const opts = cat === "length"
        ? Object.keys(LENGTH)
        : cat === "mass"
          ? Object.keys(MASS)
          : cat === "volume"
            ? Object.keys(VOL)
            : ["C", "F", "K"];
      const html = opts.map((o) => `<option value="${o}">${o}</option>`).join("");
      from.innerHTML = html;
      to.innerHTML = html;
      if (opts.length > 1) to.selectedIndex = 1;
    }
    function convertTemp(val, from, to) {
      let c;
      if (from === "C") c = val;
      else if (from === "F") c = ((val - 32) * 5) / 9;
      else if (from === "K") c = val - 273.15;
      else return null;
      if (to === "C") return c;
      if (to === "F") return (c * 9) / 5 + 32;
      if (to === "K") return c + 273.15;
      return null;
    }
    function runConvert() {
      const cat = converterCard.querySelector("#convCat").value;
      const val = safeNum(converterCard.querySelector("#convVal").value, NaN);
      if (!Number.isFinite(val)) {
        converterCard.querySelector("#convRes").textContent = "Enter a valid value.";
        return;
      }
      const from = converterCard.querySelector("#convFrom").value;
      const to = converterCard.querySelector("#convTo").value;
      const out = cat === "temp"
        ? convertTemp(val, from, to)
        : (() => {
            const table = cat === "length" ? LENGTH : cat === "mass" ? MASS : VOL;
            const metersOrBase = val * table[from];
            return metersOrBase / table[to];
          })();
      if (!Number.isFinite(out)) {
        converterCard.querySelector("#convRes").textContent = "Conversion failed.";
        return;
      }
      const text = `${val} ${from} = ${out.toFixed(6)} ${to}`;
      converterCard.querySelector("#convRes").textContent = text;
      addHistory("Convert", text, renderHistory);
    }
    converterCard.querySelector("#convCat").onchange = () => {
      fillConvSelects(converterCard.querySelector("#convCat").value);
      runConvert();
    };
    converterCard.querySelector("#convBtn").onclick = runConvert;
    converterCard.querySelector("#convSwap").onclick = () => {
      const f = converterCard.querySelector("#convFrom");
      const t = converterCard.querySelector("#convTo");
      [f.value, t.value] = [t.value, f.value];
      runConvert();
    };
    converterCard.querySelector("#convCopy").onclick = () => copyText(converterCard.querySelector("#convRes").textContent);
    fillConvSelects("length");
    runConvert();
    wireExport(converterCard, "converter", () => converterCard.querySelector("#convRes").textContent);

    /* ---------- 10. Discount & markup ---------- */
    const discCard = makeCard("discount", "🏷️", "Discount & markup", `
      <div class="grid-2"><div><label for="discPrice">List price (₹)</label><input id="discPrice" type="number" inputmode="decimal" min="0" step="any" value="4999"></div>
      <div><label for="discPct">Discount %</label><input id="discPct" type="number" inputmode="decimal" min="0" max="100" value="25"></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="discSale">Calculate sale price</button></div>
      <details class="dt-advanced"><summary>Reverse: cost + target margin %</summary>
        <div class="grid-2"><div><label for="discCost">Cost (₹)</label><input id="discCost" type="number" inputmode="decimal" min="0" value="3200"></div>
        <div><label for="discMargin">Desired margin %</label><input id="discMargin" type="number" inputmode="decimal" min="0" max="99" value="40"></div></div>
        <button type="button" class="btn btn-secondary" id="discPriceFromMargin">Compute list price</button>
      </details>
      <div id="discRes" class="result" role="status">—</div>
      <div class="inline-row"><button type="button" class="btn btn-secondary" id="discCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="discount-txt">Download .txt</button></div>
    `);
    const discRes = discCard.querySelector("#discRes");
    discCard.querySelector("#discSale").onclick = () => {
      const p = safeNum(discCard.querySelector("#discPrice").value, NaN);
      const pct = safeNum(discCard.querySelector("#discPct").value, NaN);
      if (!Number.isFinite(p) || p < 0 || !Number.isFinite(pct) || pct < 0 || pct > 100) {
        discRes.textContent = "Enter valid price and discount %.";
        return;
      }
      const sale = p * (1 - pct / 100);
      const save = p - sale;
      discRes.textContent = `Sale ${moneyInr(sale)} · You save ${moneyInr(save)} (${pct}%)`;
      addHistory("Discount", discRes.textContent, renderHistory);
    };
    discCard.querySelector("#discPriceFromMargin").onclick = () => {
      const cost = safeNum(discCard.querySelector("#discCost").value, NaN);
      const m = safeNum(discCard.querySelector("#discMargin").value, NaN);
      if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(m) || m <= 0 || m >= 100) {
        discRes.textContent = "Enter valid cost and margin % (0–100).";
        return;
      }
      const list = cost / (1 - m / 100);
      discRes.textContent = `For ${m}% margin on cost ${moneyInr(cost)} → list ≈ ${moneyInr(list)}`;
      addHistory("Margin price", discRes.textContent, renderHistory);
    };
    discCard.querySelector("#discCopy").onclick = () => copyText(discRes.textContent);
    wireExport(discCard, "discount", () => discRes.textContent);

    /* ---------- 11. Percentage lab ---------- */
    const pctCard = makeCard("percent", "％", "Percentage lab", `
      <div><label for="pctMode">Mode</label><select id="pctMode"><option value="of">What is P% of X?</option><option value="is">X is what % of Y?</option><option value="chg">% change from old → new</option></select></div>
      <div class="grid-2" id="pctRowA"><div><label for="pctP" id="lblPctP">P (%)</label><input id="pctP" type="number" inputmode="decimal" value="18"></div><div><label for="pctX" id="lblPctX">X</label><input id="pctX" type="number" inputmode="decimal" value="2500"></div></div>
      <div class="grid-2" id="pctRowB"><div><label for="pctY" id="lblPctY">Y</label><input id="pctY" type="number" inputmode="decimal" value="10000"></div></div>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="pctRun">Calculate</button><button type="button" class="btn btn-secondary" id="pctCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="percent-txt">Download .txt</button></div>
      <div id="pctRes" class="result" role="status">—</div>
    `);
    const pctMode = pctCard.querySelector("#pctMode");
    const pctRowA = pctCard.querySelector("#pctRowA");
    const pctRowB = pctCard.querySelector("#pctRowB");
    const lblP = pctCard.querySelector("#lblPctP");
    const lblX = pctCard.querySelector("#lblPctX");
    const lblY = pctCard.querySelector("#lblPctY");
    function syncPctForm() {
      const m = pctMode.value;
      if (m === "of") {
        pctRowA.style.display = "grid";
        pctRowB.style.display = "none";
        lblP.textContent = "P (%)";
        lblX.textContent = "X";
        pctCard.querySelector("#pctP").closest("div").style.display = "";
      } else if (m === "is") {
        pctRowA.style.display = "grid";
        pctRowB.style.display = "grid";
        pctCard.querySelector("#pctP").closest("div").style.display = "none";
        lblX.textContent = "X";
        lblY.textContent = "Y";
      } else {
        pctRowA.style.display = "grid";
        pctRowB.style.display = "grid";
        pctCard.querySelector("#pctP").closest("div").style.display = "none";
        lblX.textContent = "Old value";
        lblY.textContent = "New value";
      }
    }
    pctMode.addEventListener("change", syncPctForm);
    syncPctForm();
    pctCard.querySelector("#pctRun").onclick = () => {
      const m = pctMode.value;
      const p = safeNum(pctCard.querySelector("#pctP").value, NaN);
      const x = safeNum(pctCard.querySelector("#pctX").value, NaN);
      const y = safeNum(pctCard.querySelector("#pctY").value, NaN);
      const line = (() => {
        if (m === "of") {
          if (!Number.isFinite(p) || !Number.isFinite(x)) {
            pctCard.querySelector("#pctRes").textContent = "Enter valid P and X.";
            return "";
          }
          return `${p}% of ${x} = ${((p / 100) * x).toFixed(4)}`;
        }
        if (m === "is") {
          if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0) {
            pctCard.querySelector("#pctRes").textContent = "Enter valid X and Y (Y ≠ 0).";
            return "";
          }
          return `${x} is ${((x / y) * 100).toFixed(4)}% of ${y}`;
        }
        const oldV = x;
        const newV = y;
        if (!Number.isFinite(oldV) || !Number.isFinite(newV) || oldV === 0) {
          pctCard.querySelector("#pctRes").textContent = "Use X = old value, Y = new value (old ≠ 0).";
          return "";
        }
        const c = ((newV - oldV) / oldV) * 100;
        return `Change ${c.toFixed(4)}% (${oldV} → ${newV})`;
      })();
      if (!line) return;
      pctCard.querySelector("#pctRes").textContent = line;
      addHistory("Percent", line, renderHistory);
    };
    pctCard.querySelector("#pctCopy").onclick = () => copyText(pctCard.querySelector("#pctRes").textContent);
    wireExport(pctCard, "percent", () => pctCard.querySelector("#pctRes").textContent);

    /* ---------- 12. Compound interest ---------- */
    const cmpCard = makeCard("compound", "📈", "Compound growth", `
      <div class="grid-2"><div><label for="cmpP">Principal (₹)</label><input id="cmpP" type="number" inputmode="decimal" min="0" value="100000"></div>
      <div><label for="cmpR">Annual rate %</label><input id="cmpR" type="number" inputmode="decimal" min="0" value="12"></div></div>
      <div class="grid-2"><div><label for="cmpY">Years</label><input id="cmpY" type="number" inputmode="decimal" min="0" value="10"></div>
      <div><label for="cmpMonthly">Monthly contribution (₹)</label><input id="cmpMonthly" type="number" inputmode="decimal" min="0" value="5000"></div></div>
      <p class="dt-hint">Monthly compounding, end-of-month contributions. Projection only — not investment advice.</p>
      <div class="inline-row"><button type="button" class="btn btn-primary" id="cmpRun">Project</button><button type="button" class="btn btn-secondary" id="cmpCopy">Copy</button><button type="button" class="btn btn-secondary" data-export="compound-txt">Download .txt</button></div>
      <div id="cmpRes" class="result" role="status">—</div>
    `);
    cmpCard.querySelector("#cmpRun").onclick = () => {
      const P0 = safeNum(cmpCard.querySelector("#cmpP").value, 0);
      const annual = safeNum(cmpCard.querySelector("#cmpR").value, 0);
      const years = safeNum(cmpCard.querySelector("#cmpY").value, 0);
      const pmt = safeNum(cmpCard.querySelector("#cmpMonthly").value, 0);
      if (years < 0 || P0 < 0 || pmt < 0) {
        cmpCard.querySelector("#cmpRes").textContent = "Enter valid inputs.";
        return;
      }
      const n = Math.max(0, Math.round(years * 12));
      const r = annual / 100 / 12;
      let acc = P0 * Math.pow(1 + r, n);
      if (pmt > 0 && r === 0) acc += pmt * n;
      else if (pmt > 0 && r !== 0) acc += pmt * ((Math.pow(1 + r, n) - 1) / r);
      const contrib = P0 + pmt * n;
      const gain = acc - contrib;
      const line = `FV ≈ ${moneyInr(acc)} · Contributed ${moneyInr(contrib)} · Gain ${moneyInr(gain)} (${years}y @ ${annual}% p.a., monthly)`;
      cmpCard.querySelector("#cmpRes").textContent = line;
      addHistory("Compound", line, renderHistory);
    };
    cmpCard.querySelector("#cmpCopy").onclick = () => copyText(cmpCard.querySelector("#cmpRes").textContent);
    wireExport(cmpCard, "compound", () => cmpCard.querySelector("#cmpRes").textContent);

    /* ---------- History ---------- */
    const historyCard = makeCard(
      "history",
      "📜",
      "Recent outputs",
      `
      <div id="dailyHistoryList" class="chip-list"><span class="empty-hint">No daily outputs yet.</span></div>
      <div class="inline-row"><button type="button" class="btn btn-secondary" id="dailyHistoryCopy">Copy all</button><button type="button" class="btn btn-secondary" id="dailyHistoryExport">Export .txt</button><button type="button" class="btn btn-secondary" id="dailyHistoryClear">Clear</button></div>
    `,
      { focusable: false, fullWidth: true }
    );
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#dailyHistoryCopy").onclick = () => copyText(readHistory().map((item) => `${item.type}: ${item.value}`).join("\n"));
    historyCard.querySelector("#dailyHistoryExport").onclick = () => {
      const lines = [
        "Qwickton Daily Tools — history",
        `Generated: ${new Date().toLocaleString()}`,
        "",
        ...readHistory().map((item, idx) => `${idx + 1}. ${item.type}: ${item.value}`),
      ];
      downloadTextFile("daily-tools-history.txt", lines.join("\n"));
    };
    historyCard.querySelector("#dailyHistoryClear").onclick = () => {
      writeHistory([]);
      renderHistory();
    };
    renderHistory();

    /* ---------- Focus modal ---------- */
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "dt-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "dt-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);
    let activeFocusedCard = null;
    let focusPlaceholder = null;
    function openFocus(card) {
      if (!card || activeFocusedCard === card) return;
      if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused");
      activeFocusedCard = card;
      focusPlaceholder = document.createElement("div");
      focusPlaceholder.style.height = card.offsetHeight + "px";
      card.parentNode.insertBefore(focusPlaceholder, card);
      focusHost.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      document.body.classList.add("dt-modal-open");
      focusOverlay.classList.add("active");
      focusHost.classList.add("active");
      setTimeout(() => card.querySelector("input, select, textarea, button")?.focus(), 40);
    }
    function closeFocus() {
      if (!activeFocusedCard) return;
      activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeFocusedCard.classList.remove("is-focused");
      if (focusPlaceholder?.parentNode) {
        focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder);
        focusPlaceholder.remove();
      }
      activeFocusedCard = null;
      focusHost.classList.remove("active");
      focusOverlay.classList.remove("active");
      document.body.classList.remove("dt-modal-open");
    }
    document.querySelectorAll(".dt-card [data-focus-open]").forEach((btn) =>
      btn.addEventListener("click", (e) => openFocus(e.target.closest(".dt-card")))
    );
    document.querySelectorAll(".dt-card [data-focus-close]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeFocus();
      })
    );
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFocus();
    });
    document.querySelectorAll(".tool-nav-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const card = document.getElementById(`card-${btn.dataset.target}`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => openFocus(card), 200);
        }
      })
    );

    const y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  window.QwicktonCategoryInits["daily-tools"] = initDailyTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDailyTools(null);
  });
})();
