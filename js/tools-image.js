(function initImageTools() {
  const dropZone = document.getElementById("dropZone");
  const imageInput = document.getElementById("imageInput");
  const canvas = document.getElementById("imageCanvas");
  const ctx = canvas?.getContext("2d");
  const suggestionsPanel = document.getElementById("suggestionsPanel");
  if (!dropZone || !imageInput || !canvas || !ctx) return;

  const meta = {
    name: document.getElementById("metaName"),
    size: document.getElementById("metaSize"),
    type: document.getElementById("metaType"),
    dim: document.getElementById("metaDim"),
  };

  const filterControls = {
    brightness: document.getElementById("filterBrightness"),
    contrast: document.getElementById("filterContrast"),
    saturate: document.getElementById("filterSaturate"),
    grayscale: document.getElementById("filterGrayscale"),
    blur: document.getElementById("filterBlur"),
  };

  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const filterStatus = document.getElementById("filterStatus");
  const historyStatus = document.getElementById("historyStatus");
  const undoImageBtn = document.getElementById("undoImageBtn");
  const redoImageBtn = document.getElementById("redoImageBtn");
  const autoEnhanceBtn = document.getElementById("autoEnhanceBtn");
  const compareOriginalBtn = document.getElementById("compareOriginalBtn");
  const resetImageBtn = document.getElementById("resetImageBtn");
  const studioStatus = document.getElementById("imageLabStudioStatus");
  const effectsStatus = document.getElementById("effectsStatus");
  const exportStatusNode = document.getElementById("exportStatus");

  let activeFile = null;
  let filterBaseCanvas = null;
  let originalCanvas = null;
  let history = [];
  let historyIndex = -1;
  let eyedropperActive = false;

  function cloneCanvas(source) {
    const copy = document.createElement("canvas");
    copy.width = source.width;
    copy.height = source.height;
    copy.getContext("2d").drawImage(source, 0, 0);
    return copy;
  }

  function bytesToReadable(bytes) {
    if (!Number.isFinite(bytes)) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  function setSuggestions(items) {
    if (!suggestionsPanel) return;
    suggestionsPanel.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = item;
      suggestionsPanel.appendChild(chip);
    });
  }

  function drawToMain(targetCanvas) {
    canvas.width = targetCanvas.width;
    canvas.height = targetCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(targetCanvas, 0, 0);
    if (meta.dim) meta.dim.textContent = `${canvas.width} x ${canvas.height}`;
  }

  function syncHistoryStatus() {
    if (historyStatus)
      historyStatus.textContent = `History: ${Math.max(0, historyIndex + 1)} / ${history.length} states`;
    if (undoImageBtn) undoImageBtn.disabled = historyIndex <= 0;
    if (redoImageBtn) redoImageBtn.disabled = historyIndex >= history.length - 1;
  }

  function pushHistory(label = "") {
    if (!canvas.width || !canvas.height) return;
    history = history.slice(0, historyIndex + 1);
    history.push(cloneCanvas(canvas));
    historyIndex = history.length - 1;
    if (history.length > 30) {
      history = history.slice(history.length - 30);
      historyIndex = history.length - 1;
    }
    syncHistoryStatus();
    if (label && filterStatus) filterStatus.textContent = label;
  }

  function saveFilterBaseFromCurrentCanvas() {
    if (!canvas.width || !canvas.height) return;
    filterBaseCanvas = cloneCanvas(canvas);
  }

  function resetFilterControlsUI() {
    if (filterControls.brightness) filterControls.brightness.value = "100";
    if (filterControls.contrast) filterControls.contrast.value = "100";
    if (filterControls.saturate) filterControls.saturate.value = "100";
    if (filterControls.grayscale) filterControls.grayscale.value = "0";
    if (filterControls.blur) filterControls.blur.value = "0";
  }

  function getFilterCSS() {
    return [
      `brightness(${Number(filterControls.brightness?.value || 100)}%)`,
      `contrast(${Number(filterControls.contrast?.value || 100)}%)`,
      `saturate(${Number(filterControls.saturate?.value || 100)}%)`,
      `grayscale(${Number(filterControls.grayscale?.value || 0)}%)`,
      `blur(${Number(filterControls.blur?.value || 0)}px)`,
    ].join(" ");
  }

  function renderFromBaseWithFilters() {
    if (!filterBaseCanvas) return;
    canvas.width = filterBaseCanvas.width;
    canvas.height = filterBaseCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getFilterCSS();
    ctx.drawImage(filterBaseCanvas, 0, 0);
    ctx.filter = "none";
    if (meta.dim) meta.dim.textContent = `${canvas.width} x ${canvas.height}`;
  }

  function ensureImageLoaded() {
    return Boolean(canvas.width && canvas.height && filterBaseCanvas);
  }

  function downloadCanvasAs(type, quality, suffix) {
    if (!activeFile || !ensureImageLoaded()) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeFile.name.replace(/\.[^/.]+$/, "")}-${suffix}.${type === "image/png" ? "png" : "jpg"}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      type,
      quality
    );
  }

  function downloadWhiteBgJpg(suffix, quality) {
    if (!activeFile || !ensureImageLoaded()) return;
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tempCtx = temp.getContext("2d");
    tempCtx.fillStyle = "#fff";
    tempCtx.fillRect(0, 0, temp.width, temp.height);
    tempCtx.drawImage(canvas, 0, 0);
    temp.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeFile.name.replace(/\.[^/.]+$/, "")}-${suffix}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      quality
    );
  }

  function handleFile(file) {
    activeFile = file;
    if (meta.name) meta.name.textContent = file.name;
    if (meta.size) meta.size.textContent = bytesToReadable(file.size);
    if (meta.type) meta.type.textContent = file.type || "unknown";

    if (!file.type.startsWith("image/")) {
      if (meta.dim) meta.dim.textContent = "-";
      setSuggestions([
        "Detected non-image file",
        "Try File Type Detector in File Tools",
        "Need text processing? Open Text Tools",
      ]);
      setStudioStatus("Please choose a PNG, JPG, WebP, or similar image file.");
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (meta.dim) meta.dim.textContent = `${canvas.width} x ${canvas.height}`;
      originalCanvas = cloneCanvas(canvas);
      filterBaseCanvas = cloneCanvas(canvas);
      history = [];
      historyIndex = -1;
      pushHistory("Image loaded.");
      resetFilterControlsUI();
      if (filterStatus) filterStatus.textContent = "Filters ready. Move sliders for live preview.";
      const suggestions = [];
      if (file.type.includes("png")) suggestions.push("Convert to JPG?");
      if (canvas.width > 1400 || canvas.height > 1400) suggestions.push("Compress image for web?");
      if (canvas.width !== canvas.height) suggestions.push("Need social post square crop?");
      if (canvas.height > canvas.width * 1.2) suggestions.push("Resize for passport format?");
      suggestions.push("Try Auto Enhance for quick improvement.");
      setSuggestions(suggestions);
      setStudioStatus(
        "Image loaded. Use tabs for transform, color, effects, and export — filters preview until you Commit."
      );
      setExportStatus("Ready: download PNG / JPG / WebP or copy a data URL.");
    };
    img.src = URL.createObjectURL(file);
  }

  function applyCanvasTransform(drawFn, successMessage) {
    if (!ensureImageLoaded()) return;
    const temp = document.createElement("canvas");
    drawFn(temp);
    drawToMain(temp);
    saveFilterBaseFromCurrentCanvas();
    resetFilterControlsUI();
    pushHistory(successMessage);
  }

  function applyCropPreset(ratioW, ratioH) {
    if (!ensureImageLoaded()) return;
    const targetRatio = ratioW / ratioH;
    let width = canvas.width;
    let height = Math.round(width / targetRatio);
    if (height > canvas.height) {
      height = canvas.height;
      width = Math.round(height * targetRatio);
    }
    const x = Math.round((canvas.width - width) / 2);
    const y = Math.round((canvas.height - height) / 2);
    const cropX = document.getElementById("cropX");
    const cropY = document.getElementById("cropY");
    const cropW = document.getElementById("cropW");
    const cropH = document.getElementById("cropH");
    if (cropX) cropX.value = String(x);
    if (cropY) cropY.value = String(y);
    if (cropW) cropW.value = String(width);
    if (cropH) cropH.value = String(height);
  }

  function setStudioStatus(message) {
    if (studioStatus) studioStatus.textContent = message;
  }
  function setEffectsStatus(message) {
    if (effectsStatus) effectsStatus.textContent = message;
  }
  function setExportStatus(message) {
    if (exportStatusNode) exportStatusNode.textContent = message;
  }

  function initImageLabTabs() {
    const tabs = document.querySelectorAll("[data-image-tab]");
    const panels = document.querySelectorAll("[data-image-panel]");
    if (!tabs.length || !panels.length) return;
    function activate(slug) {
      tabs.forEach((tab) => {
        const on = tab.getAttribute("data-image-tab") === slug;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((panel) => {
        const on = panel.getAttribute("data-image-panel") === slug;
        panel.classList.toggle("is-active", on);
      });
    }
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.getAttribute("data-image-tab") || "studio"));
    });
  }

  function wireRangeLabel(rangeEl, labelEl, formatFn) {
    if (!rangeEl || !labelEl) return;
    const sync = () => {
      labelEl.textContent = formatFn(rangeEl.value);
    };
    rangeEl.addEventListener("input", sync);
    sync();
  }

  function initImageLabUi() {
    initImageLabTabs();
    wireRangeLabel(filterControls.brightness, document.getElementById("filterBrightnessVal"), (v) => `${v}%`);
    wireRangeLabel(filterControls.contrast, document.getElementById("filterContrastVal"), (v) => `${v}%`);
    wireRangeLabel(filterControls.saturate, document.getElementById("filterSaturateVal"), (v) => `${v}%`);
    wireRangeLabel(filterControls.grayscale, document.getElementById("filterGrayscaleVal"), (v) => `${v}%`);
    wireRangeLabel(filterControls.blur, document.getElementById("filterBlurVal"), (v) => `${v}px`);
    wireRangeLabel(document.getElementById("hueRotateRange"), document.getElementById("hueRotateVal"), (v) => `${v}°`);
    wireRangeLabel(document.getElementById("pixelBlockRange"), document.getElementById("pixelBlockVal"), (v) => `${v}px`);
    wireRangeLabel(document.getElementById("vignetteRange"), document.getElementById("vignetteVal"), (v) => `${v}%`);
    wireRangeLabel(document.getElementById("noiseRange"), document.getElementById("noiseVal"), (v) => `${v}%`);
    wireRangeLabel(document.getElementById("qualityRange"), document.getElementById("qualityVal"), (v) =>
      Number(v).toFixed(2)
    );
  }

  function applyPixelPass(mutator, historyLabel) {
    if (!ensureImageLoaded()) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    mutator(imgData.data, w, h);
    applyCanvasTransform((temp) => {
      temp.width = w;
      temp.height = h;
      temp.getContext("2d").putImageData(imgData, 0, 0);
    }, historyLabel);
  }

  function applySharpenKernel() {
    if (!ensureImageLoaded()) return;
    const w = canvas.width;
    const h = canvas.height;
    if (w * h > 6_500_000) {
      setEffectsStatus("Image is very large — sharpen skipped. Resize first for faster edits.");
      return;
    }
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;
    const dst = new Uint8ClampedArray(src);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const idx = (x, y) => (y * w + x) * 4;
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        for (let c = 0; c < 3; c += 1) {
          let sum = 0;
          let ki = 0;
          for (let ky = -1; ky <= 1; ky += 1) {
            for (let kx = -1; kx <= 1; kx += 1) {
              sum += src[idx(x + kx, y + ky) + c] * kernel[ki];
              ki += 1;
            }
          }
          dst[idx(x, y) + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    imgData.data.set(dst);
    applyCanvasTransform((temp) => {
      temp.width = w;
      temp.height = h;
      temp.getContext("2d").putImageData(imgData, 0, 0);
    }, "Sharpen applied.");
    setEffectsStatus("Sharpen applied.");
  }

  function applyPixelate(block) {
    if (!ensureImageLoaded()) return;
    const w = canvas.width;
    const h = canvas.height;
    const bw = Math.max(2, Math.min(64, Math.round(block)));
    const sw = Math.max(1, Math.ceil(w / bw));
    const sh = Math.max(1, Math.ceil(h / bw));
    const small = document.createElement("canvas");
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext("2d");
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(canvas, 0, 0, w, h, 0, 0, sw, sh);
    applyCanvasTransform((temp) => {
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d");
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(small, 0, 0, sw, sh, 0, 0, w, h);
    }, "Pixelate applied.");
    setEffectsStatus(`Pixelate (${bw}px blocks).`);
  }

  function applyVignetteFromSlider() {
    if (!ensureImageLoaded()) return;
    const strength = Number(document.getElementById("vignetteRange")?.value || 0);
    if (strength <= 0) {
      setEffectsStatus("Increase vignette strength first.");
      return;
    }
    const w = canvas.width;
    const h = canvas.height;
    applyCanvasTransform((temp) => {
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d");
      tctx.drawImage(canvas, 0, 0);
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.hypot(cx, cy);
      const g = tctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r * 1.02);
      const alpha = Math.min(0.85, 0.08 + strength / 120);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${alpha})`);
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
    }, "Vignette applied.");
    setEffectsStatus("Vignette applied.");
  }

  function applyFilmGrain() {
    if (!ensureImageLoaded()) return;
    const amt = Number(document.getElementById("noiseRange")?.value || 0);
    if (amt <= 0) {
      setEffectsStatus("Increase grain amount first.");
      return;
    }
    const w = canvas.width;
    const h = canvas.height;
    if (w * h > 8_000_000) {
      setEffectsStatus("Image very large — grain skipped. Resize first.");
      return;
    }
    applyPixelPass((d) => {
      const spread = (amt / 100) * 70;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * spread;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    }, "Film grain applied.");
    setEffectsStatus("Film grain applied.");
  }

  function applyBorderFrame() {
    if (!ensureImageLoaded()) return;
    const pad = Math.max(0, Math.min(160, Number(document.getElementById("borderWidthInput")?.value || 0)));
    const color = document.getElementById("borderColorInput")?.value || "#ffffff";
    const w = canvas.width;
    const h = canvas.height;
    applyCanvasTransform((temp) => {
      temp.width = w + pad * 2;
      temp.height = h + pad * 2;
      const tctx = temp.getContext("2d");
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, temp.width, temp.height);
      tctx.drawImage(canvas, pad, pad);
    }, "Border applied.");
    setEffectsStatus("Border applied.");
  }

  function downloadRoundedPng() {
    if (!activeFile || !ensureImageLoaded()) return;
    const raw = Number(document.getElementById("roundRadiusInput")?.value || 0);
    const w = canvas.width;
    const h = canvas.height;
    const rad = Math.max(0, Math.min(raw, Math.floor(Math.min(w, h) / 2)));
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext("2d");
    tctx.clearRect(0, 0, w, h);
    tctx.save();
    tctx.beginPath();
    if (typeof tctx.roundRect === "function") {
      tctx.roundRect(0, 0, w, h, rad);
    } else {
      const r = rad;
      tctx.moveTo(r, 0);
      tctx.lineTo(w - r, 0);
      tctx.quadraticCurveTo(w, 0, w, r);
      tctx.lineTo(w, h - r);
      tctx.quadraticCurveTo(w, h, w - r, h);
      tctx.lineTo(r, h);
      tctx.quadraticCurveTo(0, h, 0, h - r);
      tctx.lineTo(0, r);
      tctx.quadraticCurveTo(0, 0, r, 0);
      tctx.closePath();
    }
    tctx.clip();
    tctx.drawImage(canvas, 0, 0);
    tctx.restore();
    temp.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeFile.name.replace(/\.[^/.]+$/, "")}-rounded.png`;
        a.click();
        URL.revokeObjectURL(url);
        setExportStatus("Rounded PNG download started.");
      },
      "image/png",
      1
    );
  }

  function extractPalette() {
    if (!ensureImageLoaded()) return;
    const out = document.getElementById("imagePaletteOut");
    if (!out) return;
    const sample = document.createElement("canvas");
    const sw = 48;
    const sh = 48;
    sample.width = sw;
    sample.height = sh;
    sample.getContext("2d").drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, sw, sh);
    const data = sample.getContext("2d").getImageData(0, 0, sw, sh).data;
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 8) continue;
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    out.innerHTML = "";
    sorted.forEach(([key]) => {
      const [rv, gv, bv] = key.split(",").map(Number);
      const span = document.createElement("span");
      span.style.background = `rgb(${rv},${gv},${bv})`;
      span.title = `rgb(${rv}, ${gv}, ${bv})`;
      out.appendChild(span);
    });
    setEffectsStatus("Palette extracted (quantized sample).");
  }

  initImageLabUi();

  dropZone.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("active");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("active");
    });
  });
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  document
    .getElementById("downloadPngBtn")
    ?.addEventListener("click", () => downloadCanvasAs("image/png", 1, "converted"));
  document
    .getElementById("downloadJpgBtn")
    ?.addEventListener("click", () => downloadWhiteBgJpg("converted", 0.92));
  document
    .getElementById("downloadWebpBtn")
    ?.addEventListener("click", () => downloadCanvasAs("image/webp", 0.9, "converted"));

  document.getElementById("resizeBtn")?.addEventListener("click", () => {
    const w = Number(document.getElementById("resizeW")?.value);
    const h = Number(document.getElementById("resizeH")?.value);
    const resizeResult = document.getElementById("resizeResult");
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || !ensureImageLoaded()) {
      if (resizeResult) resizeResult.textContent = "Resize status: Enter valid width and height.";
      return;
    }
    applyCanvasTransform((temp) => {
      temp.width = Math.round(w);
      temp.height = Math.round(h);
      temp.getContext("2d").drawImage(canvas, 0, 0, temp.width, temp.height);
    }, "Resize applied.");
    if (resizeResult) resizeResult.textContent = "Resize status: Applied successfully.";
  });
  document.getElementById("resizePreset1080")?.addEventListener("click", () => {
    const w = document.getElementById("resizeW");
    const h = document.getElementById("resizeH");
    if (w) w.value = "1080";
    if (h) h.value = "1080";
  });
  document.getElementById("resizePresetStory")?.addEventListener("click", () => {
    const w = document.getElementById("resizeW");
    const h = document.getElementById("resizeH");
    if (w) w.value = "1080";
    if (h) h.value = "1920";
  });
  document.getElementById("resizePresetThumb")?.addEventListener("click", () => {
    const w = document.getElementById("resizeW");
    const h = document.getElementById("resizeH");
    if (w) w.value = "1280";
    if (h) h.value = "720";
  });

  document.getElementById("compressBtn")?.addEventListener("click", () => {
    const quality = Number(document.getElementById("qualityRange")?.value);
    const output = document.getElementById("compressResult");
    if (!Number.isFinite(quality) || quality < 0.3 || quality > 0.95 || !ensureImageLoaded()) {
      if (output) output.textContent = "Compression status: Choose quality between 0.3 and 0.95.";
      return;
    }
    downloadWhiteBgJpg("compressed", quality);
    if (output) output.textContent = `Compression status: Download started at quality ${quality}.`;
  });

  document.getElementById("cropBtn")?.addEventListener("click", () => {
    const x = Number(document.getElementById("cropX")?.value || 0);
    const y = Number(document.getElementById("cropY")?.value || 0);
    const w = Number(document.getElementById("cropW")?.value || canvas.width);
    const h = Number(document.getElementById("cropH")?.value || canvas.height);
    if (!ensureImageLoaded() || ![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return;
    applyCanvasTransform((temp) => {
      const bx = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
      const by = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
      const bw = Math.max(1, Math.min(canvas.width - bx, Math.round(w)));
      const bh = Math.max(1, Math.min(canvas.height - by, Math.round(h)));
      temp.width = bw;
      temp.height = bh;
      temp.getContext("2d").drawImage(canvas, bx, by, bw, bh, 0, 0, bw, bh);
    }, "Crop applied.");
  });

  document.getElementById("rotateBtn")?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    applyCanvasTransform((temp) => {
      temp.width = canvas.height;
      temp.height = canvas.width;
      const tctx = temp.getContext("2d");
      tctx.translate(temp.width / 2, temp.height / 2);
      tctx.rotate(Math.PI / 2);
      tctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    }, "Rotation applied.");
  });

  document.getElementById("watermarkBtn")?.addEventListener("click", () => {
    const watermark = document.getElementById("watermarkText")?.value?.trim();
    if (!ensureImageLoaded() || !watermark) return;
    applyCanvasTransform((temp) => {
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tctx = temp.getContext("2d");
      tctx.drawImage(canvas, 0, 0);
      const fontSize = Math.max(18, Math.floor(temp.width * 0.03));
      tctx.font = `${fontSize}px Inter, Segoe UI, Arial, sans-serif`;
      tctx.textAlign = "right";
      tctx.fillStyle = "rgba(0,0,0,0.45)";
      tctx.fillText(watermark, temp.width - 18, temp.height - 18);
      tctx.fillStyle = "rgba(255,255,255,0.85)";
      tctx.fillText(watermark, temp.width - 20, temp.height - 20);
    }, "Watermark applied.");
  });

  Object.values(filterControls).forEach((control) => {
    control?.addEventListener("input", () => {
      if (!ensureImageLoaded()) return;
      renderFromBaseWithFilters();
      if (filterStatus) filterStatus.textContent = "Preview updated. Apply to commit changes.";
    });
  });

  resetFiltersBtn?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    resetFilterControlsUI();
    renderFromBaseWithFilters();
    if (filterStatus) filterStatus.textContent = "Preview reset to current committed image.";
  });

  applyFiltersBtn?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    renderFromBaseWithFilters();
    saveFilterBaseFromCurrentCanvas();
    resetFilterControlsUI();
    pushHistory("Filters committed.");
    if (filterStatus) filterStatus.textContent = "Filters applied and committed.";
  });

  document
    .getElementById("cropPresetSquare")
    ?.addEventListener("click", () => applyCropPreset(1, 1));
  document
    .getElementById("cropPresetStory")
    ?.addEventListener("click", () => applyCropPreset(9, 16));
  document
    .getElementById("cropPresetPassport")
    ?.addEventListener("click", () => applyCropPreset(35, 45));

  undoImageBtn?.addEventListener("click", () => {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    drawToMain(history[historyIndex]);
    saveFilterBaseFromCurrentCanvas();
    resetFilterControlsUI();
    syncHistoryStatus();
    if (filterStatus) filterStatus.textContent = "Undo applied.";
  });

  redoImageBtn?.addEventListener("click", () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    drawToMain(history[historyIndex]);
    saveFilterBaseFromCurrentCanvas();
    resetFilterControlsUI();
    syncHistoryStatus();
    if (filterStatus) filterStatus.textContent = "Redo applied.";
  });

  autoEnhanceBtn?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    const prev = {
      brightness: filterControls.brightness?.value || "100",
      contrast: filterControls.contrast?.value || "100",
      saturate: filterControls.saturate?.value || "100",
      grayscale: filterControls.grayscale?.value || "0",
      blur: filterControls.blur?.value || "0",
    };
    if (filterControls.brightness) filterControls.brightness.value = "108";
    if (filterControls.contrast) filterControls.contrast.value = "112";
    if (filterControls.saturate) filterControls.saturate.value = "118";
    if (filterControls.grayscale) filterControls.grayscale.value = "0";
    if (filterControls.blur) filterControls.blur.value = "0";
    renderFromBaseWithFilters();
    saveFilterBaseFromCurrentCanvas();
    pushHistory("Auto enhance applied.");
    if (filterStatus) filterStatus.textContent = "Auto Enhance applied.";
    if (filterControls.brightness) filterControls.brightness.value = prev.brightness;
    if (filterControls.contrast) filterControls.contrast.value = prev.contrast;
    if (filterControls.saturate) filterControls.saturate.value = prev.saturate;
    if (filterControls.grayscale) filterControls.grayscale.value = prev.grayscale;
    if (filterControls.blur) filterControls.blur.value = prev.blur;
    resetFilterControlsUI();
  });

  function showOriginalWhileHolding() {
    if (!originalCanvas || !ensureImageLoaded()) return;
    drawToMain(originalCanvas);
  }
  function restoreCurrentAfterCompare() {
    if (historyIndex < 0 || !history[historyIndex]) return;
    drawToMain(history[historyIndex]);
  }
  compareOriginalBtn?.addEventListener("mousedown", showOriginalWhileHolding);
  compareOriginalBtn?.addEventListener("mouseup", restoreCurrentAfterCompare);
  compareOriginalBtn?.addEventListener("mouseleave", restoreCurrentAfterCompare);
  compareOriginalBtn?.addEventListener("touchstart", (event) => {
    event.preventDefault();
    showOriginalWhileHolding();
  });
  compareOriginalBtn?.addEventListener("touchend", restoreCurrentAfterCompare);

  resetImageBtn?.addEventListener("click", () => {
    if (!originalCanvas) return;
    drawToMain(originalCanvas);
    filterBaseCanvas = cloneCanvas(originalCanvas);
    history = [cloneCanvas(originalCanvas)];
    historyIndex = 0;
    resetFilterControlsUI();
    syncHistoryStatus();
    if (filterStatus) filterStatus.textContent = "Reset to original image.";
  });

  document.getElementById("flipHBtn")?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    applyCanvasTransform((temp) => {
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tctx = temp.getContext("2d");
      tctx.translate(temp.width, 0);
      tctx.scale(-1, 1);
      tctx.drawImage(canvas, 0, 0);
    }, "Flip horizontal.");
    setEffectsStatus("Flipped horizontally.");
  });

  document.getElementById("flipVBtn")?.addEventListener("click", () => {
    if (!ensureImageLoaded()) return;
    applyCanvasTransform((temp) => {
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tctx = temp.getContext("2d");
      tctx.translate(0, temp.height);
      tctx.scale(1, -1);
      tctx.drawImage(canvas, 0, 0);
    }, "Flip vertical.");
    setEffectsStatus("Flipped vertically.");
  });

  document.getElementById("invertBtn")?.addEventListener("click", () => {
    applyPixelPass((d) => {
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
    }, "Invert applied.");
    setEffectsStatus("Colors inverted.");
  });

  document.getElementById("sepiaBtn")?.addEventListener("click", () => {
    applyPixelPass((d) => {
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
    }, "Sepia applied.");
    setEffectsStatus("Sepia tone applied.");
  });

  document.getElementById("grayscaleCommitBtn")?.addEventListener("click", () => {
    applyPixelPass((d) => {
      for (let i = 0; i < d.length; i += 4) {
        const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        d[i] = y;
        d[i + 1] = y;
        d[i + 2] = y;
      }
    }, "Grayscale applied.");
    setEffectsStatus("Committed grayscale to pixels.");
  });

  document.getElementById("hueApplyBtn")?.addEventListener("click", () => {
    const deg = Number(document.getElementById("hueRotateRange")?.value || 0);
    if (!ensureImageLoaded()) return;
    if (!deg) {
      setEffectsStatus("Set a non-zero hue angle first.");
      return;
    }
    applyCanvasTransform((temp) => {
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tctx = temp.getContext("2d");
      tctx.filter = `hue-rotate(${deg}deg)`;
      tctx.drawImage(canvas, 0, 0);
      tctx.filter = "none";
    }, "Hue rotate applied.");
    const hr = document.getElementById("hueRotateRange");
    if (hr) hr.value = "0";
    const hv = document.getElementById("hueRotateVal");
    if (hv) hv.textContent = "0°";
    setEffectsStatus(`Hue shift applied (${deg}°).`);
  });

  document.getElementById("hueResetBtn")?.addEventListener("click", () => {
    const hr = document.getElementById("hueRotateRange");
    if (hr) hr.value = "0";
    const hv = document.getElementById("hueRotateVal");
    if (hv) hv.textContent = "0°";
    setEffectsStatus("Hue slider reset.");
  });

  document.getElementById("pixelateBtn")?.addEventListener("click", () => {
    const block = Number(document.getElementById("pixelBlockRange")?.value || 8);
    applyPixelate(block);
  });

  document.getElementById("sharpenBtn")?.addEventListener("click", () => {
    applySharpenKernel();
  });

  document.getElementById("vignetteBtn")?.addEventListener("click", () => {
    applyVignetteFromSlider();
  });

  document.getElementById("grainBtn")?.addEventListener("click", () => {
    applyFilmGrain();
  });

  document.getElementById("borderBtn")?.addEventListener("click", () => {
    applyBorderFrame();
  });

  document.getElementById("roundExportBtn")?.addEventListener("click", () => {
    downloadRoundedPng();
  });

  document.getElementById("copyDataUrlBtn")?.addEventListener("click", async () => {
    if (!ensureImageLoaded()) return;
    const dataUrl = canvas.toDataURL("image/png");
    try {
      await navigator.clipboard.writeText(dataUrl);
      setExportStatus("Copied PNG data URL (large strings may be blocked by the browser).");
    } catch {
      setExportStatus("Clipboard copy failed — try a smaller image or another browser.");
    }
  });

  document.getElementById("eyedropperActivateBtn")?.addEventListener("click", () => {
    eyedropperActive = true;
    setExportStatus("Eyedropper active — click the preview canvas to sample.");
  });

  document.getElementById("copyHexBtn")?.addEventListener("click", async () => {
    const hx = document.getElementById("pickedColorHex")?.textContent?.trim();
    if (!hx) return;
    try {
      await navigator.clipboard.writeText(hx);
      setExportStatus(`Copied ${hx}`);
    } catch {
      setExportStatus("Could not copy hex.");
    }
  });

  canvas.addEventListener("click", (event) => {
    if (!eyedropperActive || !ensureImageLoaded()) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(sx)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(sy)));
    const px = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[px[0], px[1], px[2]].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    const sw = document.getElementById("pickedColorSwatch");
    const el = document.getElementById("pickedColorHex");
    if (sw) sw.style.background = hex;
    if (el) el.textContent = hex;
    eyedropperActive = false;
    setExportStatus(`Sampled ${hex}`);
  });

  document.getElementById("imageB64LoadBtn")?.addEventListener("click", async () => {
    const raw = document.getElementById("imageB64Input")?.value?.trim();
    const status = document.getElementById("imageB64Status");
    const preview = document.getElementById("imageB64Preview");
    if (!raw) {
      if (status) status.textContent = "Paste a data URL or raw base64 first.";
      return;
    }
    const dataUrl = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("jpeg")
        ? ".jpg"
        : blob.type.includes("webp")
          ? ".webp"
          : ".png";
      const file = new File([blob], `from-base64${ext}`, { type: blob.type || "image/png" });
      handleFile(file);
      if (preview) {
        preview.src = URL.createObjectURL(blob);
        preview.hidden = false;
      }
      if (status) status.textContent = "Decoded and loaded into Image Lab.";
      setStudioStatus("Loaded image from pasted Base64 / data URL.");
    } catch {
      if (status) status.textContent = "Decode failed — check prefix and padding.";
    }
  });

  document.getElementById("imageB64ClearBtn")?.addEventListener("click", () => {
    const ta = document.getElementById("imageB64Input");
    if (ta) ta.value = "";
    const preview = document.getElementById("imageB64Preview");
    if (preview) {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    const status = document.getElementById("imageB64Status");
    if (status) status.textContent = "Cleared.";
  });

  document.getElementById("imagePaletteBtn")?.addEventListener("click", () => {
    extractPalette();
  });

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoImageBtn?.click();
      }
      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoImageBtn?.click();
      }
      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        autoEnhanceBtn?.click();
      }
    }
  });
})();
