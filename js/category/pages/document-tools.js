(function() {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function localeOptions() {
    const items = [
      { code: "en-US", label: "United States (USD)" },
      { code: "en-IN", label: "India (INR)" },
      { code: "en-GB", label: "United Kingdom (GBP)" },
      { code: "de-DE", label: "Germany (EUR)" },
      { code: "fr-FR", label: "France (EUR)" },
      { code: "ja-JP", label: "Japan (JPY)" },
      { code: "ar-SA", label: "Saudi Arabia (SAR)" },
      { code: "pt-BR", label: "Brazil (BRL)" }
    ];
    return items.map((item) => `<option value="${item.code}">${item.label}</option>`).join("");
  }
  const CURRENCY_BY_LOCALE = {
    "en-US": "USD",
    "en-IN": "INR",
    "en-GB": "GBP",
    "de-DE": "EUR",
    "fr-FR": "EUR",
    "ja-JP": "JPY",
    "ar-SA": "SAR",
    "pt-BR": "BRL"
  };

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-document-history";
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (error) {
      void error;
    }
  }
  function pushHistory(type, text, renderFn) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CARD CREATION
  // ============================================
  function initDocumentTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.documentToolsInitialized === "true") return;
    grid.dataset.documentToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "doc-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `<div class="doc-card-header"><div class="doc-card-icon">${icon}</div><h3 class="doc-card-title">${escapeHtml(title)}</h3>${options.focusable !== false ? `<button class="btn btn-secondary doc-focus-btn" type="button" data-focus-open>Open</button><button class="btn btn-secondary doc-focus-inline-close" type="button" data-focus-close>Close</button>` : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#docHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No document outputs yet.</span>'; return; }
      container.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`).join("");
      container.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => copyText(readHistory()[Number(btn.dataset.idx)]?.text || "")));
    }

    function wireExport(card, prefix, title, getText) {
      card.querySelector(`[data-export='${prefix}-txt']`)?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    }

    // ============================================
    // 1. RESUME GENERATOR
    // ============================================
    const resumeCard = makeCard("resume", "📄", "Resume Generator Pro", `
      <div class="grid-2"><div><label>Full Name</label><input id="rName" placeholder="John Doe"></div><div><label>Target Role</label><input id="rRole" placeholder="Software Engineer"></div>
      <div><label>Email</label><input id="rEmail" placeholder="john@example.com"></div><div><label>Phone</label><input id="rPhone" placeholder="+1 234 567 8900"></div>
      <div><label>Location</label><input id="rCity" placeholder="New York, NY"></div><div><label>LinkedIn</label><input id="rLinkedin" placeholder="linkedin.com/in/johndoe"></div></div>
      <div><label>Professional Summary</label><textarea id="rSummary" rows="2" placeholder="Experienced professional with 5+ years..."></textarea></div>
      <div><label>Skills (comma separated)</label><textarea id="rSkills" rows="2" placeholder="JavaScript, React, Node.js, Python, SQL"></textarea></div>
      <div><label>Experience Highlights</label><textarea id="rExp" rows="3" placeholder="- Led team of 5 developers&#10;- Increased efficiency by 30%"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="rBtn">Generate Resume</button><button class="btn btn-secondary" type="button" id="rCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="resume-txt">TXT</button></div>
      <textarea id="rRes" class="result" rows="12" placeholder="Your resume will appear here..."></textarea>
    `);
    resumeCard.querySelector("#rBtn").onclick = () => {
      const name = resumeCard.querySelector("#rName").value || "Your Name";
      const role = resumeCard.querySelector("#rRole").value || "Target Role";
      const email = resumeCard.querySelector("#rEmail").value || "email@example.com";
      const phone = resumeCard.querySelector("#rPhone").value || "+00 0000000000";
      const city = resumeCard.querySelector("#rCity").value || "City";
      const linkedin = resumeCard.querySelector("#rLinkedin").value || "-";
      const summary = resumeCard.querySelector("#rSummary").value || "Professional summary goes here";
      const skillsRaw = resumeCard.querySelector("#rSkills").value || "";
      const skills = skillsRaw.split(",").map(s => s.trim()).filter(Boolean).join(", ");
      const exp = resumeCard.querySelector("#rExp").value || "-";
      const out = [`${name.toUpperCase()}`, `=${name.length}`, `${role}`, `${email} | ${phone} | ${city}`, `LinkedIn: ${linkedin}`, "", "PROFESSIONAL SUMMARY", summary, "", "TECHNICAL SKILLS", skills || "-", "", "WORK EXPERIENCE", exp, "", "EDUCATION", "- Bachelor's Degree in Relevant Field", "", `Generated: ${new Date().toLocaleString()}`].join("\n");
      resumeCard.querySelector("#rRes").value = out;
      pushHistory("Resume", `${name} - ${role}`, renderHistory);
    };
    resumeCard.querySelector("#rCopyBtn").onclick = () => copyText(resumeCard.querySelector("#rRes").value);
    wireExport(resumeCard, "resume", "Resume", () => resumeCard.querySelector("#rRes").value);

    // ============================================
    // 2. COVER LETTER BUILDER
    // ============================================
    const coverCard = makeCard("cover", "✉️", "Cover Letter Builder", `
      <div class="grid-2"><div><label>Your Name</label><input id="clName" placeholder="Your Name"></div><div><label>Company</label><input id="clCompany" placeholder="Company Name"></div>
      <div><label>Job Role</label><input id="clRole" placeholder="Position"></div><div><label>Hiring Manager</label><input id="clManager" placeholder="Hiring Manager"></div></div>
      <div><label>Why You're a Great Fit</label><textarea id="clPitch" rows="3" placeholder="I am excited to apply because..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="clBtn">Generate Cover Letter</button><button class="btn btn-secondary" type="button" id="clCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="cover-txt">TXT</button></div>
      <textarea id="clRes" class="result" rows="12" placeholder="Your cover letter will appear here..."></textarea>
    `);
    coverCard.querySelector("#clBtn").onclick = () => {
      const name = coverCard.querySelector("#clName").value || "Your Name";
      const company = coverCard.querySelector("#clCompany").value || "Company";
      const role = coverCard.querySelector("#clRole").value || "Role";
      const manager = coverCard.querySelector("#clManager").value || "Hiring Manager";
      const pitch = coverCard.querySelector("#clPitch").value || "I am confident that my skills make me an excellent fit.";
      const out = [`Dear ${manager},`, "", `I am writing to express my strong interest in the ${role} position at ${company}.`, "", pitch, "", "I would welcome the opportunity to discuss how my background aligns with your needs.", "", "Sincerely,", name, "", `📅 ${new Date().toLocaleDateString()}`].join("\n");
      coverCard.querySelector("#clRes").value = out;
      pushHistory("Cover Letter", `${name} → ${company}`, renderHistory);
    };
    coverCard.querySelector("#clCopyBtn").onclick = () => copyText(coverCard.querySelector("#clRes").value);
    wireExport(coverCard, "cover", "Cover", () => coverCard.querySelector("#clRes").value);

    // ============================================
    // 3. BUSINESS PROPOSAL GENERATOR
    // ============================================
    const proposalCard = makeCard("proposal", "💼", "Business Proposal Generator", `
      <div class="grid-2"><div><label>Project Name</label><input id="propName" value="Digital Transformation"></div><div><label>Client Name</label><input id="propClient" value="ABC Corp"></div>
      <div><label>Budget (USD)</label><input id="propBudget" type="number" value="50000"></div><div><label>Timeline (days)</label><input id="propDays" type="number" value="60"></div></div>
      <div><label>Scope of Work</label><textarea id="propScope" rows="2" placeholder="Deliverables and services..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="propBtn">Generate Proposal</button><button class="btn btn-secondary" type="button" id="propCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="proposal-txt">TXT</button></div>
      <textarea id="propRes" class="result" rows="12" placeholder="Your proposal will appear here..."></textarea>
    `);
    proposalCard.querySelector("#propBtn").onclick = () => {
      const project = proposalCard.querySelector("#propName").value || "Project Name";
      const client = proposalCard.querySelector("#propClient").value || "Client Name";
      const budget = proposalCard.querySelector("#propBudget").value || 50000;
      const days = proposalCard.querySelector("#propDays").value || 60;
      const scope = proposalCard.querySelector("#propScope").value || "Full project delivery including planning, execution, and support.";
      const out = [`BUSINESS PROPOSAL`, `========================================`, `Project: ${project}`, `Client: ${client}`, `Budget: $${budget.toLocaleString()}`, `Timeline: ${days} days`, "", `SCOPE OF WORK`, scope, "", `DELIVERABLES`, `• Project planning and management`, `• Design and development`, `• Quality assurance and testing`, `• Deployment and launch`, `• Post-launch support (30 days)`, "", `TERMS`, `• 50% advance payment`, `• 50% upon completion`, `• All deliverables as per timeline`, "", `📅 ${new Date().toLocaleDateString()}`].join("\n");
      proposalCard.querySelector("#propRes").value = out;
      pushHistory("Proposal", project, renderHistory);
    };
    proposalCard.querySelector("#propCopyBtn").onclick = () => copyText(proposalCard.querySelector("#propRes").value);
    wireExport(proposalCard, "proposal", "Proposal", () => proposalCard.querySelector("#propRes").value);

    // ============================================
    // 4. INVOICE GENERATOR
    // ============================================
    const invoiceCard = makeCard("invoice", "🧾", "Invoice Generator", `
      <div class="grid-2"><div><label>Invoice #</label><input id="invNo" value="INV-1001"></div><div><label>Date</label><input id="invDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div><label>Client Name</label><input id="invClient" value="Client Name"></div><div><label>Amount</label><input id="invAmount" type="number" value="1500"></div>
      <div><label>Due Date</label><input id="invDue" type="date" value="${new Date(Date.now()+30*24*60*60*1000).toISOString().slice(0,10)}"></div><div><label>Locale/Country</label><select id="invLocale">${localeOptions()}</select></div></div>
      <div><label>Description</label><textarea id="invDesc" rows="2" placeholder="Service description..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="invBtn">Generate Invoice</button><button class="btn btn-secondary" type="button" id="invCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="invoice-txt">TXT</button></div>
      <textarea id="invRes" class="result" rows="10" placeholder="Your invoice will appear here..."></textarea>
    `);
    invoiceCard.querySelector("#invBtn").onclick = () => {
      const no = invoiceCard.querySelector("#invNo").value || "INV-1001";
      const date = invoiceCard.querySelector("#invDate").value;
      const client = invoiceCard.querySelector("#invClient").value || "Client Name";
      const amount = Number(invoiceCard.querySelector("#invAmount").value) || 0;
      const due = invoiceCard.querySelector("#invDue").value;
      const locale = invoiceCard.querySelector("#invLocale").value || "en-US";
      const currency = CURRENCY_BY_LOCALE[locale] || "USD";
      const desc = invoiceCard.querySelector("#invDesc").value || "Professional services rendered";
      const amountText = new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
      const out = [`INVOICE`, `========================================`, `Invoice #: ${no}`, `Date: ${date}`, `Due Date: ${due}`, `Client: ${client}`, `Locale: ${locale}`, "", `Description`, desc, "", `Amount: ${amountText}`, "", `Payment Terms: Due upon receipt`, `Bank Transfer / Credit Card / PayPal`, "", `Thank you for your business!`].join("\n");
      invoiceCard.querySelector("#invRes").value = out;
      pushHistory("Invoice", `${no} - ${amountText}`, renderHistory);
    };
    invoiceCard.querySelector("#invCopyBtn").onclick = () => copyText(invoiceCard.querySelector("#invRes").value);
    wireExport(invoiceCard, "invoice", "Invoice", () => invoiceCard.querySelector("#invRes").value);

    // ============================================
    // 5. AGREEMENT GENERATOR
    // ============================================
    const agreementCard = makeCard("agreement", "📋", "Agreement Generator", `
      <div class="grid-2"><div><label>Party A</label><input id="agPartyA" value="Your Company"></div><div><label>Party B</label><input id="agPartyB" value="Client Name"></div>
      <div><label>Agreement Type</label><select id="agType"><option value="service">Service Agreement</option><option value="nda">NDA</option><option value="partnership">Partnership</option></select></div>
      <div><label>Effective Date</label><input id="agDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <div><label>Terms</label><textarea id="agTerms" rows="3" placeholder="Key terms and conditions..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="agBtn">Generate Agreement</button><button class="btn btn-secondary" type="button" id="agCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="agreement-txt">TXT</button></div>
      <textarea id="agRes" class="result" rows="12" placeholder="Your agreement will appear here..."></textarea>
    `);
    agreementCard.querySelector("#agBtn").onclick = () => {
      const partyA = agreementCard.querySelector("#agPartyA").value || "Party A";
      const partyB = agreementCard.querySelector("#agPartyB").value || "Party B";
      const type = agreementCard.querySelector("#agType").value;
      const date = agreementCard.querySelector("#agDate").value;
      const terms = agreementCard.querySelector("#agTerms").value || "Standard terms and conditions apply.";
      const out = [`${type.toUpperCase()} AGREEMENT`, `========================================`, `This Agreement is made on ${date} between:`, `1. ${partyA}`, `2. ${partyB}`, "", `TERMS AND CONDITIONS`, terms, "", `GOVERNING LAW`, `This agreement shall be governed by applicable laws.`, "", `SIGNATURES`, `_________________`, `${partyA}`, `_________________`, `${partyB}`, "", `📅 ${new Date().toLocaleDateString()}`].join("\n");
      agreementCard.querySelector("#agRes").value = out;
      pushHistory("Agreement", type, renderHistory);
    };
    agreementCard.querySelector("#agCopyBtn").onclick = () => copyText(agreementCard.querySelector("#agRes").value);
    wireExport(agreementCard, "agreement", "Agreement", () => agreementCard.querySelector("#agRes").value);

    // ============================================
    // 6. CERTIFICATE GENERATOR
    // ============================================
    const certificateCard = makeCard("certificate", "🎓", "Certificate Generator", `
      <div class="grid-2"><div><label>Recipient Name</label><input id="certName" value="John Doe"></div><div><label>Course/Event</label><input id="certCourse" value="Professional Development"></div>
      <div><label>Issuing Organization</label><input id="certOrg" value="Qwickton Academy"></div><div><label>Completion Date</label><input id="certDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <div class="grid-2"><div><label>Locale/Country</label><select id="certLocale">${localeOptions()}</select></div><div><label>Certificate ID Prefix</label><input id="certPrefix" value="CERT"></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="certBtn">Generate Certificate</button><button class="btn btn-secondary" type="button" id="certCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="certificate-txt">TXT</button></div>
      <textarea id="certRes" class="result" rows="12" placeholder="Your certificate will appear here..."></textarea>
    `);
    certificateCard.querySelector("#certBtn").onclick = () => {
      const name = certificateCard.querySelector("#certName").value || "Recipient Name";
      const course = certificateCard.querySelector("#certCourse").value || "Course Name";
      const org = certificateCard.querySelector("#certOrg").value || "Organization";
      const date = certificateCard.querySelector("#certDate").value;
      const locale = certificateCard.querySelector("#certLocale").value || "en-US";
      const certId = `${certificateCard.querySelector("#certPrefix").value || "CERT"}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const localizedDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(date || Date.now()));
      const out = [`╔══════════════════════════════════════════════════════════════╗`, `║                 CERTIFICATE OF COMPLETION                   ║`, `╚══════════════════════════════════════════════════════════════╝`, "", `Certificate ID: ${certId}`, `Locale: ${locale}`, "", `This certificate is proudly presented to`, "", `${name.toUpperCase()}`, "", `for successfully completing`, "", `${course}`, "", `Awarded by ${org}`, "", `Date: ${localizedDate}`, "", `────────────────────────────────────────`, `Authorized Signature`, "", `📅 ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date())}`].join("\n");
      certificateCard.querySelector("#certRes").value = out;
      pushHistory("Certificate", name, renderHistory);
    };
    certificateCard.querySelector("#certCopyBtn").onclick = () => copyText(certificateCard.querySelector("#certRes").value);
    wireExport(certificateCard, "certificate", "Certificate", () => certificateCard.querySelector("#certRes").value);

    // ============================================
    // 7. MEETING MINUTES
    // ============================================
    const minutesCard = makeCard("minutes", "📝", "Meeting Minutes", `
      <div class="grid-2"><div><label>Meeting Title</label><input id="minTitle" value="Weekly Team Sync"></div><div><label>Date</label><input id="minDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div><label>Attendees</label><input id="minAttendees" value="Team Members"></div><div><label>Meeting Owner</label><input id="minOwner" value="Project Manager"></div></div>
      <div><label>Agenda</label><textarea id="minAgenda" rows="2" placeholder="- Project updates&#10;- Blockers&#10;- Next steps"></textarea></div>
      <div><label>Discussion & Decisions</label><textarea id="minDecisions" rows="2" placeholder="Key decisions made..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="minBtn">Generate Minutes</button><button class="btn btn-secondary" type="button" id="minCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="minutes-txt">TXT</button></div>
      <textarea id="minRes" class="result" rows="12" placeholder="Meeting minutes will appear here..."></textarea>
    `);
    minutesCard.querySelector("#minBtn").onclick = () => {
      const title = minutesCard.querySelector("#minTitle").value || "Team Meeting";
      const date = minutesCard.querySelector("#minDate").value;
      const attendees = minutesCard.querySelector("#minAttendees").value || "Team Members";
      const owner = minutesCard.querySelector("#minOwner").value || "Facilitator";
      const agenda = minutesCard.querySelector("#minAgenda").value.split("\n").filter(l => l.trim()).map((a, i) => `${i+1}. ${a.trim()}`).join("\n");
      const decisions = minutesCard.querySelector("#minDecisions").value || "No major decisions recorded.";
      const out = [`MEETING MINUTES`, `========================================`, `Meeting: ${title}`, `Date: ${date}`, `Attendees: ${attendees}`, `Owner: ${owner}`, "", `AGENDA`, agenda || "1. Project updates", "", `DISCUSSION & DECISIONS`, decisions, "", `ACTION ITEMS`, `- [ ] Task 1 - Assignee - Due: [date]`, `- [ ] Task 2 - Assignee - Due: [date]`, "", `NEXT MEETING`, `• Date: TBD`, `• Agenda items from this meeting`, "", `📅 Generated: ${new Date().toLocaleString()}`].join("\n");
      minutesCard.querySelector("#minRes").value = out;
      pushHistory("Meeting Minutes", title, renderHistory);
    };
    minutesCard.querySelector("#minCopyBtn").onclick = () => copyText(minutesCard.querySelector("#minRes").value);
    wireExport(minutesCard, "minutes", "Minutes", () => minutesCard.querySelector("#minRes").value);

    // ============================================
    // 8. BUSINESS LETTER
    // ============================================
    const letterCard = makeCard("letter", "📧", "Business Letter", `
      <div class="grid-2"><div><label>Sender Name</label><input id="letSender" value="Your Name"></div><div><label>Sender Title</label><input id="letTitle" value="Position"></div>
      <div><label>Recipient Name</label><input id="letRecipient" value="Recipient Name"></div><div><label>Company</label><input id="letCompany" value="Company Name"></div>
      <div><label>Subject</label><input id="letSubject" value="Meeting Request"></div></div>
      <div><label>Message</label><textarea id="letBody" rows="3" placeholder="Your message content..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="letBtn">Generate Letter</button><button class="btn btn-secondary" type="button" id="letCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="letter-txt">TXT</button></div>
      <textarea id="letRes" class="result" rows="12" placeholder="Your letter will appear here..."></textarea>
    `);
    letterCard.querySelector("#letBtn").onclick = () => {
      const sender = letterCard.querySelector("#letSender").value || "Your Name";
      const title = letterCard.querySelector("#letTitle").value || "Position";
      const recipient = letterCard.querySelector("#letRecipient").value || "Recipient Name";
      const company = letterCard.querySelector("#letCompany").value || "Company Name";
      const subject = letterCard.querySelector("#letSubject").value || "Subject";
      const body = letterCard.querySelector("#letBody").value || "I am writing to you regarding...";
      const out = [`${sender}`, `${title}`, `${new Date().toLocaleDateString()}`, "", `${recipient}`, `${company}`, "", `Subject: ${subject}`, "", body, "", `Sincerely,`, `${sender}`].join("\n");
      letterCard.querySelector("#letRes").value = out;
      pushHistory("Business Letter", subject, renderHistory);
    };
    letterCard.querySelector("#letCopyBtn").onclick = () => copyText(letterCard.querySelector("#letRes").value);
    wireExport(letterCard, "letter", "Letter", () => letterCard.querySelector("#letRes").value);

    // ============================================
    // 9. REPORT GENERATOR
    // ============================================
    const reportCard = makeCard("report", "📊", "Report Generator", `
      <div class="grid-2"><div><label>Report Title</label><input id="repTitle" value="Monthly Report"></div><div><label>Author</label><input id="repAuthor" value="Your Name"></div>
      <div><label>Period</label><input id="repPeriod" value="January 2024"></div></div>
      <div><label>Executive Summary</label><textarea id="repSummary" rows="2" placeholder="Key highlights..."></textarea></div>
      <div><label>Key Findings</label><textarea id="repFindings" rows="2" placeholder="• Finding 1&#10;• Finding 2"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="repBtn">Generate Report</button><button class="btn btn-secondary" type="button" id="repCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="report-txt">TXT</button></div>
      <textarea id="repRes" class="result" rows="12" placeholder="Your report will appear here..."></textarea>
    `);
    reportCard.querySelector("#repBtn").onclick = () => {
      const title = reportCard.querySelector("#repTitle").value || "Report Title";
      const author = reportCard.querySelector("#repAuthor").value || "Author";
      const period = reportCard.querySelector("#repPeriod").value || "Period";
      const summary = reportCard.querySelector("#repSummary").value || "This report summarizes key findings.";
      const findings = reportCard.querySelector("#repFindings").value.split("\n").filter(l => l.trim()).join("\n") || "Key findings to be added.";
      const out = [`${title.toUpperCase()}`, `========================================`, `Author: ${author}`, `Period: ${period}`, `Date: ${new Date().toLocaleDateString()}`, "", `EXECUTIVE SUMMARY`, summary, "", `KEY FINDINGS`, findings, "", `RECOMMENDATIONS`, `• Recommendation 1`, `• Recommendation 2`, `• Recommendation 3`, "", `CONCLUSION`, `Based on the findings, the following actions are recommended.`].join("\n");
      reportCard.querySelector("#repRes").value = out;
      pushHistory("Report", title, renderHistory);
    };
    reportCard.querySelector("#repCopyBtn").onclick = () => copyText(reportCard.querySelector("#repRes").value);
    wireExport(reportCard, "report", "Report", () => reportCard.querySelector("#repRes").value);

    // ============================================
    // 10. VIDEO SCRIPT WRITER
    // ============================================
    const scriptCard = makeCard("script", "🎬", "Video Script Writer", `
      <div class="grid-2"><div><label>Video Title</label><input id="scriptTitle" value="How to Create Content"></div><div><label>Duration (seconds)</label><input id="scriptDuration" type="number" value="60"></div>
      <div><label>Target Audience</label><input id="scriptAudience" value="Beginners"></div></div>
      <div><label>Key Messages</label><textarea id="scriptMessages" rows="2" placeholder="- Key message 1&#10;- Key message 2"></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="scriptBtn">Generate Script</button><button class="btn btn-secondary" type="button" id="scriptCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="script-txt">TXT</button></div>
      <textarea id="scriptRes" class="result" rows="12" placeholder="Your script will appear here..."></textarea>
    `);
    scriptCard.querySelector("#scriptBtn").onclick = () => {
      const title = scriptCard.querySelector("#scriptTitle").value || "Video Title";
      const duration = scriptCard.querySelector("#scriptDuration").value || 60;
      const audience = scriptCard.querySelector("#scriptAudience").value || "Everyone";
      const messages = scriptCard.querySelector("#scriptMessages").value.split("\n").filter(l => l.trim());
      const hook = `🔥 Attention ${audience}! In this video, we'll cover ${title}.`;
      const intro = `Welcome to this guide! Today we're diving into ${title}.`;
      const outro = `Thanks for watching! Don't forget to like and subscribe for more content!`;
      const body = messages.length ? messages.map((m, i) => `${i+1}. ${m.trim()}`).join("\n\n") : "Key points about this topic.";
      const out = [`VIDEO SCRIPT: ${title}`, `Duration: ${duration} seconds`, `Audience: ${audience}`, "", `🎬 HOOK (0:00 - 0:10)`, hook, "", `📖 INTRO (0:10 - 0:20)`, intro, "", `🎯 MAIN CONTENT (0:20 - ${duration-10}:00)`, body, "", `💡 OUTRO (${duration-10}:00 - ${duration}:00)`, outro].join("\n");
      scriptCard.querySelector("#scriptRes").value = out;
      pushHistory("Video Script", title, renderHistory);
    };
    scriptCard.querySelector("#scriptCopyBtn").onclick = () => copyText(scriptCard.querySelector("#scriptRes").value);
    wireExport(scriptCard, "script", "Script", () => scriptCard.querySelector("#scriptRes").value);

    // ============================================
    // 11. PRESS RELEASE WRITER
    // ============================================
    const pressCard = makeCard("press", "🗞️", "Press Release Writer", `
      <div class="grid-2"><div><label>Headline</label><input id="prHead" value="Company Launches New Service"></div><div><label>City/Country</label><input id="prCity" value="New York, USA"></div>
      <div><label>Company</label><input id="prCompany" value="Your Company"></div><div><label>Locale</label><select id="prLocale">${localeOptions()}</select></div></div>
      <div><label>Announcement Details</label><textarea id="prBody" rows="3" placeholder="Key announcement details..."></textarea></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="prBtn">Generate Press Release</button><button class="btn btn-secondary" type="button" id="prCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="press-txt">TXT</button></div>
      <textarea id="prRes" class="result" rows="12" placeholder="Press release output..."></textarea>
    `);
    pressCard.querySelector("#prBtn").onclick = () => {
      const headline = pressCard.querySelector("#prHead").value || "Headline";
      const city = pressCard.querySelector("#prCity").value || "City, Country";
      const company = pressCard.querySelector("#prCompany").value || "Company";
      const locale = pressCard.querySelector("#prLocale").value || "en-US";
      const body = pressCard.querySelector("#prBody").value || "Announcement details go here.";
      const dateText = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
      const out = [
        "FOR IMMEDIATE RELEASE",
        headline.toUpperCase(),
        `${city} — ${dateText}`,
        "",
        `${company} today announced ${body}`,
        "",
        "About the company:",
        `${company} is committed to delivering reliable and customer-focused services.`,
        "",
        "Media Contact:",
        "Name: Communications Team",
        "Email: media@example.com"
      ].join("\n");
      pressCard.querySelector("#prRes").value = out;
      pushHistory("Press Release", headline.slice(0, 50), renderHistory);
    };
    pressCard.querySelector("#prCopyBtn").onclick = () => copyText(pressCard.querySelector("#prRes").value);
    wireExport(pressCard, "press", "Press", () => pressCard.querySelector("#prRes").value);

    // ============================================
    // 12. DOCUMENT LOCALIZATION CHECKER
    // ============================================
    const localeCard = makeCard("localize", "🌍", "Document Localization Checker", `
      <div><label>Document Text</label><textarea id="locDoc" rows="4" placeholder="Paste document content..."></textarea></div>
      <div class="grid-2"><div><label>Locale/Country</label><select id="locDocLocale">${localeOptions()}</select></div><div><label>Date Format</label><select id="locDateStyle"><option value="short">Short</option><option value="medium" selected>Medium</option><option value="long">Long</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="locDocBtn">Analyze Localization</button><button class="btn btn-secondary" type="button" id="locDocCopy">Copy</button><button class="btn btn-secondary" type="button" data-export="localize-txt">TXT</button></div>
      <textarea id="locDocRes" class="result" rows="10" placeholder="Localization suggestions..."></textarea>
    `);
    localeCard.querySelector("#locDocBtn").onclick = () => {
      const text = localeCard.querySelector("#locDoc").value.trim();
      if (!text) {
        localeCard.querySelector("#locDocRes").value = "Please paste document text first.";
        return;
      }
      const locale = localeCard.querySelector("#locDocLocale").value || "en-US";
      const dateStyle = localeCard.querySelector("#locDateStyle").value || "medium";
      const words = (text.match(/\S+/g) || []).length;
      const chars = Array.from(text).length;
      const localeDate = new Intl.DateTimeFormat(locale, { dateStyle }).format(new Date());
      const numericHints = /\b\d{1,3}(,\d{3})*(\.\d+)?\b/.test(text) ? "Contains number formatting; verify locale separators." : "No obvious number formatting found.";
      const out = [
        `Locale target: ${locale}`,
        `Current localized date sample: ${localeDate}`,
        `Words: ${words} | Characters: ${chars}`,
        "----------------------------------------",
        `Readability hint: ${words > 250 ? "Consider shorter paragraphs for global readers." : "Length is manageable."}`,
        `Formatting hint: ${numericHints}`,
        "Terminology hint: Ensure country-specific legal/financial terms are adapted."
      ].join("\n");
      localeCard.querySelector("#locDocRes").value = out;
      pushHistory("Localization", `${locale} / ${words} words`, renderHistory);
    };
    localeCard.querySelector("#locDocCopy").onclick = () => copyText(localeCard.querySelector("#locDocRes").value);
    wireExport(localeCard, "localize", "Localization", () => localeCard.querySelector("#locDocRes").value);

    // ============================================
    // HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Document Outputs", `
      <div id="docHistory" class="chip-list"><span class="empty-hint">No document outputs yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" type="button" id="clearDocHistory">Clear History</button><button class="btn btn-secondary" type="button" id="exportDocHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearDocHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportDocHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`document-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "doc-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "doc-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || card.getAttribute("data-focusable") === "false" || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("doc-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("doc-modal-open"); }
    document.querySelectorAll(".doc-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".doc-card"))));
    document.querySelectorAll(".doc-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    ["invLocale", "certLocale", "prLocale", "locDocLocale"].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      if (Array.from(node.options).some((opt) => opt.value === browserLocale)) node.value = browserLocale;
    });

    document.getElementById("year").textContent = new Date().getFullYear();
  }
  window.QwicktonCategoryInits["document-tools"] = initDocumentTools;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initDocumentTools(null); });
})();