/**
 * Passport / visa sheet presets: physical print sizes in mm (before DPI scaling).
 * UI is English; sizes follow common official specs — users must verify current rules.
 */
export const PASSPORT_PRESET_SPECS = {
  india: { widthMm: 35, heightMm: 45, shortLabel: "India" },
  usa: { widthMm: 51, heightMm: 51, shortLabel: "USA (2×2 inch)" },
  uk: { widthMm: 35, heightMm: 45, shortLabel: "United Kingdom" },
  eu: { widthMm: 35, heightMm: 45, shortLabel: "EU / Schengen" },
  canada: { widthMm: 50, heightMm: 70, shortLabel: "Canada" },
  china: { widthMm: 33, heightMm: 48, shortLabel: "China" },
  australia: { widthMm: 35, heightMm: 45, shortLabel: "Australia" },
  japan: { widthMm: 35, heightMm: 45, shortLabel: "Japan" },
  southkorea: { widthMm: 35, heightMm: 45, shortLabel: "South Korea" },
  brazil: { widthMm: 30, heightMm: 40, shortLabel: "Brazil (3×4 cm)" },
  mexico: { widthMm: 35, heightMm: 45, shortLabel: "Mexico" },
  singapore: { widthMm: 35, heightMm: 45, shortLabel: "Singapore" },
  newzealand: { widthMm: 35, heightMm: 45, shortLabel: "New Zealand" },
  thailand: { widthMm: 35, heightMm: 45, shortLabel: "Thailand" },
  nigeria: { widthMm: 35, heightMm: 45, shortLabel: "Nigeria" },
  southafrica: { widthMm: 35, heightMm: 45, shortLabel: "South Africa" },
  pakistan: { widthMm: 35, heightMm: 45, shortLabel: "Pakistan" },
  bangladesh: { widthMm: 35, heightMm: 45, shortLabel: "Bangladesh" },
  srilanka: { widthMm: 35, heightMm: 45, shortLabel: "Sri Lanka" },
  indonesia: { widthMm: 35, heightMm: 45, shortLabel: "Indonesia" },
  malaysia: { widthMm: 35, heightMm: 45, shortLabel: "Malaysia" },
  philippines: { widthMm: 35, heightMm: 45, shortLabel: "Philippines" },
  vietnam: { widthMm: 40, heightMm: 60, shortLabel: "Vietnam (4×6 cm)" },
  turkey: { widthMm: 50, heightMm: 60, shortLabel: "Türkiye" },
  saudiarabia: { widthMm: 40, heightMm: 60, shortLabel: "Saudi Arabia" },
  uae: { widthMm: 35, heightMm: 45, shortLabel: "United Arab Emirates" },
  israel: { widthMm: 35, heightMm: 45, shortLabel: "Israel" },
  egypt: { widthMm: 40, heightMm: 60, shortLabel: "Egypt" },
  kenya: { widthMm: 35, heightMm: 45, shortLabel: "Kenya" },
  russia: { widthMm: 35, heightMm: 45, shortLabel: "Russia" },
  argentina: { widthMm: 40, heightMm: 40, shortLabel: "Argentina" },
  colombia: { widthMm: 35, heightMm: 45, shortLabel: "Colombia" },
  chile: { widthMm: 35, heightMm: 45, shortLabel: "Chile" },
  peru: { widthMm: 35, heightMm: 45, shortLabel: "Peru" },
} as const;

export type PassportCountryPreset = keyof typeof PASSPORT_PRESET_SPECS;

const VERIFY =
  "Always check your government’s latest photo rules (background, expression, glasses) before submitting — sizes change occasionally.";

const ICAO_WHAT =
  "Tiles your portrait into the standard 35×45 mm cells on a printable A4 JPEG at the DPI you choose (face auto-frame where supported).";
const ICAO_BEST = `ICAO-style photos used by many countries’ passports and visas. ${VERIFY}`;

export const PRESET_SIZES = Object.fromEntries(
  (Object.keys(PASSPORT_PRESET_SPECS) as PassportCountryPreset[]).map((key) => {
    const s = PASSPORT_PRESET_SPECS[key];
    return [key, { widthMm: s.widthMm, heightMm: s.heightMm, label: `${s.shortLabel} ${s.widthMm}×${s.heightMm} mm` }];
  })
) as Record<PassportCountryPreset, { widthMm: number; heightMm: number; label: string }>;

