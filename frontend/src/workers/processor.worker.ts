/**
 * Minimal delay worker for pipeline tests. Real background removal runs on the main thread via @imgly/background-removal.
 */
self.onmessage = async (event: MessageEvent) => {
  const { jobId, payload } = event.data as { jobId: string; payload: { delayMs: number } };
  await new Promise((resolve) => setTimeout(resolve, payload.delayMs));
  self.postMessage({ jobId, ok: true });
};
