# Frontend Compat & Hack Audit — `/src`

> Audit of the `electometro` frontend (`/src`). Vite + React SPA.
> Scope: **only** code debt, "hackish" backwards-compatibility solutions, and mobile
> visual-effect hacks. This is deliberately narrow — it is *not* a full code-health audit.
>
> **Out of scope** (tracked separately in [CODE_HEALTH_BACKLOG.md](CODE_HEALTH_BACKLOG.md)):
> the missing test suite, the missing error boundary, dependency/supply-chain debt, and
> accessibility. Do not read absence from this document as absence of debt.
>
> **Path note (2026-07-01):** some file references below reflect the refactor-branch layout
> (`Architecture-Refactor-CS-21` / `29-solid-implementation`), not `main`. On `main`:
> `utils/analytics.js` → `src/analytics.js`, `utils/debug.js` → `src/debug.js`,
> `config/tolgee.js` → `src/tolgee.js`, and the hooks `useThemeAndAssets`,
> `useDemographicsAndSubmission`, `useQuizNavigation`, `useMnemonicRestore`,
> `useResultsComputation` exist only on those branches (on `main` the equivalent logic lives
> in `src/contexts/QuizContext.jsx` and the views).

---

## 0. Critical framing: the compat hacks are intentional

Before treating any browser-compat code as "debt to delete", note the **deliberate legacy
target**:

- `package.json` `browserslist`: `Chrome >= 70`, `Firefox >= 68`, `Safari >= 12`,
  `iOS >= 12`, `Edge >= 79`, `not dead`.
- `vite.config.js`: `@vitejs/plugin-legacy` (prod only), `build.target`/`cssTarget` =
  `chrome70, firefox68, safari12, edge79`, `esbuild target es2018`,
  `additionalLegacyPolyfills: ['regenerator-runtime/runtime']`, `modernPolyfills: true`.

**Implication:** `color-mix()` fallbacks, `@supports not (gap)`, `100dvh`→`100vh`, and the
`execCommand("copy")` clipboard fallback are **required** by the Safari 12 / iOS 12 target.
They are not bugs. The debt is that they are **hand-written and drift-prone**, not that they
exist.

---

## 1. Headline debt

### 1.1 `views/ResultsView.jsx` — god component (2,660 lines)
- By far the largest file (next largest is 750 lines).
- **37 `useState`, 20 `useEffect`** in one component.
- Mixes: captcha script loading, asset/logo URL resolution, scroll indicators, clipboard,
  keyboard navigation, sorting, modals, and rendering.
- Biggest single violator of SRP — primary target for the `29-solid-implementation` branch.

### 1.2 Duplicated captcha-script loading
- `ResultsView.jsx:17-58` defines `TURNSTILE_SCRIPT_URL`, `HCAPTCHA_SCRIPT_URL`,
  `loadCaptchaScript`, `tryLoadTurnstile`, `tryLoadHCaptcha`.
- `components/TurnstileOverlay.jsx:6-7,38-50` re-defines the same URLs + loaders.
- Should live in one module (`services/captchaService.js`).

### 1.3 Hardcoded data map rebuilt every render
- `ResultsView.jsx:360` — `capictiveMap`, a ~40-entry party→code object literal, declared
  **inside the component body** (recreated each render).
- Belongs in `constants/` next to `constants/capibarismoMapping.js`.
- Suspicious value: `"País para Todos": "CXÁL"` (accented char in a code) at line 382.

---

## 2. Backwards-compatibility hacks (intentional — automate, don't delete)

