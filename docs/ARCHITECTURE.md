# Architecture

Electómetro is a **voting-advice application** (Wahl-o-Mat model): users answer political
statements, weight the topics they care about, and get a similarity ranking against parties and
presidential candidates.

This document describes how the frontend codebase is put together. Related docs:

- [DEVELOPMENT.md](DEVELOPMENT.md) — setup, env vars, scripts, build pipeline, deploy
- [ELECTIONS.md](ELECTIONS.md) — election config reference, vote-data formats, adding elections
- [WIDGETS.md](WIDGETS.md) — the widget layout/docking system
- [BACKGROUNDS.md](BACKGROUNDS.md) — the background plugin system
- [SUBMODULES.md](SUBMODULES.md) — git submodules, symlinks, and the backend API interface
- [../COMPAT_AUDIT.md](../COMPAT_AUDIT.md) — known debt and intentional compat hacks

## System overview

```
┌─────────────────────────────────────────────────────────────┐
│ Browser — React 18 SPA (Vite, HashRouter)                   │
│   quiz flow · results computation (client-side) · i18n      │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │ static assets    │ POST api/form    │ GET vote data + i18n JSON
        │ + SPA fallback   │ POST api/feedback│ (VITE_ELECTIONS_DATA_URL /
        ▼                  ▼                  ▼  VITE_I18N_URL bucket)
┌──────────────────────────────────┐   ┌──────────────────────┐
│ Cloudflare Worker                │   │ Cloudflare R2 / CDN  │
│ (private submodule, wrangler/)   │   │ vote data, i18n,     │
│ CAPTCHA + anti-fraud validation, │   │ election assets      │
│ proxies to Supabase / Fider      │   └──────────────────────┘
└──────────────────────────────────┘
```

Key property: **all matching/scoring happens client-side**. The backend only receives the
final (anonymised) submission for aggregate statistics; it never computes results. See
[SUBMODULES.md](SUBMODULES.md) for the request/response interface.

## Entry point and provider tree

`src/main.jsx` mounts:

```
TolgeeProvider (i18n, LoadingScreen fallback)
└── LoadingWrapper (min 500ms splash)
    └── StrictMode
        └── QuizProvider          — all quiz/flow state (src/contexts/QuizContext.jsx)
            └── BackgroundProvider — reads config.background (src/backgrounds/)
                └── WidgetProvider — layout/docking state (src/widgets/)
                    └── App        — HashRouter + view switch (src/App.jsx)
```

`App.jsx` renders `BackgroundLayer` (z-0), `AnalyticsTracker`, `TurnstileOverlay`, the reset and
menu buttons, a honeypot input (`#website-url`, checked before submission), and the routes:

| Route | Content |
|---|---|
| `/` | `WidgetLayout` wrapping `LanguageSwitcher` + the phase-dependent main view |
| `/metodologia` | `components/methodology.jsx` |
| `/contacto` | `components/contact.jsx` |
| `/politica-privacidad` | `components/privacyPolicy.jsx` |
| `/configuracion-privacidad` | `components/CookieSettings.jsx` (analytics consent) |

## User flow (phase state machine)

