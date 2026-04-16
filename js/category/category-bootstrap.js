/**
 * Mounts one category page: reads data-category-page, applies meta, runs page bundle + workspace panel.
 */
(function () {
  const root = document.querySelector("[data-category-page]");
  if (!root) return;

  const slug = root.getAttribute("data-category-page");
  const titleNode = document.getElementById("categoryTitle");
  const descNode = document.getElementById("categoryDescription");
  const crumbNode = document.getElementById("categoryCrumb");
  const toolsGrid = document.getElementById("categoryToolGrid");
  if (!toolsGrid || !slug) return;

  const meta = window.QwicktonCategoryMeta && window.QwicktonCategoryMeta[slug];
  const init = window.QwicktonCategoryInits && window.QwicktonCategoryInits[slug];
  if (!meta || typeof init !== "function") {
    return;
  }

  if (titleNode) titleNode.textContent = meta.title;
  if (descNode) descNode.textContent = meta.description;
  if (crumbNode) crumbNode.textContent = meta.title;
  document.title = `${meta.title} - Qwickton`;

  const core = window.QwicktonCategoryCore;
  if (!core || typeof core.buildCategoryToolsApi !== "function") {
    return;
  }

  const base = core.buildCategoryToolsApi(toolsGrid);
  const api = Object.assign({}, base, {
    slug,
    titleNode,
    descNode,
    crumbNode,
  });

  init(api);
  // Disabled generic auto-injected filler tools (Quick Notes Pad / Output Formatter)
  // to keep category pages limited to their dedicated tool sets only.
  if (
    typeof core.initCategoryPremiumLayer === "function" &&
    slug !== "business-tools" &&
    slug !== "daily-tools" &&
    slug !== "passport-photo-maker" &&
    slug !== "calculator-tools"
  ) {
    core.initCategoryPremiumLayer({
      slug,
      toolsGrid,
      config: meta,
      titleNode,
      descNode,
      crumbNode,
    });
  }
  core.initCategoryAdvancedLayer({
    slug,
    toolsGrid,
    config: meta,
    downloadTextFile: base.downloadTextFile,
  });
})();
