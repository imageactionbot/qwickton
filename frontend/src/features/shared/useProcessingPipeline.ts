import { useCallback, useEffect, useRef, useState } from "react";
import { formatProcessingError } from "../../lib/errors/userFacingError";

export type ProcessingState = "idle" | "validating" | "processing" | "done" | "error";

export function useProcessingPipeline<TInput, TOutput>(
  processFn: (input: TInput, signal: AbortSignal) => Promise<TOutput>
) {
  const [state, setState] = useState<ProcessingState>("idle");
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<TOutput | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const activeJobIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const run = useCallback(
    async (input: TInput): Promise<{ ok: boolean; output: TOutput | null }> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      activeJobIdRef.current = jobId;
      setState("validating");
      setError("");
      setResult(null);
      setProgress(0);
      const start = Date.now();
      setStartedAt(start);
      setElapsedMs(0);
      try {
        setState("processing");
        const output = await processFn(input, ac.signal);
        if (activeJobIdRef.current !== jobId) return { ok: false, output: null };
        setResult(output);
        setState("done");
        setProgress(100);
        activeJobIdRef.current = null;
        return { ok: true, output };
      } catch (err) {
        if (activeJobIdRef.current !== jobId) return { ok: false, output: null };
        if (err instanceof DOMException && err.name === "AbortError") {
          setState("idle");
          setProgress(0);
          activeJobIdRef.current = null;
          return { ok: false, output: null };
        }
        if (ac.signal.aborted) {
          setState("idle");
          setProgress(0);
          activeJobIdRef.current = null;
          return { ok: false, output: null };
        }
        setState("error");
        setError(formatProcessingError(err));
        activeJobIdRef.current = null;
        return { ok: false, output: null };
      }
    },
    [processFn]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState("idle");
    setError("");
    setProgress(0);
    setElapsedMs(0);
    activeJobIdRef.current = null;
  }, []);

  useEffect(() => {
    if (state !== "processing" || !startedAt) return;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [state, startedAt]);

  return { state, error, result, progress, elapsedMs, run, cancel, setProgress };
}
