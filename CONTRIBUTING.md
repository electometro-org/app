# Contributing to Electómetro

> 🌐 **Language:** English (canonical) · [Español](docs/es/CONTRIBUTING.es.md)

Thanks for your interest in contributing! Electómetro is an open-source Voting Advice Application that
helps citizens make informed voting decisions. This guide explains how to set up the project, the
conventions we follow, and how to get changes merged.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Ways to contribute

- 🌍 **Translations** — add or improve languages (managed via [Tolgee](https://tolgee.io/)).
- 🎨 **Design / UX** — improve the quiz and results experience.
- 🔒 **Security** — strengthen anti-fraud and validation (see [SECURITY.md](SECURITY.md)).
- 📊 **Visualizations** — new result widgets and charts.
- 🧪 **Testing** — extend the Vitest suite in `tests/` (pure logic is covered; views and hooks are not yet).
- ♿ **Accessibility** — screen-reader and keyboard support.
- 🐛 **Bug fixes** and 📝 **documentation**.

---

## Local setup

See the [README](README.md#installation--development) for the full walkthrough. In short:

```bash
git clone --recurse-submodules https://github.com/electometro-org/app.git electometro-app
cd electometro-app
npm install
cp .env.example .env && cp .env.development.example .env.development && cp .env.local.example .env.local
# provide public/ assets and (for Cloudflare) wrangler/ config, then:
npm run dev
```

Before opening a pull request, make sure linting and tests pass:

```bash
npm run lint
npm test
```

---

## Branch naming

Create a topic branch off **`v1`** (the active development branch — `main` is legacy and will be
retired). Use a `type/short-description` form that mirrors our commit types:

| Prefix | Use for |
| --- | --- |
| `feat/` | New features (e.g. `feat/weekly-trends-chart`) |
| `fix/` | Bug fixes (e.g. `fix/second-round-default`) |
| `docs/` | Documentation only |
| `refactor/` | Internal restructuring with no behavior change |
| `chore/` | Tooling, dependencies, maintenance |

```bash
git checkout -b feat/new-feature v1
```

---

## Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>
```

| Type | Meaning |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting only (no logic change) |
| `test` | Adding or fixing tests |
| `chore` | Build, tooling, or maintenance tasks |

Examples:

```
feat(results): add aggregated trends chart
fix(second round): show presidential candidates by default
docs(architecture): document the widget registry
```

Keep commits focused and write messages in the imperative mood.

---

## Coding standards

- **Language:** JavaScript + JSX (React 18). Follow the project's ESLint flat config
  (`eslint.config.js`); fix all errors before submitting (`npm run lint`).
- **Naming & folders:** follow the
  [Conventions discussion](https://github.com/electometro-org/app/discussions/categories/docs).
  In short: files that export a
  React component are `PascalCase.jsx`; hooks are `useSomething.js`; services are `somethingService.js`;
  contexts are `SomethingContext.jsx`; utilities/config/constants are `camelCase.js`; CSS is paired with
  its component by name.
- **State:** core quiz state lives in the reducer (`src/hooks/useQuiz.js`); cross-cutting UI/flow state
  lives in `src/contexts/QuizContext.jsx`. Prefer adding pure logic to `src/services/` or `src/utils/`
  (it's easier to reason about and to test).
- **Extension points:** prefer the registry pattern over editing core files:
  - new election → add a config in `src/elections/` and register it in `src/elections/index.js`;
  - new widget → `registerWidget(...)` (`src/widgets/registry.js`);
  - new background → `registerBackground(...)` (`src/backgrounds/registry.js`).
- **i18n:** user-facing strings should be translation keys resolved through Tolgee, not hardcoded text.
- **Browser support:** the app targets older browsers (Chrome 70+, Safari 12+, iOS 12+). Avoid APIs
  that can't be transpiled/polyfilled for those targets.

### Git hooks (optional but recommended)

The repo declares `lefthook` and installs it via the `prepare` script, but `lefthook.yml` currently
contains only commented examples — **no hooks run yet**. If you want local pre-commit linting, add a
job to `lefthook.yml`, for example:

```yaml
pre-commit:
  parallel: true
  jobs:
    - run: npx eslint {staged_files}
      glob: "*.{js,jsx}"
```

---

## Testing expectations

The project has a **Vitest** suite under `tests/`, covering the pure modules (`src/services/`,
`src/utils/`, `src/constants/`) — see [docs/TEST_SUMMARY.md](docs/TEST_SUMMARY.md) for what exists.
Views, hooks, and contexts are not yet covered.

- `npm test` must pass before every PR (`npm run test:watch` during development).
- **New or changed pure logic ships with tests in the same PR.** Services, utils, and constants are
  cheap to test — no DOM, no mocking.
- UI changes still need manual verification: walk the flows your change touches (intro → quiz →
  topic importance → demographics → results, plus mnemonic restore via `?r=`), run `npm run lint`,
  and ensure a production build succeeds with `npm run build`.

See [ROADMAP.md](ROADMAP.md) for the longer-term testing plan (component and E2E coverage).

---

## Documentation

Documentation lives in two places:

- **In-repo** (versioned with the code): this guide, the README, `docs/TEST_SUMMARY.md`, and the
  ADRs in `docs/DECISIONS/`.
- **[GitHub Discussions → Docs](https://github.com/electometro-org/app/discussions/categories/docs)**
  (reference documentation): Architecture, Conventions, Submodules, Elections System, Widget
  System, Background System, Development Guide.

Docs are useful exactly as long as they are trustworthy. Two rules keep them that way without
turning doc maintenance into a chore:

1. **Lockstep rule.** If your PR changes an *interface*, update the doc that describes it — in-repo
   docs **in the same PR**; Docs discussions **at merge time** (maintainers can edit them; flag the
   needed update in the PR description if you can't). Interfaces and their docs:

   | You changed… | Update |
   | --- | --- |
   | Election config shape, vote-data format, `rounds` | *Architecture* + *Elections System* / *Submodules* discussions |
   | API request/response (`/api/form`, `/api/feedback`) | *Submodules* discussion **and** the private Worker repo's docs |
   | Env vars, npm scripts, build pipeline | [README](README.md) Configuration section + *Development Guide* discussion |
   | File naming / folder layout | *Conventions* discussion |
   | Widget/background options | *Widget System* / *Background System* discussions |
   | Test suite structure or coverage | [docs/TEST_SUMMARY.md](docs/TEST_SUMMARY.md) |
   | A significant architectural decision | a new ADR in [docs/DECISIONS/](docs/DECISIONS/) |

   Reviewers treat a missing doc update like a missing test: ask for it (or a flagged follow-up for
   discussion docs) before merge.

2. **Altitude rule.** Docs describe *structure and contracts*, not volatile detail. Don't put line
   counts, exact pixel values, or state-variable inventories in docs — link to the code instead
   ("see `WidgetLayout.jsx` for current breakpoints"). Volatile detail is what rots; structure
   survives refactors.

English is canonical; if you change a doc that has a Spanish counterpart under `docs/es/`, mirror
the change there (or flag it in the PR so a maintainer can).

---

## Pull request process

1. Fork the repo and create a topic branch off `v1` (see [Branch naming](#branch-naming)).
2. Make your change; keep the diff focused.
3. Run `npm run lint` and `npm test`, and verify a build for your deploy target.
4. Push and open a PR against `v1` with:
   - a clear title (Conventional Commit style),
   - a description of **what** changed and **why**,
   - screenshots/GIFs for UI changes,
   - notes on any config/env or data-format implications.
5. Link related issues (`Closes #123`).

### Review process

- At least one maintainer review is expected before merge.
- Reviewers check: correctness, adherence to conventions, tests for new pure logic, i18n usage,
  accessibility, security implications, **docs updated in lockstep** (see
  [Documentation](#documentation)), and that no secrets are committed.
- Address review comments by pushing follow-up commits to the same branch.
- Keep the branch up to date with `v1`; resolve conflicts before merge.

---

## Reporting bugs & requesting features

Open an issue at [github.com/electometro-org/app/issues](https://github.com/electometro-org/app/issues).
For **security** issues, do **not** open a public issue — follow [SECURITY.md](SECURITY.md).

Thank you for helping strengthen democracy through open technology! 🗳️
