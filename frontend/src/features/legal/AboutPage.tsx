import { usePageSeo } from "../../lib/seo/usePageSeo";
import { ToolPageShell } from "../shared/ToolPageShell";
import { Link } from "react-router-dom";
import { LegalProse } from "./LegalProse";

export function AboutPage() {
  usePageSeo(
    "About",
    "Qwickton: fast, privacy-focused browser tools for PDF, images, Word DOCX, passport layouts, and text — how it works and what to expect.",
    { keywords: "Qwickton, about, browser tools, PDF, privacy" }
  );

  return (
    <ToolPageShell
      title="About Qwickton"
      trustStrip={false}
      breadcrumbs={[
        { label: "All tools", to: "/" },
        { label: "About" },
      ]}
    >
      <LegalProse>
        <p className="legal-updated">
          <strong>Last updated:</strong> April 8, 2026
        </p>
        <h3>What is Qwickton?</h3>
        <p>
          Qwickton is a collection of utilities that run primarily in your web browser — merge or split PDFs, compress or
          convert images, work with DOCX previews, build passport photo sheets, convert spreadsheets, encode text, and more.
          The goal is speed and privacy: do common file tasks without uploading documents to an app backend when the tool is
          designed for local processing.
        </p>

        <h3>How it works</h3>
        <p>
          Most tools use modern browser APIs, Web Workers, and optional WebAssembly modules so heavy work stays on your
          device. Pick a tool from the <Link to="/">home catalog</Link> or the navigation menu, choose your files or paste
          text, then download the result. Heavy AI features may download models the first time you open those pages.
        </p>

        <h3>Who should use it?</h3>
        <p>
          Anyone who needs quick one-off conversions or cleanup. For regulated, legal, medical, financial, or immigration
          workflows, always verify outputs and consult a professional; see our <Link to="/terms">Terms of Service</Link>{" "}
          disclaimers.
        </p>

        <h3>Privacy in brief</h3>
        <p>
          We design core flows so your file contents stay in the browser. Network activity may still occur for fonts, models,
          hosting, or optional analytics — details are in the <Link to="/privacy">Privacy Policy</Link> and{" "}
          <Link to="/cookies">Cookies &amp; storage</Link> pages.
        </p>

        <h3>Legal &amp; notices</h3>
        <ul className="legal-list">
          <li>
            <Link to="/terms">Terms of Service</Link>
          </li>
          <li>
            <Link to="/privacy">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/cookies">Cookies &amp; storage</Link>
          </li>
        </ul>

        <p className="legal-crosslinks">
          Questions? Use the contact method published on this site&apos;s domain by the operator hosting this deployment.
        </p>
      </LegalProse>
    </ToolPageShell>
  );
}
