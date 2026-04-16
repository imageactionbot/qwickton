/**
 * IMAGE TOOLS - Complete JavaScript
 * Tools: Image Editor with resize, filters, effects, rotate, flip, download
 * Architecture: IIFE module, global register, double-init protection
 */

(function() {
  "use strict";

  // Register in global QwicktonCategoryInits
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function safeNum(v, d = 0) {
    const n = Number(v);
    return isFinite(n) ? n : d;
  }
  function copyText(t) {
    if (t) navigator.clipboard?.writeText(String(t)).catch(() => {});
  }
  function formatBytes(n) {
    if (!isFinite(n) || n < 0) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    let x = n;
    while (x >= 1024 && i < u.length - 1) {
      x /= 1024;
      i += 1;
    }
    return `${x.toFixed(i ? 1 : 0)} ${u[i]}`;
  }
  function downloadDataUrl(dataUrl, filename) {
    try {
      const a = document.createElement("a");
      a.download = filename;
      a.href = dataUrl;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn(e);
    }
  }
  function setMsg(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("img-msg-error", !!isError);
    el.setAttribute("role", "status");
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initImageTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.imageToolsInitialized === "true") return;
    grid.dataset.imageToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "img-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="img-card-header">
          <div class="img-card-icon">${icon}</div>
          <h3 class="img-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary img-focus-btn" data-focus-open>Open</button>
            <button class="btn btn-secondary img-focus-inline-close" data-focus-close>Close</button>
          ` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    // ============================================
    // IMAGE EDITOR CARD (Main)
    // ============================================
    const editorCard = makeCard("editor", "🎨", "Image Lab Pro", `
      <p class="img-hint">All processing is local in your browser. Very large images may be slow; export uses the working resolution shown on canvas.</p>
      <div><label for="imageUpload">Select image</label><input type="file" id="imageUpload" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"></div>
      <div id="editorErr" class="img-msg img-msg-error" hidden role="alert"></div>
      <div class="canvas-container">
        <canvas id="imageCanvas" width="400" height="300" style="max-width:100%; height:auto; background: repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 50% / 20px 20px;"></canvas>
      </div>
      <div class="grid-2">
        <div><label for="resizeWidth">Width (px)</label><input type="number" id="resizeWidth" placeholder="Auto" min="1" step="1"></div>
        <div><label for="resizeHeight">Height (px)</label><input type="number" id="resizeHeight" placeholder="Auto" min="1" step="1"></div>
      </div>
      <div class="inline-row img-checkbox-row">
        <label><input type="checkbox" id="resizeLockAspect" checked> Lock aspect ratio (use one dimension)</label>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-secondary" id="applyResizeBtn">📏 Apply resize</button>
        <button type="button" class="btn btn-secondary" id="resetImageBtn">🔄 Reset</button>
      </div>
      <div class="grid-3">
        <div><label for="brightnessSlider">Brightness <span id="brightnessVal" class="img-range-val">100</span></label><input type="range" id="brightnessSlider" min="0" max="200" value="100" step="1"></div>
        <div><label for="contrastSlider">Contrast <span id="contrastVal" class="img-range-val">100</span></label><input type="range" id="contrastSlider" min="0" max="200" value="100" step="1"></div>
        <div><label for="blurSlider">Blur (px)</label><input type="range" id="blurSlider" min="0" max="10" value="0" step="0.5"></div>
      </div>
      <details class="img-advanced">
        <summary>Advanced — saturation &amp; preview cap</summary>
        <div class="grid-2">
          <div><label for="saturationSlider">Saturation <span id="saturationVal" class="img-range-val">100</span></label><input type="range" id="saturationSlider" min="0" max="200" value="100" step="1"></div>
          <div><label for="previewMax">Max preview edge (px)</label><input type="number" id="previewMax" min="200" max="2000" value="500" step="50"></div>
        </div>
      </details>
      <div class="inline-row">
        <button type="button" class="btn btn-secondary" id="grayscaleBtn">⚫ Grayscale</button>
        <button type="button" class="btn btn-secondary" id="sepiaBtn">🟤 Sepia</button>
        <button type="button" class="btn btn-secondary" id="invertBtn">🔄 Invert</button>
        <button type="button" class="btn btn-secondary" id="clearStyleBtn">Clear color styles</button>
      </div>
      <div class="grid-2">
        <div><label for="rotateSelect">Rotate</label><select id="rotateSelect">
          <option value="0">0°</option>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select></div>
        <div><label for="flipSelect">Flip</label><select id="flipSelect">
          <option value="none">None</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-secondary" id="applyTransformBtn">🔄 Apply transform</button>
      </div>
      <div class="grid-2">
        <div><label for="downloadFormat">Download format</label><select id="downloadFormat">
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select></div>
        <div><label for="qualitySlider">Quality (JPEG/WebP)</label><input type="range" id="qualitySlider" min="0.1" max="1" step="0.01" value="0.92"></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="downloadBtn">💾 Download image</button>
      </div>
      <div id="imageInfo" class="result" role="status">📷 No image loaded</div>
    `);

    // Get elements
    const fileInput = editorCard.querySelector("#imageUpload");
    const canvas = editorCard.querySelector("#imageCanvas");
    const ctx = canvas.getContext("2d");
    const imageInfo = editorCard.querySelector("#imageInfo");
    const editorErr = editorCard.querySelector("#editorErr");

    let originalImage = null;
    let currentImageData = null;
    let currentFilters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: false,
      sepia: false,
      invert: false,
      rotate: 0,
      flip: "none"
    };
    
    let originalWidth = 0, originalHeight = 0;
    let displayWidth = 400, displayHeight = 300;

    const MAX_EDITOR_DECODE_PX = 12000 * 12000;

    function loadImage(file) {
      if (!file) return;
      editorErr.hidden = true;
      editorErr.textContent = "";
      if (file.size > 45 * 1024 * 1024) {
        editorErr.textContent = "File is very large (>45 MB). Try a smaller image for smoother editing.";
        editorErr.hidden = false;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        editorErr.textContent = "Could not read file.";
        editorErr.hidden = false;
      };
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth * img.naturalHeight > MAX_EDITOR_DECODE_PX) {
            editorErr.textContent = "Image dimensions are too large for this editor. Use Quick resize or Compress first.";
            editorErr.hidden = false;
            return;
          }
          originalImage = img;
          originalWidth = img.width;
          originalHeight = img.height;

          const maxSize = Math.max(200, Math.min(2000, safeNum(editorCard.querySelector("#previewMax")?.value, 500)));
          if (originalWidth > originalHeight) {
            displayWidth = Math.min(originalWidth, maxSize);
            displayHeight = (originalHeight * displayWidth) / originalWidth;
          } else {
            displayHeight = Math.min(originalHeight, maxSize);
            displayWidth = (originalWidth * displayHeight) / originalHeight;
          }
          canvas.width = displayWidth;
          canvas.height = displayHeight;

          currentFilters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: false,
            sepia: false,
            invert: false,
            rotate: 0,
            flip: "none"
          };

          editorCard.querySelector("#brightnessSlider").value = 100;
          editorCard.querySelector("#contrastSlider").value = 100;
          editorCard.querySelector("#saturationSlider").value = 100;
          editorCard.querySelector("#blurSlider").value = 0;
          editorCard.querySelector("#rotateSelect").value = "0";
          editorCard.querySelector("#flipSelect").value = "none";
          editorCard.querySelector("#brightnessVal").textContent = "100";
          editorCard.querySelector("#contrastVal").textContent = "100";
          editorCard.querySelector("#saturationVal").textContent = "100";

          applyAllFilters();
          imageInfo.textContent = `📸 ${file.name} · ${originalWidth}×${originalHeight}px · ${formatBytes(file.size)} · preview ~${Math.round(displayWidth)}×${Math.round(displayHeight)}px`;
        };
        img.onerror = () => {
          editorErr.textContent = "Could not decode image (unsupported or corrupt).";
          editorErr.hidden = false;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Apply all current filters to canvas
    function applyAllFilters() {
      if (!originalImage) return;
      
      // Create temporary canvas for filtering
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
      
      let imageData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
      const data = imageData.data;
      
      const brightness = currentFilters.brightness / 100;
      const contrastAdj = Math.max(-240, Math.min(240, (currentFilters.contrast - 100) * 2.4));
      const factor = (259 * (contrastAdj + 255)) / (255 * (259 - contrastAdj));
      const sat = Math.max(0, currentFilters.saturation / 100);

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r *= brightness;
        g *= brightness;
        b *= brightness;

        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        if (!currentFilters.grayscale && sat !== 1) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * sat;
          g = gray + (g - gray) * sat;
          b = gray + (b - gray) * sat;
        }

        if (currentFilters.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        }

        if (currentFilters.sepia) {
          const tr = r, tg = g, tb = b;
          r = tr * 0.393 + tg * 0.769 + tb * 0.189;
          g = tr * 0.349 + tg * 0.686 + tb * 0.168;
          b = tr * 0.272 + tg * 0.534 + tb * 0.131;
        }
        
        // Invert
        if (currentFilters.invert) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }
        
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
      
      tempCtx.putImageData(imageData, 0, 0);
      
      // Apply blur
      if (currentFilters.blur > 0) {
        tempCtx.filter = `blur(${currentFilters.blur}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        tempCtx.filter = "none";
      }
      
      // Apply rotate and flip to final canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let drawWidth = displayWidth;
      let drawHeight = displayHeight;
      let rotate = currentFilters.rotate % 360;
      let flipH = currentFilters.flip === "horizontal";
      let flipV = currentFilters.flip === "vertical";
      
      if (rotate === 90 || rotate === 270) {
        [drawWidth, drawHeight] = [drawHeight, drawWidth];
      }
      
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      
      ctx.save();
      ctx.translate(drawWidth / 2, drawHeight / 2);
      
      if (rotate === 90) ctx.rotate(Math.PI / 2);
      else if (rotate === 180) ctx.rotate(Math.PI);
      else if (rotate === 270) ctx.rotate(-Math.PI / 2);
      
      if (flipH) ctx.scale(-1, 1);
      if (flipV) ctx.scale(1, -1);
      
      ctx.drawImage(tempCanvas, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
      ctx.restore();
    }

    function updateFromSliders() {
      currentFilters.brightness = safeNum(editorCard.querySelector("#brightnessSlider").value, 100);
      currentFilters.contrast = safeNum(editorCard.querySelector("#contrastSlider").value, 100);
      currentFilters.saturation = safeNum(editorCard.querySelector("#saturationSlider").value, 100);
      currentFilters.blur = safeNum(editorCard.querySelector("#blurSlider").value, 0);
      currentFilters.grayscale = false;
      currentFilters.sepia = false;
      currentFilters.invert = false;
      editorCard.querySelector("#brightnessVal").textContent = String(Math.round(currentFilters.brightness));
      editorCard.querySelector("#contrastVal").textContent = String(Math.round(currentFilters.contrast));
      editorCard.querySelector("#saturationVal").textContent = String(Math.round(currentFilters.saturation));
      applyAllFilters();
    }

    editorCard.querySelector("#applyResizeBtn").onclick = () => {
      if (!originalImage) {
        setMsg(editorErr, "Load an image first.", true);
        editorErr.hidden = false;
        return;
      }
      editorErr.hidden = true;
      const lock = editorCard.querySelector("#resizeLockAspect").checked;
      let newWidth = safeNum(editorCard.querySelector("#resizeWidth").value, 0);
      let newHeight = safeNum(editorCard.querySelector("#resizeHeight").value, 0);
      if (newWidth <= 0 && newHeight <= 0) {
        setMsg(editorErr, "Enter width and/or height (positive pixels).", true);
        editorErr.hidden = false;
        return;
      }
      if (lock && newWidth > 0 && newHeight <= 0) {
        newHeight = (originalHeight * newWidth) / originalWidth;
      } else if (lock && newHeight > 0 && newWidth <= 0) {
        newWidth = (originalWidth * newHeight) / originalHeight;
      } else if (newWidth > 0 && newHeight > 0) {
        /* both set */
      } else if (newWidth > 0) {
        newHeight = (originalHeight * newWidth) / originalWidth;
      } else {
        newWidth = (originalWidth * newHeight) / originalHeight;
      }
      newWidth = Math.max(1, Math.round(newWidth));
      newHeight = Math.max(1, Math.round(newHeight));
      originalWidth = newWidth;
      originalHeight = newHeight;
      const maxSize = Math.max(200, Math.min(2000, safeNum(editorCard.querySelector("#previewMax")?.value, 500)));
      if (originalWidth > originalHeight) {
        displayWidth = Math.min(originalWidth, maxSize);
        displayHeight = (originalHeight * displayWidth) / originalWidth;
      } else {
        displayHeight = Math.min(originalHeight, maxSize);
        displayWidth = (originalWidth * displayHeight) / originalHeight;
      }
      applyAllFilters();
      imageInfo.textContent = `📸 Working size ${newWidth}×${newHeight}px · preview ~${Math.round(displayWidth)}×${Math.round(displayHeight)}px`;
    };

    // Reset image
    editorCard.querySelector("#resetImageBtn").onclick = () => {
      if (originalImage) {
        originalWidth = originalImage.width;
        originalHeight = originalImage.height;
        const maxSize = Math.max(200, Math.min(2000, safeNum(editorCard.querySelector("#previewMax")?.value, 500)));
        if (originalWidth > originalHeight) {
          displayWidth = Math.min(originalWidth, maxSize);
          displayHeight = (originalHeight * displayWidth) / originalWidth;
        } else {
          displayHeight = Math.min(originalHeight, maxSize);
          displayWidth = (originalWidth * displayHeight) / originalHeight;
        }
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        currentFilters = {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          grayscale: false,
          sepia: false,
          invert: false,
          rotate: 0,
          flip: "none"
        };
        editorCard.querySelector("#brightnessSlider").value = 100;
        editorCard.querySelector("#contrastSlider").value = 100;
        editorCard.querySelector("#saturationSlider").value = 100;
        editorCard.querySelector("#blurSlider").value = 0;
        editorCard.querySelector("#rotateSelect").value = "0";
        editorCard.querySelector("#flipSelect").value = "none";
        editorCard.querySelector("#brightnessVal").textContent = "100";
        editorCard.querySelector("#contrastVal").textContent = "100";
        editorCard.querySelector("#saturationVal").textContent = "100";
        applyAllFilters();
        imageInfo.textContent = `📸 Reset: ${originalWidth}×${originalHeight}px`;
      }
    };

    // Filter buttons
    editorCard.querySelector("#grayscaleBtn").onclick = () => {
      currentFilters.grayscale = true;
      currentFilters.sepia = false;
      currentFilters.invert = false;
      applyAllFilters();
    };
    editorCard.querySelector("#sepiaBtn").onclick = () => {
      currentFilters.sepia = true;
      currentFilters.grayscale = false;
      currentFilters.invert = false;
      applyAllFilters();
    };
    editorCard.querySelector("#invertBtn").onclick = () => {
      currentFilters.invert = true;
      currentFilters.grayscale = false;
      currentFilters.sepia = false;
      applyAllFilters();
    };
    editorCard.querySelector("#clearStyleBtn").onclick = () => {
      currentFilters.grayscale = false;
      currentFilters.sepia = false;
      currentFilters.invert = false;
      applyAllFilters();
    };

    // Apply transform (rotate/flip)
    editorCard.querySelector("#applyTransformBtn").onclick = () => {
      currentFilters.rotate = safeNum(editorCard.querySelector("#rotateSelect").value, 0);
      currentFilters.flip = editorCard.querySelector("#flipSelect").value;
      applyAllFilters();
    };

    editorCard.querySelector("#downloadBtn").onclick = () => {
      if (!originalImage) {
        setMsg(editorErr, "Load an image before download.", true);
        editorErr.hidden = false;
        return;
      }
      editorErr.hidden = true;
      const format = editorCard.querySelector("#downloadFormat").value;
      const quality = safeNum(editorCard.querySelector("#qualitySlider").value, 0.92);
      const ext = format.split("/")[1] || "png";
      try {
        const url = canvas.toDataURL(format, format === "image/png" ? undefined : quality);
        downloadDataUrl(url, `edited-image.${ext}`);
      } catch (err) {
        setMsg(editorErr, "Export blocked (canvas tainted or format unsupported in this browser).", true);
        editorErr.hidden = false;
      }
    };

    editorCard.querySelector("#brightnessSlider").addEventListener("input", updateFromSliders);
    editorCard.querySelector("#contrastSlider").addEventListener("input", updateFromSliders);
    editorCard.querySelector("#saturationSlider").addEventListener("input", updateFromSliders);
    editorCard.querySelector("#blurSlider").addEventListener("input", updateFromSliders);
    
    // File upload handler
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) loadImage(e.target.files[0]);
    });

    // ============================================
    // QUICK RESIZE EXPORT
    // ============================================
    const quickCard = makeCard("quickresize", "📐", "Quick resize & export", `
      <p class="img-hint">Scales down so the longest side matches your target (never upscales).</p>
      <div><label for="qrFile">Image</label><input type="file" id="qrFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="qrMax">Max edge (px)</label><input type="number" id="qrMax" value="1200" min="32" max="8000"></div>
        <div><label for="qrFmt">Format</label><select id="qrFmt"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>
      </div>
      <details class="img-advanced"><summary>Advanced — quality</summary>
        <label for="qrQ">JPEG/WebP quality</label><input type="range" id="qrQ" min="0.5" max="1" step="0.02" value="0.9">
      </details>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="qrRun">Resize &amp; download</button>
        <button type="button" class="btn btn-secondary" id="qrMeta">Copy size summary</button>
      </div>
      <div id="qrMsg" class="result" role="status">Pick an image to scale by longest side.</div>
    `);
    let quickLastSummary = "";
    quickCard.querySelector("#qrRun").onclick = () => {
      const f = quickCard.querySelector("#qrFile").files?.[0];
      const msg = quickCard.querySelector("#qrMsg");
      if (!f) {
        setMsg(msg, "Select a file first.", true);
        return;
      }
      const maxEdge = Math.max(32, Math.min(8000, safeNum(quickCard.querySelector("#qrMax").value, 1200)));
      const fmt = quickCard.querySelector("#qrFmt").value;
      const q = safeNum(quickCard.querySelector("#qrQ").value, 0.9);
      const img = new Image();
      const objUrl = URL.createObjectURL(f);
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const long = Math.max(w, h);
        if (long > maxEdge) {
          const s = maxEdge / long;
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        try {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          const mimeQ = fmt === "image/png" ? undefined : q;
          const url = c.toDataURL(fmt, mimeQ);
          const ext = fmt === "image/png" ? "png" : fmt === "image/webp" ? "webp" : "jpg";
          downloadDataUrl(url, `resized-${w}x${h}.${ext}`);
          quickLastSummary = `${f.name}: ${img.naturalWidth}×${img.naturalHeight} → ${w}×${h}px · ${formatBytes(f.size)}`;
          setMsg(msg, `Exported ${w}×${h}px`, false);
        } catch (e) {
          setMsg(msg, "Export failed (try PNG or smaller image).", true);
        }
        URL.revokeObjectURL(objUrl);
      };
      img.onerror = () => {
        setMsg(msg, "Could not load image.", true);
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    };
    quickCard.querySelector("#qrMeta").onclick = () => copyText(quickLastSummary);

    // ============================================
    // IMAGE → BASE64
    // ============================================
    const b64Card = makeCard("imgb64", "🔣", "Image → Base64 / data URL", `
      <div><label for="b64File">Image</label><input type="file" id="b64File" accept="image/*"></div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="b64Run">Encode</button>
        <button type="button" class="btn btn-secondary" id="b64Copy">Copy data URL</button>
        <button type="button" class="btn btn-secondary" id="b64Dl">Download .txt</button>
      </div>
      <div id="b64Err" class="img-msg img-msg-error" hidden role="alert"></div>
      <textarea id="b64Ta" class="result" rows="4" placeholder="Data URL appears here…" readonly></textarea>
    `);
    b64Card.querySelector("#b64Run").onclick = () => {
      const f = b64Card.querySelector("#b64File").files?.[0];
      const ta = b64Card.querySelector("#b64Ta");
      const err = b64Card.querySelector("#b64Err");
      err.hidden = true;
      if (!f) {
        err.textContent = "Choose a file.";
        err.hidden = false;
        return;
      }
      if (f.size > 6 * 1024 * 1024) {
        err.textContent = "File is large; encoding may freeze the tab. Use Quick resize first.";
        err.hidden = false;
      }
      const r = new FileReader();
      r.onload = () => {
        ta.value = String(r.result || "");
        err.hidden = true;
      };
      r.onerror = () => {
        err.textContent = "Read failed.";
        err.hidden = false;
      };
      r.readAsDataURL(f);
    };
    b64Card.querySelector("#b64Copy").onclick = () => copyText(b64Card.querySelector("#b64Ta").value);
    b64Card.querySelector("#b64Dl").onclick = () => {
      const t = b64Card.querySelector("#b64Ta").value.trim();
      if (!t) return;
      const blob = new Blob([t], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "image-data-url.txt";
      a.click();
      URL.revokeObjectURL(a.href);
    };

    // ============================================
    // BASE64 PREVIEW
    // ============================================
    const prevCard = makeCard("b64prev", "🖼️", "Data URL / Base64 preview", `
      <div><label for="prevTa">Paste data URL or raw base64</label><textarea id="prevTa" rows="3" placeholder="data:image/png;base64,..."></textarea></div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="prevRun">Show</button>
        <button type="button" class="btn btn-secondary" id="prevDl">Download PNG</button>
        <button type="button" class="btn btn-secondary" id="prevCopyMeta">Copy dimensions</button>
      </div>
      <div class="canvas-container"><img id="prevImg" alt="Preview" style="max-width:100%;height:auto;display:none;border-radius:8px"></div>
      <div id="prevMsg" class="result" role="status"></div>
    `);
    prevCard.querySelector("#prevRun").onclick = () => {
      let s = prevCard.querySelector("#prevTa").value.trim();
      const im = prevCard.querySelector("#prevImg");
      const msg = prevCard.querySelector("#prevMsg");
      if (!s) {
        setMsg(msg, "Paste a value first.", true);
        return;
      }
      if (!s.startsWith("data:")) s = `data:image/png;base64,${s}`;
      im.onload = () => {
        im.style.display = "block";
        setMsg(msg, `${im.naturalWidth}×${im.naturalHeight}px`, false);
      };
      im.onerror = () => {
        im.style.display = "none";
        setMsg(msg, "Could not decode image (check MIME / base64).", true);
      };
      im.src = s;
    };
    prevCard.querySelector("#prevDl").onclick = () => {
      const im = prevCard.querySelector("#prevImg");
      if (!im.src || im.style.display === "none") return;
      try {
        const c = document.createElement("canvas");
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        c.getContext("2d").drawImage(im, 0, 0);
        downloadDataUrl(c.toDataURL("image/png"), "decoded.png");
      } catch (e) {
        setMsg(prevCard.querySelector("#prevMsg"), "Download failed.", true);
      }
    };
    prevCard.querySelector("#prevCopyMeta").onclick = () => copyText(prevCard.querySelector("#prevMsg").textContent);

    // ============================================
    // ASPECT RATIO CALCULATOR
    // ============================================
    const aspCard = makeCard("aspect", "📊", "Aspect ratio helper", `
      <div class="grid-3">
        <div><label for="aspW">Reference width</label><input type="number" id="aspW" value="1920" min="1"></div>
        <div><label for="aspH">Reference height</label><input type="number" id="aspH" value="1080" min="1"></div>
        <div><label for="aspMode">Solve for</label><select id="aspMode"><option value="h">New width → height</option><option value="w">New height → width</option></select></div>
      </div>
      <div class="grid-2">
        <div><label for="aspNewW">Target width</label><input type="number" id="aspNewW" value="1280" min="1"></div>
        <div><label for="aspNewH">Target height</label><input type="number" id="aspNewH" value="720" min="1"></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="aspBtn">Compute</button>
        <button type="button" class="btn btn-secondary" id="aspCopy">Copy result</button>
      </div>
      <div id="aspOut" class="result" role="status">—</div>
    `);
    aspCard.querySelector("#aspBtn").onclick = () => {
      const w = safeNum(aspCard.querySelector("#aspW").value, 0);
      const h = safeNum(aspCard.querySelector("#aspH").value, 0);
      const mode = aspCard.querySelector("#aspMode").value;
      const out = aspCard.querySelector("#aspOut");
      if (w <= 0 || h <= 0) {
        setMsg(out, "Enter positive reference width and height.", true);
        return;
      }
      const ratio = w / h;
      if (mode === "h") {
        const nw = safeNum(aspCard.querySelector("#aspNewW").value, 0);
        if (nw <= 0) {
          setMsg(out, "Enter target width.", true);
          return;
        }
        const nh = Math.round(nw / ratio);
        setMsg(out, `Ratio ${w}:${h} (${ratio.toFixed(4)}) → ${nw}×${nh}px`, false);
      } else {
        const nh = safeNum(aspCard.querySelector("#aspNewH").value, 0);
        if (nh <= 0) {
          setMsg(out, "Enter target height.", true);
          return;
        }
        const nw = Math.round(nh * ratio);
        setMsg(out, `Ratio ${w}:${h} (${ratio.toFixed(4)}) → ${nw}×${nh}px`, false);
      }
    };
    aspCard.querySelector("#aspCopy").onclick = () => copyText(aspCard.querySelector("#aspOut").textContent);

    // ============================================
    // IMAGE FILE INFO
    // ============================================
    const infoCard = makeCard("fileinfo", "ℹ️", "Image file info", `
      <div><label for="infoFile">File</label><input type="file" id="infoFile" accept="image/*"></div>
      <div class="inline-row">
        <button type="button" class="btn btn-secondary" id="infoJson">Download JSON</button>
        <button type="button" class="btn btn-secondary" id="infoCopy">Copy summary</button>
      </div>
      <div id="infoOut" class="result" role="status">—</div>
    `);
    let infoLast = null;
    infoCard.querySelector("#infoFile").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      const out = infoCard.querySelector("#infoOut");
      if (!f) return;
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        infoLast = {
          name: f.name,
          sizeBytes: f.size,
          type: f.type || "unknown",
          width: img.naturalWidth,
          height: img.naturalHeight,
          lastModified: f.lastModified ? new Date(f.lastModified).toISOString() : null
        };
        out.textContent = `${f.name} · ${formatBytes(f.size)} · ${img.naturalWidth}×${img.naturalHeight}px · ${f.type || "unknown"}`;
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        infoLast = null;
        setMsg(out, "Not a valid image.", true);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
    infoCard.querySelector("#infoJson").onclick = () => {
      if (!infoLast) return;
      const blob = new Blob([JSON.stringify(infoLast, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "image-info.json";
      a.click();
      URL.revokeObjectURL(a.href);
    };
    infoCard.querySelector("#infoCopy").onclick = () => copyText(infoCard.querySelector("#infoOut").textContent);

    // ============================================
    // COLOR PALETTE SAMPLER
    // ============================================
    const palCard = makeCard("palette", "🎨", "Palette sampler", `
      <p class="img-hint">Samples corners, center, and a coarse grid (quantized) for a quick mood board.</p>
      <div><label for="palFile">Image</label><input type="file" id="palFile" accept="image/*"></div>
      <details class="img-advanced"><summary>Advanced</summary>
        <label for="palGrid">Grid step (px, smaller = more swatches)</label><input type="number" id="palGrid" value="48" min="12" max="200" step="4">
      </details>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="palRun">Sample colors</button>
        <button type="button" class="btn btn-secondary" id="palCopy">Copy hex</button>
        <button type="button" class="btn btn-secondary" id="palTxt">Download .txt</button>
      </div>
      <div id="palSw" class="img-palette-swatches"></div>
      <div id="palMsg" class="result small" role="status"></div>
    `);
    function quantize(c) {
      const q = 24;
      return Math.round(c / q) * q;
    }
    palCard.querySelector("#palRun").onclick = () => {
      const f = palCard.querySelector("#palFile").files?.[0];
      const msg = palCard.querySelector("#palMsg");
      if (!f) {
        setMsg(msg, "Select an image.", true);
        return;
      }
      const step = Math.max(12, Math.min(200, safeNum(palCard.querySelector("#palGrid").value, 48)));
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        const c = document.createElement("canvas");
        const maxEdge = 640;
        let w = img.width;
        let h = img.height;
        const L = Math.max(w, h);
        if (L > maxEdge) {
          const s = maxEdge / L;
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        x.drawImage(img, 0, 0, w, h);
        const seen = new Set();
        const hexes = [];
        function addPixel(px, py) {
          const d = x.getImageData(Math.min(px, w - 1), Math.min(py, h - 1), 1, 1).data;
          const r = quantize(d[0]);
          const g = quantize(d[1]);
          const b = quantize(d[2]);
          const hx = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
          if (!seen.has(hx)) {
            seen.add(hx);
            hexes.push(hx);
          }
        }
        addPixel(0, 0);
        addPixel(w - 1, 0);
        addPixel(0, h - 1);
        addPixel(w - 1, h - 1);
        addPixel(Math.floor(w / 2), Math.floor(h / 2));
        for (let py = step; py < h - step; py += step) {
          for (let px = step; px < w - step; px += step) addPixel(px, py);
        }
        const sw = palCard.querySelector("#palSw");
        sw.innerHTML = "";
        hexes.slice(0, 24).forEach((hx) => {
          const el = document.createElement("span");
          el.className = "img-swatch";
          el.style.background = hx;
          el.title = hx;
          sw.appendChild(el);
        });
        palCard.dataset.hexes = hexes.join("\n");
        setMsg(msg, `${hexes.length} unique swatches (showing ${Math.min(24, hexes.length)})`, false);
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Could not read image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };
    palCard.querySelector("#palCopy").onclick = () => copyText(palCard.dataset.hexes || "");
    palCard.querySelector("#palTxt").onclick = () => {
      const t = palCard.dataset.hexes || "";
      if (!t) return;
      const blob = new Blob([t], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "palette-hex.txt";
      a.click();
      URL.revokeObjectURL(a.href);
    };

    // ============================================
    // GRAYSCALE EXPORT
    // ============================================
    const grayCard = makeCard("grayexport", "⬛", "Grayscale export", `
      <div><label for="gxFile">Image</label><input type="file" id="gxFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="gxFmt">Output</label><select id="gxFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
        <div><label for="gxQ">Quality</label><input type="range" id="gxQ" min="0.7" max="1" step="0.02" value="0.92"></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="gxRun">Convert &amp; download</button>
      </div>
      <div id="gxMsg" class="result" role="status"></div>
    `);
    grayCard.querySelector("#gxRun").onclick = () => {
      const f = grayCard.querySelector("#gxFile").files?.[0];
      const msg = grayCard.querySelector("#gxMsg");
      if (!f) {
        setMsg(msg, "Select a file.", true);
        return;
      }
      const fmt = grayCard.querySelector("#gxFmt").value;
      const q = safeNum(grayCard.querySelector("#gxQ").value, 0.92);
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const x = c.getContext("2d");
          x.drawImage(img, 0, 0);
          const id = x.getImageData(0, 0, c.width, c.height);
          for (let i = 0; i < id.data.length; i += 4) {
            const y = 0.299 * id.data[i] + 0.587 * id.data[i + 1] + 0.114 * id.data[i + 2];
            id.data[i] = id.data[i + 1] = id.data[i + 2] = y;
          }
          x.putImageData(id, 0, 0);
          const ext = fmt === "image/png" ? "png" : fmt === "image/webp" ? "webp" : "jpg";
          downloadDataUrl(c.toDataURL(fmt, fmt === "image/png" ? undefined : q), `grayscale.${ext}`);
          setMsg(msg, `Done · ${c.width}×${c.height}px`, false);
        } catch (e) {
          setMsg(msg, "Export failed.", true);
        }
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Invalid image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };

    // ============================================
    // ROTATE 90° EXPORT
    // ============================================
    const rotCard = makeCard("rot90", "↻", "Quick rotate export", `
      <div><label for="rotFile">Image</label><input type="file" id="rotFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="rotAngle">Angle</label><select id="rotAngle"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>
        <div><label for="rotDir">Direction (90/270)</label><select id="rotDir"><option value="cw">Clockwise</option><option value="ccw">Counter-clockwise</option></select></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="rotRun">Rotate &amp; download PNG</button>
      </div>
      <div id="rotMsg" class="result" role="status"></div>
    `);
    rotCard.querySelector("#rotRun").onclick = () => {
      const f = rotCard.querySelector("#rotFile").files?.[0];
      const msg = rotCard.querySelector("#rotMsg");
      if (!f) {
        setMsg(msg, "Select a file.", true);
        return;
      }
      const deg = safeNum(rotCard.querySelector("#rotAngle").value, 90);
      const cw = rotCard.querySelector("#rotDir").value === "cw";
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        let rad = 0;
        if (deg === 90) rad = (cw ? 1 : -1) * (Math.PI / 2);
        else if (deg === 270) rad = (cw ? -1 : 1) * (Math.PI / 2);
        else if (deg === 180) rad = Math.PI;
        const c = document.createElement("canvas");
        if (deg === 90 || deg === 270) {
          c.width = h;
          c.height = w;
        } else {
          c.width = w;
          c.height = h;
        }
        const x = c.getContext("2d");
        x.translate(c.width / 2, c.height / 2);
        x.rotate(rad);
        x.drawImage(img, -img.width / 2, -img.height / 2);
        downloadDataUrl(c.toDataURL("image/png"), `rotated-${deg}.png`);
        setMsg(msg, `Exported ${c.width}×${c.height}px`, false);
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Invalid image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };

    // ============================================
    // SOLID COLOR PNG
    // ============================================
    const solidCard = makeCard("solid", "⬜", "Solid / gradient PNG", `
      <div class="grid-2">
        <div><label for="solW">Width</label><input type="number" id="solW" value="512" min="1" max="4096"></div>
        <div><label for="solH">Height</label><input type="number" id="solH" value="512" min="1" max="4096"></div>
      </div>
      <div class="inline-row img-checkbox-row">
        <label><input type="checkbox" id="solGrad"> Linear gradient (top → bottom)</label>
      </div>
      <div class="grid-2">
        <div><label for="solC">Color A</label><input type="color" id="solC" value="#4361ee"></div>
        <div><label for="solC2">Color B</label><input type="color" id="solC2" value="#7209b7"></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="solRun">Download PNG</button>
      </div>
      <div id="solMsg" class="result small" role="status">Placeholders, hero backgrounds, tests.</div>
    `);
    solidCard.querySelector("#solRun").onclick = () => {
      const w = Math.max(1, Math.min(4096, safeNum(solidCard.querySelector("#solW").value, 512)));
      const h = Math.max(1, Math.min(4096, safeNum(solidCard.querySelector("#solH").value, 512)));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      if (solidCard.querySelector("#solGrad").checked) {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, solidCard.querySelector("#solC").value);
        g.addColorStop(1, solidCard.querySelector("#solC2").value);
        x.fillStyle = g;
      } else {
        x.fillStyle = solidCard.querySelector("#solC").value;
      }
      x.fillRect(0, 0, w, h);
      downloadDataUrl(c.toDataURL("image/png"), `solid-${w}x${h}.png`);
      solidCard.querySelector("#solMsg").textContent = `Saved ${w}×${h}px PNG`;
    };

    // ============================================
    // COMPRESS / RESIZE FOR WEB
    // ============================================
    const compCard = makeCard("compress", "🗜️", "Compress for web", `
      <p class="img-hint">Resize by max edge and lower JPEG/WebP quality to shrink file size. PNG stays lossless.</p>
      <div><label for="cxFile">Image</label><input type="file" id="cxFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="cxMax">Max edge (px)</label><input type="number" id="cxMax" value="1600" min="64" max="8000"></div>
        <div><label for="cxFmt">Format</label><select id="cxFmt"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>
      </div>
      <div class="grid-2">
        <div><label for="cxQ">Quality (JPEG/WebP)</label><input type="range" id="cxQ" min="0.4" max="1" step="0.02" value="0.82"></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="cxRun">Compress &amp; download</button>
      </div>
      <div id="cxMsg" class="result" role="status"></div>
    `);
    compCard.querySelector("#cxRun").onclick = () => {
      const f = compCard.querySelector("#cxFile").files?.[0];
      const msg = compCard.querySelector("#cxMsg");
      if (!f) {
        setMsg(msg, "Select an image.", true);
        return;
      }
      const maxEdge = Math.max(64, Math.min(8000, safeNum(compCard.querySelector("#cxMax").value, 1600)));
      const fmt = compCard.querySelector("#cxFmt").value;
      const q = safeNum(compCard.querySelector("#cxQ").value, 0.82);
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const L = Math.max(w, h);
        if (L > maxEdge) {
          const s = maxEdge / L;
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        try {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          const mimeQ = fmt === "image/png" ? undefined : q;
          const url = c.toDataURL(fmt, mimeQ);
          const ext = fmt === "image/png" ? "png" : fmt === "image/webp" ? "webp" : "jpg";
          downloadDataUrl(url, `compressed-${w}x${h}.${ext}`);
          setMsg(msg, `${img.naturalWidth}×${img.naturalHeight} → ${w}×${h}px · was ${formatBytes(f.size)}`, false);
        } catch (e) {
          setMsg(msg, "Export failed.", true);
        }
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Could not load image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };

    // ============================================
    // TEXT WATERMARK
    // ============================================
    const wmCard = makeCard("watermark", "✒️", "Text watermark", `
      <div><label for="wmFile">Image</label><input type="file" id="wmFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="wmText">Text</label><input type="text" id="wmText" value="© Preview"></div>
        <div><label for="wmPos">Position</label><select id="wmPos"><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="tr">Top right</option><option value="tl">Top left</option><option value="c">Center</option></select></div>
      </div>
      <div class="grid-3">
        <div><label for="wmSize">Font size</label><input type="number" id="wmSize" value="28" min="8" max="200"></div>
        <div><label for="wmOp">Opacity</label><input type="range" id="wmOp" min="0.1" max="1" step="0.05" value="0.55"></div>
        <div><label for="wmColor">Color</label><input type="color" id="wmColor" value="#ffffff"></div>
      </div>
      <details class="img-advanced"><summary>Advanced</summary>
        <label><input type="checkbox" id="wmShadow" checked> Subtle shadow for contrast</label>
      </details>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="wmRun">Apply &amp; download PNG</button>
      </div>
      <div id="wmMsg" class="result" role="status"></div>
    `);
    wmCard.querySelector("#wmRun").onclick = () => {
      const f = wmCard.querySelector("#wmFile").files?.[0];
      const msg = wmCard.querySelector("#wmMsg");
      const text = (wmCard.querySelector("#wmText").value || "").trim();
      if (!f || !text) {
        setMsg(msg, "Need image and watermark text.", true);
        return;
      }
      const size = Math.max(8, Math.min(200, safeNum(wmCard.querySelector("#wmSize").value, 28)));
      const op = safeNum(wmCard.querySelector("#wmOp").value, 0.55);
      const col = wmCard.querySelector("#wmColor").value;
      const pos = wmCard.querySelector("#wmPos").value;
      const shadow = wmCard.querySelector("#wmShadow").checked;
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const x = c.getContext("2d");
          x.drawImage(img, 0, 0);
          x.font = `bold ${size}px system-ui, sans-serif`;
          x.textBaseline = "middle";
          const pad = Math.max(12, size * 0.35);
          const tw = x.measureText(text).width;
          let tx;
          let ty;
          if (pos === "tl") {
            tx = pad;
            ty = pad + size / 2;
          } else if (pos === "tr") {
            tx = c.width - tw - pad;
            ty = pad + size / 2;
          } else if (pos === "bl") {
            tx = pad;
            ty = c.height - pad - size / 2;
          } else if (pos === "br") {
            tx = c.width - tw - pad;
            ty = c.height - pad - size / 2;
          } else {
            tx = (c.width - tw) / 2;
            ty = c.height / 2;
          }
          x.save();
          x.globalAlpha = op;
          if (shadow) {
            x.fillStyle = "rgba(0,0,0,0.45)";
            x.fillText(text, tx + 2, ty + 2);
          }
          x.fillStyle = col;
          x.fillText(text, tx, ty);
          x.restore();
          downloadDataUrl(c.toDataURL("image/png"), "watermarked.png");
          setMsg(msg, `Done · ${c.width}×${c.height}px`, false);
        } catch (e) {
          setMsg(msg, "Export failed.", true);
        }
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Invalid image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };

    // ============================================
    // CENTER CROP TO RATIO
    // ============================================
    const cropCard = makeCard("croppreset", "✂️", "Center crop to ratio", `
      <p class="img-hint">Crops from the center to match common social / photo ratios.</p>
      <div><label for="crFile">Image</label><input type="file" id="crFile" accept="image/*"></div>
      <div class="grid-2">
        <div><label for="crRatio">Target ratio</label><select id="crRatio">
          <option value="1">1 : 1 (square)</option>
          <option value="1.7778">16 : 9</option>
          <option value="1.3333">4 : 3</option>
          <option value="0.8">4 : 5 (portrait)</option>
          <option value="1.91">1.91 : 1 (wide)</option>
        </select></div>
        <div><label for="crFmt">Output</label><select id="crFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></div>
      </div>
      <div class="inline-row">
        <button type="button" class="btn btn-primary" id="crRun">Crop &amp; download</button>
      </div>
      <div id="crMsg" class="result" role="status"></div>
    `);
    cropCard.querySelector("#crRun").onclick = () => {
      const f = cropCard.querySelector("#crFile").files?.[0];
      const msg = cropCard.querySelector("#crMsg");
      if (!f) {
        setMsg(msg, "Select an image.", true);
        return;
      }
      const target = safeNum(cropCard.querySelector("#crRatio").value, 1);
      const fmt = cropCard.querySelector("#crFmt").value;
      const img = new Image();
      const ou = URL.createObjectURL(f);
      img.onload = () => {
        const W = img.width;
        const H = img.height;
        const cur = W / H;
        let cw;
        let ch;
        let cx;
        let cy;
        if (cur > target) {
          ch = H;
          cw = Math.round(H * target);
          cx = Math.round((W - cw) / 2);
          cy = 0;
        } else {
          cw = W;
          ch = Math.round(W / target);
          cx = 0;
          cy = Math.round((H - ch) / 2);
        }
        try {
          const c = document.createElement("canvas");
          c.width = cw;
          c.height = ch;
          c.getContext("2d").drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
          const ext = fmt === "image/png" ? "png" : "jpg";
          downloadDataUrl(c.toDataURL(fmt, fmt === "image/png" ? undefined : 0.92), `crop-${cw}x${ch}.${ext}`);
          setMsg(msg, `Cropped ${W}×${H} → ${cw}×${ch}px`, false);
        } catch (e) {
          setMsg(msg, "Export failed.", true);
        }
        URL.revokeObjectURL(ou);
      };
      img.onerror = () => {
        setMsg(msg, "Invalid image.", true);
        URL.revokeObjectURL(ou);
      };
      img.src = ou;
    };

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "img-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "img-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);

    let activeFocusedCard = null;
    let focusPlaceholder = null;
    let focusOpenTimer = null;

    function openToolFocus(card) {
      if (!card) return;
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (activeFocusedCard === card) return;
      if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused");
      activeFocusedCard = card;
      focusPlaceholder = document.createElement("div");
      focusPlaceholder.style.height = card.offsetHeight + "px";
      card.parentNode.insertBefore(focusPlaceholder, card);
      focusHost.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      document.body.classList.add("img-modal-open");
      focusOverlay.classList.add("active");
      focusHost.classList.add("active");
      setTimeout(() => {
        const firstInput = card.querySelector("input, select, textarea, button");
        firstInput?.focus();
      }, 40);
    }

    function closeToolFocus() {
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (!activeFocusedCard) return;
      activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeFocusedCard.classList.remove("is-focused");
      if (focusPlaceholder?.parentNode) {
        focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder);
        focusPlaceholder.remove();
      }
      focusPlaceholder = null;
      activeFocusedCard = null;
      focusHost.classList.remove("active");
      focusOverlay.classList.remove("active");
      document.body.classList.remove("img-modal-open");
    }

    grid.querySelectorAll(".img-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".img-card")));
    });
    
    grid.querySelectorAll(".img-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".img-card[data-focusable='true'] .img-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".img-card"));
      });
    });
    
    focusOverlay.addEventListener("click", () => closeToolFocus());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeToolFocus(); });

    // Navigation buttons
    document.querySelectorAll(".tool-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-target");
        const card = document.getElementById(`card-${target}`);
        if (!card) return;
        const mobileLike = window.matchMedia("(max-width: 768px)").matches;
        if (mobileLike) {
          openToolFocus(card);
        } else {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          focusOpenTimer = setTimeout(() => openToolFocus(card), 200);
        }
      });
    });

    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["image-tools"] = initImageTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initImageTools(null);
    }
  });
})();