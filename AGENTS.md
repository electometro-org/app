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
- `src/services/` — pure logic: `resultsService` (scoring), `quizService`, `submissionService`.
- `src/utils/`, `src/config/`, `src/constants/`, `src/views/`, `src/components/`.
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
  `version` field drives mnemonic compatibility). The frontend never generates it.
- Frontend talks to the backend only over HTTP: `POST /electometro/api/form` and `/api/feedback`
  (with `credentials: 'include'`). The request/response interface is in the [Submodules discussion](https://github.com/electometro-org/app/discussions/categories/docs).
- **Do not edit `external/*` from this repo's tasks** — they are independent (private) submodules. Do not
  copy backend internals (anti-fraud logic, infra identifiers, secret values, schema internals) into this
  public repo. Backend internals are documented inside the private `cf-workers` repo.

## Testing & quality gates

- There is **no automated test suite yet**. Verify changes manually through the flow: intro → quiz →
  topic importance → demographics → results, plus mnemonic restore via the `?r=` URL param.
- Run `npm run lint` before finishing. **Known pre-existing failures:** `vite.config.js` and
  `vite-plugin-election-html.js` report `no-undef` for Node globals (`__dirname`, `process`), and a few
  `src/widgets/*` files have unused-var warnings. Don't introduce **new** lint errors; fixing the
  pre-existing config-globals issue (a Node `languageOptions.globals` override) is welcome but optional.
- If you add tests, start with the pure modules: `resultsService`, `quizService`, `submissionService`,
  `mnemonicCodec`, `versionUtils`, `answerMappings`.

## Security

- Never commit secrets or infrastructure identifiers. Worker secrets are set via `wrangler secret put`.
- Anti-fraud (CAPTCHA, fingerprint, honeypot, KV binding, DB validation) is security-sensitive — flag
  any change to it explicitly. See [SECURITY.md](SECURITY.md).

## Don't

- Don't reintroduce Vercel/microfrontend config or a multi-target build.
- Don't hardcode user-facing strings (use Tolgee).
- Don't fatten `QuizContext`; add a focused hook instead.
- Don't put backend internals or secrets in this repo.
