# Roadmap

This roadmap reflects the current repository state at version `0.2.1`. It is intentionally practical:
items are included only when they are supported by existing code, documentation, or the tracked plan.

## Current Status

Electometro currently ships a React/Vite Voting Advice Application with:

- multi-election configuration (`src/elections/`);
- first and second-round flows;
- party and presidential candidate result scoring;
- Tolgee i18n with Spanish and Quechua wiring;
- external vote-data JSON loading;
- dynamic backgrounds and a widget registry;
- shareable mnemonic result URLs;
- Cloudflare Worker/Supabase submission path; a health-check workflow mentions possible Vercel DNS
  migration, but Vercel config is not tracked in this checkout.

## Recently Completed

- Decomposed `QuizContext.jsx` into eight focused hooks (flow, navigation, gating, topic importance,
  results, demographics/submission, mnemonic restore, theme/assets).
- Normalized file naming and folders per `docs/CONVENTIONS.md`; removed the duplicate quiz hook and
  loose root modules.
- Simplified the build to a single platform (Cloudflare).
- Documented the `external/*` submodule contracts in `docs/SUBMODULES.md` (Worker API, asset layout,
  and vote-data schema).

## Short Term

- Add Vitest and cover pure modules first: `resultsService`, `quizService`, `submissionService`,
  `mnemonicCodec`, `versionUtils`, and `answerMappings`.
- Keep deployment secrets out of tracked config. If Vercel config is reintroduced, inject
  `fpscanner` and similar build keys through platform secrets.
- Add CI for `npm run lint`, build, and tests once the test runner exists.
- Keep license metadata aligned between `LICENSE`, `package.json`, and `package-lock.json`.
- Activate useful Lefthook jobs for linting and commit-message checks.

## Mid Term

- Introduce thin data/submission gateway adapters around `fetch` so services are easier to test.
- Remove unused server dependencies (`express`, `mongoose`, `cors`, `body-parser`) from the frontend
  manifest, or relocate them to the Worker repo.
- Realize the `features/` and `shared/` folders described in `docs/CONVENTIONS.md`, or drop them.
- Keep the repo's `db/` SQL in sync with the datastore schema owned by the private Worker repo.
- Add accessibility checks for the quiz, results, modals, and language switching flows.

## Long Term

- Publish a stable extension guide for new countries, elections, widgets, backgrounds, and data
  formats.
- Add regression fixtures for real election data versions.
- Define a release process and changelog discipline around Conventional Commits.

## Technical Debt

- No automated tests are currently configured.
- No lint/build/test CI is tracked; the only referenced workflow is a Cloudflare status health check.
- Unused server dependencies (`express`, `mongoose`, `cors`, `body-parser`) remain in the frontend
  `package.json`.
- The plan referenced a hardcoded `fpscanner` key in Vercel config, but `vercel.json` is not present
  in this checkout. Treat that as a migration risk if Vercel config is reintroduced.
- `lefthook.yml` contains only commented examples, so local hooks are not active.
- Network calls (`fetch`) are embedded in services/hooks rather than behind an adapter.
