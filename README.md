# Qwickton

Privacy-first, AI-powered online tools platform for PDFs, images, and passport photos.

## Monorepo Structure

- `backend/` Django SSR shell, SEO pages, and lightweight analytics endpoint
- `frontend/` TypeScript web app with client-side processing pipelines
- `wasm/` Rust WebAssembly helpers for heavy processing
- `docs/` architecture and content planning

## Privacy Principles

- Files are processed in-browser.
- No permanent server-side file storage.
- Analytics events exclude file payloads and PII.

## Quick Start

### Backend

1. Create and activate a Python environment.
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Run:
   - `python backend/manage.py migrate`
   - `python backend/manage.py runserver`

### Frontend

1. Install dependencies:
   - `cd frontend && npm install`
2. Start dev server:
   - `npm run dev`

### WASM

1. Install Rust and `wasm-pack`.
2. Build package:
   - `cd wasm && wasm-pack build --target web`
