# Security Policy

## Supported Versions

Qwickton is currently maintained as a rolling release on the default branch.  
Security fixes are applied to the latest version first.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately and include:

- affected URL/page and browser
- clear reproduction steps
- expected vs actual behavior
- proof-of-concept details (if safe to share)

Do not open public issues for active security vulnerabilities.

## Security Baseline

This project currently enforces:

- strict security headers via hosting config (`netlify.toml`, `vercel.json`)
- CI dependency audit (`npm audit --omit=dev`)
- static code analysis workflow (`.github/workflows/codeql.yml`)
- no dynamic code execution in user expression handling

## Incident Handling Targets

- initial triage: within 72 hours
- mitigation plan: within 7 days
- patch + release communication: as soon as validated
