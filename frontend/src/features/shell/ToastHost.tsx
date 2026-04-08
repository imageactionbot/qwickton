import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type ToastItem, subscribeToasts } from "../../lib/toast/toastBus";

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return createPortal(
    <div className="qk-toast-stack" aria-live="polite" aria-relevant="additions text">
      {items.map((t) => (
        <div key={t.id} className={`qk-toast qk-toast--${t.tone}`} role="status">
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
