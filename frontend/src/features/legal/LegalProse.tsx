import type { ReactNode } from "react";

/** Shared typography wrapper for policy and legal pages. */
export function LegalProse({ children }: { children: ReactNode }) {
  return <div className="legal-prose">{children}</div>;
}
