import { scrollToIdBelowStickyHeaderAfterPaint } from "../../lib/dom/scrollBelowStickyHeader";

/** Scroll the primary file drop / work anchor below the sticky header (deep links & handoff). */
export function scrollToolWorkAreaById(elementId: string): void {
  scrollToIdBelowStickyHeaderAfterPaint(elementId);
}

export const QWICKTON_TOOL_WORK_ID = "qwickton-tool-work";

/** Primary textarea on `/text` (Smart Drop + related-tool handoff scroll target). */
export const QWICKTON_TEXT_WORKSPACE_ID = "qwickton-text-workspace";
