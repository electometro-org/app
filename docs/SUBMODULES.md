# Submodules, symlinks & backend interface

This repo is the **public** frontend. Election assets and the backend Worker live in separate
repos wired in as git submodules, exposed to the build via symlinks.

> **Scope note:** backend internals (anti-fraud logic, validation thresholds, storage,
> infrastructure identifiers) are documented **only** in the private worker repo. This file
> describes just the interface a frontend developer needs. Keep it that way — do not copy
> backend internals into this repo.

## Submodules (`.gitmodules`)

| Path | Repo | Contents |
|---|---|---|
| `external/peru-assets` | `electometro-org/peru` (private) | `app/public/` (static assets, `index.html`, `_headers`/CSP), `app/i18n/` (translation JSON), `app/scripts/`; plus `home/` (the separate decide.pe landing app, not used by this build) |
| `external/cf-workers` | `electometro-org/cf-workers` (private) | `peru_2026/wrangler/` — the API Worker (`worker/api.ts`) and `wrangler.toml`; sibling projects (SEO worker, home app) |

## Symlinks (untracked — recreate after cloning)

```bash
ln -s ./external/peru-assets/app/i18n   ./i18n     # static translation fallbacks (tolgee.js)
ln -s ./external/peru-assets/app/public ./public   # publicDir source + dev index.html
ln -s ./external/cf-workers/peru_2026/wrangler ./wrangler  # Worker config for vite/wrangler
```

No access to the private repos? Create `public/` and `wrangler/` yourself following the
README's "Configuración Local" section (`index.html.example`, `wrangler.toml.example`).

## Coupled settings

- The SPA's `base` (`/electometro/`, from `ASSETS_SUBDIR` in `vite.config.js`) **must match**
  the Worker's `BASE_PATH`. Changing one side requires changing the other.
- If you change a request/response shape below, the Worker and its docs must be updated in
  lockstep (and vice versa) — see the editing rules in the private repo's `AGENTS.md`.

## Backend API interface

The Worker serves the SPA assets (SPA fallback routing) and exposes two JSON `POST` endpoints
under the base path. Both are called with `credentials: 'include'` (a `cf_clearance` cookie is
required in production — the API sits behind a Cloudflare managed challenge). For old browsers
using the hCaptcha path, `VITE_HCAPTCHA_FALLBACK_API` provides an alternative origin, called
with `credentials: 'omit'`.

### `POST {base}/api/form` — quiz submission

Built by `src/services/submissionService.js`:

```jsonc
{
  "user_id": "…",                 // client-generated, persisted in localStorage
  "stats_id": "…" | null,         // analytics id, only with consent
  "responses": { "t1": [1, 2] },  // qid → [vote (0|0.5|1), weight (1–3)]
  "demographics": { … } | null,   // optional form data
  "captcha_token": "…",           // Turnstile or hCaptcha token (required)
  "captcha_type": "turnstile" | "hcaptcha",
  "fingerprint": "…",             // fpscanner payload (src/useFingerprint.js)
  "is_resubmission": false,       // true when restored from a mnemonic
  "quiz_version": "1.2.3" | null  // version of the vote-data used
}
```

Success: `200 { "success": true }`. Errors return `{ "error": "…", "details"?: … }` with
`400` (missing/invalid fields, captcha token, or clearance cookie), `403` (captcha or
anti-fraud verification failed), `429` (rate limited), `5xx` (upstream failure). The frontend
treats submission as fire-and-forget: results are shown regardless (they are computed
client-side).

### `POST {base}/api/feedback` — topic/statement suggestions

Sent from the suggestion modal in `ResultsView.jsx`:

```jsonc
{
  "suggestion": "…",         // ≥ 8 chars, required
  "name": "…",               // ≥ 5 letters, required
  "email": "…",              // optional, validated
  "topicKey": "…",           // optional context
  "topicLabel": "…",
  "statement": "…",
  "captcha_token": "…",      // optional if a prior verified session exists
  "captcha_type": "…",
  "fingerprint": "…"         // required
}
```

Success: `200 { "success": true }` (the suggestion lands in the feedback board). Errors:
`400` (validation), `403` (missing clearance / captcha / verification mismatch), `502`/`500`.
The UI is acknowledgement-first and doesn't surface errors to the user.

## External data (not the Worker)

- **Vote data**: `{VITE_ELECTIONS_DATA_URL}[/qa]/<election_id>/combined_votes_*.json`
  (formats in [ELECTIONS.md](ELECTIONS.md); local samples in `json_data/`).
- **Translations**: `{VITE_I18N_URL}/<lang>.json`, kept up to date by Tolgee; static fallbacks
  bundled from the `i18n/` symlink.
- **Election assets**: party logos / candidate photos under
  `{assetsBaseUrl}/<assetsPath>` and `public/static/<election_id>/`.
- **Database baseline**: `db/migration.sql` + `db/security.sql` describe the public shape of
  the `quiz_answers` table (the production schema is backend-owned and extends it).
