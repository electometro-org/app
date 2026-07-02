# Background system (`src/backgrounds/`)

A small registry-based plugin system that renders one full-viewport background per election,
behind all content (z-index 0, `pointer-events: none`). The widget system
([WIDGETS.md](WIDGETS.md)) follows the same pattern.

## Files

```
src/backgrounds/
├── index.js                # Public API (re-exports registry + provider + layer)
├── registry.js             # registerBackground / getBackground / getBackgroundTypes / hasBackground
├── BackgroundContext.jsx   # Reads config.background from the election config;
│                           #   applies optional colorScheme override on <html>
├── BackgroundLayer.jsx     # Renders the active type (fallback: solid)
├── BackgroundLayer.css
└── types/                  # Built-in types, registered in types/index.js
    ├── SolidBackground.jsx
    ├── ImageBackground.jsx
    ├── SlideshowBackground.jsx
    └── GradientBackground.jsx
```

`BackgroundProvider` wraps the app in `main.jsx`; `BackgroundLayer` is rendered by `App.jsx`.

## Configuration

Set `background` in the election config (defaults in `src/config/backgroundDefaults.js`, which
also documents these options next to the code):

```js
// Solid (default) — uses var(--background) unless color is given
background: { type: 'solid', color: '#123456' }

// Image
background: {
  type: 'image',
  src: 'peru_2026/backgrounds/lima.jpg',   // required
  size: 'cover',                            // cover | contain | auto
  position: 'center',                       // CSS background-position
  colorScheme: 'light dark',                // optional <html> color-scheme override
  overlay: { color: 'rgba(0,0,0,0.4)' },    // optional overlay
}

// Slideshow
background: {
  type: 'slideshow',
  images: ['…/a.jpg', '…/b.jpg'],           // required
  mode: 'per-question',                     // per-question | timed
  interval: 5000,                           // ms, timed mode
  transitionDuration: 600,                  // ms
  // size / position / overlay as above
}

// Gradient
background: {
  type: 'gradient',
  colors: ['#005050', '#00352c'],           // ≥ 2 colors
  speed: 10,                                // animation duration, seconds
  direction: 'diagonal',                    // horizontal | vertical | diagonal
  reactive: false,                          // speed up as the quiz progresses
}
```

`per-question` slideshows advance with `currentQuestionIndex`; `reactive` gradients read quiz
progress — both get their state from `BackgroundContext`.

## Custom types

```js
import { registerBackground } from '../backgrounds/registry';

registerBackground({ id: 'starfield', component: StarfieldBackground });
```

The component receives `{ config, quizState }`. Register against `registry.js` directly (not
`index.js`) — that indirection exists to avoid a circular dependency between the layer and the
types.
