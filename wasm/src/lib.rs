use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn estimate_compression_ratio(original_bytes: usize, quality: f32) -> f32 {
    let safe_quality = quality.clamp(0.1, 1.0);
    let base = (original_bytes as f32 / 1024.0).max(1.0);
    (base * safe_quality) / base
}
