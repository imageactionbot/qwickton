(function initPassportTool() {
  const fileInput = document.getElementById("passportFileInput");
  const editorCanvas = document.getElementById("editorCanvas");
  const previewCanvas = document.getElementById("passportPreview");
  const editorCtx = editorCanvas.getContext("2d");
  const previewCtx = previewCanvas.getContext("2d");

  if (!fileInput || !editorCanvas || !previewCanvas || !editorCtx || !previewCtx) return;

  const presetSelect = document.getElementById("countryPreset");
  const customWInput = document.getElementById("customW");
  const customHInput = document.getElementById("customH");
  const outputMeta = document.getElementById("passportOutputMeta");

  const cropPosX = document.getElementById("cropPosX");
  const cropPosY = document.getElementById("cropPosY");
  const cropScale = document.getElementById("cropScale");
  const zoomScale = document.getElementById("zoomScale");
  const whiteBoostInput = document.getElementById("whiteBoost");
  const passportDpi = document.getElementById("passportDpi");
  const sheetCount = document.getElementById("sheetCount");
  const historyStatus = document.getElementById("passportHistoryStatus");

  let sourceImage = null;
  let outputSizeMm = { w: 35, h: 45 };
  let cropBox = { x: 0, y: 0, w: 100, h: 120 };
  let drawImageRect = { x: 0, y: 0, w: 100, h: 100 };
  let isDragging = false;
  let history = [];
  let historyIndex = -1;

  function mmToPx(mm, dpi = 300) {
    return Math.max(1, Math.round((mm / 25.4) * dpi));
  }

  function parsePreset(value) {
    const [w, h] = value.split("x").map(Number);
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
    return { w, h };
  }

  function syncOutputMeta() {
    outputMeta.textContent = `Output: ${outputSizeMm.w} x ${outputSizeMm.h} mm`;
  }

  function pushHistory() {
    const state = {
      cropX: Number(cropPosX.value),
      cropY: Number(cropPosY.value),
      cropScale: Number(cropScale.value),
      zoomScale: Number(zoomScale?.value || 100),
      whiteBoost: Number(whiteBoostInput.value),
    };
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    historyIndex = history.length - 1;
    if (history.length > 40) {
      history = history.slice(history.length - 40);
      historyIndex = history.length - 1;
    }
    if (historyStatus)
      historyStatus.textContent = `Editor status: ${historyIndex + 1}/${history.length} states`;
  }

  function restoreHistoryState(state) {
    cropPosX.value = String(state.cropX);
    cropPosY.value = String(state.cropY);
    cropScale.value = String(state.cropScale);
    if (zoomScale) zoomScale.value = String(state.zoomScale);
    whiteBoostInput.value = String(state.whiteBoost);
    drawEditorView();
    renderPassportPreview();
    if (historyStatus)
      historyStatus.textContent = `Editor status: ${historyIndex + 1}/${history.length} states`;
  }

  function fitImageToEditor(img) {
    const maxW = 900;
    const maxH = 600;
    const fitRatio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    editorCanvas.width = Math.round(img.naturalWidth * fitRatio);
    editorCanvas.height = Math.round(img.naturalHeight * fitRatio);
    const zoom = Math.max(0.6, Math.min(2.2, Number(zoomScale?.value || 100) / 100));
    const drawnW = Math.round(editorCanvas.width * zoom);
    const drawnH = Math.round(editorCanvas.height * zoom);
    drawImageRect = {
      w: drawnW,
      h: drawnH,
      x: Math.round((editorCanvas.width - drawnW) / 2),
      y: Math.round((editorCanvas.height - drawnH) / 2),
    };
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    editorCtx.drawImage(img, drawImageRect.x, drawImageRect.y, drawImageRect.w, drawImageRect.h);
  }

  function setCropFromControls() {
    const centerXPercent = Math.min(100, Math.max(0, Number(cropPosX.value) || 50));
    const centerYPercent = Math.min(100, Math.max(0, Number(cropPosY.value) || 42));
    const scalePercent = Math.min(100, Math.max(30, Number(cropScale.value) || 78));
    const targetRatio = outputSizeMm.w / outputSizeMm.h;

    const baseHeight = editorCanvas.height * (scalePercent / 100);
    const baseWidth = baseHeight * targetRatio;
    const finalWidth = Math.min(baseWidth, editorCanvas.width * 0.95);
    const finalHeight = finalWidth / targetRatio;
    const centerX = (centerXPercent / 100) * editorCanvas.width;
    const centerY = (centerYPercent / 100) * editorCanvas.height;

    cropBox = {
      w: finalWidth,
      h: finalHeight,
      x: Math.min(Math.max(0, centerX - finalWidth / 2), editorCanvas.width - finalWidth),
      y: Math.min(Math.max(0, centerY - finalHeight / 2), editorCanvas.height - finalHeight),
    };
  }

  function drawEditorView() {
    if (!sourceImage) return;
    fitImageToEditor(sourceImage);
    setCropFromControls();
    editorCtx.fillStyle = "rgba(2, 6, 23, 0.28)";
    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
    editorCtx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    editorCtx.drawImage(
      sourceImage,
      0,
      0,
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
      drawImageRect.x,
      drawImageRect.y,
      drawImageRect.w,
      drawImageRect.h
    );
    editorCtx.strokeStyle = "#06b6d4";
    editorCtx.lineWidth = 3;
    editorCtx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    editorCtx.fillStyle = "rgba(6, 182, 212, 0.12)";
    editorCtx.fillRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    // Rule-of-thirds guides for better face alignment.
    editorCtx.strokeStyle = "rgba(6, 182, 212, 0.55)";
    editorCtx.lineWidth = 1;
    editorCtx.beginPath();
    editorCtx.moveTo(cropBox.x + cropBox.w / 3, cropBox.y);
    editorCtx.lineTo(cropBox.x + cropBox.w / 3, cropBox.y + cropBox.h);
    editorCtx.moveTo(cropBox.x + (cropBox.w * 2) / 3, cropBox.y);
    editorCtx.lineTo(cropBox.x + (cropBox.w * 2) / 3, cropBox.y + cropBox.h);
    editorCtx.moveTo(cropBox.x, cropBox.y + cropBox.h / 3);
    editorCtx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h / 3);
    editorCtx.moveTo(cropBox.x, cropBox.y + (cropBox.h * 2) / 3);
    editorCtx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h * 2) / 3);
    editorCtx.stroke();
  }

  function boostBackgroundWhites(ctx, width, height, boost) {
    if (boost <= 0) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg > 170 - boost) {
        data[i] = Math.min(255, data[i] + boost);
        data[i + 1] = Math.min(255, data[i + 1] + boost);
        data[i + 2] = Math.min(255, data[i + 2] + boost);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function renderPassportPreview() {
    if (!sourceImage) return;
    setCropFromControls();
    const dpi = Number(passportDpi?.value || 300);
    const outW = mmToPx(outputSizeMm.w, dpi);
    const outH = mmToPx(outputSizeMm.h, dpi);
    previewCanvas.width = outW;
    previewCanvas.height = outH;

    previewCtx.fillStyle = "#ffffff";
    previewCtx.fillRect(0, 0, outW, outH);
    previewCtx.drawImage(
      editorCanvas,
      cropBox.x,
      cropBox.y,
      cropBox.w,
      cropBox.h,
      0,
      0,
      outW,
      outH
    );

    const whiteBoost = Math.min(80, Math.max(0, Number(whiteBoostInput.value) || 0));
    boostBackgroundWhites(previewCtx, outW, outH, whiteBoost);
    outputMeta.textContent = `Output: ${outputSizeMm.w} x ${outputSizeMm.h} mm @ ${dpi} DPI (${outW}x${outH}px)`;
  }

  function nudgeCrop(dx, dy) {
    const currentX = Number(cropPosX.value) || 50;
    const currentY = Number(cropPosY.value) || 42;
    cropPosX.value = String(Math.max(0, Math.min(100, currentX + dx)));
    cropPosY.value = String(Math.max(0, Math.min(100, currentY + dy)));
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  }

  fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      drawEditorView();
      renderPassportPreview();
      history = [];
      historyIndex = -1;
      pushHistory();
    };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById("autoCenterBtn")?.addEventListener("click", () => {
    cropPosX.value = "50";
    cropPosY.value = "40";
    cropScale.value = "78";
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  });

  document.getElementById("applyCropBtn")?.addEventListener("click", () => {
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  });

  presetSelect?.addEventListener("change", () => {
    const preset = parsePreset(presetSelect.value);
    if (!preset) return;
    outputSizeMm = preset;
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  });

  document.getElementById("useCustomBtn")?.addEventListener("click", () => {
    const w = Number(customWInput.value);
    const h = Number(customHInput.value);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    outputSizeMm = { w, h };
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  });

  document.getElementById("renderPassportBtn")?.addEventListener("click", renderPassportPreview);
  whiteBoostInput?.addEventListener("input", () => {
    renderPassportPreview();
    pushHistory();
  });
  passportDpi?.addEventListener("change", renderPassportPreview);

  ["cropPosX", "cropPosY", "cropScale", "zoomScale"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      drawEditorView();
      renderPassportPreview();
    });
  });

  editorCanvas.addEventListener("mousedown", (event) => {
    if (!sourceImage) return;
    isDragging = true;
    const rect = editorCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * editorCanvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * editorCanvas.height;
    cropPosX.value = String(Math.round((x / editorCanvas.width) * 100));
    cropPosY.value = String(Math.round((y / editorCanvas.height) * 100));
    drawEditorView();
    renderPassportPreview();
  });
  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    pushHistory();
  });
  editorCanvas.addEventListener("mousemove", (event) => {
    if (!isDragging || !sourceImage) return;
    const rect = editorCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * editorCanvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * editorCanvas.height;
    cropPosX.value = String(Math.round(Math.min(100, Math.max(0, (x / editorCanvas.width) * 100))));
    cropPosY.value = String(
      Math.round(Math.min(100, Math.max(0, (y / editorCanvas.height) * 100)))
    );
    drawEditorView();
    renderPassportPreview();
  });

  document.getElementById("downloadPassportBtn")?.addEventListener("click", () => {
    if (!sourceImage) return;
    previewCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qwickton-passport-${outputSizeMm.w}x${outputSizeMm.h}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.95
    );
  });
  document.getElementById("downloadPassportPngBtn")?.addEventListener("click", () => {
    if (!sourceImage) return;
    previewCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qwickton-passport-${outputSizeMm.w}x${outputSizeMm.h}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  });

  document.getElementById("downloadSheetBtn")?.addEventListener("click", () => {
    if (!sourceImage || !previewCanvas.width || !previewCanvas.height) return;
    const copies = Math.max(1, Math.min(12, Number(sheetCount?.value || 4)));
    const cols = copies <= 2 ? copies : copies <= 4 ? 2 : 3;
    const rows = Math.ceil(copies / cols);
    const gap = 24;
    const margin = 36;
    const sheet = document.createElement("canvas");
    sheet.width = margin * 2 + cols * previewCanvas.width + (cols - 1) * gap;
    sheet.height = margin * 2 + rows * previewCanvas.height + (rows - 1) * gap;
    const sctx = sheet.getContext("2d");
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, sheet.width, sheet.height);

    for (let i = 0; i < copies; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (previewCanvas.width + gap);
      const y = margin + row * (previewCanvas.height + gap);
      sctx.drawImage(previewCanvas, x, y);
      sctx.strokeStyle = "#d1d5db";
      sctx.strokeRect(x, y, previewCanvas.width, previewCanvas.height);
    }

    sheet.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qwickton-passport-sheet-${copies}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.95
    );
  });

  document.getElementById("undoPassportBtn")?.addEventListener("click", () => {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    restoreHistoryState(history[historyIndex]);
  });
  document.getElementById("redoPassportBtn")?.addEventListener("click", () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreHistoryState(history[historyIndex]);
  });
  document.getElementById("resetPassportBtn")?.addEventListener("click", () => {
    cropPosX.value = "50";
    cropPosY.value = "42";
    cropScale.value = "78";
    if (zoomScale) zoomScale.value = "100";
    whiteBoostInput.value = "18";
    drawEditorView();
    renderPassportPreview();
    pushHistory();
  });

  document.getElementById("nudgeUpBtn")?.addEventListener("click", () => nudgeCrop(0, -1));
  document.getElementById("nudgeDownBtn")?.addEventListener("click", () => nudgeCrop(0, 1));
  document.getElementById("nudgeLeftBtn")?.addEventListener("click", () => nudgeCrop(-1, 0));
  document.getElementById("nudgeRightBtn")?.addEventListener("click", () => nudgeCrop(1, 0));

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      nudgeCrop(0, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      nudgeCrop(0, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeCrop(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeCrop(1, 0);
    }
  });

  syncOutputMeta();
})();
