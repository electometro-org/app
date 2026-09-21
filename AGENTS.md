# AGENTS.md

Guidance for AI coding agents working in this repository. Humans should read [README.md](README.md),
[CONTRIBUTING.md](CONTRIBUTING.md), and the [Architecture discussion](https://github.com/electometro-org/app/discussions/categories/docs) first; this file is the
condensed, agent-facing version.

## What this is

Electómetro is a **React 18 + Vite 6 single-page Voting Advice Application**. Users answer political
theses and get a weighted similarity score against parties and presidential candidates. It is a static
SPA deployed on **Cloudflare**; the backend API/Worker is a **separate private repo**
(`external/cf-workers` submodule).

## Setup & commands

```bash
npm install
cp .env.example .env && cp .env.development.example .env.development && cp .env.local.example .env.local
npm run dev      # Vite dev server (mode=development)
npm run build    # production build (Cloudflare)
npm run lint     # ESLint
npm run deploy   # build + wrangler deploy
```

- The app needs `public/` + `i18n/` assets and (for Cloudflare) `wrangler/` config. None are tracked in git;
  they come from submodules via symlinks: `public → external/peru-assets/app/public`,
  `i18n → external/peru-assets/app/i18n`, `wrangler → external/cf-workers/peru_2026/wrangler`.
  Without submodule access you can still run the quiz UI (it only needs vote data); submissions need the Worker.
- There is **no Vercel build path** anymore — do not reintroduce `vercel.json`, `microfrontends.json`,
  `DEPLOY_TARGET`, or `build:vercel`/`dev:cloudflare`-style scripts.

## Architecture (where things live)

- `src/App.jsx` — `HashRouter`, route/view switching, global chrome, honeypot field.
- `src/contexts/QuizContext.jsx` — **thin composition root**; it wires eight focused hooks. Do **not**
  let it grow back into a monolith. Add new state to a focused hook, not here.
- `src/hooks/` — `useQuiz` (reducer = canonical quiz state) + `useElectionFlow`, `useQuizNavigation`,
  `useMinAnswersGate`, `useTopicImportance`, `useResultsComputation`, `useDemographicsAndSubmission`,
  `useMnemonicRestore`, `useThemeAndAssets`.
- `src/services/` — pure logic: `resultsService` (scoring), `quizService`, `submissionService`,
  `regionalService` (regional data loading/shaping; see below).
- `src/utils/`, `src/config/`, `src/constants/`, `src/views/`, `src/components/`. Quiz-screen pieces:
  `components/QuizTopLine` (language pill + region chip), `LanguageSwitcher` (buttons and `LanguagePill`),
  `ProgressSegments`, `HamburgerMenu`; `hooks/useRegionalData` feeds the region picker.
- `src/elections/` — per-election config registry. `src/widgets/registry.js`,
  `src/backgrounds/registry.js` — extension registries.

Put **pure logic in `services/`/`utils/`** (testable); keep UI in `components/`/`views/`.

## Conventions (enforced by review — see the Conventions discussion in https://github.com/electometro-org/app/discussions/categories/docs)

- React components/views → `PascalCase.jsx`; hooks → `useSomething.js`; services → `somethingService.js`;
  contexts → `SomethingContext.jsx`; utils/config/constants → `camelCase.js`; CSS paired by name.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`…). Branches: `feat/…`, `fix/…`.
- **i18n:** user-facing strings must be Tolgee translation keys, never hardcoded text.
- **Browser support:** targets Chrome 70+/Safari 12+/iOS 12+ (es2018). Don't use APIs that can't be
  transpiled/polyfilled for those targets.

## Extension points (prefer over editing core files)

- New election → add a config in `src/elections/` and register it in `src/elections/index.js`.
- New widget → `registerWidget({ id, component, defaults })`.
- New background → `registerBackground({ id, component })`.

## Data & backend boundaries

- Vote data is **external compact JSON** from `VITE_ELECTIONS_DATA_URL` (keys like `t1`/`c1`/`p1`;
  `version` field drives mnemonic compatibility). The frontend never generates it. Regional elections use
  one file with a `regions` map (`{ version, regions: { r1: { id, name, quiz, candidates } } }`) whose
  question/topic texts are inline; bump `version` whenever a region's quiz changes.
- Frontend talks to the backend only over HTTP: `POST /electometro/api/form` and `/api/feedback`
  (with `credentials: 'include'`). The request/response interface is in the [Submodules discussion](https://github.com/electometro-org/app/discussions/categories/docs).
  Regional submissions add an optional `region_id` (`r<N>`); the Worker stores them separately.
- **Do not edit `external/*` from this repo's tasks** — they are independent (private) submodules. (If a
  task explicitly includes them, commit inside the submodule separately and bump the pointer.) Do not
  copy backend internals (anti-fraud logic, infra identifiers, secret values, schema internals) into this
  public repo. Backend internals are documented inside the private `cf-workers` repo.

## Testing & quality gates

- A Vitest suite lives under `tests/` (pure modules: services, utils, constants); run `npm test`. UI is
  not covered, so also verify changes manually through the flow: intro → quiz → topic importance →
  demographics → results, plus mnemonic restore via the `?r=` URL param (regional: also the region picker).
- Run `npm run lint` before finishing. **Known pre-existing failures:** `vite.config.js` and
  `vite-plugin-election-html.js` report `no-undef` for Node globals (`__dirname`, `process`), and a few
  `src/widgets/*` files have unused-var warnings. Don't introduce **new** lint errors; fixing the
  pre-existing config-globals issue (a Node `languageOptions.globals` override) is welcome but optional.
- New pure logic ships with tests (`resultsService`, `quizService`, `submissionService`,
  `regionalService`, `mnemonicCodec`, `versionUtils`, `answerMappings`).
- Layout changes on the quiz screen: check that the page does not gain scroll on short phones
  (e.g. 360×640) and that nothing overflows horizontally. Measure `max(documentElement.scrollHeight,
  body.scrollHeight)` — the scrolling element can be `body`.

## Regional elections & quiz screen — things to know

- **Election flags** (`regional`, `styleId`, `inlineProgress`, `topicHeader`, `quizTopLine`, …) are opt-in
  per election config; without them an election keeps the classic layout. Reference: README →
  [Regional elections](README.md#regional-elections).
- **Tolgee defaults:** the default text is the *second positional argument*: `t(key, "Default", params)`.
  `t(key, { defaultValue })` does not work, and comparing `t(key) === key` to detect a missing key is
  unreliable. New keys go into `es-qa.json` (QA → prod promotion); the prod pull bot can overwrite
  `es.json`.
- **Election CSS** is scoped by `[data-election="<styleId>"]`; the regional election reuses
  `peru_2026.css` through `styleId`. Text/spacing on the Peru quiz screen is fluid (`clamp()` on
  viewport height/width) with `--q-*` knobs documented at the top of that file.
- **Widget grid:** rows are 8px and docked widgets stay at fixed grid coordinates (docking zones only
  reserve space), so anything that must sit *below the content* (like the progress bar) is rendered
  in-flow instead of docked. `.quiz-widget` is used on two nested elements — don't target it bare.
- **Database:** `db/regional.sql` is not re-runnable and must run before a Worker that sends
  `region_id` is deployed. Analysis views must not be readable through the API (see SECURITY.md).

## Security

- Never commit secrets or infrastructure identifiers. Worker secrets are set via `wrangler secret put`.
- Anti-fraud (CAPTCHA, fingerprint, honeypot, KV binding, DB validation) is security-sensitive — flag
  any change to it explicitly. See [SECURITY.md](SECURITY.md).

## Don't

- Don't reintroduce Vercel/microfrontend config or a multi-target build.
- Don't hardcode user-facing strings (use Tolgee).
- Don't fatten `QuizContext`; add a focused hook instead.
- Don't put backend internals or secrets in this repo.
