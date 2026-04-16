/**
 * FONT TOOLS - Complete JavaScript
 * Tools: Fancy Text Generator, Text Utilities, Font Pairing Suggestions
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
  function localeOptions() {
    const locales = [
      { code: "en-US", label: "English (US)" },
      { code: "en-IN", label: "English (India)" },
      { code: "hi-IN", label: "Hindi (India)" },
      { code: "ar-SA", label: "Arabic (Saudi)" },
      { code: "ja-JP", label: "Japanese (Japan)" },
      { code: "ko-KR", label: "Korean (Korea)" },
      { code: "th-TH", label: "Thai (Thailand)" },
      { code: "de-DE", label: "German (Germany)" },
      { code: "fr-FR", label: "French (France)" },
      { code: "pt-BR", label: "Portuguese (Brazil)" }
    ];
    return locales.map((item) => `<option value="${item.code}">${item.label}</option>`).join("");
  }

  // Fancy text transformations
  function toBubble(input) {
    return input.split("").map(ch => {
      const code = ch.toLowerCase().charCodeAt(0);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x24d0 + (code - 97));
      return ch;
    }).join("");
  }

  function toFullWidth(input) {
    return input.split("").map(ch => {
      const code = ch.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCharCode(code + 65248);
      return ch;
    }).join("");
  }

  function toSmallCapsLike(input) {
    const map = {
      a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
      j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
      s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
    };
    return input.toLowerCase().split("").map(ch => map[ch] || ch).join("");
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-font-history";
  
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
  function initFontTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.fontToolsInitialized === "true") return;
    grid.dataset.fontToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "font-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="font-card-header">
          <div class="font-card-icon">${icon}</div>
          <h3 class="font-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary font-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary font-focus-inline-close" type="button" data-focus-close>Close</button>
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
      const historyContainer = historyCardEl.querySelector("#fontHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No font outputs yet.</span>';
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
    // FANCY FONT STUDIO CARD
    // ============================================
    const fancyCard = makeCard("fancy", "✨", "Fancy Font Studio Pro", `
      <div><label>Your Text</label><textarea id="fontInput" placeholder="Enter any text to transform..."></textarea></div>
      <div class="grid-2">
        <div><label>Prefix (optional)</label><input id="fontPrefix" type="text" placeholder="✨ "></div>
        <div><label>Suffix (optional)</label><input id="fontSuffix" type="text" placeholder=" ✨"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="fontBtn">🎨 Generate Styles</button>
        <button class="btn btn-secondary" type="button" id="fontCopyBtn">📋 Copy Output</button>
        <button class="btn btn-secondary" type="button" id="fontDownloadBtn">⬇️ TXT</button>
      </div>
      <div><label>Generated Styles</label><textarea id="fontRes" class="result" placeholder="Multiple text styles will appear here..."></textarea></div>
    `);

    fancyCard.querySelector("#fontBtn").onclick = () => {
      const raw = fancyCard.querySelector("#fontInput").value || "";
      if (!raw.trim()) {
        fancyCard.querySelector("#fontRes").value = "⚠️ Please enter some text first";
        return;
      }
      const prefix = fancyCard.querySelector("#fontPrefix").value || "";
      const suffix = fancyCard.querySelector("#fontSuffix").value || "";
      const input = `${prefix}${raw}${suffix}`;
      
      const out = [
        "📝 NORMAL",
        input,
        "",
        "🔠 UPPERCASE",
        input.toUpperCase(),
        "",
        "🔡 lowercase",
        input.toLowerCase(),
        "",
        "📖 Title Case",
        input.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()),
        "",
        "🫧 Bubble Text",
        toBubble(input),
        "",
        "📏 Full-width",
        toFullWidth(input),
        "",
        "🔤 Small Caps",
        toSmallCapsLike(input)
      ].join("\n");
      
      fancyCard.querySelector("#fontRes").value = out;
      pushHistory("Fancy Font", raw.slice(0, 50), renderHistory);
    };
    
    fancyCard.querySelector("#fontCopyBtn").onclick = () => copyText(fancyCard.querySelector("#fontRes").value);
    fancyCard.querySelector("#fontDownloadBtn").onclick = () => downloadTextFile("fancy-font-output.txt", fancyCard.querySelector("#fontRes").value);

    // ============================================
    // TEXT UTILITIES CARD
    // ============================================
    const utilsCard = makeCard("utils", "⚙️", "Text Style Utilities", `
      <div><label>Input Text</label><textarea id="styleInput" placeholder="Type or paste text here..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="spaceBtn">🔤 Add Spacing</button>
        <button class="btn btn-secondary" type="button" id="removeSpaceBtn">🗑️ Remove Spaces</button>
        <button class="btn btn-secondary" type="button" id="altCaseBtn">🔄 Alt Case</button>
        <button class="btn btn-secondary" type="button" id="mirrorBtn">🪞 Mirror</button>
        <button class="btn btn-secondary" type="button" id="utilsDownloadBtn">⬇️ TXT</button>
      </div>
      <div><label>Transformed Output</label><textarea id="styleRes" class="result" placeholder="Transformed text will appear here..."></textarea></div>
    `);

    utilsCard.querySelector("#spaceBtn").onclick = () => {
      const text = utilsCard.querySelector("#styleInput").value;
      const out = text.split("").join(" ");
      utilsCard.querySelector("#styleRes").value = out;
      pushHistory("Add Spacing", out.slice(0, 50), renderHistory);
    };
    
    utilsCard.querySelector("#removeSpaceBtn").onclick = () => {
      const text = utilsCard.querySelector("#styleInput").value;
      const out = text.replace(/\s+/g, "");
      utilsCard.querySelector("#styleRes").value = out;
      pushHistory("Remove Spaces", out.slice(0, 50), renderHistory);
    };
    
    utilsCard.querySelector("#altCaseBtn").onclick = () => {
      const text = utilsCard.querySelector("#styleInput").value;
      const out = text.split("").map((ch, i) => i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()).join("");
      utilsCard.querySelector("#styleRes").value = out;
      pushHistory("Alt Case", out.slice(0, 50), renderHistory);
    };
    
    utilsCard.querySelector("#mirrorBtn").onclick = () => {
      const text = utilsCard.querySelector("#styleInput").value;
      const out = text.split("").reverse().join("");
      utilsCard.querySelector("#styleRes").value = out;
      pushHistory("Mirror", out.slice(0, 50), renderHistory);
    };
    utilsCard.querySelector("#utilsDownloadBtn").onclick = () => downloadTextFile("text-utilities-output.txt", utilsCard.querySelector("#styleRes").value);

    // ============================================
    // FONT PAIRINGS CARD
    // ============================================
    const pairingsCard = makeCard("pairings", "🎨", "Typography Pairing Suggestions", `
      <div><label>Design Mood</label><input id="pairMood" placeholder="modern, elegant, playful, bold, minimal" value="modern"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="pairBuildBtn">✨ Suggest Pairs</button>
        <button class="btn btn-secondary" type="button" id="pairCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="pairDownloadBtn">⬇️ TXT</button>
      </div>
      <div><label>Font Pairing Suggestions</label><textarea id="pairOutput" class="result" placeholder="Font pairing suggestions will appear here..."></textarea></div>
    `);

    pairingsCard.querySelector("#pairBuildBtn").onclick = () => {
      const mood = (pairingsCard.querySelector("#pairMood").value || "modern").trim().toLowerCase();
      
      const pairings = {
        modern: [
          "Inter + Syne → Clean, geometric, perfect for tech and startups",
          "Manrope + Space Grotesk → Modern, friendly, great for SaaS",
          "DM Sans + Syne → Professional with creative touch",
          "Plus Jakarta Sans + Inter → Ultra-modern, minimal"
        ],
        elegant: [
          "Playfair Display + Source Sans 3 → Classic editorial elegance",
          "Cormorant + Inter → Luxury brand aesthetic",
          "Libre Baskerville + Lato → Timeless and refined",
          "Marcellus + DM Sans → Sophisticated and balanced"
        ],
        playful: [
          "Baloo 2 + Nunito → Fun, rounded, child-friendly",
          "Fredoka + DM Sans → Playful yet readable",
          "Poppins + Quicksand → Modern playful vibe",
          "Comfortaa + Nunito → Soft and approachable"
        ],
        bold: [
          "Montserrat + Open Sans → Strong, confident, versatile",
          "Bebas Neue + Roboto → Bold headlines, clean body",
          "Oswald + Source Sans → Powerful and authoritative",
          "Anton + Lato → Maximum impact"
        ],
        minimal: [
          "Helvetica Neue + Inter → Ultra-clean Swiss style",
          "SF Pro + Roboto → Apple-inspired minimalism",
          "Univers + Open Sans → Professional minimal",
          "Futura + DM Sans → Geometric minimal"
        ]
      };
      
      const selected = pairings[mood] || pairings.modern;
      const out = [
        `🎨 DESIGN MOOD: ${mood.toUpperCase()}`,
        "=".repeat(40),
        ...selected.map((pair, i) => `${i + 1}. ${pair}`),
        "",
        "💡 TIP: Combine heading font (first) with body font (second)",
        "🔗 All fonts available on Google Fonts"
      ].join("\n");
      
      pairingsCard.querySelector("#pairOutput").value = out;
      pushHistory("Font Pairing", mood, renderHistory);
    };
    
    pairingsCard.querySelector("#pairCopyBtn").onclick = () => copyText(pairingsCard.querySelector("#pairOutput").value);
    pairingsCard.querySelector("#pairDownloadBtn").onclick = () => downloadTextFile("font-pairings.txt", pairingsCard.querySelector("#pairOutput").value);

    // ============================================
    // FULLWIDTH TEXT
    // ============================================
    const fwCard = makeCard("fullwidth", "↔️", "Fullwidth Text", `
      <div><label>Input</label><input type="text" id="fwIn" placeholder="Hello"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="fwBtn">Convert</button>
        <button class="btn btn-secondary" type="button" id="fwCopy">Copy</button>
      </div>
      <div id="fwOut" class="result" style="font-size:1.1rem">—</div>
    `);
    const FW_MAP = (() => {
      const o = {};
      for (let i = 0; i < 26; i++) {
        o[String.fromCharCode(65 + i)] = String.fromCodePoint(0xff21 + i);
        o[String.fromCharCode(97 + i)] = String.fromCodePoint(0xff41 + i);
      }
      for (let d = 0; d < 10; d++) o[String(d)] = String.fromCodePoint(0xff10 + d);
      o[" "] = "\u3000";
      return o;
    })();
    fwCard.querySelector("#fwBtn").onclick = () => {
      const s = fwCard.querySelector("#fwIn").value;
      fwCard.querySelector("#fwOut").textContent = [...s].map((ch) => FW_MAP[ch] || ch).join("");
    };
    fwCard.querySelector("#fwCopy").onclick = () => copyText(fwCard.querySelector("#fwOut").textContent);

    // ============================================
    // REVERSE & MIRROR
    // ============================================
    const revCard = makeCard("reverse", "🔃", "Reverse Text", `
      <div><label>Input</label><textarea id="rvIn" rows="2"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="rvBtn">Reverse</button>
        <button class="btn btn-secondary" type="button" id="rvCopy">Copy</button>
      </div>
      <div id="rvOut" class="result"></div>
    `);
    revCard.querySelector("#rvBtn").onclick = () => {
      const t = revCard.querySelector("#rvIn").value;
      revCard.querySelector("#rvOut").textContent = [...t].reverse().join("");
    };
    revCard.querySelector("#rvCopy").onclick = () => copyText(revCard.querySelector("#rvOut").textContent);

    // ============================================
    // STRIKETHROUGH (unicode combining)
    // ============================================
    const strikeCard = makeCard("strike", "🚫", "Strikethrough Style", `
      <div><label>Input</label><input type="text" id="stIn"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="stBtn">Apply ̶s̶t̶r̶i̶k̶e̶</button>
        <button class="btn btn-secondary" type="button" id="stCopy">Copy</button>
      </div>
      <div id="stOut" class="result"></div>
    `);
    strikeCard.querySelector("#stBtn").onclick = () => {
      const COMB = "\u0336";
      strikeCard.querySelector("#stOut").textContent = [...strikeCard.querySelector("#stIn").value].join(COMB) + COMB;
    };
    strikeCard.querySelector("#stCopy").onclick = () => copyText(strikeCard.querySelector("#stOut").textContent);

    // ============================================
    // SMALL CAPS UNICODE (subset)
    // ============================================
    const scCard = makeCard("smallcaps", "🔡", "Small Caps (Unicode)", `
      <div><label>Letters A–Z only (others unchanged)</label><input type="text" id="scIn" placeholder="Design"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="scBtn">Convert</button>
        <button class="btn btn-secondary" type="button" id="scCopy">Copy</button>
      </div>
      <div id="scOut" class="result"></div>
    `);
    const SCMAP = { a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"ꜱ",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ" };
    scCard.querySelector("#scBtn").onclick = () => {
      const t = scCard.querySelector("#scIn").value;
      scCard.querySelector("#scOut").textContent = [...t.toLowerCase()].map((c) => SCMAP[c] || c).join("");
    };
    scCard.querySelector("#scCopy").onclick = () => copyText(scCard.querySelector("#scOut").textContent);

    // ============================================
    // MORSE CODE
    // ============================================
    const morseCard = makeCard("morse", "📡", "Morse Code", `
      <div><label>Text (A–Z 0–9 space)</label><input type="text" id="mrIn" placeholder="SOS"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="mrEnc">To Morse</button>
        <button class="btn btn-secondary" type="button" id="mrCopy">Copy</button>
      </div>
      <div id="mrOut" class="result" style="font-family:var(--font-body,monospace)"></div>
    `);
    const MORSE = { A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
      "0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----." };
    morseCard.querySelector("#mrEnc").onclick = () => {
      const t = morseCard.querySelector("#mrIn").value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
      morseCard.querySelector("#mrOut").textContent = t.split("").map((c) => c === " " ? "/" : MORSE[c] || "").filter(Boolean).join(" ");
    };
    morseCard.querySelector("#mrCopy").onclick = () => copyText(morseCard.querySelector("#mrOut").textContent);

    // ============================================
    // FONT STACK CSS
    // ============================================
    const stackCard = makeCard("stack", "🧱", "CSS Font Stack Builder", `
      <div><label>Primary font</label><input type="text" id="stk1" value="Inter"></div>
      <div><label>Fallbacks (comma)</label><input type="text" id="stk2" value="system-ui, sans-serif"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="stkBtn">Build</button>
        <button class="btn btn-secondary" type="button" id="stkCopy">Copy CSS</button>
      </div>
      <textarea id="stkOut" class="result" rows="2" readonly></textarea>
    `);
    stackCard.querySelector("#stkBtn").onclick = () => {
      const a = stackCard.querySelector("#stk1").value.trim() || "sans-serif";
      const rest = stackCard.querySelector("#stk2").value.split(",").map((s) => s.trim()).filter(Boolean);
      const parts = [a.includes(" ") ? `"${a}"` : a, ...rest.map((x) => (x.includes(" ") ? `"${x}"` : x))];
      stackCard.querySelector("#stkOut").value = `font-family: ${parts.join(", ")};`;
    };
    stackCard.querySelector("#stkCopy").onclick = () => copyText(stackCard.querySelector("#stkOut").value);

    // ============================================
    // MULTILINGUAL TYPOGRAPHY PREVIEW
    // ============================================
    const localeCard = makeCard("locale", "🌍", "Multilingual Typography Preview", `
      <div><label>Sample Text</label><textarea id="locText" rows="3" placeholder="Type sample text...">Typography matters for every language.</textarea></div>
      <div class="grid-2">
        <div><label>Locale/Country</label><select id="locLocale">${localeOptions()}</select></div>
        <div><label>Date Style</label><select id="locDateStyle"><option value="short">Short</option><option value="medium" selected>Medium</option><option value="long">Long</option></select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="locBtn">Generate Local Preview</button>
        <button class="btn btn-secondary" type="button" id="locCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="locDownload">⬇️ TXT</button>
      </div>
      <textarea id="locOut" class="result" rows="6" placeholder="Localized preview output..."></textarea>
    `);
    localeCard.querySelector("#locBtn").onclick = () => {
      const input = localeCard.querySelector("#locText").value.trim();
      if (!input) {
        localeCard.querySelector("#locOut").value = "Please enter sample text.";
        return;
      }
      const locale = localeCard.querySelector("#locLocale").value || "en-US";
      const dateStyle = localeCard.querySelector("#locDateStyle").value || "medium";
      const dateText = new Intl.DateTimeFormat(locale, { dateStyle, timeStyle: "short" }).format(new Date());
      const words = (input.match(/\S+/g) || []).length;
      const chars = Array.from(input).length;
      const out = [
        `Locale: ${locale}`,
        `Current localized date/time: ${dateText}`,
        `Characters: ${chars} | Words: ${words}`,
        "----------------------------------------",
        input
      ].join("\n");
      localeCard.querySelector("#locOut").value = out;
      pushHistory("Locale Preview", `${locale} (${chars} chars)`, renderHistory);
    };
    localeCard.querySelector("#locCopy").onclick = () => copyText(localeCard.querySelector("#locOut").value);
    localeCard.querySelector("#locDownload").onclick = () => downloadTextFile("multilingual-typography-preview.txt", localeCard.querySelector("#locOut").value);

    // ============================================
    // FONT READABILITY SCORE
    // ============================================
    const readabilityCard = makeCard("readability", "📊", "Font Readability Scorer", `
      <div><label>Body Text Sample</label><textarea id="rdText" rows="4" placeholder="Paste paragraph to estimate readability and typography settings..."></textarea></div>
      <div class="grid-2">
        <div><label>Font Size (px)</label><input id="rdSize" type="number" min="10" max="42" value="16"></div>
        <div><label>Line Height</label><input id="rdLine" type="number" min="1" max="2.4" step="0.05" value="1.6"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="rdBtn">Analyze Readability</button>
        <button class="btn btn-secondary" type="button" id="rdCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="rdDownload">⬇️ TXT</button>
      </div>
      <textarea id="rdOut" class="result" rows="7" placeholder="Readability analysis..."></textarea>
    `);
    readabilityCard.querySelector("#rdBtn").onclick = () => {
      const text = readabilityCard.querySelector("#rdText").value.trim();
      if (!text) {
        readabilityCard.querySelector("#rdOut").value = "Please paste some body text for analysis.";
        return;
      }
      const fontSize = Number(readabilityCard.querySelector("#rdSize").value) || 16;
      const lineHeight = Number(readabilityCard.querySelector("#rdLine").value) || 1.6;
      const words = (text.match(/\S+/g) || []).length;
      const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
      const chars = Array.from(text).length;
      const avgWord = chars / Math.max(1, words);
      const wordsPerSentence = words / sentences;
      let score = 100;
      if (fontSize < 14) score -= 20;
      if (fontSize > 24) score -= 8;
      if (lineHeight < 1.35 || lineHeight > 1.95) score -= 14;
      if (avgWord > 6.4) score -= 12;
      if (wordsPerSentence > 22) score -= 12;
      score = Math.max(20, Math.round(score));
      const verdict = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Needs improvement" : "Hard to read";
      const out = [
        `Readability Score: ${score}/100 (${verdict})`,
        `Font settings: ${fontSize}px / ${lineHeight}`,
        `Words: ${words} | Sentences: ${sentences}`,
        `Avg word length: ${avgWord.toFixed(2)} | Words/sentence: ${wordsPerSentence.toFixed(2)}`,
        "----------------------------------------",
        "Tip: Keep body text around 15-18px and line-height 1.45-1.8 for web."
      ].join("\n");
      readabilityCard.querySelector("#rdOut").value = out;
      pushHistory("Readability", `${score}/100`, renderHistory);
    };
    readabilityCard.querySelector("#rdCopy").onclick = () => copyText(readabilityCard.querySelector("#rdOut").value);
    readabilityCard.querySelector("#rdDownload").onclick = () => downloadTextFile("font-readability-score.txt", readabilityCard.querySelector("#rdOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Font Outputs", `
      <div id="fontHistory" class="chip-list"><span class="empty-hint">No font outputs yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" type="button" id="clearFontHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearFontHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "font-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "font-focus-host";
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
      document.body.classList.add("font-modal-open");
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
      document.body.classList.remove("font-modal-open");
    }

    grid.querySelectorAll(".font-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".font-card")));
    });
    
    grid.querySelectorAll(".font-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".font-card[data-focusable='true'] .font-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".font-card"));
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
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const localeSelect = document.getElementById("locLocale");
    if (localeSelect && Array.from(localeSelect.options).some((opt) => opt.value === browserLocale)) {
      localeSelect.value = browserLocale;
    }
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["font-tools"] = initFontTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initFontTools(null);
    }
  });
})();