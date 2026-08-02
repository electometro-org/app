# Contributing to Electómetro

> **Status: DRAFT — proposal for discussion.** These guidelines are a starting point for the
> conversation about keeping the code and docs understandable as the contributor base grows
> (see the open discussion "Mantenimiento de documentación y calidad de código"). Nothing here
> is final; challenge it in the discussion or in a PR against this file.

The basic contribution flow (fork → branch → PR, Conventional Commits, ESLint) is described in
the [README](README.md#-contribuir). This document covers the rules that keep the project
maintainable over time.

## Documentation rules

The technical docs in [`docs/`](docs/) are useful exactly as long as they are trustworthy.
Two rules keep them that way without turning doc maintenance into a chore:

1. **Lockstep rule.** If your PR changes an *interface*, update the doc that describes it in
   the **same PR**. Interfaces and their docs:

   | You changed… | Update |
   |---|---|
   | Election config shape (new/renamed fields, `rounds`, widget options) | `docs/ELECTIONS.md` / `docs/WIDGETS.md` / `docs/BACKGROUNDS.md` |
   | Vote-data JSON format | `docs/ELECTIONS.md` |
   | API request/response (`/api/form`, `/api/feedback`) | `docs/SUBMODULES.md` **and** the private worker repo's docs |
   | Env vars, npm scripts, build pipeline | `docs/DEVELOPMENT.md` |
   | Phase flow, scoring semantics, provider tree | `docs/ARCHITECTURE.md` |

   Reviewers: treat a missing doc update like a missing changelog entry — ask for it.

2. **Altitude rule.** Docs describe *structure and contracts*, not volatile detail. Don't add
   line counts, exact pixel values, or state-variable inventories to docs — link to the code
   instead ("see `WidgetLayout.jsx` for current breakpoints"). Volatile detail is what rots;
   structure survives refactors.

## Boundary rule (public repo)

This repo is public. Backend internals — anti-fraud logic, validation thresholds, storage
mechanics, infrastructure identifiers, secret names beyond what `wrangler.toml.example`
shows — live **only** in the private worker repo. Docs and comments here describe the API at
the request/response level. When in doubt, leave it out and reference the private repo.

## Code quality

- **Language**: user-facing text goes through Tolgee translation keys (no hardcoded strings —
  including the `t(key) === key ? fallback : …` pattern; add the key to `es.json` instead).
- **Compat is load-bearing**: Safari 12 / iOS 12 support is a deliberate target. The CSS
  fallbacks and JS workarounds catalogued in [COMPAT_AUDIT.md](COMPAT_AUDIT.md) are
  intentional — don't remove them as "cleanup"; automate them (PostCSS) per the audit's plan.
- **Debt-aware**: before refactoring, check [COMPAT_AUDIT.md](COMPAT_AUDIT.md) and
  [CODE_HEALTH_BACKLOG.md](CODE_HEALTH_BACKLOG.md) — your target may already have an agreed
  remediation plan (e.g. the `ResultsView.jsx` split). Extend those docs when you retire debt.
- **New code, new tests**: once the vitest harness lands (CODE_HEALTH_BACKLOG §1), pure logic
  (services, utils, constants) added or changed in a PR should come with tests.
- **Logging**: use `src/debug.js`, not bare `console.*`.

## Review expectations

- PRs should say **what changed and why**, in the style of the existing PR bodies
  (Contexto → Cambios → Verificación). Spanish or English both fine.
- Manual verification is currently the norm: state what you walked through
  (desktop + mobile viewport; old-Safari check for CSS/layout changes).
- Anti-fraud-adjacent frontend changes (captcha, fingerprint, submission payload) need a
  maintainer review and a lockstep check against the private worker.

## Open questions (for the discussion)

- Doc language policy: README/community docs in Spanish, technical docs in English — keep?
- Should the lockstep rule be enforced by a PR-template checklist or a CI path-filter warning?
- Ownership: do docs need named maintainers, or is the lockstep rule enough?
- When the OOP refactor lands, who updates ARCHITECTURE.md — the refactor PR or a follow-up?