export const PRESET_GUIDE: Record<PassportCountryPreset, { what: string; bestFor: string }> = {
  india: {
    what: "Crops to 35×45 mm cells on an A4 print sheet at your chosen DPI.",
    bestFor: `India passport, PAN-style ID grids, and many visa printouts. ${VERIFY}`,
  },
  usa: {
    what: "Square 2×2 inch (51×51 mm) cells on a printable sheet.",
    bestFor: `US passport book, visa, and many federal IDs that specify 2×2 inch prints. ${VERIFY}`,
  },
  uk: {
    what: "35×45 mm layout for UK-standard print submissions.",
    bestFor: `UK passport and many Home Office print specifications. ${VERIFY}`,
  },
  eu: {
    what: "35×45 mm cells matching most EU national ID and Schengen visa print specs.",
    bestFor: `EU member states and Schengen-area visa photos when a 35×45 mm print is required. ${VERIFY}`,
  },
  canada: {
    what: "50×70 mm portrait cells — common Canadian citizenship and immigration print sizes.",
    bestFor: `Canadian passport-style prints where a 50×70 mm photo is listed. ${VERIFY}`,
  },
  china: {
    what: "33×48 mm vertical photo cells used on many Chinese passport and travel-document guides.",
    bestFor: `PRC passport and related print layouts that specify 33×48 mm. ${VERIFY}`,
  },
  australia: {
    what: ICAO_WHAT,
    bestFor: `Australian passport and many Commonwealth forms that use 35×45 mm prints. ${VERIFY}`,
  },
  japan: {
    what: ICAO_WHAT,
    bestFor: `Japanese passport renewals and many East Asian visa prints at 35×45 mm. ${VERIFY}`,
  },
  southkorea: {
    what: ICAO_WHAT,
    bestFor: `South Korean passport and many K-ETA / embassy submissions using 35×45 mm. ${VERIFY}`,
  },
  brazil: {
    what: "30×40 mm (3×4 cm) cells typical of Brazilian ID and consular print sheets.",
    bestFor: `Brazilian carteira de identidade style prints and similar Latin American 3×4 cm grids. ${VERIFY}`,
  },
  mexico: {
    what: ICAO_WHAT,
    bestFor: `Mexican passport, INE-style guidance, and many consular forms at 35×45 mm. ${VERIFY}`,
  },
  singapore: {
    what: ICAO_WHAT,
    bestFor: `Singapore passport, PR, and work-pass photo print requirements at 35×45 mm. ${VERIFY}`,
  },
  newzealand: {
    what: ICAO_WHAT,
    bestFor: `New Zealand passport and visa prints that specify 35×45 mm. ${VERIFY}`,
  },
  thailand: {
    what: ICAO_WHAT,
    bestFor: `Thai passport and many ASEAN visa print templates at 35×45 mm. ${VERIFY}`,
  },
  nigeria: {
    what: ICAO_WHAT,
    bestFor: `Nigerian passport, NIN-related, and West African visa prints commonly at 35×45 mm. ${VERIFY}`,
  },
  southafrica: {
    what: ICAO_WHAT,
    bestFor: `South African passport and smart ID print specs that use 35×45 mm. ${VERIFY}`,
  },
  pakistan: {
    what: ICAO_WHAT,
    bestFor: `Pakistani passport, NICOP, and Nadra-style print layouts at 35×45 mm. ${VERIFY}`,
  },
  bangladesh: {
    what: ICAO_WHAT,
    bestFor: `Bangladesh passport, NID, and visa print sheets at 35×45 mm. ${VERIFY}`,
  },
  srilanka: {
    what: ICAO_WHAT,
    bestFor: `Sri Lankan passport and NIC-style submissions at 35×45 mm. ${VERIFY}`,
  },
  indonesia: {
    what: ICAO_WHAT,
    bestFor: `Indonesian passport, KITAS/KITAP, and many visa prints at 35×45 mm. ${VERIFY}`,
  },
  malaysia: {
    what: ICAO_WHAT,
    bestFor: `Malaysian passport, MyKad-related submissions, and regional visa prints. ${VERIFY}`,
  },
  philippines: {
    what: ICAO_WHAT,
    bestFor: `Philippine passport, DFA, and consular photo print specs at 35×45 mm. ${VERIFY}`,
  },
  vietnam: {
    what: "40×60 mm (4×6 cm) cells often listed for Vietnamese passport and visa prints.",
    bestFor: `Vietnam passport / visa office photo sheets that require 4×6 cm prints. ${VERIFY}`,
  },
  turkey: {
    what: "50×60 mm cells seen on many Turkish ID and visa print guidelines.",
    bestFor: `Türkiye passport, e-visa office, or residence prints that ask for 50×60 mm. ${VERIFY}`,
  },
  saudiarabia: {
    what: "40×60 mm layout used on several Gulf-state ID and visa print examples.",
    bestFor: `Saudi Iqama-related and embassy prints that specify 40×60 mm — confirm your form. ${VERIFY}`,
  },
  uae: {
    what: ICAO_WHAT,
    bestFor: `UAE passport, Emirates ID, and many Dubai / Abu Dhabi visa prints at 35×45 mm. ${VERIFY}`,
  },
  israel: {
    what: ICAO_WHAT,
    bestFor: `Israeli passport, Teudat Zehut-style, and many Middle East visa prints at 35×45 mm. ${VERIFY}`,
  },
  egypt: {
    what: "40×60 mm portrait grid common for Egyptian national ID print examples.",
    bestFor: `Egypt passport and civil registry photo prints that list 40×60 mm. ${VERIFY}`,
  },
  kenya: {
    what: ICAO_WHAT,
    bestFor: `Kenyan passport, eTA, and East African visa submissions at 35×45 mm. ${VERIFY}`,
  },
  russia: {
    what: ICAO_WHAT,
    bestFor: `Russian passport, internal ID, and CIS visa prints often at 35×45 mm. ${VERIFY}`,
  },
  argentina: {
    what: "40×40 mm square cells frequent on Argentine DNI / passport print guides.",
    bestFor: `Argentine national ID style submissions requiring square 40 mm prints. ${VERIFY}`,
  },
  colombia: {
    what: ICAO_WHAT,
    bestFor: `Colombian passport, cédula-related, and Andean visa prints at 35×45 mm. ${VERIFY}`,
  },
  chile: {
    what: ICAO_WHAT,
    bestFor: `Chilean passport and many consular print layouts at 35×45 mm. ${VERIFY}`,
  },
  peru: {
    what: ICAO_WHAT,
    bestFor: `Peruvian passport, DNI-related submissions, and regional visa prints. ${VERIFY}`,
  },
};

