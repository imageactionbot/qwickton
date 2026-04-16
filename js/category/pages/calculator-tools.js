(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-calculator-history-v4";
  const CURRENCIES = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "SGD", "AED", "JPY", "ZAR", "CHF", "CNY", "NZD"];
  const FALLBACK_RATES = {
    USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, CAD: 1.35, AUD: 1.52, SGD: 1.34,
    AED: 3.67, JPY: 148.2, ZAR: 18.9, CHF: 0.88, CNY: 7.2, NZD: 1.64
  };
  let exchangeRates = { ...FALLBACK_RATES };

  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
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
  function downloadCsv(name, csv) {
    const blob = new Blob([String(csv || "")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function money(value, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeNum(value, 0));
  }
  function currencyOptions() {
    return CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("");
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

  async function loadRates() {
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (!res.ok) return;
      const json = await res.json();
      if (json && typeof json === "object" && json.rates) {
        exchangeRates = { ...exchangeRates, ...json.rates };
      }
    } catch {
      // fallback rates remain active
    }
  }

  function initCalculatorTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.calculatorInitDone === "true") return;
    grid.dataset.calculatorInitDone = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("article");
      card.className = "calc-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<header class="calc-card-header"><div class="calc-card-icon">${icon}</div><h3 class="calc-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary calc-focus-btn" data-focus-open type="button">Open</button><button class="btn btn-secondary calc-focus-inline-close" data-focus-close type="button">Close</button>' : ""}</header>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCard = null;
    function pushHistory(type, text) {
      if (!text) return;
      writeHistory([{ type, text: String(text).slice(0, 160), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCard) return;
      const host = q(historyCard, "#calcHistory");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No calculation outputs yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" data-i="${i}" type="button"><strong>${esc(item.type)}</strong> - ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const item = items[Number(btn.dataset.i)];
        if (item) copyText(`${item.type}: ${item.text}`);
      }));
    }

    function simpleTool(id, icon, title, fields, compute, options = {}) {
      const card = makeCard(id, icon, title, `
        <div class="grid-2">${fields.map((f) => `<div><label>${f.label}</label>${f.html}</div>`).join("")}</div>
        <div class="inline-row">
          <button class="btn btn-primary" data-run type="button">Calculate</button>
          <button class="btn btn-secondary" data-copy type="button">Copy</button>
          <button class="btn btn-secondary" data-export-txt type="button">TXT</button>
          ${options.csv ? '<button class="btn btn-secondary" data-export-csv type="button">CSV</button>' : ""}
        </div>
        <div class="result-meta" data-meta></div>
        <textarea class="result" rows="${options.rows || 6}" data-out readonly></textarea>
      `);
      let reportText = "";
      let csvText = "";
      function run(saveHistory) {
        try {
          const out = compute(card);
          reportText = out.text || "";
          csvText = out.csv || "";
          q(card, "[data-out]").value = reportText || "No output.";
          q(card, "[data-meta]").innerHTML = out.meta || "";
          if (saveHistory && out.history) pushHistory(out.history.type, out.history.text);
        } catch (err) {
          reportText = `Error: ${err.message || "Unexpected input error"}`;
          q(card, "[data-out]").value = reportText;
          q(card, "[data-meta]").textContent = "";
        }
      }
      q(card, "[data-run]").addEventListener("click", () => run(true));
      q(card, "[data-copy]").addEventListener("click", () => copyText(reportText));
      q(card, "[data-export-txt]").addEventListener("click", () => downloadText(`${id}-report.txt`, reportText));
      q(card, "[data-export-csv]")?.addEventListener("click", () => downloadCsv(`${id}-report.csv`, csvText || "key,value"));
      run(false);
      return card;
    }

    // 1 EMI
    simpleTool("emi", "🏦", "EMI Calculator", [
      { label: "Currency", html: `<select id="emiCur">${currencyOptions()}</select>` },
      { label: "Loan Amount", html: '<input id="emiP" type="number" value="500000" step="10000">' },
      { label: "Rate % (Annual)", html: '<input id="emiR" type="number" value="10.5" step="0.1">' },
      { label: "Tenure (Months)", html: '<input id="emiM" type="number" value="36">' },
      { label: "Down Payment", html: '<input id="emiDown" type="number" value="0" step="10000">' },
      { label: "Extra Monthly", html: '<input id="emiExtra" type="number" value="0" step="1000">' }
    ], (card) => {
      const cur = q(card, "#emiCur").value;
      const principal = Math.max(0, safeNum(q(card, "#emiP").value, 0) - Math.max(0, safeNum(q(card, "#emiDown").value, 0)));
      const rate = Math.max(0, safeNum(q(card, "#emiR").value, 0));
      const months = Math.max(1, Math.round(safeNum(q(card, "#emiM").value, 1)));
      const extra = Math.max(0, safeNum(q(card, "#emiExtra").value, 0));
      if (principal <= 0) throw new Error("Loan amount must be greater than down payment.");
      const mr = rate / 12 / 100;
      const emi = mr ? (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1) : principal / months;
      const total = emi * months;
      const interest = total - principal;
      let bal = principal;
      let m = 0;
      const schedule = ["month,payment,interest,principal,balance"];
      while (bal > 0.01 && m < 2000) {
        const intPart = bal * mr;
        let payment = emi + extra;
        if (mr === 0) payment = Math.min(payment, bal);
        let principalPart = payment - intPart;
        if (principalPart > bal) principalPart = bal;
        if (principalPart <= 0) break;
        bal -= principalPart;
        m += 1;
        schedule.push(`${m},${payment.toFixed(2)},${intPart.toFixed(2)},${principalPart.toFixed(2)},${Math.max(0, bal).toFixed(2)}`);
      }
      const report = [
        "EMI Report",
        "========================================",
        `Loan: ${money(principal, cur)}`,
        `Rate: ${rate}% annual`,
        `Tenure: ${months} months`,
        `EMI: ${money(emi, cur)} / month`,
        `Total Interest: ${money(interest, cur)}`,
        `Total Payment: ${money(total, cur)}`,
        extra ? `With Extra ${money(extra, cur)}/month, closes in ${m} months` : "No extra payment"
      ].join("\n");
      return {
        text: report,
        csv: schedule.join("\n"),
        meta: `<span class="result-chip total">${money(emi, cur)}/mo</span><span class="result-chip">Interest ${money(interest, cur)}</span>`,
        history: { type: "EMI", text: `${money(emi, cur)} / month` }
      };
    }, { csv: true, rows: 8 });

    // 2 SIP
    simpleTool("sip", "💰", "SIP Calculator", [
      { label: "Currency", html: `<select id="sipCur">${currencyOptions()}</select>` },
      { label: "Monthly Investment", html: '<input id="sipAmt" type="number" value="5000" step="500">' },
      { label: "Expected Return %", html: '<input id="sipReturn" type="number" value="12" step="0.5">' },
      { label: "Years", html: '<input id="sipYears" type="number" value="10">' }
    ], (card) => {
      const cur = q(card, "#sipCur").value;
      const monthly = Math.max(0, safeNum(q(card, "#sipAmt").value, 0));
      const annual = Math.max(0, safeNum(q(card, "#sipReturn").value, 0));
      const years = Math.max(1, safeNum(q(card, "#sipYears").value, 1));
      const n = years * 12;
      const r = annual / 12 / 100;
      const fv = r ? monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : monthly * n;
      const invested = monthly * n;
      const gains = fv - invested;
      return {
        text: `SIP Report\n========================================\nMonthly: ${money(monthly, cur)}\nYears: ${years}\nExpected Return: ${annual}%\nInvested: ${money(invested, cur)}\nEstimated Gain: ${money(gains, cur)}\nFuture Value: ${money(fv, cur)}`,
        meta: `<span class="result-chip total">FV ${money(fv, cur)}</span><span class="result-chip success">Gain ${money(gains, cur)}</span>`,
        history: { type: "SIP", text: `${money(fv, cur)} after ${years}y` }
      };
    });

    // 3 CAGR
    simpleTool("cagr", "📈", "CAGR Calculator", [
      { label: "Currency", html: `<select id="cagrCur">${currencyOptions()}</select>` },
      { label: "Initial Value", html: '<input id="cagrStart" type="number" value="10000" step="1000">' },
      { label: "Final Value", html: '<input id="cagrEnd" type="number" value="25000" step="1000">' },
      { label: "Years", html: '<input id="cagrYears" type="number" value="5">' }
    ], (card) => {
      const cur = q(card, "#cagrCur").value;
      const start = Math.max(0, safeNum(q(card, "#cagrStart").value, 0));
      const end = Math.max(0, safeNum(q(card, "#cagrEnd").value, 0));
      const years = Math.max(1, safeNum(q(card, "#cagrYears").value, 1));
      if (start <= 0) throw new Error("Initial value must be greater than zero.");
      const cagr = (Math.pow(end / start, 1 / years) - 1) * 100;
      const abs = ((end - start) / start) * 100;
      return {
        text: `CAGR Report\n========================================\nInitial: ${money(start, cur)}\nFinal: ${money(end, cur)}\nYears: ${years}\nAbsolute Return: ${abs.toFixed(2)}%\nCAGR: ${cagr.toFixed(2)}%`,
        meta: `<span class="result-chip total">CAGR ${cagr.toFixed(2)}%</span>`,
        history: { type: "CAGR", text: `${cagr.toFixed(2)}%` }
      };
    });

    // 4 Discount
    simpleTool("discount", "🏷️", "Discount Calculator", [
      { label: "Currency", html: `<select id="disCur">${currencyOptions()}</select>` },
      { label: "Original Price", html: '<input id="disPrice" type="number" value="1999" step="100">' },
      { label: "Discount %", html: '<input id="disPct" type="number" value="20">' },
      { label: "Coupon", html: '<input id="disCoupon" type="number" value="0" step="50">' },
      { label: "Tax %", html: '<input id="disTax" type="number" value="0">' }
    ], (card) => {
      const cur = q(card, "#disCur").value;
      const price = Math.max(0, safeNum(q(card, "#disPrice").value, 0));
      const pct = Math.max(0, safeNum(q(card, "#disPct").value, 0));
      const coupon = Math.max(0, safeNum(q(card, "#disCoupon").value, 0));
      const tax = Math.max(0, safeNum(q(card, "#disTax").value, 0));
      const disc = (price * pct) / 100;
      const after = Math.max(0, price - disc - coupon);
      const taxAmt = (after * tax) / 100;
      const final = after + taxAmt;
      const saved = price - final;
      return {
        text: `Discount Report\n========================================\nOriginal: ${money(price, cur)}\nDiscount: -${money(disc, cur)}\nCoupon: -${money(coupon, cur)}\nTax: +${money(taxAmt, cur)}\nFinal Price: ${money(final, cur)}\nYou Save: ${money(saved, cur)}`,
        meta: `<span class="result-chip total">Final ${money(final, cur)}</span><span class="result-chip success">Save ${money(saved, cur)}</span>`,
        history: { type: "Discount", text: `Saved ${money(saved, cur)}` }
      };
    });

    // 5 Profit
    simpleTool("profit", "📊", "Profit & Break-even", [
      { label: "Currency", html: `<select id="proCur">${currencyOptions()}</select>` },
      { label: "Cost / Unit", html: '<input id="proCost" type="number" value="100">' },
      { label: "Sell / Unit", html: '<input id="proSell" type="number" value="140">' },
      { label: "Fixed Cost", html: '<input id="proFixed" type="number" value="10000">' },
      { label: "Units Sold", html: '<input id="proQty" type="number" value="100">' }
    ], (card) => {
      const cur = q(card, "#proCur").value;
      const cost = Math.max(0, safeNum(q(card, "#proCost").value, 0));
      const sell = Math.max(0, safeNum(q(card, "#proSell").value, 0));
      const fixed = Math.max(0, safeNum(q(card, "#proFixed").value, 0));
      const qty = Math.max(0, Math.round(safeNum(q(card, "#proQty").value, 0)));
      const revenue = sell * qty;
      const totalCost = cost * qty + fixed;
      const profit = revenue - totalCost;
      const margin = sell - cost;
      const be = margin > 0 ? Math.ceil(fixed / margin) : Infinity;
      return {
        text: `Profit Report\n========================================\nRevenue: ${money(revenue, cur)}\nTotal Cost: ${money(totalCost, cur)}\n${profit >= 0 ? "Profit" : "Loss"}: ${money(Math.abs(profit), cur)}\nMargin / unit: ${money(margin, cur)}\nBreak-even units: ${Number.isFinite(be) ? be : "Not reachable"}`,
        meta: `<span class="result-chip ${profit >= 0 ? "success" : ""}">${profit >= 0 ? "Profit" : "Loss"} ${money(Math.abs(profit), cur)}</span>`,
        history: { type: "Profit", text: `${profit >= 0 ? "Profit" : "Loss"} ${money(Math.abs(profit), cur)}` }
      };
    });

    // 6 ROI
    simpleTool("roi", "🎯", "ROI Calculator", [
      { label: "Currency", html: `<select id="roiCur">${currencyOptions()}</select>` },
      { label: "Initial Investment", html: '<input id="roiInv" type="number" value="100000">' },
      { label: "Final Value", html: '<input id="roiFin" type="number" value="150000">' },
      { label: "Years", html: '<input id="roiYears" type="number" value="3">' }
    ], (card) => {
      const cur = q(card, "#roiCur").value;
      const inv = Math.max(0, safeNum(q(card, "#roiInv").value, 0));
      const fin = Math.max(0, safeNum(q(card, "#roiFin").value, 0));
      const years = Math.max(1, safeNum(q(card, "#roiYears").value, 1));
      if (inv <= 0) throw new Error("Initial investment must be greater than zero.");
      const profit = fin - inv;
      const roi = (profit / inv) * 100;
      const annual = (Math.pow(fin / inv, 1 / years) - 1) * 100;
      return {
        text: `ROI Report\n========================================\nInitial: ${money(inv, cur)}\nFinal: ${money(fin, cur)}\nProfit: ${money(profit, cur)}\nROI: ${roi.toFixed(2)}%\nAnnualized Return: ${annual.toFixed(2)}%`,
        meta: `<span class="result-chip total">ROI ${roi.toFixed(2)}%</span>`,
        history: { type: "ROI", text: `${roi.toFixed(2)}%` }
      };
    });

    // 7 GST
    simpleTool("gst", "📋", "GST Calculator", [
      { label: "Currency", html: `<select id="gstCur">${currencyOptions()}</select>` },
      { label: "Base Amount", html: '<input id="gstAmt" type="number" value="1000">' },
      { label: "GST Rate %", html: '<input id="gstRate" type="number" value="18">' }
    ], (card) => {
      const cur = q(card, "#gstCur").value;
      const amt = Math.max(0, safeNum(q(card, "#gstAmt").value, 0));
      const rate = Math.max(0, safeNum(q(card, "#gstRate").value, 0));
      const gst = (amt * rate) / 100;
      const total = amt + gst;
      return {
        text: `GST Report\n========================================\nAmount: ${money(amt, cur)}\nGST (${rate}%): ${money(gst, cur)}\nTotal: ${money(total, cur)}`,
        meta: `<span class="result-chip total">Total ${money(total, cur)}</span>`,
        history: { type: "GST", text: `${rate}% on ${money(amt, cur)}` }
      };
    });

    // 8 Loan
    simpleTool("loan", "🏠", "Loan Calculator", [
      { label: "Currency", html: `<select id="loanCur">${currencyOptions()}</select>` },
      { label: "Loan Amount", html: '<input id="loanAmt" type="number" value="250000">' },
      { label: "Rate % (Annual)", html: '<input id="loanRate" type="number" value="7.5" step="0.1">' },
      { label: "Term (Years)", html: '<input id="loanYears" type="number" value="5">' }
    ], (card) => {
      const cur = q(card, "#loanCur").value;
      const p = Math.max(1, safeNum(q(card, "#loanAmt").value, 1));
      const r = Math.max(0, safeNum(q(card, "#loanRate").value, 0));
      const years = Math.max(1, safeNum(q(card, "#loanYears").value, 1));
      const m = years * 12;
      const mr = r / 12 / 100;
      const emi = mr ? (p * mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1) : p / m;
      const total = emi * m;
      const interest = total - p;
      return {
        text: `Loan Report\n========================================\nPrincipal: ${money(p, cur)}\nRate: ${r}%\nTerm: ${years} years\nMonthly Payment: ${money(emi, cur)}\nTotal Interest: ${money(interest, cur)}\nTotal Payment: ${money(total, cur)}`,
        meta: `<span class="result-chip total">${money(emi, cur)}/mo</span>`,
        history: { type: "Loan", text: `${money(emi, cur)}/mo` }
      };
    });

    // 9 Mortgage
    simpleTool("mortgage", "🏡", "Mortgage Calculator", [
      { label: "Currency", html: `<select id="morCur">${currencyOptions()}</select>` },
      { label: "Home Price", html: '<input id="morPrice" type="number" value="500000">' },
      { label: "Down Payment %", html: '<input id="morDown" type="number" value="20">' },
      { label: "Term (Years)", html: '<input id="morYears" type="number" value="30">' },
      { label: "Rate % (Annual)", html: '<input id="morRate" type="number" value="6.5" step="0.1">' },
      { label: "Property Tax %", html: '<input id="morTax" type="number" value="1.2" step="0.1">' }
    ], (card) => {
      const cur = q(card, "#morCur").value;
      const price = Math.max(0, safeNum(q(card, "#morPrice").value, 0));
      const downPct = Math.max(0, safeNum(q(card, "#morDown").value, 0));
      const years = Math.max(1, safeNum(q(card, "#morYears").value, 1));
      const rate = Math.max(0, safeNum(q(card, "#morRate").value, 0));
      const tax = Math.max(0, safeNum(q(card, "#morTax").value, 0));
      const down = (price * downPct) / 100;
      const loan = Math.max(1, price - down);
      const months = years * 12;
      const mr = rate / 12 / 100;
      const emi = mr ? (loan * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1) : loan / months;
      const taxMonthly = (price * tax) / 100 / 12;
      const totalMonthly = emi + taxMonthly;
      return {
        text: `Mortgage Report\n========================================\nHome Price: ${money(price, cur)}\nDown Payment: ${money(down, cur)} (${downPct}%)\nLoan: ${money(loan, cur)}\nMonthly Principal+Interest: ${money(emi, cur)}\nMonthly Tax: ${money(taxMonthly, cur)}\nTotal Monthly: ${money(totalMonthly, cur)}`,
        meta: `<span class="result-chip total">${money(totalMonthly, cur)}/mo</span>`,
        history: { type: "Mortgage", text: `${money(totalMonthly, cur)}/mo` }
      };
    });

    // 10 Currency
    simpleTool("currency", "💱", "Currency Converter", [
      { label: "Amount", html: '<input id="curAmt" type="number" value="100">' },
      { label: "Precision", html: '<input id="curPrec" type="number" min="0" max="6" value="2">' },
      { label: "From", html: `<select id="curFrom">${currencyOptions()}</select>` },
      { label: "To", html: `<select id="curTo">${currencyOptions()}</select>` }
    ], (card) => {
      const amt = Math.max(0, safeNum(q(card, "#curAmt").value, 0));
      const prec = Math.max(0, Math.min(6, safeNum(q(card, "#curPrec").value, 2)));
      const from = q(card, "#curFrom").value;
      const to = q(card, "#curTo").value;
      const rf = safeNum(exchangeRates[from], 1);
      const rt = safeNum(exchangeRates[to], 1);
      const rate = rt / rf;
      const out = amt * rate;
      return {
        text: `Currency Report\n========================================\n${money(amt, from)} = ${out.toFixed(prec)} ${to}\nRate: 1 ${from} = ${rate.toFixed(6)} ${to}`,
        meta: `<span class="result-chip total">${out.toFixed(prec)} ${to}</span>`,
        history: { type: "Currency", text: `${amt} ${from} -> ${out.toFixed(prec)} ${to}` }
      };
    });

    // 11 Age
    simpleTool("age", "📅", "Age Calculator", [
      { label: "Date of Birth", html: '<input id="ageDob" type="date">' },
      { label: "As On Date", html: '<input id="ageAs" type="date">' }
    ], (card) => {
      const dobStr = q(card, "#ageDob").value;
      if (!dobStr) return { text: "Select date of birth." };
      const dob = new Date(dobStr);
      const asDate = q(card, "#ageAs").value ? new Date(q(card, "#ageAs").value) : new Date();
      if (asDate < dob) throw new Error("As-on date cannot be before birth date.");
      let y = asDate.getFullYear() - dob.getFullYear();
      let m = asDate.getMonth() - dob.getMonth();
      let d = asDate.getDate() - dob.getDate();
      if (d < 0) {
        m -= 1;
        d += new Date(asDate.getFullYear(), asDate.getMonth(), 0).getDate();
      }
      if (m < 0) {
        y -= 1;
        m += 12;
      }
      const totalDays = Math.floor((asDate - dob) / (1000 * 60 * 60 * 24));
      return {
        text: `Age Report\n========================================\nDOB: ${dob.toLocaleDateString()}\nAs On: ${asDate.toLocaleDateString()}\nAge: ${y} years ${m} months ${d} days\nTotal Days: ${totalDays.toLocaleString()}`,
        meta: `<span class="result-chip total">${y}y ${m}m</span>`,
        history: { type: "Age", text: `${y}y ${m}m` }
      };
    });

    // 12 BMI
    simpleTool("bmi", "⚖️", "BMI Calculator", [
      { label: "Weight (kg)", html: '<input id="bmiW" type="number" value="70">' },
      { label: "Height (cm)", html: '<input id="bmiH" type="number" value="170">' }
    ], (card) => {
      const w = Math.max(0, safeNum(q(card, "#bmiW").value, 0));
      const hcm = Math.max(0, safeNum(q(card, "#bmiH").value, 0));
      if (!w || !hcm) throw new Error("Weight and height must be greater than zero.");
      const h = hcm / 100;
      const bmi = w / (h * h);
      const label = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
      return {
        text: `BMI Report\n========================================\nWeight: ${w} kg\nHeight: ${hcm} cm\nBMI: ${bmi.toFixed(2)}\nCategory: ${label}`,
        meta: `<span class="result-chip total">BMI ${bmi.toFixed(2)}</span><span class="result-chip">${label}</span>`,
        history: { type: "BMI", text: `${bmi.toFixed(2)} (${label})` }
      };
    });

    // 13 Fuel
    simpleTool("fuel", "⛽", "Fuel Cost Calculator", [
      { label: "Currency", html: `<select id="fuelCur">${currencyOptions()}</select>` },
      { label: "Distance (km)", html: '<input id="fuelDist" type="number" value="500">' },
      { label: "Efficiency (km/l)", html: '<input id="fuelEff" type="number" value="15" step="0.1">' },
      { label: "Price / Liter", html: '<input id="fuelPrice" type="number" value="100">' }
    ], (card) => {
      const cur = q(card, "#fuelCur").value;
      const dist = Math.max(0, safeNum(q(card, "#fuelDist").value, 0));
      const eff = Math.max(0.1, safeNum(q(card, "#fuelEff").value, 0.1));
      const price = Math.max(0, safeNum(q(card, "#fuelPrice").value, 0));
      const liters = dist / eff;
      const total = liters * price;
      return {
        text: `Fuel Report\n========================================\nDistance: ${dist} km\nEfficiency: ${eff} km/l\nFuel Needed: ${liters.toFixed(2)} liters\nFuel Cost: ${money(total, cur)}`,
        meta: `<span class="result-chip total">${money(total, cur)}</span>`,
        history: { type: "Fuel", text: `${money(total, cur)} for ${dist} km` }
      };
    });

    // 14 Salary
    simpleTool("salary", "💼", "Salary Calculator", [
      { label: "Currency", html: `<select id="salCur">${currencyOptions()}</select>` },
      { label: "Annual Salary", html: '<input id="salAnnual" type="number" value="600000">' },
      { label: "Tax %", html: '<input id="salTax" type="number" value="15">' },
      { label: "Other Deductions", html: '<input id="salDed" type="number" value="5000">' }
    ], (card) => {
      const cur = q(card, "#salCur").value;
      const annual = Math.max(0, safeNum(q(card, "#salAnnual").value, 0));
      const tax = Math.max(0, safeNum(q(card, "#salTax").value, 0));
      const ded = Math.max(0, safeNum(q(card, "#salDed").value, 0));
      const taxAmt = (annual * tax) / 100;
      const netAnnual = annual - taxAmt - ded;
      const netMonthly = netAnnual / 12;
      return {
        text: `Salary Report\n========================================\nGross Annual: ${money(annual, cur)}\nTax: ${money(taxAmt, cur)} (${tax}%)\nOther Deductions: ${money(ded, cur)}\nNet Annual: ${money(netAnnual, cur)}\nNet Monthly: ${money(netMonthly, cur)}`,
        meta: `<span class="result-chip total">${money(netMonthly, cur)}/mo</span>`,
        history: { type: "Salary", text: `${money(netMonthly, cur)}/mo` }
      };
    });

    // 15 Tip
    simpleTool("tip", "🍽️", "Tip Splitter", [
      { label: "Currency", html: `<select id="tipCur">${currencyOptions()}</select>` },
      { label: "Bill Amount", html: '<input id="tipBill" type="number" value="2500">' },
      { label: "Tip %", html: '<input id="tipPct" type="number" value="15">' },
      { label: "People", html: '<input id="tipPeople" type="number" value="2">' }
    ], (card) => {
      const cur = q(card, "#tipCur").value;
      const bill = Math.max(0, safeNum(q(card, "#tipBill").value, 0));
      const pct = Math.max(0, safeNum(q(card, "#tipPct").value, 0));
      const people = Math.max(1, Math.round(safeNum(q(card, "#tipPeople").value, 1)));
      const tip = (bill * pct) / 100;
      const total = bill + tip;
      const per = total / people;
      return {
        text: `Tip Report\n========================================\nBill: ${money(bill, cur)}\nTip: ${money(tip, cur)} (${pct}%)\nTotal: ${money(total, cur)}\nPeople: ${people}\nPer Person: ${money(per, cur)}`,
        meta: `<span class="result-chip total">${money(per, cur)}/person</span>`,
        history: { type: "Tip", text: `${money(per, cur)}/person` }
      };
    });

    // 16 History
    historyCard = makeCard("history", "📜", "Recent Calculations", `
      <div id="calcHistory" class="chip-list"><span class="empty-hint">No calculation outputs yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="calcHistClear" type="button">Clear</button>
        <button class="btn btn-secondary" id="calcHistExport" type="button">Export TXT</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    q(historyCard, "#calcHistClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    q(historyCard, "#calcHistExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`calculator-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // focus modal
    const overlay = document.createElement("div");
    overlay.className = "calc-focus-overlay";
    const host = document.createElement("div");
    host.className = "calc-focus-host";
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
      document.body.classList.add("calc-modal-open");
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
      document.body.classList.remove("calc-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".calc-card"))));
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

    loadRates();
  }

  window.QwicktonCategoryInits["calculator-tools"] = initCalculatorTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initCalculatorTools();
    }
  });
})();
(function() {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-calculator-history-v3";
  
  // Currency options
  const CURRENCIES = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "SGD", "AED", "JPY", "ZAR", "CHF", "CNY", "NZD"];
  
  // Exchange rates (fallback - will be updated via API)
  let exchangeRates = {
    USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, CAD: 1.35, AUD: 1.52, SGD: 1.34,
    AED: 3.67, JPY: 148.2, ZAR: 18.9, CHF: 0.88, CNY: 7.2, NZD: 1.64
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function q(root, sel) { return root.querySelector(sel); }
  function n(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function qty(value) { return Math.max(1, Math.round(n(value, 1))); }
  
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  
  function money(value, currency = "USD", locale = "en-US") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n(value, 0));
  }
  
  function copyText(text) {
    if (!text) return;
    navigator.clipboard?.writeText(String(text)).catch(() => {});
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
  
  function currencyOptions() {
    return CURRENCIES.map((cur) => `<option value="${cur}">${cur}</option>`).join("");
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
    const txt = q(card, `[data-export='${prefix}-txt']`);
    const pdf = q(card, `[data-export='${prefix}-pdf']`);
    const png = q(card, `[data-export='${prefix}-png']`);
    const jpg = q(card, `[data-export='${prefix}-jpg']`);
    txt?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    pdf?.addEventListener("click", async () => downloadPdfFromText(`${prefix}.pdf`, title, getText()));
    png?.addEventListener("click", () => downloadImageFromText(`${prefix}.png`, getText(), "image/png"));
    jpg?.addEventListener("click", () => downloadImageFromText(`${prefix}.jpg`, getText(), "image/jpeg"));
  }

  // Fetch live exchange rates
  async function fetchExchangeRates() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        exchangeRates = data.rates;
      }
    } catch(e) { console.log("Using fallback rates"); }
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  }
  
  function writeHistory(items) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30))); } catch {}
  }
  
  function pushHistory(type, text) {
    if (!text) return;
    writeHistory([{ type, text: String(text).slice(0, 160), ts: Date.now() }, ...readHistory()]);
  }

  // ============================================
  // MAIN INITIALIZATION
  // ============================================
  function calculatorInit(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.calculatorInitDone === "true") return;
    grid.dataset.calculatorInitDone = "true";
    grid.innerHTML = "";

    const cards = [];
    const registerCard = (id, icon, title, bodyHtml, focusable = true) => {
      const card = document.createElement("article");
      card.className = "calc-card";
      card.id = `card-${id}`;
      card.dataset.tool = id;
      card.dataset.focusable = focusable ? "true" : "false";
      card.innerHTML = `
        <header class="calc-card-header">
          <div class="calc-card-icon">${icon}</div>
          <h3 class="calc-card-title">${title}</h3>
          ${focusable ? '<button class="btn btn-secondary calc-focus-btn" data-focus-open type="button">Open</button><button class="btn btn-secondary calc-focus-inline-close" data-focus-close type="button">Close</button>' : ""}
        </header>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      cards.push(card);
      return card;
    };

    let historyCard = null;
    function renderHistory() {
      if (!historyCard) return;
      const container = q(historyCard, "#calcHistory");
      if (!container) return;
      const items = readHistory();
      if (!items.length) {
        container.innerHTML = '<span class="empty-hint">No calculation outputs yet.</span>';
        return;
      }
      container.innerHTML = items
        .map((item, i) => `<button class="prompt-chip" type="button" data-h="${i}"><strong>${escapeHtml(item.type)}</strong> - ${escapeHtml(item.text)}</button>`)
        .join("");
      container.querySelectorAll("[data-h]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const item = items[n(btn.getAttribute("data-h"), 0)];
          if (item) copyText(item.text);
        }),
      );
    }

    // ============================================
    // HELPER FOR SIMPLE TOOLS
    // ============================================
    function simpleTool(id, icon, title, fields, compute, opts = {}) {
      const card = registerCard(id, icon, title, `
        <div class="grid-2">${fields.map((f) => `<div><label>${f.label}</label>${f.html}</div>`).join("")}</div>
        <div class="inline-row">
          <button class="btn btn-primary" type="button" data-run>Calculate</button>
          <button class="btn btn-secondary" type="button" data-copy>Copy</button>
          <button class="btn btn-secondary" type="button" data-export="${id}-txt">TXT</button>
          ${opts.pdf !== false ? `<button class="btn btn-secondary" type="button" data-export="${id}-pdf">PDF</button>` : ""}
          <button class="btn btn-secondary" type="button" data-export="${id}-png">PNG</button>
          <button class="btn btn-secondary" type="button" data-export="${id}-jpg">JPG</button>
        </div>
        <div class="result-meta" data-meta></div>
        <textarea class="result" data-out rows="${opts.rows || 6}"></textarea>
      `);
      let text = "";
      const run = (saveHistory) => {
        try {
          const result = compute(card);
          text = result.text;
          q(card, "[data-out]").value = text;
          q(card, "[data-meta]").innerHTML = result.meta || "";
          if (saveHistory && result.history) pushHistory(result.history.type, result.history.text);
          renderHistory();
        } catch (error) {
          text = `Error: ${error?.message || "unexpected error"}`;
          q(card, "[data-out]").value = text;
        }
      };
      q(card, "[data-run]").addEventListener("click", () => run(true));
      q(card, "[data-copy]").addEventListener("click", () => copyText(text));
      card.addEventListener("input", () => run(false));
      run(false);
      wireExport(card, id, title, () => text);
      return card;
    }

    // ============================================
    // 1. EMI CALCULATOR
    // ============================================
    simpleTool("emi", "🏦", "EMI Calculator Pro", [
      { label: "Currency", html: `<select id="emiCur">${currencyOptions()}</select>` },
      { label: "Loan Amount", html: '<input id="emiP" type="number" value="500000" step="10000" />' },
      { label: "Down Payment", html: '<input id="emiDown" type="number" value="0" step="10000" />' },
      { label: "Annual Rate %", html: '<input id="emiR" type="number" value="10.5" step="0.1" />' },
      { label: "Tenure (Months)", html: '<input id="emiM" type="number" value="36" />' },
      { label: "Extra Payment", html: '<input id="emiExtra" type="number" value="0" step="1000" />' },
    ], (card) => {
      const cur = q(card, "#emiCur").value || "USD";
      const principal = Math.max(1, n(q(card, "#emiP").value, 1) - n(q(card, "#emiDown").value, 0));
      const annualRate = Math.max(0, n(q(card, "#emiR").value, 0));
      const months = Math.max(1, qty(q(card, "#emiM").value));
      const extra = Math.max(0, n(q(card, "#emiExtra").value, 0));
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const total = emi * months;
      const interest = total - principal;
      const totalWithExtra = emi + extra;
      let balance = principal;
      let monthsActual = 0;
      while (balance > 0.01 && monthsActual < 1200) {
        const interestMonth = balance * mr;
        let principalPaid = totalWithExtra - interestMonth;
        if (principalPaid <= 0) break;
        if (principalPaid > balance) principalPaid = balance;
        balance -= principalPaid;
        monthsActual++;
      }
      const interestSaved = interest - ((totalWithExtra * monthsActual) - principal);
      return {
        text: `🏦 EMI REPORT\n========================================\nLoan Amount: ${money(principal, cur)}\nAnnual Rate: ${annualRate}%\nTenure: ${months} months\nMonthly EMI: ${money(emi, cur)}\n${extra > 0 ? `With Extra: ${money(totalWithExtra, cur)}/month\nActual Months: ${monthsActual}\nInterest Saved: ${money(interestSaved, cur)}\nMonths Saved: ${months - monthsActual}` : `Total Interest: ${money(interest, cur)}\nTotal Payment: ${money(total, cur)}`}`,
        meta: `<span class="result-chip total">EMI ${money(emi, cur)}/mo</span><span class="result-chip">Interest ${money(interest, cur)}</span>`,
        history: { type: "EMI", text: `${money(emi, cur)}/month for ${months} months` },
      };
    });

    // ============================================
    // 2. SIP CALCULATOR (NEW)
    // ============================================
    simpleTool("sip", "💰", "SIP Calculator", [
      { label: "Currency", html: `<select id="sipCur">${currencyOptions()}</select>` },
      { label: "Monthly Investment", html: '<input id="sipAmt" type="number" value="5000" step="500" />' },
      { label: "Expected Return %", html: '<input id="sipReturn" type="number" value="12" step="0.5" />' },
      { label: "Time Period (Years)", html: '<input id="sipYears" type="number" value="10" />' },
    ], (card) => {
      const cur = q(card, "#sipCur").value || "USD";
      const monthly = Math.max(0, n(q(card, "#sipAmt").value, 0));
      const annualReturn = Math.max(0, n(q(card, "#sipReturn").value, 0));
      const years = Math.max(1, n(q(card, "#sipYears").value, 1));
      const months = years * 12;
      const monthlyRate = annualReturn / 12 / 100;
      let futureValue = 0;
      if (monthlyRate === 0) {
        futureValue = monthly * months;
      } else {
        futureValue = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      }
      const totalInvested = monthly * months;
      const estimatedReturns = futureValue - totalInvested;
      return {
        text: `💰 SIP CALCULATION\n========================================\nMonthly Investment: ${money(monthly, cur)}\nExpected Return: ${annualReturn}% p.a.\nTime Period: ${years} years (${months} months)\nTotal Invested: ${money(totalInvested, cur)}\nEstimated Returns: ${money(estimatedReturns, cur)}\nFuture Value: ${money(futureValue, cur)}`,
        meta: `<span class="result-chip total">Future Value ${money(futureValue, cur)}</span><span class="result-chip success">Returns ${money(estimatedReturns, cur)}</span>`,
        history: { type: "SIP", text: `${money(futureValue, cur)} in ${years} years` },
      };
    });

    // ============================================
    // 3. CAGR CALCULATOR (NEW)
    // ============================================
    simpleTool("cagr", "📈", "CAGR Calculator", [
      { label: "Currency", html: `<select id="cagrCur">${currencyOptions()}</select>` },
      { label: "Initial Value", html: '<input id="cagrStart" type="number" value="10000" step="1000" />' },
      { label: "Final Value", html: '<input id="cagrEnd" type="number" value="25000" step="1000" />' },
      { label: "Number of Years", html: '<input id="cagrYears" type="number" value="5" />' },
    ], (card) => {
      const cur = q(card, "#cagrCur").value || "USD";
      const start = Math.max(0, n(q(card, "#cagrStart").value, 0));
      const end = Math.max(0, n(q(card, "#cagrEnd").value, 0));
      const years = Math.max(1, n(q(card, "#cagrYears").value, 1));
      const cagr = start > 0 ? (Math.pow(end / start, 1 / years) - 1) * 100 : 0;
      const absoluteReturn = ((end - start) / start) * 100;
      return {
        text: `📈 CAGR CALCULATION\n========================================\nInitial Value: ${money(start, cur)}\nFinal Value: ${money(end, cur)}\nTime Period: ${years} years\nAbsolute Return: ${absoluteReturn.toFixed(2)}%\nCAGR: ${cagr.toFixed(2)}% per annum\nAnnualized Growth Rate: ${cagr.toFixed(2)}%`,
        meta: `<span class="result-chip total">CAGR ${cagr.toFixed(2)}%</span><span class="result-chip">Return ${absoluteReturn.toFixed(2)}%</span>`,
        history: { type: "CAGR", text: `${cagr.toFixed(2)}% CAGR` },
      };
    });

    // ============================================
    // 4. DISCOUNT CALCULATOR
    // ============================================
    simpleTool("discount", "🏷️", "Discount Calculator Pro", [
      { label: "Currency", html: `<select id="discCur">${currencyOptions()}</select>` },
      { label: "Original Price", html: '<input id="discPrice" type="number" value="1999" step="100" />' },
      { label: "Discount %", html: '<input id="discPct" type="number" value="20" step="1" />' },
      { label: "Tax %", html: '<input id="discTax" type="number" value="0" step="1" />' },
      { label: "Coupon Value", html: '<input id="discCoupon" type="number" value="0" step="50" />' },
    ], (card) => {
      const cur = q(card, "#discCur").value || "USD";
      const price = Math.max(0, n(q(card, "#discPrice").value, 0));
      const discPct = Math.max(0, n(q(card, "#discPct").value, 0));
      const taxPct = Math.max(0, n(q(card, "#discTax").value, 0));
      const coupon = Math.max(0, n(q(card, "#discCoupon").value, 0));
      const discountAmount = (price * discPct) / 100;
      const afterDiscount = Math.max(0, price - discountAmount - coupon);
      const taxAmount = (afterDiscount * taxPct) / 100;
      const finalPrice = afterDiscount + taxAmount;
      const saved = price - finalPrice;
      const savedPct = price > 0 ? ((saved / price) * 100).toFixed(2) : 0;
      return {
        text: `🏷️ DISCOUNT REPORT\n========================================\nOriginal Price: ${money(price, cur)}\nDiscount (${discPct}%): -${money(discountAmount, cur)}\nCoupon: -${money(coupon, cur)}\nAfter Discount: ${money(afterDiscount, cur)}\nTax (${taxPct}%): +${money(taxAmount, cur)}\nFinal Price: ${money(finalPrice, cur)}\nYou Save: ${money(saved, cur)} (${savedPct}%)`,
        meta: `<span class="result-chip total">Final ${money(finalPrice, cur)}</span><span class="result-chip success">Save ${money(saved, cur)}</span>`,
        history: { type: "Discount", text: `Saved ${money(saved, cur)} on ${money(price, cur)}` },
      };
    });

    // ============================================
    // 5. PROFIT ANALYZER
    // ============================================
    simpleTool("profit", "📊", "Profit & Break-even Analyzer", [
      { label: "Currency", html: `<select id="profCur">${currencyOptions()}</select>` },
      { label: "Cost/Unit", html: '<input id="profCost" type="number" value="100" step="10" />' },
      { label: "Selling/Unit", html: '<input id="profSell" type="number" value="140" step="10" />' },
      { label: "Fixed Costs", html: '<input id="profFixed" type="number" value="10000" step="1000" />' },
      { label: "Units Sold", html: '<input id="profQty" type="number" value="100" />' },
      { label: "Target Profit", html: '<input id="profTarget" type="number" value="5000" step="1000" />' },
    ], (card) => {
      const cur = q(card, "#profCur").value || "USD";
      const cost = Math.max(0, n(q(card, "#profCost").value, 0));
      const sell = Math.max(0, n(q(card, "#profSell").value, 0));
      const fixed = Math.max(0, n(q(card, "#profFixed").value, 0));
      const qtySold = Math.max(0, n(q(card, "#profQty").value, 0));
      const target = Math.max(0, n(q(card, "#profTarget").value, 0));
      const margin = sell - cost;
      const revenue = sell * qtySold;
      const totalCost = cost * qtySold + fixed;
      const profit = revenue - totalCost;
      const marginPct = sell > 0 ? ((margin / sell) * 100).toFixed(2) : 0;
      const beUnits = margin > 0 ? Math.ceil(fixed / margin) : Infinity;
      const targetUnits = margin > 0 ? Math.ceil((fixed + target) / margin) : Infinity;
      return {
        text: `📊 PROFIT ANALYSIS\n========================================\nRevenue: ${money(revenue, cur)}\nTotal Cost: ${money(totalCost, cur)}\n${profit >= 0 ? 'Profit' : 'Loss'}: ${money(Math.abs(profit), cur)}\nMargin/Unit: ${money(margin, cur)} (${marginPct}%)\nBreak-even Units: ${Number.isFinite(beUnits) ? beUnits.toLocaleString() : '∞'}\nUnits for Target Profit: ${Number.isFinite(targetUnits) ? targetUnits.toLocaleString() : '∞'}`,
        meta: `<span class="result-chip ${profit >= 0 ? 'success' : 'danger'}">${profit >= 0 ? 'Profit' : 'Loss'} ${money(Math.abs(profit), cur)}</span><span class="result-chip">BE: ${Number.isFinite(beUnits) ? beUnits : '∞'} units</span>`,
        history: { type: "Profit", text: `${profit >= 0 ? 'Profit' : 'Loss'} ${money(Math.abs(profit), cur)}` },
      };
    });

    // ============================================
    // 6. ROI CALCULATOR
    // ============================================
    simpleTool("roi", "🎯", "ROI Calculator", [
      { label: "Currency", html: `<select id="roiCur">${currencyOptions()}</select>` },
      { label: "Initial Investment", html: '<input id="roiInvest" type="number" value="100000" step="10000" />' },
      { label: "Final Return", html: '<input id="roiReturn" type="number" value="150000" step="10000" />' },
      { label: "Years", html: '<input id="roiYears" type="number" value="3" />' },
    ], (card) => {
      const cur = q(card, "#roiCur").value || "USD";
      const invest = Math.max(0, n(q(card, "#roiInvest").value, 0));
      const final = Math.max(0, n(q(card, "#roiReturn").value, 0));
      const years = Math.max(1, n(q(card, "#roiYears").value, 1));
      const profit = final - invest;
      const roi = invest > 0 ? (profit / invest) * 100 : 0;
      const annualized = invest > 0 ? (Math.pow(final / invest, 1 / years) - 1) * 100 : 0;
      return {
        text: `🎯 ROI REPORT\n========================================\nInitial Investment: ${money(invest, cur)}\nFinal Return: ${money(final, cur)}\nNet Profit: ${money(profit, cur)}\nROI: ${roi.toFixed(2)}%\nAnnualized Return: ${annualized.toFixed(2)}%\nInvestment Period: ${years} years`,
        meta: `<span class="result-chip total">ROI ${roi.toFixed(2)}%</span><span class="result-chip">Profit ${money(profit, cur)}</span>`,
        history: { type: "ROI", text: `${roi.toFixed(2)}% return` },
      };
    });

    // ============================================
    // 7. GST CALCULATOR
    // ============================================
    simpleTool("gst", "📋", "GST Calculator", [
      { label: "Currency", html: `<select id="gstCur">${currencyOptions()}</select>` },
      { label: "Amount", html: '<input id="gstAmt" type="number" value="1000" step="100" />' },
      { label: "GST Rate %", html: '<input id="gstRate" type="number" value="18" step="1" />' },
    ], (card) => {
      const cur = q(card, "#gstCur").value || "USD";
      const amt = Math.max(0, n(q(card, "#gstAmt").value, 0));
      const rate = Math.max(0, n(q(card, "#gstRate").value, 0));
      const gst = (amt * rate) / 100;
      const total = amt + gst;
      return {
        text: `📋 GST CALCULATION\n========================================\nOriginal Amount: ${money(amt, cur)}\nGST Rate: ${rate}%\nGST Amount: ${money(gst, cur)}\nTotal Amount (incl. GST): ${money(total, cur)}`,
        meta: `<span class="result-chip">GST ${money(gst, cur)}</span><span class="result-chip total">Total ${money(total, cur)}</span>`,
        history: { type: "GST", text: `${rate}% GST on ${money(amt, cur)}` },
      };
    });

    // ============================================
    // 8. LOAN CALCULATOR
    // ============================================
    simpleTool("loan", "🏠", "Loan Calculator", [
      { label: "Currency", html: `<select id="loanCur">${currencyOptions()}</select>` },
      { label: "Loan Amount", html: '<input id="loanAmt" type="number" value="250000" step="10000" />' },
      { label: "Annual Rate %", html: '<input id="loanRate" type="number" value="7.5" step="0.1" />' },
      { label: "Loan Term (Years)", html: '<input id="loanYears" type="number" value="5" />' },
    ], (card) => {
      const cur = q(card, "#loanCur").value || "USD";
      const principal = Math.max(1, n(q(card, "#loanAmt").value, 1));
      const annualRate = Math.max(0, n(q(card, "#loanRate").value, 0));
      const years = Math.max(1, n(q(card, "#loanYears").value, 1));
      const months = years * 12;
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const totalPayment = emi * months;
      const totalInterest = totalPayment - principal;
      return {
        text: `🏠 LOAN REPORT\n========================================\nLoan Amount: ${money(principal, cur)}\nAnnual Rate: ${annualRate}%\nLoan Term: ${years} years (${months} months)\nMonthly Payment: ${money(emi, cur)}\nTotal Interest: ${money(totalInterest, cur)}\nTotal Payment: ${money(totalPayment, cur)}`,
        meta: `<span class="result-chip total">${money(emi, cur)}/month</span><span class="result-chip">Interest ${money(totalInterest, cur)}</span>`,
        history: { type: "Loan", text: `${money(emi, cur)}/month for ${years} years` },
      };
    });

    // ============================================
    // 9. MORTGAGE CALCULATOR
    // ============================================
    simpleTool("mortgage", "🏡", "Mortgage Calculator", [
      { label: "Currency", html: `<select id="mortCur">${currencyOptions()}</select>` },
      { label: "Home Price", html: '<input id="mortPrice" type="number" value="500000" step="50000" />' },
      { label: "Down Payment %", html: '<input id="mortDown" type="number" value="20" step="1" />' },
      { label: "Loan Term (Years)", html: '<input id="mortYears" type="number" value="30" />' },
      { label: "Interest Rate %", html: '<input id="mortRate" type="number" value="6.5" step="0.1" />' },
      { label: "Property Tax %", html: '<input id="mortTax" type="number" value="1.2" step="0.1" />' },
    ], (card) => {
      const cur = q(card, "#mortCur").value || "USD";
      const price = Math.max(0, n(q(card, "#mortPrice").value, 0));
      const downPct = Math.max(0, n(q(card, "#mortDown").value, 0));
      const down = (price * downPct) / 100;
      const loan = Math.max(1, price - down);
      const years = Math.max(1, n(q(card, "#mortYears").value, 1));
      const annualRate = Math.max(0, n(q(card, "#mortRate").value, 0));
      const months = years * 12;
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? loan / months : (loan * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const totalPayment = emi * months;
      const totalInterest = totalPayment - loan;
      const propertyTax = (price * n(q(card, "#mortTax").value, 0)) / 100 / 12;
      const monthlyTotal = emi + propertyTax;
      return {
        text: `🏡 MORTGAGE REPORT\n========================================\nHome Price: ${money(price, cur)}\nDown Payment (${downPct}%): ${money(down, cur)}\nLoan Amount: ${money(loan, cur)}\nInterest Rate: ${annualRate}%\nLoan Term: ${years} years\nMonthly Principal + Interest: ${money(emi, cur)}\nMonthly Property Tax: ${money(propertyTax, cur)}\nTotal Monthly Payment: ${money(monthlyTotal, cur)}\nTotal Interest: ${money(totalInterest, cur)}`,
        meta: `<span class="result-chip total">${money(monthlyTotal, cur)}/month</span><span class="result-chip">Loan ${money(loan, cur)}</span>`,
        history: { type: "Mortgage", text: `${money(monthlyTotal, cur)}/month for ${years} years` },
      };
    });

    // ============================================
    // 10. CURRENCY CONVERTER (NEW)
    // ============================================
    const currencyCard = registerCard("currency", "💱", "Currency Converter", `
      <div class="grid-2">
        <div><label>Amount</label><input id="curAmt" type="number" value="100" step="10" /></div>
        <div><label>From</label><select id="curFrom">${currencyOptions()}</select></div>
        <div><label>To</label><select id="curTo">${currencyOptions()}</select></div>
        <div><label>Precision</label><input id="curPrec" type="number" min="0" max="6" value="2" /></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="curRun">Convert</button>
        <button class="btn btn-secondary" id="curCopy">Copy</button>
        <button class="btn btn-secondary" data-export="currency-txt">TXT</button>
        <button class="btn btn-secondary" data-export="currency-pdf">PDF</button>
        <button class="btn btn-secondary" data-export="currency-png">PNG</button>
        <button class="btn btn-secondary" data-export="currency-jpg">JPG</button>
      </div>
      <div id="curRes" class="result">-</div>
    `);

    let curText = "";
    async function runCurrency() {
      const amt = Math.max(0, n(currencyCard.querySelector("#curAmt").value, 0));
      const from = currencyCard.querySelector("#curFrom").value;
      const to = currencyCard.querySelector("#curTo").value;
      const prec = Math.max(0, Math.min(6, n(currencyCard.querySelector("#curPrec").value, 2)));
      const rate = exchangeRates[to] / exchangeRates[from];
      const result = amt * rate;
      curText = `${money(amt, from)} = ${result.toFixed(prec)} ${to}\nRate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
      currencyCard.querySelector("#curRes").innerHTML = curText;
      pushHistory("Currency", `${amt} ${from} = ${result.toFixed(prec)} ${to}`);
    }
    currencyCard.querySelector("#curRun").addEventListener("click", runCurrency);
    currencyCard.querySelector("#curCopy").addEventListener("click", () => copyText(curText));
    fetchExchangeRates().then(runCurrency);
    wireExport(currencyCard, "currency", "Currency Conversion", () => curText);

    // ============================================
    // 11. AGE CALCULATOR (NEW)
    // ============================================
    simpleTool("age", "📅", "Age Calculator", [
      { label: "Date of Birth", html: '<input id="ageDob" type="date" />' },
      { label: "As on Date (optional)", html: '<input id="ageTarget" type="date" />' },
    ], (card) => {
      const dobStr = q(card, "#ageDob").value;
      if (!dobStr) return { text: "Please select date of birth", history: null };
      const dob = new Date(dobStr);
      const target = q(card, "#ageTarget").value ? new Date(q(card, "#ageTarget").value) : new Date();
      if (target < dob) return { text: "Target date is before birth date", history: null };
      let years = target.getFullYear() - dob.getFullYear();
      let months = target.getMonth() - dob.getMonth();
      let days = target.getDate() - dob.getDate();
      if (days < 0) { months--; days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); }
      if (months < 0) { years--; months += 12; }
      const totalDays = Math.floor((target - dob) / (1000 * 60 * 60 * 24));
      return {
        text: `📅 AGE CALCULATION\n========================================\nDate of Birth: ${dob.toLocaleDateString()}\nAs on Date: ${target.toLocaleDateString()}\nExact Age: ${years} years, ${months} months, ${days} days\nTotal Days Lived: ${totalDays.toLocaleString()} days\nNext Birthday: ${new Date(target.getFullYear(), dob.getMonth(), dob.getDate()).toLocaleDateString()}`,
        history: { type: "Age", text: `${years} years, ${months} months` },
      };
    });

    // ============================================
    // 12. BMI CALCULATOR (NEW)
    // ============================================
    simpleTool("bmi", "⚖️", "BMI Calculator", [
      { label: "Weight (kg)", html: '<input id="bmiW" type="number" value="70" step="1" />' },
      { label: "Height (cm)", html: '<input id="bmiH" type="number" value="170" step="1" />' },
    ], (card) => {
      const w = Math.max(0, n(q(card, "#bmiW").value, 0));
      const hCm = Math.max(0, n(q(card, "#bmiH").value, 0));
      const h = hCm / 100;
      if (w <= 0 || h <= 0) return { text: "Please enter valid weight and height", history: null };
      const bmi = w / (h * h);
      let category = "";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi < 25) category = "Normal weight";
      else if (bmi < 30) category = "Overweight";
      else category = "Obese";
      const minW = 18.5 * h * h;
      const maxW = 24.9 * h * h;
      return {
        text: `⚖️ BMI CALCULATION\n========================================\nWeight: ${w} kg\nHeight: ${hCm} cm\nBMI: ${bmi.toFixed(2)}\nCategory: ${category}\nHealthy Weight Range: ${minW.toFixed(1)} kg - ${maxW.toFixed(1)} kg`,
        meta: `<span class="result-chip total">BMI ${bmi.toFixed(2)}</span><span class="result-chip">${category}</span>`,
        history: { type: "BMI", text: `BMI ${bmi.toFixed(2)} - ${category}` },
      };
    });

    // ============================================
    // 13. FUEL COST CALCULATOR (NEW)
    // ============================================
    simpleTool("fuel", "⛽", "Fuel Cost Calculator", [
      { label: "Currency", html: `<select id="fuelCur">${currencyOptions()}</select>` },
      { label: "Distance (km)", html: '<input id="fuelDist" type="number" value="500" step="50" />' },
      { label: "Fuel Efficiency (km/l)", html: '<input id="fuelEff" type="number" value="15" step="1" />' },
      { label: "Fuel Price per Liter", html: '<input id="fuelPrice" type="number" value="100" step="5" />' },
    ], (card) => {
      const cur = q(card, "#fuelCur").value || "USD";
      const dist = Math.max(0, n(q(card, "#fuelDist").value, 0));
      const eff = Math.max(0.1, n(q(card, "#fuelEff").value, 1));
      const price = Math.max(0, n(q(card, "#fuelPrice").value, 0));
      const liters = dist / eff;
      const totalCost = liters * price;
      return {
        text: `⛽ FUEL COST CALCULATION\n========================================\nDistance: ${dist} km\nFuel Efficiency: ${eff} km/l\nFuel Required: ${liters.toFixed(2)} liters\nFuel Price: ${money(price, cur)}/liter\nTotal Fuel Cost: ${money(totalCost, cur)}`,
        meta: `<span class="result-chip total">Total Cost ${money(totalCost, cur)}</span><span class="result-chip">${liters.toFixed(2)} L</span>`,
        history: { type: "Fuel Cost", text: `${money(totalCost, cur)} for ${dist} km` },
      };
    });

    // ============================================
    // 14. SALARY CALCULATOR (NEW)
    // ============================================
    simpleTool("salary", "💼", "Salary Calculator", [
      { label: "Currency", html: `<select id="salCur">${currencyOptions()}</select>` },
      { label: "Annual Salary", html: '<input id="salAnnual" type="number" value="600000" step="10000" />' },
      { label: "Tax %", html: '<input id="salTax" type="number" value="15" step="1" />' },
      { label: "Other Deductions", html: '<input id="salDed" type="number" value="5000" step="1000" />' },
    ], (card) => {
      const cur = q(card, "#salCur").value || "USD";
      const annual = Math.max(0, n(q(card, "#salAnnual").value, 0));
      const taxPct = Math.max(0, n(q(card, "#salTax").value, 0));
      const deductions = Math.max(0, n(q(card, "#salDed").value, 0));
      const monthly = annual / 12;
      const taxAmount = (annual * taxPct) / 100;
      const netAnnual = annual - taxAmount - deductions;
      const netMonthly = netAnnual / 12;
      return {
        text: `💼 SALARY CALCULATION\n========================================\nAnnual Salary: ${money(annual, cur)}\nMonthly Gross: ${money(monthly, cur)}\nTax (${taxPct}%): -${money(taxAmount, cur)}\nOther Deductions: -${money(deductions, cur)}\nNet Annual Salary: ${money(netAnnual, cur)}\nNet Monthly Salary: ${money(netMonthly, cur)}`,
        meta: `<span class="result-chip total">Net Monthly ${money(netMonthly, cur)}</span><span class="result-chip">Net Annual ${money(netAnnual, cur)}</span>`,
        history: { type: "Salary", text: `${money(netMonthly, cur)}/month` },
      };
    });

    // ============================================
    // 15. TIP CALCULATOR
    // ============================================
    simpleTool("tip", "🍽️", "Tip Splitter", [
      { label: "Currency", html: `<select id="tipCur">${currencyOptions()}</select>` },
      { label: "Bill Amount", html: '<input id="tipBill" type="number" value="2500" step="100" />' },
      { label: "Tip %", html: '<input id="tipPct" type="number" value="15" step="1" />' },
      { label: "Number of People", html: '<input id="tipPeople" type="number" value="2" min="1" />' },
    ], (card) => {
      const cur = q(card, "#tipCur").value || "USD";
      const bill = Math.max(0, n(q(card, "#tipBill").value, 0));
      const tipPct = Math.max(0, n(q(card, "#tipPct").value, 0));
      const people = Math.max(1, qty(q(card, "#tipPeople").value));
      const tipAmount = (bill * tipPct) / 100;
      const total = bill + tipAmount;
      const perPerson = total / people;
      const tipPerPerson = tipAmount / people;
      return {
        text: `🍽️ TIP CALCULATION\n========================================\nBill Amount: ${money(bill, cur)}\nTip (${tipPct}%): ${money(tipAmount, cur)}\nTotal Bill: ${money(total, cur)}\nSplit between ${people} people\nPer Person: ${money(perPerson, cur)}\nTip per Person: ${money(tipPerPerson, cur)}`,
        meta: `<span class="result-chip total">${money(perPerson, cur)}/person</span><span class="result-chip">Tip ${money(tipAmount, cur)}</span>`,
        history: { type: "Tip", text: `${money(perPerson, cur)}/person for ${people} people` },
      };
    });

    // ============================================
    // HISTORY CARD
    // ============================================
    historyCard = registerCard("history", "📜", "Recent Calculations", `
      <div id="calcHistory" class="chip-list"></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="clearCalcHistory">Clear History</button>
        <button class="btn btn-secondary" id="exportCalcHistory">Export History</button>
      </div>
    `, false);
    historyCard.classList.add("full-width");
    q(historyCard, "#clearCalcHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    q(historyCard, "#exportCalcHistory").addEventListener("click", () => {
      const history = readHistory();
      const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n");
      downloadTextFile(`calculator-history-${new Date().toISOString().slice(0,10)}.txt`, exportText);
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const overlay = document.createElement("div");
    overlay.className = "calc-focus-overlay";
    const host = document.createElement("div");
    host.className = "calc-focus-host";
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
      q(card, "[data-focus-open]")?.classList.add("is-hidden");
      q(card, "[data-focus-close]")?.classList.add("active");
      host.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("calc-modal-open");
      focusedCard = card;
    }
    
    function closeFocus() {
      if (!focusedCard) return;
      q(focusedCard, "[data-focus-open]")?.classList.remove("is-hidden");
      q(focusedCard, "[data-focus-close]")?.classList.remove("active");
      focusedCard.classList.remove("is-focused");
      placeholder?.parentNode?.insertBefore(focusedCard, placeholder);
      placeholder?.remove();
      focusedCard = null;
      host.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("calc-modal-open");
    }
    
    cards.forEach((card) => {
      q(card, "[data-focus-open]")?.addEventListener("click", () => openFocus(card));
      q(card, "[data-focus-close]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        closeFocus();
      });
      q(card, ".calc-card-header")?.addEventListener("click", (event) => {
        if (event.target.closest("button,input,select,textarea,a")) return;
        openFocus(card);
      });
    });
    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeFocus();
    });

    // Navigation buttons
    document.querySelectorAll(".tool-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-target");
        const card = document.getElementById(`card-${target}`);
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => openFocus(card), 160);
      });
    });

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  window.QwicktonCategoryInits["calculator-tools"] = calculatorInit;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) calculatorInit();
  });
})();