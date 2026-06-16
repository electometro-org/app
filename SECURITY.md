# Security Policy

Electómetro handles voter-submitted survey responses and runs anti-fraud controls, so we take
security seriously. This document explains which versions are supported, how to report
vulnerabilities, our disclosure process, and security expectations for contributors.

---

## Supported versions

The project is pre-1.0 and ships from `main`. Only the latest release line receives security fixes.

| Version | Supported |
| --- | --- |
| `0.2.x` (current) | ✅ |
| `< 0.2` | ❌ |

> The current version is defined in [`package.json`](package.json) (`version`).

---

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Report privately using one of:

1. **GitHub Security Advisories** — open a private advisory via the repository's *Security → Report a
   vulnerability* tab (preferred).
2. **Email** — `security@electometro.org` <!-- TODO: confirm/replace with the real security contact -->

When reporting, please include:
- a description of the vulnerability and its impact,
- steps to reproduce (proof of concept if possible),
- affected component(s) and version/commit,
- any suggested remediation.

### Response targets

| Stage | Target |
| --- | --- |
| Acknowledgement | within 5 business days |
| Initial assessment | within 10 business days |
| Fix / mitigation plan | communicated after assessment |

(These are best-effort targets for a volunteer-maintained project.)

---

## Disclosure policy

We follow **coordinated disclosure**:

1. You report privately.
2. We confirm, assess severity, and develop a fix.
3. We agree on a disclosure timeline with you (default target: within 90 days of the report, sooner
   for actively exploited issues).
4. We release the fix and publish an advisory crediting the reporter (unless you prefer to remain
   anonymous).

Please give us reasonable time to remediate before any public disclosure.

---

## Security architecture (for context)

The following controls exist today and are areas where security reports are especially relevant:

- **CAPTCHA:** Cloudflare Turnstile gates submissions, with an hCaptcha fallback for browsers that
  cannot run Turnstile (`src/components/TurnstileOverlay.jsx`, `src/services/submissionService.js`).
- **Device fingerprinting:** via `fpscanner` / FingerprintJS to deter automated mass submissions.
- **Honeypot:** a hidden `#website-url` field; non-empty values short-circuit submission
  (`src/App.jsx`, `src/contexts/QuizContext.jsx`).
- **Database hardening:** Supabase Row-Level Security, a restrictive insert policy, check constraints,
  and validation triggers (vote ∈ [0,1], weight ∈ [1,3], ≤ 100 questions, payload-size limits) — see
  [`db/migration.sql`](db/migration.sql) and [`db/security.sql`](db/security.sql).
- **Consent-gated analytics:** analytics events are only sent when the user consents
  (`src/utils/analytics.js`).
- **Content Security Policy:** configured in the deployed `index.html` (template:
  `index.html.example`).

---

## Security best practices for contributors

- **Never commit secrets.** No API keys, tokens, or credentials in source, config, or CI files. Use
  environment variables and platform secret stores (Cloudflare/Vercel/Supabase). If Vercel deployment
  config is reintroduced, keep build keys out of `vercel.json` and inject them as secrets.
- **Keep client/server trust boundaries clear.** The frontend is untrusted input from the server's
  perspective — never rely on client-side checks alone. Validate on the Worker and in the database
  (the DB triggers in `db/security.sql` are the last line of defense; keep them strict).
- **Respect user privacy and consent.** Don't add tracking that bypasses the consent gate. Minimize
  collected demographics; keep payload-size limits.
- **i18n keys, not PII.** Don't log or transmit personal data in analytics events.
- **Validate new data formats.** When extending the vote/response schema, update both the Worker
  validation and the database constraints/triggers.
- **Dependencies.** Prefer well-maintained packages; run `npm audit` and remove unused dependencies.
- **CAPTCHA & fingerprint changes** are security-sensitive — flag them explicitly in your PR so they
  get extra review.

Thank you for helping keep Electómetro and its users safe.
