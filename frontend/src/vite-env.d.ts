/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  /** Google AdSense publisher id, e.g. ca-pub-1234567890123456 — enables Auto Ads when set */
  readonly VITE_ADSENSE_CLIENT?: string;
  /** Google Analytics 4 Measurement ID, e.g. G-XXXXXXXXXX */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
