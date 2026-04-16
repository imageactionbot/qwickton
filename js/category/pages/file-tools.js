(function() {
  "use strict";
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }
  function copyText(text) { if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); }
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function fail(message) { throw new Error(message); }
  function bytesToBase64(bytes) {
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function base64ToBytes(base64) {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function localeOptions() {
    return [
      { code: "en-US", label: "United States (en-US)" },
      { code: "en-IN", label: "India (en-IN)" },
      { code: "en-GB", label: "United Kingdom (en-GB)" },
      { code: "de-DE", label: "Germany (de-DE)" },
      { code: "fr-FR", label: "France (fr-FR)" },
      { code: "ar-SA", label: "Saudi Arabia (ar-SA)" },
      { code: "ja-JP", label: "Japan (ja-JP)" },
      { code: "pt-BR", label: "Brazil (pt-BR)" },
      { code: "en-ZA", label: "South Africa (en-ZA)" },
      { code: "en-SG", label: "Singapore (en-SG)" }
    ].map((item) => `<option value="${item.code}">${item.label}</option>`).join("");
  }

  function sizeText(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes, idx = 0;
    while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++; }
    return `${value.toFixed(2)} ${units[idx]}`;
  }

  async function hashFile(file, algorithm) {
    const arr = await file.arrayBuffer();
    const digest = await window.crypto.subtle.digest(algorithm, arr);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getFileTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = { jpg: 'JPEG Image', jpeg: 'JPEG Image', png: 'PNG Image', gif: 'GIF Image', pdf: 'PDF Document', txt: 'Text File', js: 'JavaScript', html: 'HTML', css: 'CSS', json: 'JSON', xml: 'XML', zip: 'Archive', mp4: 'Video', mp3: 'Audio' };
    return types[ext] || 'Unknown';
  }

  async function deriveAesKey(password, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function secureEncryptText(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(text)
    );
    return `v1.${bytesToBase64(salt)}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
  }
  async function secureDecryptText(payload, password) {
    const parts = String(payload || "").trim().split(".");
    if (parts.length !== 4 || parts[0] !== "v1") fail("Invalid encrypted payload format.");
    const salt = base64ToBytes(parts[1]);
    const iv = base64ToBytes(parts[2]);
    const cipherBytes = base64ToBytes(parts[3]);
    const key = await deriveAesKey(password, salt);
    try {
      const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
      return new TextDecoder().decode(plainBuffer);
    } catch (error) {
      void error;
      fail("Decryption failed. Check password or payload.");
    }
  }

  // ============================================
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-file-history";
  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (error) {
      void error;
    }
  }
  function pushHistory(type, text, renderFn) { if (!text) return; writeHistory([{ type, text: String(text).slice(0, 150), ts: Date.now() }, ...readHistory()]); if (renderFn) renderFn(); }

  // ============================================
  // CARD CREATION
  // ============================================
  function initFileTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid || grid.dataset.fileToolsInitialized === "true") return;
    grid.dataset.fileToolsInitialized = "true";
    grid.innerHTML = "";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const card = document.createElement("div");
      card.className = "file-card";
      card.id = `card-${id}`;
      card.setAttribute("data-focusable", options.focusable !== false ? "true" : "false");
      card.innerHTML = `<div class="file-card-header"><div class="file-card-icon">${icon}</div><h3 class="file-card-title">${escapeHtml(title)}</h3>${options.focusable !== false ? `<button class="btn btn-secondary file-focus-btn" type="button" data-focus-open>Open</button><button class="btn btn-secondary file-focus-inline-close" type="button" data-focus-close>Close</button>` : ""}</div>${bodyHtml}`;
      grid.appendChild(card);
      return card;
    }

    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const container = historyCardEl.querySelector("#fileHistory");
      if (!container) return;
      if (!items.length) { container.innerHTML = '<span class="empty-hint">No file actions yet.</span>'; return; }
      container.innerHTML = items.map((item, idx) => `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`).join("");
      container.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => copyText(readHistory()[Number(btn.dataset.idx)]?.text || "")));
    }

    function wireExport(card, prefix, title, getText) {
      card.querySelector(`[data-export='${prefix}-txt']`)?.addEventListener("click", () => downloadTextFile(`${prefix}.txt`, getText()));
    }

    // ============================================
    // 1. FILE INSPECTOR
    // ============================================
    const inspectorCard = makeCard("inspector", "🔍", "File Inspector Pro", `
      <div><label>Select File(s)</label><input type="file" id="fInput" multiple></div>
      <div class="inline-row"><button class="btn btn-secondary" type="button" id="fCopyBtn">Copy Report</button><button class="btn btn-secondary" type="button" data-export="inspector-txt">TXT</button></div>
      <textarea id="fRes" class="result" rows="10" placeholder="Select file(s) to see details..."></textarea>
      <div id="fMeta" class="result">Files: 0 | Total size: 0 B</div>
    `);
    inspectorCard.querySelector("#fInput").addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) { inspectorCard.querySelector("#fRes").value = ""; inspectorCard.querySelector("#fMeta").textContent = "Files: 0 | Total size: 0 B"; return; }
      const report = files.map((f, i) => `${i+1}. 📄 ${f.name}\n   📦 ${sizeText(f.size)} | 📁 ${f.type || "unknown"} | 🕒 ${new Date(f.lastModified).toLocaleString()}`).join("\n\n");
      const total = files.reduce((sum, f) => sum + f.size, 0);
      inspectorCard.querySelector("#fRes").value = report;
      inspectorCard.querySelector("#fMeta").innerHTML = `📊 Files: ${files.length} | 💾 Total: ${sizeText(total)}`;
      pushHistory("File Inspector", `${files.length} file(s)`, renderHistory);
    });
    inspectorCard.querySelector("#fCopyBtn").onclick = () => copyText(inspectorCard.querySelector("#fRes").value);
    wireExport(inspectorCard, "inspector", "Inspector", () => inspectorCard.querySelector("#fRes").value);

    // ============================================
    // 2. CHECKSUM GENERATOR
    // ============================================
    const checksumCard = makeCard("checksum", "🔐", "Checksum Generator", `
      <div><label>Select File</label><input type="file" id="hashInput"></div>
      <div class="grid-2"><div><label>Algorithm</label><select id="hashAlgo"><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option></select></div>
      <div><label>Expected Hash</label><input type="text" id="hashExpected" placeholder="Paste hash to verify"></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="hashBtn">Generate Hash</button><button class="btn btn-secondary" type="button" id="hashCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="checksum-txt">TXT</button></div>
      <textarea id="hashRes" class="result" rows="4" placeholder="Hash will appear here..."></textarea>
      <div id="hashMeta" class="result">Status: waiting for file</div>
    `);
    checksumCard.querySelector("#hashBtn").onclick = async () => {
      const file = checksumCard.querySelector("#hashInput").files?.[0];
      if (!file) { checksumCard.querySelector("#hashMeta").innerHTML = "⚠️ Select a file"; return; }
      const algo = checksumCard.querySelector("#hashAlgo").value;
      const expected = checksumCard.querySelector("#hashExpected").value.trim().toLowerCase();
      try {
        const hash = await hashFile(file, algo);
        checksumCard.querySelector("#hashRes").value = hash;
        let status = `${algo} hash (${hash.length} chars)`;
        if (expected) status += hash.toLowerCase() === expected ? " ✅ MATCH" : " ❌ MISMATCH";
        checksumCard.querySelector("#hashMeta").innerHTML = status;
        pushHistory("Checksum", `${algo} - ${file.name}`, renderHistory);
      } catch(e) { checksumCard.querySelector("#hashMeta").innerHTML = `❌ Failed: ${e.message}`; }
    };
    checksumCard.querySelector("#hashCopyBtn").onclick = () => copyText(checksumCard.querySelector("#hashRes").value);
    wireExport(checksumCard, "checksum", "Checksum", () => checksumCard.querySelector("#hashRes").value);

    // ============================================
    // 3. TEXT FILE READER
    // ============================================
    const textReaderCard = makeCard("textreader", "📄", "Text File Reader", `
      <div><label>Select Text File</label><input type="file" id="textFileInput" accept=".txt,.md,.csv,.json,.log,text/plain"></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="textReadBtn">Read File</button><button class="btn btn-secondary" type="button" id="textCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="textreader-txt">TXT</button></div>
      <textarea id="textFileRes" class="result" rows="8" placeholder="File content will appear here..."></textarea>
      <div id="textFileMeta" class="result">Lines: 0 | Words: 0 | Characters: 0</div>
    `);
    textReaderCard.querySelector("#textReadBtn").onclick = async () => {
      const file = textReaderCard.querySelector("#textFileInput").files?.[0];
      if (!file) { textReaderCard.querySelector("#textFileMeta").innerHTML = "⚠️ Select a file"; return; }
      try {
        const content = await file.text();
        const preview = content.length > 15000 ? `${content.slice(0,15000)}\n\n... [truncated]` : content;
        textReaderCard.querySelector("#textFileRes").value = preview;
        const words = (content.match(/\S+/g) || []).length;
        const lines = content.split(/\r?\n/).length;
        textReaderCard.querySelector("#textFileMeta").innerHTML = `📊 Lines: ${lines} | 📝 Words: ${words} | 🔤 Chars: ${content.length} | 📦 ${sizeText(file.size)}`;
        pushHistory("Text Reader", `${file.name} (${lines} lines)`, renderHistory);
      } catch(e) { textReaderCard.querySelector("#textFileMeta").innerHTML = `❌ Error: ${e.message}`; }
    };
    textReaderCard.querySelector("#textCopyBtn").onclick = () => copyText(textReaderCard.querySelector("#textFileRes").value);
    wireExport(textReaderCard, "textreader", "TextReader", () => textReaderCard.querySelector("#textFileRes").value);

    // ============================================
    // 4. IMAGE TO BASE64
    // ============================================
    const imageBase64Card = makeCard("imagebase64", "🖼️", "Image to Base64 Converter", `
      <div><label>Select Image</label><input type="file" id="imgBase64Input" accept="image/*"></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="imgBase64Btn">Convert</button><button class="btn btn-secondary" type="button" id="imgBase64CopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="imagebase64-txt">TXT</button></div>
      <div id="imgBase64Preview" class="preview-box"></div>
      <textarea id="imgBase64Res" class="result" rows="5" placeholder="Base64 will appear here..."></textarea>
      <div id="imgBase64Meta" class="result">Status: waiting for image</div>
    `);
    imageBase64Card.querySelector("#imgBase64Btn").onclick = async () => {
      const file = imageBase64Card.querySelector("#imgBase64Input").files?.[0];
      if (!file) { imageBase64Card.querySelector("#imgBase64Meta").innerHTML = "⚠️ Select an image"; return; }
      const base64 = await fileToBase64(file);
      imageBase64Card.querySelector("#imgBase64Res").value = base64;
      const preview = imageBase64Card.querySelector("#imgBase64Preview");
      preview.innerHTML = `<img src="${base64}" class="image-preview" alt="Preview">`;
      imageBase64Card.querySelector("#imgBase64Meta").innerHTML = `✅ Converted: ${file.name} | Size: ${sizeText(file.size)}`;
      pushHistory("Image to Base64", file.name, renderHistory);
    };
    imageBase64Card.querySelector("#imgBase64CopyBtn").onclick = () => copyText(imageBase64Card.querySelector("#imgBase64Res").value);
    wireExport(imageBase64Card, "imagebase64", "ImageBase64", () => imageBase64Card.querySelector("#imgBase64Res").value);

    // ============================================
    // 5. PDF TEXT EXTRACTOR
    // ============================================
    const pdfExtractCard = makeCard("pdfextract", "📑", "PDF Text Extractor", `
      <div><label>Select PDF</label><input type="file" id="pdfInput" accept=".pdf"></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="pdfBtn">Extract Text</button><button class="btn btn-secondary" type="button" id="pdfCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="pdfextract-txt">TXT</button></div>
      <textarea id="pdfRes" class="result" rows="8" placeholder="Extracted text will appear here..."></textarea>
      <div id="pdfMeta" class="result">Status: waiting for PDF</div>
    `);
    pdfExtractCard.querySelector("#pdfBtn").onclick = async () => {
      const file = pdfExtractCard.querySelector("#pdfInput").files?.[0];
      if (!file) { pdfExtractCard.querySelector("#pdfMeta").innerHTML = "⚠️ Select a PDF file"; return; }
      pdfExtractCard.querySelector("#pdfRes").value = `[PDF Document: ${file.name}]\nSize: ${sizeText(file.size)}\n\nFull text extraction requires PDF.js library. This is a metadata summary.`;
      pdfExtractCard.querySelector("#pdfMeta").innerHTML = `✅ PDF loaded: ${file.name}`;
      pushHistory("PDF Extract", file.name, renderHistory);
    };
    pdfExtractCard.querySelector("#pdfCopyBtn").onclick = () => copyText(pdfExtractCard.querySelector("#pdfRes").value);
    wireExport(pdfExtractCard, "pdfextract", "PDF", () => pdfExtractCard.querySelector("#pdfRes").value);

    // ============================================
    // 6. FILE COMPRESSOR (Simulated)
    // ============================================
    const compressorCard = makeCard("compressor", "🗜️", "File Compressor (Simulated)", `
      <div><label>Select File</label><input type="file" id="compressInput"></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="compressBtn">Analyze Compression</button><button class="btn btn-secondary" type="button" id="compressCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="compressor-txt">TXT</button></div>
      <textarea id="compressRes" class="result" rows="5" placeholder="Compression analysis will appear here..."></textarea>
    `);
    compressorCard.querySelector("#compressBtn").onclick = () => {
      const file = compressorCard.querySelector("#compressInput").files?.[0];
      if (!file) { compressorCard.querySelector("#compressRes").value = "⚠️ Select a file"; return; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const alreadyCompressed = ["zip", "jpg", "jpeg", "png", "gif", "webp", "mp4", "mp3", "pdf"];
      const ratio = alreadyCompressed.includes(ext) ? 0.96 : 0.62;
      const estimated = Math.max(1, Math.round(file.size * ratio));
      compressorCard.querySelector("#compressRes").value = `📁 File: ${file.name}\n📦 Original: ${sizeText(file.size)}\n🗜️ Estimated compressed: ${sizeText(estimated)}\n📊 Savings estimate: ${((1 - estimated / Math.max(1, file.size)) * 100).toFixed(1)}%\n\nThis is a browser-side estimator. Actual archived size varies by content type.`;
      pushHistory("Compressor", file.name, renderHistory);
    };
    compressorCard.querySelector("#compressCopyBtn").onclick = () => copyText(compressorCard.querySelector("#compressRes").value);
    wireExport(compressorCard, "compressor", "Compressor", () => compressorCard.querySelector("#compressRes").value);

    // ============================================
    // 7. FILE ENCRYPTOR
    // ============================================
    const encryptCard = makeCard("encrypt", "🔒", "File Encryptor (Text Mode)", `
      <div class="grid-2"><div><label>Text to Encrypt</label><textarea id="encryptInput" rows="3" placeholder="Enter text to encrypt..."></textarea></div>
      <div><label>Password</label><input type="password" id="encryptPass" placeholder="Enter password"></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="encryptBtn">Encrypt</button><button class="btn btn-secondary" type="button" id="decryptBtn">Decrypt</button><button class="btn btn-secondary" type="button" id="encryptCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="encrypt-txt">TXT</button></div>
      <div class="result">Encryption mode: AES-GCM + PBKDF2 (browser-native secure crypto)</div>
      <textarea id="encryptRes" class="result" rows="5" placeholder="Encrypted/Decrypted text will appear here..."></textarea>
    `);
    encryptCard.querySelector("#encryptBtn").onclick = async () => {
      const text = encryptCard.querySelector("#encryptInput").value;
      const pass = encryptCard.querySelector("#encryptPass").value;
      if (!text || !pass) { encryptCard.querySelector("#encryptRes").value = "⚠️ Enter text and password"; return; }
      try {
        const encrypted = await secureEncryptText(text, pass);
        encryptCard.querySelector("#encryptRes").value = encrypted;
      } catch (error) {
        encryptCard.querySelector("#encryptRes").value = `❌ Encryption failed: ${error?.message || "unknown error"}`;
        return;
      }
      pushHistory("Encrypt", "Text encrypted", renderHistory);
    };
    encryptCard.querySelector("#decryptBtn").onclick = async () => {
      const text = encryptCard.querySelector("#encryptInput").value;
      const pass = encryptCard.querySelector("#encryptPass").value;
      if (!text || !pass) { encryptCard.querySelector("#encryptRes").value = "⚠️ Enter encrypted text and password"; return; }
      try {
        const decrypted = await secureDecryptText(text, pass);
        encryptCard.querySelector("#encryptRes").value = decrypted;
      } catch (error) {
        encryptCard.querySelector("#encryptRes").value = `❌ ${error?.message || "Decryption failed"}`;
        return;
      }
      pushHistory("Decrypt", "Text decrypted", renderHistory);
    };
    encryptCard.querySelector("#encryptCopyBtn").onclick = () => copyText(encryptCard.querySelector("#encryptRes").value);
    wireExport(encryptCard, "encrypt", "Encrypt", () => encryptCard.querySelector("#encryptRes").value);

    // ============================================
    // 8. METADATA VIEWER
    // ============================================
    const metadataCard = makeCard("metadata", "ℹ️", "File Metadata Viewer", `
      <div><label>Select File</label><input type="file" id="metaInput"></div>
      <div class="grid-2"><div><label>Display Locale</label><select id="metaLocale">${localeOptions()}</select></div><div><label>Date style</label><select id="metaDateStyle"><option value="short">Short</option><option value="medium" selected>Medium</option><option value="long">Long</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="metaBtn">View Metadata</button><button class="btn btn-secondary" type="button" id="metaCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="metadata-txt">TXT</button></div>
      <textarea id="metaRes" class="result" rows="8" placeholder="Metadata will appear here..."></textarea>
    `);
    metadataCard.querySelector("#metaBtn").onclick = () => {
      const file = metadataCard.querySelector("#metaInput").files?.[0];
      if (!file) { metadataCard.querySelector("#metaRes").value = "⚠️ Select a file"; return; }
      const locale = metadataCard.querySelector("#metaLocale").value || "en-US";
      const dateStyle = metadataCard.querySelector("#metaDateStyle").value || "medium";
      const modifiedText = new Intl.DateTimeFormat(locale, { dateStyle, timeStyle: "short" }).format(new Date(file.lastModified));
      const meta = [
        `📄 File Name: ${file.name}`,
        `📦 Size: ${sizeText(file.size)} (${file.size} bytes)`,
        `📁 Type: ${file.type || 'Unknown'}`,
        `🕒 Last Modified: ${modifiedText}`,
        `🌍 Locale: ${locale}`,
        `🔤 Extension: ${file.name.split('.').pop().toUpperCase()}`,
        `📂 Detected Type: ${getFileTypeFromName(file.name)}`
      ].join("\n");
      metadataCard.querySelector("#metaRes").value = meta;
      pushHistory("Metadata", file.name, renderHistory);
    };
    metadataCard.querySelector("#metaCopyBtn").onclick = () => copyText(metadataCard.querySelector("#metaRes").value);
    wireExport(metadataCard, "metadata", "Metadata", () => metadataCard.querySelector("#metaRes").value);
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const localeSelect = metadataCard.querySelector("#metaLocale");
    if (localeSelect && Array.from(localeSelect.options).some((opt) => opt.value === browserLocale)) {
      localeSelect.value = browserLocale;
    }

    // ============================================
    // 9. MIME TYPE DETECTOR
    // ============================================
    const mimeCard = makeCard("mime", "📁", "MIME Type Detector", `
      <div><label>Select File</label><input type="file" id="mimeInput"></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="mimeBtn">Detect MIME</button><button class="btn btn-secondary" type="button" id="mimeCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="mime-txt">TXT</button></div>
      <textarea id="mimeRes" class="result" rows="5" placeholder="MIME info will appear here..."></textarea>
    `);
    mimeCard.querySelector("#mimeBtn").onclick = () => {
      const file = mimeCard.querySelector("#mimeInput").files?.[0];
      if (!file) { mimeCard.querySelector("#mimeRes").value = "⚠️ Select a file"; return; }
      const mimeTypes = {
        'image/jpeg': 'JPEG Image', 'image/png': 'PNG Image', 'image/gif': 'GIF Image',
        'application/pdf': 'PDF Document', 'text/plain': 'Text File', 'application/json': 'JSON',
        'text/html': 'HTML Document', 'text/css': 'CSS', 'application/javascript': 'JavaScript'
      };
      const mime = file.type || 'unknown';
      const desc = mimeTypes[mime] || 'Unknown Type';
      mimeCard.querySelector("#mimeRes").value = `📁 File: ${file.name}\n🔍 MIME Type: ${mime}\n📝 Description: ${desc}\n🔤 Extension: .${file.name.split('.').pop()}`;
      pushHistory("MIME Type", mime, renderHistory);
    };
    mimeCard.querySelector("#mimeCopyBtn").onclick = () => copyText(mimeCard.querySelector("#mimeRes").value);
    wireExport(mimeCard, "mime", "MIME", () => mimeCard.querySelector("#mimeRes").value);

    // ============================================
    // 10. DUPLICATE FINDER
    // ============================================
    const duplicateCard = makeCard("duplicate", "🔄", "Duplicate File Finder", `
      <div><label>Select Multiple Files</label><input type="file" id="dupInput" multiple></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="dupBtn">Find Duplicates</button><button class="btn btn-secondary" type="button" id="dupCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="duplicate-txt">TXT</button></div>
      <textarea id="dupRes" class="result" rows="8" placeholder="Duplicate analysis will appear here..."></textarea>
    `);
    duplicateCard.querySelector("#dupBtn").onclick = async () => {
      const files = Array.from(duplicateCard.querySelector("#dupInput").files || []);
      if (files.length < 2) { duplicateCard.querySelector("#dupRes").value = "⚠️ Select at least 2 files"; return; }
      const hashes = new Map();
      for (const file of files) {
        const hash = await hashFile(file, "SHA-256");
        if (!hashes.has(hash)) hashes.set(hash, []);
        hashes.get(hash).push(file.name);
      }
      const duplicates = Array.from(hashes.entries()).filter(([_, names]) => names.length > 1);
      if (!duplicates.length) { duplicateCard.querySelector("#dupRes").value = "✅ No duplicates found"; return; }
      const report = duplicates.map(([hash, names]) => `Hash: ${hash.slice(0,16)}...\nFiles: ${names.join(", ")}`).join("\n\n");
      duplicateCard.querySelector("#dupRes").value = report;
      pushHistory("Duplicate Finder", `${duplicates.length} duplicate sets`, renderHistory);
    };
    duplicateCard.querySelector("#dupCopyBtn").onclick = () => copyText(duplicateCard.querySelector("#dupRes").value);
    wireExport(duplicateCard, "duplicate", "Duplicate", () => duplicateCard.querySelector("#dupRes").value);

    // ============================================
    // 11. BATCH RENAMER (Preview)
    // ============================================
    const renamerCard = makeCard("renamer", "✏️", "Batch Renamer (Preview)", `
      <div><label>Select Files</label><input type="file" id="renameInput" multiple></div>
      <div class="grid-2"><div><label>Prefix</label><input id="renamePrefix" placeholder="prefix_"></div><div><label>Suffix</label><input id="renameSuffix" placeholder="_suffix"></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="renameBtn">Preview Rename</button><button class="btn btn-secondary" type="button" id="renameCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="renamer-txt">TXT</button></div>
      <textarea id="renameRes" class="result" rows="8" placeholder="Rename preview will appear here..."></textarea>
    `);
    renamerCard.querySelector("#renameBtn").onclick = () => {
      const files = Array.from(renamerCard.querySelector("#renameInput").files || []);
      if (!files.length) { renamerCard.querySelector("#renameRes").value = "⚠️ Select files"; return; }
      const prefix = renamerCard.querySelector("#renamePrefix").value;
      const suffix = renamerCard.querySelector("#renameSuffix").value;
      const preview = files.map((f, i) => {
        const ext = f.name.split('.').pop();
        const newName = `${prefix}${i+1}${suffix}.${ext}`;
        return `${f.name} → ${newName}`;
      }).join("\n");
      renamerCard.querySelector("#renameRes").value = preview;
      pushHistory("Batch Rename", `${files.length} files`, renderHistory);
    };
    renamerCard.querySelector("#renameCopyBtn").onclick = () => copyText(renamerCard.querySelector("#renameRes").value);
    wireExport(renamerCard, "renamer", "Renamer", () => renamerCard.querySelector("#renameRes").value);

    // ============================================
    // 12. FILE MANIFEST BUILDER
    // ============================================
    const manifestCard = makeCard("manifest", "🧾", "File Manifest Builder", `
      <div><label>Select Files</label><input type="file" id="manifestInput" multiple></div>
      <div class="grid-2"><div><label>Locale</label><select id="manifestLocale">${localeOptions()}</select></div><div><label>Output</label><select id="manifestFormat"><option value="table">Table Text</option><option value="json">JSON</option></select></div></div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="manifestBtn">Generate Manifest</button><button class="btn btn-secondary" type="button" id="manifestCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="manifest-txt">TXT</button></div>
      <textarea id="manifestRes" class="result" rows="10" placeholder="Manifest output will appear here..."></textarea>
    `);
    manifestCard.querySelector("#manifestBtn").onclick = () => {
      const files = Array.from(manifestCard.querySelector("#manifestInput").files || []);
      if (!files.length) { manifestCard.querySelector("#manifestRes").value = "⚠️ Select one or more files"; return; }
      const locale = manifestCard.querySelector("#manifestLocale").value || "en-US";
      const format = manifestCard.querySelector("#manifestFormat").value || "table";
      const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
      const rows = files.map((file, idx) => ({
        index: idx + 1,
        name: file.name,
        sizeBytes: file.size,
        size: sizeText(file.size),
        mime: file.type || "unknown",
        lastModified: formatter.format(new Date(file.lastModified))
      }));
      if (format === "json") {
        manifestCard.querySelector("#manifestRes").value = JSON.stringify({ locale, count: rows.length, files: rows }, null, 2);
      } else {
        manifestCard.querySelector("#manifestRes").value = [
          `FILE MANIFEST (${rows.length})`,
          `Locale: ${locale}`,
          "----------------------------------------",
          ...rows.map((row) => `${row.index}. ${row.name}\n   ${row.size} (${row.sizeBytes} bytes) | ${row.mime}\n   Modified: ${row.lastModified}`)
        ].join("\n");
      }
      pushHistory("Manifest", `${rows.length} files`, renderHistory);
    };
    manifestCard.querySelector("#manifestCopyBtn").onclick = () => copyText(manifestCard.querySelector("#manifestRes").value);
    wireExport(manifestCard, "manifest", "Manifest", () => manifestCard.querySelector("#manifestRes").value);
    const manifestLocaleSelect = manifestCard.querySelector("#manifestLocale");
    if (manifestLocaleSelect && Array.from(manifestLocaleSelect.options).some((opt) => opt.value === browserLocale)) {
      manifestLocaleSelect.value = browserLocale;
    }

    // ============================================
    // 13. UPLOAD TIME ESTIMATOR
    // ============================================
    const transferCard = makeCard("transfer", "🌐", "Upload/Transfer Time Estimator", `
      <div><label>Select Files</label><input type="file" id="transferInput" multiple></div>
      <div class="grid-3">
        <div><label>Network Profile</label><select id="transferProfile"><option value="0.75">3G (0.75 Mbps)</option><option value="5">4G (5 Mbps)</option><option value="25" selected>Broadband (25 Mbps)</option><option value="100">Fiber (100 Mbps)</option></select></div>
        <div><label>Custom Speed Mbps</label><input type="number" id="transferCustom" value="25" min="0.1" step="0.1"></div>
        <div><label>Use Custom</label><select id="transferUseCustom"><option value="no" selected>No</option><option value="yes">Yes</option></select></div>
      </div>
      <div class="inline-row"><button class="btn btn-primary" type="button" id="transferBtn">Estimate Time</button><button class="btn btn-secondary" type="button" id="transferCopyBtn">Copy</button><button class="btn btn-secondary" type="button" data-export="transfer-txt">TXT</button></div>
      <textarea id="transferRes" class="result" rows="8" placeholder="Transfer estimate will appear here..."></textarea>
    `);
    transferCard.querySelector("#transferBtn").onclick = () => {
      const files = Array.from(transferCard.querySelector("#transferInput").files || []);
      if (!files.length) { transferCard.querySelector("#transferRes").value = "⚠️ Select file(s) first"; return; }
      const useCustom = transferCard.querySelector("#transferUseCustom").value === "yes";
      const mbps = useCustom
        ? Number(transferCard.querySelector("#transferCustom").value)
        : Number(transferCard.querySelector("#transferProfile").value);
      if (!Number.isFinite(mbps) || mbps <= 0) { transferCard.querySelector("#transferRes").value = "⚠️ Enter valid speed in Mbps"; return; }
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      const bits = totalBytes * 8;
      const seconds = bits / (mbps * 1000 * 1000);
      const mins = seconds / 60;
      const eta = seconds < 90 ? `${seconds.toFixed(1)} sec` : `${mins.toFixed(2)} min`;
      transferCard.querySelector("#transferRes").value = [
        "UPLOAD / TRANSFER ESTIMATE",
        "----------------------------------------",
        `Files: ${files.length}`,
        `Total Size: ${sizeText(totalBytes)} (${totalBytes} bytes)`,
        `Speed: ${mbps.toFixed(2)} Mbps`,
        `Estimated Transfer Time: ${eta}`,
        "",
        "Tip: real world speed can vary by network overhead, distance, and server load."
      ].join("\n");
      pushHistory("Transfer ETA", `${files.length} files @ ${mbps.toFixed(1)} Mbps`, renderHistory);
    };
    transferCard.querySelector("#transferCopyBtn").onclick = () => copyText(transferCard.querySelector("#transferRes").value);
    wireExport(transferCard, "transfer", "Transfer", () => transferCard.querySelector("#transferRes").value);

    // ============================================
    // HISTORY CARD
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent File Actions", `
      <div id="fileHistory" class="chip-list"><span class="empty-hint">No file actions yet.</span></div>
      <div class="inline-row"><button class="btn btn-secondary" type="button" id="clearFileHistory">Clear History</button><button class="btn btn-secondary" type="button" id="exportFileHistory">Export History</button></div>
    `, { focusable: false, fullWidth: true });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;
    historyCard.querySelector("#clearFileHistory").addEventListener("click", () => { writeHistory([]); renderHistory(); });
    historyCard.querySelector("#exportFileHistory").addEventListener("click", () => { const history = readHistory(); const exportText = history.map((h, i) => `${i+1}. [${new Date(h.ts).toLocaleString()}] ${h.type}: ${h.text}`).join("\n"); downloadTextFile(`file-history-${new Date().toISOString().slice(0,10)}.txt`, exportText); });
    renderHistory();

    // ============================================
    // FOCUS MODAL
    // ============================================
    const focusOverlay = document.createElement("div"); focusOverlay.className = "file-focus-overlay";
    const focusHost = document.createElement("div"); focusHost.className = "file-focus-host";
    document.body.appendChild(focusOverlay); document.body.appendChild(focusHost);
    let activeFocusedCard = null, focusPlaceholder = null;
    function openFocus(card) { if (!card || card.getAttribute("data-focusable") === "false" || activeFocusedCard === card) return; if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused"); activeFocusedCard = card; focusPlaceholder = document.createElement("div"); focusPlaceholder.style.height = card.offsetHeight + "px"; card.parentNode.insertBefore(focusPlaceholder, card); focusHost.appendChild(card); card.classList.add("is-focused"); card.querySelector("[data-focus-open]")?.classList.add("is-hidden"); card.querySelector("[data-focus-close]")?.classList.add("active"); document.body.classList.add("file-modal-open"); focusOverlay.classList.add("active"); focusHost.classList.add("active"); setTimeout(() => { const firstInput = card.querySelector("input, select, textarea, button"); firstInput?.focus(); }, 40); }
    function closeFocus() { if (!activeFocusedCard) return; activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden"); activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active"); activeFocusedCard.classList.remove("is-focused"); if (focusPlaceholder?.parentNode) focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder), focusPlaceholder.remove(); activeFocusedCard = null; focusHost.classList.remove("active"); focusOverlay.classList.remove("active"); document.body.classList.remove("file-modal-open"); }
    document.querySelectorAll(".file-card [data-focus-open]").forEach(btn => btn.addEventListener("click", e => openFocus(e.target.closest(".file-card"))));
    document.querySelectorAll(".file-card [data-focus-close]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); closeFocus(); }));
    focusOverlay.addEventListener("click", () => closeFocus());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeFocus(); });
    document.querySelectorAll(".tool-nav-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); const card = document.getElementById(`card-${btn.dataset.target}`); if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => openFocus(card), 200); } }));

    document.getElementById("year").textContent = new Date().getFullYear();
  }
  window.QwicktonCategoryInits["file-tools"] = initFileTools;
  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) initFileTools(null); });
})();