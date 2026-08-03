# ADR 0002: Architecture Refactor — Hook Decomposition and Single-Platform Build

## Status

Accepted. Builds on and partially supersedes the follow-up work listed in
[ADR 0001](0001-initial-architecture.md).

## Context

ADR 0001 noted two tradeoffs as explicit follow-up work:

- `QuizContext.jsx` had accumulated too many responsibilities (election flow, navigation, gating,
  topic importance, results, demographics/submission, fingerprint, mnemonic restore, and theming) in a
  single ~770-line provider.
- Supporting multiple deployment targets (Cloudflare and Vercel) increased configuration surface area.

In addition, the source tree had grown inconsistent: loose modules at the root of `src/`, a duplicate
quiz hook (`src/useQuiz.js` and `src/hooks/useQuiz.js`), and mixed component filename casing — all in
conflict with the rules later written down in the Conventions doc (now in [GitHub Discussions](https://github.com/electometro-org/app/discussions/categories/docs)).

## Decision

1. **Decompose the context.** `QuizContext.jsx` becomes a thin composition root that wires together
   eight focused, single-responsibility hooks (`useQuiz`, `useElectionFlow`, `useQuizNavigation`,
   `useMinAnswersGate`, `useTopicImportance`, `useResultsComputation`, `useDemographicsAndSubmission`,
   `useMnemonicRestore`, `useThemeAndAssets`) and exposes one context value via `useQuizContext`.
2. **Normalize structure** per the Conventions doc: PascalCase components, loose modules moved into
   `hooks/`, `utils/`, and `config/`, and the duplicate quiz hook removed in favor of
   `src/hooks/useQuiz.js`.
3. **Single-platform build.** Remove the multi-target (`DEPLOY_TARGET`) matrix and Vercel/microfrontends
   configuration; `vite.config.js` and the npm scripts target Cloudflare only.

## Consequences

Positive:

- `QuizProvider` no longer violates the Single Responsibility Principle; each concern is isolated,
  smaller, and far easier to reason about and unit-test.
- The reducer (`useQuiz`) stays small and serializable, which keeps mnemonic save/restore simple.
- A single build path reduces configuration surface and contributor confusion.
- The codebase now matches its documented conventions.

Tradeoffs / open items:

- Hook composition order matters (e.g. `useResultsComputation` must initialize before the hooks that
  call `computeAndDispatchResults`); this ordering is encoded in `QuizProvider` and must be maintained.
- Dropping the Vercel target means any future Vercel migration must reintroduce that configuration
  (and must keep build secrets out of tracked files — see [SECURITY.md](../../SECURITY.md)).
- `useResultsComputation` remains the largest hook; embedded `fetch` calls are still not behind an
  adapter (tracked in ROADMAP).

## Follow-up Work

- Add automated tests starting with the pure services/utilities.
- Add lint/build/test CI.
- Introduce data/submission gateway adapters around `fetch`.
- Document the `external/*` submodule contracts.