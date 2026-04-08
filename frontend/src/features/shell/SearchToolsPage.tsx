import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TOOL_CATALOG, TOOL_CATALOG_COUNT } from "../../app/toolCatalog";
import { sortToolEntriesByFuzzy, suggestQueryCorrection } from "../../lib/fuzzyRank";
import { CATALOG_PAGE_SIZE, catalogDisplayRange, catalogSlicePage, catalogTotalPages } from "../../lib/catalogPagination";
import { usePageSeo } from "../../lib/seo/usePageSeo";
import { CatalogPaginationBar } from "../shared/CatalogPaginationBar";
import { PopularQuickToolsStrip } from "./PopularQuickToolsStrip";

export function SearchToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "pdf" | "image" | "passport" | "background" | "converter" | "text" | "word"
  >("all");

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const categoryCounts = useMemo(() => {
    const m: Partial<Record<(typeof TOOL_CATALOG)[number]["category"], number>> = {};
    for (const t of TOOL_CATALOG) {
      m[t.category] = (m[t.category] ?? 0) + 1;
    }
    return m as Record<(typeof TOOL_CATALOG)[number]["category"], number>;
  }, []);

  const categoryPool = useMemo(
    () => (activeCategory === "all" ? TOOL_CATALOG : TOOL_CATALOG.filter((t) => t.category === activeCategory)),
    [activeCategory]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [...categoryPool].sort((a, b) => a.title.localeCompare(b.title));
    return sortToolEntriesByFuzzy(categoryPool, q);
  }, [query, categoryPool]);

  const didYouMean = useMemo(() => {
    if (!query.trim() || filtered.length > 0) return null;
    return suggestQueryCorrection(query, categoryPool);
  }, [query, filtered.length, categoryPool]);

  const pageFromUrl = useMemo(() => {
    const raw = parseInt(searchParams.get("p") ?? "1", 10);
    return Number.isFinite(raw) && raw >= 1 ? raw : 1;
  }, [searchParams]);

  const catalogPages = catalogTotalPages(filtered.length, CATALOG_PAGE_SIZE);
  const safeCatalogPage = Math.min(Math.max(1, pageFromUrl), catalogPages);
  const pagedTools = catalogSlicePage(filtered, safeCatalogPage, CATALOG_PAGE_SIZE);
  const catalogRange = catalogDisplayRange(safeCatalogPage, filtered.length, CATALOG_PAGE_SIZE);

  useEffect(() => {
    const max = catalogTotalPages(filtered.length, CATALOG_PAGE_SIZE);
    const raw = parseInt(searchParams.get("p") ?? "1", 10);
    const cur = Number.isFinite(raw) && raw >= 1 ? raw : 1;
    if (cur <= max) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (max <= 1) p.delete("p");
        else p.set("p", String(max));
        return p;
      },
      { replace: true }
    );
  }, [filtered.length, searchParams, setSearchParams]);

  usePageSeo(
    qParam.trim() ? `Search: ${qParam.trim()}` : "Search tools",
    qParam.trim()
      ? `Results for “${qParam.trim()}” — ${filtered.length} matching free browser tools on Qwickton.`
      : `Search ${TOOL_CATALOG_COUNT}+ free tools: PDF, Word DOCX, images, passport sheets, CSV/Excel, and text utilities — all local-first.`,
    {
      keywords:
        "search tools, Qwickton, PDF, DOCX, passport photo, image compress, CSV, Excel, privacy, browser tools",
    }
  );

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

  const syncUrl = (nextQ: string) => {
    setQuery(nextQ);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        const t = nextQ.trim();
        if (t) p.set("q", t);
        else p.delete("q");
        p.delete("p");
        return p;
      },
      { replace: true }
    );
  };

  const setCatalogPageInUrl = (nextPage: number) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (nextPage <= 1) p.delete("p");
        else p.set("p", String(nextPage));
        return p;
      },
      { replace: true }
    );
  };

  return (
    <section className="tool-page">
      <nav className="tool-breadcrumbs" aria-label="Breadcrumb">
        <ol className="tool-breadcrumbs-list">
          <li className="tool-breadcrumbs-item">
            <Link to="/" className="tool-breadcrumbs-link">
              All tools
            </Link>
            <span className="tool-breadcrumbs-sep" aria-hidden>
              /
            </span>
          </li>
          <li className="tool-breadcrumbs-item">
            <span className="tool-breadcrumbs-current" aria-current="page">
              Search
            </span>
          </li>
        </ol>
      </nav>
      <h2 id="search-page-title">Search tools</h2>
      <p className="ai-ranking-banner" role="status">
        <span className="ai-ranking-banner-icon" aria-hidden />
        Intent-aware ranking: fuzzy phrases, aliases, and informal keyword variants beat plain-text matching.
      </p>
      <p className="cost-note">
        Typo-tolerant matching (e.g. <strong>mearge</strong> → merge, <strong>pasport</strong> → passport) runs entirely
        in your browser across titles, descriptions, and synonyms.
      </p>
      <label className="search-wrap">
        <span className="sr-only">Search query</span>
        <input
          className="search-input"
          placeholder="Type to search…"
          value={query}
          onChange={(e) => syncUrl(e.target.value)}
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
              Showing {catalogRange.from}–{catalogRange.to} of {filtered.length} result{filtered.length === 1 ? "" : "s"}
              {activeCategory !== "all" ? ` · ${activeCategory}` : ""}
            </>
          ) : (
            <>
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
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
            onClick={() => {
              setActiveCategory(c.id);
              setSearchParams(
                (prev) => {
                  const p = new URLSearchParams(prev);
                  p.delete("p");
                  return p;
                },
                { replace: true }
              );
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-hint-block" role="status">
          <p className="empty-hint">
            Nothing matches &quot;{query.trim()}&quot; in this category. Try clearing the query or pick &quot;All&quot;.
          </p>
          {didYouMean && (
            <p className="empty-hint">
              Did you mean{" "}
              <button type="button" className="ghost-btn" onClick={() => syncUrl(didYouMean)}>
                “{didYouMean}”
              </button>
              ?
            </p>
          )}
          <button type="button" className="ghost-btn" onClick={() => syncUrl("")}>
            Clear search
          </button>
        </div>
      ) : (
        <>
          <CatalogPaginationBar
            page={safeCatalogPage}
            totalItems={filtered.length}
            onPageChange={setCatalogPageInUrl}
            scrollTargetId="search-catalog-top"
          />
          <div id="search-catalog-top" className="catalog-grid-anchor" />
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
            onPageChange={setCatalogPageInUrl}
            scrollTargetId="search-catalog-top"
          />
        </>
      )}
    </section>
  );
}
