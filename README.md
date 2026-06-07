# Electómetro

> 🌐 **Language:** English (canonical) · [Español](docs/es/README.es.md)

**Electómetro** is a digital **Voting Advice Application (VAA)** — an interactive questionnaire that
helps voters discover which parties and presidential candidates best match their political positions.
It is inspired by Germany's **Wahl-o-Mat** model (Bundeszentrale für politische Bildung, *bpb*),
adapted to the political, institutional, and social context of Latin American elections.

The goal is simple: empower citizens with clear, accessible information so they can make an informed
vote, make political platforms more visible, and strengthen the legitimacy of the democratic process.

Live deployments: [electometro.org](https://electometro.org) ·
[electometro.decide.pe](https://electometro.decide.pe) (Perú 2026).

---

## Table of Contents

- [How it works](#how-it-works)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Installation & development](#installation--development)
- [Build](#build)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## How it works

1. Voters answer a questionnaire of theses (≈10–20) about key national debate topics.
2. For each thesis the voter chooses **agree / neutral / disagree**, and can additionally mark whole
   topics as **very important** (which boosts the weight of related questions).
3. Based on the answers and importance weighting, the app computes the voter's programmatic and
   ideological closeness to each party and presidential candidate (a weighted similarity score).
4. Detailed per-question breakdowns show how each entity voted on every thesis.

Results can be encoded into a shareable **mnemonic phrase** (a sequence of words in the URL `?r=`
parameter) so a voter can save or share their result without an account.

---

## Features

### 📱 User experience
- Responsive design (mobile and desktop) with a draggable widget-based layout (`react-grid-layout`).
- Smooth navigation across unique questions.
- Topic-importance weighting for questions the voter cares about.
- Optional demographic form (gender, age, education, region).
- Expanded candidate/party detail views with per-question comparison.
- Legacy-browser support (Chrome 70+, Safari 12+, iOS 12+) via `@vitejs/plugin-legacy`.

### 📊 Results analysis
- Weighted similarity scoring against parties and presidential candidates.
- Results partitioned by a minimum number of compared questions (`MIN_COMPARED = 8`).
- Random tie-breaking among equal scores to avoid ordering bias.
- Per-question match visualization.
- Multi-round support (e.g. first / second round) with per-round candidate and party filtering.

### 🌍 Internationalization (i18n)
- Multi-language support via [Tolgee](https://tolgee.io/).
- Dynamic language switching without page reload.
- Languages currently wired: Spanish (`es`), Quechua (`qu`).

### 🔒 Security & anti-fraud
- CAPTCHA verification before submission (Cloudflare Turnstile, with an hCaptcha fallback for older
  browsers that cannot run Turnstile).
- Device fingerprinting via `fpscanner` / FingerprintJS.
- Hidden honeypot field to trap bots.
- Database-side validation and Row-Level Security (see [`db/`](db/)).

### 📈 Analytics
- Consent-gated usage analytics via [Trench.js](https://trench.dev/).
- Quiz-completion and demographic metrics, only when the user consents.

---

## Screenshots

> 📸 _Screenshots are placeholders — replace with real captures._

| Intro | Quiz | Results |
| --- | --- | --- |
| ![Intro screen](docs/assets/screenshot-intro.svg) <!-- TODO: replace with real image --> | ![Quiz view](docs/assets/screenshot-quiz.svg) <!-- TODO: replace with real image --> | ![Results view](docs/assets/screenshot-results.svg) <!-- TODO: replace with real image --> |

---

## Tech stack

### Frontend (SPA)
- ⚛️ **React 18** with **Vite 6** (build + dev server)
- 🌐 **React Router 7** (`HashRouter`)
- 🧩 **react-grid-layout** for the draggable widget canvas
- 🗣️ **Tolgee** for internationalization

### Backend (serverless)
- ☁️ **Cloudflare Workers** (edge compute) — the API/Worker lives in a separate repository, included
  here as the `external/cf-workers` git submodule.
- 🗄️ **Supabase** (PostgreSQL) for response storage
- 📦 **Cloudflare R2** for translation assets
- 🔑 **Cloudflare KV** for fingerprint ↔ cookie binding
> The Cloudflare health-check workflow mentions a possible DNS migration to Vercel, but this checkout
> does not currently track `vercel.json`, `microfrontends.json`, or Vercel-specific npm scripts.

### Security & monitoring
- 🔐 Cloudflare Turnstile (+ hCaptcha fallback)
- 🖐️ FingerprintJS / `fpscanner`
- 🛡️ Supabase Row-Level Security + validation triggers
- 📊 Trench.js (consent-gated analytics)

> **Note on dependencies:** `express`, `mongoose`, `cors`, and `body-parser` appear in
> `package.json` but are not used by the frontend SPA in this repository; they relate to the
> standalone Worker/API. See [ARCHITECTURE.md](ARCHITECTURE.md) for dependency boundaries.

---

## Installation & development

### Prerequisites
- Node.js >= 18 and `npm`
- A Cloudflare account (Workers, KV, R2) for the tracked deployment path
- A Supabase account
- (Optional) A Tolgee account to manage translations

### Local setup

1. **Clone the repository** (with submodules if you have access to the asset/worker repos):
   ```bash
   git clone --recurse-submodules https://github.com/electometro-org/app.git electometro-app
   cd electometro-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables.** Copy the example files and fill in the values:
   ```bash
   cp .env.example .env
   cp .env.development.example .env.development
   cp .env.local.example .env.local
   ```
   See [Configuration](#configuration) for what each variable does.

4. **Provide the `public/` assets.** The app needs a `public/` directory with the election assets and
   an `index.html`. It is **not committed** to this repo. Either create it manually following the
   structure below, or symlink the assets submodule:
   ```bash
   git submodule add <assets-repo-url> external/peru-assets
   ln -s ./external/peru-assets/app/public ./public
   ```
   Expected layout:
   ```
   public/
   ├── index.html             # main page (use index.html.example as a template)
   └── static/                # static assets (copied to dist/ on build)
       ├── favicon.svg
       ├── i18n/              # translation files (optional)
       ├── {election_id}/     # election-specific assets (e.g. peru_2026/)
       └── combined_votes_*.json  # generated vote data (optional in dev)
   ```
   > `index.html.example` at the repo root is a template — copy it to `public/index.html` and adjust
   > the CSP and meta tags for your domain.

5. **Provide the `wrangler/` config** (Cloudflare target only). Also not committed:
   ```bash
   mkdir -p wrangler
   cp wrangler.toml.example wrangler/wrangler.toml   # then edit values
   ```
   See the [Wrangler configuration docs](https://developers.cloudflare.com/workers/wrangler/configuration/).

6. **Run the database migrations** in the Supabase SQL editor, in order:
   1. [`db/migration.sql`](db/migration.sql) — creates `quiz_answers`, indexes, RLS.
   2. [`db/security.sql`](db/security.sql) — check constraints + validation triggers.

7. **Start the dev server:**
   ```bash
   npm run dev
   ```

### Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (`--mode development`) |
| `npm run build` | Production build |
| `npm run build-dev` | Development-mode build |
| `npm run preview` | Build + serve via `wrangler dev` |
| `npm run preview-qa` | QA preview with `CLOUDFLARE_ENV=qa` |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run deploy-qa` | QA deploy with `CLOUDFLARE_ENV=qa` |
| `npm run lint` | Run ESLint over the project |

---

## Build

The current tracked build is Cloudflare-oriented and resolved in [`vite.config.js`](vite.config.js).
It uses the Cloudflare Vite plugin, `public/index.html` as the entry file, `public/static` as the
public asset directory, legacy browser output, and the `nest-assets-plugin`, which moves built assets
under `/electometro/` to work around Wrangler asset-resolution limitations.

A per-election build also injects HTML `<title>`, description, canonical URL, favicon, and `lang` via
[`vite-plugin-election-html.js`](vite-plugin-election-html.js), keyed on `VITE_ELECTION_ID`.

---

## Deployment

### Cloudflare Workers
1. Set secrets:
   ```bash
   wrangler secret put TURNSTILE_SECRET_KEY
   wrangler secret put VITE_SUPABASE_PUBLISHABLE_KEY
   ```
2. Deploy: `npm run deploy`
3. Configure a custom domain in the Cloudflare dashboard (Pages → Custom domains).
4. Create the R2 bucket for translations (Tolgee keeps it updated):
   ```bash
   wrangler r2 bucket create electometro-i18n
   ```

### Vercel

A GitHub Actions workflow (`.github/workflows/cloudflare-healthcheck.yml`) mentions considering a DNS
migration to Vercel if Cloudflare is degraded. Vercel deployment files and npm scripts are not tracked
in this checkout, so Cloudflare is the documented deployment path here.

---

## Project structure

```
electometro/
├── db/                         # Supabase SQL: schema (migration.sql) + hardening (security.sql)
├── docs/                       # Project documentation
│   ├── DECISIONS/              # Architecture Decision Records (ADRs)
│   ├── es/                     # Spanish translations of community-facing docs
│   ├── CONVENTIONS.md          # Naming & folder conventions
│   └── assets/                 # Documentation images
├── src/
│   ├── App.jsx                 # Root component, routes, view switching
│   ├── main.jsx                # Vite entry point
│   ├── backgrounds/            # Background system (registry + types: solid/image/slideshow/gradient)
│   ├── components/             # Reusable UI components (modals, CTAs, forms, menu, static pages)
│   ├── config/                 # appConfig, branding, env, background defaults
│   ├── constants/              # answerMappings, capibarismoMapping
│   ├── contexts/               # QuizContext (global quiz/UI state provider)
│   ├── elections/              # Per-election config registry (peru_2026, chile_2025) + widgets
│   ├── hooks/                  # useQuiz (reducer-based quiz state)
│   ├── services/               # quizService, resultsService, submissionService (logic layer)
│   ├── utils/                  # mnemonicCodec, versionUtils
│   ├── views/                  # Top-level screens (intro, selector, quiz, results, etc.)
│   └── widgets/                # Widget system (registry + docking + types)
├── vite-plugin-election-html.js  # Injects per-election meta tags at build
├── vite.config.js              # Multi-target build config (local/cloudflare/vercel)
└── wrangler.toml.example       # Template for Cloudflare deployment config
```

> The naming and folder conventions are documented in [docs/CONVENTIONS.md](docs/CONVENTIONS.md).

---

## Configuration

Environment variables are read by Vite (`import.meta.env`). Copy from `.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `VITE_TRENCH_ENABLED` | Enable/disable Trench analytics. |
| `VITE_TRENCH_SERVER_URL` / `VITE_TRENCH_PUBLIC_API_KEY` | Trench analytics endpoint + key. |
| `VITE_TURNSTILE_FORM_KEY` | Cloudflare Turnstile site key. |
| `VITE_HCAPTCHA_SITE_KEY` | hCaptcha site key (fallback for old browsers). |
| `VITE_HCAPTCHA_FALLBACK_API` | Fallback API base URL for hCaptcha submissions. |
| `VITE_I18N_URL` | Base URL for translation assets (R2). |
| `VITE_ELECTIONS_DATA_URL` | Base URL for election vote data (compact JSON). |
| `VITE_ELECTION_ID` | Which election(s) are enabled. Single ID = single-election mode (skips selector); comma-separated = multi-election; empty = all elections with `enabled: true`. |
| `VITE_USE_ELECTION_BRANDING` | `false` keeps neutral branding for the whole session. |
| `VITE_SHOW_GENERIC_INTRO` | Toggle the neutral intro shown before election selection. |
| `VITE_SHOW_ELECTION_INTRO` | Toggle the election-specific intro before the quiz. |
| `VITE_TOLGEE_QA_TRANSLATIONS` | Use the `/qa` data/translation prefix. |

Application flow flags are resolved in [`src/config/appConfig.js`](src/config/appConfig.js); branding
in [`src/config/branding.js`](src/config/branding.js). Adding a new election is a matter of dropping a
config file into [`src/elections/`](src/elections/) and registering it in
[`src/elections/index.js`](src/elections/index.js) — see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## FAQ

**Why HashRouter instead of BrowserRouter?**
The app is served as a static SPA, sometimes mounted under a sub-path (`/electometro`) of a host
microfrontend. Hash routing avoids server rewrite requirements for deep links.

**Do I need a backend to run it locally?**
For the quiz and results you only need the election vote data (`VITE_ELECTIONS_DATA_URL`). Submitting
answers requires the Worker/API + Supabase; without them, submissions simply fail silently and the
quiz still works.

**Where does the vote data come from?**
From external compact-format JSON files (keys like `t1`, `c1`, `p1`) served from
`VITE_ELECTIONS_DATA_URL`. The frontend does not generate this data.

**Can I add a new election or country?**
Yes — that's a core design goal. Add an election config and assets; see
[ARCHITECTURE.md](ARCHITECTURE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

**Are there automated tests?**
Not yet. The pure logic modules (`services/`, `utils/`, `constants/`) are designed to be testable and
are the recommended starting point — see [ROADMAP.md](ROADMAP.md).

---

## Contributing

Contributions are welcome — this project aims to strengthen democracy through open technology. Please
read:
- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, branch/commit conventions, PR & review process
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — naming and folder conventions
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community standards
- [SECURITY.md](SECURITY.md) — reporting vulnerabilities

Architecture and decisions are documented in [ARCHITECTURE.md](ARCHITECTURE.md) and
[docs/DECISIONS/](docs/DECISIONS/). The roadmap lives in [ROADMAP.md](ROADMAP.md).

---

## License

Electometro is licensed under the [Apache License 2.0](LICENSE). The package metadata also declares
`"license": "Apache-2.0"`.

Apache-2.0 is a permissive OSI-approved license with an explicit patent grant, attribution/notice
rules, and trademark boundaries that fit a public-interest civic technology project.

---

## Acknowledgements

- **Bundeszentrale für politische Bildung (bpb)** for the Wahl-o-Mat model.
- The open-source community for the tools used here.
- Contributors and the voters who use the tool to make informed decisions.

---

**Made with ❤️ to strengthen democracy in Latin America.**
