import { useEffect, useState } from "react";
import {
  type ThemeChoice,
  getStoredTheme,
  setStoredTheme,
} from "../../lib/theme/themePreference";

function labelFor(choice: ThemeChoice): string {
  if (choice === "system") return "Theme: follow system (click to use light)";
  if (choice === "light") return "Theme: light (click for dark)";
  return "Theme: dark (click to follow system)";
}

function iconFor(choice: ThemeChoice): "system" | "sun" | "moon" {
  if (choice === "system") return "system";
  if (choice === "light") return "sun";
  return "moon";
}

type Props = {
  className?: string;
  /** `fab` = small fixed corner control; `drawer` = full-width row with label */
  variant?: "header" | "drawer" | "fab";
};

const iconPx = (variant: Props["variant"]) => (variant === "fab" ? 18 : 20);

export function ThemeToggle({ className = "", variant = "header" }: Props) {
  const [choice, setChoice] = useState<ThemeChoice>(() =>
    typeof window === "undefined" ? "system" : getStoredTheme()
  );

  useEffect(() => {
    setChoice(getStoredTheme());
  }, []);

  const cycle = () => {
    const order: ThemeChoice[] = ["system", "light", "dark"];
    const i = order.indexOf(choice);
    const next = order[(i + 1) % order.length];
    setStoredTheme(next);
    setChoice(next);
  };

  const icon = iconFor(choice);
  const label = labelFor(choice);
  const px = iconPx(variant);
  const variantClass =
    variant === "drawer" ? " theme-toggle-btn--drawer" : variant === "fab" ? " theme-toggle-btn--fab" : "";

  return (
    <button
      type="button"
      className={`theme-toggle-btn${variantClass} ${className}`.trim()}
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      {icon === "system" ? (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" strokeLinecap="round" />
        </svg>
      ) : icon === "sun" ? (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
        </svg>
      )}
      {variant === "drawer" ? <span className="theme-toggle-drawer-label">Theme</span> : null}
    </button>
  );
}
