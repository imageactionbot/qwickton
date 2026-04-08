import { categoryDiscoveryHaystack } from "../lib/seo/internationalSeo";
import type { PassportCountryPreset } from "../lib/passport/passportPresets";

export type ToolOpts = {
  description?: string;
  aliases?: string[];
  seoKeywords?: string;
};

export type ToolEntry = {
  id: string;
  category: "pdf" | "image" | "passport" | "background" | "converter" | "text" | "word";
  title: string;
  /** Full path including query string for deep-linking */
  path: string;
  /** One line for catalog cards and meta descriptions */
  description: string;
  /** Extra phrases for search ranking (synonyms, informal phrasing, etc.) */
  aliases?: string[];
  /** Optional override for meta keywords */
  seoKeywords?: string;
};

function normalizeMeta(
  defaultDesc: string,
  descOrOpts?: string | ToolOpts
): { description: string; aliases?: string[]; seoKeywords?: string } {
  if (typeof descOrOpts === "string") {
    return { description: descOrOpts };
  }
  if (descOrOpts && typeof descOrOpts === "object") {
    return {
      description: descOrOpts.description ?? defaultDesc,
      ...(descOrOpts.aliases?.length ? { aliases: descOrOpts.aliases } : {}),
      ...(descOrOpts.seoKeywords ? { seoKeywords: descOrOpts.seoKeywords } : {}),
    };
  }
  return { description: defaultDesc };
}

