/**
 * Markup for Image Tools — load before `category-bootstrap.js` on image-tools.html.
 */
(function registerImageLabTemplates() {
  window.QwicktonImageLab = {
    mainCardHtml: `
<div class="image-lab">
  <p class="small image-lab-lead">
    Full in-browser workspace: transform, color, effects, and export — nothing is uploaded to any server.
  </p>
  <div class="image-lab-tabs-wrap">
    <div class="image-lab-tabs" role="tablist" aria-label="Image Lab sections">
      <button type="button" class="image-lab-tab is-active" data-image-tab="studio" role="tab" aria-selected="true">Studio</button>
      <button type="button" class="image-lab-tab" data-image-tab="transform" role="tab" aria-selected="false">Transform</button>
      <button type="button" class="image-lab-tab" data-image-tab="filters" role="tab" aria-selected="false">Color</button>
      <button type="button" class="image-lab-tab" data-image-tab="effects" role="tab" aria-selected="false">Effects</button>
      <button type="button" class="image-lab-tab" data-image-tab="export" role="tab" aria-selected="false">Export</button>
    </div>
  </div>

  <div class="image-lab-panels">
    <section class="image-lab-panel is-active" data-image-panel="studio" role="tabpanel">
      <div class="image-lab-split">
        <div class="image-lab-canvas-col">
          <div id="dropZone" class="drop-zone image-lab-drop" tabindex="0" role="button" aria-label="Drop image or click to browse">
            <input type="file" id="imageInput" accept="image/*" hidden />
            <p><strong>Drop image here</strong> or tap to browse</p>
            <p class="small">PNG, JPG, WebP, GIF (first frame), BMP — large files may take a moment.</p>
          </div>
          <div class="preview-wrap canvas-frame image-lab-canvas-wrap">
            <canvas id="imageCanvas" aria-label="Image preview canvas"></canvas>
          </div>
        </div>
        <aside class="image-lab-side">
          <div class="file-meta image-lab-meta">
            <div><strong>Name:</strong> <span id="metaName">-</span></div>
            <div><strong>Size:</strong> <span id="metaSize">-</span></div>
            <div><strong>Type:</strong> <span id="metaType">-</span></div>
            <div><strong>Dimensions:</strong> <span id="metaDim">-</span></div>
          </div>
          <p class="small image-lab-hint">Tip: hold <kbd>Compare</kbd> to peek at the original file.</p>
          <div id="suggestionsPanel" class="suggestions"></div>
          <div class="image-lab-actions inline-row">
            <button class="btn btn-secondary" type="button" id="undoImageBtn" disabled>Undo</button>
            <button class="btn btn-secondary" type="button" id="redoImageBtn" disabled>Redo</button>
            <button class="btn" type="button" id="compareOriginalBtn">Compare</button>
            <button class="btn btn-secondary" type="button" id="resetImageBtn">Reset to file</button>
          </div>
          <p class="small" id="historyStatus">History: —</p>
          <p class="result image-lab-status" id="imageLabStudioStatus">Load an image to begin.</p>
        </aside>
      </div>
    </section>

    <section class="image-lab-panel" data-image-panel="transform" role="tabpanel">
      <div class="image-lab-stack">
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Resize</h4>
          <div class="grid-2">
            <div>
              <label class="small" for="resizeW">Width (px)</label>
              <input id="resizeW" type="number" min="1" step="1" placeholder="Width" />
            </div>
            <div>
              <label class="small" for="resizeH">Height (px)</label>
              <input id="resizeH" type="number" min="1" step="1" placeholder="Height" />
            </div>
          </div>
          <div class="inline-row image-lab-presets">
            <button class="btn btn-secondary" type="button" id="resizePreset1080">1080²</button>
            <button class="btn btn-secondary" type="button" id="resizePresetStory">1080×1920</button>
            <button class="btn btn-secondary" type="button" id="resizePresetThumb">1280×720</button>
            <button class="btn" type="button" id="resizeBtn">Apply resize</button>
          </div>
          <p class="small" id="resizeResult">Resize status: —</p>
        </div>

        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Crop</h4>
          <div class="grid-2">
            <div>
              <label class="small" for="cropX">X</label>
              <input id="cropX" type="number" min="0" step="1" value="0" />
            </div>
            <div>
              <label class="small" for="cropY">Y</label>
              <input id="cropY" type="number" min="0" step="1" value="0" />
            </div>
            <div>
              <label class="small" for="cropW">Width</label>
              <input id="cropW" type="number" min="1" step="1" />
            </div>
            <div>
              <label class="small" for="cropH">Height</label>
              <input id="cropH" type="number" min="1" step="1" />
            </div>
          </div>
          <div class="inline-row">
            <button class="btn btn-secondary" type="button" id="cropPresetSquare">1:1</button>
            <button class="btn btn-secondary" type="button" id="cropPresetStory">9:16</button>
            <button class="btn btn-secondary" type="button" id="cropPresetPassport">35:45</button>
            <button class="btn" type="button" id="cropBtn">Apply crop</button>
          </div>
        </div>

        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Orientation & watermark</h4>
          <div class="inline-row">
            <button class="btn" type="button" id="rotateBtn">Rotate 90°</button>
            <button class="btn btn-secondary" type="button" id="flipHBtn">Flip H</button>
            <button class="btn btn-secondary" type="button" id="flipVBtn">Flip V</button>
          </div>
          <label class="small" for="watermarkText">Watermark text</label>
          <input id="watermarkText" type="text" placeholder="© Your Name" />
          <button class="btn" type="button" id="watermarkBtn">Apply watermark</button>
        </div>
      </div>
    </section>

    <section class="image-lab-panel" data-image-panel="filters" role="tabpanel">
      <div class="image-lab-stack">
        <div class="image-lab-slider-grid">
          <div>
            <label class="small" for="filterBrightness">Brightness <span id="filterBrightnessVal">100%</span></label>
            <input id="filterBrightness" type="range" min="0" max="200" value="100" />
          </div>
          <div>
            <label class="small" for="filterContrast">Contrast <span id="filterContrastVal">100%</span></label>
            <input id="filterContrast" type="range" min="0" max="200" value="100" />
          </div>
          <div>
            <label class="small" for="filterSaturate">Saturation <span id="filterSaturateVal">100%</span></label>
            <input id="filterSaturate" type="range" min="0" max="200" value="100" />
          </div>
          <div>
            <label class="small" for="filterGrayscale">Grayscale <span id="filterGrayscaleVal">0%</span></label>
            <input id="filterGrayscale" type="range" min="0" max="100" value="0" />
          </div>
          <div>
            <label class="small" for="filterBlur">Blur <span id="filterBlurVal">0px</span></label>
            <input id="filterBlur" type="range" min="0" max="12" value="0" />
          </div>
        </div>
        <div class="inline-row">
          <button class="btn btn-secondary" type="button" id="resetFiltersBtn">Reset sliders</button>
          <button class="btn" type="button" id="applyFiltersBtn">Commit filters</button>
          <button class="btn" type="button" id="autoEnhanceBtn">Auto enhance</button>
        </div>
        <p class="result" id="filterStatus">Adjust sliders for live preview, then Commit to bake into history.</p>
      </div>
    </section>

    <section class="image-lab-panel" data-image-panel="effects" role="tabpanel">
      <div class="image-lab-stack">
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">One-tap looks</h4>
          <div class="inline-row">
            <button class="btn btn-secondary" type="button" id="invertBtn">Invert</button>
            <button class="btn btn-secondary" type="button" id="sepiaBtn">Sepia</button>
            <button class="btn btn-secondary" type="button" id="grayscaleCommitBtn">B&amp;W</button>
          </div>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Hue &amp; stylize</h4>
          <label class="small" for="hueRotateRange">Hue rotate <span id="hueRotateVal">0°</span></label>
          <input id="hueRotateRange" type="range" min="-180" max="180" value="0" />
          <div class="inline-row">
            <button class="btn" type="button" id="hueApplyBtn">Apply hue</button>
            <button class="btn btn-secondary" type="button" id="hueResetBtn">Reset hue slider</button>
          </div>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Pixelate &amp; sharpen</h4>
          <label class="small" for="pixelBlockRange">Pixel block size <span id="pixelBlockVal">8</span>px</label>
          <input id="pixelBlockRange" type="range" min="2" max="48" value="8" step="1" />
          <div class="inline-row">
            <button class="btn" type="button" id="pixelateBtn">Apply pixelate</button>
            <button class="btn" type="button" id="sharpenBtn">Sharpen</button>
          </div>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Vignette &amp; grain</h4>
          <label class="small" for="vignetteRange">Vignette <span id="vignetteVal">0</span>%</label>
          <input id="vignetteRange" type="range" min="0" max="90" value="0" />
          <label class="small" for="noiseRange">Film grain <span id="noiseVal">0</span>%</label>
          <input id="noiseRange" type="range" min="0" max="40" value="0" />
          <div class="inline-row">
            <button class="btn" type="button" id="vignetteBtn">Apply vignette</button>
            <button class="btn" type="button" id="grainBtn">Apply grain</button>
          </div>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Border</h4>
          <div class="grid-2">
            <div>
              <label class="small" for="borderWidthInput">Width (px)</label>
              <input id="borderWidthInput" type="number" min="0" max="120" value="8" />
            </div>
            <div>
              <label class="small" for="borderColorInput">Color</label>
              <input id="borderColorInput" type="color" value="#ffffff" />
            </div>
          </div>
          <button class="btn" type="button" id="borderBtn">Apply border</button>
        </div>
        <p class="result" id="effectsStatus">Effects stack on the current canvas — use Undo if needed.</p>
      </div>
    </section>

    <section class="image-lab-panel" data-image-panel="export" role="tabpanel">
      <div class="image-lab-stack">
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Formats</h4>
          <div class="inline-row">
            <button class="btn" type="button" id="downloadPngBtn">PNG</button>
            <button class="btn" type="button" id="downloadJpgBtn">JPG</button>
            <button class="btn" type="button" id="downloadWebpBtn">WebP</button>
            <button class="btn btn-secondary" type="button" id="copyDataUrlBtn">Copy data URL</button>
          </div>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">JPEG quality</h4>
          <label class="small" for="qualityRange">Quality <span id="qualityVal">0.92</span></label>
          <input id="qualityRange" type="range" min="0.3" max="0.95" step="0.01" value="0.92" />
          <button class="btn" type="button" id="compressBtn">Download JPEG at quality</button>
          <p class="small" id="compressResult">Compression status: —</p>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Rounded PNG export</h4>
          <label class="small" for="roundRadiusInput">Corner radius (px)</label>
          <input id="roundRadiusInput" type="number" min="0" max="400" value="24" />
          <button class="btn" type="button" id="roundExportBtn">Download rounded PNG</button>
          <p class="small">Transparency outside the rounded rect is cleared — best for logos and avatars.</p>
        </div>
        <div class="image-lab-fieldset">
          <h4 class="image-lab-sub">Eyedropper</h4>
          <p class="small">Click the preview canvas in Studio while this tab is open, or use the picker below after loading an image.</p>
          <div class="image-lab-eyedrop inline-row">
            <button class="btn btn-secondary" type="button" id="eyedropperActivateBtn">Pick from canvas</button>
            <span class="image-lab-swatch" id="pickedColorSwatch" aria-label="Picked color"></span>
            <code id="pickedColorHex" class="image-lab-hex">#000000</code>
            <button class="btn btn-secondary" type="button" id="copyHexBtn">Copy hex</button>
          </div>
        </div>
        <p class="result" id="exportStatus">Ready when an image is loaded.</p>
      </div>
    </section>
  </div>
</div>
`,

    utilCardHtml: `
<div class="image-lab-util">
  <h4 class="image-lab-sub">Data URL &amp; Base64</h4>
  <p class="small">Paste a data URL or raw Base64 (with or without <code>data:image/...</code> prefix). Preview is local only.</p>
  <textarea id="imageB64Input" class="image-lab-textarea" rows="4" placeholder="data:image/png;base64,..."></textarea>
  <div class="inline-row">
    <button class="btn" type="button" id="imageB64LoadBtn">Load into studio</button>
    <button class="btn btn-secondary" type="button" id="imageB64ClearBtn">Clear</button>
  </div>
  <div class="preview-wrap image-lab-b64-preview">
    <img id="imageB64Preview" alt="Base64 preview" hidden />
  </div>
  <p class="small" id="imageB64Status">No data loaded.</p>

  <h4 class="image-lab-sub" style="margin-top:1rem">Quick palette from image</h4>
  <p class="small">After loading an image in Image Lab, extract a coarse palette (client-side).</p>
  <button class="btn btn-secondary" type="button" id="imagePaletteBtn">Extract 8 colors</button>
  <div id="imagePaletteOut" class="image-lab-palette"></div>
</div>
`,
  };
})();
