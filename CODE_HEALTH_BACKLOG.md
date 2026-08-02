# Code Health Backlog

> Companion to [COMPAT_AUDIT.md](COMPAT_AUDIT.md), which deliberately covers **only**
> compat hacks and mobile visual-effect debt. This document tracks the debt that falls
> outside that frame. Each item is written to be lifted into a GitHub issue as-is.
> Verified against `main` on 2026-07-02.

## 1. No test suite ⚠️ highest-impact gap

**Problem.** There is no test file and no test framework anywhere in the project
(no vitest/jest/testing-library in `package.json`, zero `*.test.*` files). For an app whose
core job is computing vote-alignment results for real voters, the scoring engine is entirely
unverified by automation.

**Why it matters.** A regression in `resultsService.js` (weighting, polarity inversion,
imputed-neutral exclusion, round filtering) would silently produce wrong political
recommendations — the worst possible failure mode for this tool — and nothing would catch it.

**Suggested first step.** Add vitest + a first suite over the pure functions, which need no
DOM or mocking:
- `src/services/resultsService.js` — `computeResultsFrom`, `isImputedNeutral`,
  `partitionByCompared`, round filters (fixtures: a small compact-format and legacy-format JSON)
- `src/utils/mnemonicCodec.js` — encode/decode round-trip, version suffix, invalid input
- `src/utils/versionUtils.js` — `parseVersion` / `compareVersions`
- `src/constants/answerMappings.js` — `normalizeAnswer` / `applyPolarity`

Effort: small (half a day for the harness + first ~30 assertions). Roadmap already
acknowledges the gap; this makes it concrete.

## 2. No error boundary

**Problem.** Zero React error boundaries in `src/` (no `ErrorBoundary`, `componentDidCatch`,
or `getDerivedStateFromError` anywhere). One uncaught render exception — most plausibly in the
2,663-line, 37-`useState` `ResultsView.jsx`, or from malformed vote-data JSON — white-screens
the entire app mid-quiz with no recovery path.

**Suggested first step.** One top-level boundary inside `main.jsx` (below the Tolgee provider
so the fallback can still be translated) with a "something went wrong — restart" fallback that
calls the existing `handleReset` / reloads. Optionally a second boundary around `ResultsView`
specifically, preserving quiz answers so users can retry results without redoing the quiz.

Effort: small (one component + wiring).

## 3. Dependency / supply-chain debt

**Problem.** `npm audit --omit=dev` reports **12 vulnerabilities (8 high, 4 moderate)**, all
via a single production-path chain:

```
fpscanner@1.0.1 (direct dep, anti-fraud fingerprinting)
└─ javascript-obfuscator@5.3.0
   └─ @vercel/blob@2.3.1
      └─ undici@6.23.0   ← all advisories land here
```

**Nuance.** undici is a Node HTTP client inside a build-time obfuscation dependency — it never
ships in the browser bundle, so practical runtime exploitability is low. The real costs:
supply-chain surface (an obfuscator pulling a blob-storage SDK is exactly the shape
supply-chain attacks take), and the `npm audit` wall of red being a new contributor's first
impression once the repo is open source.

**Suggested first steps.**
1. Try `npm audit fix` (npm claims a fix is available) and verify the fingerprint flow still
   works end-to-end.
2. If fpscanner is org-maintained, fix it upstream: `javascript-obfuscator` (and its
   `@vercel/blob` pull-in) should not be a runtime dependency of a browser fingerprinting lib.
3. Otherwise add a `package.json` `overrides` entry pinning `undici` to a patched version.

Effort: small–medium (the verify step is the work).

## 4. Accessibility — present but never assessed

**Problem.** There are ~32 `aria-*`/`role=` attributes across `src/`, so effort exists, but
no one has assessed coverage. Unknowns: focus management across the phase transitions
(intro → quiz → results replace the whole view), keyboard operability of the answer buttons
and the drag-based widget layout, screen-reader announcement of the one-question-at-a-time
flow, and contrast of per-election themes. For a public civic tool this matters more than for
most apps — and may carry legal weight in some deployment contexts.

**Suggested first step.** A one-pass audit: axe DevTools run on each phase + one full
keyboard-only and one VoiceOver/NVDA walkthrough of the quiz. File findings as individual
issues; add `eslint-plugin-jsx-a11y` to keep the floor from dropping.

Effort: medium (the audit is a day; fixes depend on findings).

---

### Explicitly *not* duplicated here

CSS fallback duplication, `ResultsView` decomposition, i18n missing-key noise, and the mobile
measurement hacks stay in [COMPAT_AUDIT.md](COMPAT_AUDIT.md) with their remediation plan.
