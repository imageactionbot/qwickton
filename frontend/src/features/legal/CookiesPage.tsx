import { Link } from "react-router-dom";
import { usePageSeo } from "../../lib/seo/usePageSeo";
import { ToolPageShell } from "../shared/ToolPageShell";
import { LegalProse } from "./LegalProse";

export function CookiesPage() {
  usePageSeo(
    "Cookies and storage",
    "How Qwickton uses browser storage, local data, fonts, and optional analytics — and how you can control preferences.",
    { keywords: "Qwickton cookies, local storage, browser storage, privacy" }
  );

  return (
    <ToolPageShell
      title="Cookies & storage"
      trustStrip={false}
      breadcrumbs={[
        { label: "All tools", to: "/" },
        { label: "Cookies & storage" },
      ]}
    >
      <LegalProse>
        <p className="legal-updated">
          <strong>Last updated:</strong> April 8, 2026
        </p>
        <p>
          This notice describes how Qwickton and the technologies it loads may store or read information in your browser.
          It should be read together with our <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <h3>1. Strictly necessary / functional</h3>
        <p>
          The Service may use mechanisms that are necessary for basic operation, including in-memory state while you use the
          app, and a service worker (if enabled) to support offline fallback or caching as implemented on your deployment.
        </p>

        <h3>2. Local storage</h3>
        <p>
          We may use <code>localStorage</code> (or similar APIs) for lightweight preferences, such as remembering recently
          opened tool hubs. This data stays on your device unless you clear site data in your browser. It is not
          automatically sent to us as part of normal tool processing.
        </p>

        <h3>3. Optional analytics</h3>
        <p>
          The codebase may attempt to send <strong>metadata-only</strong> events (for example which tool ran and timing) to a
          path such as <code>/tools/api/analytics-event</code> on the same host. If that endpoint is not configured, the
          request typically fails silently and no server-side log is created by Qwickton. No file contents are included in
          these payloads by design.
        </p>

        <h3>4. Fonts and third-party requests</h3>
        <p>
          This site may load fonts from Google Fonts (or another CDN). Those providers may receive technical data such as
          your IP address and User-Agent as part of a standard HTTP request. See their privacy policies for details. You
          can block such requests with browser or network controls; the UI may fall back to system fonts.
        </p>

        <h3>5. Advertising</h3>
        <p>
          If this deployment enables display ads (for example Google AdSense), the ad provider may set or read cookies,
          use device identifiers, and load scripts to deliver and measure ads. That processing is governed by the
          provider&apos;s policies, not by file contents of tools you run locally. You can limit ad personalization in
          your Google account or browser, and tune intrusive formats in the AdSense “Auto ads” settings for your
          property.
        </p>

        <h3>6. AI and heavy assets</h3>
        <p>
          Features that use large models may download assets from third-party CDNs or vendors when you open those pages.
          That activity is governed by those providers&apos; terms and may create additional network traces.
        </p>

        <h3>7. Your choices</h3>
        <ul className="legal-list">
          <li>Clear cookies and site data for this origin in your browser settings.</li>
          <li>Use private/incognito mode if you prefer not to retain local history between sessions.</li>
          <li>Use browser extensions or network filters to restrict third-party requests if allowed by your environment.</li>
        </ul>

        <p className="legal-crosslinks">
          Related: <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link> ·{" "}
          <Link to="/about">About</Link>
        </p>
      </LegalProse>
    </ToolPageShell>
  );
}
