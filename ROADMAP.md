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

## Short Term

- Add Vitest and cover pure modules first: `resultsService`, `quizService`, `submissionService`,
  `mnemonicCodec`, `versionUtils`, and `answerMappings`.
- Keep deployment secrets out of tracked config. If Vercel config is reintroduced, inject
  `fpscanner` and similar build keys through platform secrets.
- Add CI for `npm run lint`, build, and tests once the test runner exists.
- Keep license metadata aligned between `LICENSE`, `package.json`, and `package-lock.json`.
- Activate useful Lefthook jobs for linting and commit-message checks.

## Mid Term

- Split `QuizContext.jsx` into focused state and workflow modules for submission, fingerprinting,
  theming, navigation flow, and result computation.
- Introduce thin data/submission gateway adapters around `fetch` so services are easier to test.
- Complete the folder cleanup described in `docs/CONVENTIONS.md`.
- Document the contracts of the `external/*` submodules.
- Add accessibility checks for the quiz, results, modals, and language switching flows.

## Long Term

- Publish a stable extension guide for new countries, elections, widgets, backgrounds, and data
  formats.
- Add regression fixtures for real election data versions.
- Define a release process and changelog discipline around Conventional Commits.

## Technical Debt

- Duplicate legacy entry point `src/useQuiz.js` should stay removed in favor of `src/hooks/useQuiz.js`.
- `QuizContext.jsx` is large and mixes election, UI, fingerprint, submission, results, navigation,
  and theming responsibilities.
- No automated tests are currently configured.
- No lint/build/test CI is tracked; the only referenced workflow is a Cloudflare status health check.
- The plan referenced a hardcoded `fpscanner` key in Vercel config, but `vercel.json` is not present
  in this checkout. Treat that as a migration risk if Vercel config is reintroduced.
- `lefthook.yml` contains only commented examples, so local hooks are not active.
- Legacy loose root modules should live under `utils/`, `config/`, or `hooks/`.
- Component filename casing should follow `docs/CONVENTIONS.md`.
