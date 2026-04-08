import { Link } from "react-router-dom";
import { usePageSeo } from "../../lib/seo/usePageSeo";
import { ToolPageShell } from "../shared/ToolPageShell";
import { LegalProse } from "./LegalProse";

export function TermsPage() {
  usePageSeo(
    "Terms of Service",
    "Terms and conditions for using Qwickton browser tools: acceptable use, disclaimers, limitation of liability, and your responsibilities.",
    { keywords: "Qwickton terms, terms of service, conditions of use" }
  );

  return (
    <ToolPageShell
      title="Terms of Service"
      trustStrip={false}
      breadcrumbs={[
        { label: "All tools", to: "/" },
        { label: "Terms of Service" },
      ]}
    >
      <LegalProse>
        <p className="legal-updated">
          <strong>Last updated:</strong> April 8, 2026
        </p>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Qwickton website and browser-based
          tools (collectively, the &quot;Service&quot;). By using the Service, you agree to these Terms. If you do not
          agree, do not use the Service.
        </p>

        <h3>1. The Service</h3>
        <p>
          Qwickton provides client-side utilities (for example PDF, image, text, and document tools) that typically run in
          your web browser. Features, availability, and behavior may change without notice. The Service is offered as a
          convenience and may not be suitable for every use case.
        </p>

        <h3>2. Eligibility and acceptable use</h3>
        <p>You agree to use the Service only in compliance with applicable laws and these Terms. You must not:</p>
        <ul className="legal-list">
          <li>Use the Service to harm, harass, or infringe the rights of others.</li>
          <li>Attempt to probe, disrupt, or overload our infrastructure or third-party services.</li>
          <li>Reverse engineer or scrape the Service in a way that violates applicable law or our rights.</li>
          <li>Upload or process content you do not have the right to use, or that is illegal in your jurisdiction.</li>
        </ul>

        <h3>3. Your files and local processing</h3>
        <p>
          Many tools are designed to process files locally in your browser. For those workflows, we do not intend to store
          your document contents on our servers. However, your device, browser, network, and any optional features you
          enable (such as analytics endpoints provided by the host) may affect what data leaves your device. See our{" "}
          <Link to="/privacy">Privacy Policy</Link> for details.
        </p>

        <h3>4. Third-party technology and AI</h3>
        <p>
          Some features may load third-party libraries or models (for example for AI background removal or fonts). Those
          providers have their own terms and privacy practices. Your use of such features may involve downloads from or
          communication with those providers as described in our Privacy and Cookies notices.
        </p>

        <h3>5. Intellectual property</h3>
        <p>
          The Service, its branding, and its original content are protected by intellectual property laws.           You receive a limited, non-exclusive, non-transferable license only as necessary to use the Service for personal
          or internal business purposes in accordance with these Terms. You retain ownership of content you supply; you grant no license to us beyond what is needed to
          operate the Service (which, for purely local processing, may be none).
        </p>

        <h3>6. Disclaimers</h3>
        <p>
          <strong>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;</strong> TO THE MAXIMUM EXTENT
          PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          Outputs (for example converted PDFs, resized images, or formatted text) may be imperfect. You are responsible
          for verifying results before relying on them for legal, medical, financial, immigration, academic, or other
          high-stakes purposes. Qwickton is not a law firm or professional advisor.
        </p>

        <h3>7. Limitation of liability</h3>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION,
          ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE
          WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE
          CLAIM (IF ANY) OR (B) ZERO IF THE SERVICE IS PROVIDED FREE OF CHARGE.
        </p>
        <p>Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted.</p>

        <h3>8. Indemnity</h3>
        <p>
          You will defend and indemnify us and our affiliates against claims, damages, losses, and expenses (including
          reasonable legal fees) arising from your misuse of the Service, your content, or your violation of these Terms or
          applicable law, to the extent permitted by law.
        </p>

        <h3>9. Changes</h3>
        <p>
          We may modify the Service or these Terms at any time. We will try to reflect material changes by updating the
          &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the updated Terms.
        </p>

        <h3>10. Suspension and termination</h3>
        <p>
          We may suspend or discontinue the Service, or restrict access, at our discretion, including for legal, security,
          or abuse-prevention reasons.
        </p>

        <h3>11. Governing law</h3>
        <p>
          Unless mandatory local law requires otherwise, these Terms are governed by the laws applicable in the place where
          the operator of the site you are visiting is established, without regard to conflict-of-law rules. You agree to
          submit to the courts of that jurisdiction for disputes, where permitted.
        </p>
        <p className="cost-note">
          If you operate a fork or copy of Qwickton, replace this section with the jurisdiction that matches your legal
          entity.
        </p>

        <h3>12. Contact</h3>
        <p>
          For questions about these Terms, use the contact or support channel published on the same domain where you access
          the Service (for example a support email or project page provided by the site operator).
        </p>

        <p className="legal-crosslinks">
          Related: <Link to="/privacy">Privacy Policy</Link> · <Link to="/cookies">Cookies &amp; storage</Link> ·{" "}
          <Link to="/about">About</Link>
        </p>
      </LegalProse>
    </ToolPageShell>
  );
}