| # | Hack | Location | Needed because |
|---|------|----------|----------------|
| 2.1 | **`color-mix()` manual fallback duplication — 49 sites** (App.css ×36, peru_2026.css ×12, ProgressIndicator.css ×1). Each color written twice: hardcoded `rgba()` literal + real value in `@supports (background: color-mix(...))`. Literals decoupled from `--accent`/`--buttonColor` → silent drift on theme edits. | `App.css`, `elections/peru_2026.css`, `widgets/types/ProgressIndicator.css` | `color-mix()` = Safari 16.2+ |
| 2.2 | **`@supports not (gap: 1rem)`** flex-gap fallbacks (~8 files) | OpinionButtons.css, SocialShare.css, CookieSettings.css, WidgetLayout.css, peru_2026.css, ElectionBanner.css, ProgressIndicator.css, App.css | flex `gap` = Safari 14.1+ |
| 2.3 | **`100dvh` → `100vh` fallback** | `widgets/WidgetLayout.css:7-8` | `dvh` = Safari 15.4+ |
| 2.4 | **Clipboard `execCommand("copy")` fallback** (textarea + `-9999px` offset) | `ResultsView.jsx:286-308` | `navigator.clipboard` = Safari 13.1+ |
| 2.5 | **hCaptcha readiness busy-wait** — `while (typeof window.hcaptcha==='undefined' && attempts<50) await sleep(100)` | `TurnstileOverlay.jsx:42-45` | async script global readiness |
| 2.6 | **`-webkit-backdrop-filter` / `-webkit-tap-highlight-color`** vendor prefixes (26 unique `-webkit-`, 3 `-moz-`) | App.css, LoadingScreen.css, etc. | Safari prefixing |

**Inconsistency:** `widgets/types/SocialShare.jsx:31` uses `navigator.clipboard` directly with
**no** fallback, unlike 2.4.

**Likely unnecessary (no SSR in this Vite SPA):** `typeof window !== 'undefined'` guards in
`SocialShare.jsx`, `useThemeAndAssets.js`, `useDemographicsAndSubmission.js`,
`useQuizNavigation.js`, `SlideshowBackground.jsx` — cargo-culted defensive cruft.

---

## 3. Mobile visual-effect hacks

JS measurement + polling/timers compensating for mobile layout timing — much of it duplicated.

- **3.1 `fitQuestionIntoMobileBox`** — `QuizView.jsx:79-114`. A `while` loop shrinking
  font-size `0.02rem` at a time, reading `el.scrollHeight` each iteration (synchronous
  layout thrash) and writing inline styles, to fit the question into the mobile box.
  CSS-native alt: `clamp()` + `-webkit-line-clamp`.
- **3.2 Scroll-down FAB pattern — duplicated ×4**: `DemographicsForm.jsx:48-110`,
  `TopicImportanceView.jsx` (two effects, ~150-218), `ResultsView.jsx:905-950`.
  `getBoundingClientRect` visibility + IntersectionObserver + scroll/resize listeners
  **+ a permanent `setInterval(…, 250ms)` poll**. Code comment: *"Poll while hidden as a
  final fallback for momentum scrolling on mobile browsers."* (iOS doesn't reliably fire
  scroll events mid-momentum.) Battery/perf cost ×4.
- **3.3 TopicImportanceView continue-button** — `:90-147`. IntersectionObserver + 180ms
  settle `setTimeout` + 250ms interval; comment *"RGL can settle asynchronously"* — timing
  hacks around react-grid-layout async settle.
- **3.4 `RowFillAwareText` / `recomputeSplit`** — `ResultsView.jsx:1560-1600`. Measures row
  + text `getBoundingClientRect` to compute a per-row `--split-local` px var for a two-tone
  text fill. JS geometry faking CSS `background-clip: text` + gradient.
- **3.5 ElectionIntroView** — `:74-101`. `scrollHeight` measured into React state for a
  height animation (the "can't transition to `height:auto`" workaround) + rAF/1500ms
  staggered text reveal.
- **3.6 ResultsView FAB** also stacks `window.visualViewport` resize/scroll listeners + a
  260ms settle timer on top of the IntersectionObserver (mobile URL-bar/keyboard workaround).

---

## 4. Duplicated shared logic

