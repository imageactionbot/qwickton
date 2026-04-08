/** Normalize worker/unknown failures for UI (no stack traces). */
export function formatUserFacingMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (/password|encrypt|encrypted/i.test(m)) {
      return "This PDF appears password-protected or encrypted. Unlock or re-export it from a desktop reader, then try again.";
    }
    if (/Invalid PDF|PDF header|PDF parsing/i.test(m)) {
      return "Could not read this file as a PDF. Try re-exporting from the original app, or use Re-save / repair.";
    }
    if (/Image too large|exceeds maximum|Canvas size/i.test(m)) {
      return m;
    }
    if (/No valid pages|Invalid range|Invalid page|Cannot delete every page|Enter page range/i.test(m)) {
      return m;
    }
    if (/not a valid DOCX|DOCX \(Office Open XML\)|Could not read document/i.test(m)) {
      return "This file is not a valid Word .docx. Open it in Word or Google Docs, use Save As → .docx, then try again.";
    }
    return m;
  }
  return "Something went wrong. Try a smaller file or a different format.";
}

export function formatProcessingError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Cancelled.";
  }
  return formatUserFacingMessage(err);
}
