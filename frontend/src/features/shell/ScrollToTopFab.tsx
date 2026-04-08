import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 260;

type Props = {
  /** Hide while mobile drawer / modal chrome would clash */
  suppressed?: boolean;
};

export function ScrollToTopFab({ suppressed }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.scrollingElement ?? document.documentElement;
    const onScroll = () => setShow(el.scrollTop > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (suppressed || !show) return null;

  const goTop = () => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className="scroll-to-top-fab no-print"
      onClick={goTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        className="scroll-to-top-fab-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
