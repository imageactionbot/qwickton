/**
 * STUDY TOOLS - Complete JavaScript
 * Tools: Flashcards with progress tracking, Study Session Planner, Revision Sprint Timer
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
  // STORAGE KEYS
  // ============================================
  const FLASHCARD_KEY = "qwickton-flashcards";
  const SCORE_KEY = "qwickton-flashcards-score";
  const PLANNER_KEY = "qwickton-study-planner";

  // ============================================
  // CARD CREATION
  // ============================================
  function initStudyTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.studyToolsInitialized === "true") return;
    grid.dataset.studyToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "study-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="study-card-header">
          <div class="study-card-icon">${icon}</div>
          <h3 class="study-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary study-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary study-focus-inline-close" type="button" data-focus-close>Close</button>
          ` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    // ============================================
    // FLASHCARDS CARD
    // ============================================
    const flashCard = makeCard("flashcards", "📇", "Flashcards Pro", `
      <div><label>Question</label><input id="fcQ" type="text" placeholder="Enter your question..."></div>
      <div><label>Answer</label><input id="fcA" type="text" placeholder="Enter the answer..."></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="fcAdd">➕ Add Flashcard</button>
        <button class="btn btn-secondary" type="button" id="fcNext">🎲 Show Random</button>
        <button class="btn btn-secondary" type="button" id="fcDeleteAll">🗑️ Clear All</button>
      </div>
      <div class="inline-row">
        <button class="btn btn-success btn-sm" type="button" id="fcKnow">✅ I Knew This</button>
        <button class="btn btn-warning btn-sm" type="button" id="fcRevise">📚 Need Revision</button>
        <button class="btn btn-secondary btn-sm" type="button" id="fcExport">⬇️ Export TXT</button>
      </div>
      <div id="fcRes" class="result">📇 No flashcards yet. Add your first flashcard!</div>
      <div id="fcMeta" class="result" style="margin-top:0.5rem;">✅ Known: 0 | 📚 Revise: 0</div>
    `);

    // Flashcard functions
    function readCards() {
      try {
        const parsed = JSON.parse(localStorage.getItem(FLASHCARD_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    function writeCards(items) {
      try {
        localStorage.setItem(FLASHCARD_KEY, JSON.stringify(items));
      } catch (error) {
        void error;
      }
    }
    
    function readScore() {
      try {
        const parsed = JSON.parse(localStorage.getItem(SCORE_KEY) || "{}");
        return { known: Number(parsed.known || 0), revise: Number(parsed.revise || 0) };
      } catch {
        return { known: 0, revise: 0 };
      }
    }
    
    function writeScore(score) {
      try {
        localStorage.setItem(SCORE_KEY, JSON.stringify(score));
      } catch (error) {
        void error;
      }
    }
    
    const score = readScore();
    let currentCard = null;
    
    function syncScore() {
      flashCard.querySelector("#fcMeta").innerHTML = `✅ Known: ${score.known} | 📚 Need Revision: ${score.revise}`;
    }
    syncScore();
    
    flashCard.querySelector("#fcAdd").onclick = () => {
      const q = flashCard.querySelector("#fcQ").value.trim();
      const a = flashCard.querySelector("#fcA").value.trim();
      if (!q || !a) {
        flashCard.querySelector("#fcRes").innerHTML = "⚠️ Please enter both question and answer";
        return;
      }
      const cards = readCards();
      cards.push({ q, a });
      writeCards(cards);
      flashCard.querySelector("#fcQ").value = "";
      flashCard.querySelector("#fcA").value = "";
      flashCard.querySelector("#fcRes").innerHTML = `✅ Saved! You now have ${cards.length} flashcard(s).`;
    };
    
    flashCard.querySelector("#fcNext").onclick = () => {
      const cards = readCards();
      if (!cards.length) {
        flashCard.querySelector("#fcRes").innerHTML = "📇 No flashcards yet. Add some first!";
        return;
      }
      currentCard = cards[secureRandomInt(cards.length)];
      flashCard.querySelector("#fcRes").innerHTML = `📖 QUESTION:\n${currentCard.q}\n\n📝 ANSWER:\n${currentCard.a}`;
    };
    
    flashCard.querySelector("#fcDeleteAll").onclick = () => {
      if (confirm("Are you sure you want to delete all flashcards?")) {
        writeCards([]);
        flashCard.querySelector("#fcRes").innerHTML = "🗑️ All flashcards cleared.";
      }
    };
    
    flashCard.querySelector("#fcKnow").onclick = () => {
      score.known++;
      writeScore(score);
      syncScore();
      flashCard.querySelector("#fcRes").innerHTML = "🎉 Great job! Keep up the good work!";
    };
    
    flashCard.querySelector("#fcRevise").onclick = () => {
      score.revise++;
      writeScore(score);
      syncScore();
      flashCard.querySelector("#fcRes").innerHTML = "📚 Marked for revision. You'll master it soon!";
    };
    flashCard.querySelector("#fcExport").onclick = () => {
      const cards = readCards();
      const text = cards.map((item, idx) => `${idx + 1}. Q: ${item.q}\n   A: ${item.a}`).join("\n");
      downloadTextFile("flashcards-export.txt", text || "No flashcards yet.");
    };

    // ============================================
    // STUDY PLANNER CARD
    // ============================================
    const plannerCard = makeCard("planner", "📋", "Study Session Planner", `
      <div class="grid-2">
        <div><label>Topic</label><input id="studyTopic" type="text" placeholder="e.g., JavaScript Basics"></div>
        <div><label>Total Minutes</label><input id="studyMins" type="number" value="45" min="10" max="180"></div>
      </div>
      <div><label>Tasks (one per line)</label><textarea id="studyTasks" rows="4" placeholder="Review notes&#10;Practice exercises&#10;Take practice quiz"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="studyPlanBtn">📋 Generate Study Plan</button>
        <button class="btn btn-secondary" type="button" id="studyCopyBtn">📋 Copy Plan</button>
        <button class="btn btn-secondary" type="button" id="studyExportBtn">⬇️ TXT</button>
      </div>
      <textarea id="studyPlanRes" class="result" rows="8" placeholder="Your study plan will appear here..."></textarea>
    `);

    plannerCard.querySelector("#studyPlanBtn").onclick = () => {
      const topic = plannerCard.querySelector("#studyTopic").value.trim() || "Study Topic";
      const mins = Math.max(10, Math.min(180, safeNum(plannerCard.querySelector("#studyMins").value, 45)));
      const tasks = plannerCard.querySelector("#studyTasks").value.split("\n").map(t => t.trim()).filter(Boolean);
      
      const focusMins = Math.round(mins * 0.7);
      const reviewMins = mins - focusMins;
      const defaultTasks = tasks.length ? tasks : ["Read core material", "Take notes", "Practice examples"];
      
      const out = [
        "╔══════════════════════════════════════════════════════════════╗",
        `║              STUDY PLAN: ${topic.padEnd(35).slice(0, 35)}║`,
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        `📊 Total Study Time: ${mins} minutes`,
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "📚 PHASE 1: DEEP STUDY",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `⏱️ Duration: ${focusMins} minutes`,
        "",
        "🎯 Focus Tasks:",
        ...defaultTasks.map((task, i) => `   ${i + 1}. ${task}`),
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "🔄 PHASE 2: REVIEW & RECALL",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `⏱️ Duration: ${reviewMins} minutes`,
        "",
        "✅ Review Tasks:",
        "   1. Summarize key concepts in your own words",
        "   2. Create 5 practice questions",
        "   3. Test yourself without looking at notes",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "💡 STUDY TIPS",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "• Take a 5-minute break every 25 minutes",
        "• Stay hydrated and avoid distractions",
        "• Use active recall for better retention",
        "",
        `📅 Generated: ${new Date().toLocaleString()}`
      ].join("\n");
      
      plannerCard.querySelector("#studyPlanRes").value = out;
      try {
        localStorage.setItem(PLANNER_KEY, out);
      } catch (error) {
        void error;
      }
    };
    
    plannerCard.querySelector("#studyCopyBtn").onclick = () => copyText(plannerCard.querySelector("#studyPlanRes").value);
    plannerCard.querySelector("#studyExportBtn").onclick = () => downloadTextFile("study-plan.txt", plannerCard.querySelector("#studyPlanRes").value);
    
    // Load saved plan if exists
    const savedPlan = localStorage.getItem(PLANNER_KEY);
    if (savedPlan) plannerCard.querySelector("#studyPlanRes").value = savedPlan;

    // ============================================
    // REVISION SPRINT TIMER CARD
    // ============================================
    const revisionCard = makeCard("revision", "⏱️", "Revision Sprint Timer", `
      <div class="grid-2">
        <div><label>Minutes</label><input id="revMinutes" type="number" value="25" min="1" max="120"></div>
        <div><label>Topic Name</label><input id="revTopic" type="text" placeholder="e.g., Algebra"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="revStartBtn">▶️ Start Sprint</button>
        <button class="btn btn-secondary" type="button" id="revStopBtn">⏹️ Stop</button>
      </div>
      <div id="revOutput" class="result" style="font-size: 2rem; text-align: center; font-weight: 700;">Timer: 25:00</div>
    `);

    let revTimer = null;
    let remaining = 25 * 60;
    
    function drawRevisionTimer() {
      const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      revisionCard.querySelector("#revOutput").innerHTML = `⏱️ Timer: ${mm}:${ss}`;
    }
    
    revisionCard.querySelector("#revStartBtn").onclick = () => {
      const minutes = Math.max(1, Math.min(120, safeNum(revisionCard.querySelector("#revMinutes").value, 25)));
      const topic = revisionCard.querySelector("#revTopic").value.trim() || "Revision";
      
      if (revTimer) clearInterval(revTimer);
      remaining = minutes * 60;
      drawRevisionTimer();
      
      revTimer = setInterval(() => {
        remaining--;
        drawRevisionTimer();
        if (remaining <= 0) {
          clearInterval(revTimer);
          revTimer = null;
          revisionCard.querySelector("#revOutput").innerHTML = `🎉 Complete! ${topic} sprint finished. Great job! 🎉`;
        }
      }, 1000);
    };
    
    revisionCard.querySelector("#revStopBtn").onclick = () => {
      if (revTimer) {
        clearInterval(revTimer);
        revTimer = null;
        drawRevisionTimer();
        revisionCard.querySelector("#revOutput").innerHTML = `⏸️ Timer paused at ${revisionCard.querySelector("#revOutput").innerHTML.split(": ")[1] || "current time"}`;
      }
    };
    
    drawRevisionTimer();

    // ============================================
    // EXAM COUNTDOWN
    // ============================================
    const examCard = makeCard("exam", "🎯", "Exam Countdown", `
      <div class="grid-2">
        <div><label>Exam date</label><input id="examDate" type="date"></div>
        <div><label>Exam name</label><input id="examName" type="text" placeholder="e.g., Final Physics"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="examCalcBtn">Calculate</button>
        <button class="btn btn-secondary" type="button" id="examCopyBtn">Copy summary</button>
      </div>
      <div id="examOut" class="result">Pick a date to see time remaining.</div>
    `);
    examCard.querySelector("#examCalcBtn").onclick = () => {
      const raw = examCard.querySelector("#examDate").value;
      const name = examCard.querySelector("#examName").value.trim() || "Exam";
      if (!raw) {
        examCard.querySelector("#examOut").textContent = "Please select a date.";
        return;
      }
      const target = new Date(raw + "T23:59:59");
      const now = new Date();
      const ms = target - now;
      if (ms < 0) {
        examCard.querySelector("#examOut").textContent = `${name}: date has passed.`;
        return;
      }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      examCard.querySelector("#examOut").textContent = `${name}: ${d} day(s), ${h} hour(s) remaining.`;
    };
    examCard.querySelector("#examCopyBtn").onclick = () => copyText(examCard.querySelector("#examOut").textContent);

    // ============================================
    // READING SPEED (WPM)
    // ============================================
    const wpmCard = makeCard("wpm", "📖", "Reading Speed Calculator", `
      <div class="grid-2">
        <div><label>Word count</label><input id="wpmWords" type="number" min="1" value="250"></div>
        <div><label>Seconds taken</label><input id="wpmSecs" type="number" min="1" value="60"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="wpmBtn">Calculate WPM</button>
      </div>
      <div id="wpmOut" class="result">—</div>
    `);
    wpmCard.querySelector("#wpmBtn").onclick = () => {
      const w = Math.max(1, safeNum(wpmCard.querySelector("#wpmWords").value, 250));
      const s = Math.max(1, safeNum(wpmCard.querySelector("#wpmSecs").value, 60));
      const wpm = Math.round((w / s) * 60);
      wpmCard.querySelector("#wpmOut").textContent = `≈ ${wpm} words per minute (${w} words in ${s}s).`;
    };

    // ============================================
    // GLOSSARY BUILDER
    // ============================================
    const glossCard = makeCard("glossary", "📚", "Glossary Builder", `
      <div class="grid-2">
        <div><label>Term</label><input id="glossTerm" type="text" placeholder="Keyword"></div>
        <div><label>Definition</label><input id="glossDef" type="text" placeholder="Short definition"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="glossAdd">Add line</button>
        <button class="btn btn-secondary" type="button" id="glossCopy">Copy all</button>
        <button class="btn btn-secondary" type="button" id="glossClear">Clear</button>
        <button class="btn btn-secondary" type="button" id="glossExport">⬇️ TXT</button>
      </div>
      <textarea id="glossTa" class="result" rows="6" readonly placeholder="Your glossary lines appear here..."></textarea>
    `);
    const GLOSS_KEY = "qwickton-study-glossary";
    function glossSync() {
      glossCard.querySelector("#glossTa").value = localStorage.getItem(GLOSS_KEY) || "";
    }
    glossCard.querySelector("#glossAdd").onclick = () => {
      const t = glossCard.querySelector("#glossTerm").value.trim();
      const d = glossCard.querySelector("#glossDef").value.trim();
      if (!t || !d) return;
      const line = `${t} — ${d}`;
      const prev = (localStorage.getItem(GLOSS_KEY) || "").trim();
      try {
        localStorage.setItem(GLOSS_KEY, prev ? `${prev}\n${line}` : line);
      } catch (error) {
        void error;
      }
      glossCard.querySelector("#glossTerm").value = "";
      glossCard.querySelector("#glossDef").value = "";
      glossSync();
    };
    glossCard.querySelector("#glossCopy").onclick = () => copyText(glossCard.querySelector("#glossTa").value);
    glossCard.querySelector("#glossExport").onclick = () => downloadTextFile("study-glossary.txt", glossCard.querySelector("#glossTa").value);
    glossCard.querySelector("#glossClear").onclick = () => {
      if (confirm("Clear glossary?")) { localStorage.removeItem(GLOSS_KEY); glossSync(); }
    };
    glossSync();

    // ============================================
    // APA CITATION (BOOK / WEB)
    // ============================================
    const citeCard = makeCard("cite", "📑", "APA Citation Helper", `
      <div><label>Authors (Last, F.)</label><input id="citeAuth" type="text" placeholder="Doe, J."></div>
      <div class="grid-2">
        <div><label>Year</label><input id="citeYear" type="number" value="2024"></div>
        <div><label>Title</label><input id="citeTitle" type="text" placeholder="Article title"></div>
      </div>
      <div><label>Source / Site</label><input id="citeSite" type="text" placeholder="Journal or Website name"></div>
      <div><label>URL (optional)</label><input id="citeUrl" type="url" placeholder="https://"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="citeBtn">Format</button>
        <button class="btn btn-secondary" type="button" id="citeCopy">Copy</button>
      </div>
      <textarea id="citeOut" class="result" rows="3" readonly></textarea>
    `);
    citeCard.querySelector("#citeBtn").onclick = () => {
      const a = citeCard.querySelector("#citeAuth").value.trim() || "Author";
      const y = citeCard.querySelector("#citeYear").value || "n.d.";
      const t = citeCard.querySelector("#citeTitle").value.trim() || "Title";
      const s = citeCard.querySelector("#citeSite").value.trim();
      const u = citeCard.querySelector("#citeUrl").value.trim();
      let line = `${a} (${y}). ${t}.`;
      if (s) line += ` ${s}.`;
      if (u) line += ` ${u}`;
      citeCard.querySelector("#citeOut").value = line;
    };
    citeCard.querySelector("#citeCopy").onclick = () => copyText(citeCard.querySelector("#citeOut").value);

    // ============================================
    // STUDY STREAK
    // ============================================
    const streakCard = makeCard("streak", "🔥", "Study Streak", `
      <p class="small">Log a study session today to grow your streak. Stored only in this browser.</p>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="streakLog">I studied today ✓</button>
        <button class="btn btn-secondary" type="button" id="streakReset">Reset streak</button>
      </div>
      <div id="streakOut" class="result">—</div>
    `);
    const STREAK_KEY = "qwickton-study-streak";
    function streakRender() {
      try {
        const data = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
        const last = data.lastYmd || "";
        const n = safeNum(data.count, 0);
        streakCard.querySelector("#streakOut").textContent = `Current streak: ${n} day(s). Last log: ${last || "never"}.`;
      } catch {
        streakCard.querySelector("#streakOut").textContent = "Streak data error.";
      }
    }
    streakCard.querySelector("#streakLog").onclick = () => {
      const today = new Date().toISOString().slice(0, 10);
      const data = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
      const last = data.lastYmd;
      let count = safeNum(data.count, 0);
      if (last === today) {
        streakCard.querySelector("#streakOut").textContent = "Already logged today. Keep going!";
        return;
      }
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yStr = yest.toISOString().slice(0, 10);
      count = last === yStr || !last ? count + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ lastYmd: today, count }));
      streakRender();
    };
    streakCard.querySelector("#streakReset").onclick = () => {
      localStorage.removeItem(STREAK_KEY);
      streakRender();
    };
    streakRender();

    // ============================================
    // ESSAY OUTLINE
    // ============================================
    const outlineCard = makeCard("outline", "✏️", "Essay Outline Generator", `
      <div><label>Thesis / topic</label><input id="outThesis" type="text" placeholder="Main argument"></div>
      <div><label>Key points (one per line)</label><textarea id="outPoints" rows="4" placeholder="Point 1&#10;Point 2"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="outBtn">Generate outline</button>
        <button class="btn btn-secondary" type="button" id="outCopy">Copy</button>
      </div>
      <textarea id="outTa" class="result" rows="10"></textarea>
    `);
    outlineCard.querySelector("#outBtn").onclick = () => {
      const thesis = outlineCard.querySelector("#outThesis").value.trim() || "Topic";
      const pts = outlineCard.querySelector("#outPoints").value.split("\n").map((l) => l.trim()).filter(Boolean);
      const body = pts.length ? pts.map((p, i) => `   ${i + 1}. ${p}`).join("\n") : "   1. Supporting idea\n   2. Evidence\n   3. Analysis";
      outlineCard.querySelector("#outTa").value = [
        `I. Introduction`,
        `   • Hook + context`,
        `   • Thesis: ${thesis}`,
        ``,
        `II. Body`,
        body,
        ``,
        `III. Conclusion`,
        `   • Restate thesis`,
        `   • Closing thought`,
      ].join("\n");
    };
    outlineCard.querySelector("#outCopy").onclick = () => copyText(outlineCard.querySelector("#outTa").value);

    // ============================================
    // MNEMONIC ACRONYM
    // ============================================
    const mneCard = makeCard("mne", "🧠", "Mnemonic Acronym", `
      <div><label>Words or phrase</label><input id="mneIn" type="text" placeholder="Please Excuse My Dear Aunt Sally"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="mneBtn">Make acronym</button>
        <button class="btn btn-secondary" type="button" id="mneCopy">Copy</button>
      </div>
      <div id="mneOut" class="result">—</div>
    `);
    mneCard.querySelector("#mneBtn").onclick = () => {
      const parts = mneCard.querySelector("#mneIn").value.trim().split(/\s+/).filter(Boolean);
      if (!parts.length) {
        mneCard.querySelector("#mneOut").textContent = "Enter words.";
        return;
      }
      const ac = parts.map((w) => w[0].toUpperCase()).join("");
      mneCard.querySelector("#mneOut").textContent = `Acronym: ${ac} (${parts.length} words)`;
    };
    mneCard.querySelector("#mneCopy").onclick = () => copyText(mneCard.querySelector("#mneOut").textContent);

    // ============================================
    // GRADE CALCULATOR (GLOBAL SCALE)
    // ============================================
    const gradeCard = makeCard("grade", "🎓", "Global Grade Calculator", `
      <div class="grid-2">
        <div><label>Score Obtained</label><input id="grScore" type="number" value="82"></div>
        <div><label>Total Marks</label><input id="grTotal" type="number" value="100"></div>
        <div><label>Locale / Country</label><select id="grLocale">${localeOptions()}</select></div>
        <div><label>Scale</label><select id="grScale"><option value="100" selected>Percentage (100)</option><option value="4">GPA 4.0</option><option value="10">GPA 10</option></select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="grBtn">Calculate Grade</button>
        <button class="btn btn-secondary" type="button" id="grCopy">Copy</button>
      </div>
      <textarea id="grOut" class="result" rows="5" readonly></textarea>
    `);
    gradeCard.querySelector("#grBtn").onclick = () => {
      const score = Math.max(0, safeNum(gradeCard.querySelector("#grScore").value, 0));
      const total = Math.max(1, safeNum(gradeCard.querySelector("#grTotal").value, 100));
      const locale = gradeCard.querySelector("#grLocale").value || "en-US";
      const scale = gradeCard.querySelector("#grScale").value || "100";
      const pct = (score / total) * 100;
      let scaled = pct;
      if (scale === "4") scaled = (pct / 100) * 4;
      if (scale === "10") scaled = (pct / 100) * 10;
      const letter = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
      const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
      gradeCard.querySelector("#grOut").value = [
        `Score: ${numberFmt.format(score)} / ${numberFmt.format(total)}`,
        `Percentage: ${numberFmt.format(pct)}%`,
        `Scale (${scale}): ${numberFmt.format(scaled)}`,
        `Letter grade: ${letter}`
      ].join("\n");
    };
    gradeCard.querySelector("#grCopy").onclick = () => copyText(gradeCard.querySelector("#grOut").value);

    // ============================================
    // TIMEZONE STUDY SCHEDULER
    // ============================================
    const tzCard = makeCard("timezone", "🌍", "Timezone Study Scheduler", `
      <div class="grid-2">
        <div><label>Date</label><input id="tzDate" type="date"></div>
        <div><label>Time</label><input id="tzTime" type="time" value="18:00"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="tzBtn">Build Multi-zone Time</button>
        <button class="btn btn-secondary" type="button" id="tzCopy">Copy</button>
      </div>
      <textarea id="tzOut" class="result" rows="6" readonly></textarea>
    `);
    const tzToday = new Date().toISOString().slice(0, 10);
    tzCard.querySelector("#tzDate").value = tzToday;
    tzCard.querySelector("#tzBtn").onclick = () => {
      const date = tzCard.querySelector("#tzDate").value;
      const time = tzCard.querySelector("#tzTime").value;
      if (!date || !time) {
        tzCard.querySelector("#tzOut").value = "Please select both date and time.";
        return;
      }
      const dt = new Date(`${date}T${time}:00`);
      const zones = ["UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"];
      const lines = ["Study session timezone table:"];
      zones.forEach((zone) => {
        lines.push(`${zone}: ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(dt)}`);
      });
      tzCard.querySelector("#tzOut").value = lines.join("\n");
    };
    tzCard.querySelector("#tzCopy").onclick = () => copyText(tzCard.querySelector("#tzOut").value);

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "study-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "study-focus-host";
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
      document.body.classList.add("study-modal-open");
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
      document.body.classList.remove("study-modal-open");
    }

    grid.querySelectorAll(".study-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".study-card")));
    });
    
    grid.querySelectorAll(".study-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".study-card[data-focusable='true'] .study-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".study-card"));
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

    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const gradeLocale = document.getElementById("grLocale");
    if (gradeLocale && Array.from(gradeLocale.options).some((opt) => opt.value === browserLocale)) {
      gradeLocale.value = browserLocale;
    }
    gradeCard.querySelector("#grBtn").click();

    // ============================================
    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["study-tools"] = initStudyTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initStudyTools(null);
    }
  });
})();