The main view under `/` is chosen by `App.renderMainContent()` from `QuizContext` flags; the
same flags are collapsed into a named `phase` by `getQuizPhase()` in
`src/widgets/WidgetContext.jsx` (used by widgets' `showOnPhase`):

```
intro            GenericIntroView      (neutral branding; skipped in single-election builds)
   ↓
(election select) ElectionSelector     (only when multiple elections are enabled)
   ↓
election-intro   ElectionIntroView     (branding, round selector, mnemonic restore)
   ↓
quiz             QuizView              (one statement at a time; agree/neutral/disagree/skip)
   ↓ handleEndQuiz (gated: ≥ minAnsweredRatioForResults of questions answered)
topic-importance TopicImportanceView   (mark topics "very important" → weight boost 1→2)
   ↓
demographics     DemographicsForm      (optional; gender/age/education/region + consent)
   ↓
(captcha)        TurnstileOverlay      (Turnstile; hCaptcha fallback for old browsers)
   ↓ submits answers to backend, then
results          ResultsView           (rankings, per-question comparison, save/share)
```

`restoreFromMnemonic` (from a `?r=` URL param or manual entry) short-circuits directly to
`results` without submitting.

## State management

- **`src/hooks/useQuiz.js`** — `useReducer` holding the core quiz state: `questions`, `answers[]`,
  `weights[]`, `currentQuestionIndex`, `topicImportance`, `comparisonResults`, `selectedEntity`,
  `entityDetails`, `hoveredOption`. Actions: `SET_QUESTIONS`, `ANSWER`, `SET_WEIGHTS`,
  `SET_CURRENT_QUESTION_INDEX`, `SET_COMPARISON_RESULTS`, `SET_SELECTED_ENTITY`,
  `SET_ENTITY_DETAILS`, `SET_HOVERED_OPTION`, `MARK_QUESTION_SEEN`, `TOGGLE_TOPIC_IMPORTANCE`,
  `RESTORE_STATE`, `RESET`. It also loads the question list from the election's vote-data JSON.
  (`src/useQuiz.js` at the src root is a backward-compat re-export shim.)
- **`src/contexts/QuizContext.jsx`** — the orchestration layer (~770 lines): flow flags
  (intros, topic importance, demographics, captcha overlay), round selection, theming
  (applies `config.theme` as CSS variables, loads `elections/<id>.css`), mobile detection,
  version tracking, mnemonic restore, results computation triggers, and the submission call.
  Everything is exposed through `useQuizContext()` (`src/contexts/useQuizContext.js`).

## Results computation (`src/services/`)

- `quizService.js` — unique-question navigation helpers, `fetchJsonSafe`.
- `resultsService.js` — the scoring engine:
  - Answers map to numbers via `constants/answerMappings.js`
    (agree = 1, neutral = 0.5, disagree = 0), with optional per-question `polarity` inversion.
  - Similarity per entity: `round((1 − Σ|user − entity|·w / Σw) × 100)` over the questions both
    sides answered; weights `w` are 1, or 2 when the question's topic was marked important.
  - **Imputed-neutral exclusion**: an entity vote of 0.5 *without a source* means "position
    unknown" and is excluded from comparison (`isImputedNeutral`).
  - Ties are shuffled (`shuffle`) to avoid ordering bias.
  - `partitionByCompared` splits results into "complete" (≥ `MIN_COMPARED` = 8 shared questions)
    and "incomplete" buckets, rendered separately.
  - `filterCandidatesByRound` / `filterPartiesByRound` restrict entities in multi-round
    elections (see [ELECTIONS.md](ELECTIONS.md)).
  - `buildEntityDetails` prepares the per-question comparison for the detail panel, handling
    both the compact and legacy data formats.
- `submissionService.js` — builds the backend payload
  (`responses: { [qid]: [vote, weight] }`, demographics, captcha token, fingerprint, versions)
  and POSTs it to `{BASE_URL}api/form` (or the `VITE_HCAPTCHA_FALLBACK_API` origin for hCaptcha
  submissions).

## Save & restore (mnemonics) and versioning

- `src/utils/mnemonicCodec.js` encodes answers + weights into a phrase from a 256-word Spanish
  list (3 bits per question: 2 answer + 1 weight), with an optional `-v1_2_3` version suffix.
  Elections may override the word list (`config.mnemonicWordList`).
- The phrase is shareable via `#/?r=<phrase>`; `App.jsx` attempts restore once questions load.
- `src/utils/versionUtils.js` compares the mnemonic's quiz-data version against the currently
  served version (`exact` / `patch` / `minor` / `major` / `invalid`); mismatches drive a warning
  modal in `ResultsView`, and future-version mnemonics are rejected.

## Views and notable components

| File | Role |
|---|---|
| `views/QuizView.jsx` | Question card, answer buttons, skip/back, finish gate modal; mobile font-fitting logic |
| `views/TopicImportanceView.jsx` | Topic importance toggles + scroll FAB handling |
| `views/ResultsView.jsx` | **God component (~2,660 lines — see COMPAT_AUDIT §1)**: ranking list, analysis panel, entity details, save/share modal, Capictive/Battle-mode CTAs, captcha script loading, asset resolution |
| `components/EntityDetails.jsx` | Per-question vote comparison with source links |
| `components/TurnstileOverlay.jsx` | Loads Turnstile, falls back to hCaptcha on old browsers |
| `components/demographicsForm.jsx` | Optional demographics + analytics consent |
| `components/CapictiveCTA.jsx` / `CapictiveModal.jsx` | CTA to the external Capictive comparison site (party plans) |
| `components/BattleModeCTA.jsx` / `FightModeModal.jsx` | CTA to capibarismo.com candidate "battle" (uses `constants/capibarismoMapping.js`) |
| `components/BrandImage.jsx` | Branding-aware logo images |
| `components/LoadingScreen.jsx` | Splash screen (per-election theme via `config.loadingScreen`) |

> Note: `Capictive*` and `Capibarismo*` are **two different external services**, despite the
> similar names.

## Anti-fraud (client side)

The frontend collects signals that the (private) backend validates:

- **CAPTCHA**: Cloudflare Turnstile, with hCaptcha as fallback for browsers that can't run
  Turnstile (`TurnstileOverlay.jsx`); the token type is sent as `captcha_type`.
- **Device fingerprint**: `fpscanner` (`src/useFingerprint.js`) produces an encrypted payload
  sent as `fingerprint`; collection skips worker-based signals on old Safari / strict CSP.
- **Honeypot**: hidden `#website-url` input aborts submission if filled.
- `cf_clearance` cookie is sent via `credentials: 'include'` (the production API sits behind a
  WAF managed challenge).

Validation rules, storage, and rate limiting live in the private worker submodule — do **not**
document them here (see [SUBMODULES.md](SUBMODULES.md)).

## Internationalisation

`src/tolgee.js` configures Tolgee with languages `es` (default/fallback), `qu` (Quechua) and
`ay` (Aymara). Sources, in order: Tolgee DevTools (dev only, `VITE_TOLGEE_API_URL/KEY`) →
`BackendFetch` from `VITE_I18N_URL` (R2 bucket kept in sync by Tolgee) → static JSON bundled
from the `i18n/` symlink. `VITE_TOLGEE_QA_TRANSLATIONS=true` switches to `*-qa` languages and
the `/qa/` data path. `LanguageSwitcher.jsx` changes language at runtime without reload.

Many components still use the `t(key) === key ? "fallback" : t(key)` missing-key pattern —
known debt (COMPAT_AUDIT §5).

## Analytics

`src/analytics.js` wraps [trench-js](https://trench.dev/). Gated by `VITE_TRENCH_ENABLED` and
per-user consent in `localStorage.analyticsConsent` (**opt-out**: default true; adjustable in
the demographics form and `/configuracion-privacidad`). `components/analyticsTracker.jsx`
tracks page views; flow events (`answer_selected`, `quiz_completed`, `election_selected`, …)
are fired from context/views. `src/debug.js` provides a dev/`VITE_WIDGET_DEBUG`-gated logger.

## Extension systems

Two registry-based plugin systems, both following the same pattern (standalone `registry.js`,
self-registering `types/index.js`, context provider + render layer):

- **Backgrounds** (`src/backgrounds/`) — one background per election config; types: `solid`,
  `image`, `slideshow`, `gradient`. See [BACKGROUNDS.md](BACKGROUNDS.md).
- **Widgets** (`src/widgets/`) — a `react-grid-layout` canvas where the quiz itself is a widget;
  supports drag/resize, per-election localStorage persistence, phase visibility, and docking
  widgets into quiz anchor points. See [WIDGETS.md](WIDGETS.md).

## Legacy browser support

Deliberate target: **Safari ≥ 12 / iOS ≥ 12, Chrome ≥ 70, Firefox ≥ 68, Edge ≥ 79**
(`browserslist` in package.json, `@vitejs/plugin-legacy` in production builds, `es2018`
transpilation also in dev). Consequences: hand-written `color-mix()` / flex-`gap` / `dvh`
CSS fallbacks, the hCaptcha fallback path, `execCommand("copy")` clipboard fallback, and the
widget `legacyLayouts` variants. These are intentional — see COMPAT_AUDIT §0/§2 before
"cleaning them up".
