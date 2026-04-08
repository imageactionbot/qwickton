export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "qwickton_theme";

export function getStoredTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function setStoredTheme(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore */
  }
  applyTheme(choice);
}

function resolveDark(choice: ThemeChoice): boolean {
  if (choice === "dark") return true;
  if (choice === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies `data-theme` on `<html>` and syncs `theme-color` meta for UI chrome. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  const dark = resolveDark(choice);
  root.dataset.theme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", dark ? "#0f172a" : "#3d5aed");
  }
}

export function initThemeFromStorage(): void {
  applyTheme(getStoredTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
}
