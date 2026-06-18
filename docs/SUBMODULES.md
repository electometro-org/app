# Submodules & Frontend ↔ Backend Interface

Electómetro's frontend depends on two external git submodules (declared in
[`.gitmodules`](../.gitmodules)):

| Submodule | Path | Provides |
| --- | --- | --- |
| Assets | `external/peru-assets` | `public/` HTML + static assets, i18n files |
| Worker/API | `external/cf-workers` | The Cloudflare Worker that serves the SPA and the `/api/*` endpoints |

> **Scope of this document.** It covers only what a *frontend* contributor needs: the symlink wiring,
> the asset/data layout, and the public request/response **interface** of the API. The Worker is a
> **private** repository; its internal implementation (anti-fraud logic, validation internals, storage
> mechanics, infrastructure identifiers, and secrets) is documented **inside that private repo**, not
> here. Please keep backend internals out of this public repository.

---

## Symlink wiring

The build expects these symlinks at the repo root (see [README](../README.md#local-setup)):

```
public   -> ./external/peru-assets/app/public
i18n     -> ./external/peru-assets/app/i18n
wrangler -> ./external/cf-workers/peru_2026/wrangler
```

`vite.config.js` uses `publicDir: 'public/static'` and `cloudflare({ configPath: 'wrangler/wrangler.toml' })`.
Because the Worker repo is private, contributors without access can still run and develop the **quiz UI**
(it only needs vote data); only live submissions require the Worker.

---

## 1. Assets submodule (`external/peru-assets`)

```
app/
├── public/
│   ├── index.html                 # SPA entry (→ ./public/index.html)
│   └── static/                    # → publicDir; copied to dist/ on build
│       ├── favicon.svg
│       ├── _headers               # Per-host Content-Security-Policy
│       ├── capibarismo/           # Campaign/CTA assets
│       └── <election_id>/         # e.g. peru_2026/: party_logos/, logos, favicon
└── i18n/                          # Translation files (→ ./i18n)
```

Notes for contributors:
- Branding paths in `src/elections/<id>.js` resolve under `static/`; `src/config/branding.js` prefixes
  them with `import.meta.env.BASE_URL` (`/electometro/`).
- `_headers` defines the production **CSP**. If you add a new external origin (analytics, CAPTCHA,
  data host, fonts), you must allow it there or the browser will block the request.

---

## 2. Vote-data contract (public data, served from `VITE_ELECTIONS_DATA_URL`)

Election vote data is fetched at runtime from `VITE_ELECTIONS_DATA_URL` (public object storage; an
optional `/qa` prefix applies when `VITE_TOLGEE_QA_TRANSLATIONS=true`). It is the same JSON every
browser downloads, so its shape is documented here. The frontend consumes the **compact** format:

```jsonc
// presidential file
{
  "version": "1.2.0",
  "quiz":       { "t1": { "id": "t1", "topic": "…", "question": "…" } },
  "candidates": { "c1": { "id": "c1", "name": "…",
                          "party": "…" | { "id": "p1", "name": "…" },
                          "votes": { "t1": { "vote": 0 | 0.5 | 1, "comment": "…", "source": "…" } } } }
}
// party file: same shape with "parties": { "p1": { id, name, candidate, votes } }
```

Rules the frontend depends on (`src/hooks/useQuiz.js`, `src/services/resultsService.js`):
- `version` drives mnemonic compatibility (`src/utils/versionUtils.js`).
- `vote` is numeric in `[0,1]`; `0.5` **without** a `source` is treated as "imputed neutral" and is
  excluded from scoring.
- Translation keys are derived from ids: `quiz.questions.<tid>`, `quiz.topics.<tid>`,
  `explanations.<candidates|parties>.<entityId>.<tid>`.
- A legacy non-compact format is still tolerated (see the branches in those files).

---

## 3. API interface (`external/cf-workers`)

The Worker serves the SPA and exposes two `POST` endpoints under the app base path (`/electometro`).
Only the **public interface** is described here — enough to build against it. The internal verification
and anti-abuse behavior is intentionally not documented in this repo.

**Common requirements**
- Send requests with `credentials: 'include'` (the API relies on a Cloudflare-managed cookie).
- `Content-Type: application/json`; CORS is restricted to the configured site origin.
- Treat any non-`200` response as a failure: the body is JSON of the form `{ "error": "…" }`. Show a
  generic failure to the user and allow retry; do not branch on specific internal error strings.

### `POST /electometro/api/form`
Built by `src/services/submissionService.js` (`buildSubmissionPayload`). Request body:

| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | string | client-generated id |
| `stats_id` | string \| null | analytics id (only when the user consents) |
| `responses` | `{ [questionId]: [vote, weight] }` | `vote ∈ [0,1]`, `weight` integer `1–3` |
| `demographics` | object \| null | optional |
| `captcha_token` | string | required (Turnstile or hCaptcha) |
| `captcha_type` | `"turnstile" \| "hcaptcha"` | default `turnstile` |
| `fingerprint` | string | opaque anti-fraud token from `collectFingerprintPayload()` |
| `is_resubmission` | boolean | optional |
| `quiz_version` | string \| null | from the vote-data `version` |

On success: `200 { success: true }`. On failure: a non-`200` with `{ error }` (handled generically by
the client, which already logs and degrades gracefully).

### `POST /electometro/api/feedback`
Called by `src/views/ResultsView.jsx` to submit a topic/statement suggestion. Request body (high level):
`suggestion` (required), `name` (required), optional `email`, optional `topicKey` / `topicLabel` /
`statement`, plus the same `captcha_token` / `captcha_type` / `fingerprint` fields as above. On success:
`200 { success: true }`; otherwise a non-`200` `{ error }`.

---

## Keeping the interface healthy

- When you change the **submission payload**, update `submissionService.js` **and** coordinate the
  matching change in the private Worker repo (and its datastore). Keep the database hardening in
  [`db/`](../db/) consistent with the payload, treating it as a baseline schema.
- When you add an **external origin**, update `_headers` (CSP) in the assets submodule.
- When you bump the vote-data **`version`**, verify `src/utils/versionUtils.js` mnemonic handling.
- Detailed backend configuration and secrets live in the private Worker repo; never commit secrets or
  infrastructure identifiers to this repository (see [SECURITY.md](../SECURITY.md)).
