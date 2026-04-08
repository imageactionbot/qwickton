export type InternationalToolCategory =
  | "pdf"
  | "image"
  | "passport"
  | "background"
  | "converter"
  | "text"
  | "word";

/**
 * Multilingual / regional phrases (mostly Latin script) merged into:
 * - meta keywords (via keywordsForToolEntry)
 * - on-site fuzzy search haystack
 *
 * Single-language UI (English); these help discovery from different countries’ search habits.
 * Keep additions concise to avoid keyword-stuffed pages.
 */
const CATEGORY_DISCOVERY: Record<InternationalToolCategory, string> = {
  pdf: [
    "merge pdf free online",
    "combine pdf browser",
    "fusionar pdf gratis",
    "combinar pdf en linea",
    "juntar pdf",
    "unir pdf",
    "mesclar pdf",
    "pdf gratuit",
    "pdf gratuito",
    "pdf zusammenfugen kostenlos",
    "fusionner pdf gratuit",
    "pdf join no upload",
    "private pdf tool",
    "India USA UK Canada Australia worldwide",
  ].join(" "),

  image: [
    "compress jpg online free",
    "resize image browser",
    "comprimir imagen gratis",
    "redimensionar foto",
    "reduce image size",
    "webp png jpeg convert",
    "local image editor",
  ].join(" "),

  passport: [
    "passport photo online",
    "India Pakistan Bangladesh Sri Lanka passport size",
    "US Canada Mexico Brazil Chile Argentina Peru Colombia",
    "UK EU Schengen Russia visa photo",
    "China Japan Korea Australia New Zealand",
    "Singapore Thailand Malaysia Indonesia Philippines Vietnam",
    "UAE Saudi Israel Turkey Egypt passport",
    "Nigeria South Africa Kenya visa photo",
    "biometric photo print sheet",
    "ICAO 35x45 mm",
    "2x2 inch US photo",
    "50x70 Canada photo",
    "40x60 visa photo",
    "foto pasaporte carnet photo identite passfoto",
    "print sheet 300 dpi",
  ].join(" "),

  background: [
    "remove background free",
    "transparent png",
    "quitar fondo",
    "remover fundo",
    "effacer arriere plan",
    "hintergrund entfernen",
    "AI cutout browser",
  ].join(" "),

  converter: [
    "excel to csv online",
    "xlsx converter",
    "convertidor hoja de calculo",
    "convertisseur tableau",
    "spreadsheet local convert",
    "csv xlsx free",
  ].join(" "),

  text: [
    "text utilities online",
    "word counter",
    "json formatter",
    "base64 encode decode",
    "herramientas texto",
    "browser text tools",
  ].join(" "),

  word: [
    "word to pdf online",
    "docx to pdf free",
    "convertir docx pdf",
    "docx converter browser",
    "microsoft word pdf",
    "local docx tool",
  ].join(" "),
};

/** Extra haystack / keywords for a catalog category (all tools in that hub). */
export function categoryDiscoveryHaystack(category: InternationalToolCategory): string {
  return CATEGORY_DISCOVERY[category] ?? "";
}

/** Homepage / global keyword line (use together with task-specific keywords). */
export const HOME_INTERNATIONAL_KEYWORDS =
  "free online tools worldwide, browser PDF tools, image tools, no login, privacy, merge PDF, compress JPG, passport photo, DOCX PDF, remove background, Excel CSV, Qwickton";
