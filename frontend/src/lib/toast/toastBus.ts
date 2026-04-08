export type ToastTone = "info" | "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

const listeners = new Set<(items: ToastItem[]) => void>();
let seq = 0;
let items: ToastItem[] = [];

function notify(): void {
  const snap = [...items];
  listeners.forEach((fn) => fn(snap));
}

/** Brief message shown above chrome; safe for errors from Dropzone and copy actions. */
export function showToast(message: string, tone: ToastTone = "info", durationMs = 4200): void {
  const id = ++seq;
  items = [...items, { id, message, tone }];
  notify();
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    notify();
  }, durationMs);
}

export function subscribeToasts(cb: (items: ToastItem[]) => void): () => void {
  listeners.add(cb);
  cb([...items]);
  return () => listeners.delete(cb);
}
