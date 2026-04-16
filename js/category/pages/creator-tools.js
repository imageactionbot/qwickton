(function() {
  "use strict";

  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  const HISTORY_KEY = "qw-creator-history-v3";

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
  }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
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
  function timezoneOptions() {
    return [
      "UTC",
      "Asia/Kolkata",
      "Europe/London",
      "America/New_York",
      "Asia/Tokyo",
      "Australia/Sydney"
    ].map((tz) => `<option value="${tz}">${tz}</option>`).join("");
  }
  function downloadTextFile(filename, text) {
    const blob = new Blob([String(text || "")]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
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
    const width = 1400, lineHeight = 30, padding = 48;
    const height = Math.min(5000, Math.max(400, padding * 2 + lines.length * lineHeight));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#111827"; ctx.font = "20px JetBrains Mono, monospace";
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

  // ============================================
  // HISTORY MANAGER
  // ============================================
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (error) {
      void error;
    }
  }
  function pushHistory(type, text, renderFn) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CONTENT GENERATORS
  // ============================================
  function generateYouTubeTitles(topic, audience, style) {
    return [
      `${topic} in 10 Minutes (${audience} Edition)`,
      `The Ultimate ${topic} ${style} for ${audience}`,
      `Top 7 ${topic} Mistakes ${audience} Make`,
      `How I Mastered ${topic} Fast - ${style} Breakdown`,
      `${topic}: Complete Beginner to Pro Blueprint`,
      `${topic} Secrets Nobody Tells You About`,
      `${audience} Guide to ${topic} Success`,
      `${topic} ${style}: Everything You Need to Know`,
      `Stop Doing These ${topic} Mistakes Today`,
      `${topic} ${style} - Full Course for ${audience}`
    ];
  }

  function generateTikTokHooks(topic) {
    return [
      `POV: You just discovered the best ${topic} hack 🔥`,
      `Stop scrolling! This ${topic} tip will change everything ⚡`,
      `The ${topic} secret they don't want you to know 🤫`,
      `I tried this ${topic} method for 30 days - here's what happened 📈`,
      `Warning: This ${topic} trick is too powerful 🔒`,
      `Wait for it... The ${topic} result is insane 🤯`,
      `3 ${topic} mistakes 99% of people make ❌`,
      `This ${topic} strategy is going viral for a reason 🚀`,
      `The easiest ${topic} tutorial you'll ever watch 👇`,
      `If you're struggling with ${topic}, watch this 🎯`
    ];
  }

  function generateInstagramCaptions(topic, vibe) {
    const captions = {
      motivational: [
        `✨ ${topic} isn't about perfection. It's about progress.`,
        `🚀 Your ${topic} journey starts today. What's your first step?`,
        `💪 The only limit to your ${topic} success is your imagination.`,
        `🌟 Small ${topic} actions × consistency = massive results.`
      ],
      educational: [
        `📚 Everything you need to know about ${topic} in one post 👇`,
        `🎓 ${topic} 101: Save this for later!`,
        `💡 5 ${topic} tips that actually work (swipe →)`,
        `📖 The ultimate ${topic} guide - thread below 👇`
      ],
      engaging: [
        `🤔 What's your biggest ${topic} challenge? Comment below!`,
        `💬 ${topic} question for you: What's your #1 tip?`,
        `🎯 ${topic} poll: Do you prefer X or Y?`,
        `🔁 Share this with someone who needs ${topic} help!`
      ]
    };
    return captions[vibe] || captions.educational;
  }

  function generateLinkedInPosts(topic, type) {
    const posts = {
      story: [
        `How I transformed my ${topic} approach and got 3x results 🚀\n\nHere's the breakdown: 👇`,
        `The ${topic} lesson that took me 5 years to learn (and cost me thousands) 💡`
      ],
      listicle: [
        `5 ${topic} strategies that actually work in 2024 📊\n\n1. Start with why\n2. Build systems\n3. Measure everything\n4. Iterate fast\n5. Scale what works`,
        `7 ${topic} trends you can't ignore this year 🔥\n\nWhich one are you implementing?`
      ],
      thought: [
        `Why ${topic} is the most underrated skill in 2024 🧵\n\nHere's my take: 👇`,
        `The future of ${topic} is here. Are you ready? 🌟`
      ]
    };
    return posts[type] || posts.listicle;
  }

  function generateHooks(topic) {
    return [
      `🔥 Stop scrolling if you want to master ${topic}!`,
      `💡 No one talks about this ${topic} secret...`,
      `⚠️ I wish I knew this ${topic} hack earlier.`,
      `🚀 ${topic} made simple in 30 seconds.`,
      `💰 This ${topic} strategy changed everything for me.`,
      `📈 The #1 ${topic} mistake you're making right now.`,
      `🎯 Why 90% of people fail at ${topic} (and how to fix it).`,
      `⚡ The ${topic} shortcut that saved me 100+ hours.`,
      `🔑 Unlock ${topic} success with these 3 simple steps.`,
      `💎 The ${topic} secret experts won't tell you.`
    ];
  }

  function generateCTAs() {
    return [
      "💬 Comment 'GUIDE' and I'll send you the framework!",
      "📌 Save this for later and share with your team!",
      "🔔 Follow for daily actionable creator systems!",
      "✉️ DM me 'READY' for my free template!",
      "🎁 Like & Subscribe for more value-packed content!",
      "🔄 Share this with someone who needs to see it!",
      "👇 Drop your biggest takeaway in the comments below!",
      "✅ Tag a friend who needs to see this!",
      "📢 Repost this to help others in your network!",
      "💭 What did I miss? Add your thoughts below!"
    ];
  }

  function generateHashtags(topic, platform) {
    const topicClean = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    const platformTags = {
      tiktok: ["#fyp", "#viral", "#trending", "#tiktoktips", "#creator"],
      instagram: ["#explore", "#trendingreels", "#instagramtips", "#reels", "#viralreels"],
      linkedin: ["#linkedin", "#professional", "#career", "#growth", "#networking"],
      general: ["#contentcreator", "#growonline", "#digitalmarketing", "#creatoreconomy"]
    };
    const nicheTags = [
      `#${topicClean}`, `#${topicClean}tips`, `#${topicClean}strategy`,
      `#${topicClean}mastery`, `#learn${topicClean}`, `#${topicClean}hacks`
    ];
    const broadTags = platformTags[platform] || platformTags.general;
    return [...new Set([...nicheTags, ...broadTags])].slice(0, 15);
  }

  function generateScript(topic, duration) {
    const hook = generateHooks(topic)[0];
    const minutes = parseInt(duration) || 60;
    const sections = [
      `🎬 INTRO (0:00 - 0:${Math.floor(minutes * 0.1)})`,
      `${hook}\nWelcome to this ${topic} guide! Today we're covering everything you need to know.`,
      `📖 MAIN CONTENT (0:${Math.floor(minutes * 0.1)} - ${Math.floor(minutes * 0.8)}:00)`,
      `Point 1: Understanding the basics of ${topic}\nPoint 2: Advanced strategies that work\nPoint 3: Common mistakes to avoid\nPoint 4: Pro tips for better results`,
      `💡 KEY TAKEAWAYS (${Math.floor(minutes * 0.8)}:00 - ${minutes}:00)`,
      `• ${topic} requires consistency\n• Focus on quality over quantity\n• Track your progress and iterate\n• Join communities for support`,
      `🎯 CTA & OUTRO`,
      `Like, subscribe, and comment below with your biggest ${topic} challenge!`
    ];
    return sections.join("\n\n");
  }

  function generateContentCalendar(platform, days) {
    const calendar = [];
    for (let i = 1; i <= (parseInt(days) || 7); i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      calendar.push(`📅 Day ${i} (${date.toLocaleDateString()}): ${platform} - Create and schedule content\n   Topics: ${generateHooks("content")[i % generateHooks("content").length]}\n   Hashtags: ${generateHashtags("content", platform).slice(0, 3).join(" ")}\n`);
    }
    return calendar.join("\n");
  }

  function generateAnalytics(views, engagement) {
    const viewCount = parseInt(views) || 1000;
    const engagementRate = parseFloat(engagement) || 5;
    const likes = Math.floor(viewCount * engagementRate / 100);
    const comments = Math.floor(likes * 0.1);
    const shares = Math.floor(likes * 0.05);
    return [
      `📊 CONTENT PERFORMANCE REPORT`,
      `========================================`,
      `👁️ Views: ${viewCount.toLocaleString()}`,
      `❤️ Likes: ${likes.toLocaleString()}`,
      `💬 Comments: ${comments.toLocaleString()}`,
      `🔄 Shares: ${shares.toLocaleString()}`,
      `📈 Engagement Rate: ${engagementRate}%`,
      `========================================`,
      `💡 Recommendations:`,
      engagementRate < 3 ? `• Your engagement is low. Try adding CTAs and questions.` : `• Great engagement! Keep creating similar content.`,
      `• Post at peak times for better reach.`,
      `• Use trending audio and hashtags.`,
      `• Respond to comments to boost algorithm.`
    ].join("\n");
  }
  function generateGlobalPostingSchedule(platform, locale, baseZone, isoDateTime) {
    const baseDate = new Date(isoDateTime);
    const zones = [baseZone, "UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"];
    const uniq = [...new Set(zones)];
    const lines = [
      `🌍 Global Posting Schedule (${platform})`,
      `Base: ${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: baseZone }).format(baseDate)} (${baseZone})`,
      "----------------------------------------"
    ];
    uniq.forEach((zone) => {
      lines.push(`${zone}: ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(baseDate)}`);
    });
    lines.push("----------------------------------------");
    lines.push("Tip: pick overlap windows where at least 2 audience zones are active.");
    return lines.join("\n");
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initCreatorTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.creatorToolsInitialized === "true") return;
    grid.dataset.creatorToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("article");
      card.className = `cr-card ${options.fullWidth ? "full-width" : ""}`;
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `
        <div class="cr-card-header">
          <div class="cr-card-icon">${icon}</div>
          <h3 class="cr-card-title">${escapeHtml(title)}</h3>
          ${options.focusable !== false ? `<button class="btn btn-secondary cr-focus-btn" data-focus-open>Open</button><button class="btn btn-secondary cr-focus-inline-close" data-focus-close>Close</button>` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#creatorHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No creator outputs yet.</span>'; return; }
      container.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`).join("");
      container.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => copyText(readHistory()[Number(btn.dataset.idx)]?.text || "")));
    }

    function simpleTool(id, icon, title, fields, compute, opts = {}) {
      const card = makeCard(id, icon, title, `
        <div class="grid-2">${fields.map(f => `<div><label>${f.label}</label>${f.html}</div>`).join("")}</div>
        <div class="inline-row"><button class="btn btn-primary" data-run>Generate</button><button class="btn btn-secondary" data-copy>Copy</button><button class="btn btn-secondary" data-export="${id}-txt">TXT</button>${opts.pdf !== false ? `<button class="btn btn-secondary" data-export="${id}-pdf">PDF</button>` : ""}<button class="btn btn-secondary" data-export="${id}-png">PNG</button><button class="btn btn-secondary" data-export="${id}-jpg">JPG</button></div>
        <textarea class="result" data-out rows="${opts.rows || 6}"></textarea>
      `);
      let text = "";
      const run = (saveHistory) => {
        try {
          const result = compute(card);
          text = result.text;
          card.querySelector("[data-out]").value = text;
          if (saveHistory && result.history) pushHistory(result.history.type, result.history.text, renderHistory);
          renderHistory();
        } catch (error) { text = `Error: ${error?.message}`; card.querySelector("[data-out]").value = text; }
      };
      card.querySelector("[data-run]").addEventListener("click", () => run(true));
      card.querySelector("[data-copy]").addEventListener("click", () => copyText(text));
      run(false);
      wireExport(card, id, title, () => text);
      return card;
    }

    // ============================================
    // 1. YOUTUBE TITLE & DESCRIPTION GENERATOR
    // ============================================
    const youtubeCard = makeCard("youtube", "🎬", "YouTube Creator Suite", `
      <div class="grid-2">
        <div><label>Topic</label><input id="ytTopic" value="Video Marketing"></div>
        <div><label>Audience</label><input id="ytAudience" value="Content Creators"></div>
        <div><label>Style</label><input id="ytStyle" value="tutorial"></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="ytTitlesBtn">Generate Titles</button><button class="btn btn-secondary" id="ytDescBtn">Generate Description</button><button class="btn btn-secondary" id="ytCopyBtn">Copy</button><button class="btn btn-secondary" data-export="youtube-txt">TXT</button><button class="btn btn-secondary" data-export="youtube-pdf">PDF</button></div>
      <textarea id="ytRes" class="result" rows="8" placeholder="Your YouTube content will appear here..."></textarea>
    `);
    let ytText = "";
    youtubeCard.querySelector("#ytTitlesBtn").onclick = () => {
      const topic = youtubeCard.querySelector("#ytTopic").value || "Your Topic";
      const audience = youtubeCard.querySelector("#ytAudience").value || "Everyone";
      const style = youtubeCard.querySelector("#ytStyle").value || "tutorial";
      ytText = generateYouTubeTitles(topic, audience, style).join("\n");
      youtubeCard.querySelector("#ytRes").value = ytText;
      pushHistory("YouTube Titles", topic, renderHistory);
    };
    youtubeCard.querySelector("#ytDescBtn").onclick = () => {
      const topic = youtubeCard.querySelector("#ytTopic").value || "this topic";
      ytText = `📌 VIDEO DESCRIPTION\n========================================\nIn this video, we break down ${topic} for creators.\n\n🎯 What You'll Learn:\n• Core concepts explained simply\n• Practical workflow demonstration\n• Pro tips for better results\n\n⏱️ Timestamps:\n0:00 - Introduction\n1:30 - Core Concepts\n5:00 - Practical Demo\n\n👍 Like & Subscribe for more!\n#${topic.replace(/\s/g, '')} #contentcreator`;
      youtubeCard.querySelector("#ytRes").value = ytText;
      pushHistory("YouTube Description", topic, renderHistory);
    };
    youtubeCard.querySelector("#ytCopyBtn").onclick = () => copyText(ytText || youtubeCard.querySelector("#ytRes").value);
    wireExport(youtubeCard, "youtube", "YouTube", () => ytText || youtubeCard.querySelector("#ytRes").value);

    // ============================================
    // 2. TIKTOK HOOK GENERATOR
    // ============================================
    const tiktokCard = makeCard("tiktok", "📱", "TikTok Hook Generator", `
      <div><label>Topic</label><input id="ttTopic" value="Content Creation"></div>
      <div class="inline-row"><button class="btn btn-primary" id="ttBtn">Generate Hooks</button><button class="btn btn-secondary" id="ttCopyBtn">Copy</button><button class="btn btn-secondary" data-export="tiktok-txt">TXT</button></div>
      <textarea id="ttRes" class="result" rows="6" placeholder="TikTok hooks will appear here..."></textarea>
    `);
    let ttText = "";
    tiktokCard.querySelector("#ttBtn").onclick = () => {
      const topic = tiktokCard.querySelector("#ttTopic").value || "Content Creation";
      ttText = generateTikTokHooks(topic).join("\n\n");
      tiktokCard.querySelector("#ttRes").value = ttText;
      pushHistory("TikTok Hooks", topic, renderHistory);
    };
    tiktokCard.querySelector("#ttCopyBtn").onclick = () => copyText(ttText);
    wireExport(tiktokCard, "tiktok", "TikTok", () => ttText);

    // ============================================
    // 3. INSTAGRAM CAPTION GENERATOR
    // ============================================
    const instagramCard = makeCard("instagram", "📸", "Instagram Caption Generator", `
      <div class="grid-2"><div><label>Topic</label><input id="igTopic" value="Social Media Growth"></div><div><label>Vibe</label><select id="igVibe"><option value="motivational">Motivational</option><option value="educational">Educational</option><option value="engaging">Engaging</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="igBtn">Generate Captions</button><button class="btn btn-secondary" id="igCopyBtn">Copy</button><button class="btn btn-secondary" data-export="instagram-txt">TXT</button></div>
      <textarea id="igRes" class="result" rows="6" placeholder="Instagram captions will appear here..."></textarea>
    `);
    let igText = "";
    instagramCard.querySelector("#igBtn").onclick = () => {
      const topic = instagramCard.querySelector("#igTopic").value || "Social Media";
      const vibe = instagramCard.querySelector("#igVibe").value;
      igText = generateInstagramCaptions(topic, vibe).join("\n\n");
      instagramCard.querySelector("#igRes").value = igText;
      pushHistory("Instagram Captions", topic, renderHistory);
    };
    instagramCard.querySelector("#igCopyBtn").onclick = () => copyText(igText);
    wireExport(instagramCard, "instagram", "Instagram", () => igText);

    // ============================================
    // 4. LINKEDIN POST GENERATOR
    // ============================================
    const linkedinCard = makeCard("linkedin", "💼", "LinkedIn Post Generator", `
      <div class="grid-2"><div><label>Topic</label><input id="liTopic" value="Professional Growth"></div><div><label>Post Type</label><select id="liType"><option value="story">Story</option><option value="listicle">Listicle</option><option value="thought">Thought Leadership</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="liBtn">Generate Posts</button><button class="btn btn-secondary" id="liCopyBtn">Copy</button><button class="btn btn-secondary" data-export="linkedin-txt">TXT</button></div>
      <textarea id="liRes" class="result" rows="8" placeholder="LinkedIn posts will appear here..."></textarea>
    `);
    let liText = "";
    linkedinCard.querySelector("#liBtn").onclick = () => {
      const topic = linkedinCard.querySelector("#liTopic").value || "Professional Growth";
      const type = linkedinCard.querySelector("#liType").value;
      liText = generateLinkedInPosts(topic, type).join("\n\n");
      linkedinCard.querySelector("#liRes").value = liText;
      pushHistory("LinkedIn Posts", topic, renderHistory);
    };
    linkedinCard.querySelector("#liCopyBtn").onclick = () => copyText(liText);
    wireExport(linkedinCard, "linkedin", "LinkedIn", () => liText);

    // ============================================
    // 5. HOOK & CTA BUILDER
    // ============================================
    const hooksCard = makeCard("hooks", "⚡", "Hook & CTA Builder", `
      <div><label>Topic</label><input id="hookTopic" value="Content Creation"></div>
      <div class="inline-row"><button class="btn btn-primary" id="hooksBtn">Generate Hooks</button><button class="btn btn-secondary" id="ctaBtn">Generate CTAs</button><button class="btn btn-secondary" id="hookCopyBtn">Copy</button><button class="btn btn-secondary" data-export="hooks-txt">TXT</button></div>
      <textarea id="hookRes" class="result" rows="6" placeholder="Hooks and CTAs will appear here..."></textarea>
    `);
    let hookText = "";
    hooksCard.querySelector("#hooksBtn").onclick = () => {
      const topic = hooksCard.querySelector("#hookTopic").value || "Content Creation";
      hookText = generateHooks(topic).join("\n\n");
      hooksCard.querySelector("#hookRes").value = hookText;
      pushHistory("Hooks", topic, renderHistory);
    };
    hooksCard.querySelector("#ctaBtn").onclick = () => {
      hookText = generateCTAs().join("\n\n");
      hooksCard.querySelector("#hookRes").value = hookText;
      pushHistory("CTAs", "Generated Call-to-Actions", renderHistory);
    };
    hooksCard.querySelector("#hookCopyBtn").onclick = () => copyText(hookText);
    wireExport(hooksCard, "hooks", "Hooks", () => hookText);

    // ============================================
    // 6. HASHTAG GENERATOR
    // ============================================
    const hashtagCard = makeCard("hashtag", "#️⃣", "Hashtag Cluster Builder", `
      <div class="grid-2"><div><label>Topic</label><input id="hashTopic" value="Content Strategy"></div><div><label>Platform</label><select id="hashPlatform"><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="general">General</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="hashBtn">Generate Hashtags</button><button class="btn btn-secondary" id="hashCopyBtn">Copy</button><button class="btn btn-secondary" data-export="hashtag-txt">TXT</button></div>
      <textarea id="hashRes" class="result" rows="4" placeholder="Hashtags will appear here..."></textarea>
    `);
    let hashText = "";
    hashtagCard.querySelector("#hashBtn").onclick = () => {
      const topic = hashtagCard.querySelector("#hashTopic").value || "Content Strategy";
      const platform = hashtagCard.querySelector("#hashPlatform").value;
      hashText = generateHashtags(topic, platform).join(" ");
      hashtagCard.querySelector("#hashRes").value = hashText;
      pushHistory("Hashtags", `${platform}: ${topic}`, renderHistory);
    };
    hashtagCard.querySelector("#hashCopyBtn").onclick = () => copyText(hashText);
    wireExport(hashtagCard, "hashtag", "Hashtags", () => hashText);

    // ============================================
    // 7. SCRIPT WRITER
    // ============================================
    const scriptCard = makeCard("script", "📝", "Script Writer", `
      <div class="grid-2"><div><label>Topic</label><input id="scriptTopic" value="Content Creation"></div><div><label>Duration (seconds)</label><input id="scriptDuration" type="number" value="60"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="scriptBtn">Generate Script</button><button class="btn btn-secondary" id="scriptCopyBtn">Copy</button><button class="btn btn-secondary" data-export="script-txt">TXT</button></div>
      <textarea id="scriptRes" class="result" rows="8" placeholder="Video script will appear here..."></textarea>
    `);
    let scriptText = "";
    scriptCard.querySelector("#scriptBtn").onclick = () => {
      const topic = scriptCard.querySelector("#scriptTopic").value || "Content Creation";
      const duration = scriptCard.querySelector("#scriptDuration").value || 60;
      scriptText = generateScript(topic, duration);
      scriptCard.querySelector("#scriptRes").value = scriptText;
      pushHistory("Script", topic, renderHistory);
    };
    scriptCard.querySelector("#scriptCopyBtn").onclick = () => copyText(scriptText);
    wireExport(scriptCard, "script", "Script", () => scriptText);

    // ============================================
    // 8. CONTENT CALENDAR
    // ============================================
    const calendarCard = makeCard("calendar", "📅", "Content Calendar", `
      <div class="grid-2"><div><label>Platform</label><select id="calPlatform"><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option></select></div><div><label>Days</label><input id="calDays" type="number" value="7"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="calBtn">Generate Calendar</button><button class="btn btn-secondary" id="calCopyBtn">Copy</button><button class="btn btn-secondary" data-export="calendar-txt">TXT</button></div>
      <textarea id="calRes" class="result" rows="10" placeholder="Content calendar will appear here..."></textarea>
    `);
    let calText = "";
    calendarCard.querySelector("#calBtn").onclick = () => {
      const platform = calendarCard.querySelector("#calPlatform").value;
      const days = calendarCard.querySelector("#calDays").value || 7;
      calText = generateContentCalendar(platform, days);
      calendarCard.querySelector("#calRes").value = calText;
      pushHistory("Content Calendar", `${platform} - ${days} days`, renderHistory);
    };
    calendarCard.querySelector("#calCopyBtn").onclick = () => copyText(calText);
    wireExport(calendarCard, "calendar", "Calendar", () => calText);

    // ============================================
    // 9. ANALYTICS SIMULATOR
    // ============================================
    const analyticsCard = makeCard("analytics", "📊", "Analytics Simulator", `
      <div class="grid-2"><div><label>Views</label><input id="anaViews" type="number" value="10000"></div><div><label>Engagement Rate %</label><input id="anaEng" type="number" value="5.5" step="0.5"></div></div>
      <div class="inline-row"><button class="btn btn-primary" id="anaBtn">Generate Report</button><button class="btn btn-secondary" id="anaCopyBtn">Copy</button><button class="btn btn-secondary" data-export="analytics-txt">TXT</button></div>
      <textarea id="anaRes" class="result" rows="10" placeholder="Analytics report will appear here..."></textarea>
    `);
    let anaText = "";
    analyticsCard.querySelector("#anaBtn").onclick = () => {
      const views = analyticsCard.querySelector("#anaViews").value || 10000;
      const eng = analyticsCard.querySelector("#anaEng").value || 5.5;
      anaText = generateAnalytics(views, eng);
      analyticsCard.querySelector("#anaRes").value = anaText;
      pushHistory("Analytics", `${views} views, ${eng}% engagement`, renderHistory);
    };
    analyticsCard.querySelector("#anaCopyBtn").onclick = () => copyText(anaText);
    wireExport(analyticsCard, "analytics", "Analytics", () => anaText);

    // ============================================
    // 10. GLOBAL POSTING TIME PLANNER
    // ============================================
    const postTimeCard = makeCard("posttime", "🌍", "Global Posting Time Planner", `
      <div class="grid-2">
        <div><label>Platform</label><select id="ptPlatform"><option value="YouTube">YouTube</option><option value="TikTok">TikTok</option><option value="Instagram">Instagram</option><option value="LinkedIn">LinkedIn</option></select></div>
        <div><label>Locale/Country</label><select id="ptLocale">${localeOptions()}</select></div>
        <div><label>Base Timezone</label><select id="ptZone">${timezoneOptions()}</select></div>
        <div><label>Base Date-Time</label><input id="ptDateTime" type="datetime-local"></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="ptBtn">Build Schedule</button><button class="btn btn-secondary" id="ptCopyBtn">Copy</button><button class="btn btn-secondary" data-export="posttime-txt">TXT</button></div>
      <textarea id="ptRes" class="result" rows="8" placeholder="Global schedule will appear here..."></textarea>
    `);
    let ptText = "";
    const ptNow = new Date();
    postTimeCard.querySelector("#ptDateTime").value = `${ptNow.getFullYear()}-${String(ptNow.getMonth() + 1).padStart(2, "0")}-${String(ptNow.getDate()).padStart(2, "0")}T${String(ptNow.getHours()).padStart(2, "0")}:${String(ptNow.getMinutes()).padStart(2, "0")}`;
    postTimeCard.querySelector("#ptBtn").onclick = () => {
      const platform = postTimeCard.querySelector("#ptPlatform").value;
      const locale = postTimeCard.querySelector("#ptLocale").value || "en-US";
      const zone = postTimeCard.querySelector("#ptZone").value || "UTC";
      const dt = postTimeCard.querySelector("#ptDateTime").value;
      if (!dt) {
        postTimeCard.querySelector("#ptRes").value = "Please choose base date-time.";
        return;
      }
      ptText = generateGlobalPostingSchedule(platform, locale, zone, dt);
      postTimeCard.querySelector("#ptRes").value = ptText;
      pushHistory("Global Post Time", `${platform} ${zone}`, renderHistory);
    };
    postTimeCard.querySelector("#ptCopyBtn").onclick = () => copyText(ptText);
    wireExport(postTimeCard, "posttime", "Posting Time", () => ptText);
    postTimeCard.querySelector("#ptBtn").click();

    // ============================================
    // 11. SPONSOR RATE CALCULATOR
    // ============================================
    const sponsorCard = makeCard("sponsor", "💸", "Sponsor Rate Calculator", `
      <div class="grid-2">
        <div><label>Followers/Subscribers</label><input id="spAudience" type="number" value="50000"></div>
        <div><label>Avg Engagement %</label><input id="spEngagement" type="number" value="5" step="0.1"></div>
        <div><label>Deliverable Type</label><select id="spType"><option value="short">Short Video</option><option value="post">Feed Post</option><option value="long">Long Video</option></select></div>
        <div><label>Locale/Country</label><select id="spLocale">${localeOptions()}</select></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" id="spBtn">Estimate Rates</button><button class="btn btn-secondary" id="spCopyBtn">Copy</button><button class="btn btn-secondary" data-export="sponsor-txt">TXT</button></div>
      <textarea id="spRes" class="result" rows="8" placeholder="Estimated brand rates will appear here..."></textarea>
    `);
    let spText = "";
    sponsorCard.querySelector("#spBtn").onclick = () => {
      const audience = Math.max(100, Number(sponsorCard.querySelector("#spAudience").value || 0));
      const engagement = Math.max(0.1, Number(sponsorCard.querySelector("#spEngagement").value || 0));
      const type = sponsorCard.querySelector("#spType").value;
      const locale = sponsorCard.querySelector("#spLocale").value || "en-US";
      const currency = locale === "en-IN" ? "INR" : locale === "ja-JP" ? "JPY" : locale === "en-GB" ? "GBP" : "USD";
      const baseCpm = type === "long" ? 35 : type === "post" ? 25 : 20;
      const effectiveReach = audience * (engagement / 100) * 3;
      const baseRate = (effectiveReach / 1000) * baseCpm;
      const low = baseRate * 0.8;
      const high = baseRate * 1.25;
      const fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
      spText = [
        "Creator Sponsor Rate Estimate",
        "----------------------------------------",
        `Audience: ${audience.toLocaleString(locale)}`,
        `Engagement: ${engagement.toFixed(1)}%`,
        `Deliverable: ${type}`,
        `Suggested range: ${fmt.format(low)} - ${fmt.format(high)}`,
        "Tip: Add revision rounds and usage rights separately."
      ].join("\n");
      sponsorCard.querySelector("#spRes").value = spText;
      pushHistory("Sponsor Rate", `${fmt.format(low)}-${fmt.format(high)}`, renderHistory);
    };
    sponsorCard.querySelector("#spCopyBtn").onclick = () => copyText(spText);
    wireExport(sponsorCard, "sponsor", "Sponsor Rate", () => spText);
    sponsorCard.querySelector("#spBtn").click();

    // ============================================
    // 12. HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Creator Outputs", `
      <div id="creatorHistory" class="chip-list"><span class="empty-hint">No creator outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" id="clearCreatorHistory">Clear History</button><button class="btn btn-secondary" id="exportCreatorHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearCreatorHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportCreatorHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`creator-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL & NAVIGATION
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "cr-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "cr-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || card.getAttribute("data-focusable") === "false" || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("cr-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("cr-modal-open"); }
    document.querySelectorAll(".cr-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".cr-card"))));
    document.querySelectorAll(".cr-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    grid.querySelectorAll("button:not([type])").forEach((button) => button.setAttribute("type", "button"));
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    ["ptLocale", "spLocale"].forEach((id) => {
      const select = document.getElementById(id);
      if (select && Array.from(select.options).some((opt) => opt.value === browserLocale)) select.value = browserLocale;
    });
    document.getElementById("year").textContent = new Date().getFullYear();
  }
  window.QwicktonCategoryInits["creator-tools"] = initCreatorTools;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initCreatorTools(null); });
})();