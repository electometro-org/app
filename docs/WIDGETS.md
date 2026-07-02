# Widget system (`src/widgets/`)

A registry-based layout system where **every visible UI block — including the quiz itself — is
a widget** on a `react-grid-layout` canvas. Widgets have per-breakpoint default positions,
can (optionally) be dragged/resized by the user, can be shown only in certain quiz phases, and
can *dock* into anchor points inside the quiz card.

The system mirrors the background system's plugin pattern (see
[BACKGROUNDS.md](BACKGROUNDS.md)): a dependency-free `registry.js`, self-registering
`types/index.js`, a context provider, and a render layer.

## Files

```
src/widgets/
├── index.js               # Public API (re-exports everything below)
├── registry.js             # registerWidget / getWidget / getWidgetTypes / hasWidget
├── WidgetContext.jsx        # Provider: phase computation, docking state, gauge preview
├── WidgetLayout.jsx         # react-grid-layout canvas; renders widget instances
├── WidgetLayout.css
├── DockingZone.jsx / DockingZone.css
├── useDocking.js            # useDockingZone / useWidgetDocking / useActiveDocks / useDraggingWidget
├── useLayoutPersistence.js  # per-election localStorage persistence
└── types/                   # built-in widgets (self-register on import)
    ├── QuizWidget.jsx        # wraps the main quiz content
    ├── ProgressIndicator.jsx # dots/bar/fraction progress
    ├── CountdownTimer.jsx
    ├── SocialShare.jsx
    ├── PlaceholderWidget.jsx # layout prototyping helper
    ├── Gauge.jsx             # opinion/importance gauge (currently disabled in configs)
    └── OpinionButtons.jsx    # combined opinion+importance buttons (currently disabled)
```

## Instantiating widgets (election config)

Widgets are declared per election in `config.widgets` (see `src/elections/peru_2026.js`,
which also keeps commented-out examples of every built-in type):

```js
widgets: [
  {
    type: "progress-indicator",  // registered widget type
    id: "main-progress",         // optional; required for multiple instances of one type
    defaultSlot: "top",
    style: "dots",
    showOnPhase: ["quiz"],       // phases: intro, election-intro, loading, quiz,
                                 //         topic-importance, demographics, results
    draggable: true,             // default true (quiz widget is never draggable)
    resizable: false,            // default false
    invisible: false,            // render container without visible chrome
    layouts: {                   // per-breakpoint grid placement {x, y, w, h}
      lg: { x: 34, y: 10, w: 28, h: 4 },
      xxs: { x: 3, y: 12, w: 18, h: 5 },
    },
    // Old-browser variants (see "Legacy layout mode"):
    legacyLayouts: { … },
    legacyLayoutsOnPhases: ["results"],  // restrict legacy variant to given phases
    keepLegacySize: true,
    keepLegacyPosition: true,
    // Docking (see below):
    dockedTo: "above-question",
    dockTransition: {
      duration: 300, easing: "ease-out",
      widget: { effect: "fadeDown", duration: 400, easing: "ease-out" },
    },
  },
]
```

Type-specific options (emoji sets, colors, `duration`, `blockDuration`, …) are passed through
to the widget component; each type declares `defaults` at registration.

## Grid model (`WidgetLayout.jsx`)

- Breakpoints: `lg` 1200 / `md` 996 / `sm` 768 / `xs` 480 / `xxs` 0 (px min-width).
- Columns per breakpoint: 96 / 72 / 48 / 32 / 24; `rowHeight` is 8px — a deliberately fine
  grid for near-pixel placement.
- Compaction is disabled and overlap allowed (custom compactor), so widgets stay exactly where
  configured/dragged.
- The quiz widget renders the `children` passed to `<WidgetLayout>` (i.e. the current view)
  and is pinned (`draggable: false`).
- `showOnPhase` filters which instances are mounted; the phase comes from
  `getQuizPhase()` in `WidgetContext.jsx`.

### Legacy layout mode

`shouldUseLegacyLayoutMode()` feature-detects old engines (no `gap`/`inset` support, i.e.
Safari ≤ ~14). When active, widgets use `legacyLayouts` (typically taller quiz boxes so
results don't clip on iOS 12), optionally limited to phases via `legacyLayoutsOnPhases`.

## Persistence (`useLayoutPersistence.js`)

Drag/resize changes are saved to `localStorage` under `electometro-layout-<electionId>`.
Enabled in dev by default; controlled by `VITE_ENABLE_LAYOUT_PERSISTENCE` (`1/true/yes/on`).

## Docking (`useDocking.js`, `DockingZone.jsx`)

Quiz internals expose docking zones — `above-question`, `below-question`, `above-buttons`,
`below-buttons` — by rendering `<DockingZone id="…">` (done in `QuizView.jsx`). A widget with
`dockedTo: "<zone>"` is positioned onto that zone instead of its grid slot; the zone renders a
placeholder to reserve space and `dockTransition` animates the handoff. `WidgetContext` keeps
the registries of zones/widget elements and resolves pending docks once both sides are mounted.

## Shared interaction state

`WidgetContext` also coordinates cross-widget UI: `gaugePreview` lets `OpinionButtons` drive
the `Gauge` on hover, with a shared 20fps pulse (`pulseOpacity`) so all previewing elements
blink in sync.

## Writing a custom widget

```jsx
// src/elections/my_election/widgets/MyWidget.jsx
import { registerWidget } from '../../../widgets/registry';

function MyWidget({ config, quizState }) {
  // quizState: { phase, displayIndex, totalQuestions, branding, … }
  return <div className="my-widget">{config.title}</div>;
}

registerWidget({
  id: 'my-widget',
  component: MyWidget,
  defaults: { title: 'Hello' },
});
```

Import the file from the election config module (like `peru_2026.js` does with
`import './peru_2026/widgets'`), then add `{ type: 'my-widget', layouts: { … } }` to
`config.widgets`. Register via `registry.js` directly (not `index.js`) to avoid the circular
dependency described in the pattern notes.
