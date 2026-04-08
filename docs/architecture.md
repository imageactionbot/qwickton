# Qwickton Architecture

## Runtime Model

- Django serves SEO pages and route shells.
- Frontend app performs all file processing in browser.
- Web workers isolate CPU-heavy operations.
- WASM module provides optimized utility functions.

## Privacy Guarantees

- No backend file upload endpoints.
- Analytics endpoint accepts only metadata.
- Browser-local recent tool state only.

## Scalability

- Stateless backend suitable for horizontal scaling.
- Static frontend assets can be CDN-cached.
- Client-side processing minimizes infra bandwidth and storage.
