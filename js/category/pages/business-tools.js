(function() {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-business-history-v3";

  // Country Profiles
  const COUNTRY_PROFILES = {
    IN: { name: "India", currency: "INR", locale: "en-IN", taxName: "GST", rate: 18 },
    US: { name: "United States", currency: "USD", locale: "en-US", taxName: "Sales Tax", rate: 7.25 },
    GB: { name: "United Kingdom", currency: "GBP", locale: "en-GB", taxName: "VAT", rate: 20 },
    DE: { name: "Germany", currency: "EUR", locale: "de-DE", taxName: "MwSt", rate: 19 },
    FR: { name: "France", currency: "EUR", locale: "fr-FR", taxName: "TVA", rate: 20 },
    CA: { name: "Canada", currency: "CAD", locale: "en-CA", taxName: "GST/HST", rate: 13 },
    AU: { name: "Australia", currency: "AUD", locale: "en-AU", taxName: "GST", rate: 10 },
    SG: { name: "Singapore", currency: "SGD", locale: "en-SG", taxName: "GST", rate: 9 },
    AE: { name: "UAE", currency: "AED", locale: "en-AE", taxName: "VAT", rate: 5 },
    ZA: { name: "South Africa", currency: "ZAR", locale: "en-ZA", taxName: "VAT", rate: 15 },
    JP: { name: "Japan", currency: "JPY", locale: "ja-JP", taxName: "Consumption Tax", rate: 10 },
    BR: { name: "Brazil", currency: "BRL", locale: "pt-BR", taxName: "ICMS", rate: 17 },
    MX: { name: "Mexico", currency: "MXN", locale: "es-MX", taxName: "IVA", rate: 16 },
    KR: { name: "South Korea", currency: "KRW", locale: "ko-KR", taxName: "VAT", rate: 10 },
    CN: { name: "China", currency: "CNY", locale: "zh-CN", taxName: "VAT", rate: 13 },
    SA: { name: "Saudi Arabia", currency: "SAR", locale: "ar-SA", taxName: "VAT", rate: 15 },
    TR: { name: "Turkey", currency: "TRY", locale: "tr-TR", taxName: "KDV", rate: 18 },
    RU: { name: "Russia", currency: "RUB", locale: "ru-RU", taxName: "VAT", rate: 20 },
    IT: { name: "Italy", currency: "EUR", locale: "it-IT", taxName: "IVA", rate: 22 },
    ES: { name: "Spain", currency: "EUR", locale: "es-ES", taxName: "IVA", rate: 21 },
    NL: { name: "Netherlands", currency: "EUR", locale: "nl-NL", taxName: "BTW", rate: 21 },
    SE: { name: "Sweden", currency: "SEK", locale: "sv-SE", taxName: "Moms", rate: 25 },
    NO: { name: "Norway", currency: "NOK", locale: "nb-NO", taxName: "VAT", rate: 25 },
    DK: { name: "Denmark", currency: "DKK", locale: "da-DK", taxName: "Moms", rate: 25 },
    CH: { name: "Switzerland", currency: "CHF", locale: "de-CH", taxName: "VAT", rate: 7.7 },
    PL: { name: "Poland", currency: "PLN", locale: "pl-PL", taxName: "VAT", rate: 23 },
    NZ: { name: "New Zealand", currency: "NZD", locale: "en-NZ", taxName: "GST", rate: 15 },
    MY: { name: "Malaysia", currency: "MYR", locale: "ms-MY", taxName: "SST", rate: 10 },
    TH: { name: "Thailand", currency: "THB", locale: "th-TH", taxName: "VAT", rate: 7 },
    VN: { name: "Vietnam", currency: "VND", locale: "vi-VN", taxName: "VAT", rate: 10 },
    ID: { name: "Indonesia", currency: "IDR", locale: "id-ID", taxName: "VAT", rate: 11 },
    PH: { name: "Philippines", currency: "PHP", locale: "en-PH", taxName: "VAT", rate: 12 },
    EG: { name: "Egypt", currency: "EGP", locale: "ar-EG", taxName: "VAT", rate: 14 },
    NG: { name: "Nigeria", currency: "NGN", locale: "en-NG", taxName: "VAT", rate: 7.5 },
    KE: { name: "Kenya", currency: "KES", locale: "en-KE", taxName: "VAT", rate: 16 },
    PK: { name: "Pakistan", currency: "PKR", locale: "ur-PK", taxName: "GST", rate: 17 },
    BD: { name: "Bangladesh", currency: "BDT", locale: "bn-BD", taxName: "VAT", rate: 15 },
    LK: { name: "Sri Lanka", currency: "LKR", locale: "si-LK", taxName: "VAT", rate: 8 },
    NP: { name: "Nepal", currency: "NPR", locale: "ne-NP", taxName: "VAT", rate: 13 },
    AR: { name: "Argentina", currency: "ARS", locale: "es-AR", taxName: "IVA", rate: 21 },
    CL: { name: "Chile", currency: "CLP", locale: "es-CL", taxName: "IVA", rate: 19 },
    CO: { name: "Colombia", currency: "COP", locale: "es-CO", taxName: "IVA", rate: 19 },
    PE: { name: "Peru", currency: "PEN", locale: "es-PE", taxName: "IGV", rate: 18 },
    MA: { name: "Morocco", currency: "MAD", locale: "fr-MA", taxName: "VAT", rate: 20 },
    GH: { name: "Ghana", currency: "GHS", locale: "en-GH", taxName: "VAT", rate: 15 },
    ET: { name: "Ethiopia", currency: "ETB", locale: "am-ET", taxName: "VAT", rate: 15 },
    TZ: { name: "Tanzania", currency: "TZS", locale: "sw-TZ", taxName: "VAT", rate: 18 },
    UG: { name: "Uganda", currency: "UGX", locale: "en-UG", taxName: "VAT", rate: 18 },
    QA: { name: "Qatar", currency: "QAR", locale: "ar-QA", taxName: "VAT", rate: 5 },
    OM: { name: "Oman", currency: "OMR", locale: "ar-OM", taxName: "VAT", rate: 5 },
    KW: { name: "Kuwait", currency: "KWD", locale: "ar-KW", taxName: "VAT", rate: 5 },
    BH: { name: "Bahrain", currency: "BHD", locale: "ar-BH", taxName: "VAT", rate: 10 },
    IL: { name: "Israel", currency: "ILS", locale: "he-IL", taxName: "VAT", rate: 17 },
    PT: { name: "Portugal", currency: "EUR", locale: "pt-PT", taxName: "IVA", rate: 23 },
    IE: { name: "Ireland", currency: "EUR", locale: "en-IE", taxName: "VAT", rate: 23 },
    BE: { name: "Belgium", currency: "EUR", locale: "nl-BE", taxName: "VAT", rate: 21 },
    AT: { name: "Austria", currency: "EUR", locale: "de-AT", taxName: "VAT", rate: 20 },
    FI: { name: "Finland", currency: "EUR", locale: "fi-FI", taxName: "VAT", rate: 24 },
    CZ: { name: "Czech Republic", currency: "CZK", locale: "cs-CZ", taxName: "VAT", rate: 21 },
    HU: { name: "Hungary", currency: "HUF", locale: "hu-HU", taxName: "VAT", rate: 27 },
    RO: { name: "Romania", currency: "RON", locale: "ro-RO", taxName: "VAT", rate: 19 },
    UA: { name: "Ukraine", currency: "UAH", locale: "uk-UA", taxName: "VAT", rate: 20 },
    KZ: { name: "Kazakhstan", currency: "KZT", locale: "kk-KZ", taxName: "VAT", rate: 12 }
  };

  const CURRENCIES = Array.from(new Set(Object.values(COUNTRY_PROFILES).map(p => p.currency))).sort();

  // Utility Functions
  function q(root, sel) { return root.querySelector(sel); }
  function n(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function qty(value) { return Math.max(1, Math.round(n(value, 1))); }
  function fail(message) { throw new Error(message); }
  function escapeHtml(str) {
    return String(str || "").replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m);
  }
  function money(value, currency, locale) {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n(value, 0));
  }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(filename, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function downloadCSV(filename, data) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","));
    downloadTextFile(filename, [headers.join(","), ...rows].join("\n"));
  }
  function downloadJSON(filename, data) { downloadTextFile(filename, JSON.stringify(data, null, 2)); }
  
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
  
  function wireExport(card, prefix, title, getText, getCSV = null, getJSON = null) {
    q(card, `[data-export='${prefix}-txt']`)?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    q(card, `[data-export='${prefix}-pdf']`)?.addEventListener("click", async () => downloadPdfFromText(`${prefix}.pdf`, title, getText()));
    q(card, `[data-export='${prefix}-png']`)?.addEventListener("click", () => downloadImageFromText(`${prefix}.png`, getText(), "image/png"));
    q(card, `[data-export='${prefix}-jpg']`)?.addEventListener("click", () => downloadImageFromText(`${prefix}.jpg`, getText(), "image/jpeg"));
    q(card, `[data-export='${prefix}-csv']`)?.addEventListener("click", () => { if (getCSV) downloadCSV(`${prefix}.csv`, getCSV()); });
    q(card, `[data-export='${prefix}-json']`)?.addEventListener("click", () => { if (getJSON) downloadJSON(`${prefix}.json`, getJSON()); });
  }

  function countryOptions() {
    return Object.keys(COUNTRY_PROFILES).sort((a, b) => COUNTRY_PROFILES[a].name.localeCompare(COUNTRY_PROFILES[b].name))
      .map(code => `<option value="${code}">${COUNTRY_PROFILES[code].name}</option>`).join("");
  }
  function currencyOptions() { return CURRENCIES.map(cur => `<option value="${cur}">${cur}</option>`).join(""); }
  function detectCountry() {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const region = (locale.split("-")[1] || "US").toUpperCase();
    return COUNTRY_PROFILES[region] ? region : "US";
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  }
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30)));
    } catch (error) {
      void error;
    }
  }
  function pushHistory(type, text) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 200), ts: Date.now() }, ...readHistory()]); }

  function businessInit(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.businessInitDone === "true") return;
    grid.dataset.businessInitDone = "true";
    grid.innerHTML = "";

    document.getElementById("countryCount").textContent = String(Object.keys(COUNTRY_PROFILES).length);

    const cards = [];
    const registerCard = (id, icon, title, bodyHtml, focusable = true) => {
      const card = document.createElement("article");
      card.className = "bt-card";
      card.id = `card-${id}`;
      card.dataset.tool = id;
      card.dataset.focusable = focusable ? "true" : "false";
      card.innerHTML = `
        <header class="bt-card-header">
          <div class="bt-card-icon">${icon}</div>
          <h3 class="bt-card-title">${title}</h3>
          ${focusable ? '<button class="btn btn-secondary bt-focus-btn" data-focus-open type="button">Open</button><button class="btn btn-secondary bt-focus-inline-close" data-focus-close type="button">Close</button>' : ""}
        </header>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      cards.push(card);
      return card;
    };

    const defaultCountry = detectCountry();
    const profileFor = (code) => COUNTRY_PROFILES[code] || COUNTRY_PROFILES.US;
    let historyCard = null;
    
    function renderHistory() {
      if (!historyCard) return;
      const container = q(historyCard, "#bizHistory");
      if (!container) return;
      const items = readHistory();
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No business outputs yet.</span>'; return; }
      container.innerHTML = items.map((item, i) => `<button class="prompt-chip" data-h="${i}"><strong>${escapeHtml(item.type)}</strong> - ${escapeHtml(item.text)}</button>`).join("");
      container.querySelectorAll("[data-h]").forEach(btn => btn.addEventListener("click", () => { const item = items[n(btn.getAttribute("data-h"), 0)]; if (item) copyText(item.text); }));
    }

    // ============================================
    // INVOICE CARD
    // ============================================
    const invoiceCard = registerCard("invoice", "🧾", "Global Invoice Studio Pro", `
      <div class="grid-2">
        <div><label>Invoice #</label><input id="invNo" value="INV-1001" /></div>
        <div><label>Date</label><input id="invDate" type="date" /></div>
        <div><label>Seller</label><input id="invSeller" value="Your Business" /></div>
        <div><label>Buyer</label><input id="invBuyer" value="Client" /></div>
        <div><label>Country</label><select id="invCountry">${countryOptions()}</select></div>
        <div><label>Currency</label><select id="invCurrency">${currencyOptions()}</select></div>
        <div><label>Tax Rate %</label><input id="invRate" type="number" value="18" /></div>
        <div><label>Discount %</label><input id="invDisc" type="number" value="0" /></div>
      </div>
      <div><label>Items</label>
        <table class="line-items-table" id="invItems"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Discount%</th><th></th></tr></thead><tbody></tbody></table>
        <button class="btn btn-secondary" id="invAdd" type="button">+ Add Item</button>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="invRun" type="button">Generate</button>
        <button class="btn btn-secondary" id="invCopy" type="button">Copy</button>
        <button class="btn btn-secondary" data-export="invoice-txt" type="button">TXT</button>
        <button class="btn btn-secondary" data-export="invoice-pdf" type="button">PDF</button>
        <button class="btn btn-secondary" data-export="invoice-png" type="button">PNG</button>
        <button class="btn btn-secondary" data-export="invoice-jpg" type="button">JPG</button>
        <button class="btn btn-secondary" data-export="invoice-csv" type="button">CSV</button>
        <button class="btn btn-secondary" data-export="invoice-json" type="button">JSON</button>
      </div>
      <div class="result-meta" id="invMeta"></div>
      <textarea id="invOut" class="result"></textarea>
    `);

    function addLineRow(table, defaults = {}) {
      const tbody = q(table, "tbody");
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input data-col="desc" value="${escapeHtml(defaults.desc || "")}" placeholder="Item description" style="min-width:140px" /></td>
        <td><input data-col="qty" type="number" min="1" value="${qty(defaults.qty || 1)}" style="width:80px" /></td>
        <td><input data-col="rate" type="number" min="0" value="${n(defaults.rate, 0)}" style="width:100px" /></td>
        <td><input data-col="discount" type="number" min="0" max="100" value="${n(defaults.discount, 0)}" style="width:80px" /></td>
        <td><button class="btn bt-row-remove" type="button">✕</button></td>
      `;
      tbody.appendChild(row);
      q(row, ".bt-row-remove").addEventListener("click", () => { if (tbody.children.length > 1) row.remove(); });
    }

    function tableRows(table) {
      return Array.from(table.querySelectorAll("tbody tr")).map(row => {
        const desc = q(row, "[data-col='desc']").value.trim() || "Item";
        const qn = qty(q(row, "[data-col='qty']").value);
        const rate = Math.max(0, n(q(row, "[data-col='rate']").value));
        const discPct = Math.max(0, n(q(row, "[data-col='discount']").value));
        const subtotal = qn * rate;
        const discount = (subtotal * discPct) / 100;
        const total = subtotal - discount;
        return { desc, qty: qn, rate, discPct, subtotal, discount, total };
      });
    }

    const invCountry = q(invoiceCard, "#invCountry");
    const invCurrency = q(invoiceCard, "#invCurrency");
    const invRate = q(invoiceCard, "#invRate");
    invCountry.value = defaultCountry;
    invCurrency.value = profileFor(defaultCountry).currency;
    invRate.value = String(profileFor(defaultCountry).rate);
    q(invoiceCard, "#invDate").value = new Date().toISOString().slice(0, 10);
    const invTable = q(invoiceCard, "#invItems");
    addLineRow(invTable, { desc: "Consulting Service", qty: 1, rate: 1000 });
    addLineRow(invTable, { desc: "Support Plan", qty: 1, rate: 250 });
    q(invoiceCard, "#invAdd").addEventListener("click", () => addLineRow(invTable));

    invCountry.addEventListener("change", () => {
      const p = profileFor(invCountry.value);
      invCurrency.value = p.currency;
      invRate.value = String(p.rate);
    });

    let invoiceText = "";
    let invoiceData = [];

    function runInvoice(saveHistory) {
      try {
        const p = profileFor(invCountry.value);
        const cur = invCurrency.value || p.currency;
        const rate = Math.max(0, n(invRate.value, p.rate));
        const disc = Math.max(0, n(q(invoiceCard, "#invDisc").value, 0));
        const rows = tableRows(invTable);
        if (!rows.length) fail("Add at least one line item.");
        const subtotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
        if (subtotal <= 0) fail("Subtotal must be greater than 0.");
        const itemDiscounts = rows.reduce((sum, row) => sum + row.discount, 0);
        const afterItemDisc = subtotal - itemDiscounts;
        const globalDiscount = (afterItemDisc * disc) / 100;
        const base = Math.max(0, afterItemDisc - globalDiscount);
        const tax = (base * rate) / 100;
        const total = base + tax;

        invoiceData = rows.map(row => ({
          description: row.desc, quantity: row.qty, rate: row.rate,
          discountPercent: row.discPct, discountAmount: row.discount, subtotal: row.subtotal, total: row.total
        }));

        invoiceText = [
          "QWICKTON GLOBAL INVOICE PRO", "========================================",
          `Invoice No: ${q(invoiceCard, "#invNo").value.trim() || "INV-1001"}`,
          `Date: ${q(invoiceCard, "#invDate").value}`,
          `Seller: ${q(invoiceCard, "#invSeller").value.trim() || "Seller"}`,
          `Buyer: ${q(invoiceCard, "#invBuyer").value.trim() || "Buyer"}`,
          `Country: ${p.name}`, `Currency: ${cur}`,
          "", "LINE ITEMS:",
          ...rows.map((row, i) => `${i + 1}. ${row.desc} | Qty ${row.qty} x ${money(row.rate, cur, p.locale)} = ${money(row.subtotal, cur, p.locale)}${row.discPct > 0 ? ` (Disc ${row.discPct}%: -${money(row.discount, cur, p.locale)})` : ""}`),
          "----------------------------------------",
          `Subtotal: ${money(subtotal, cur, p.locale)}`,
          `Item Discounts: -${money(itemDiscounts, cur, p.locale)}`,
          `Global Discount (${disc}%): -${money(globalDiscount, cur, p.locale)}`,
          `Taxable Amount: ${money(base, cur, p.locale)}`,
          `${p.taxName} (${rate}%): ${money(tax, cur, p.locale)}`,
          `Total Payable: ${money(total, cur, p.locale)}`,
          "========================================"
        ].join("\n");

        q(invoiceCard, "#invOut").value = invoiceText;
        q(invoiceCard, "#invMeta").innerHTML = `<span class="result-chip">Subtotal ${money(subtotal, cur, p.locale)}</span><span class="result-chip">${p.taxName} ${money(tax, cur, p.locale)}</span><span class="result-chip total">Total ${money(total, cur, p.locale)}</span>`;
        if (saveHistory) pushHistory("Invoice Pro", `${q(invoiceCard, "#invNo").value || "INV"} - ${money(total, cur, p.locale)}`);
      } catch (error) {
        invoiceText = `Error: ${error?.message || "Unable to generate invoice."}`;
        invoiceData = [];
        q(invoiceCard, "#invOut").value = invoiceText;
        q(invoiceCard, "#invMeta").innerHTML = `<span class="bt-msg-error">${escapeHtml(error?.message || "Please check invoice inputs.")}</span>`;
      }
      renderHistory();
    }

    q(invoiceCard, "#invRun").addEventListener("click", () => runInvoice(true));
    q(invoiceCard, "#invCopy").addEventListener("click", () => copyText(invoiceText));
    invoiceCard.addEventListener("input", () => runInvoice(false));
    runInvoice(false);
    wireExport(invoiceCard, "invoice", "Invoice", () => invoiceText, () => invoiceData, () => invoiceData);

    // ============================================
    // SIMPLE TOOL HELPER
    // ============================================
    function simpleTool(id, icon, title, fields, compute, opts = {}) {
      const card = registerCard(id, icon, title, `
        <div class="grid-2">${fields.map(f => `<div><label>${f.label}</label>${f.html}</div>`).join("")}</div>
        <div class="inline-row">
          <button class="btn btn-primary" type="button" data-run>Analyze</button>
          <button class="btn btn-secondary" type="button" data-copy>Copy</button>
          <button class="btn btn-secondary" type="button" data-export="${id}-txt">TXT</button>
          ${opts.pdf !== false ? `<button class="btn btn-secondary" type="button" data-export="${id}-pdf">PDF</button>` : ""}
          <button class="btn btn-secondary" type="button" data-export="${id}-png">PNG</button>
          <button class="btn btn-secondary" type="button" data-export="${id}-jpg">JPG</button>
        </div>
        <div class="result-meta" data-meta></div>
        <textarea class="result" data-out></textarea>
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
          q(card, "[data-meta]").innerHTML = `<span class="bt-msg-error">${escapeHtml(error?.message || "Unable to process inputs.")}</span>`;
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
    // BILL CARD
    // ============================================
    simpleTool("bill", "🏪", "Bill / Receipt Generator Pro", [
      { label: "Bill #", html: '<input id="billNo" value="BILL-1001" />' },
      { label: "Date", html: '<input id="billDate" type="date" />' },
      { label: "Business", html: '<input id="billBiz" value="Your Store" />' },
      { label: "Customer", html: '<input id="billCust" value="Customer" />' },
      { label: "Country", html: `<select id="billCountry">${countryOptions()}</select>` },
      { label: "Currency", html: `<select id="billCurrency">${currencyOptions()}</select>` },
      { label: "Amount", html: '<input id="billAmount" type="number" value="500" />' },
      { label: "Tax %", html: '<input id="billRate" type="number" value="7.25" />' },
      { label: "Discount %", html: '<input id="billDisc" type="number" value="0" />' }
    ], (card) => {
      const p = profileFor(q(card, "#billCountry").value || defaultCountry);
      const cur = q(card, "#billCurrency").value || p.currency;
      const amt = Math.max(0, n(q(card, "#billAmount").value, 0));
      const rate = Math.max(0, n(q(card, "#billRate").value, p.rate));
      const disc = Math.max(0, n(q(card, "#billDisc").value, 0));
      const afterDisc = amt * (1 - disc / 100);
      const tax = (afterDisc * rate) / 100;
      const total = afterDisc + tax;
      if (!q(card, "#billDate").value) q(card, "#billDate").value = new Date().toISOString().slice(0, 10);
      return {
        text: `QWICKTON BILL PRO\n========================================\nBill No: ${q(card, "#billNo").value}\nDate: ${q(card, "#billDate").value}\nBusiness: ${q(card, "#billBiz").value}\nCustomer: ${q(card, "#billCust").value}\nCountry: ${p.name}\nSubtotal: ${money(amt, cur, p.locale)}\nDiscount (${disc}%): -${money(amt * disc / 100, cur, p.locale)}\nAfter Discount: ${money(afterDisc, cur, p.locale)}\n${p.taxName} (${rate}%): ${money(tax, cur, p.locale)}\nPayable: ${money(total, cur, p.locale)}`,
        meta: `<span class="result-chip total">Payable ${money(total, cur, p.locale)}</span>`,
        history: { type: "Bill Pro", text: money(total, cur, p.locale) }
      };
    });

    // ============================================
    // TAX CARD
    // ============================================
    const taxCard = registerCard("gst", "🌐", "Global Tax Calculator Pro", `
      <div class="grid-2">
        <div><label>Country</label><select id="taxCountry">${countryOptions()}</select></div>
        <div><label>Currency</label><select id="taxCurrency">${currencyOptions()}</select></div>
        <div><label>Amount</label><input id="taxAmount" type="number" value="1000" /></div>
        <div><label>Tax Rate %</label><input id="taxRate" type="number" value="7.25" /></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="taxRun">Analyze Tax</button><button class="btn btn-secondary" type="button" id="taxCopy">Copy</button><button class="btn btn-secondary" type="button" data-export="tax-txt">TXT</button><button class="btn btn-secondary" type="button" data-export="tax-pdf">PDF</button></div>
      <table class="gst-table" id="taxTable"><tr><td colspan="2">Select country and click Analyze</td></tr></table>
    `);

    let latestTaxText = "";
    taxCard.querySelector("#taxRun").addEventListener("click", () => {
      const p = profileFor(q(taxCard, "#taxCountry").value || defaultCountry);
      const cur = q(taxCard, "#taxCurrency").value || p.currency;
      const amt = Math.max(0, n(q(taxCard, "#taxAmount").value, 0));
      const rate = Math.max(0, n(q(taxCard, "#taxRate").value, p.rate));
      const tax = (amt * rate) / 100;
      const total = amt + tax;
      const rows = [["Country", p.name], ["Tax Regime", p.taxName], ["Taxable/Base", money(amt, cur, p.locale)], [`${p.taxName} (${rate}%)`, money(tax, cur, p.locale)], ["Total", money(total, cur, p.locale)]];
      taxCard.querySelector("#taxTable").innerHTML = rows.map(row => `<tr><td class="label">${row[0]}</td><td class="value">${row[1]}</td></tr>`).join("");
      latestTaxText = rows.map(row => `${row[0]}: ${row[1]}`).join("\n");
      pushHistory("Tax Pro", `${p.name} - ${money(total, cur, p.locale)}`);
      renderHistory();
    });
    taxCard.querySelector("#taxCopy").addEventListener("click", () => copyText(latestTaxText));
    wireExport(taxCard, "tax", "Tax Report", () => latestTaxText);

    // ============================================
    // QUOTATION CARD
    // ============================================
    simpleTool("quote", "💼", "Quotation Planner Pro", [
      { label: "Country", html: `<select id="qCountry">${countryOptions()}</select>` },
      { label: "Currency", html: `<select id="qCurrency">${currencyOptions()}</select>` },
      { label: "Cost/Unit", html: '<input id="qCost" type="number" value="100" />' },
      { label: "Margin %", html: '<input id="qMargin" type="number" value="30" />' },
      { label: "Quantity", html: '<input id="qQty" type="number" value="10" />' },
      { label: "Tax %", html: '<input id="qTax" type="number" value="7.25" />' },
      { label: "Discount %", html: '<input id="qDisc" type="number" value="0" />' }
    ], (card) => {
      const p = profileFor(q(card, "#qCountry").value || defaultCountry);
      const cur = q(card, "#qCurrency").value || p.currency;
      const cost = Math.max(0, n(q(card, "#qCost").value, 0));
      const margin = Math.min(99, Math.max(0, n(q(card, "#qMargin").value, 30)));
      const qtyUnits = qty(q(card, "#qQty").value);
      const taxRate = Math.max(0, n(q(card, "#qTax").value, p.rate));
      const disc = Math.max(0, n(q(card, "#qDisc").value, 0));
      const sellUnit = cost / Math.max(0.01, 1 - margin / 100);
      const subtotal = sellUnit * qtyUnits;
      const discountAmt = (subtotal * disc) / 100;
      const afterDiscount = subtotal - discountAmt;
      const tax = (afterDiscount * taxRate) / 100;
      const total = afterDiscount + tax;
      const profit = (sellUnit - cost) * qtyUnits;
      return {
        text: `QUOTATION PRO\n========================================\nCountry: ${p.name}\nCost/Unit: ${money(cost, cur, p.locale)}\nTarget Margin: ${margin}%\nSell/Unit: ${money(sellUnit, cur, p.locale)}\nQuantity: ${qtyUnits}\nSubtotal: ${money(subtotal, cur, p.locale)}\nDiscount (${disc}%): -${money(discountAmt, cur, p.locale)}\nAfter Discount: ${money(afterDiscount, cur, p.locale)}\n${p.taxName} (${taxRate}%): ${money(tax, cur, p.locale)}\nFinal Quote: ${money(total, cur, p.locale)}\nEst. Profit: ${money(profit, cur, p.locale)}`,
        meta: `<span class="result-chip total">Quote ${money(total, cur, p.locale)}</span><span class="result-chip success">Profit ${money(profit, cur, p.locale)}</span>`,
        history: { type: "Quote Pro", text: money(total, cur, p.locale) }
      };
    });

    // ============================================
    // EMI CARD
    // ============================================
    simpleTool("emi", "🏦", "EMI Calculator Pro", [
      { label: "Currency", html: `<select id="emiCurrency">${currencyOptions()}</select>` },
      { label: "Loan Amount", html: '<input id="emiP" type="number" value="500000" />' },
      { label: "Down Payment", html: '<input id="emiDown" type="number" value="0" />' },
      { label: "Annual Rate %", html: '<input id="emiR" type="number" value="10.5" step="0.1" />' },
      { label: "Tenure (Months)", html: '<input id="emiM" type="number" value="36" />' },
      { label: "Extra Payment", html: '<input id="emiExtra" type="number" value="0" />' }
    ], (card) => {
      const cur = q(card, "#emiCurrency").value || "USD";
      const principal = Math.max(1, n(q(card, "#emiP").value, 1) - n(q(card, "#emiDown").value, 0));
      const annualRate = Math.max(0, n(q(card, "#emiR").value, 0));
      const months = Math.max(1, qty(q(card, "#emiM").value));
      const extra = Math.max(0, n(q(card, "#emiExtra").value, 0));
      const mr = annualRate / 12 / 100;
      const emi = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      const total = emi * months;
      const interest = total - principal;
      return {
        text: `EMI PRO REPORT\n========================================\nPrincipal: ${money(principal, cur)}\nAnnual Rate: ${annualRate}%\nTenure: ${months} months\nMonthly EMI: ${money(emi, cur)}\nExtra Payment: ${money(extra, cur)}/month\nTotal with Extra: ${money(emi + extra, cur)}/month\nTotal Interest: ${money(interest, cur)}\nTotal Payment: ${money(total, cur)}`,
        history: { type: "EMI Pro", text: `${money(emi, cur)}/month` }
      };
    });

    // ============================================
    // BREAK-EVEN CARD
    // ============================================
    simpleTool("breakeven", "📈", "Break-Even Analyzer Pro", [
      { label: "Currency", html: `<select id="beCurrency">${currencyOptions()}</select>` },
      { label: "Fixed Costs", html: '<input id="beF" type="number" value="50000" />' },
      { label: "Variable Cost/Unit", html: '<input id="beV" type="number" value="200" />' },
      { label: "Selling Price/Unit", html: '<input id="beS" type="number" value="500" />' },
      { label: "Target Profit", html: '<input id="beTarget" type="number" value="10000" />' }
    ], (card) => {
      const cur = q(card, "#beCurrency").value || "USD";
      const fixed = Math.max(0, n(q(card, "#beF").value, 0));
      const variable = Math.max(0, n(q(card, "#beV").value, 0));
      const sell = Math.max(0, n(q(card, "#beS").value, 0));
      const target = Math.max(0, n(q(card, "#beTarget").value, 0));
      const contribution = sell - variable;
      if (contribution <= 0) return { text: "Selling price must be greater than variable cost.", history: null };
      const beUnits = fixed / contribution;
      const beRevenue = beUnits * sell;
      const targetUnits = (fixed + target) / contribution;
      const marginPct = (contribution / sell) * 100;
      return {
        text: `BREAK-EVEN PRO\n========================================\nFixed Cost: ${money(fixed, cur)}\nVariable Cost/Unit: ${money(variable, cur)}\nSelling Price/Unit: ${money(sell, cur)}\nContribution/Unit: ${money(contribution, cur)} (${marginPct.toFixed(2)}%)\nBreak-Even Units: ${Math.ceil(beUnits).toLocaleString()}\nBreak-Even Revenue: ${money(beRevenue, cur)}\nTarget Profit: ${money(target, cur)}\nUnits for Target: ${Math.ceil(targetUnits).toLocaleString()}`,
        history: { type: "Break-even Pro", text: `${Math.ceil(beUnits)} units` }
      };
    });

    // ============================================
    // PURCHASE ORDER CARD
    // ============================================
    simpleTool("po", "🧾", "Purchase Order Builder", [
      { label: "PO #", html: '<input id="poNo" value="PO-1001" />' },
      { label: "Date", html: '<input id="poDate" type="date" />' },
      { label: "Company", html: '<input id="poCo" value="Your Company" />' },
      { label: "Supplier", html: '<input id="poSup" value="Supplier Name" />' },
      { label: "Currency", html: `<select id="poCur">${currencyOptions()}</select>` },
      { label: "Quantity", html: '<input id="poQty" type="number" value="10" />' },
      { label: "Rate", html: '<input id="poRate" type="number" value="50" />' },
      { label: "Item", html: '<input id="poItem" value="Raw Material" />' }
    ], (card) => {
      if (!q(card, "#poDate").value) q(card, "#poDate").value = new Date().toISOString().slice(0, 10);
      const cur = q(card, "#poCur").value || "USD";
      const qn = qty(q(card, "#poQty").value);
      const rate = Math.max(0, n(q(card, "#poRate").value, 0));
      const total = qn * rate;
      return {
        text: `PURCHASE ORDER\n========================================\nPO No: ${q(card, "#poNo").value}\nDate: ${q(card, "#poDate").value}\nCompany: ${q(card, "#poCo").value}\nSupplier: ${q(card, "#poSup").value}\nItem: ${q(card, "#poItem").value}\nQty: ${qn}\nRate: ${money(rate, cur)}\nOrder Total: ${money(total, cur)}`,
        history: { type: "PO", text: `${q(card, "#poNo").value} - ${money(total, cur)}` }
      };
    });

    // ============================================
    // CASH FLOW CARD
    // ============================================
    simpleTool("cashflow", "💸", "Cash Flow Forecast", [
      { label: "Currency", html: `<select id="cfCur">${currencyOptions()}</select>` },
      { label: "Opening Balance", html: '<input id="cfOpen" type="number" value="100000" />' },
      { label: "Monthly Inflow", html: '<input id="cfIn" type="number" value="60000" />' },
      { label: "Monthly Outflow", html: '<input id="cfOut" type="number" value="45000" />' },
      { label: "Months", html: '<input id="cfMonths" type="number" value="6" />' }
    ], (card) => {
      const cur = q(card, "#cfCur").value || "USD";
      const months = Math.max(1, qty(q(card, "#cfMonths").value));
      let close = n(q(card, "#cfOpen").value, 0);
      const inflow = n(q(card, "#cfIn").value, 0);
      const outflow = n(q(card, "#cfOut").value, 0);
      const lines = [];
      for (let i = 1; i <= months; i++) {
        close += inflow - outflow;
        lines.push(`Month ${i}: In ${money(inflow, cur)} | Out ${money(outflow, cur)} | Closing ${money(close, cur)}`);
      }
      return { text: `CASH FLOW FORECAST\n========================================\n${lines.join("\n")}\n\nProjected Closing Balance: ${money(close, cur)}`, history: { type: "Cash Flow", text: `Closing ${money(close, cur)}` } };
    });

    // ============================================
    // PAYROLL CARD
    // ============================================
    simpleTool("payroll", "👥", "Payroll Estimator", [
      { label: "Currency", html: `<select id="prCur">${currencyOptions()}</select>` },
      { label: "Employees", html: '<input id="prEmp" type="number" value="12" />' },
      { label: "Avg Salary", html: '<input id="prSal" type="number" value="35000" />' },
      { label: "Employer Contribution %", html: '<input id="prCon" type="number" value="12" />' },
      { label: "Bonus", html: '<input id="prBonus" type="number" value="10000" />' },
      { label: "Tax Withholding %", html: '<input id="prTax" type="number" value="8" />' }
    ], (card) => {
      const cur = q(card, "#prCur").value || "USD";
      const emp = Math.max(1, qty(q(card, "#prEmp").value));
      const salary = Math.max(0, n(q(card, "#prSal").value, 0));
      const contrib = Math.max(0, n(q(card, "#prCon").value, 0));
      const bonus = Math.max(0, n(q(card, "#prBonus").value, 0));
      const taxPct = Math.max(0, n(q(card, "#prTax").value, 0));
      const gross = emp * salary;
      const contribution = (gross * contrib) / 100;
      const withholding = (gross * taxPct) / 100;
      const totalCost = gross + contribution + bonus;
      const net = gross + bonus - withholding;
      return { text: `PAYROLL ESTIMATE\n========================================\nEmployees: ${emp}\nGross Payroll: ${money(gross, cur)}\nEmployer Contribution: ${money(contribution, cur)}\nBonus: ${money(bonus, cur)}\nTax Withholding: -${money(withholding, cur)}\nNet Disbursed: ${money(net, cur)}\nTotal Company Cost: ${money(totalCost, cur)}`, history: { type: "Payroll", text: `Cost ${money(totalCost, cur)}` } };
    });

    // ============================================
    // PRICING CARD
    // ============================================
    simpleTool("pricing", "🎯", "Pricing & Markup Analyzer", [
      { label: "Currency", html: `<select id="pcCur">${currencyOptions()}</select>` },
      { label: "Cost / Unit", html: '<input id="pcCost" type="number" value="180" />' },
      { label: "Target Margin %", html: '<input id="pcMargin" type="number" value="32" />' },
      { label: "Competitor Price", html: '<input id="pcComp" type="number" value="320" />' },
      { label: "Discount %", html: '<input id="pcDisc" type="number" value="5" />' },
      { label: "Expected Qty", html: '<input id="pcQty" type="number" value="250" />' }
    ], (card) => {
      const cur = q(card, "#pcCur").value || "USD";
      const cost = Math.max(0, n(q(card, "#pcCost").value, 0));
      const margin = Math.min(99, Math.max(0, n(q(card, "#pcMargin").value, 0)));
      const comp = Math.max(0, n(q(card, "#pcComp").value, 0));
      const disc = Math.max(0, n(q(card, "#pcDisc").value, 0));
      const qtyExp = Math.max(1, qty(q(card, "#pcQty").value));
      const list = cost / Math.max(0.01, 1 - margin / 100);
      const discounted = list * (1 - disc / 100);
      const perProfit = discounted - cost;
      const projected = perProfit * qtyExp;
      const gap = discounted - comp;
      return { text: `PRICING ANALYSIS\n========================================\nCost / Unit: ${money(cost, cur)}\nTarget Margin: ${margin}%\nList Price / Unit: ${money(list, cur)}\nDiscounted Price / Unit: ${money(discounted, cur)}\nPer Unit Profit: ${money(perProfit, cur)}\nProjected Profit: ${money(projected, cur)}\nCompetitor Price: ${money(comp, cur)}\nPrice Gap: ${money(gap, cur)}`, history: { type: "Pricing", text: `${money(projected, cur)} projected` } };
    });

    // ============================================
    // MARGIN CARD
    // ============================================
    simpleTool("margin", "📊", "Profit Margin Analyzer", [
      { label: "Currency", html: `<select id="mgCur">${currencyOptions()}</select>` },
      { label: "Revenue", html: '<input id="mgRev" type="number" value="100000" />' },
      { label: "COGS", html: '<input id="mgCogs" type="number" value="60000" />' },
      { label: "Operating Expenses", html: '<input id="mgOpEx" type="number" value="20000" />' }
    ], (card) => {
      const cur = q(card, "#mgCur").value || "USD";
      const revenue = Math.max(0, n(q(card, "#mgRev").value, 0));
      const cogs = Math.max(0, n(q(card, "#mgCogs").value, 0));
      const opEx = Math.max(0, n(q(card, "#mgOpEx").value, 0));
      const grossProfit = revenue - cogs;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const operatingProfit = grossProfit - opEx;
      const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
      const netProfit = operatingProfit;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      return {
        text: `PROFIT MARGIN ANALYSIS\n========================================\nRevenue: ${money(revenue, cur)}\nCOGS: ${money(cogs, cur)}\nGross Profit: ${money(grossProfit, cur)}\nGross Margin: ${grossMargin.toFixed(2)}%\nOperating Expenses: ${money(opEx, cur)}\nOperating Profit: ${money(operatingProfit, cur)}\nOperating Margin: ${operatingMargin.toFixed(2)}%\nNet Profit: ${money(netProfit, cur)}\nNet Margin: ${netMargin.toFixed(2)}%`,
        meta: `<span class="result-chip">Gross ${grossMargin.toFixed(1)}%</span><span class="result-chip total">Net ${netMargin.toFixed(1)}%</span>`,
        history: { type: "Margin", text: `Net ${netMargin.toFixed(1)}%` }
      };
    });

    // ============================================
    // AMORTIZATION CARD
    // ============================================
    const amCard = registerCard("amortization", "📅", "Loan Amortization Schedule", `
      <div class="grid-2">
        <div><label>Currency</label><select id="amCur">${currencyOptions()}</select></div>
        <div><label>Loan Amount</label><input id="amP" type="number" value="200000" /></div>
        <div><label>Annual Rate %</label><input id="amR" type="number" value="6.5" /></div>
        <div><label>Loan Term (Years)</label><input id="amY" type="number" value="30" /></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="amRun">Generate Schedule</button><button class="btn btn-secondary" type="button" id="amCopy">Copy Summary</button><button class="btn btn-secondary" type="button" data-export="amortization-txt">TXT</button><button class="btn btn-secondary" type="button" data-export="amortization-pdf">PDF</button></div>
      <textarea id="amOut" class="result" rows="8" placeholder="Amortization schedule will appear here..."></textarea>
    `);

    let amortText = "";
    amCard.querySelector("#amRun").addEventListener("click", () => {
      const cur = q(amCard, "#amCur").value || "USD";
      const principal = Math.max(1, n(q(amCard, "#amP").value, 1));
      const annualRate = Math.max(0, n(q(amCard, "#amR").value, 0));
      const years = Math.max(1, n(q(amCard, "#amY").value, 1));
      const months = years * 12;
      const mr = annualRate / 12 / 100;
      const payment = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
      let balance = principal;
      const schedule = [];
      let totalInterest = 0;
      for (let i = 1; i <= Math.min(months, 60); i++) {
        const interest = balance * mr;
        const principalPaid = payment - interest;
        balance -= principalPaid;
        totalInterest += interest;
        schedule.push(`Month ${i}: Payment ${money(payment, cur)} | Principal ${money(principalPaid, cur)} | Interest ${money(interest, cur)} | Balance ${money(balance, cur)}`);
        if (balance <= 0) break;
      }
      amortText = `AMORTIZATION SCHEDULE\n========================================\nLoan Amount: ${money(principal, cur)}\nRate: ${annualRate}%\nTerm: ${years} years\nMonthly Payment: ${money(payment, cur)}\nTotal Interest: ${money(totalInterest, cur)}\nTotal Payment: ${money(payment * months, cur)}\n\nFirst ${schedule.length} Months:\n${schedule.join("\n")}\n${schedule.length < months ? `\n... and ${months - schedule.length} more months` : ""}`;
      q(amCard, "#amOut").value = amortText;
      pushHistory("Amortization", `${money(payment, cur)}/month`);
    });
    amCard.querySelector("#amCopy").addEventListener("click", () => copyText(amortText));
    wireExport(amCard, "amortization", "Amortization", () => amortText);

    // ============================================
    // RUNWAY CARD
    // ============================================
    simpleTool("runway", "🛫", "Cash Runway Planner", [
      { label: "Currency", html: `<select id="rwCur">${currencyOptions()}</select>` },
      { label: "Current Cash", html: '<input id="rwCash" type="number" value="250000" />' },
      { label: "Monthly Revenue", html: '<input id="rwRevenue" type="number" value="90000" />' },
      { label: "Monthly Expense", html: '<input id="rwExpense" type="number" value="120000" />' },
      { label: "Expected Growth %", html: '<input id="rwGrowth" type="number" value="5" />' },
      { label: "Months to Simulate", html: '<input id="rwMonths" type="number" value="24" />' }
    ], (card) => {
      const cur = q(card, "#rwCur").value || "USD";
      const cash = Math.max(0, n(q(card, "#rwCash").value, 0));
      const revenue = Math.max(0, n(q(card, "#rwRevenue").value, 0));
      const expense = Math.max(0, n(q(card, "#rwExpense").value, 0));
      const growthPct = n(q(card, "#rwGrowth").value, 0);
      const months = Math.max(1, qty(q(card, "#rwMonths").value));
      if (expense <= 0) fail("Monthly expense must be greater than 0.");
      let balance = cash;
      let projectedRevenue = revenue;
      let runway = 0;
      const rows = [];
      for (let i = 1; i <= months; i++) {
        balance += projectedRevenue - expense;
        rows.push(`Month ${i}: Revenue ${money(projectedRevenue, cur)} | Burn ${money(expense - projectedRevenue, cur)} | Cash ${money(balance, cur)}`);
        projectedRevenue *= (1 + growthPct / 100);
        if (balance > 0) runway = i;
        if (balance <= 0) break;
      }
      const burn = expense - revenue;
      return {
        text: `RUNWAY PLAN\n========================================\nCurrent Cash: ${money(cash, cur)}\nMonthly Revenue: ${money(revenue, cur)}\nMonthly Expense: ${money(expense, cur)}\nNet Burn: ${money(burn, cur)}\nGrowth Assumption: ${growthPct.toFixed(2)}%\nEstimated Runway: ${runway} month(s)\n\nProjection:\n${rows.join("\n")}`,
        meta: `<span class="result-chip total">Runway ${runway} month(s)</span>`,
        history: { type: "Runway", text: `${runway} month(s)` }
      };
    });

    // ============================================
    // FX RISK CARD
    // ============================================
    simpleTool("risk", "⚠️", "FX Exposure Risk Estimator", [
      { label: "Home Currency", html: `<select id="fxHome">${currencyOptions()}</select>` },
      { label: "Invoice Currency", html: `<select id="fxForeign">${currencyOptions()}</select>` },
      { label: "Invoice Value", html: '<input id="fxAmount" type="number" value="50000" />' },
      { label: "Current FX Rate", html: '<input id="fxRate" type="number" value="1.1" step="0.0001" />' },
      { label: "Worst Move %", html: '<input id="fxMove" type="number" value="4" step="0.1" />' },
      { label: "Hedged %", html: '<input id="fxHedge" type="number" value="0" min="0" max="100" />' }
    ], (card) => {
      const home = q(card, "#fxHome").value || "USD";
      const foreign = q(card, "#fxForeign").value || "EUR";
      const amount = Math.max(0, n(q(card, "#fxAmount").value, 0));
      const rate = Math.max(0.0001, n(q(card, "#fxRate").value, 1));
      const move = Math.max(0, n(q(card, "#fxMove").value, 0));
      const hedge = Math.min(100, Math.max(0, n(q(card, "#fxHedge").value, 0)));
      if (amount <= 0) fail("Invoice value must be greater than 0.");
      const baseHome = amount * rate;
      const exposed = baseHome * ((100 - hedge) / 100);
      const riskValue = exposed * (move / 100);
      const worstDown = baseHome - riskValue;
      const worstUp = baseHome + riskValue;
      return {
        text: `FX RISK REPORT\n========================================\nHome Currency: ${home}\nInvoice Currency: ${foreign}\nInvoice Value: ${amount.toLocaleString()} ${foreign}\nSpot Rate: ${rate}\nHome Value: ${money(baseHome, home)}\nStress Move: ${move.toFixed(2)}%\nHedged: ${hedge.toFixed(1)}%\nExposure at Risk: ${money(exposed, home)}\nPotential P/L Swing: +/- ${money(riskValue, home)}\nWorst Case (Down): ${money(worstDown, home)}\nWorst Case (Up): ${money(worstUp, home)}`,
        meta: `<span class="result-chip">Exposure ${money(exposed, home)}</span><span class="result-chip total">Risk +/- ${money(riskValue, home)}</span>`,
        history: { type: "FX Risk", text: `+/- ${money(riskValue, home)}` }
      };
    });

    // ============================================
    // HISTORY CARD
    // ============================================
    historyCard = registerCard("history", "📜", "Recent Business Outputs", `<div id="bizHistory" class="chip-list"></div><div class="inline-row"><button class="btn btn-secondary" id="clearBizHistory">Clear History</button><button class="btn btn-secondary" id="exportBizHistory">Export History</button></div>`, false);
    historyCard.classList.add("full-width");
    q(historyCard, "#clearBizHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    q(historyCard, "#exportBizHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`business-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
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
      q(card, "[data-focus-open]")?.classList.add("is-hidden");
      q(card, "[data-focus-close]")?.classList.add("active");
      host.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("bt-modal-open");
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
      document.body.classList.remove("bt-modal-open");
    }
    
    cards.forEach(card => {
      q(card, "[data-focus-open]")?.addEventListener("click", () => openFocus(card));
      q(card, "[data-focus-close]")?.addEventListener("click", e => { e.stopPropagation(); closeFocus(); });
      q(card, ".bt-card-header")?.addEventListener("click", e => { if (!e.target.closest("button,input,select,textarea,a")) openFocus(card); });
    });
    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });

    // Navigation
    document.querySelectorAll(".tool-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach(el => el.classList.remove("active"));
        btn.classList.add("active");
        const card = document.getElementById(`card-${btn.getAttribute("data-target")}`);
        if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 160); }
      });
    });

    document.getElementById("year").textContent = new Date().getFullYear();
  }

  window.QwicktonCategoryInits["business-tools"] = businessInit;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) businessInit(); });
})();