# ADR 0001: Initial Application Architecture

## Status

Accepted.

## Context

Electometro supports multiple elections from one frontend codebase. The app needs static hosting,
client-side quiz flow, external election datasets, anti-fraud submission controls, and deployment
paths for Cloudflare and Vercel.

Repository evidence:

- `src/elections/index.js` registers available election configs.
- `vite.config.js` configures the tracked Cloudflare-oriented build.
- `src/hooks/useQuiz.js` uses reducer-based quiz state.
- `src/widgets/registry.js` and `src/backgrounds/registry.js` expose extension registries.
- `src/App.jsx` uses `HashRouter`.
- `src/services/submissionService.js` posts to an API boundary, while the Worker code lives in the
  `external/cf-workers` submodule.
- External JSON vote data is loaded from `VITE_ELECTIONS_DATA_URL`.

## Decision

Electometro uses:

- a config-driven multi-election registry;
- a Vite/React static SPA;
- `HashRouter` for static and subpath deployment compatibility;
- reducer state for core quiz answers, weights, and progress;
- a broader context provider for cross-cutting app flow;
- registry extension points for widgets and backgrounds;
- external compact JSON vote data;
- an edge Worker/API backed by Supabase, R2, and KV for persistence and supporting services;
- a Cloudflare-oriented Vite build with Wrangler config.

## Consequences

Positive:

- New elections can be added mostly through configuration and assets.
- The frontend can be served from edge/static platforms.
- Widgets and backgrounds can be extended without hardcoding every type in core views.
- The client can compute results even when submission services are unavailable.

Tradeoffs:

- Environment and submodule setup is more complex for contributors.
- `QuizContext.jsx` has accumulated too many responsibilities.
- Browser-side result computation requires careful data-version compatibility.
- Multi-platform deployment increases configuration surface area.

## Follow-up Work

- Split the large context into focused modules.
- Add tests around result scoring and mnemonic restore.
- Document submodule contracts.
- Add CI for lint, build, and tests.
