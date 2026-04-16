(() => {
  if (window.__QW_HOME_ADVANCED_INIT__) return;
  window.__QW_HOME_ADVANCED_INIT__ = true;

  const TOOL_COUNT_MAP =
    window.QwicktonCategoryToolCounts && typeof window.QwicktonCategoryToolCounts === "object"
      ? window.QwicktonCategoryToolCounts
      : {};

  const CATEGORY_REGISTRY = [
    { slug: "daily-tools", title: "Daily Use Tools", icon: "📅", desc: "Calculators, converters, date and time utilities for everyday use.", tags: ["calculator", "converter", "date", "time"], featured: true },
    { slug: "image-tools", title: "Image Tools", icon: "🖼️", desc: "Fast client-side image editing, conversion, and compression.", tags: ["resize", "compress", "crop", "rotate"], featured: true },
    { slug: "passport-photo-maker", title: "Passport Photo Maker", icon: "📷", desc: "Country presets, live preview, and instant JPG export for official photos.", tags: ["passport", "visa", "photo", "crop"], featured: true, highlight: true },
    { slug: "pdf-tools", title: "PDF Tools", icon: "📄", desc: "Image to PDF, text to PDF, merge and viewer helpers.", tags: ["pdf", "convert", "viewer", "merge"] },
    { slug: "text-tools", title: "Text Tools", icon: "📝", desc: "Word counter, case converter, and compare utilities.", tags: ["word", "case", "compare", "formatter"] },
    { slug: "converter-tools", title: "Converter Tools", icon: "⇄", desc: "Length, weight, data, and time conversions.", tags: ["length", "weight", "data", "time", "unit"] },
    { slug: "security-tools", title: "Security Tools", icon: "🔐", desc: "Password generator and encoding helpers.", tags: ["password", "base64", "security"] },
    { slug: "calculator-tools", title: "Calculator Tools", icon: "🧮", desc: "EMI, discount, and business-friendly calculators.", tags: ["emi", "discount", "profit", "interest"] },
    { slug: "design-tools", title: "Design Tools", icon: "🎨", desc: "Color pickers and CSS code generators.", tags: ["color", "css", "design"] },
    { slug: "social-media-tools", title: "Social Media Tools", icon: "📲", desc: "Hashtag, caption, and posting helper tools.", tags: ["hashtag", "caption", "social"] },
    { slug: "business-tools", title: "Business Tools", icon: "💼", desc: "Country-wise invoicing and business support tools.", tags: ["invoice", "gst", "tax", "business"] },
    { slug: "data-tools", title: "Data Tools", icon: "📊", desc: "JSON formatter and CSV/JSON converters.", tags: ["json", "csv", "data", "schema"] },
    { slug: "random-tools", title: "Random Tools", icon: "🎲", desc: "Coin toss, dice, and random pickers.", tags: ["random", "coin", "dice"] },
    { slug: "file-tools", title: "File Tools", icon: "📁", desc: "File size checker and type detector.", tags: ["file", "size", "type"] },
    { slug: "font-tools", title: "Font Tools", icon: "Aa", desc: "Fancy text generator and typography helpers.", tags: ["font", "text", "typography"] },
    { slug: "seo-tools", title: "SEO Tools", icon: "🔍", desc: "Meta tag and structured content generators.", tags: ["seo", "meta", "schema"] },
    { slug: "document-tools", title: "Document Tools", icon: "📋", desc: "Resume and document templates.", tags: ["resume", "document"] },
    { slug: "math-tools", title: "Math Tools", icon: "∑", desc: "Percentage, ratio, and arithmetic helpers.", tags: ["math", "percentage", "ratio"] },
    { slug: "personal-tools", title: "Personal Tools", icon: "👤", desc: "BMI and personal planning utilities.", tags: ["bmi", "health", "planner"] },
    { slug: "productivity-tools", title: "Productivity Tools", icon: "✅", desc: "To-do list and pomodoro timer helpers.", tags: ["todo", "pomodoro", "focus"] },
    { slug: "developer-tools", title: "Developer Tools", icon: "⚙️", desc: "URL encode/decode and data helpers.", tags: ["json", "url", "encode", "decode"] },
    { slug: "utility-tools", title: "Utility Tools", icon: "⬛", desc: "QR code and practical helper tools.", tags: ["qr", "uuid", "token"] },
    { slug: "creator-tools", title: "Creator Tools", icon: "🎬", desc: "YouTube title and content idea generators.", tags: ["youtube", "creator", "content"] },
    { slug: "study-tools", title: "Study Tools", icon: "📚", desc: "Flashcards and memory aid helpers.", tags: ["study", "flashcard", "memory"] }
  ].map((entry) => {
    const toolCount = TOOL_COUNT_MAP[entry.slug];
    if (typeof toolCount !== "number" || !Number.isFinite(toolCount) || toolCount < 1) {
      console.warn(`[Qwickton] Missing QwicktonCategoryToolCounts for "${entry.slug}" (load js/qwickton-category-tool-counts.js before home-advanced).`);
    }
    return {
      ...entry,
      toolCount: typeof toolCount === "number" && Number.isFinite(toolCount) ? toolCount : 0,
      href: `categories/${entry.slug}.html`,
      tagsText: entry.tags.join(","),
      searchIndex: [entry.title, entry.desc, entry.slug, ...entry.tags].join(" ").toLowerCase()
    };
  });

  const REGISTRY_BY_SLUG = new Map(CATEGORY_REGISTRY.map((entry) => [entry.slug, entry]));

  const state = {
    searchQuery: "",
    categoryQuery: "",
    launcherOpen: false,
    currentView: "grid"
  };

  function qs(id) {
    return document.getElementById(id);
  }

  function getFilteredCategories() {
    const fullQuery = `${state.searchQuery} ${state.categoryQuery}`.trim().toLowerCase();
    if (!fullQuery) return CATEGORY_REGISTRY;
    return CATEGORY_REGISTRY.filter((cat) => cat.searchIndex.includes(fullQuery));
  }

  function categoryCard(cat) {
    const classes = ["category-card"];
    if (cat.featured) classes.push("featured");
    if (cat.highlight) classes.push("highlight");
    return `
      <article class="${classes.join(" ")}" data-slug="${cat.slug}" data-tools="${cat.tagsText}">
        <div class="card-icon">${cat.icon}</div>
        <div class="card-body">
          <h3>${cat.title}</h3>
          <p>${cat.desc}</p>
          <div class="card-footer">
            <a href="${cat.href}" class="card-link" data-category-link="${cat.slug}">Explore →</a>
            <span class="tool-count">${cat.toolCount} tools</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderCategories() {
    const grid = qs("categoryGrid");
    const noResults = qs("noResults");
    if (!grid) return;

    const filtered = getFilteredCategories();
    grid.innerHTML = filtered.map(categoryCard).join("");
    grid.classList.toggle("category-grid-list", state.currentView === "list");
    if (noResults) noResults.style.display = filtered.length ? "none" : "block";
  }

  function renderDrawerCategories() {
    const drawerList = qs("drawerCategoriesList");
    if (!drawerList) return;
    drawerList.innerHTML = CATEGORY_REGISTRY.map((cat) => (
      `<a href="${cat.href}" data-category-link="${cat.slug}">${cat.icon} ${cat.title}</a>`
    )).join("");
  }

  function renderQuickLauncher(query = "") {
    const results = qs("quickLaunchResults");
    if (!results) return;

    const q = query.trim().toLowerCase();
    const matches = CATEGORY_REGISTRY.filter((cat) => !q || cat.searchIndex.includes(q)).slice(0, 12);
    results.innerHTML = matches.length
      ? matches
          .map((cat) => (
            `<a class="quick-launch-item" href="${cat.href}" data-category-link="${cat.slug}">
              <span>${cat.icon} ${cat.title}</span>
              <span class="small">${cat.toolCount} tools</span>
            </a>`
          ))
          .join("")
      : '<p class="small">No categories found for this keyword.</p>';
  }

  function initSearch() {
    const searchInput = qs("toolSearch");
    const categoryFilter = qs("categoryFilter");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        state.searchQuery = event.target.value || "";
        renderCategories();
      });
    }
    if (categoryFilter) {
      categoryFilter.addEventListener("input", (event) => {
        state.categoryQuery = event.target.value || "";
        renderCategories();
      });
    }
  }

  function initQuickLauncher() {
    const launcher = qs("quickLauncher");
    const input = qs("quickLaunchInput");
    if (!launcher || !input) return;

    function openLauncher() {
      state.launcherOpen = true;
      launcher.classList.add("open");
      launcher.setAttribute("aria-hidden", "false");
      renderQuickLauncher(input.value);
      input.focus();
    }

    function closeLauncher() {
      state.launcherOpen = false;
      launcher.classList.remove("open");
      launcher.setAttribute("aria-hidden", "true");
    }

    document.querySelectorAll("[data-open-launcher]").forEach((node) => {
      node.addEventListener("click", openLauncher);
    });
    document.querySelectorAll("[data-launcher-close]").forEach((node) => {
      node.addEventListener("click", closeLauncher);
    });
    input.addEventListener("input", () => renderQuickLauncher(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const firstMatch = qs("quickLaunchResults")?.querySelector("a.quick-launch-item");
        if (firstMatch) {
          event.preventDefault();
          window.location.href = firstMatch.getAttribute("href");
        }
      }
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openLauncher();
      } else if (event.key === "Escape" && state.launcherOpen) {
        closeLauncher();
      }
    });
  }

  function initKPI() {
    const totalTools = CATEGORY_REGISTRY.reduce((sum, cat) => sum + cat.toolCount, 0);
    const kpiCategories = qs("kpiCategories");
    const kpiTools = qs("kpiTools");
    const heroStatTools = qs("heroStatTools");
    if (kpiCategories) kpiCategories.textContent = String(CATEGORY_REGISTRY.length);
    if (kpiTools) kpiTools.textContent = String(totalTools);
    if (heroStatTools) heroStatTools.textContent = String(totalTools);
  }

  function initHeroCanvas() {
    const canvas = qs("heroCanvas");
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const lines = [
      "$ qwickton init --mode=browser",
      "✓ Backend: none",
      "✓ Privacy: local processing",
      "✓ Upload required: false",
      "✓ Category registry synced"
    ];
    let lineIndex = 0;

    function drawFrame() {
      ctx.fillStyle = "#0a0f1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px "Courier New", monospace';

      lines.slice(0, lineIndex).forEach((line, idx) => {
        ctx.fillStyle = idx === 0 ? "#9d5cf5" : "#06d6a0";
        ctx.fillText(line, 18, 34 + idx * 32);
      });

      if (lineIndex < lines.length) {
        lineIndex += 1;
        setTimeout(() => window.requestAnimationFrame(drawFrame), 350);
      } else {
        setTimeout(() => {
          lineIndex = 0;
          window.requestAnimationFrame(drawFrame);
        }, 2200);
      }
    }

    drawFrame();
  }

  function initFocusTimer() {
    const display = qs("focusTimerDisplay");
    const minutesInput = qs("focusMinutes");
    const canvas = qs("focusCanvas");
    const ctx = canvas?.getContext("2d");
    if (!display || !minutesInput) return;

    const timerState = { running: false, seconds: 25 * 60, total: 25 * 60, intervalId: null };

    function redraw() {
      const mins = String(Math.floor(timerState.seconds / 60)).padStart(2, "0");
      const secs = String(timerState.seconds % 60).padStart(2, "0");
      display.textContent = `${mins}:${secs}`;

      if (!ctx || !canvas) return;
      const progress = 1 - timerState.seconds / Math.max(1, timerState.total);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(67,97,238,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#4361ee";
      ctx.fillRect(0, 0, canvas.width * progress, canvas.height);
    }

    function start() {
      if (timerState.running) return;
      const minutes = Math.max(5, Math.min(120, parseInt(minutesInput.value || "25", 10) || 25));
      if (timerState.seconds === timerState.total) {
        timerState.total = minutes * 60;
        timerState.seconds = timerState.total;
      }
      timerState.running = true;
      timerState.intervalId = window.setInterval(() => {
        timerState.seconds = Math.max(0, timerState.seconds - 1);
        redraw();
        if (timerState.seconds === 0) {
          window.clearInterval(timerState.intervalId);
          timerState.running = false;
        }
      }, 1000);
    }

    function pause() {
      window.clearInterval(timerState.intervalId);
      timerState.running = false;
    }

    function reset() {
      pause();
      const minutes = Math.max(5, Math.min(120, parseInt(minutesInput.value || "25", 10) || 25));
      timerState.total = minutes * 60;
      timerState.seconds = timerState.total;
      redraw();
    }

    qs("startFocusTimer")?.addEventListener("click", start);
    qs("pauseFocusTimer")?.addEventListener("click", pause);
    qs("resetFocusTimer")?.addEventListener("click", reset);
    qs("runFocusMode")?.addEventListener("click", () => {
      minutesInput.focus();
      document.querySelector(".focus-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    redraw();
  }

  function initMobileDrawer() {
    const menuBtn = qs("headerMenuBtn");
    const closeBtn = qs("closeDrawer");
    const overlay = qs("mobileOverlay");
    const headerSearch = qs("headerSearch");

    function closeDrawer() {
      document.body.classList.remove("nav-open");
      menuBtn?.setAttribute("aria-expanded", "false");
    }

    function openDrawer() {
      document.body.classList.add("nav-open");
      menuBtn?.setAttribute("aria-expanded", "true");
      const canvas = qs("drawerCanvas");
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      ctx.fillStyle = "#0a0f1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#06d6a0";
      ctx.font = 'bold 12px monospace';
      ctx.fillText("$ qwickton --private --local", 10, 28);
    }

    menuBtn?.addEventListener("click", openDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    if (headerSearch) {
      headerSearch.addEventListener("input", (event) => {
        const drawerList = qs("drawerCategoriesList");
        if (!drawerList) return;
        const q = String(event.target.value || "").trim().toLowerCase();
        const filtered = CATEGORY_REGISTRY.filter((cat) => !q || cat.searchIndex.includes(q));
        drawerList.innerHTML = filtered
          .map((cat) => `<a href="${cat.href}" data-category-link="${cat.slug}">${cat.icon} ${cat.title}</a>`)
          .join("");
      });
    }
  }

  function bestCategoryForText(text) {
    const q = String(text || "").toLowerCase().trim();
    if (!q) return null;
    const words = q.split(/\s+/).filter(Boolean);
    let best = { category: null, score: 0 };

    CATEGORY_REGISTRY.forEach((cat) => {
      let score = 0;
      words.forEach((word) => {
        if (cat.searchIndex.includes(word)) score += 1;
      });
      if (q.includes(cat.slug.replace(/-/g, " "))) score += 2;
      if (score > best.score) best = { category: cat, score };
    });

    return best.category;
  }

  function initAiAssist() {
    const input = qs("aiTaskInput");
    const output = qs("aiTaskOutput");
    const analyzeBtn = qs("analyzeTaskBtn");
    const launchBtn = qs("launchSuggestedToolBtn");
    if (!output || !analyzeBtn || !launchBtn) return;

    let suggestedCategory = null;

    function analyzeTask() {
      suggestedCategory = bestCategoryForText(input?.value || "");
      if (suggestedCategory) {
        output.innerHTML = `<span class="ai-ready-dot"></span> Recommended: <strong><a href="${suggestedCategory.href}" data-category-link="${suggestedCategory.slug}">${suggestedCategory.title}</a></strong> — based on your task keywords.`;
      } else {
        output.innerHTML = '<span class="ai-ready-dot"></span> Add specific keywords like passport, image, JSON, converter, invoice.';
      }
    }

    analyzeBtn.addEventListener("click", analyzeTask);
    launchBtn.addEventListener("click", () => {
      if (!suggestedCategory) {
        analyzeTask();
        return;
      }
      window.location.href = suggestedCategory.href;
    });
  }

  function initViewToggle() {
    const buttons = document.querySelectorAll(".view-btn");
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-view");
        if (!view) return;
        state.currentView = view;
        buttons.forEach((node) => node.classList.toggle("active", node === btn));
        renderCategories();
      });
    });
  }

  function init() {
    renderCategories();
    renderDrawerCategories();
    renderQuickLauncher();
    initSearch();
    initQuickLauncher();
    initKPI();
    initHeroCanvas();
    initFocusTimer();
    initMobileDrawer();
    initAiAssist();
    initViewToggle();
  }

  init();
  window.QwicktonHomeRegistry = {
    categories: CATEGORY_REGISTRY,
    getBySlug: (slug) => REGISTRY_BY_SLUG.get(slug) || null
  };
})();
