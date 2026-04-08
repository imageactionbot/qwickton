import { Link } from "react-router-dom";
import { usePageSeo } from "../../lib/seo/usePageSeo";
import { ToolPageShell } from "../shared/ToolPageShell";
import { LegalProse } from "./LegalProse";

export function PrivacyPage() {
  usePageSeo(
    "Privacy Policy",
    "Qwickton Privacy Policy: local-first processing, what data may be collected, analytics metadata, third parties, your rights, and retention.",
    { keywords: "Qwickton privacy policy, data protection, browser tools" }
  );

  return (
    <ToolPageShell
      title="Privacy Policy"
      trustStrip={false}
      breadcrumbs={[
        { label: "All tools", to: "/" },
        { label: "Privacy Policy" },
      ]}
    >
      <LegalProse>
        <p className="legal-updated">
          <strong>Last updated:</strong> April 8, 2026
        </p>
        <p>
          This Privacy Policy explains how information is handled when you use the Qwickton website and in-browser tools
          (the &quot;Service&quot;). The operator of the specific site where you access Qwickton is responsible for
          implementing hosting, domains, and any optional server endpoints (for example analytics). This policy describes
          the product&apos;s intended design and typical data flows.
        </p>

        <h3>1. Summary</h3>
        <ul className="legal-list">
          <li>
            <strong>Local-first tools:</strong> Core workflows are built to process your files in your browser without
            sending document contents to our application servers for those workflows.
          </li>
          <li>
            <strong>No account required</strong> to use standard tools as shipped in this project.
          </li>
          <li>
            <strong>Metadata-only analytics</strong> may be attempted (same-origin), but file contents are not transmitted in
            those events by design.
          </li>
        </ul>

        <h3>2. Roles</h3>
        <p>
          For purely local processing, your device performs the operation. If the deployment adds server-side endpoints,
          the host of the site acts as a data controller for any server logs or analytics that the host configures.
        </p>

        <h3>3. Information we do not intend to collect from your documents</h3>
        <p>
          For tools that run fully client-side, we do not intend to receive the bytes of your PDFs, images, DOCX bodies, or
          pasted text on our servers. Most work happens in your browser&apos;s memory unless a feature explicitly states
          otherwise.
        </p>

        <h3>4. Information that may be processed or generated locally</h3>
        <ul className="legal-list">
          <li>Files and text you choose to load into the page (remaining on-device during processing).</li>
          <li>Derived outputs you download (remaining under your control).</li>
          <li>
            Browser storage (for example &quot;recent hubs&quot;) stored in <code>localStorage</code> on your device — see{" "}
            <Link to="/cookies">Cookies &amp; storage</Link>.
          </li>
        </ul>

        <h3>5. Technical and usage data</h3>
        <p>
          Like most websites, hosting infrastructure may automatically log technical data (for example IP address, User-Agent,
          timestamps, URLs) when your browser requests HTML, scripts, or assets. That logging depends entirely on how the site
          is deployed (static host, CDN, reverse proxy, etc.).
        </p>
        <p>
          The application code may send lightweight JSON events to a same-origin path (for example tool name, duration,
          success flag, approximate byte sizes). These payloads are designed not to include file contents. If no backend is
          configured, those requests may fail without affecting tool functionality.
        </p>

        <h3>6. Third parties</h3>
        <p>
          Third-party services may include font CDNs, AI model distributors, WebAssembly runtimes, and browser APIs. They may
          process technical data needed to deliver assets or run models. We do not control independent third parties; their
          practices are described in their own policies.
        </p>

        <h3>7. Legal bases (where GDPR-style laws apply)</h3>
        <p>
          Where EU/UK GDPR or similar law applies and we process personal data, we rely on appropriate bases such as:
          (a) performance of a contract or steps prior to a contract at your request when you use the Service; (b)
          legitimate interests in operating, securing, and improving the Service, balanced against your rights; (c) legal
          obligation where required. Where consent is required for non-essential technologies, you may manage choices via
          browser settings and applicable consent tools provided by your deployment.
        </p>

        <h3>8. Retention</h3>
        <p>
          Local-only data remains on your device until you clear it. Server-side retention, if any, is determined by the
          site operator&apos;s log and analytics configuration.
        </p>

        <h3>9. Security</h3>
        <p>
          We use reasonable measures appropriate to a client-side product. No method of transmission or storage is 100%
          secure. You should keep your device and browser updated and avoid processing highly sensitive data on shared or
          untrusted machines.
        </p>

        <h3>10. Children</h3>
        <p>
          The Service is not directed at children under 13 (or the minimum age required in your jurisdiction). If you
          believe a child has provided personal information through a deployment you control, contact that deployment&apos;s
          operator.
        </p>

        <h3>11. International transfers</h3>
        <p>
          Because requests may route through global CDNs or third-party infrastructure, data may be processed in countries
          other than your own. The site operator should implement appropriate safeguards where required by law.
        </p>

        <h3>12. Your rights</h3>
        <p>
          Depending on your location, you may have rights to access, rectify, delete, restrict, or object to certain
          processing, and to lodge a complaint with a supervisory authority. For data handled only on your device, you can
          often exercise control directly via browser settings (clear storage). For server-held data, contact the operator
          of the site you used.
        </p>

        <h3>13. Changes</h3>
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top will change when
          we do. Continued use after updates means you accept the revised policy where permitted by law.
        </p>

        <h3>14. Contact</h3>
        <p>
          For privacy inquiries related to a specific deployment of Qwickton, contact the person or organization operating
          that website (support email, imprint, or contact page), if provided.
        </p>

        <p className="legal-crosslinks">
          Related: <Link to="/terms">Terms of Service</Link> · <Link to="/cookies">Cookies &amp; storage</Link> ·{" "}
          <Link to="/about">About</Link>
        </p>
      </LegalProse>
    </ToolPageShell>
  );
}
