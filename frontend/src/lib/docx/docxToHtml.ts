import DOMPurify from "dompurify";
import mammoth from "mammoth";

export type DocxHtmlResult = {
  html: string;
  messages: string[];
};

function looksLikeZip(arrayBuffer: ArrayBuffer): boolean {
  if (arrayBuffer.byteLength < 4) return false;
  const u8 = new Uint8Array(arrayBuffer, 0, 4);
  return u8[0] === 0x50 && u8[1] === 0x4b;
}

/** Parse DOCX to HTML using mammoth (browser-local). */
export async function convertDocxToHtml(arrayBuffer: ArrayBuffer): Promise<DocxHtmlResult> {
  if (!arrayBuffer.byteLength) {
    throw new Error("File is empty. Choose a non-empty .docx file.");
  }
  if (!looksLikeZip(arrayBuffer)) {
    throw new Error(
      "This file is not a valid DOCX (Office Open XML). Save from Word as .docx, not legacy .doc."
    );
  }
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return {
      html: result.value ?? "",
      messages: result.messages.map((m) => m.message),
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    throw new Error(
      /zip|central directory|End of Central Directory|XML/i.test(raw)
        ? "This file is not a valid DOCX (Office Open XML). Save from Word as .docx and try again."
        : `Could not read document: ${raw}`
    );
  }
}

/** Safe HTML for rendering after mammoth (strip scripts, event handlers, etc.). */
export function sanitizeDocxHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export type DocxRawTextResult = {
  text: string;
  messages: string[];
};

/** Plain text for DCR-style reading / indexing / lightweight reuse (no layout). */
export async function extractDocxRawText(arrayBuffer: ArrayBuffer): Promise<DocxRawTextResult> {
  if (!arrayBuffer.byteLength) {
    throw new Error("File is empty. Choose a non-empty .docx file.");
  }
  if (!looksLikeZip(arrayBuffer)) {
    throw new Error(
      "This file is not a valid DOCX (Office Open XML). Save from Word as .docx, not legacy .doc."
    );
  }
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value ?? "",
      messages: result.messages.map((m) => m.message),
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    throw new Error(
      /zip|central directory|End of Central Directory|XML/i.test(raw)
        ? "This file is not a valid DOCX (Office Open XML). Save from Word as .docx and try again."
        : `Could not read document: ${raw}`
    );
  }
}
