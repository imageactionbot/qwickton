/**
 * SEO TOOLS - Complete JavaScript
 * Tools: Meta Tag Generator, SEO Helpers (Slug, robots.txt, sitemap), URL Parity Checker
 * Architecture: IIFE module, global register, double-init protection
 */

(function() {
  "use strict";

  // Register in global QwicktonCategoryInits
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

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
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-seo-history";
  
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
  function initSeoTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.seoToolsInitialized === "true") return;
    grid.dataset.seoToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "seo-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="seo-card-header">
          <div class="seo-card-icon">${icon}</div>
          <h3 class="seo-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary seo-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary seo-focus-inline-close" type="button" data-focus-close>Close</button>
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
      const historyContainer = historyCardEl.querySelector("#seoHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No SEO outputs yet.</span>';
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
    // META TAG GENERATOR CARD
    // ============================================
    const metaCard = makeCard("meta", "📋", "Meta Tag Generator Pro", `
      <div class="grid-2">
        <div><label>Page Title</label><input id="seoTitle" placeholder="Your Page Title Here"></div>
        <div><label>Meta Description</label><input id="seoDesc" placeholder="Brief description of the page"></div>
        <div><label>Meta Keywords</label><input id="seoKeywords" placeholder="keyword1, keyword2, keyword3"></div>
        <div><label>Canonical URL</label><input id="seoUrl" placeholder="https://example.com/page"></div>
        <div><label>Site Name</label><input id="seoSiteName" value="Qwickton"></div>
        <div><label>Social Image URL</label><input id="seoImage" placeholder="https://example.com/og-image.jpg"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="seoBtn">✨ Generate Meta Tags</button>
        <button class="btn btn-secondary" type="button" id="seoCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="seoDownloadBtn">⬇️ TXT</button>
      </div>
      <div><label>Generated Meta Tags</label><textarea id="seoRes" class="result" rows="10" placeholder="Meta tags will appear here..."></textarea></div>
      <div id="seoMeta" class="result" style="margin-top:0.5rem;">Title chars: 0 | Description chars: 0</div>
    `);

    metaCard.querySelector("#seoBtn").onclick = () => {
      const title = metaCard.querySelector("#seoTitle").value || "Page Title";
      const desc = metaCard.querySelector("#seoDesc").value || "Meta description for the page";
      const keywords = metaCard.querySelector("#seoKeywords").value || "";
      const canonical = metaCard.querySelector("#seoUrl").value || "";
      const site = metaCard.querySelector("#seoSiteName").value || "Website";
      const image = metaCard.querySelector("#seoImage").value || "";
      
      const out = [
        "<!-- ═══ PRIMARY SEO TAGS ═══ -->",
        `<title>${escapeHtml(title)}</title>`,
        `<meta name="description" content="${escapeHtml(desc)}">`,
        keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : "",
        `<meta name="robots" content="index, follow">`,
        canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : "",
        "",
        "<!-- ═══ OPEN GRAPH (SOCIAL MEDIA) ═══ -->",
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${escapeHtml(site)}">`,
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        `<meta property="og:description" content="${escapeHtml(desc)}">`,
        canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : "",
        image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
        "",
        "<!-- ═══ TWITTER CARD ═══ -->",
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escapeHtml(title)}">`,
        `<meta name="twitter:description" content="${escapeHtml(desc)}">`,
        image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""
      ].filter(Boolean).join("\n");
      
      metaCard.querySelector("#seoRes").value = out;
      const titleStatus = title.length <= 60 ? "good" : "long";
      const descStatus = desc.length <= 160 ? "good" : "long";
      metaCard.querySelector("#seoMeta").innerHTML = `📊 Title: ${title.length} chars (${titleStatus}) | Description: ${desc.length} chars (${descStatus})`;
      pushHistory("Meta Tags", title, renderHistory);
    };
    
    metaCard.querySelector("#seoCopyBtn").onclick = () => copyText(metaCard.querySelector("#seoRes").value);
    metaCard.querySelector("#seoDownloadBtn").onclick = () => downloadTextFile("meta-tags-output.txt", metaCard.querySelector("#seoRes").value);

    // ============================================
    // SEO HELPERS CARD (Slug, robots.txt, sitemap)
    // ============================================
    const helpersCard = makeCard("helpers", "🔧", "SEO Helpers", `
      <div class="grid-2">
        <div><label>Text for URL Slug</label><input id="slugInput" placeholder="My Awesome Page Title"></div>
        <div><label>Domain URL</label><input id="domainInput" value="https://example.com"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="slugBtn">🔗 Generate Slug</button>
        <button class="btn btn-secondary" type="button" id="robotsBtn">🤖 Generate robots.txt</button>
        <button class="btn btn-secondary" type="button" id="sitemapBtn">🗺️ Generate sitemap.xml</button>
        <button class="btn btn-secondary" type="button" id="helperDownloadBtn">⬇️ TXT</button>
      </div>
      <div><label>Output</label><textarea id="seoHelperRes" class="result" rows="8" placeholder="Generated content will appear here..."></textarea></div>
    `);

    helpersCard.querySelector("#slugBtn").onclick = () => {
      const slug = slugify(helpersCard.querySelector("#slugInput").value || "");
      helpersCard.querySelector("#seoHelperRes").value = slug;
      pushHistory("URL Slug", slug, renderHistory);
    };
    
    helpersCard.querySelector("#robotsBtn").onclick = () => {
      const domain = (helpersCard.querySelector("#domainInput").value || "https://example.com").replace(/\/+$/, "");
      const out = `# robots.txt for ${domain}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: ${domain}/sitemap.xml

# Crawl delay (optional - uncomment if needed)
# Crawl-delay: 1

# Block specific bots (optional)
# User-agent: AhrefsBot
# Disallow: /`;
      
      helpersCard.querySelector("#seoHelperRes").value = out;
      pushHistory("robots.txt", domain, renderHistory);
    };
    
    helpersCard.querySelector("#sitemapBtn").onclick = () => {
      const domain = (helpersCard.querySelector("#domainInput").value || "https://example.com").replace(/\/+$/, "");
      const out = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${domain}/services</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
      
      helpersCard.querySelector("#seoHelperRes").value = out;
      pushHistory("sitemap.xml", domain, renderHistory);
    };
    helpersCard.querySelector("#helperDownloadBtn").onclick = () => downloadTextFile("seo-helper-output.txt", helpersCard.querySelector("#seoHelperRes").value);

    // ============================================
    // URL PARITY CHECKER CARD
    // ============================================
    const auditCard = makeCard("audit", "🔍", "SEO URL Parity Checker", `
      <div class="grid-2">
        <div><label>Canonical URL</label><input id="seoCanonicalCheck" placeholder="https://example.com/page"></div>
        <div><label>OG URL (og:url)</label><input id="seoOgCheck" placeholder="https://example.com/page"></div>
        <div><label>JSON-LD URL/@id</label><input id="seoJsonCheck" placeholder="https://example.com/page"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="seoAuditBtn">✅ Check Parity</button>
        <button class="btn btn-secondary" type="button" id="seoAuditCopy">📋 Copy</button>
      </div>
      <div id="seoAuditRes" class="result">URL parity status will appear here.</div>
    `);

    auditCard.querySelector("#seoAuditBtn").onclick = () => {
      const canonical = (auditCard.querySelector("#seoCanonicalCheck").value || "").trim();
      const ogUrl = (auditCard.querySelector("#seoOgCheck").value || "").trim();
      const jsonUrl = (auditCard.querySelector("#seoJsonCheck").value || "").trim();
      
      if (!canonical || !ogUrl || !jsonUrl) {
        auditCard.querySelector("#seoAuditRes").innerHTML = "⚠️ Please fill all three URL fields.";
        return;
      }
      
      const same = canonical === ogUrl && canonical === jsonUrl;
      
      if (same) {
        auditCard.querySelector("#seoAuditRes").innerHTML = "✅ PASS: canonical, og:url, and JSON-LD URL are identical.\n\n📌 This follows SEO best practices for URL consistency.";
      } else {
        const issues = [];
        if (canonical !== ogUrl) issues.push("- canonical ≠ og:url");
        if (canonical !== jsonUrl) issues.push("- canonical ≠ JSON-LD URL");
        auditCard.querySelector("#seoAuditRes").innerHTML = `❌ MISMATCH: Keep canonical, og:url, and JSON-LD URL exactly the same.\n\n${issues.join("\n")}`;
      }
      
      pushHistory("URL Parity", same ? "Pass" : "Mismatch", renderHistory);
    };
    auditCard.querySelector("#seoAuditCopy").onclick = () => copyText(auditCard.querySelector("#seoAuditRes").innerText);

    function escAttr(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }

    // ============================================
    // ROBOTS.TXT BUILDER
    // ============================================
    const botCard = makeCard("robots", "🤖", "robots.txt Builder", `
      <div><label>Site origin</label><input type="url" id="rbHost" placeholder="https://example.com"></div>
      <div><label>Disallow paths (one per line)</label><textarea id="rbDis" rows="3" placeholder="/admin/"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="rbBtn">Generate</button>
        <button class="btn btn-secondary" type="button" id="rbCopy">Copy</button>
      </div>
      <textarea id="rbOut" class="result" rows="8" readonly></textarea>
    `);
    botCard.querySelector("#rbBtn").onclick = () => {
      const host = (botCard.querySelector("#rbHost").value || "https://example.com").replace(/\/$/, "");
      const lines = botCard.querySelector("#rbDis").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const body = ["User-agent: *"];
      if (lines.length) body.push(...lines.map((p) => `Disallow: ${p.startsWith("/") ? p : `/${p}`}`));
      else body.push("Disallow:");
      body.push("", `Sitemap: ${host}/sitemap.xml`);
      botCard.querySelector("#rbOut").value = body.join("\n");
    };
    botCard.querySelector("#rbCopy").onclick = () => copyText(botCard.querySelector("#rbOut").value);

    // ============================================
    // TITLE & DESCRIPTION LENGTH
    // ============================================
    const lenCard = makeCard("seolen", "📏", "Title & Meta Length", `
      <div><label>Page title</label><input type="text" id="lnTitle"></div>
      <div><label>Meta description</label><textarea id="lnDesc" rows="2"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="lnBtn">Analyze</button>
      </div>
      <div id="lnOut" class="result"></div>
    `);
    lenCard.querySelector("#lnBtn").onclick = () => {
      const t = lenCard.querySelector("#lnTitle").value;
      const d = lenCard.querySelector("#lnDesc").value;
      const tp = t.length <= 60 ? "✅" : "⚠️";
      const dp = d.length >= 120 && d.length <= 160 ? "✅" : "⚠️";
      lenCard.querySelector("#lnOut").innerHTML = `${tp} Title: ${t.length} chars (aim ~50–60)<br>${dp} Description: ${d.length} chars (aim ~120–160)`;
    };

    // ============================================
    // OPEN GRAPH QUICK PACK
    // ============================================
    const ogCard = makeCard("ogpack", "🔗", "Open Graph Quick Tags", `
      <div class="grid-2">
        <div><label>og:title</label><input type="text" id="ogT"></div>
        <div><label>og:url</label><input type="url" id="ogU"></div>
      </div>
      <div><label>og:description</label><textarea id="ogD" rows="2"></textarea></div>
      <div><label>og:image URL</label><input type="url" id="ogI"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="ogBtn">Build</button>
        <button class="btn btn-secondary" type="button" id="ogCopy">Copy</button>
      </div>
      <textarea id="ogOut" class="result" rows="8" readonly></textarea>
    `);
    ogCard.querySelector("#ogBtn").onclick = () => {
      ogCard.querySelector("#ogOut").value = [
        `<meta property="og:title" content="${escAttr(ogCard.querySelector("#ogT").value)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:url" content="${escAttr(ogCard.querySelector("#ogU").value)}" />`,
        `<meta property="og:description" content="${escAttr(ogCard.querySelector("#ogD").value)}" />`,
        `<meta property="og:image" content="${escAttr(ogCard.querySelector("#ogI").value)}" />`
      ].join("\n");
    };
    ogCard.querySelector("#ogCopy").onclick = () => copyText(ogCard.querySelector("#ogOut").value);

    // ============================================
    // FAQ SCHEMA SKELETON
    // ============================================
    const faqCard = makeCard("faqschema", "❓", "FAQ JSON-LD Skeleton", `
      <div><label>Q1</label><input type="text" id="fq1"></div>
      <div><label>A1</label><textarea id="fa1" rows="2"></textarea></div>
      <div><label>Q2</label><input type="text" id="fq2"></div>
      <div><label>A2</label><textarea id="fa2" rows="2"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="fqBtn">Build JSON-LD</button>
        <button class="btn btn-secondary" type="button" id="fqCopy">Copy</button>
      </div>
      <textarea id="fqOut" class="result" rows="12" readonly></textarea>
    `);
    faqCard.querySelector("#fqBtn").onclick = () => {
      const items = [
        { q: faqCard.querySelector("#fq1").value.trim(), a: faqCard.querySelector("#fa1").value.trim() },
        { q: faqCard.querySelector("#fq2").value.trim(), a: faqCard.querySelector("#fa2").value.trim() }
      ].filter((x) => x.q && x.a);
      const mainEntity = items.map((x) => ({
        "@type": "Question",
        name: x.q,
        acceptedAnswer: { "@type": "Answer", text: x.a }
      }));
      const obj = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity };
      faqCard.querySelector("#fqOut").value = JSON.stringify(obj, null, 2);
    };
    faqCard.querySelector("#fqCopy").onclick = () => copyText(faqCard.querySelector("#fqOut").value);

    // ============================================
    // KEYWORD DENSITY (simple)
    // ============================================
    const keyCard = makeCard("keydens", "🔑", "Keyword Density", `
      <div><label>Text</label><textarea id="kdTxt" rows="4"></textarea></div>
      <div><label>Keyword (phrase)</label><input type="text" id="kdKey"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="kdBtn">Analyze</button>
      </div>
      <div id="kdOut" class="result"></div>
    `);
    keyCard.querySelector("#kdBtn").onclick = () => {
      const text = keyCard.querySelector("#kdTxt").value.toLowerCase();
      const key = keyCard.querySelector("#kdKey").value.toLowerCase().trim();
      if (!text || !key) return;
      const words = text.match(/\b[\w']+\b/g) || [];
      const wc = words.length || 1;
      let hits = 0;
      if (key.includes(" ")) {
        for (let i = 0; i <= text.length - key.length; i++) if (text.slice(i, i + key.length) === key) hits++;
      } else hits = words.filter((w) => w === key).length;
      keyCard.querySelector("#kdOut").textContent = `"${key}" ≈ ${((hits / wc) * 100).toFixed(2)}% of tokens (${hits} hits / ${wc} words)`;
    };

    // ============================================
    // CANONICAL + HREFLANG NOTE
    // ============================================
    const hrefCard = makeCard("hreflang", "🌐", "Hreflang Link Template", `
      <div><label>URLs per locale (locale=url per line, e.g. en=https://ex.com/)</label><textarea id="hfIn" rows="4" placeholder="en=https://example.com/&#10;hi=https://example.com/hi/"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="hfBtn">Build link tags</button>
        <button class="btn btn-secondary" type="button" id="hfCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="hfDownload">⬇️ TXT</button>
      </div>
      <textarea id="hfOut" class="result" rows="6" readonly></textarea>
    `);
    hrefCard.querySelector("#hfBtn").onclick = () => {
      const rows = hrefCard.querySelector("#hfIn").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const tags = rows.map((row) => {
        const i = row.indexOf("=");
        if (i < 1) return "";
        const loc = row.slice(0, i).trim();
        const url = row.slice(i + 1).trim();
        return `<link rel="alternate" hreflang="${escAttr(loc)}" href="${escAttr(url)}" />`;
      }).filter(Boolean);
      hrefCard.querySelector("#hfOut").value = tags.join("\n");
    };
    hrefCard.querySelector("#hfCopy").onclick = () => copyText(hrefCard.querySelector("#hfOut").value);
    hrefCard.querySelector("#hfDownload").onclick = () => downloadTextFile("hreflang-tags.txt", hrefCard.querySelector("#hfOut").value);

    // ============================================
    // SERP SNIPPET PREVIEW
    // ============================================
    const serpCard = makeCard("serp", "🧪", "SERP Snippet Preview", `
      <div class="grid-2">
        <div><label>Locale</label><select id="serpLocale"><option value="en-US">US English</option><option value="en-IN">India English</option><option value="en-GB">UK English</option><option value="de-DE">German</option><option value="fr-FR">French</option><option value="pt-BR">Brazilian Portuguese</option></select></div>
        <div><label>URL</label><input id="serpUrl" placeholder="https://example.com/page"></div>
      </div>
      <div><label>Title</label><input id="serpTitle" placeholder="SEO title for search results"></div>
      <div><label>Description</label><textarea id="serpDesc" rows="3" placeholder="Meta description preview text"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="serpBtn">Generate Preview</button>
        <button class="btn btn-secondary" type="button" id="serpCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="serpDownload">⬇️ TXT</button>
      </div>
      <textarea id="serpOut" class="result" rows="8" placeholder="SERP preview output..."></textarea>
    `);
    serpCard.querySelector("#serpBtn").onclick = () => {
      const locale = serpCard.querySelector("#serpLocale").value || "en-US";
      const title = (serpCard.querySelector("#serpTitle").value || "").trim();
      const desc = (serpCard.querySelector("#serpDesc").value || "").trim();
      const url = (serpCard.querySelector("#serpUrl").value || "").trim();
      if (!title || !desc || !url) {
        serpCard.querySelector("#serpOut").value = "Please fill title, description, and URL.";
        return;
      }
      const titleLen = Array.from(title).length;
      const descLen = Array.from(desc).length;
      const titleFlag = titleLen <= 60 ? "OK" : "Too long";
      const descFlag = descLen <= 160 ? "OK" : "Too long";
      const dateText = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date());
      const out = [
        `SERP PREVIEW (${locale}) - ${dateText}`,
        "----------------------------------------",
        title,
        url,
        desc,
        "",
        `Title length: ${titleLen} (${titleFlag})`,
        `Description length: ${descLen} (${descFlag})`
      ].join("\n");
      serpCard.querySelector("#serpOut").value = out;
      pushHistory("SERP Preview", `${locale} / ${titleLen}c`, renderHistory);
    };
    serpCard.querySelector("#serpCopy").onclick = () => copyText(serpCard.querySelector("#serpOut").value);
    serpCard.querySelector("#serpDownload").onclick = () => downloadTextFile("serp-preview.txt", serpCard.querySelector("#serpOut").value);

    // ============================================
    // INTERNATIONAL KEYWORD CLUSTER
    // ============================================
    const clusterCard = makeCard("cluster", "🌏", "International Keyword Cluster", `
      <div class="grid-2">
        <div><label>Seed Keyword</label><input id="clSeed" placeholder="best running shoes"></div>
        <div><label>Country Preset</label><select id="clCountry"><option value="us">United States</option><option value="in">India</option><option value="uk">United Kingdom</option><option value="de">Germany</option><option value="fr">France</option><option value="br">Brazil</option></select></div>
      </div>
      <div><label>Intent Mix</label><select id="clIntent"><option value="balanced">Balanced</option><option value="transactional">Transactional</option><option value="informational">Informational</option><option value="navigational">Navigational</option></select></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="clBtn">Build Cluster</button>
        <button class="btn btn-secondary" type="button" id="clCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="clDownload">⬇️ TXT</button>
      </div>
      <textarea id="clOut" class="result" rows="9" placeholder="Keyword cluster output..."></textarea>
    `);
    clusterCard.querySelector("#clBtn").onclick = () => {
      const seed = (clusterCard.querySelector("#clSeed").value || "").trim();
      const country = clusterCard.querySelector("#clCountry").value || "us";
      const intent = clusterCard.querySelector("#clIntent").value || "balanced";
      if (!seed) {
        clusterCard.querySelector("#clOut").value = "Please enter a seed keyword.";
        return;
      }
      const geoMap = {
        us: ["near me", "usa", "for americans"],
        in: ["india", "near me india", "best price india"],
        uk: ["uk", "london", "britain"],
        de: ["germany", "de", "in berlin"],
        fr: ["france", "paris", "fr"],
        br: ["brazil", "sao paulo", "br"]
      };
      const intentPhrases = {
        transactional: ["buy", "pricing", "discount", "best deal"],
        informational: ["guide", "how to", "tips", "comparison"],
        navigational: ["official", "brand", "website", "login"],
        balanced: ["best", "guide", "pricing", "near me"]
      };
      const geo = geoMap[country] || geoMap.us;
      const intentList = intentPhrases[intent] || intentPhrases.balanced;
      const suggestions = [
        ...intentList.map((w) => `${w} ${seed}`),
        ...geo.map((w) => `${seed} ${w}`),
        `${seed} alternatives`,
        `${seed} reviews`
      ];
      const unique = Array.from(new Set(suggestions));
      clusterCard.querySelector("#clOut").value = [
        `Country: ${country.toUpperCase()} | Intent: ${intent}`,
        "----------------------------------------",
        ...unique.map((s, i) => `${i + 1}. ${s}`)
      ].join("\n");
      pushHistory("Keyword Cluster", `${seed} (${country})`, renderHistory);
    };
    clusterCard.querySelector("#clCopy").onclick = () => copyText(clusterCard.querySelector("#clOut").value);
    clusterCard.querySelector("#clDownload").onclick = () => downloadTextFile("international-keyword-cluster.txt", clusterCard.querySelector("#clOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent SEO Outputs", `
      <div id="seoHistory" class="chip-list"><span class="empty-hint">No SEO outputs yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" type="button" id="clearSeoHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearSeoHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "seo-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "seo-focus-host";
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
      document.body.classList.add("seo-modal-open");
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
      document.body.classList.remove("seo-modal-open");
    }

    grid.querySelectorAll(".seo-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".seo-card")));
    });
    
    grid.querySelectorAll(".seo-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".seo-card[data-focusable='true'] .seo-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".seo-card"));
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
  window.QwicktonCategoryInits["seo-tools"] = initSeoTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initSeoTools(null);
    }
  });
})();