- **`isMobile`** (`window.innerWidth < 768` + resize listener) reimplemented in
  `useQuizNavigation.js:20-38`, `DemographicsForm.jsx:42-46`, `TopicImportanceView.jsx:53-58`.
  No shared `useIsMobile`/`useMediaQuery`.
- **`getScrollParent`** (and a viewport-visibility helper) defined inline in
  `DemographicsForm.jsx`, `TopicImportanceView.jsx`, `ResultsView.jsx`.
- **`preloadImage`** defined twice + 4 `checkLoaded` rAF-poll blocks in `ResultsView.jsx`
  (lines 476, 569, 1669, 1693, 1812, 1836).
- **Multi-extension asset probing** — `PARTY_LOGO_EXTS`/`CANDIDATE_PHOTO_EXTS`
  (`ResultsView.jsx:11-12`) try png→jpg→jpeg→svg per asset at runtime.

---

## 5. i18n missing-key hack — 64 sites

Pattern: `t("x.y") === "x.y" ? "literal fallback" : t("x.y")` in `ResultsView.jsx`,
`ElectionIntroView.jsx:20-35`, `FightModeModal.jsx:27-34`. A Tolgee workaround. Note
`config/tolgee.js` already sets `fallbackLanguage: esLang` + static `es` data, so the
pattern is mostly redundant noise. Centralize via a `tx(t, key, fallback)` helper, or add
missing keys to `es.json`.

---

## 6. Smaller items

- **`eslint-disable react-hooks/exhaustive-deps`** ×3: `OpinionButtons.jsx:104,136`,
  `WidgetLayout.jsx:356` — latent stale-closure risk.
- **Stray `console.*`**: 14 in `utils/analytics.js`, plus `useMnemonicRestore`,
  `useDemographicsAndSubmission`, `useResultsComputation`, etc. Route through `utils/debug.js`.
- **Naming inconsistency**: `Capictive*` (`CapictiveCTA.jsx`, `CapictiveModal.jsx`,
  config `capictiveUrl`) vs `Capibarismo*` (`capibarismoMapping.js`,
  `CAPIBARISMO_CANDIDATE_MAP`). Likely two different external services — add a clarifying
  comment if intentional.

## 7. Notably clean

- No `TODO`/`FIXME`/`HACK` markers anywhere.
- Minimal inline styles (4 in the 2,660-line file).
- `hooks/`, `services/`, `config/`, `widgets/`, `backgrounds/` are well-factored.
- Debt is concentrated almost entirely in `ResultsView.jsx` + the CSS fallback duplication.

---

## 8. Remediation plan (summary)

Full plan: `~/.claude/plans/any-other-parts-you-eager-balloon.md`. Suggested order
(low-risk first; **none requires dropping Safari 12 support**):

1. **i18n** — add `tx(t, key, fallback)` (`utils/i18n.js`); replace 64 sites. (§5)
2. **PostCSS** — add `postcss.config.js` with `postcss-preset-env` / color-mix + gap
   plugins driven by `browserslist`; rewrite colors to single `color-mix()` declarations and
   delete the 49 hand-written fallbacks + `@supports` override blocks. (§2.1-2.2)
3. **Shared utils / mobile** — `useIsMobile`, `utils/scroll.js` (`getScrollParent`),
   `useElementOffscreen` (single IntersectionObserver, drop the 250ms polls), CSS `clamp()`
   for the question fit, remove SSR guards. (§3, §4)
4. **ResultsView split** — `services/captchaService.js`, `useAssetResolution`,
   `useResultsScroll`, move `capictiveMap` to `constants/`, extract `ResultsList` /
   `ResultsAnalysisPanel` / `SaveResultsModal`. (§1)

### Verification
- `npm run build` → inspect `dist/client` CSS confirms generated color-mix fallbacks.
- `npm run dev` on a mobile viewport → walk intro → topics → quiz → demographics → results;
  check FABs, question fit, two-tone row fill, clipboard.
- Spot-check a Safari 12-class engine for color/gap output.
- `npx eslint src` clean (no new `exhaustive-deps` suppressions).
