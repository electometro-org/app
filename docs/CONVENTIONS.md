# Project Conventions

This document is the source of truth for Electometro's file naming and folder organization. It
describes the current migration target; some legacy names may still exist until the refactor is
completed.

## Naming Rules

| Kind | Rule | Example |
| --- | --- | --- |
| React components and views | `PascalCase.jsx` | `LoadingScreen.jsx`, `ResultsView.jsx` |
| Hooks | `useSomething.js` | `useQuiz.js`, `useFingerprint.js` |
| Services | `somethingService.js` | `resultsService.js` |
| Context files | `SomethingContext.jsx` | `QuizContext.jsx` |
| Config, constants, utilities | `camelCase.js` | `appConfig.js`, `answerMappings.js` |
| CSS paired with a component | Same base name as the component | `LoadingScreen.jsx` + `LoadingScreen.css` |
| `index.js` | Barrel exports only | `src/widgets/index.js` |

Rule of thumb: if a file exports a React component, use PascalCase. If it exports logic, data, or
helpers, use camelCase.

## Target Folder Layout

Use lowercase plural folder names for shared areas:

```text
src/
├── components/
├── views/
├── services/
├── hooks/
├── contexts/
├── utils/
├── config/
├── constants/
├── features/
└── shared/
```

Election-specific code may live under `src/elections/<election_id>/` when it is not reusable.

## Rename Map

| Current | Target |
| --- | --- |
| `src/components/contact.jsx` | `src/components/Contact.jsx` |
| `src/components/menu.jsx` | `src/components/Menu.jsx` |
| `src/components/methodology.jsx` | `src/components/Methodology.jsx` |
| `src/components/privacyPolicy.jsx` | `src/components/PrivacyPolicy.jsx` |
| `src/components/demographicsForm.jsx` | `src/components/DemographicsForm.jsx` |
| `src/components/analyticsTracker.jsx` | `src/components/AnalyticsTracker.jsx` |
| `src/voteUtils.jsx` | `src/utils/voteUtils.js` |
| `src/useFingerprint.js` | `src/hooks/useFingerprint.js` |
| `src/useQuiz.js` | remove / merge into `src/hooks/useQuiz.js` |
| `src/analytics.js` | `src/utils/analytics.js` |
| `src/debug.js` | `src/utils/debug.js` |
| `src/colors.js` | `src/config/colors.js` |
| `src/tolgee.js` | `src/config/tolgee.js` |

## Import Guidelines

- Prefer importing from the closest stable module path.
- Avoid deep imports into election-specific implementation files unless the code is also
  election-specific.
- Use registry APIs for widgets, backgrounds, and elections instead of adding cross-cutting switch
  statements.
- Keep pure logic in `services/` or `utils/`; keep UI composition in `components/` and `views/`.
