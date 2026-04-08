declare module "html2pdf.js" {
  export interface Html2PdfWorker {
    set(opt: object): Html2PdfWorker;
    from(el: HTMLElement): Html2PdfWorker;
    outputPdf(type: string): Promise<Blob>;
    save(): Promise<void>;
  }

  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}
