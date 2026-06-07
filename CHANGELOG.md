# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses Conventional Commit-style change descriptions.

## [Unreleased]

### Added

- Open-source governance documentation: contributing guide, security policy, architecture notes,
  roadmap, conventions, code of conduct, and ADRs.

### Changed

- README is now English canonical, with Spanish documentation linked under `docs/es/`.
- Project license changed to Apache-2.0 in `LICENSE`, `package.json`, and `package-lock.json`.

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
