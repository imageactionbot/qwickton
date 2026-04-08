import type { ProcessingState } from "./useProcessingPipeline";

type Props = {
  state: ProcessingState;
  progress: number;
  elapsedMs: number;
  etaSec?: number | null;
  liveRegionId?: string;
};

/** Human text for screen readers (no jargon like ETA / elapsed). */
function announcePhrase(
  state: ProcessingState,
  progress: number,
  elapsedSec: number,
  etaSec: number | null | undefined,
  indeterminate: boolean
): string {
  if (state === "validating") {
    return "Getting ready. Please wait.";
  }
  const base = indeterminate
    ? "Working on your file. Please wait."
    : `Working on your file. About ${Math.round(progress)} percent done.`;
  const secondsSoFar =
    elapsedSec >= 1 ? ` Time so far: about ${Math.round(elapsedSec)} seconds.` : "";
  const guessLeft =
    etaSec != null && etaSec > 0 ? ` Rough guess for time left: about ${etaSec} seconds.` : "";
  return `${base}${secondsSoFar}${guessLeft}`;
}

export function ProcessingStatusPanel({
  state,
  progress,
  elapsedMs,
  etaSec,
  liveRegionId = "processing-status-live",
}: Props) {
  if (state !== "validating" && state !== "processing") {
    return null;
  }

  const elapsedSec = elapsedMs / 1000;
  const headline = state === "validating" ? "Getting ready…" : "Working on your file…";
  const indeterminate = state === "validating" || progress < 1;
  const displayPct = indeterminate ? null : Math.min(100, Math.max(0, Math.round(progress)));
  const polite = announcePhrase(state, progress, elapsedSec, etaSec, indeterminate);

  let stageActive: 1 | 2 | 3 = 1;
  if (state === "processing") {
    if (displayPct != null) {
      if (displayPct >= 85) stageActive = 3;
      else if (displayPct >= 25) stageActive = 2;
    } else if (!indeterminate) stageActive = 2;
  }

  return (
    <div className="processing-live" role="status">
      <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </p>
      <div className="processing-ai-stages" aria-hidden>
        <span
          className={`processing-ai-stage${stageActive >= 1 ? " is-active" : ""}${
            stageActive === 1 ? " is-current" : ""
          }`}
        >
          Ingest
        </span>
        <span className="processing-ai-stage-connector" />
        <span
          className={`processing-ai-stage${stageActive >= 2 ? " is-active" : ""}${
            stageActive === 2 ? " is-current" : ""
          }`}
        >
          Transform
        </span>
        <span className="processing-ai-stage-connector" />
        <span
          className={`processing-ai-stage${stageActive >= 3 ? " is-active" : ""}${
            stageActive === 3 ? " is-current" : ""
          }`}
        >
          Finish
        </span>
      </div>
      <p className="processing-live-headline">{headline}</p>
      <div
        className={`processing-progress-track${indeterminate ? " is-indeterminate" : ""}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayPct ?? undefined}
        aria-valuetext={indeterminate ? "In progress" : `${displayPct} percent`}
        aria-label="How much of the job is finished"
      >
        {!indeterminate && displayPct !== null && (
          <div className="processing-progress-fill" style={{ width: `${displayPct}%` }} />
        )}
        {indeterminate && <div className="processing-progress-fill processing-progress-fill--indeterminate" />}
      </div>
      {!indeterminate && displayPct !== null && (
        <p className="processing-live-percent" aria-hidden="true">
          About {displayPct}% done
        </p>
      )}

      <details className="processing-time-details">
        <summary>Show timing details</summary>
        <div className="processing-time-details-body">
          <p>
            <strong>Time so far:</strong>{" "}
            {elapsedSec < 1 ? "just started" : `about ${elapsedSec.toFixed(1)} seconds`}
          </p>
          {state === "processing" && etaSec !== null && etaSec !== undefined && etaSec > 0 && (
            <p>
              <strong>Rough guess, time left:</strong> about {etaSec} seconds (not exact)
            </p>
          )}
          <p className="processing-time-hint">You can ignore this — it’s only if you’re curious.</p>
        </div>
      </details>
    </div>
  );
}