function pdf(id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — free PDF tool in your browser. Files stay on your device; no server upload.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "pdf",
    title,
    path: `/pdf?tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function image(id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — edit images privately in your browser. No upload required for local processing.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "image",
    title,
    path: `/image?tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function passport(
  id: string,
  title: string,
  preset: PassportCountryPreset,
  descOrOpts?: string | ToolOpts
): ToolEntry {
  const defaultDesc = `${title} — print-ready sheet at 300 DPI, built locally in your browser.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "passport",
    title,
    path: `/passport?preset=${preset}&tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function background(id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — AI runs in your browser; export transparent PNG or a solid backdrop.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "background",
    title,
    path: `/background-remove?tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function converter(path: string, id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — convert locally in your browser. Spreadsheets and images stay on device.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  const sep = path.includes("?") ? "&" : "?";
  const pathWithTool = `${path}${sep}tool=${encodeURIComponent(id)}`;
  return {
    id,
    category: "converter",
    title,
    path: pathWithTool,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function text(id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — text utilities run fully offline in your browser.`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "text",
    title,
    path: `/text?tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

function word(id: string, title: string, descOrOpts?: string | ToolOpts): ToolEntry {
  const defaultDesc = `${title} — DOCX handled locally in your browser (DOCX only, not legacy .doc).`;
  const meta = normalizeMeta(defaultDesc, descOrOpts);
  return {
    id,
    category: "word",
    title,
    path: `/word?tool=${encodeURIComponent(id)}`,
    description: meta.description,
    ...(meta.aliases ? { aliases: meta.aliases } : {}),
    ...(meta.seoKeywords ? { seoKeywords: meta.seoKeywords } : {}),
  };
}

/** Meta keywords string for the page keywords tag and tooling. */
export function keywordsForToolEntry(t: ToolEntry): string {
  const boost = categoryDiscoveryHaystack(t.category);
  const core = t.seoKeywords?.trim()
    ? t.seoKeywords.trim()
    : [...new Set(
        [
          t.title,
          t.category,
          t.id,
          ...(t.aliases ?? []),
          "free online tool",
          "Qwickton",
          "browser",
          "privacy",
        ]
          .map((p) => p.trim())
          .filter(Boolean)
      )].join(", ");
  return [core, boost].filter(Boolean).join(", ");
}

/** Discoverable tools (catalog count includes aliases) — all run locally in your browser. */
/** Ordered ids for home / search “Quick picks” (mobile-friendly discovery). */
export const QUICK_PICK_TOOL_IDS: readonly string[] = [
  "compress-image",
  "merge-pdf",
  "passport-india",
  "jpg-to-pdf",
  "ai-background-removal",
  "word-to-pdf",
  "images-to-pdf",
  "excel-to-csv",
];

export const TOOL_CATALOG: ToolEntry[] = [
  // —— PDF (59) ——
  pdf("merge-pdf", "Merge PDF", {
    aliases: [
      "join pdf",
      "combine pdf",
      "pdf merge",
      "single pdf",
      "iphone merge pdf",
      "safari merge pdf",
      "files app pdf",
      "mobile pdf combine",
    ],
  }),
  pdf("combine-pdf", "Combine PDF files", { aliases: ["merge files", "bundle pdf"] }),
  pdf("join-pdf", "Join multiple PDFs", { aliases: ["append pdf", "stick pdf together"] }),
  pdf("append-pdf-pages", "Append pages from PDFs"),
  pdf("split-pdf", "Split PDF in half", { aliases: ["divide pdf", "half pdf", "split document"] }),
  pdf("split-pdf-first-half", "Split PDF — first half"),
  pdf("split-pdf-second-half", "Split PDF — second half"),
  pdf("rotate-pdf", "Rotate every PDF page", { aliases: ["turn pdf", "orientation pdf"] }),
  pdf("rotate-pdf-90", "Rotate PDF 90° clockwise"),
  pdf("rotate-pdf-180", "Rotate PDF 180°"),
  pdf("rotate-pdf-270", "Rotate PDF 270° clockwise"),
  pdf("watermark-pdf", "Add text watermark to PDF", { aliases: ["draft stamp", "confidential watermark"] }),
  pdf("stamp-watermark-pdf", "Stamp watermark on PDF"),
  pdf("page-numbers-pdf", "Add page numbers to PDF", { aliases: ["paginate pdf", "number pages"] }),
  pdf("footer-numbers-pdf", "Footer page numbers PDF"),
  pdf("sign-pdf", "Sign PDF with text", { aliases: ["digital sign pdf", "signature pdf"] }),
  pdf("text-signature-pdf", "Text signature on PDF"),
  pdf("jpg-to-pdf", "JPG to PDF", {
    aliases: ["photo to pdf", "image pdf", "jpeg pdf", "iphone photo to pdf", "camera roll pdf", "screenshot to pdf"],
  }),
  pdf("png-to-pdf", "PNG to PDF"),
  pdf("images-to-pdf", "Multiple images to one PDF", { aliases: ["bulk images pdf"] }),
  pdf("scan-to-pdf", "Scan-style images to PDF", { aliases: ["document scan pdf", "scanned look"] }),
  pdf("high-contrast-pdf-scan", "High-contrast document to PDF"),
  pdf("extract-pdf-pages", "Extract PDF pages", { aliases: ["save page range", "pull pages"] }),
  pdf("save-pdf-page-range", "Save a page range as PDF"),
  pdf("remove-pdf-pages", "Remove PDF pages", { aliases: ["delete pages pdf", "drop pages"] }),
  pdf("delete-pdf-pages", "Delete pages from PDF"),
  pdf("resave-pdf", "Re-save / repair PDF export", { aliases: ["fix pdf export", "repair pdf"] }),
  pdf("fix-pdf-structure", "Fix broken PDF structure (re-export)"),
  pdf("repair-pdf-file", "Repair PDF loading issues"),
  pdf("organize-pdf-rotation", "Organize PDF orientation (rotate all)"),
  pdf("iphone-pdf-join", "Join PDF on iPhone / mobile", {
    description: "Combine multiple PDFs in Safari or any mobile browser — same local merge as desktop; files stay on device.",
    aliases: ["iphone join pdf", "mobile combine pdf", "phone pdf merge"],
  }),
  pdf("photo-album-pdf", "Many photos to one PDF", {
    description: "Stack JPG/PNG images into a single PDF locally — handy for camera-roll exports and scans.",
    aliases: ["camera roll to pdf", "photos to single pdf", "batch images pdf"],
  }),
  pdf("whatsapp-doc-pdf", "PDF for WhatsApp / email (merge or images)", {
    description: "Use merge or images→PDF to make one small document to share; processing stays in your browser.",
    aliases: ["whatsapp pdf send", "share pdf iphone", "send one pdf"],
  }),
  pdf("pdf-re-export", "Re-export PDF for compatibility", {
    description: "Re-save the PDF locally — can fix some viewer or export issues; files stay on your device.",
    aliases: ["pdf refresh", "save pdf again"],
  }),
  pdf("pdf-linearize-fix", "Linearize / repair PDF export", {
    description: "Re-exports the PDF in your browser — helps with some linearization and loading quirks.",
    aliases: ["fix pdf web view", "pdf wont open"],
  }),
  pdf("repair-export-pdf", "Repair broken PDF export", { aliases: ["corrupt pdf fix", "pdf repair browser"] }),
  pdf("merge-scanned-documents", "Merge scanned PDFs", { aliases: ["combine scans", "stack scanned pdfs"] }),
  pdf("bundle-pdf-files", "Bundle PDFs into one", { aliases: ["one pdf from many", "pack pdfs"] }),
  pdf("split-document-half", "Split PDF — first half export", { aliases: ["first half pdf", "split part one"] }),
  pdf("divide-pdf-two-parts", "Split PDF — second half export", { aliases: ["second half pdf", "split part two"] }),
  pdf("turn-pages-right", "Rotate all pages 90° clockwise", { aliases: ["landscape fix pdf", "rotate right"] }),
  pdf("turn-pages-upside-down", "Rotate all pages 180°", { aliases: ["upside down pdf"] }),
  pdf("turn-pages-left", "Rotate all pages 270° clockwise", { aliases: ["rotate left pdf"] }),
  pdf("draft-watermark-pdf", "Draft watermark on PDF", { aliases: ["watermark sample", "draft copy"] }),
  pdf("confidential-stamp-pdf", "Confidential stamp PDF", { aliases: ["internal use pdf", "watermark confidential"] }),
  pdf("paginate-document-pdf", "Number every PDF page", { aliases: ["bates style pages", "footer numbers"] }),
  pdf("esign-text-pdf", "E-sign PDF with typed name", { aliases: ["typed signature pdf", "name sign pdf"] }),
  pdf("autograph-pdf", "Add autograph line to PDF", { aliases: ["self sign pdf"] }),
  pdf("camera-photos-to-pdf", "Camera photos to PDF pages", { aliases: ["phone pictures pdf"] }),
  pdf("scan-receipt-to-pdf", "Receipt photo to PDF scan", { aliases: ["expense receipt pdf"] }),
  pdf("whiteboard-photo-to-pdf", "Whiteboard photo to contrast PDF", { aliases: ["meeting board pdf"] }),
  pdf("pull-pdf-page-range", "Pull pages from PDF by range", { aliases: ["slice pdf pages"] }),
  pdf("drop-pdf-page-range", "Remove a range of PDF pages", { aliases: ["strip pdf pages"] }),
  pdf("add-text-to-pdf", "Add text to PDF (editor)", {
    description:
      "Overlay custom text on every page — position, size, opacity, and multi-line notes. Free in-browser PDF text tool; files never leave your device.",
    aliases: [
      "pdf editor text",
      "type on pdf",
      "write on pdf",
      "annotate pdf text",
      "ilovepdf alternative",
      "free pdf editor online",
      "pdf par text kaise likhe",
      "pdf me text add",
    ],
    seoKeywords:
      "add text to PDF, PDF editor online free, type on PDF, annotate PDF, browser PDF editor, privacy PDF tool, Qwickton, iLovePDF alternative",
  }),
  pdf("pdf-text-overlay", "PDF text overlay", {
    aliases: ["overlay text on pdf", "put text on pdf", "pdf label tool"],
  }),
  pdf("edit-pdf-add-text", "Edit PDF — add typed text", {
    description: "Draw typed text on all pages for quick corrections or labels. Runs locally in your browser.",
    aliases: ["pdf typing tool", "fill text pdf"],
  }),
  pdf("strip-pdf-metadata", "Strip PDF metadata (privacy)", {
    description:
      "Removes title, author, subject, keywords, creator, and producer fields before you share a PDF. Helps reduce accidental data leakage.",
    aliases: ["remove pdf properties", "clean pdf metadata", "delete pdf author"],
    seoKeywords:
      "remove PDF metadata, strip PDF properties, clean PDF online, privacy PDF, remove author from PDF, Qwickton",
  }),
  pdf("remove-pdf-metadata", "Remove metadata from PDF", { aliases: ["pdf exif remove", "sanitize pdf"] }),
  pdf("clean-pdf-properties", "Clean PDF document properties", { aliases: ["clear pdf info"] }),
  // —— Image (40) ——
  image("compress-image", "Compress image (JPG)", {
    aliases: [
      "shrink image",
      "smaller jpg",
      "reduce size",
      "smaller photo mb",
      "iphone photo compress",
      "whatsapp image size",
      "photos app smaller",
      "safari image compress",
      "upload limit photo",
    ],
  }),
  image("shrink-jpg", "Shrink JPG file size", { aliases: ["compress jpg"] }),
  image("resize-image", "Resize image (50% scale)", { aliases: ["change dimensions", "smaller photo"] }),
  image("convert-webp", "Convert image to WEBP"),
  image("image-to-webp", "Save as WEBP"),
  image("document-scan", "Document / CSC scan look"),
  image("form-scan-image", "Form and certificate scan"),
  image("school-document-scan", "School document scan mode"),
  image("auto-enhance", "Auto enhance colors"),
  image("photo-enhance-local", "Enhance photo locally"),
  image("compress-to-size", "Compress to target file size"),
  image("target-kb-compress", "Compress to exact KB"),
  image("rotate-flip", "Rotate and flip image"),
  image("rotate-photo", "Rotate photo 90° steps"),
  image("flip-horizontal", "Flip image horizontally"),
  image("flip-vertical", "Flip image vertically"),
  image("mirror-image", "Mirror image (horizontal)"),
  image("batch-image-process", "Batch image processing", {
    description:
      "Apply the same compress settings to up to 10 images in one run; download a ZIP of all outputs. Runs locally in your browser.",
    aliases: ["zip images", "bulk compress", "many photos"],
  }),
  image("quick-compress-upload", "Quick compress for uploads"),
  image("id-card-scan-look", "ID card high-contrast scan"),
  image("iphone-photo-compress", "iPhone / phone photo compress (JPG)", {
    description:
      "Shrink large camera photos for uploads and forms. If HEIC does not preview here, export JPEG from Photos first (see tip on this page).",
    aliases: ["heic too big", "camera roll compress", "ios photo smaller", "live photo compress"],
  }),
  image("screenshot-compress", "Compress phone screenshots", {
    aliases: ["ios screenshot", "full page screenshot jpeg", "screen cap smaller"],
  }),
  image("whatsapp-status-compress", "Photo for WhatsApp / social upload", {
    aliases: ["whatsapp dp", "status image", "insta upload size"],
  }),
  image("optimize-jpeg", "Optimize JPEG file size", { aliases: ["jpg smaller file", "lower jpeg size"] }),
  image("shrink-photo-file", "Shrink photo file for upload", { aliases: ["lighter photo", "reduce mb photo"] }),
  image("email-attachment-compress", "Compress image for email attachment", {
    aliases: ["outlook image size", "gmail attachment photo"],
  }),
  image("jpeg-quality-reduce", "Reduce JPEG quality / size", { aliases: ["quality slider jpg"] }),
  image("half-size-image", "Resize image to half dimensions", { aliases: ["50 percent image", "half resolution"] }),
  image("thumbnail-resize", "Resize image for thumbnails", { aliases: ["icon size image", "small preview"] }),
  image("png-to-webp-convert", "Convert PNG to WEBP", { aliases: ["png webp", "lossy png"] }),
  image("jpeg-to-webp-convert", "Convert JPEG to WEBP", { aliases: ["jpg webp"] }),
  image("format-convert-image", "Convert image format (WEBP/JPEG/PNG)", { aliases: ["change image type"] }),
  image("receipt-scan-look", "Receipt high-contrast scan look", { aliases: ["expense scan", "thermal receipt"] }),
  image("invoice-scan-mode", "Invoice document scan mode", { aliases: ["bill scan", "pdf style invoice"] }),
  image("brighten-scan-colors", "Brighten colors for readability", { aliases: ["washed photo fix", "auto color"] }),
  image("fix-underexposed-photo", "Enhance underexposed photo", { aliases: ["dark room photo", "shadow lift"] }),
  image("form-upload-kb-limit", "Compress image to a size limit", { aliases: ["portal max kb", "application photo kb"] }),
  image("rotate-image-180", "Rotate image 180°", { aliases: ["upside down fix", "flip orientation"] }),
  image("fix-upside-down-photo", "Fix upside-down photo", { aliases: ["rotate wrong way"] }),
  image("vertical-flip-photo", "Flip photo vertically", { aliases: ["upside mirror"] }),
  // —— Passport (41) ——
  passport("passport-india", "India passport photo 35×45 mm", "india", {
    aliases: ["passport size photo", "india 35 45", "passport photo india", "print sheet passport", "iphone passport photo"],
  }),
  passport("india-visa-photo", "India visa / OCI photo sheet", "india", {
    aliases: ["oci photo", "visa photo india", "indian visa photo"],
  }),
  passport("passport-usa", "USA passport 2×2 inch", "usa", {
    aliases: ["us passport photo", "2x2 photo", "american passport"],
  }),
  passport("us-visa-photo", "US visa lottery / DV photo 2×2", "usa", {
    aliases: ["dv lottery photo", "green card lottery photo", "diversity visa photo"],
  }),
  passport("schengen-passport-photo", "EU / Schengen passport photo 35×45 mm", "eu", {
    aliases: ["schengen photo", "eu passport photo", "european passport photo", "eu visa photo"],
  }),
  passport("passport-uk", "UK passport photo 35×45 mm", "uk", {
    aliases: ["british passport photo", "uk visa photo"],
  }),
  passport("uk-online-passport", "UK online passport digital photo", "uk", {
    aliases: ["uk digital passport photo", "hm passport photo"],
  }),
  passport("oci-application-photo", "OCI / India overseas citizen photo sheet", "india", {
    description: "India 35×45 mm sheet layout — useful for OCI and similar forms; print at 300 DPI locally.",
    aliases: ["oci photo sheet", "overseas citizen india photo"],
  }),
  passport("pan-card-photo-sheet", "ID-style photo sheet (India preset)", "india", {
    description: "35×45 mm tiled sheet — check your authority’s exact dimensions before printing.",
    aliases: ["india id photo grid", "form photo sheet india"],
  }),
  passport("dv-lottery-photo-sheet", "US DV lottery photo sheet (2×2)", "usa", {
    description: "2×2 inch layout for diversity visa style submissions — verify current official specs.",
    aliases: ["diversity visa photo print", "dv photo sheet"],
  }),
  passport("uk-brp-photo-size", "UK BRP / visa print photo sheet", "uk", {
    description: "UK 35×45 mm print grid — confirm the exact requirement for your application.",
    aliases: ["brp photo", "uk visa print photo"],
  }),
  passport("passport-canada", "Canada passport photo 50×70 mm", "canada", {
    aliases: [
      "canadian passport photo",
      "canada pr photo",
      "canada citizenship photo",
      "ircc photo print",
      "photo passeport canada",
    ],
  }),
  passport("passport-china", "China passport photo 33×48 mm", "china", {
    aliases: ["chinese passport photo", "china visa photo", "PRC passport size", "33 48 mm china"],
  }),
  passport("passport-australia", "Australia passport photo 35×45 mm", "australia", {
    aliases: ["australian passport photo", "aus passport print", "home affairs passport photo"],
  }),
  passport("passport-japan", "Japan passport photo 35×45 mm", "japan", {
    aliases: ["japanese passport photo", "japan visa photo", "passport photo tokyo"],
  }),
  passport("passport-south-korea", "South Korea passport photo 35×45 mm", "southkorea", {
    aliases: ["korea passport photo", "korean passport", "k eta photo", "rok passport"],
  }),
  passport("passport-brazil", "Brazil ID photo 30×40 mm (3×4 cm)", "brazil", {
    aliases: ["brazilian passport photo", "foto 3x4 brasil", "rg foto", "passaporte brasil foto"],
  }),
  passport("passport-mexico", "Mexico passport photo 35×45 mm", "mexico", {
    aliases: ["mexican passport photo", "foto pasaporte mexico", "ine photo"],
  }),
  passport("passport-singapore", "Singapore passport photo 35×45 mm", "singapore", {
    aliases: ["singapore passport size", "ica photo", "singapore pr photo"],
  }),
  passport("passport-new-zealand", "New Zealand passport photo 35×45 mm", "newzealand", {
    aliases: ["nz passport photo", "new zealand visa photo"],
  }),
  passport("passport-thailand", "Thailand passport photo 35×45 mm", "thailand", {
    aliases: ["thai passport photo", "bangkok visa photo"],
  }),
  passport("passport-nigeria", "Nigeria passport photo 35×45 mm", "nigeria", {
    aliases: ["nigerian passport photo", "nin photo", "lagos passport photo"],
  }),
  passport("passport-south-africa", "South Africa passport photo 35×45 mm", "southafrica", {
    aliases: ["south african passport photo", "smart id photo", "home affairs photo"],
  }),
  passport("passport-pakistan", "Pakistan passport photo 35×45 mm", "pakistan", {
    aliases: ["pakistani passport photo", "nadra photo", "nicop photo"],
  }),
  passport("passport-bangladesh", "Bangladesh passport photo 35×45 mm", "bangladesh", {
    aliases: ["bangladeshi passport photo", "nid bangladesh photo"],
  }),
  passport("passport-sri-lanka", "Sri Lanka passport photo 35×45 mm", "srilanka", {
    aliases: ["sri lankan passport photo", "lanka passport print"],
  }),
  passport("passport-indonesia", "Indonesia passport photo 35×45 mm", "indonesia", {
    aliases: ["indonesian passport photo", "kitas photo", "passport foto indonesia"],
  }),
  passport("passport-malaysia", "Malaysia passport photo 35×45 mm", "malaysia", {
    aliases: ["malaysian passport photo", "mykad photo", "malaysia visa photo"],
  }),
  passport("passport-philippines", "Philippines passport photo 35×45 mm", "philippines", {
    aliases: ["filipino passport photo", "dfa passport photo", "manila passport print"],
  }),
  passport("passport-vietnam", "Vietnam passport photo 40×60 mm", "vietnam", {
    aliases: ["vietnamese passport photo", "4x6 cm vietnam photo", "ho chi minh visa photo"],
  }),
  passport("passport-turkey", "Türkiye passport photo 50×60 mm", "turkey", {
    aliases: ["turkish passport photo", "turkiye visa photo", "istanbul id photo"],
  }),
  passport("passport-saudi-arabia", "Saudi Arabia ID photo 40×60 mm", "saudiarabia", {
    aliases: ["saudi passport photo", "iqama photo", "ksa visa photo", "riyadh id photo"],
  }),
  passport("passport-uae", "UAE passport / Emirates ID photo 35×45 mm", "uae", {
    aliases: ["dubai passport photo", "emirates id photo", "abu dhabi visa photo", "gcc id photo"],
  }),
  passport("passport-israel", "Israel passport photo 35×45 mm", "israel", {
    aliases: ["israeli passport photo", "teudat zehut photo"],
  }),
  passport("passport-egypt", "Egypt passport photo 40×60 mm", "egypt", {
    aliases: ["egyptian passport photo", "cairo passport photo"],
  }),
  passport("passport-kenya", "Kenya passport photo 35×45 mm", "kenya", {
    aliases: ["kenyan passport photo", "nairobi visa photo", "kenya eta photo"],
  }),
  passport("passport-russia", "Russia passport photo 35×45 mm", "russia", {
    aliases: ["russian passport photo", "moscow visa photo"],
  }),
  passport("passport-argentina", "Argentina passport photo 40×40 mm", "argentina", {
    aliases: ["argentine passport photo", "dni argentina foto", "buenos aires passport photo"],
  }),
  passport("passport-colombia", "Colombia passport photo 35×45 mm", "colombia", {
    aliases: ["colombian passport photo", "cedula colombia foto"],
  }),
  passport("passport-chile", "Chile passport photo 35×45 mm", "chile", {
    aliases: ["chilean passport photo", "santiago passport photo"],
  }),
  passport("passport-peru", "Peru passport photo 35×45 mm", "peru", {
    aliases: ["peruvian passport photo", "dni peru foto", "lima passport photo"],
  }),
  // —— Background (9) ——
  background("ai-background-removal", "AI background removal", {
    aliases: ["remove bg", "cut out person", "png transparent", "remove background photo", "iphone remove background", "phone cutout"],
  }),
  background("transparent-portrait", "Transparent PNG portrait"),
  background("product-cutout", "Product photo background cutout", { aliases: ["amazon white bg", "catalog photo"] }),
  background("remove-backdrop", "Remove image backdrop (AI)", { aliases: ["erase background", "no background"] }),
  background("linkedin-headshot-bg", "LinkedIn-style headshot cutout", {
    description: "AI background removal in-browser — export transparent PNG or a solid color.",
    aliases: ["professional profile bg", "resume photo cutout"],
  }),
  background("ecommerce-white-background", "E-commerce white background product", {
    aliases: ["amazon listing bg", "marketplace product photo"],
  }),
  background("resume-photo-transparent", "Resume CV photo transparent PNG", { aliases: ["job application photo"] }),
  background("real-estate-photo-cutout", "Listing photo background remover", { aliases: ["property photo bg"] }),
  background("youtube-thumbnail-cutout", "Thumbnail subject cutout", { aliases: ["channel art cutout"] }),
  // —— Word / DOCX (17) ——
  word("word-to-pdf", "Word DOCX to PDF", {
    aliases: ["docx pdf", "word convert pdf", "microsoft word pdf", "ms word pdf"],
  }),
  word("docx-to-pdf", "DOCX to PDF (browser)", { aliases: ["convert docx", "document to pdf"] }),
  word("microsoft-word-pdf", "Microsoft Word to PDF"),
  word("document-docx-pdf", "Document DOCX to PDF"),
  word("office-word-convert-pdf", "Office Word convert PDF"),
  word("docx-preview", "DOCX HTML preview"),
  word("docx-html-preview", "Preview DOCX as HTML"),
  word("docx-text-extract", "DOCX plain text extract"),
  word("extract-docx-text", "Extract text from DOCX"),
  word("document-content-reader", "Document content reader (DCR)"),
  word("dcr-docx", "DCR: read DOCX text locally"),
  word("legacy-doc-help", "Legacy .doc vs .docx help"),
  word("google-docs-save-docx", "Google Docs export as DOCX for PDF", {
    description: "Use this hub after exporting .docx from Google Docs — preview, text extract, or PDF in-browser.",
    aliases: ["docs to docx pdf", "gdoc to pdf"],
  }),
  word("resume-docx-to-pdf", "Resume DOCX to PDF", { aliases: ["cv docx pdf", "job docx export"] }),
  word("contract-docx-preview", "Contract DOCX preview locally", { aliases: ["legal docx read"] }),
  word("report-docx-print-pdf", "Report DOCX to print PDF", { aliases: ["docx print ready"] }),
  word("assignment-docx-convert", "Assignment DOCX to PDF", { aliases: ["homework docx pdf"] }),
  // —— Converter (20) ——
  converter("/converter?tab=image&out=png", "jpg-to-png", "JPG to PNG"),
  converter("/converter?tab=image&out=jpeg", "png-to-jpg", "PNG to JPG"),
  converter("/converter?tab=image&out=webp", "jpg-to-webp", "JPG to WEBP"),
  converter("/converter?tab=image&out=webp", "png-to-webp-alt", "PNG to WEBP"),
  converter("/converter?tab=image&out=jpeg", "webp-to-jpg", "WEBP to JPG"),
  converter("/converter?tab=image&out=png", "webp-to-png", "WEBP to PNG"),
  converter("/converter?tab=excel", "excel-to-csv", "Excel to CSV", {
    aliases: ["xlsx csv", "sheet to csv", "excel spreadsheet csv", "spreadsheet csv"],
  }),
  converter("/converter?tab=excel", "xlsx-to-csv", "XLSX to CSV download", { aliases: ["excel export csv"] }),
  converter("/converter?tab=excel", "spreadsheet-csv", "Spreadsheet export CSV"),
  converter("/converter?tab=csv", "csv-to-excel", "CSV to Excel", { aliases: ["csv xlsx", "open csv excel"] }),
  converter("/converter?tab=csv", "csv-to-xlsx", "CSV to XLSX"),
  converter("/converter?tab=csv", "open-csv-excel", "Open CSV in Excel format"),
  converter("/converter?tab=image", "image-format-converter", "Image format converter"),
  converter("/converter?tab=excel", "xls-convert-csv", "XLS / XLSX to CSV"),
  converter("/converter?tab=csv", "data-sheet-csv-excel", "Data sheet CSV ↔ Excel"),
  converter("/converter?tab=image&out=webp", "gif-convert-note", "Raster image to WEBP (use JPG/PNG)", {
    description: "Upload PNG or JPEG — animated GIF is not supported here; convert still frames to WEBP locally.",
    aliases: ["gif to webp not supported", "static image webp"],
  }),
  converter("/converter?tab=excel", "google-sheets-export-csv", "Sheets export to CSV-style", {
    description: "Export from Google Sheets as .xlsx first, then convert the file to UTF-8 CSV here — all local.",
    aliases: ["sheets xlsx csv", "spreadsheet download csv"],
  }),
  converter("/converter?tab=csv", "notepad-csv-to-excel", "Open Notepad CSV in Excel", {
    aliases: ["comma file xlsx", "txt csv excel"],
  }),
  converter("/converter?tab=image&out=png", "logo-png-export", "Logo / icon to PNG", { aliases: ["brand png export"] }),
  converter("/converter?tab=image&out=jpeg", "social-jpeg-export", "Social-friendly JPEG export", {
    aliases: ["compress style jpeg tab"],
  }),
  // —— Text (29) ——
  text("json-pretty", "JSON pretty print", { aliases: ["beautify json", "format json online"] }),
  text("json-minify", "JSON minify", { aliases: ["compress json"] }),
  text("json-format", "Format JSON"),
  text("validate-json", "Validate JSON", { aliases: ["json lint", "check json"] }),
  text("base64-encode", "Base64 encode text", { aliases: ["b64 encode", "encode base64"] }),
  text("base64-decode", "Base64 decode to text"),
  text("text-to-base64", "Plain text to Base64"),
  text("url-encode", "URL encode (percent encoding)"),
  text("url-decode", "URL decode"),
  text("encode-uri-component", "Encode URI component"),
  text("html-escape", "Escape HTML entities"),
  text("html-unescape", "Unescape HTML"),
  text("uppercase-text", "UPPERCASE text"),
  text("lowercase-text", "lowercase text"),
  text("title-case-text", "Title Case Text"),
  text("trim-lines", "Trim each line"),
  text("remove-empty-lines", "Remove empty lines"),
  text("sort-lines", "Sort lines A–Z"),
  text("dedupe-lines", "Remove duplicate lines"),
  text("reverse-text", "Reverse characters"),
  text("slugify", "Slugify for URLs"),
  text("uuid-v4", "Generate UUID v4"),
  text("random-uuid", "Random UUID"),
  text("word-count", "Word and character count", { aliases: ["count words online", "how many words"] }),
  text("stats-text", "Text statistics", { aliases: ["char count", "line count"] }),
  text("sha-256-text", "SHA-256 hash of text (hex)", {
    description: "Computes a SHA-256 digest of your buffer in hex — entirely in the browser (SubtleCrypto).",
    aliases: ["hash string", "checksum text", "sha256 online local"],
  }),
  text("hash-text-hex", "Text to SHA-256 hex", { aliases: ["digest string", "crypto hash"] }),
  text("sort-lines-desc", "Sort lines Z–A", { aliases: ["reverse sort lines", "descending sort"] }),
  text("sort-lines-z-a", "Reverse alphabetical lines", { aliases: ["lines newest first sort"] }),
];

export const TOOL_CATALOG_COUNT = TOOL_CATALOG.length;
