/**
 * Shared helpers + category workspace panel for all tool category pages.
 */
(function () {
  "use strict";

  function buildCategoryToolsApi(toolsGrid) {
    function createCard(title, bodyHtml) {
      const card = document.createElement("article");
      card.className = "tool-card";
      card.innerHTML = `<h3>${title}</h3>${bodyHtml}`;
      toolsGrid.appendChild(card);
      return card;
    }

    function safeNum(value, fallback = 0) {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function utf8ToBase64(value) {
      const bytes = new TextEncoder().encode(String(value ?? ""));
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return btoa(binary);
    }

    function base64ToUtf8(value) {
      const binary = atob(String(value ?? ""));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }

    function secureRandomInt(maxExclusive) {
      if (maxExclusive <= 0) return 0;
      if (window.crypto?.getRandomValues) {
        const range = 0x100000000;
        const limit = Math.floor(range / maxExclusive) * maxExclusive;
        const buffer = new Uint32Array(1);
        do {
          window.crypto.getRandomValues(buffer);
        } while (buffer[0] >= limit);
        return buffer[0] % maxExclusive;
      }
      return Math.floor(Math.random() * maxExclusive);
    }

    function downloadTextFile(filename, content, type = "text/plain") {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        const next = text[i + 1];
        if (ch === '"') {
          if (inQuotes && next === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          row.push(cell);
          cell = "";
        } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
          if (ch === "\r" && next === "\n") i += 1;
          row.push(cell);
          if (row.some((r) => r !== "")) rows.push(row);
          row = [];
          cell = "";
        } else {
          cell += ch;
        }
      }
      row.push(cell);
      if (row.some((r) => r !== "")) rows.push(row);
      return rows;
    }

    function csvEscape(value) {
      const str = String(value ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    }

    return {
      createCard,
      safeNum,
      escapeHtml,
      utf8ToBase64,
      base64ToUtf8,
      secureRandomInt,
      downloadTextFile,
      parseCsv,
      csvEscape,
      toolsGrid,
    };
  }

  function slugToTitle(slug) {
    return String(slug || "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function normalizeId(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function cardTitle(card, index) {
    const title = card.querySelector("h3")?.textContent?.trim();
    return title || `Tool ${index + 1}`;
  }

  function collectCategoryCards(toolsGrid) {
    if (!toolsGrid) return [];
    const candidates = Array.from(
      toolsGrid.querySelectorAll(
        ":scope > article, :scope > section, :scope > div",
      ),
    );
    const cards = candidates.filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const cls = node.className || "";
      return (
        node.classList.contains("tool-card") ||
        node.hasAttribute("data-tool") ||
        node.id.startsWith("card-") ||
        /\b[a-z0-9-]*card\b/i.test(cls)
      );
    });
    cards.forEach((card, index) => {
      if (!card.classList.contains("tool-card")) card.classList.add("tool-card");
      const title = cardTitle(card, index);
      const toolId = card.dataset.toolId || card.dataset.tool || normalizeId(title) || `tool-${index + 1}`;
      card.dataset.toolId = toolId;
      card.id = card.id || `tool-${toolId}`;
    });
    return cards;
  }

  function ensureCategoryHeroShell(ctx) {
    const { slug, config } = ctx;
    const main = document.querySelector("main[data-category-page]");
    if (!main) return;
    if (!main.querySelector(".premium-category-shell")) {
      const heading = main.querySelector("#categoryTitle");
      const description = main.querySelector("#categoryDescription");
      if (heading && description) {
        const shell = document.createElement("section");
        shell.className = "panel premium-category-shell";
        shell.innerHTML = `
          <div class="hero-badge">Private · Fast · Browser-Only</div>
          <div class="trust-bar" role="list" aria-label="Category highlights">
            <span role="listitem">No upload required</span>
            <span role="listitem">Instant output</span>
            <span role="listitem">Free tools</span>
            <span role="listitem">Local processing</span>
          </div>
          <div class="small premium-shell-note">
            Category: ${slugToTitle(slug)} | Built for practical everyday workflows.
          </div>
        `;
        description.insertAdjacentElement("afterend", shell);
      }
    }

    if (!main.querySelector(".faq-section.premium-category-faq")) {
      const faq = document.createElement("section");
      faq.className = "faq-section premium-category-faq";
      faq.setAttribute("aria-label", "Category FAQ");
      faq.innerHTML = `
        <h2>Quick FAQ</h2>
        <div class="faq-list">
          <details class="faq-item">
            <summary>Are these tools free to use?</summary>
            <p>Yes. All category tools are free and run directly in your browser.</p>
          </details>
          <details class="faq-item">
            <summary>Does data leave my device?</summary>
            <p>No. Core workflows run client-side and process data locally where possible.</p>
          </details>
          <details class="faq-item">
            <summary>Can I use these tools on mobile?</summary>
            <p>Yes. Category pages are responsive and optimized for both mobile and desktop.</p>
          </details>
        </div>
      `;
      main.appendChild(faq);
    }
  }

  function buildToolNavigation(toolsGrid) {
    collectCategoryCards(toolsGrid);
  }

  function initFocusModalForTools(toolsGrid) {
    if (document.body.querySelector(".tool-focus-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "tool-focus-overlay";
    const host = document.createElement("div");
    host.className = "tool-focus-host";
    document.body.appendChild(overlay);
    document.body.appendChild(host);

    let activeCard = null;
    let placeholder = null;

    function closeFocus() {
      if (!activeCard) return;
      activeCard.classList.remove("tool-card-focused");
      activeCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeCard.querySelector("[data-focus-close]")?.classList.remove("active");
      if (placeholder?.parentNode) {
        placeholder.parentNode.insertBefore(activeCard, placeholder);
        placeholder.remove();
      }
      activeCard = null;
      placeholder = null;
      overlay.classList.remove("active");
      host.classList.remove("active");
      document.body.classList.remove("tool-modal-open");
    }

    function openFocus(card) {
      if (!card || activeCard === card) return;
      closeFocus();
      activeCard = card;
      placeholder = document.createElement("div");
      placeholder.className = "tool-focus-placeholder";
      card.parentNode?.insertBefore(placeholder, card);
      host.appendChild(card);
      card.classList.add("tool-card-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      overlay.classList.add("active");
      host.classList.add("active");
      document.body.classList.add("tool-modal-open");
      const firstFocusable = card.querySelector("input, select, textarea, button");
      firstFocusable?.focus();
    }

    collectCategoryCards(toolsGrid).forEach((card) => {
      if (card.querySelector("[data-focus-open]")) return;
      const controls = document.createElement("div");
      controls.className = "tool-focus-controls";
      controls.innerHTML = `
        <button class="btn btn-secondary" type="button" data-focus-open>Open</button>
        <button class="btn btn-secondary" type="button" data-focus-close>Close</button>
      `;
      card.insertBefore(controls, card.firstChild);
      controls.querySelector("[data-focus-open]")?.addEventListener("click", () => openFocus(card));
      controls.querySelector("[data-focus-close]")?.addEventListener("click", closeFocus);
    });

    overlay.addEventListener("click", closeFocus);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeFocus();
    });
  }

  function ensureMinimumTools(api, minimumCount = 4) {
    void api;
    void minimumCount;
    // Intentionally disabled: generic fallback tools were being injected across categories.
  }

  function initCategoryPremiumLayer(ctx) {
    const { toolsGrid } = ctx;
    if (!toolsGrid) return;
    ensureCategoryHeroShell(ctx);
    buildToolNavigation(toolsGrid);
    initFocusModalForTools(toolsGrid);
  }

  function initCategoryAdvancedLayer(ctx) {
    const { toolsGrid } = ctx;
    initFocusModalForTools(toolsGrid);
    const normalizedCards = () => collectCategoryCards(toolsGrid);
    let searchQuery = "";

    function applySearch(queryValue = searchQuery) {
      const query = String(queryValue || "").trim().toLowerCase();
      searchQuery = queryValue || "";
      normalizedCards().forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = !query || text.includes(query) ? "" : "none";
      });
    }

    function toolEntries() {
      return normalizedCards().map((card, index) => {
        const title = cardTitle(card, index);
        return {
          id: card.dataset.toolId || card.id || `tool-${index + 1}`,
          title,
          searchText: `${title} ${card.textContent || ""}`.toLowerCase(),
          card,
        };
      });
    }

    const modal = document.createElement("div");
    modal.className = "category-search-modal";
    modal.innerHTML = `
      <div class="category-search-modal-backdrop" data-search-backdrop></div>
      <div class="category-search-modal-panel" role="dialog" aria-modal="true" aria-label="Search tools popup">
        <div class="category-search-modal-head">
          <strong>Search Tools</strong>
          <button type="button" class="btn btn-secondary category-search-close" data-search-close>Close</button>
        </div>
        <input type="search" class="category-search-modal-input" placeholder="Type tool name..." aria-label="Search tools popup input" data-search-popup-input />
        <div class="category-search-results" data-search-results></div>
      </div>
    `;
    document.body.appendChild(modal);
    const popupInput = modal.querySelector("[data-search-popup-input]");
    const resultsHost = modal.querySelector("[data-search-results]");
    const closeBtn = modal.querySelector("[data-search-close]");
    const backdrop = modal.querySelector("[data-search-backdrop]");

    function renderResults(queryValue = "") {
      const query = String(queryValue || "").trim().toLowerCase();
      const entries = toolEntries();
      const filtered = !query ? entries : entries.filter((entry) => entry.searchText.includes(query));
      if (!filtered.length) {
        resultsHost.innerHTML = '<div class="category-search-empty">No matching tool found.</div>';
        return;
      }
      resultsHost.innerHTML = filtered
        .map(
          (entry, index) => `
          <button type="button" class="category-search-result-item" data-search-target="${entry.id}">
            <span class="category-search-result-index">${index + 1}.</span>
            <span class="category-search-result-title">${entry.title}</span>
          </button>
        `,
        )
        .join("");
      resultsHost.querySelectorAll("[data-search-target]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.getAttribute("data-search-target");
          const entry = entries.find((item) => item.id === target);
          if (!entry) return;
          applySearch(popupInput.value);
          closeSearchModal();
          entry.card.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    function openSearchModal() {
      modal.classList.add("open");
      popupInput.value = searchQuery;
      renderResults(popupInput.value);
      popupInput.focus();
      popupInput.select();
    }

    function closeSearchModal() {
      modal.classList.remove("open");
      if (!popupInput.value.trim()) {
        applySearch("");
        renderResults("");
      }
    }
    closeBtn?.addEventListener("click", closeSearchModal);
    backdrop?.addEventListener("click", closeSearchModal);
    popupInput.addEventListener("input", () => {
      applySearch(popupInput.value);
      renderResults(popupInput.value);
    });
    popupInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (popupInput.value.trim()) {
          popupInput.value = "";
          applySearch("");
          renderResults("");
          return;
        }
        closeSearchModal();
      }
    });

    applySearch();
    window.QwicktonOpenCategorySearch = openSearchModal;
    window.QwicktonCloseCategorySearch = closeSearchModal;

    if (!document.body.dataset.qwCategorySearchHotkeyBound) {
      document.body.dataset.qwCategorySearchHotkeyBound = "true";
      document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          if (typeof window.QwicktonOpenCategorySearch === "function") {
            window.QwicktonOpenCategorySearch();
            return;
          }
        }
      });
    }
  }

  window.QwicktonCategoryCore = {
    buildCategoryToolsApi,
    ensureMinimumTools,
    initCategoryPremiumLayer,
    initCategoryAdvancedLayer,
  };
})();
