# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses Conventional Commit-style change descriptions.

## [Unreleased]

### Added

- Open-source governance documentation: contributing guide, security policy, architecture notes,
  roadmap, conventions, code of conduct, and ADRs.
- React error boundaries: an app-level boundary with a translated retry fallback, plus a
  results-scoped boundary that preserves quiz answers and offers "back to survey"
  (`src/components/ErrorBoundary.jsx`).
- Accessibility floor: `eslint-plugin-jsx-a11y` (recommended rules as warnings) and a first
  static audit with findings and next steps in `docs/A11Y_AUDIT.md`.

### Fixed

- Tracked `public` symlink pointed at a nonexistent `external/assets/` path; now points at
  `external/peru-assets/app/public` (matching `i18n`).
- ESLint no longer sweeps the `external/` submodules (their apps have their own lint setups);
  removed an unused import that made `npm run lint` fail.

### Security

- Removed unused runtime dependencies (`express`, `mongoose`, `cors`, `body-parser`, `dotenv`).
- Cleared the `fpscanner → javascript-obfuscator` transitive advisories via scoped npm
  `overrides`: `undici@^7.29.0` (under `@vercel/blob`), plus `brace-expansion`, `minimatch`,
  and `fast-uri` patch pins (under `fpscanner`). Production `npm audit` drops from 11 to 2
  advisories.
- Updated `react-router-dom` to 7.18.2. The 2 remaining high advisories target React Router's
  RSC/server features (turbo-stream deserialization, server redirect handling), which this
  client-only `HashRouter` SPA does not use; a real fix requires migrating to `react-router`
  v8 (no fixed `react-router-dom` release exists) — tracked as follow-up work.

### Changed

- README is now English canonical, with Spanish documentation linked under `docs/es/`.
- Project license changed to Apache-2.0 in `LICENSE`, `package.json`, and `package-lock.json`.
- Architecture refactor: decomposed `QuizContext` into eight focused hooks; normalized file naming and
  folders per `docs/CONVENTIONS.md` (PascalCase components, `hooks/`/`utils/`/`config/`) and removed the
  duplicate quiz hook and loose root modules.
- Build simplified to a single platform (Cloudflare); removed the multi-target (`DEPLOY_TARGET`) build
  matrix and Vercel/microfrontends configuration.

## [0.2.1]

### Added

- Multi-round election support, including second-round flows.
- Tolgee-based internationalization with Spanish and Quechua language wiring.
- R2-backed translation/data asset support.
- Dynamic background system.
- Widget registry and draggable widget layout.
- Shareable mnemonic result URLs.

### Security

- Turnstile CAPTCHA submission gate with hCaptcha fallback for older browsers.
- FingerprintJS/`fpscanner` integration.
- Honeypot submission guard.
- Supabase Row-Level Security, validation constraints, and triggers in `db/`.