const PRESET_KEY_SET = new Set(Object.keys(PASSPORT_PRESET_SPECS) as PassportCountryPreset[]);

export function isPassportPreset(v: string): v is PassportCountryPreset {
  return PRESET_KEY_SET.has(v as PassportCountryPreset);
}

/** Optgroup order for the country dropdown (every preset appears once). */
export const PASSPORT_PRESET_GROUPS: { label: string; presets: PassportCountryPreset[] }[] = [
  { label: "South Asia", presets: ["india", "pakistan", "bangladesh", "srilanka"] },
  {
    label: "Asia–Pacific",
    presets: ["china", "japan", "southkorea", "australia", "newzealand", "singapore", "thailand", "indonesia", "malaysia", "philippines", "vietnam"],
  },
  { label: "Middle East & North Africa", presets: ["uae", "saudiarabia", "israel", "turkey", "egypt"] },
  { label: "Europe & Central Asia", presets: ["uk", "eu", "russia"] },
  { label: "Americas", presets: ["usa", "canada", "mexico", "brazil", "argentina", "colombia", "chile", "peru"] },
  { label: "Africa", presets: ["nigeria", "southafrica", "kenya"] },
];

export const PASSPORT_PRESET_ORDER: PassportCountryPreset[] = PASSPORT_PRESET_GROUPS.flatMap((g) => g.presets);
