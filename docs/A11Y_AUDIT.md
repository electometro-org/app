# Accessibility Audit — static pass (2026-08-02)

First systematic accessibility assessment of the frontend. This pass is **static analysis
only** (`eslint-plugin-jsx-a11y`, recommended ruleset); the manual/browser pass is still
pending (see [Next steps](#next-steps)).

## Setup

`eslint-plugin-jsx-a11y` is now wired into `eslint.config.js` with all recommended rules
**downgraded to warnings** so `npm run lint` stays actionable while findings are worked off.
Once the count reaches zero, promote the rules to errors to lock the floor in.

## Findings — 86 warnings

### By rule

| Rule | Count | What it means here |
|---|---|---|
| `no-static-element-interactions` | 34 | `<div>`/`<span>` with `onClick` but no `role` — invisible to assistive tech |
| `click-events-have-key-events` | 33 | same elements: click without keyboard handler — **not operable by keyboard** |
| `control-has-associated-label` | 9 | buttons/controls with no accessible name (icon-only buttons, close ×) |
| `no-noninteractive-element-interactions` | 8 | click handlers on `li`/headings/images |
| `label-has-associated-control` | 2 | form labels not bound to their inputs |

### By file

| File | Warnings |
|---|---|
| `views/ResultsView.jsx` | 40 |
| `views/QuizView.jsx` | 8 |
| `views/TopicImportanceView.jsx` | 6 |
| `views/ElectionIntroView.jsx` | 5 |
| `components/FightModeModal.jsx` | 5 |
| `components/EntityDetails.jsx` | 5 |
| `components/CapictiveModal.jsx` | 5 |
| `components/DemographicsForm.jsx` | 4 |
| `components/Menu.jsx`, `CookieSettings.jsx`, `BattleModeCTA.jsx` | 2 each |
| `widgets/types/OpinionButtons.jsx`, `components/BrandImage.jsx` | 1 each |

### Interpretation

The two dominant rules are two symptoms of **one pattern**: interactive `<div>`s
(result rows, modal backdrops, expandable panels) instead of `<button>`s. Consequences:

- **Keyboard users cannot operate them at all** — most of the results screen (opening an
  entity's detail, switching tabs, expanding analysis categories) appears keyboard-dead.
- Screen readers announce them as plain text, not as actionable controls.

The generic fix is mechanical and low-risk: replace the clickable `div` with a `button`
(restyled via a shared `.unstyled-button` class), or where the div must stay, add
`role="button"`, `tabIndex={0}`, and an Enter/Space key handler. Because 40 of the 86 sites
are in `ResultsView.jsx`, this overlaps with the planned ResultsView decomposition
(COMPAT/debt plan) — fixing accessibility per extracted subcomponent is the cheapest path.

## What static analysis cannot see (still unknown)

- **Focus management across phase transitions** — the whole view is replaced going
  intro → quiz → topics → demographics → results; focus likely stays on a removed node and
  screen-reader users get no announcement of the new screen.
- **The drag-based widget layout** — `react-grid-layout` drag handles have no keyboard
  equivalent; needs a policy decision (drag is a power feature; defaults must work without it).
- **Live announcements** — question changes, the min-answers gate modal, and result loading
  have no `aria-live` regions.
- **Contrast** — per-election themes (`config.theme`) are arbitrary; the peru_2026 palette
  needs a WCAG AA check, and ELECTIONS.md should note contrast as a constraint on new themes.
- Modal semantics: `role="dialog"`, `aria-modal`, focus trap, Escape handling in the
  restore/save/Capictive/FightMode modals.

## Next steps

1. Fix the interactive-div pattern (start with `QuizView` + `Menu` — small files, high
   traffic; take `ResultsView` alongside its planned decomposition).
2. Give icon-only controls accessible names (`aria-label`) — the 9
   `control-has-associated-label` sites.
3. Manual pass: axe DevTools on each phase; one full keyboard-only walkthrough; one
   VoiceOver/NVDA walkthrough; record findings here.
4. Add focus handling on phase transitions (move focus to the new view's heading,
   `aria-live="polite"` announcement).
5. When the warning count hits zero, flip the jsx-a11y rules from `warn` to `error` in
   `eslint.config.js`.
