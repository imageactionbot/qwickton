/** Open sanitized HTML in a transient window for OS Print → Save as PDF. */
export function openHtmlPrintWindow(html: string, title = "Print"): Window | null {
  const w = window.open("", "_blank");
  if (!w) return null;
  const styles = `body{margin:0;font-family:Georgia,serif;color:#111;background:#fff;} .docx-preview-root{padding:12mm;max-width:100%;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:4px 6px;} img{max-width:100%;height:auto;} p{margin:.5rem 0;}`;
  w.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${styles}</style></head><body><div class="docx-preview-root">${html}</div></body></html>`
  );
  w.document.close();
  w.focus();
  requestAnimationFrame(() => {
    w.print();
    w.close();
  });
  return w;
}

export async function htmlElementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const { default: html2pdf } = await import("html2pdf.js");
  return html2pdf()
    .set({
      margin: 8,
      image: { type: "jpeg", quality: 0.92 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(el)
    .outputPdf("blob");
}
