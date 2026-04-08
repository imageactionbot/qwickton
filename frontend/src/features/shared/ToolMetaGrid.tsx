import type { ReactNode } from "react";

/** Shared wrapper for compact file / stats rows (uses pdf-meta-grid styles). */
export function ToolMetaGrid({ children }: { children: ReactNode }) {
  return <div className="pdf-meta-grid">{children}</div>;
}
