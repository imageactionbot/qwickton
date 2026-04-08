import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { PdfToolsPage } from "../features/pdf/PdfToolsPage";
import { ImageToolsPage } from "../features/image/ImageToolsPage";
import { PassportStudioPage } from "../features/passport/PassportStudioPage";
import { BackgroundRemoverPage } from "../features/background/BackgroundRemoverPage";
import { ConverterHubPage } from "../features/converter/ConverterHubPage";
import { TextToolsPage } from "../features/text/TextToolsPage";
import { WordToolsPage } from "../features/word/WordToolsPage";
import { CommandPalette, isEditableDomTarget } from "../features/shell/CommandPalette";
import { SearchToolsPage } from "../features/shell/SearchToolsPage";
import { SmartDropPage } from "../features/shell/SmartDropPage";
import { PopularQuickToolsStrip } from "../features/shell/PopularQuickToolsStrip";
import { ScrollToTopFab } from "../features/shell/ScrollToTopFab";
import { ThemeToggle } from "../features/shell/ThemeToggle";
import { ToastHost } from "../features/shell/ToastHost";
import { sortToolEntriesByFuzzy } from "../lib/fuzzyRank";
import { PrivacyPage } from "../features/legal/PrivacyPage";
import { AboutPage } from "../features/legal/AboutPage";
import { TermsPage } from "../features/legal/TermsPage";
import { CookiesPage } from "../features/legal/CookiesPage";
import { usePageSeo } from "../lib/seo/usePageSeo";
import { useJsonLd } from "../lib/seo/jsonLd";
import { getSiteOrigin } from "../lib/seo/siteUrl";
import { TOOL_CATALOG, TOOL_CATALOG_COUNT } from "./toolCatalog";
import { HOME_INTERNATIONAL_KEYWORDS } from "../lib/seo/internationalSeo";
import { CATALOG_PAGE_SIZE, catalogDisplayRange, catalogSlicePage, catalogTotalPages } from "../lib/catalogPagination";
import { CatalogPaginationBar } from "../features/shared/CatalogPaginationBar";

/** Labels stored in localStorage from hub pages → deep link for “recent”. */
const RECENT_HUB_PATHS: Record<string, string> = {
  "PDF Tools": "/pdf",
  "Image Tools": "/image",
  "Passport Studio": "/passport",
  "Background Remove": "/background-remove",
  "Converter Hub": "/converter",
  "Word & DOCX": "/word",
  "Text Tools": "/text",
};

const FOCUS_CATALOG_SEARCH = "qwickton:focus-catalog-search";

const HOME_INTENT_PHRASES = [
  "merge PDFs",
  "compress passport JPG",
  "DOCX → PDF locally",
  "remove background (AI model)",
  "Canada 50×70 passport sheet",
  "Brazil 3×4 cm ID photo",
  "Excel ↔ CSV",
  "split a PDF",
  "extract images from PDF",
] as const;

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? "nav-link is-active" : "nav-link";
}

function useModKeyLabel(): string {
  return useMemo(() => (/mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? "⌘" : "Ctrl"), []);
}

function HomePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const mod = useModKeyLabel();
  const [query, setQuery] = useState("");
  const [intentIx, setIntentIx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "pdf" | "image" | "passport" | "background" | "converter" | "text" | "word"
  >("all");
  const [catalogPage, setCatalogPage] = useState(1);
  let recent: string[] = [];
  try {
    recent = JSON.parse(localStorage.getItem("qwickton_recent_tools") ?? "[]") as string[];
  } catch {
    recent = [];
  }

  const categoryCounts = useMemo(() => {
    const m: Partial<Record<(typeof TOOL_CATALOG)[number]["category"], number>> = {};
    for (const t of TOOL_CATALOG) {
      m[t.category] = (m[t.category] ?? 0) + 1;
    }
    return m as Record<(typeof TOOL_CATALOG)[number]["category"], number>;
  }, []);

  const filtered = useMemo(() => {
    const pool =
      activeCategory === "all" ? TOOL_CATALOG : TOOL_CATALOG.filter((t) => t.category === activeCategory);
    const q = query.trim();
    if (!q) return [...pool].sort((a, b) => a.title.localeCompare(b.title));
    return sortToolEntriesByFuzzy(pool, q);
  }, [query, activeCategory]);

  useEffect(() => {
    setCatalogPage(1);
  }, [query, activeCategory]);

  const catalogPages = catalogTotalPages(filtered.length, CATALOG_PAGE_SIZE);
  const safeCatalogPage = Math.min(Math.max(1, catalogPage), catalogPages);
  const pagedTools = catalogSlicePage(filtered, safeCatalogPage, CATALOG_PAGE_SIZE);
  const catalogRange = catalogDisplayRange(safeCatalogPage, filtered.length, CATALOG_PAGE_SIZE);
  usePageSeo(
    "Free PDF, image & document tools",
    `${TOOL_CATALOG_COUNT}+ free browser-local tools with intent-ranked search — PDF, images, Word, passport sheets, background removal (on-page AI model), converters, text utilities. Works worldwide (English UI); typos, aliases, and many non-English search phrases still find the right tool. Files stay on device; no login.`,
    {
      keywords: `${HOME_INTERNATIONAL_KEYWORDS}, free online tools, PDF merge online, compress JPG, passport photo online India, Word to PDF, remove background free, Excel to CSV, ilovepdf alternative`,
      openGraphTitle: `Qwickton — ${TOOL_CATALOG_COUNT}+ free browser tools for PDF, images, Word & more`,
    }
  );

  const origin = typeof window !== "undefined" ? getSiteOrigin() : "";

  const faqLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is Qwickton free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Core tools are free to use in the browser without an account.",
          },
        },
        {
          "@type": "Question",
          name: "Do my files get uploaded to your servers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Local-first tools process PDFs, images, and documents in your browser. We do not receive file contents for those workflows. Optional analytics may log tool metadata only, not document content.",
          },
        },
        {
          "@type": "Question",
          name: "Which browser works best?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Chrome, Edge, Firefox, and Safari (including iPhone) work for most local tools. Heavy on-device models (e.g. background removal) download extra assets only when you open those pages. For iPhone photos in HEIC, export as JPEG from Photos if a tool cannot preview the file.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use Qwickton from any country?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The site runs in your browser anywhere you have a normal internet connection. The interface is English, but search understands many synonyms and common non-English phrases as shortcuts to the same tools. Processing stays on your device for local-first workflows.",
          },
        },
      ],
    }),
    []
  );

  const webSiteLd = useMemo(() => {
    if (!origin) return null;
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Qwickton",
      url: origin,
      description:
        "Free browser-local utilities for PDF, images, Word DOCX, passport layouts, conversions, and text — privacy-focused, usable worldwide (English UI).",
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "Qwickton",
        url: origin,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/logo.svg`,
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${origin}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  }, [origin]);

  const itemListLd = useMemo(() => {
    if (!origin) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: TOOL_CATALOG_COUNT,
      itemListElement: TOOL_CATALOG.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `${origin}${t.path.startsWith("/") ? t.path : `/${t.path}`}`,
      })),
    };
  }, [origin]);

  useJsonLd("qk-ld-faq", faqLd);
  useJsonLd("qk-ld-website", webSiteLd);
  useJsonLd("qk-ld-itemlist", itemListLd);

  useEffect(() => {
    const onFocusCatalog = () => searchRef.current?.focus();
    window.addEventListener(FOCUS_CATALOG_SEARCH, onFocusCatalog);
    return () => window.removeEventListener(FOCUS_CATALOG_SEARCH, onFocusCatalog);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIntentIx((i) => (i + 1) % HOME_INTENT_PHRASES.length);
    }, 3400);
    return () => window.clearInterval(t);
  }, []);

  const categories: { id: typeof activeCategory; label: string }[] = [
    { id: "all", label: `All (${TOOL_CATALOG_COUNT})` },
    { id: "pdf", label: `PDF (${categoryCounts.pdf})` },
    { id: "image", label: `Image (${categoryCounts.image})` },
    { id: "passport", label: `Passport (${categoryCounts.passport})` },
    { id: "background", label: `Background (${categoryCounts.background})` },
    { id: "converter", label: `Converter (${categoryCounts.converter})` },
    { id: "word", label: `Word (${categoryCounts.word})` },
    { id: "text", label: `Text (${categoryCounts.text})` },
  ];

  return (
    <section className="tool-page">
      <div className="home-hero home-hero--ai">
        <p className="home-eyebrow">
          <span className="home-eyebrow-pulse" aria-hidden />
          Local-first · intent search · on-demand AI where it matters
        </p>
        <h2>Pro-quality tools for files &amp; text — in your browser</h2>
        <p className="home-intent-line" aria-live="polite">
          <span className="home-intent-label">Try asking for</span>
          <span className="home-intent-rotator" key={HOME_INTENT_PHRASES[intentIx]}>
            {HOME_INTENT_PHRASES[intentIx]}
          </span>
        </p>
        <p className="home-lead">
          <strong>{TOOL_CATALOG_COUNT}+ specialized tools</strong> with typo-forgiving, intent-ranked search — merge,
          convert, passport layouts, vision models where noted. Everything runs in your browser; files stay on device. No
          account.{" "}
          <span className="home-lead-shortcuts">
            Press <kbd className="home-kbd">/</kbd> to search here,{" "}
            <span className="home-kbd-combo" aria-label={`${mod === "⌘" ? "Command" : "Control"} plus K`}>
              <kbd className="home-kbd">{mod}</kbd>
              <span className="home-kbd-plus" aria-hidden>
                +
              </span>
              <kbd className="home-kbd">K</kbd>
            </span>{" "}
            for the command palette anywhere.
          </span>
        </p>
        <p className="home-lead-mobile-hint">
          Use search or <strong>Quick picks</strong> — open a tool and finish in seconds, not minutes.{" "}
          <Link to="/smart-drop" className="home-inline-link">
            Smart Drop
          </Link>{" "}
          matches files to tools when you are unsure where to start.
        </p>
        <ul className="home-value-strip" aria-label="What you get on Qwickton">
          <li className="home-value-item">
            <span className="home-value-icon" aria-hidden />
            <span>
              <strong>Zero upload queue</strong> — core tools run entirely in your tab
            </span>
          </li>
          <li className="home-value-item">
            <span className="home-value-icon home-value-icon--search" aria-hidden />
            <span>
              <strong>Intent search</strong> — typos, aliases, and quick shortcuts
            </span>
          </li>
          <li className="home-value-item">
            <span className="home-value-icon home-value-icon--bolt" aria-hidden />
            <span>
              <strong>Heavy models on demand</strong> — only when you open those pages
            </span>
          </li>
        </ul>
      </div>
      <label className="search-wrap">
        <span className="sr-only">Search tools</span>
        <input
          ref={searchRef}
          placeholder="Search by name (merge, passport, docx…) — or press / "
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
      </label>
      <PopularQuickToolsStrip />
      <div className="catalog-meta-row">
        <p className="catalog-count">
          {catalogPages > 1 ? (
            <>
              Tools {catalogRange.from}–{catalogRange.to} of {filtered.length} in this view
              {activeCategory !== "all" ? ` · ${activeCategory}` : ""} · {TOOL_CATALOG_COUNT} total
            </>
          ) : (
            <>
              Showing {filtered.length} of {TOOL_CATALOG_COUNT} tools
              {activeCategory !== "all" ? ` · ${activeCategory}` : ""}
            </>
          )}
        </p>
      </div>
      <div className="toolbar filter-toolbar" role="toolbar" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`filter-pill${activeCategory === c.id ? " is-active" : ""}`}
            aria-pressed={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="cost-note">
        <strong>Tip:</strong> Heavy models (e.g. background remove) load only when you open that page — the home list stays
        light. Open the <Link to="/search">full search page</Link> for shareable URLs with your query.
      </p>
      <div className="recent-strip">
        <p className="recent-label">Recently opened</p>
        {recent.length === 0 ? (
          <p className="recent-chip-muted">No recent hubs yet — process any tool once to pin it here.</p>
        ) : (
          recent.map((label) => {
            const to = RECENT_HUB_PATHS[label];
            return to ? (
              <Link key={label} className="recent-chip" to={to}>
                {label}
              </Link>
            ) : (
              <span key={label} className="recent-chip-muted">
                {label}
              </span>
            );
          })
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-hint-block" role="status">
          <p className="empty-hint">
            Nothing matches &quot;{query}&quot; in this category. Try another filter or clear the search box.
          </p>
          <button type="button" className="ghost-btn" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      ) : (
        <>
          <CatalogPaginationBar
            page={safeCatalogPage}
            totalItems={filtered.length}
            onPageChange={setCatalogPage}
            scrollTargetId="catalog-grid-top"
          />
          <div id="catalog-grid-top" className="catalog-grid-anchor" />
          <div className="grid grid--catalog">
            {pagedTools.map((tool) => (
              <Link key={tool.id} className="card card--rich" to={tool.path}>
                <span className="card-category-badge" data-cat={tool.category}>
                  {tool.category}
                </span>
                <span className="card-title-line">{tool.title}</span>
                <span className="card-desc">{tool.description}</span>
              </Link>
            ))}
          </div>
          <CatalogPaginationBar
            page={safeCatalogPage}
            totalItems={filtered.length}
            onPageChange={setCatalogPage}
            scrollTargetId="catalog-grid-top"
          />
        </>
      )}
      <section className="home-faq" aria-labelledby="home-faq-title">
        <h3 id="home-faq-title">Common questions</h3>
        <dl className="faq-list">
          <div className="faq-row">
            <dt>Is Qwickton free?</dt>
            <dd>Yes — use the tools in your browser without paying or creating an account.</dd>
          </div>
          <div className="faq-row">
            <dt>Do my files leave my device?</dt>
            <dd>
              Core workflows run locally. We do not receive your document bytes for those tools. Optional telemetry is
              limited to usage metadata.
            </dd>
          </div>
          <div className="faq-row">
            <dt>Why is the first “AI” background run slower?</dt>
            <dd>The on-device vision model downloads only when you open that page — the rest of the site stays light.</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}

function collectDrawerFocusables(drawer: HTMLElement): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return [...drawer.querySelectorAll<HTMLElement>(sel)].filter((el) => {
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
      if (el.disabled) return false;
    }
    return true;
  });
}

export function App() {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mod = useModKeyLabel();
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const prevMobileOpen = useRef(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const main = document.getElementById("main-content");
    const footer = document.querySelector(".shell-footer");
    if (mobileNavOpen) {
      main?.setAttribute("inert", "");
      footer?.setAttribute("inert", "");
    } else {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    }
    return () => {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (mobileNavOpen) {
      window.setTimeout(() => document.getElementById("mobile-drawer-close")?.focus(), 0);
    } else if (prevMobileOpen.current) {
      window.setTimeout(() => mobileMenuBtnRef.current?.focus(), 0);
    }
    prevMobileOpen.current = mobileNavOpen;
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const drawer = document.getElementById("mobile-drawer");
      if (!drawer) return;
      const list = collectDrawerFocusables(drawer);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen || paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, paletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paletteOpen) return;
      if (isEditableDomTarget(e.target)) return;
      if (e.key === "/" && location.pathname === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event(FOCUS_CATALOG_SEARCH));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.pathname, paletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMobile = () => setMobileNavOpen(false);

  return (
    <div className="app-shell app-shell--ai">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} tools={TOOL_CATALOG} />
      <ToastHost />
      {mobileNavOpen && (
        <>
          <div
            className="shell-drawer-backdrop no-print"
            role="presentation"
            onMouseDown={closeMobile}
            onTouchStart={closeMobile}
            aria-hidden
          />
          <div
            id="mobile-drawer"
            className="shell-drawer no-print"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-drawer-title"
          >
            <div className="shell-drawer-header">
              <p id="mobile-drawer-title" className="shell-drawer-title">
                <img
                  className="shell-drawer-title-logo"
                  src="/logo.svg"
                  width="22"
                  height="22"
                  alt=""
                  decoding="async"
                />
                Navigate
              </p>
              <button
                type="button"
                id="mobile-drawer-close"
                className="shell-drawer-close"
                onClick={closeMobile}
                aria-label="Close menu"
              >
                <span aria-hidden>×</span>
              </button>
            </div>
            <nav aria-label="Mobile primary">
              <NavLink to="/" end className={navClass} onClick={closeMobile}>
                All tools
              </NavLink>
              <NavLink to="/search" className={navClass} onClick={closeMobile}>
                Search
              </NavLink>
              <NavLink to="/smart-drop" end className={navClass} onClick={closeMobile}>
                Smart Drop
              </NavLink>
              <NavLink to="/pdf" className={navClass} onClick={closeMobile}>
                PDF
              </NavLink>
              <NavLink to="/image" className={navClass} onClick={closeMobile}>
                Image
              </NavLink>
              <NavLink to="/passport" className={navClass} onClick={closeMobile}>
                Passport
              </NavLink>
              <NavLink to="/background-remove" className={navClass} onClick={closeMobile}>
                Background
              </NavLink>
              <NavLink to="/converter" className={navClass} onClick={closeMobile}>
                Converter
              </NavLink>
              <NavLink to="/word" className={navClass} onClick={closeMobile}>
                Word
              </NavLink>
              <NavLink to="/text" className={navClass} onClick={closeMobile}>
                Text
              </NavLink>
            </nav>
            <button
              type="button"
              className="header-cmd-btn header-cmd-btn--drawer"
              onClick={() => {
                closeMobile();
                setPaletteOpen(true);
              }}
            >
              <span className="header-cmd-btn-label">Search all tools</span>
            </button>
            <div className="shell-drawer-legal">
              <p className="shell-drawer-legal-title">Legal</p>
              <nav aria-label="Mobile legal">
                <NavLink to="/about" className={navClass} onClick={closeMobile}>
                  About
                </NavLink>
                <NavLink to="/privacy" className={navClass} onClick={closeMobile}>
                  Privacy
                </NavLink>
                <NavLink to="/terms" className={navClass} onClick={closeMobile}>
                  Terms
                </NavLink>
                <NavLink to="/cookies" className={navClass} onClick={closeMobile}>
                  Cookies
                </NavLink>
              </nav>
            </div>
          </div>
        </>
      )}
      <header className={`shell-header${mobileNavOpen ? " is-menu-open" : ""}`}>
        <div className="shell-header-inner">
          <div className="shell-header-left">
            <div className="shell-brand">
              <Link to="/" className="shell-brand-link">
                <span className="shell-brand-mark" aria-hidden="true">
                  <img
                    className="shell-brand-logo-img"
                    src="/logo.svg"
                    width="40"
                    height="40"
                    alt=""
                    decoding="async"
                  />
                  <span className="shell-brand-mark-shine" aria-hidden />
                </span>
                <div className="shell-brand-text">
                  <h1 className="shell-brand-name">Qwickton</h1>
                  <p className="shell-brand-tag">Fast tools · private by design</p>
                </div>
              </Link>
            </div>
          </div>
          <div className="shell-header-cluster">
            <nav className="shell-nav shell-nav--desktop" aria-label="Primary">
              <ul className="shell-nav-list">
                <li>
                  <NavLink to="/" end className={navClass}>
                    All tools
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/search" className={navClass}>
                    Search
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/smart-drop" end className={navClass}>
                    Smart Drop
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/pdf" className={navClass}>
                    PDF
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/image" className={navClass}>
                    Image
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/passport" className={navClass}>
                    Passport
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/background-remove" className={navClass}>
                    Background
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/converter" className={navClass}>
                    Converter
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/word" className={navClass}>
                    Word
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/text" className={navClass}>
                    Text
                  </NavLink>
                </li>
              </ul>
            </nav>
            <div className="shell-header-actions">
              <button
                type="button"
                className="header-cmd-btn header-cmd-btn--compact"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette (search tools)"
              >
                <svg
                  className="header-cmd-icon"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="sr-only">Search tools</span>
              </button>
              <button
                type="button"
                className="header-cmd-btn header-cmd-btn--full"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
              >
                <span className="header-cmd-btn-label">Search tools</span>
                <span className="header-cmd-kbd" aria-hidden>
                  <kbd>{mod}</kbd>
                  <kbd>K</kbd>
                </span>
              </button>
            </div>
            <button
              ref={mobileMenuBtnRef}
              type="button"
              className={`mobile-menu-btn no-print${mobileNavOpen ? " is-open" : ""}`}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <span className="sr-only">{mobileNavOpen ? "Close menu" : "Open menu"}</span>
              <span className="mobile-menu-btn-bar" aria-hidden />
              <span className="mobile-menu-btn-bar" aria-hidden />
              <span className="mobile-menu-btn-bar" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <section className="shell-site-intro" aria-label="What Qwickton offers">
        <p>
          <strong>Free online tools</strong> for PDFs, images, Microsoft Word (DOCX), passport and ID photo layouts,
          converters, spreadsheets, and text — merge and split PDFs, compress JPG and PNG, export Word to PDF, match
          files with <Link to="/smart-drop">Smart Drop</Link>, and use on-device background removal where offered.{" "}
          <strong>Polished, fast UI</strong>; heavier AI models load only when you open those pages.{" "}
          <strong>Privacy-first:</strong> core workflows run in your browser on your device, with no account required.
        </p>
      </section>
      <main id="main-content" className="app-main-region" tabIndex={-1}>
        <div className="app-page-flow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchToolsPage />} />
            <Route path="/smart-drop" element={<SmartDropPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/pdf" element={<PdfToolsPage />} />
            <Route path="/image" element={<ImageToolsPage />} />
            <Route path="/passport" element={<PassportStudioPage />} />
            <Route path="/background-remove" element={<BackgroundRemoverPage />} />
            <Route path="/converter" element={<ConverterHubPage />} />
            <Route path="/word" element={<WordToolsPage />} />
            <Route path="/text" element={<TextToolsPage />} />
          </Routes>
        </div>
      </main>
      <footer className="shell-footer">
        <div className="shell-footer-brand">
          <img className="shell-footer-logo" src="/logo.svg" width="36" height="36" alt="" decoding="async" />
          <div>
            <p className="shell-footer-brand-name">Qwickton</p>
            <p className="shell-footer-brand-tag">Fast tools. Your device. Your files.</p>
          </div>
        </div>
        <div className="shell-footer-grid">
          <p>
            <strong>Privacy:</strong> The work happens in your browser. We do not receive your files or document contents for
            these local tools.
          </p>
          <p>
            <strong>Open source ethos:</strong> No account wall — pick a tool and go. Works best in a modern desktop browser.
          </p>
          <nav className="shell-footer-links" aria-label="Legal and about">
            <Link to="/about">About</Link>
            <span aria-hidden className="shell-footer-dot">
              ·
            </span>
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden className="shell-footer-dot">
              ·
            </span>
            <Link to="/terms">Terms</Link>
            <span aria-hidden className="shell-footer-dot">
              ·
            </span>
            <Link to="/cookies">Cookies</Link>
            <span aria-hidden className="shell-footer-dot">
              ·
            </span>
            <Link to="/search">Search</Link>
          </nav>
        </div>
      </footer>
      <div className="theme-toggle-fab-host no-print">
        <ThemeToggle variant="fab" />
      </div>
      <ScrollToTopFab suppressed={mobileNavOpen || paletteOpen} />
    </div>
  );
}
