import { useEffect } from "react";

export function setJsonLd(scriptId: string, data: Record<string, unknown>): void {
  let el = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = scriptId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useJsonLd(scriptId: string, data: Record<string, unknown> | null | undefined): void {
  useEffect(() => {
    if (!data || !Object.keys(data).length) return;
    setJsonLd(scriptId, data);
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [scriptId, data]);
}
