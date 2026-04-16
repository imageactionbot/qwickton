# Qwickton

Smart Tools. Zero Upload. 100% Private.

Frontend-only SaaS tools platform built with:

- HTML
- CSS
- Vanilla JavaScript

## Project Structure

- `index.html`
- `categories/`
- `css/`
- `js/`
- `assets/icons/`
- `tests/`

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Start local server

```bash
npm run serve
```

Then open `http://localhost:4173`.

## Quality Checks

```bash
npm run lint
npm run format:check
npm test
```

Production consistency checks are included in `npm test` and validate:

- category pages include shared app shell script
- service worker precache includes all category pages
- deployment config contains baseline security headers
- each HTML page has essential SEO metadata and shared runtime inclusion

To auto-fix formatting/lint where possible:

```bash
npm run lint:fix
npm run format
```

## Fully Built Categories

- `categories/daily-tools.html`
- `categories/image-tools.html`
- `categories/passport-photo-maker.html`

## Reusable Template for Remaining Categories

- `categories/template-category.html`

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs:

- dependency audit (`npm audit --omit=dev`)
- lint
- format check
- smoke tests

Additional security analysis workflow:

- `.github/workflows/codeql.yml` (GitHub CodeQL for JavaScript)

## Deployment

Automated deploy workflow is available at `.github/workflows/deploy.yml` for GitHub Pages.

- Triggered on push to `main` (and manually via workflow_dispatch).
- Publishes the full static site artifact.

If deploying on Netlify, hardened security headers are configured in `netlify.toml`.
If deploying on Vercel, matching security headers are configured in `vercel.json`.
Custom `404.html` is included for resilient routing/user recovery.

## Production Hardening Included

- CSP and security headers (Netlify config)
- Runtime browser error logging (stored locally for diagnostics)
- Safer calculator expression evaluation (no dynamic `Function` execution)
- CI dependency security audit
- Dependabot automation (`.github/dependabot.yml`)
- Deploy portability with security headers for both Netlify and Vercel
- CodeQL static security scanning workflow
- Dedicated vulnerability disclosure guidance in `SECURITY.md`
- Page-wide upgrades via shared runtime (`js/app.js`) for SEO, accessibility, and media defaults
- Production-safe `404.html` plus service-worker precache coverage for fallback assets

## PWA

PWA config files:

- `manifest.webmanifest`
- `sw.js`

App icon is available at `assets/icons/icon.svg`.
