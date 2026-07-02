# Development guide

Setup, environment variables, scripts, the build pipeline, and deployment.
For the big picture see [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Node.js ≥ 18, `npm`
- Cloudflare account (Workers, KV, R2) — only needed for preview/deploy
- Access to the private asset/worker repos (or your own equivalents, see
  [SUBMODULES.md](SUBMODULES.md))

## Setup

```bash
git clone https://github.com/electometro-org/app.git electometro-app
cd electometro-app
git submodule update --init            # external/peru-assets, external/cf-workers (private)
ln -s ./external/peru-assets/app/i18n   ./i18n
ln -s ./external/peru-assets/app/public ./public
ln -s ./external/cf-workers/peru_2026/wrangler ./wrangler
npm install                             # also installs lefthook git hooks via "prepare"
cp .env.example .env
cp .env.development.example .env.development
cp .env.local.example .env.local        # fill in values
```

The symlinks (`i18n`, `public`, `wrangler`) are **not tracked in git** — recreate them after a
fresh clone. Without access to the private repos, create `public/` and `wrangler/` manually
following the README's structure (use `index.html.example` and `wrangler.toml.example` as
templates).

## Environment variables

Vite loads, in increasing precedence: `.env` → `.env.local` (git-ignored) →
`.env.development` (in `--mode development`) → `.env.development.local`.

### Frontend (`VITE_*`)

| Variable | Purpose |
|---|---|
| `VITE_ELECTION_ID` | Election selection: one ID → single-election build (skips selector); comma-separated → multi-election with only those; empty → all configs with `enabled: true`. Also read at build time by `vite-plugin-election-html.js` for meta tags |
| `VITE_ELECTIONS_DATA_URL` | Base URL of the vote-data bucket (`<url>[/qa]/<election_id>/combined_votes_*.json`) |
| `VITE_I18N_URL` | Base URL for Tolgee `BackendFetch` translation JSON |
| `VITE_TOLGEE_API_URL` / `VITE_TOLGEE_API_KEY` | Tolgee DevTools (in-context editing). Dev/QA only — must NOT be set in production |
| `VITE_TOLGEE_QA_TRANSLATIONS` | `true` → use `es-qa`/`qu-qa`/`ay-qa` languages and the `/qa/` vote-data path |
| `VITE_TURNSTILE_FORM_KEY` | Turnstile site key (use test keys in dev) |
| `VITE_HCAPTCHA_SITE_KEY` | hCaptcha site key (old-browser fallback) |
| `VITE_HCAPTCHA_FALLBACK_API` | Alternative API origin for hCaptcha submissions (old browsers that can't pass the Turnstile/WAF path) |
| `VITE_TRENCH_ENABLED` / `VITE_TRENCH_SERVER_URL` / `VITE_TRENCH_PUBLIC_API_KEY` | Trench analytics |
| `VITE_USE_ELECTION_BRANDING` | `false` → keep neutral branding even after an election is selected |
| `VITE_SHOW_GENERIC_INTRO` / `VITE_SHOW_ELECTION_INTRO` | Intro screen toggles (see `src/config/appConfig.js` for defaults) |
| `VITE_USE_LOCAL_DATA` | Dev only: rewrite `/api/elections/{id}/*.json` to local files under `public/` (see `electionDataMiddleware` in `vite.config.js`) |
| `VITE_ENABLE_LAYOUT_PERSISTENCE` | Persist widget layouts to localStorage (default: dev only) |
| `VITE_WIDGET_DEBUG` | Verbose widget/docking logging via `src/debug.js` |

### Worker / tooling (`.env.local`, never committed)

`TURNSTILE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` —
**TEST values only**; production secrets are set with `wrangler secret put`. `CLOUDFLARE_ENV=qa`
selects the Worker's QA environment for wrangler commands.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (`--mode development`), HMR |
| `npm run build` | Production build (includes legacy-browser bundles) |
| `npm run build-dev` | Development-mode build |
| `npm run preview` | `build-dev` + `wrangler dev --local-protocol https` (full Worker + SPA locally) |
| `npm run preview-qa` | Same with `CLOUDFLARE_ENV=qa` |
| `npm run deploy` | `build` + `wrangler deploy` (production) |
| `npm run deploy-qa` | `build` + `wrangler deploy` for the QA environment |
| `npm run lint` | ESLint (flat config, `eslint.config.js`) |
| `npm run prepare` | Installs lefthook git hooks (`lefthook.yml` currently has no active jobs) |

## Build pipeline (`vite.config.js`)

Plugins, in order:

1. **`htmlEntryPlugin`** (local) — serves `public/index.html` as the dev-server entry
   (the root `index.html` is only used as the Rollup input template).
2. **`electionDataMiddleware`** (local, dev + `VITE_USE_LOCAL_DATA`) — rewrites
   `/api/elections/{id}/*.json` to `/{id}/*.json` so local JSON in `public/` is used instead of
   the remote bucket.
3. **`electionHtmlPlugin`** (`vite-plugin-election-html.js`) — injects the election's `meta`
   block (title, description, favicon, canonical, lang) into the HTML at build time, extracted
   from `src/elections/<VITE_ELECTION_ID>.js` via regex.
4. **`@vitejs/plugin-react`**.
5. **`@vitejs/plugin-legacy`** — production only (its inline scripts conflict with CSP in dev).
   Targets Safari 12 etc.; adds `regenerator-runtime` and modern polyfills.
6. **`@cloudflare/vite-plugin`** — builds/runs the Worker from `wrangler/wrangler.toml`.
7. **`nestAssetsPlugin`** (local) — after the client build, moves everything except
   `index.html`, `wrangler.json`, `.assetsignore`, `_headers` into `dist/client/electometro/`
   (the `ASSETS_SUBDIR`), resolving symlinks. Workaround for wrangler asset-resolution issues
   ([workers-sdk#9885](https://github.com/cloudflare/workers-sdk/issues/9885),
   [#11857](https://github.com/cloudflare/workers-sdk/issues/11857)).

Other notable settings:

- `base: '/electometro/'` — **must match** the Worker's `BASE_PATH`; the app is served under
  `https://<domain>/electometro`.
- `publicDir: 'public/static'` — static assets are copied from the symlinked assets repo.
- `esbuild.target: 'es2018'` — modern syntax (`?.`, `??`) is transpiled **also in dev**, so old
  browsers can be tested against the dev server.
- `build.target` / `cssTarget`: `chrome70, firefox68, safari12, edge79`.
- Manual `vendor` chunk for react/react-dom.
- Dev server sends `Cache-Control: no-store`.

## Backend, database, CI

- The Worker (routes, bindings, secrets, validation) lives in the **private**
  `external/cf-workers` submodule; the frontend-facing API contract is summarised in
  [SUBMODULES.md](SUBMODULES.md).
- `db/migration.sql` + `db/security.sql` are a **public baseline** of the Supabase
  `quiz_answers` schema (table, RLS insert policy, response/demographics validation triggers).
  The production schema has additional backend-owned columns and functions; treat these files
  as the reference for the payload shape, not the full production DDL.
- `.github/workflows/cloudflare-healthcheck.yml` — manually triggered (schedule commented out)
  Cloudflare status probe; fails when Cloudflare reports degradation, as a prompt to consider
  DNS migration.

## Testing

There is no test suite yet (roadmap item). Verification is manual:
`npm run lint`, then walk the flow (intro → quiz → topics → demographics → results) on desktop
and a mobile viewport, ideally also on an old-Safari-class browser (see CODE_DEBT_AUDIT §8).
