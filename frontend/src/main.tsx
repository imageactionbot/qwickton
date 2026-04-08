import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { bootstrapAdsense } from "./lib/ads/bootstrapAdsense";
import { initThemeFromStorage } from "./lib/theme/themePreference";
import "./styles.css";

initThemeFromStorage();
bootstrapAdsense();

createRoot(document.getElementById("qwickton-app") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
