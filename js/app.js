(function initGlobalApp() {
  if (window.__QW_GLOBAL_APP_INIT__) return;
  window.__QW_GLOBAL_APP_INIT__ = true;

  const body = document.body;
  const CATEGORY_FILE_RE = /^([a-z0-9-]+)\.html$/i;
  const ADSENSE_CLIENT = "ca-pub-5368355682383000";
  const SITE_ORIGIN = "https://qwickton.com";
  const SUPPORTED_HREFLANGS = ["en-US", "en-IN", "en-GB", "de-DE", "fr-FR", "ja-JP"];
  const GA_MEASUREMENT_ID =
    String(window.QW_GA_MEASUREMENT_ID || "").trim() ||
    String(document.querySelector('meta[name="google-analytics-id"]')?.getAttribute("content") || "").trim();
  const isCategoryPage = /\/categories\/[^/]+\.html$/i.test(window.location.pathname);
  const rootPrefix = isCategoryPage ? "../" : "./";
  const CATEGORY_LIST = [
    { slug: "daily-tools", title: "Daily Tools" },
    { slug: "image-tools", title: "Image Tools" },
    { slug: "passport-photo-maker", title: "Passport Photo Maker" },
    { slug: "pdf-tools", title: "PDF Tools" },
    { slug: "text-tools", title: "Text Tools" },
    { slug: "converter-tools", title: "Converter Tools" },
    { slug: "security-tools", title: "Security Tools" },
    { slug: "calculator-tools", title: "Calculator Tools" },
    { slug: "design-tools", title: "Design Tools" },
    { slug: "social-media-tools", title: "Social Media Tools" },
    { slug: "business-tools", title: "Business Tools" },
    { slug: "data-tools", title: "Data Tools" },
    { slug: "random-tools", title: "Random Tools" },
    { slug: "file-tools", title: "File Tools" },
    { slug: "font-tools", title: "Font Tools" },
    { slug: "seo-tools", title: "SEO Tools" },
    { slug: "document-tools", title: "Document Tools" },
    { slug: "math-tools", title: "Math Tools" },
    { slug: "personal-tools", title: "Personal Tools" },
    { slug: "productivity-tools", title: "Productivity Tools" },
    { slug: "developer-tools", title: "Developer Tools" },
    { slug: "utility-tools", title: "Utility Tools" },
    { slug: "creator-tools", title: "Creator Tools" },
    { slug: "study-tools", title: "Study Tools" }
  ];

  function upsertMeta(name, value) {
    if (!name || !value) return;
    let node = document.querySelector(`meta[name="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  }

  function upsertPropertyMeta(property, value) {
    if (!property || !value) return;
    let node = document.querySelector(`meta[property="${property}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("property", property);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  }

  function upsertLink(rel, href, attrs) {
    if (!rel || !href) return null;
    let node = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", rel);
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
    if (attrs && typeof attrs === "object") {
      Object.entries(attrs).forEach(([key, val]) => {
        if (val === false || val == null) return;
        if (val === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(val));
      });
    }
    return node;
  }
  function upsertAlternateLink(hreflang, href) {
    if (!hreflang || !href) return null;
    let node = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", "alternate");
      node.setAttribute("hreflang", hreflang);
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
    return node;
  }

  function hrefForCategory(slug) {
    return isCategoryPage ? `${slug}.html` : `categories/${slug}.html`;
  }

  function hrefForRootPage(pageName) {
    return `${rootPrefix}${pageName}`;
  }

  function ensureAmbientBackground() {
    if (document.querySelector(".ambient-bg")) return;
    const bg = document.createElement("div");
    bg.className = "ambient-bg";
    bg.setAttribute("aria-hidden", "true");
    bg.innerHTML = `
      <div class="ambient-orb orb-1"></div>
      <div class="ambient-orb orb-2"></div>
      <div class="ambient-orb orb-3"></div>
      <div class="grid-overlay"></div>
    `;
    document.body.insertBefore(bg, document.body.firstChild);
  }

  function getCurrentCategorySlug() {
    const categoryMain = document.querySelector("main[data-category-page]");
    const fromData = categoryMain?.getAttribute("data-category-page");
    if (fromData) return fromData;
    const matched = /\/categories\/([a-z0-9-]+)\.html$/i.exec(window.location.pathname);
    return matched ? matched[1].toLowerCase() : "";
  }

  function applyCategoryAmbientPalette() {
    const slug = getCurrentCategorySlug();
    const palette = {
      "daily-tools": ["#4f7cff", "#8b5cf6", "#2dd4bf"],
      "image-tools": ["#3b82f6", "#ec4899", "#22d3ee"],
      "passport-photo-maker": ["#2563eb", "#f43f5e", "#10b981"],
      "pdf-tools": ["#ef4444", "#f59e0b", "#3b82f6"],
      "text-tools": ["#7c3aed", "#3b82f6", "#22c55e"],
      "converter-tools": ["#0ea5e9", "#6366f1", "#14b8a6"],
      "security-tools": ["#334155", "#7c3aed", "#10b981"],
      "calculator-tools": ["#3b82f6", "#f59e0b", "#06b6d4"],
      "design-tools": ["#8b5cf6", "#ec4899", "#06b6d4"],
      "social-media-tools": ["#0ea5e9", "#f43f5e", "#a855f7"],
      "business-tools": ["#2563eb", "#7c3aed", "#14b8a6"],
      "data-tools": ["#1d4ed8", "#7c3aed", "#10b981"],
      "random-tools": ["#f97316", "#ec4899", "#22c55e"],
      "file-tools": ["#64748b", "#3b82f6", "#14b8a6"],
      "font-tools": ["#7c3aed", "#f43f5e", "#0ea5e9"],
      "seo-tools": ["#2563eb", "#0ea5e9", "#22c55e"],
      "document-tools": ["#3b82f6", "#8b5cf6", "#0ea5e9"],
      "math-tools": ["#2563eb", "#f59e0b", "#14b8a6"],
      "personal-tools": ["#ec4899", "#8b5cf6", "#22c55e"],
      "productivity-tools": ["#2563eb", "#7c3aed", "#10b981"],
      "developer-tools": ["#334155", "#6366f1", "#06b6d4"],
      "utility-tools": ["#475569", "#3b82f6", "#14b8a6"],
      "creator-tools": ["#f43f5e", "#8b5cf6", "#06b6d4"],
      "study-tools": ["#0ea5e9", "#6366f1", "#22c55e"]
    };

    const selected = palette[slug];
    if (!selected) {
      body.style.removeProperty("--ambient-primary");
      body.style.removeProperty("--ambient-accent");
      body.style.removeProperty("--ambient-neon");
      return;
    }

    body.style.setProperty("--ambient-primary", selected[0]);
    body.style.setProperty("--ambient-accent", selected[1]);
    body.style.setProperty("--ambient-neon", selected[2]);
  }

  function normalizeCategoryHref(rawHref) {
    if (!rawHref) return rawHref;
    const cleanHref = String(rawHref).trim();
    if (!cleanHref || cleanHref.startsWith("#") || cleanHref.startsWith("javascript:")) return cleanHref;

    const absolute = new URL(cleanHref, window.location.href);
    const parts = absolute.pathname.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1] || "";
    const match = CATEGORY_FILE_RE.exec(fileName);

    if (!match) return absolute.pathname + absolute.search + absolute.hash;
    const slug = match[1].toLowerCase();
    return `${hrefForCategory(slug)}${absolute.search}${absolute.hash}`;
  }

  function toAbsoluteSeoUrl(rawPath) {
    const value = String(rawPath || window.location.pathname || "/").trim();
    let path =
      value.startsWith("http://") || value.startsWith("https://")
        ? new URL(value).pathname
        : value;
    if (!path.startsWith("/")) path = `/${path}`;
    if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length) || "/";
    if (path === "/index.html") path = "/";
    return new URL(path, window.location.origin).toString();
  }

  function ensureJsonLdScript(kind, payload) {
    if (!kind || !payload) return;
    const selector = `script[type="application/ld+json"][data-qw-jsonld="${kind}"]`;
    let script = document.querySelector(selector);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-qw-jsonld", kind);
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(payload);
  }

  function normalizeRuntimeSeo() {
    const seoUrl = toAbsoluteSeoUrl(window.location.pathname);
    const pageDescription = document.querySelector("meta[name='description']")?.getAttribute("content") || "";
    const pageTitle = document.title || "Qwickton";
    const locale = document.documentElement.lang?.toLowerCase().startsWith("en") ? "en_US" : "en_US";

    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) canonical.setAttribute("href", seoUrl);

    const ogUrl = document.querySelector("meta[property='og:url']");
    if (ogUrl) ogUrl.setAttribute("content", seoUrl);
    upsertPropertyMeta("og:locale", locale);
    upsertMeta("twitter:site", "@qwickton");
    upsertMeta("twitter:creator", "@qwickton");

    upsertAlternateLink("x-default", seoUrl);
    SUPPORTED_HREFLANGS.forEach((hreflang) => {
      upsertAlternateLink(hreflang, seoUrl);
    });

    ensureJsonLdScript("webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: seoUrl,
      inLanguage: "en",
      isPartOf: `${SITE_ORIGIN}/`,
      name: pageTitle,
      description: pageDescription
    });
    ensureJsonLdScript("website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Qwickton",
      url: `${SITE_ORIGIN}/`,
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_ORIGIN}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });
    ensureJsonLdScript("organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Qwickton",
      url: `${SITE_ORIGIN}/`,
      logo: `${SITE_ORIGIN}/assets/icons/icon.svg`,
      sameAs: []
    });

    const breadcrumbs = [{ "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteSeoUrl("/") }];
    const categoryMatch = /\/categories\/([a-z0-9-]+)\.html$/i.exec(window.location.pathname);
    if (categoryMatch) {
      const slug = categoryMatch[1].toLowerCase();
      const label = slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: label, item: seoUrl });
    }
    ensureJsonLdScript("breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs
    });
  }

  function ensureGlobalMetaAndHead() {
    upsertMeta("format-detection", "telephone=no");
    upsertMeta("referrer", "strict-origin-when-cross-origin");
    upsertMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    upsertMeta("author", "Avinash Chauhan");
    upsertMeta("publisher", "Avinash Chauhan");
    upsertMeta("application-name", "Qwickton");
    upsertMeta("language", "en");
    upsertMeta("content-language", "en");
    upsertMeta("audience", "global");
    upsertMeta("google-adsense-account", ADSENSE_CLIENT);
    upsertPropertyMeta("og:site_name", "Qwickton");
    upsertLink("me", "mailto:finedge360official@gmail.com");
    upsertLink("dns-prefetch", "https://cdnjs.cloudflare.com");
    upsertLink("dns-prefetch", "https://pagead2.googlesyndication.com");
    upsertLink("preconnect", "https://cdn.jsdelivr.net", { crossorigin: "anonymous" });
    upsertLink("preconnect", "https://pagead2.googlesyndication.com", { crossorigin: "anonymous" });

    if (!document.querySelector('script[data-qw-adsense="true"]')) {
      const adScript = document.createElement("script");
      adScript.async = true;
      adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      adScript.crossOrigin = "anonymous";
      adScript.setAttribute("data-qw-adsense", "true");
      document.head.appendChild(adScript);
    }

    if (GA_MEASUREMENT_ID && !document.querySelector('script[data-qw-ga="true"]')) {
      const gaLoader = document.createElement("script");
      gaLoader.async = true;
      gaLoader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      gaLoader.setAttribute("data-qw-ga", "true");
      document.head.appendChild(gaLoader);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID);
    }
  }

  function ensureUnifiedFooter() {
    let footer = document.querySelector(".site-footer");
    if (!footer) {
      footer = document.createElement("footer");
      footer.className = "site-footer";
      footer.setAttribute("role", "contentinfo");
      document.body.appendChild(footer);
    }

    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-brand">
          <a class="logo" href="${hrefForRootPage("index.html")}" aria-label="Qwickton Home">
            <span class="logo-mark">Q</span>
            <span>Qwickton</span>
          </a>
        </div>
        <nav class="footer-links" aria-label="Footer links">
          <a href="${hrefForRootPage("about.html")}">About</a>
          <a href="${hrefForRootPage("contact.html")}">Contact</a>
          <a href="${hrefForRootPage("terms.html")}">Terms</a>
          <a href="${hrefForRootPage("privacy.html")}">Privacy</a>
        </nav>
        <p class="footer-copy">© <span id="year"></span> Qwickton</p>
      </div>
    `;
  }

  function ensureHeaderActions() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const navWrap =
      header.querySelector(".nav-wrap") ||
      header.querySelector(".container") ||
      header;

    let navRight = navWrap.querySelector(".nav-right");
    if (!navRight) {
      navRight = document.createElement("div");
      navRight.className = "nav-right";
      navWrap.appendChild(navRight);
    }

    navRight.querySelectorAll(".header-home-btn,[data-qw-header-home='true']").forEach((node) => {
      node.remove();
    });

    const existingSearch =
      navRight.querySelector('[data-qw-header-search="true"]') ||
      navRight.querySelector(".header-search-btn");
    if (existingSearch) {
      existingSearch.setAttribute("data-qw-header-search", "true");
      existingSearch.setAttribute("type", "button");
      existingSearch.setAttribute("aria-label", "Open search");
      if (!existingSearch.textContent?.toLowerCase().includes("search")) {
        existingSearch.innerHTML = '<span aria-hidden="true">⌕</span><span>Search</span>';
      }
    } else {
      const searchButton = document.createElement("button");
      searchButton.className = "btn btn-ghost header-search-btn";
      searchButton.type = "button";
      searchButton.setAttribute("aria-label", "Open search");
      searchButton.setAttribute("data-qw-header-search", "true");
      searchButton.innerHTML = '<span aria-hidden="true">⌕</span><span>Search</span>';
      navRight.prepend(searchButton);
    }

    const existingMenu =
      navRight.querySelector('[data-qw-header-menu="true"]') ||
      navRight.querySelector("#headerMenuBtn") ||
      navRight.querySelector(".header-menu-btn");
    if (existingMenu) {
      existingMenu.setAttribute("data-qw-header-menu", "true");
      existingMenu.setAttribute("aria-label", "Open category menu");
      existingMenu.setAttribute("type", "button");
      if (!existingMenu.textContent?.toLowerCase().includes("menu")) {
        existingMenu.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
      }
    } else {
      const menuButton = document.createElement("button");
      menuButton.className = "btn btn-ghost header-menu-btn";
      menuButton.type = "button";
      menuButton.setAttribute("aria-label", "Open category menu");
      menuButton.setAttribute("data-qw-header-menu", "true");
      menuButton.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
      navRight.appendChild(menuButton);
    }

    navRight.querySelectorAll(".header-search-btn,[data-qw-header-search='true']").forEach((node, index) => {
      if (index > 0) node.remove();
    });
    navRight.querySelectorAll(".header-menu-btn,[data-qw-header-menu='true'],#headerMenuBtn").forEach((node, index) => {
      if (index > 0) node.remove();
    });

    const headerSearchButton = navRight.querySelector(".header-search-btn,[data-qw-header-search='true']");
    if (headerSearchButton && headerSearchButton.dataset.searchBound !== "true") {
      headerSearchButton.dataset.searchBound = "true";
      headerSearchButton.addEventListener("click", () => {
        if (document.querySelector("main[data-category-page]")) {
          if (typeof window.QwicktonOpenCategorySearch === "function") {
            window.QwicktonOpenCategorySearch();
          }
          return;
        }
        const launcherOpenButton = document.querySelector("[data-open-launcher='true']");
        launcherOpenButton?.click();
      });
    }
  }

  function ensureLeftCategoryMenu() {
    const categoryMeta = {
      "daily-tools": "📅",
      "image-tools": "🖼️",
      "passport-photo-maker": "📷",
      "pdf-tools": "📄",
      "text-tools": "📝",
      "converter-tools": "⇄",
      "security-tools": "🔐",
      "calculator-tools": "🧮",
      "design-tools": "🎨",
      "social-media-tools": "📲",
      "business-tools": "💼",
      "data-tools": "📊",
      "random-tools": "🎲",
      "file-tools": "📁",
      "font-tools": "Aa",
      "seo-tools": "🔍",
      "document-tools": "📋",
      "math-tools": "∑",
      "personal-tools": "👤",
      "productivity-tools": "✅",
      "developer-tools": "⚙️",
      "utility-tools": "⬛",
      "creator-tools": "🎬",
      "study-tools": "📚"
    };

    let overlay = document.getElementById("mobileOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mobileOverlay";
      overlay.className = "mobile-overlay";
      document.body.appendChild(overlay);
    }

    let drawer = document.getElementById("mobileDrawer");
    if (!drawer) {
      drawer = document.createElement("nav");
      drawer.id = "mobileDrawer";
      drawer.className = "mobile-drawer";
      drawer.setAttribute("aria-label", "Site menu");
      document.body.appendChild(drawer);
    }

    const quickLinks = `
      <a href="${hrefForRootPage("index.html")}">🏠 Home</a>
    `;
    const categoryLinks = CATEGORY_LIST
      .map((cat) => `<a href="${hrefForCategory(cat.slug)}">${categoryMeta[cat.slug] || "•"} ${cat.title}</a>`)
      .join("");

    drawer.innerHTML = `
      <div class="mobile-drawer-header">
        <a class="logo" href="${hrefForRootPage("index.html")}" aria-label="Qwickton Home">
          <span class="logo-mark">Q</span>
          <span>Qwickton</span>
        </a>
        <button class="btn btn-ghost icon-btn" id="closeDrawer" aria-label="Close menu" type="button">X</button>
      </div>
      <p class="drawer-section-title">Quick Access</p>
      <div class="mobile-drawer-links drawer-primary-links">${quickLinks}</div>
      <p class="drawer-section-title">Categories</p>
      <div class="drawer-search-wrap">
        <span class="header-search-icon" aria-hidden="true">⌕</span>
        <input id="drawerCategorySearch" type="search" placeholder="Search categories..." autocomplete="off" />
      </div>
      <div id="drawerCategoriesList" class="mobile-drawer-links">${categoryLinks}</div>
    `;

    const closeButton = drawer.querySelector("#closeDrawer");
    const categorySearchInput = drawer.querySelector("#drawerCategorySearch");
    const categoriesWrap = drawer.querySelector("#drawerCategoriesList");
    const openButtons = document.querySelectorAll('[data-qw-header-menu="true"], #headerMenuBtn');

    function openMenu() {
      body.classList.add("nav-open");
      if (categorySearchInput) {
        categorySearchInput.value = "";
        categoriesWrap?.querySelectorAll("a").forEach((link) => {
          link.style.display = "";
        });
      }
    }

    function closeMenu() {
      body.classList.remove("nav-open");
    }

    openButtons.forEach((btn) => {
      btn.addEventListener("click", openMenu);
    });
    closeButton?.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    categorySearchInput?.addEventListener("input", (event) => {
      const query = String(event.target.value || "").trim().toLowerCase();
      categoriesWrap?.querySelectorAll("a").forEach((link) => {
        const text = link.textContent.toLowerCase();
        link.style.display = !query || text.includes(query) ? "" : "none";
      });
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  body.classList.remove("dark");

  document.querySelectorAll("#year").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.addEventListener("click", async (event) => {
    const resultNode = event.target.closest(".result");
    if (!resultNode) return;
    const text = resultNode.textContent?.trim() || "";
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      resultNode.dataset.copied = "true";
      setTimeout(() => {
        resultNode.dataset.copied = "false";
      }, 1000);
    } catch (error) {
      void error;
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-category-link], .card-link, .quick-launch-item");
    if (!link) return;
    const href = link.getAttribute("href");
    const normalizedHref = normalizeCategoryHref(href);
    if (!normalizedHref || normalizedHref === href) return;
    link.setAttribute("href", normalizedHref);
  });

  document.querySelectorAll("a[data-category-link], .card-link, .quick-launch-item").forEach((link) => {
    const href = link.getAttribute("href");
    const normalizedHref = normalizeCategoryHref(href);
    if (normalizedHref) link.setAttribute("href", normalizedHref);
  });

  ensureGlobalMetaAndHead();
  ensureAmbientBackground();
  applyCategoryAmbientPalette();
  ensureHeaderActions();
  ensureLeftCategoryMenu();
  ensureUnifiedFooter();
  document.querySelectorAll("#year").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  normalizeRuntimeSeo();
})();
