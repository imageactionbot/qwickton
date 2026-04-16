(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-text-tools-history-v2";
  const SAMPLE_TEXT =
    "Qwickton text tools help teams clean, compare, and transform writing faster. These tools are designed for writers, editors, and developers who need quick text processing capabilities.";

  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
  }
  function setStatus(node, text, isError = false) {
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("text-msg-error", !!isError);
    node.setAttribute("role", "status");
  }
  function copyText(text) {
    if (!text) return;
    navigator.clipboard?.writeText(String(text)).catch(() => {});
  }
  function downloadText(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function normalizeLines(text) {
    return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  function toSentenceCase(text) {
    return text
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 28)));
  }

  function initTextTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.textToolsInitialized === "true") return;
    grid.dataset.textToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "text-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="text-card-header"><div class="text-card-icon">${icon}</div><h3 class="text-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary text-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary text-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function pushHistory(label, value) {
      if (!value) return;
      writeHistory([{ label, value: String(value).slice(0, 220), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCardEl) return;
      const list = historyCardEl.querySelector("#textHistory");
      const items = readHistory();
      if (!items.length) {
        list.innerHTML = '<span class="empty-hint">No recent outputs yet.</span>';
        return;
      }
      list.innerHTML = items.map((it, idx) => `<button class="prompt-chip" data-i="${idx}"><strong>${esc(it.label)}:</strong> ${esc(it.value)}</button>`).join("");
      list.querySelectorAll("[data-i]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const i = Number(btn.getAttribute("data-i"));
          copyText(`${items[i]?.label}: ${items[i]?.value}`);
        });
      });
    }

    // 1) Word Counter
    const wordCard = makeCard(
      "word",
      "📊",
      "Word Counter Pro",
      `
      <p class="text-hint">Counts words, chars, unique words, reading/speaking time, and average word length.</p>
      <div><label>Text Input</label><textarea id="wcIn" rows="6" placeholder="Paste or type text..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="wcRun">Analyze</button><button class="btn btn-secondary" id="wcSample">Load Sample</button><button class="btn btn-secondary" id="wcClear">Clear</button><button class="btn btn-secondary" id="wcCopy">Copy Report</button><button class="btn btn-secondary" id="wcTxt">Download TXT</button></div>
      <textarea id="wcOut" class="result" rows="5" readonly></textarea>
    `
    );
    function runWordCounter() {
      const text = normalizeLines(wordCard.querySelector("#wcIn").value);
      const trimmed = text.trim();
      const words = trimmed ? trimmed.match(/\S+/g) || [] : [];
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, "").length;
      const sentences = trimmed ? Math.max(1, (trimmed.match(/[.!?]+/g) || []).length) : 0;
      const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
      const wordTokens = (trimmed.match(/[a-z0-9']+/gi) || []).map((w) => w.toLowerCase());
      const uniq = new Set(wordTokens).size;
      const avgWord = words.length ? (words.join("").length / words.length).toFixed(2) : "0.00";
      const readMin = words.length ? Math.max(1, Math.ceil(words.length / 220)) : 0;
      const speakMin = words.length ? Math.max(1, Math.ceil(words.length / 130)) : 0;
      const report = [
        `Words: ${words.length}`,
        `Characters: ${chars}`,
        `Characters (no spaces): ${charsNoSpaces}`,
        `Sentences: ${sentences}`,
        `Paragraphs: ${paragraphs}`,
        `Unique words: ${uniq}`,
        `Average word length: ${avgWord}`,
        `Reading time: ~${readMin} min`,
        `Speaking time: ~${speakMin} min`
      ].join("\n");
      wordCard.querySelector("#wcOut").value = report;
      pushHistory("Word count", `${words.length} words`);
    }
    wordCard.querySelector("#wcRun").addEventListener("click", runWordCounter);
    wordCard.querySelector("#wcSample").addEventListener("click", () => {
      wordCard.querySelector("#wcIn").value = SAMPLE_TEXT;
      runWordCounter();
    });
    wordCard.querySelector("#wcClear").addEventListener("click", () => {
      wordCard.querySelector("#wcIn").value = "";
      wordCard.querySelector("#wcOut").value = "";
    });
    wordCard.querySelector("#wcCopy").addEventListener("click", () => copyText(wordCard.querySelector("#wcOut").value));
    wordCard.querySelector("#wcTxt").addEventListener("click", () => downloadText("word-counter-report.txt", wordCard.querySelector("#wcOut").value));

    // 2) Case Converter
    const caseCard = makeCard(
      "case",
      "🔤",
      "Case Converter",
      `
      <div><label>Input</label><textarea id="ccIn" rows="4"></textarea></div>
      <div class="inline-row"><button class="btn btn-secondary" id="ccUpper">UPPER</button><button class="btn btn-secondary" id="ccLower">lower</button><button class="btn btn-secondary" id="ccTitle">Title</button><button class="btn btn-secondary" id="ccSentence">Sentence</button><button class="btn btn-secondary" id="ccInvert">Invert</button></div>
      <div><label>Output</label><textarea id="ccOut" rows="4" class="result"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="ccCopy">Copy Output</button><button class="btn btn-secondary" id="ccTxt">Download TXT</button></div>
    `
    );
    function applyCase(label, fn) {
      const out = fn(caseCard.querySelector("#ccIn").value || "");
      caseCard.querySelector("#ccOut").value = out;
      pushHistory(label, out.slice(0, 80));
    }
    caseCard.querySelector("#ccUpper").addEventListener("click", () => applyCase("UPPER", (v) => v.toUpperCase()));
    caseCard.querySelector("#ccLower").addEventListener("click", () => applyCase("lower", (v) => v.toLowerCase()));
    caseCard.querySelector("#ccTitle").addEventListener("click", () => applyCase("Title", (v) => v.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())));
    caseCard.querySelector("#ccSentence").addEventListener("click", () => applyCase("Sentence", toSentenceCase));
    caseCard.querySelector("#ccInvert").addEventListener("click", () =>
      applyCase("Invert", (v) =>
        v
          .split("")
          .map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()))
          .join("")
      )
    );
    caseCard.querySelector("#ccCopy").addEventListener("click", () => copyText(caseCard.querySelector("#ccOut").value));
    caseCard.querySelector("#ccTxt").addEventListener("click", () => downloadText("case-converted.txt", caseCard.querySelector("#ccOut").value));

    // 3) Cleaner
    const cleanCard = makeCard(
      "cleaner",
      "🧹",
      "Cleaner & Formatter",
      `
      <div><label>Input</label><textarea id="clIn" rows="5"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="clTrim">Trim Spaces</button><button class="btn btn-secondary" id="clJoin">Join Lines</button><button class="btn btn-secondary" id="clNorm">Normalize Lines</button><button class="btn btn-secondary" id="clSlug">Slugify</button><button class="btn btn-secondary" id="clSort">Sort Lines</button></div>
      <div><label>Output</label><textarea id="clOut" rows="5" class="result"></textarea></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clCopy">Copy</button><button class="btn btn-secondary" id="clTxt">Download TXT</button></div>
    `
    );
    function setClean(label, value) {
      cleanCard.querySelector("#clOut").value = value;
      pushHistory(label, value.slice(0, 80));
    }
    cleanCard.querySelector("#clTrim").addEventListener("click", () => setClean("Trim", normalizeLines(cleanCard.querySelector("#clIn").value).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()));
    cleanCard.querySelector("#clJoin").addEventListener("click", () => setClean("Join", normalizeLines(cleanCard.querySelector("#clIn").value).split("\n").map((l) => l.trim()).filter(Boolean).join(" ")));
    cleanCard.querySelector("#clNorm").addEventListener("click", () => setClean("Normalize", normalizeLines(cleanCard.querySelector("#clIn").value).replace(/[ \t]+\n/g, "\n").trim()));
    cleanCard.querySelector("#clSlug").addEventListener("click", () =>
      setClean(
        "Slugify",
        (cleanCard.querySelector("#clIn").value || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      )
    );
    cleanCard.querySelector("#clSort").addEventListener("click", () =>
      setClean(
        "Sort lines",
        normalizeLines(cleanCard.querySelector("#clIn").value)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
          .join("\n")
      )
    );
    cleanCard.querySelector("#clCopy").addEventListener("click", () => copyText(cleanCard.querySelector("#clOut").value));
    cleanCard.querySelector("#clTxt").addEventListener("click", () => downloadText("cleaned-text.txt", cleanCard.querySelector("#clOut").value));

    // 4) Compare
    const cmpCard = makeCard(
      "compare",
      "⚖️",
      "Text Compare",
      `
      <div class="grid-2"><div><label>Text A</label><textarea id="cpA" rows="5"></textarea></div><div><label>Text B</label><textarea id="cpB" rows="5"></textarea></div></div>
      <div class="inline-row"><label><input type="checkbox" id="cpCase">Ignore case</label><label><input type="checkbox" id="cpSpace">Ignore extra spaces</label><button class="btn btn-secondary" id="cpSwap">Swap</button><button class="btn btn-primary" id="cpRun">Compare</button></div>
      <textarea id="cpOut" class="result" rows="5" readonly></textarea>
    `
    );
    cmpCard.querySelector("#cpSwap").addEventListener("click", () => {
      const a = cmpCard.querySelector("#cpA");
      const b = cmpCard.querySelector("#cpB");
      const t = a.value;
      a.value = b.value;
      b.value = t;
    });
    cmpCard.querySelector("#cpRun").addEventListener("click", () => {
      let a = cmpCard.querySelector("#cpA").value;
      let b = cmpCard.querySelector("#cpB").value;
      if (!a && !b) {
        cmpCard.querySelector("#cpOut").value = "Enter text in one or both boxes.";
        return;
      }
      if (cmpCard.querySelector("#cpCase").checked) {
        a = a.toLowerCase();
        b = b.toLowerCase();
      }
      if (cmpCard.querySelector("#cpSpace").checked) {
        a = a.replace(/\s+/g, " ").trim();
        b = b.replace(/\s+/g, " ").trim();
      }
      const maxLen = Math.max(a.length, b.length) || 1;
      let same = 0;
      const min = Math.min(a.length, b.length);
      for (let i = 0; i < min; i += 1) if (a[i] === b[i]) same += 1;
      const similarity = ((same / maxLen) * 100).toFixed(2);
      const wa = new Set((a.match(/[a-z0-9']+/gi) || []).map((w) => w.toLowerCase()));
      const wb = new Set((b.match(/[a-z0-9']+/gi) || []).map((w) => w.toLowerCase()));
      const overlap = [...wa].filter((w) => wb.has(w)).length;
      const overlapPct = ((overlap / (Math.max(wa.size, wb.size) || 1)) * 100).toFixed(2);
      let firstDiff = -1;
      for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
        if (a[i] !== b[i]) {
          firstDiff = i;
          break;
        }
      }
      const out = [`Similarity: ${similarity}%`, `Length A/B: ${a.length}/${b.length}`, `Word overlap: ${overlapPct}%`, `First difference: ${firstDiff === -1 ? "No difference" : firstDiff}`].join("\n");
      cmpCard.querySelector("#cpOut").value = out;
      pushHistory("Compare", `Similarity ${similarity}%`);
    });

    // 5) Readability
    const readCard = makeCard(
      "readability",
      "📖",
      "Readability Analyzer",
      `
      <div><label>Text</label><textarea id="rdIn" rows="6"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="rdRun">Analyze</button><button class="btn btn-secondary" id="rdCopy">Copy</button><button class="btn btn-secondary" id="rdTxt">Download TXT</button></div>
      <textarea id="rdOut" class="result" rows="8" readonly></textarea>
    `
    );
    readCard.querySelector("#rdRun").addEventListener("click", () => {
      const text = (readCard.querySelector("#rdIn").value || "").trim();
      if (!text) {
        readCard.querySelector("#rdOut").value = "Please enter text.";
        return;
      }
      const words = text.match(/\b[\w']+\b/g) || [];
      const sentences = text.match(/[^.!?]+[.!?]*/g)?.filter((x) => x.trim()) || [];
      let syllables = 0;
      words.forEach((word) => {
        const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
        if (!cleaned) return;
        const groups = cleaned.match(/[aeiouy]+/g) || [];
        syllables += Math.max(1, groups.length - (cleaned.endsWith("e") ? 1 : 0));
      });
      const wc = words.length || 1;
      const sc = sentences.length || 1;
      const flesch = 206.835 - 1.015 * (wc / sc) - 84.6 * (syllables / wc);
      let level = "Very Difficult";
      if (flesch >= 90) level = "Very Easy";
      else if (flesch >= 80) level = "Easy";
      else if (flesch >= 70) level = "Fairly Easy";
      else if (flesch >= 60) level = "Standard";
      else if (flesch >= 50) level = "Fairly Difficult";
      else if (flesch >= 30) level = "Difficult";
      const report = [`Words: ${wc}`, `Sentences: ${sc}`, `Syllables: ${syllables}`, `Flesch Score: ${flesch.toFixed(2)}`, `Reading Level: ${level}`].join("\n");
      readCard.querySelector("#rdOut").value = report;
      pushHistory("Readability", `${flesch.toFixed(2)} (${level})`);
    });
    readCard.querySelector("#rdCopy").addEventListener("click", () => copyText(readCard.querySelector("#rdOut").value));
    readCard.querySelector("#rdTxt").addEventListener("click", () => downloadText("readability-report.txt", readCard.querySelector("#rdOut").value));

    // 6) Dedupe lines
    const ddCard = makeCard(
      "dedupe",
      "🔀",
      "Deduplicate Lines",
      `
      <div><label>Input (one line each)</label><textarea id="ddIn" rows="5"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="ddRun">Remove Duplicates</button><label><input type="checkbox" id="ddCase">Case sensitive</label></div>
      <textarea id="ddOut" class="result" rows="5" readonly></textarea>
      <div class="inline-row"><button class="btn btn-secondary" id="ddCopy">Copy</button><button class="btn btn-secondary" id="ddTxt">Download TXT</button></div>
    `
    );
    ddCard.querySelector("#ddRun").addEventListener("click", () => {
      const caseSensitive = ddCard.querySelector("#ddCase").checked;
      const seen = new Set();
      const out = [];
      normalizeLines(ddCard.querySelector("#ddIn").value)
        .split("\n")
        .forEach((line) => {
          const key = caseSensitive ? line.trimEnd() : line.trimEnd().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            out.push(line);
          }
        });
      ddCard.querySelector("#ddOut").value = out.join("\n");
      pushHistory("Dedupe", `${out.length} unique lines`);
    });
    ddCard.querySelector("#ddCopy").addEventListener("click", () => copyText(ddCard.querySelector("#ddOut").value));
    ddCard.querySelector("#ddTxt").addEventListener("click", () => downloadText("deduped-lines.txt", ddCard.querySelector("#ddOut").value));

    // 7) Sort lines
    const slCard = makeCard(
      "sortlines",
      "🔤",
      "Sort Lines",
      `
      <div><label>Input</label><textarea id="slIn" rows="5"></textarea></div>
      <div class="grid-2"><div><label>Order</label><select id="slOrder"><option value="asc">A-Z</option><option value="desc">Z-A</option></select></div><div><label>Mode</label><select id="slMode"><option value="alpha">Alphabetic</option><option value="len">By length</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="slRun">Sort</button><button class="btn btn-secondary" id="slCopy">Copy</button><button class="btn btn-secondary" id="slTxt">Download TXT</button></div>
      <textarea id="slOut" class="result" rows="5" readonly></textarea>
    `
    );
    slCard.querySelector("#slRun").addEventListener("click", () => {
      const order = slCard.querySelector("#slOrder").value;
      const mode = slCard.querySelector("#slMode").value;
      const lines = normalizeLines(slCard.querySelector("#slIn").value).split("\n");
      lines.sort((a, b) => {
        const cmp = mode === "len" ? a.length - b.length : a.localeCompare(b, undefined, { sensitivity: "base" });
        return order === "desc" ? -cmp : cmp;
      });
      slCard.querySelector("#slOut").value = lines.join("\n");
      pushHistory("Sort lines", `${lines.length} lines`);
    });
    slCard.querySelector("#slCopy").addEventListener("click", () => copyText(slCard.querySelector("#slOut").value));
    slCard.querySelector("#slTxt").addEventListener("click", () => downloadText("sorted-lines.txt", slCard.querySelector("#slOut").value));

    // 8) Slugify
    const sgCard = makeCard(
      "slugify",
      "🔗",
      "Slug / URL Builder",
      `
      <div><label>Title</label><input type="text" id="sgIn" placeholder="My awesome article title"></div>
      <div class="grid-2"><div><label>Delimiter</label><select id="sgDelim"><option value="-">Dash (-)</option><option value="_">Underscore (_)</option></select></div><div><label>Lowercase</label><select id="sgLower"><option value="yes">Yes</option><option value="no">No</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="sgRun">Generate</button><button class="btn btn-secondary" id="sgCopy">Copy</button></div>
      <div id="sgOut" class="result">-</div>
    `
    );
    sgCard.querySelector("#sgRun").addEventListener("click", () => {
      const delim = sgCard.querySelector("#sgDelim").value;
      const lower = sgCard.querySelector("#sgLower").value === "yes";
      const raw = sgCard.querySelector("#sgIn").value || "";
      const s = lower ? raw.toLowerCase() : raw;
      const slug = s.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, delim).replace(new RegExp(`\\${delim}+`, "g"), delim);
      sgCard.querySelector("#sgOut").textContent = slug || "(empty)";
      pushHistory("Slug", slug || "(empty)");
    });
    sgCard.querySelector("#sgCopy").addEventListener("click", () => copyText(sgCard.querySelector("#sgOut").textContent));

    // 9) Lorem
    const loremWords =
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(
        " "
      );
    const lmCard = makeCard(
      "lorem",
      "📄",
      "Lorem Generator",
      `
      <div class="grid-2"><div><label>Paragraphs</label><input type="number" id="lmP" value="2" min="1" max="20"></div><div><label>Words / paragraph</label><input type="number" id="lmW" value="40" min="10" max="140"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="lmRun">Generate</button><button class="btn btn-secondary" id="lmCopy">Copy</button><button class="btn btn-secondary" id="lmTxt">Download TXT</button></div>
      <textarea id="lmOut" class="result" rows="8" readonly></textarea>
    `
    );
    lmCard.querySelector("#lmRun").addEventListener("click", () => {
      const p = Math.max(1, Math.min(20, safeNum(lmCard.querySelector("#lmP").value, 2)));
      const w = Math.max(10, Math.min(140, safeNum(lmCard.querySelector("#lmW").value, 40)));
      const out = [];
      for (let i = 0; i < p; i += 1) {
        const words = [];
        for (let j = 0; j < w; j += 1) words.push(loremWords[(i * w + j) % loremWords.length]);
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        out.push(`${words.join(" ")}.`);
      }
      lmCard.querySelector("#lmOut").value = out.join("\n\n");
      pushHistory("Lorem", `${p} paragraph(s)`);
    });
    lmCard.querySelector("#lmCopy").addEventListener("click", () => copyText(lmCard.querySelector("#lmOut").value));
    lmCard.querySelector("#lmTxt").addEventListener("click", () => downloadText("lorem.txt", lmCard.querySelector("#lmOut").value));

    // 10) Regex tester
    const rxCard = makeCard(
      "regex",
      "🧪",
      "Regex Tester",
      `
      <div><label>Pattern (without / /)</label><input type="text" id="rxPattern" placeholder="\\b\\w{4}\\b"></div>
      <div class="grid-2"><div><label>Flags</label><input type="text" id="rxFlags" value="g" placeholder="gim"></div><div><label>Mode</label><select id="rxMode"><option value="match">Find matches</option><option value="replace">Replace</option></select></div></div>
      <div><label>Replace with (for replace mode)</label><input type="text" id="rxReplace" placeholder="$1"></div>
      <div><label>Input text</label><textarea id="rxIn" rows="5"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" id="rxRun">Run</button><button class="btn btn-secondary" id="rxCopy">Copy</button></div>
      <textarea id="rxOut" class="result" rows="6" readonly></textarea>
    `
    );
    rxCard.querySelector("#rxRun").addEventListener("click", () => {
      const pattern = rxCard.querySelector("#rxPattern").value;
      const flags = rxCard.querySelector("#rxFlags").value || "";
      const mode = rxCard.querySelector("#rxMode").value;
      const input = rxCard.querySelector("#rxIn").value || "";
      const out = rxCard.querySelector("#rxOut");
      if (!pattern) {
        out.value = "Enter pattern first.";
        return;
      }
      try {
        const rx = new RegExp(pattern, flags);
        if (mode === "replace") {
          const repl = rxCard.querySelector("#rxReplace").value || "";
          out.value = input.replace(rx, repl);
        } else {
          const matches = [...input.matchAll(rx)];
          out.value = matches.length
            ? matches
                .map((m, i) => `#${i + 1}: "${m[0]}" at ${m.index}`)
                .join("\n")
            : "No matches.";
        }
        pushHistory("Regex", `${mode} executed`);
      } catch (e) {
        out.value = `Invalid regex: ${e.message}`;
      }
    });
    rxCard.querySelector("#rxCopy").addEventListener("click", () => copyText(rxCard.querySelector("#rxOut").value));

    // 11) JSON formatter
    const jsCard = makeCard(
      "jsonfmt",
      "🧩",
      "JSON Formatter & Validator",
      `
      <div><label>JSON input</label><textarea id="jsIn" rows="6" placeholder='{"name":"Qwickton"}'></textarea></div>
      <div class="grid-2"><div><label>Indent spaces</label><input type="number" id="jsIndent" value="2" min="0" max="8"></div><div><label>Sort keys</label><select id="jsSort"><option value="no">No</option><option value="yes">Yes</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="jsRun">Format</button><button class="btn btn-secondary" id="jsMin">Minify</button><button class="btn btn-secondary" id="jsCopy">Copy</button><button class="btn btn-secondary" id="jsTxt">Download JSON</button></div>
      <textarea id="jsOut" class="result" rows="7" readonly></textarea>
    `
    );
    function sortKeysDeep(v) {
      if (Array.isArray(v)) return v.map(sortKeysDeep);
      if (v && typeof v === "object") {
        const out = {};
        Object.keys(v)
          .sort((a, b) => a.localeCompare(b))
          .forEach((k) => {
            out[k] = sortKeysDeep(v[k]);
          });
        return out;
      }
      return v;
    }
    jsCard.querySelector("#jsRun").addEventListener("click", () => {
      const out = jsCard.querySelector("#jsOut");
      try {
        const indent = Math.max(0, Math.min(8, safeNum(jsCard.querySelector("#jsIndent").value, 2)));
        const sort = jsCard.querySelector("#jsSort").value === "yes";
        let data = JSON.parse(jsCard.querySelector("#jsIn").value || "");
        if (sort) data = sortKeysDeep(data);
        out.value = JSON.stringify(data, null, indent);
        pushHistory("JSON format", "Valid JSON formatted");
      } catch (e) {
        out.value = `Invalid JSON: ${e.message}`;
      }
    });
    jsCard.querySelector("#jsMin").addEventListener("click", () => {
      const out = jsCard.querySelector("#jsOut");
      try {
        const data = JSON.parse(jsCard.querySelector("#jsIn").value || "");
        out.value = JSON.stringify(data);
      } catch (e) {
        out.value = `Invalid JSON: ${e.message}`;
      }
    });
    jsCard.querySelector("#jsCopy").addEventListener("click", () => copyText(jsCard.querySelector("#jsOut").value));
    jsCard.querySelector("#jsTxt").addEventListener("click", () => downloadText("formatted.json", jsCard.querySelector("#jsOut").value));

    // 12) History
    historyCardEl = makeCard(
      "history",
      "📜",
      "Recent Text Outputs",
      `
      <div id="textHistory" class="chip-list"><span class="empty-hint">No recent outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="txHistCopy">Copy All</button><button class="btn btn-secondary" id="txHistTxt">Export TXT</button><button class="btn btn-secondary" id="txHistClear">Clear</button></div>
    `,
      { focusable: false }
    );
    historyCardEl.classList.add("full-width");
    historyCardEl.querySelector("#txHistCopy").addEventListener("click", () => copyText(readHistory().map((h) => `${h.label}: ${h.value}`).join("\n")));
    historyCardEl.querySelector("#txHistTxt").addEventListener("click", () => downloadText("text-tools-history.txt", readHistory().map((h, i) => `${i + 1}. ${h.label}: ${h.value}`).join("\n")));
    historyCardEl.querySelector("#txHistClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // Focus modal
    const overlay = document.createElement("div");
    overlay.className = "text-focus-overlay";
    const host = document.createElement("div");
    host.className = "text-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let activeCard = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || activeCard === card) return;
      activeCard = card;
      placeholder = document.createElement("div");
      placeholder.style.height = `${card.offsetHeight}px`;
      card.parentNode.insertBefore(placeholder, card);
      host.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      overlay.classList.add("active");
      host.classList.add("active");
      document.body.classList.add("text-modal-open");
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
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("text-modal-open");
    }
    grid.querySelectorAll(".text-card [data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.target.closest(".text-card"))));
    grid.querySelectorAll(".text-card [data-focus-close]").forEach((btn) => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFocus();
    }));
    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFocus();
    });

    document.querySelectorAll(".tool-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-target");
        const card = document.getElementById(`card-${target}`);
        if (!card) return;
        const mobile = window.matchMedia("(max-width: 768px)").matches;
        if (mobile) openFocus(card);
        else card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  window.QwicktonCategoryInits["text-tools"] = initTextTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initTextTools();
  });
})();
/**
 * TEXT TOOLS - Complete JavaScript
 * Tools: Word Counter, Case Converter, Text Cleaner, Text Compare, Readability Analyzer
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

  function toSentenceCase(text) {
    return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-text-history";
  
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } 
    catch { return []; }
  }
  
  function writeHistory(items) { 
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8))); 
  }
  
  function pushHistory(label, value, renderFn) {
    if (!value) return;
    writeHistory([{ label, value: String(value).slice(0, 160), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  const SAMPLE_TEXT = "Qwickton text tools help teams clean, compare, and transform writing faster. These tools are designed for writers, editors, and developers who need quick text processing capabilities.";

  // ============================================
  // CARD CREATION
  // ============================================
  function initTextTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.textToolsInitialized === "true") return;
    grid.dataset.textToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "text-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="text-card-header">
          <div class="text-card-icon">${icon}</div>
          <h3 class="text-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary text-focus-btn" data-focus-open>Open</button>
            <button class="btn btn-secondary text-focus-inline-close" data-focus-close>Close</button>
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
      const historyContainer = historyCardEl.querySelector("#textHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No recent outputs yet.</span>';
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
    // WORD COUNTER CARD
    // ============================================
    const wordCard = makeCard("word", "📊", "Word Counter Pro", `
      <div><label>Text Input</label><textarea id="wordInput" rows="6" placeholder="Paste or type your text here..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="wordAnalyzeBtn">📊 Analyze</button>
        <button class="btn btn-secondary" id="wordSampleBtn">📋 Load Sample</button>
        <button class="btn btn-secondary" id="wordClearBtn">🗑️ Clear</button>
      </div>
      <div id="wordResult" class="result">Words: 0 | Characters: 0 | Sentences: 0</div>
      <div id="wordInsights" class="result" style="margin-top:0.5rem;">Reading time: 0 min | Paragraphs: 0 | Unique words: 0</div>
    `);

    const wordInput = wordCard.querySelector("#wordInput");
    
    function updateWordStats() {
      const text = wordInput.value;
      const trimmed = text.trim();
      const words = trimmed ? (trimmed.match(/\S+/g) || []).length : 0;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, "").length;
      const sentences = (trimmed.match(/[^.!?]+[.!?]+/g) || []).length || (trimmed ? 1 : 0);
      const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
      const uniqueWords = trimmed ? new Set(trimmed.toLowerCase().match(/[a-z0-9']+/g) || []).size : 0;
      const readMins = words ? Math.max(1, Math.round(words / 220)) : 0;
      
      wordCard.querySelector("#wordResult").innerHTML = `📝 Words: ${words} | 🔤 Characters: ${chars} | 📖 Sentences: ${sentences} | ✨ Chars(no space): ${charsNoSpace}`;
      wordCard.querySelector("#wordInsights").innerHTML = `⏱️ Reading time: ${readMins} min | 📄 Paragraphs: ${paragraphs} | 🔑 Unique words: ${uniqueWords}`;
    }
    
    wordInput.addEventListener("input", updateWordStats);
    wordCard.querySelector("#wordAnalyzeBtn").onclick = updateWordStats;
    wordCard.querySelector("#wordSampleBtn").onclick = () => {
      wordInput.value = SAMPLE_TEXT;
      updateWordStats();
      pushHistory("Word Count", `${wordInput.value.split(/\s+/).length} words`, renderHistory);
    };
    wordCard.querySelector("#wordClearBtn").onclick = () => {
      wordInput.value = "";
      updateWordStats();
    };
    updateWordStats();

    // ============================================
    // CASE CONVERTER CARD
    // ============================================
    const caseCard = makeCard("case", "🔤", "Case Converter Pro", `
      <div><label>Input Text</label><textarea id="caseInput" rows="4" placeholder="Enter your text here..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="upperBtn">🔠 UPPERCASE</button>
        <button class="btn btn-secondary" id="lowerBtn">🔡 lowercase</button>
        <button class="btn btn-secondary" id="titleBtn">📖 Title Case</button>
        <button class="btn btn-secondary" id="sentenceBtn">📝 Sentence case</button>
        <button class="btn btn-secondary" id="invertBtn">🔄 InVeRt CaSe</button>
        <button class="btn btn-primary" id="copyCaseBtn">📋 Copy Result</button>
      </div>
      <div><label>Converted Output</label><textarea id="caseResult" class="result" rows="4" placeholder="Converted text will appear here..."></textarea></div>
    `);

    const caseInput = caseCard.querySelector("#caseInput");
    const caseOutput = caseCard.querySelector("#caseResult");
    
    function applyCaseTransform(label, transformFn) {
      const out = transformFn(caseInput.value);
      caseOutput.value = out;
      pushHistory(label, out.slice(0, 80), renderHistory);
    }
    
    caseCard.querySelector("#upperBtn").onclick = () => applyCaseTransform("UPPERCASE", v => v.toUpperCase());
    caseCard.querySelector("#lowerBtn").onclick = () => applyCaseTransform("lowercase", v => v.toLowerCase());
    caseCard.querySelector("#titleBtn").onclick = () => applyCaseTransform("Title Case", v => v.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()));
    caseCard.querySelector("#sentenceBtn").onclick = () => applyCaseTransform("Sentence case", toSentenceCase);
    caseCard.querySelector("#invertBtn").onclick = () => applyCaseTransform("Invert Case", v => v.split("").map(c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()).join(""));
    caseCard.querySelector("#copyCaseBtn").onclick = () => copyText(caseOutput.value || caseInput.value);

    // ============================================
    // TEXT CLEANER CARD
    // ============================================
    const cleanerCard = makeCard("cleaner", "🧹", "Text Cleaner & Formatter", `
      <div><label>Input Text</label><textarea id="spaceInput" rows="5" placeholder="Text with extra spaces, lines, symbols..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="trimSpaceBtn">🧹 Remove Extra Spaces</button>
        <button class="btn btn-secondary" id="lineJoinBtn">🔗 Join Lines</button>
        <button class="btn btn-secondary" id="lineNormalizeBtn">📏 Normalize Lines</button>
        <button class="btn btn-secondary" id="slugBtn">🔗 Slugify</button>
        <button class="btn btn-secondary" id="sortLinesBtn">📊 Sort Lines</button>
      </div>
      <div><label>Output</label><textarea id="spaceResult" class="result" rows="5" placeholder="Cleaned text will appear here..."></textarea></div>
    `);

    const spaceInput = cleanerCard.querySelector("#spaceInput");
    const spaceResult = cleanerCard.querySelector("#spaceResult");
    
    function setCleanResult(label, text) {
      spaceResult.value = text;
      pushHistory(label, text.slice(0, 80), renderHistory);
    }
    
    cleanerCard.querySelector("#trimSpaceBtn").onclick = () => {
      setCleanResult("Trim Spaces", spaceInput.value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
    };
    cleanerCard.querySelector("#lineJoinBtn").onclick = () => {
      setCleanResult("Join Lines", spaceInput.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(" "));
    };
    cleanerCard.querySelector("#lineNormalizeBtn").onclick = () => {
      setCleanResult("Normalize Lines", spaceInput.value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim());
    };
    cleanerCard.querySelector("#slugBtn").onclick = () => {
      const slug = spaceInput.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
      setCleanResult("Slugify", slug);
    };
    cleanerCard.querySelector("#sortLinesBtn").onclick = () => {
      const sorted = spaceInput.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join("\n");
      setCleanResult("Sort Lines", sorted);
    };

    // ============================================
    // TEXT COMPARE CARD
    // ============================================
    const compareCard = makeCard("compare", "⚖️", "Text Compare Pro", `
      <div class="grid-2">
        <div><label>Text A</label><textarea id="cmpA" rows="5" placeholder="First text..."></textarea></div>
        <div><label>Text B</label><textarea id="cmpB" rows="5" placeholder="Second text..."></textarea></div>
      </div>
      <div class="inline-row">
        <label><input type="checkbox" id="cmpIgnoreCase"> 🔤 Ignore case</label>
        <label><input type="checkbox" id="cmpIgnoreSpace"> 📏 Ignore extra spaces</label>
        <button class="btn btn-secondary" id="cmpSwapBtn">🔄 Swap Texts</button>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="cmpBtn">📊 Compare</button>
      </div>
      <div id="cmpResult" class="result">Similarity: - | Length A/B: -</div>
      <div id="cmpInsights" class="result" style="margin-top:0.5rem;">Word overlap: - | First difference: -</div>
    `);

    compareCard.querySelector("#cmpSwapBtn").onclick = () => {
      const aEl = compareCard.querySelector("#cmpA");
      const bEl = compareCard.querySelector("#cmpB");
      const temp = aEl.value;
      aEl.value = bEl.value;
      bEl.value = temp;
    };
    
    compareCard.querySelector("#cmpBtn").onclick = () => {
      const ignoreCase = compareCard.querySelector("#cmpIgnoreCase").checked;
      const ignoreSpace = compareCard.querySelector("#cmpIgnoreSpace").checked;
      let a = compareCard.querySelector("#cmpA").value;
      let b = compareCard.querySelector("#cmpB").value;
      
      if (!a && !b) {
        compareCard.querySelector("#cmpResult").innerHTML = "⚠️ Please enter text in both fields";
        return;
      }
      
      let processedA = a, processedB = b;
      if (ignoreCase) { processedA = a.toLowerCase(); processedB = b.toLowerCase(); }
      if (ignoreSpace) { processedA = a.replace(/\s+/g, " ").trim(); processedB = b.replace(/\s+/g, " ").trim(); }
      
      const maxLen = Math.max(processedA.length, processedB.length) || 1;
      let sameChars = 0;
      const minLen = Math.min(processedA.length, processedB.length);
      for (let i = 0; i < minLen; i++) if (processedA[i] === processedB[i]) sameChars++;
      const similarity = ((sameChars / maxLen) * 100).toFixed(2);
      
      const wordsA = new Set((a.match(/[a-z0-9']+/gi) || []).map(w => w.toLowerCase()));
      const wordsB = new Set((b.match(/[a-z0-9']+/gi) || []).map(w => w.toLowerCase()));
      const overlap = [...wordsA].filter(word => wordsB.has(word)).length;
      const overlapPct = ((overlap / (Math.max(wordsA.size, wordsB.size) || 1)) * 100).toFixed(2);
      
      let firstDiff = -1;
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) { firstDiff = i; break; }
      }
      
      compareCard.querySelector("#cmpResult").innerHTML = `📊 Similarity: ${similarity}% | 📏 Length A/B: ${a.length}/${b.length}`;
      compareCard.querySelector("#cmpInsights").innerHTML = `🔑 Word overlap: ${overlapPct}% | 🔍 First difference at position: ${firstDiff === -1 ? "No difference (texts are identical)" : firstDiff}`;
      pushHistory("Text Compare", `Similarity ${similarity}%`, renderHistory);
    };

    // ============================================
    // READABILITY ANALYZER CARD
    // ============================================
    const readabilityCard = makeCard("readability", "📖", "Readability Snapshot", `
      <div><label>Text to Analyze</label><textarea id="readabilityInput" rows="5" placeholder="Paste text to analyze readability..."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="readabilityAnalyzeBtn">📊 Analyze Readability</button>
        <button class="btn btn-secondary" id="readabilityCopyBtn">📋 Copy Report</button>
      </div>
      <textarea id="readabilityOutput" class="result" rows="6" placeholder="Readability report will appear here..."></textarea>
    `);

    readabilityCard.querySelector("#readabilityAnalyzeBtn").onclick = () => {
      const text = readabilityCard.querySelector("#readabilityInput").value.trim();
      if (!text) {
        readabilityCard.querySelector("#readabilityOutput").value = "⚠️ Please enter some text to analyze";
        return;
      }
      
      const words = text.match(/\b[\w']+\b/g) || [];
      const sentences = text.match(/[^.!?]+[.!?]*/g)?.filter(x => x.trim()) || [];
      let syllables = 0;
      
      words.forEach(word => {
        const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
        if (!cleaned) return;
        const vowelGroups = cleaned.match(/[aeiouy]+/g) || [];
        syllables += Math.max(1, vowelGroups.length - (cleaned.endsWith("e") ? 1 : 0));
      });
      
      const wordCount = words.length || 1;
      const sentenceCount = sentences.length || 1;
      const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
      
      const level = flesch >= 90
        ? "Very Easy (5th grade)"
        : flesch >= 80
          ? "Easy (6th grade)"
          : flesch >= 70
            ? "Fairly Easy (7th grade)"
            : flesch >= 60
              ? "Standard (8th-9th grade)"
              : flesch >= 50
                ? "Fairly Difficult (10th-12th grade)"
                : flesch >= 30
                  ? "Difficult (College)"
                  : "Very Difficult (College graduate)";
      
      const report = [
        "╔══════════════════════════════════════════════════════════════╗",
        "║                    READABILITY REPORT                        ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        `📝 Words: ${wordCount.toLocaleString()}`,
        `📖 Sentences: ${sentenceCount.toLocaleString()}`,
        `🎵 Syllables: ${syllables.toLocaleString()}`,
        `📊 Flesch Reading Ease: ${flesch.toFixed(2)}`,
        `📚 Grade Level: ${level}`,
        "",
        "💡 Interpretation:",
        flesch >= 60 ? "✅ Good for general audience" : "⚠️ May be challenging for some readers"
      ].join("\n");
      
      readabilityCard.querySelector("#readabilityOutput").value = report;
      pushHistory("Readability", `Score ${flesch.toFixed(2)}`, renderHistory);
    };
    
    readabilityCard.querySelector("#readabilityCopyBtn").onclick = () => copyText(readabilityCard.querySelector("#readabilityOutput").value);

    // ============================================
    // DEDUPE LINES
    // ============================================
    const dedupeCard = makeCard("dedupe", "🔀", "Deduplicate Lines", `
      <div><label>Input</label><textarea id="ddIn" rows="5" placeholder="One entry per line…"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="ddRun">Remove duplicate lines</button>
        <button class="btn btn-secondary" id="ddCopy">Copy</button>
      </div>
      <textarea id="ddOut" class="result" rows="5" readonly></textarea>
    `);
    dedupeCard.querySelector("#ddRun").onclick = () => {
      const lines = dedupeCard.querySelector("#ddIn").value.split(/\r?\n/);
      const seen = new Set();
      const out = [];
      for (const line of lines) {
        const k = line.trimEnd();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(line);
      }
      dedupeCard.querySelector("#ddOut").value = out.join("\n");
      pushHistory("Dedupe lines", `${out.length} lines`, renderHistory);
    };
    dedupeCard.querySelector("#ddCopy").onclick = () => copyText(dedupeCard.querySelector("#ddOut").value);

    // ============================================
    // SORT LINES
    // ============================================
    const sortCard = makeCard("sortlines", "🔤", "Sort Lines", `
      <div><label>Input</label><textarea id="slIn" rows="5"></textarea></div>
      <div><label>Order</label><select id="slOrd"><option value="asc">A → Z</option><option value="desc">Z → A</option></select></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="slRun">Sort</button>
        <button class="btn btn-secondary" id="slCopy">Copy</button>
      </div>
      <textarea id="slOut" class="result" rows="5" readonly></textarea>
    `);
    sortCard.querySelector("#slRun").onclick = () => {
      const lines = sortCard.querySelector("#slIn").value.split(/\r?\n/);
      const desc = sortCard.querySelector("#slOrd").value === "desc";
      lines.sort((a, b) => (desc ? b.localeCompare(a) : a.localeCompare(b)));
      sortCard.querySelector("#slOut").value = lines.join("\n");
    };
    sortCard.querySelector("#slCopy").onclick = () => copyText(sortCard.querySelector("#slOut").value);

    // ============================================
    // SLUGIFY
    // ============================================
    const slugCard = makeCard("slugify", "🔗", "Slug / URL Fragment", `
      <div><label>Title or phrase</label><input type="text" id="sgIn" placeholder="My Great Article Title!"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="sgRun">Slugify</button>
        <button class="btn btn-secondary" id="sgCopy">Copy</button>
      </div>
      <div id="sgOut" class="result" style="font-family:monospace">—</div>
    `);
    slugCard.querySelector("#sgRun").onclick = () => {
      const s = slugCard.querySelector("#sgIn").value.trim().toLowerCase();
      const slug = s.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      slugCard.querySelector("#sgOut").textContent = slug || "(empty)";
    };
    slugCard.querySelector("#sgCopy").onclick = () => copyText(slugCard.querySelector("#sgOut").textContent);

    // ============================================
    // LOREM IPSUM
    // ============================================
    const loremCard = makeCard("lorem", "📄", "Lorem Ipsum Generator", `
      <div class="grid-2">
        <div><label>Paragraphs</label><input type="number" id="lmP" value="2" min="1" max="20"></div>
        <div><label>Words per paragraph</label><input type="number" id="lmW" value="40" min="10" max="120"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="lmRun">Generate</button>
        <button class="btn btn-secondary" id="lmCopy">Copy</button>
      </div>
      <textarea id="lmOut" class="result" rows="8" readonly></textarea>
    `);
    const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");
    loremCard.querySelector("#lmRun").onclick = () => {
      const p = Math.max(1, Math.min(20, safeNum(loremCard.querySelector("#lmP").value, 2)));
      const w = Math.max(10, Math.min(120, safeNum(loremCard.querySelector("#lmW").value, 40)));
      const paras = [];
      for (let i = 0; i < p; i++) {
        const words = [];
        for (let j = 0; j < w; j++) words.push(LOREM_WORDS[(i * w + j) % LOREM_WORDS.length]);
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        paras.push(words.join(" ") + ".");
      }
      loremCard.querySelector("#lmOut").value = paras.join("\n\n");
    };
    loremCard.querySelector("#lmCopy").onclick = () => copyText(loremCard.querySelector("#lmOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Text Outputs", `
      <div id="textHistory" class="chip-list"><span class="empty-hint">No recent outputs yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" id="clearTextHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearTextHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "text-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "text-focus-host";
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
      document.body.classList.add("text-modal-open");
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
      document.body.classList.remove("text-modal-open");
    }

    grid.querySelectorAll(".text-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".text-card")));
    });
    
    grid.querySelectorAll(".text-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".text-card[data-focusable='true'] .text-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".text-card"));
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
  window.QwicktonCategoryInits["text-tools"] = initTextTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initTextTools(null);
    }
  });
})();