/** Stable ArrayBuffer slice for Blob / postMessage (avoids TS SharedArrayBuffer issues). */
export function uint8ArrayToArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export function bytesToPdfBlob(data: Uint8Array): Blob {
  return new Blob([uint8ArrayToArrayBuffer(data)], { type: "application/pdf" });
}
