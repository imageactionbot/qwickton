import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ToolWorkflowStrip } from "./ToolWorkflowStrip";

export type BreadcrumbItem = { label: string; to?: string };

type Props = {
  title: string;
  titleId?: string;
  children: ReactNode;
  busy?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  /** Omit for passport-style custom layouts; use text variant for paste-based hubs. */
  workflow?: "files" | "text" | false;
  /**
   * One-line “local-first” reminder under the workflow strip.
   * Default: on for file workflows only (off for text-only / custom layouts).
   */
  trustStrip?: boolean;
};

export function ToolPageShell({
  title,
  titleId = "tool-page-title",
  children,
  busy = false,
  breadcrumbs,
  workflow = "files",
  trustStrip,
}: Props) {
  const showTrust =
    trustStrip ?? (workflow === "files" || workflow === "text");
  return (
    <section className="tool-page" aria-labelledby={titleId} aria-busy={busy ? true : undefined}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="tool-breadcrumbs" aria-label="Breadcrumb">
          <ol className="tool-breadcrumbs-list">
            {breadcrumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="tool-breadcrumbs-item">
                {i > 0 ? (
                  <span className="tool-breadcrumbs-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {c.to ? (
                  <Link to={c.to} className="tool-breadcrumbs-link">
                    {c.label}
                  </Link>
                ) : (
                  <span className="tool-breadcrumbs-current" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h2 id={titleId}>{title}</h2>
      {busy ? (
        <p className="sr-only" aria-live="polite">
          Processing in this tab. Please wait until it finishes.
        </p>
      ) : null}
      {workflow ? <ToolWorkflowStrip variant={workflow} /> : null}
      {showTrust ? (
        <p className="tool-trust-strip">
          <span className="tool-trust-strip-badge" aria-hidden>
            Local
          </span>
          Your files stay on this device for these tools — nothing is uploaded to our servers for core workflows.
        </p>
      ) : null}
      {children}
    </section>
  );
}
