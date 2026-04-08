import { Link } from "react-router-dom";
import { QUICK_PICK_TOOL_IDS, TOOL_CATALOG, type ToolEntry } from "../../app/toolCatalog";

const quickTools: ToolEntry[] = QUICK_PICK_TOOL_IDS.map((id) => TOOL_CATALOG.find((t) => t.id === id)).filter(
  (t): t is ToolEntry => Boolean(t)
);

/** Horizontal shortcuts for high-intent flows (especially phone / Safari discoverability). */
export function PopularQuickToolsStrip() {
  if (quickTools.length === 0) return null;
  return (
    <div className="quick-picks" aria-label="Quick picks — popular tools">
      <p className="quick-picks-label">Quick picks</p>
      <div className="quick-picks-scroll">
        {quickTools.map((t) => (
          <Link key={t.id} className="quick-pick-chip" to={t.path}>
            {t.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
