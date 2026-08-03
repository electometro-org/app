# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses Conventional Commit-style change descriptions.

## [Unreleased]

### Added

- Open-source governance documentation: contributing guide, security policy, architecture notes,
  roadmap, conventions, code of conduct, and ADRs.
- Subsystem deep-dive docs ported from the legacy docs branch and re-verified against this
  branch's refactored layout: Elections (config reference, rounds, adding an election), Widgets
  (grid/docking/persistence), Backgrounds, and a Development guide (build pipeline internals,
  dev-only env vars). Stale README claims fixed along the way (tests FAQ, contexts description).

### Changed

- Reference documentation moved from tracked markdown to
  [GitHub Discussions → Docs](https://github.com/electometro-org/app/discussions/categories/docs):
  Architecture, Conventions, Submodules, Elections System, Widget System, Background System, and
  the Development Guide. In-repo docs are now README, CONTRIBUTING, SECURITY, AGENTS,
  `docs/TEST_SUMMARY.md`, and the ADRs; all cross-references updated. The CONTRIBUTING lockstep
  rule now distinguishes in-repo docs (same PR) from discussion docs (at merge time).

- CONTRIBUTING (EN + ES): added documentation-maintenance rules (lockstep: interface changes update
  their doc in the same PR; altitude: docs describe structure/contracts, not volatile detail);
  updated testing expectations to reflect the existing Vitest suite (`npm test` required, new pure
  logic ships with tests); topic branches and PRs now target `v1` (`main` is legacy). Reviewer
  checklist now includes docs-in-lockstep. Fixed stale test-file paths in `docs/TEST_SUMMARY.md`.
- README is now English canonical, with Spanish documentation linked under `docs/es/`.
- Project license changed to Apache-2.0 in `LICENSE`, `package.json`, and `package-lock.json`.
- Architecture refactor: decomposed `QuizContext` into eight focused hooks; normalized file naming and
  folders per `docs/CONVENTIONS.md` (PascalCase components, `hooks/`/`utils/`/`config/`) and removed the
  duplicate quiz hook and loose root modules.
- Build simplified to a single platform (Cloudflare); removed the multi-target (`DEPLOY_TARGET`) build
  matrix and Vercel/microfrontends configuration.

### Removed

- `ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/SUBMODULES.md`, `docs/ELECTIONS.md`,
  `docs/WIDGETS.md`, `docs/BACKGROUNDS.md`, `docs/DEVELOPMENT.md` — content now lives in the
  Docs discussions (see Changed).

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
