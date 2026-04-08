/** Maps catalog `?tool=` ids to in-page section anchors on `/text`. */
export const TEXT_TOOL_SECTION_BY_ID: Record<string, string> = {
  "json-pretty": "text-json",
  "json-minify": "text-json",
  "json-format": "text-json",
  "validate-json": "text-json",
  "base64-encode": "text-base64",
  "base64-decode": "text-base64",
  "text-to-base64": "text-base64",
  "url-encode": "text-encode",
  "url-decode": "text-encode",
  "encode-uri-component": "text-encode",
  "html-escape": "text-html",
  "html-unescape": "text-html",
  "uppercase-text": "text-case",
  "lowercase-text": "text-case",
  "title-case-text": "text-case",
  "trim-lines": "text-lines",
  "remove-empty-lines": "text-lines",
  "sort-lines": "text-lines",
  "sort-lines-desc": "text-lines",
  "sort-lines-z-a": "text-lines",
  "dedupe-lines": "text-lines",
  "sha-256-text": "text-hash",
  "hash-text-hex": "text-hash",
  "reverse-text": "text-misc",
  "slugify": "text-misc",
  "uuid-v4": "text-generate",
  "random-uuid": "text-generate",
  "word-count": "text-stats",
  "stats-text": "text-stats",
};

export function getRelatedTextCatalogToolIds(excludeId: string): string[] | null {
  const sec = TEXT_TOOL_SECTION_BY_ID[excludeId];
  if (!sec) return null;
  return Object.entries(TEXT_TOOL_SECTION_BY_ID)
    .filter(([id, s]) => id !== excludeId && s === sec)
    .map(([id]) => id);
}
