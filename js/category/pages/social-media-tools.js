(function () {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-social-history-v2";
  const ICONS = ["home", "search", "user", "settings", "heart", "star", "bell", "mail", "camera", "video", "download", "upload", "share", "lock", "edit", "check"];

  function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
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
  function words(input) {
    return (String(input || "").toLowerCase().match(/[a-z0-9]+/g) || []).filter(Boolean);
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 35)));
  }

  function initSocialMediaTools() {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.socialMediaToolsInitialized === "true") return;
    grid.dataset.socialMediaToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "social-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `<div class="social-card-header"><div class="social-card-icon">${icon}</div><h3 class="social-card-title">${esc(title)}</h3>${focusable ? '<button class="btn btn-secondary social-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary social-focus-inline-close" data-focus-close>Close</button>' : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCard = null;
    function pushHistory(type, text) {
      if (!text) return;
      writeHistory([{ type, text: String(text).slice(0, 180), ts: Date.now() }, ...readHistory()]);
      renderHistory();
    }
    function renderHistory() {
      if (!historyCard) return;
      const host = historyCard.querySelector("#socialHistory");
      const items = readHistory();
      if (!items.length) {
        host.innerHTML = '<span class="empty-hint">No social outputs yet.</span>';
        return;
      }
      host.innerHTML = items.map((item, i) => `<button class="prompt-chip" data-i="${i}" type="button"><strong>${esc(item.type)}:</strong> ${esc(item.text)}</button>`).join("");
      host.querySelectorAll("[data-i]").forEach((btn) => btn.addEventListener("click", () => {
        const it = items[Number(btn.dataset.i)];
        if (it) copyText(`${it.type}: ${it.text}`);
      }));
    }
    function bindCommon(card, id, getOutput) {
      card.querySelector("[data-copy]")?.addEventListener("click", () => copyText(getOutput()));
      card.querySelector("[data-export]")?.addEventListener("click", () => downloadText(`${id}.txt`, getOutput()));
    }

    // 1 Hashtag generator
    const hashCard = makeCard("hashtag", "#️⃣", "Hashtag Generator", `
      <div><label>Topic Keywords</label><input id="hInput" type="text" placeholder="fitness tips for beginners"></div>
      <div class="grid-2"><div><label>Style</label><select id="hStyle"><option value="broad">Broad Reach</option><option value="balanced">Balanced</option><option value="niche">Niche</option></select></div><div><label>Count</label><input id="hCount" type="number" value="18" min="5" max="30"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="hRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="hOut" class="result" rows="5" readonly></textarea>
    `);
    hashCard.querySelector("#hRun").addEventListener("click", () => {
      const k = words(hashCard.querySelector("#hInput").value);
      const style = hashCard.querySelector("#hStyle").value;
      const count = Math.max(5, Math.min(30, safeNum(hashCard.querySelector("#hCount").value, 18)));
      if (!k.length) {
        hashCard.querySelector("#hOut").value = "Please enter topic keywords.";
        return;
      }
      const suffixes = style === "niche" ? ["tips", "guide", "framework", "workflow", "strategy"] : style === "broad" ? ["viral", "trending", "community", "daily", "online"] : ["growth", "creator", "ideas", "content", "smart"];
      const set = new Set();
      k.forEach((w) => {
        set.add(`#${w}`);
        suffixes.forEach((s) => set.add(`#${w}${s}`));
      });
      const out = Array.from(set).slice(0, count).join(" ");
      hashCard.querySelector("#hOut").value = out;
      pushHistory("Hashtags", `${count} generated`);
    });
    bindCommon(hashCard, "hashtags", () => hashCard.querySelector("#hOut").value);

    // 2 Caption studio
    const capCard = makeCard("caption", "📝", "Caption Studio", `
      <div><label>Main Content</label><textarea id="cIn" rows="5" placeholder="Write your post idea..."></textarea></div>
      <div class="grid-2"><div><label>Hook (optional)</label><input id="cHook" type="text" placeholder="Stop scrolling..."></div><div><label>CTA (optional)</label><input id="cCta" type="text" placeholder="Save this post"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="cBal">Balanced</button><button class="btn btn-secondary" id="cShort">Short</button><button class="btn btn-secondary" id="cLong">Long</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="cOut" class="result" rows="7" readonly></textarea>
    `);
    function buildCaption(mode) {
      const raw = capCard.querySelector("#cIn").value.trim();
      if (!raw) {
        capCard.querySelector("#cOut").value = "Please add content first.";
        return;
      }
      const hook = capCard.querySelector("#cHook").value.trim() || "Quick insight:";
      const cta = capCard.querySelector("#cCta").value.trim() || "Follow for more.";
      const lines = raw.split(/\n+/).map((x) => x.trim()).filter(Boolean);
      const body = mode === "short" ? lines.slice(0, 2) : mode === "long" ? lines : lines.slice(0, 4);
      const out = [hook, "", ...body, "", cta].join("\n");
      capCard.querySelector("#cOut").value = out;
      pushHistory("Caption", `${out.length} chars`);
    }
    capCard.querySelector("#cBal").addEventListener("click", () => buildCaption("balanced"));
    capCard.querySelector("#cShort").addEventListener("click", () => buildCaption("short"));
    capCard.querySelector("#cLong").addEventListener("click", () => buildCaption("long"));
    bindCommon(capCard, "caption", () => capCard.querySelector("#cOut").value);

    // 3 Thread splitter
    const threadCard = makeCard("thread", "🧵", "Thread / Carousel Splitter", `
      <div><label>Long Content</label><textarea id="tIn" rows="7" placeholder="Paste long idea/script"></textarea></div>
      <div class="grid-2"><div><label>Parts</label><input id="tParts" type="number" value="6" min="3" max="20"></div><div><label>Prefix</label><select id="tPref"><option value="Thread">Thread</option><option value="Slide">Slide</option><option value="Scene">Scene</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="tRun">Split</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="tOut" class="result" rows="9" readonly></textarea>
    `);
    threadCard.querySelector("#tRun").addEventListener("click", () => {
      const raw = threadCard.querySelector("#tIn").value.trim();
      if (!raw) {
        threadCard.querySelector("#tOut").value = "Please paste content first.";
        return;
      }
      const parts = Math.max(3, Math.min(20, safeNum(threadCard.querySelector("#tParts").value, 6)));
      const prefix = threadCard.querySelector("#tPref").value;
      const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
      const chunk = Math.max(1, Math.ceil(sentences.length / parts));
      const out = [];
      for (let i = 0; i < sentences.length; i += chunk) out.push(sentences.slice(i, i + chunk).join(" "));
      threadCard.querySelector("#tOut").value = out.map((text, idx) => `${prefix} ${idx + 1}/${out.length}\n${text}`).join("\n\n---\n\n");
      pushHistory("Thread Split", `${out.length} parts`);
    });
    bindCommon(threadCard, "thread-split", () => threadCard.querySelector("#tOut").value);

    // 4 Bio builder
    const bioCard = makeCard("bio", "👤", "Bio Builder", `
      <div class="grid-2"><div><label>Name / Brand</label><input id="bName" type="text" placeholder="Avi Media"></div><div><label>Role / Niche</label><input id="bRole" type="text" placeholder="Content Strategist"></div><div><label>Proof</label><input id="bProof" type="text" placeholder="Helped 200+ creators"></div><div><label>CTA</label><input id="bCta" type="text" placeholder="DM for collab"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="bRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="bOut" class="result" rows="6" readonly></textarea>
    `);
    bioCard.querySelector("#bRun").addEventListener("click", () => {
      const name = bioCard.querySelector("#bName").value.trim() || "Your Brand";
      const role = bioCard.querySelector("#bRole").value.trim() || "Creator";
      const proof = bioCard.querySelector("#bProof").value.trim() || "Helping people grow online";
      const cta = bioCard.querySelector("#bCta").value.trim() || "Connect below";
      const out = [`${name} | ${role}`, `${proof}`, `${cta}`].join("\n");
      bioCard.querySelector("#bOut").value = out;
      pushHistory("Bio", name);
    });
    bindCommon(bioCard, "bio", () => bioCard.querySelector("#bOut").value);

    // 5 Weekly planner
    const calCard = makeCard("calendar", "📅", "Weekly Content Planner", `
      <div><label>Theme / Niche</label><input id="wTheme" type="text" placeholder="Fitness, AI, marketing"></div>
      <div class="inline-row"><button class="btn btn-primary" id="wRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="wOut" class="result" rows="9" readonly></textarea>
    `);
    calCard.querySelector("#wRun").addEventListener("click", () => {
      const theme = calCard.querySelector("#wTheme").value.trim() || "your niche";
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const ideas = ["Educational carousel", "Storytelling post", "Myth vs fact", "Case study", "Trend remix", "Q&A post", "Weekly recap"];
      calCard.querySelector("#wOut").value = days.map((d, i) => `${d}: ${ideas[i]} on ${theme}`).join("\n");
      pushHistory("Calendar", theme);
    });
    bindCommon(calCard, "weekly-planner", () => calCard.querySelector("#wOut").value);

    // 6 Hook lines
    const hookCard = makeCard("hooks", "🪝", "Hook Line Variations", `
      <div><label>Topic</label><input id="hkTopic" type="text" placeholder="productivity"></div>
      <div class="inline-row"><button class="btn btn-primary" id="hkRun">Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="hkOut" class="result" rows="8" readonly></textarea>
    `);
    hookCard.querySelector("#hkRun").addEventListener("click", () => {
      const t = hookCard.querySelector("#hkTopic").value.trim() || "this topic";
      hookCard.querySelector("#hkOut").value = [
        `Stop scrolling: ${t} made simple`,
        `I tested ${t} for 30 days, here's what happened`,
        `3 mistakes everyone makes with ${t}`,
        `If you care about ${t}, save this`,
        `Beginner guide to ${t} in 60 seconds`
      ].join("\n\n");
      pushHistory("Hooks", t);
    });
    bindCommon(hookCard, "hook-lines", () => hookCard.querySelector("#hkOut").value);

    // 7 Hashtag mixer
    const mixCard = makeCard("htagmix", "#️⃣", "Hashtag Mixer", `
      <div><label>Pool A (comma separated)</label><input id="mxA" type="text" placeholder="fitness, gym"></div>
      <div><label>Pool B (comma separated)</label><input id="mxB" type="text" placeholder="tips, routine"></div>
      <div class="inline-row"><button class="btn btn-primary" id="mxRun">Combine</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="mxOut" class="result" rows="6" readonly></textarea>
    `);
    mixCard.querySelector("#mxRun").addEventListener("click", () => {
      const a = mixCard.querySelector("#mxA").value.split(",").map((x) => x.trim().replace(/\s+/g, "")).filter(Boolean);
      const b = mixCard.querySelector("#mxB").value.split(",").map((x) => x.trim().replace(/\s+/g, "")).filter(Boolean);
      if (!a.length || !b.length) {
        mixCard.querySelector("#mxOut").value = "Please provide both pools.";
        return;
      }
      const tags = [];
      a.forEach((x) => b.forEach((y) => tags.push(`#${x}${y}`)));
      mixCard.querySelector("#mxOut").value = tags.slice(0, 40).join(" ");
      pushHistory("Hashtag Mix", `${tags.length} combinations`);
    });
    bindCommon(mixCard, "hashtag-mixer", () => mixCard.querySelector("#mxOut").value);

    // 8 Post ideas
    const ideasCard = makeCard("ideas", "💡", "Post Idea Generator", `
      <div><label>Niche</label><input id="piNiche" type="text" placeholder="web design"></div>
      <div class="inline-row"><button class="btn btn-primary" id="piRun">Generate Ideas</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="piOut" class="result" rows="8" readonly></textarea>
    `);
    ideasCard.querySelector("#piRun").addEventListener("click", () => {
      const n = ideasCard.querySelector("#piNiche").value.trim() || "your niche";
      ideasCard.querySelector("#piOut").value = [
        `Before/After in ${n}`,
        `${n}: 5 common mistakes`,
        `Beginner roadmap for ${n}`,
        `${n} tools I actually use`,
        `Case study: from zero to first result in ${n}`,
        `My weekly ${n} workflow`
      ].join("\n");
      pushHistory("Post Ideas", n);
    });
    bindCommon(ideasCard, "post-ideas", () => ideasCard.querySelector("#piOut").value);

    // 9 CTA generator
    const ctaCard = makeCard("cta", "📣", "CTA Generator", `
      <div><label>Goal</label><select id="ctGoal"><option value="engagement">Engagement</option><option value="follow">Follower Growth</option><option value="lead">Leads / DMs</option><option value="click">Link Clicks</option></select></div>
      <div class="inline-row"><button class="btn btn-primary" id="ctRun">Generate CTAs</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="ctOut" class="result" rows="8" readonly></textarea>
    `);
    ctaCard.querySelector("#ctRun").addEventListener("click", () => {
      const g = ctaCard.querySelector("#ctGoal").value;
      const list = g === "follow" ? ["Follow for daily practical tips.", "Hit follow if this helped.", "Join our community for more."] :
        g === "lead" ? ["DM me 'START' for details.", "Comment 'READY' and I will message you.", "Want this setup? Send me a DM."] :
          g === "click" ? ["Tap the link in bio for full guide.", "Check the first comment for link.", "Open bio link to download template."] :
            ["What do you think? Comment below.", "Save this post for later.", "Share this with a friend who needs it."];
      ctaCard.querySelector("#ctOut").value = list.join("\n");
      pushHistory("CTA", g);
    });
    bindCommon(ctaCard, "cta", () => ctaCard.querySelector("#ctOut").value);

    // 10 Engagement checklist
    const engCard = makeCard("engagement", "📈", "Engagement Checklist", `
      <div class="inline-row"><button class="btn btn-primary" id="egRun">Generate Checklist</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="egOut" class="result" rows="10" readonly></textarea>
    `);
    engCard.querySelector("#egRun").addEventListener("click", () => {
      engCard.querySelector("#egOut").value = [
        "Engagement Checklist",
        "☐ Hook in first line",
        "☐ One clear CTA",
        "☐ Reply to comments in first hour",
        "☐ Pin best comment",
        "☐ Share to stories",
        "☐ Review analytics after 24h",
        `Generated: ${new Date().toLocaleString()}`
      ].join("\n");
      pushHistory("Checklist", "engagement");
    });
    bindCommon(engCard, "engagement-checklist", () => engCard.querySelector("#egOut").value);

    // 11 Limits cheatsheet
    const limCard = makeCard("limits", "📏", "Character Limits Cheatsheet", `
      <div class="inline-row"><button class="btn btn-primary" id="lmRun">Show Limits</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="lmOut" class="result" rows="10" readonly></textarea>
    `);
    limCard.querySelector("#lmRun").addEventListener("click", () => {
      limCard.querySelector("#lmOut").value = [
        "Approximate social limits (verify in app):",
        "X post: 280 chars",
        "Instagram caption: 2200 chars",
        "LinkedIn post: 3000 chars",
        "YouTube title: 100 chars",
        "TikTok caption: 2200 chars"
      ].join("\n");
      pushHistory("Limits", "reference");
    });
    bindCommon(limCard, "platform-limits", () => limCard.querySelector("#lmOut").value);

    // 12 Icon keyword helper
    const iconCard = makeCard("icon", "🔍", "Icon Keyword Helper", `
      <div><label>Search Keyword</label><input id="icIn" type="text" placeholder="search, user, lock"></div>
      <div class="inline-row"><button class="btn btn-primary" id="icRun">Find</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export>TXT</button></div>
      <textarea id="icOut" class="result" rows="6" readonly></textarea>
    `);
    iconCard.querySelector("#icRun").addEventListener("click", () => {
      const term = iconCard.querySelector("#icIn").value.trim().toLowerCase();
      const list = term ? ICONS.filter((x) => x.includes(term)) : ICONS;
      iconCard.querySelector("#icOut").value = list.join("\n") || "No icon keywords matched.";
      pushHistory("Icon Helper", `${list.length} matches`);
    });
    bindCommon(iconCard, "icon-helper", () => iconCard.querySelector("#icOut").value);

    // 13 History
    historyCard = makeCard("history", "📜", "Recent Social Outputs", `
      <div id="socialHistory" class="chip-list"><span class="empty-hint">No social outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="shClear" type="button">Clear</button><button class="btn btn-secondary" id="shExport" type="button">Export TXT</button></div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCard.querySelector("#shClear").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    historyCard.querySelector("#shExport").addEventListener("click", () => {
      const lines = readHistory().map((item, idx) => `${idx + 1}. [${new Date(item.ts).toLocaleString()}] ${item.type}: ${item.text}`);
      downloadText(`social-history-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    });
    renderHistory();

    // Focus modal
    const overlay = document.createElement("div");
    overlay.className = "social-focus-overlay";
    const host = document.createElement("div");
    host.className = "social-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);
    let activeCard = null;
    let placeholder = null;
    function openFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false" || activeCard === card) return;
      if (activeCard) closeFocus();
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
      document.body.classList.add("social-modal-open");
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
      document.body.classList.remove("social-modal-open");
    }
    grid.querySelectorAll("[data-focus-open]").forEach((btn) => btn.addEventListener("click", (e) => openFocus(e.currentTarget.closest(".social-card"))));
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
  }

  window.QwicktonCategoryInits["social-media-tools"] = initSocialMediaTools;
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initSocialMediaTools();
    }
  });
})();
