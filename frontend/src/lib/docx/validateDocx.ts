/** Reject legacy `.doc` and non-DOCX uploads before any ArrayBuffer work. */
export function validateDocxFile(file: File, onError: (message: string) => void): boolean {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    onError(
      "Classic .doc (Word 97–2003) is not supported in the browser. In Word use Save As → .docx, then try again."
    );
    return false;
  }
  if (!lower.endsWith(".docx")) {
    onError("Please upload a .docx file (Office Open XML).");
    return false;
  }
  return true;
}
