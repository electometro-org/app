# Elections: configuration & data

Each election is a config module in `src/elections/`, registered in `src/elections/index.js`.
Current configs: `peru_2026.js` (enabled), `chile_2025.js` (disabled; kept as a legacy-format
example).

## Registry & enablement

```js
// src/elections/index.js
const allElections = [peru2026, chile2025];
```

Which elections are actually available:

- `VITE_ELECTION_ID=<id>` → single-election mode (selector skipped, election pre-selected)
- `VITE_ELECTION_ID=<id1>,<id2>` → multi-election mode restricted to those IDs
- unset → all configs with `enabled: true`

## Config reference

All fields, as used by `peru_2026.js` (the most complete example):

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique ID; also the assets folder name and the `data-election` attribute |
| `label` | string | Tolgee translation key for the election name |
| `enabled` | boolean | Included when `VITE_ELECTION_ID` is unset |
| `meta` | object | Build-time HTML metadata (`title`, `description`, `favicon`, `canonicalUrl`, `lang`) injected by `vite-plugin-election-html.js` |
| `regions` | string[] | Options for the demographics region dropdown |
| `assetsPath` | string | Subfolder for election assets (party logos, candidate photos) |
| `assetsBaseUrl` | string | Base URL for remote assets (usually `VITE_ELECTIONS_DATA_URL`) |
| `branding` | object | `logo`, `logoAlt`, `favicon` paths (resolved by `src/config/branding.js`) |
| `theme` | object | CSS-variable overrides applied to `:root` (defaults in `src/colors.js`) |
| `loadingScreen` | object | Splash overrides: `background`, `spinnerPrimary`, `spinnerSecondary` |
| `background` | object | Background config, see [BACKGROUNDS.md](BACKGROUNDS.md) |
| `partyVotesUrl` / `presVotesUrl` | string | Vote-data JSON URLs (the `/qa` prefix is added when `VITE_TOLGEE_QA_TRANSLATIONS=true`) |
| `isPresidentialElection` | boolean | Election has presidential candidates |
| `questionTypes` | string[] | Question sources; currently questions are loaded from `presVotesUrl` when it includes `"presidential"` |
| `resultTypes` | string[] | Result tabs: `"party"`, `"presidentialCandidates"` (`"parliamentaryCandidates"` reserved) |
| `rounds` | object[] | Multi-round support, see below |
| `minAnsweredRatioForResults` | number | Fraction of questions (0–1, default 0.5) required before the quiz can be finished |
| `processCandidateVote` | fn | Hook to transform candidate vote values (identity for Peru) |
| `showLawInfo` | boolean | Show legal/candidate background info where available |
| `mnemonicWordList` | string[256] | Word list for the save/share mnemonic codec (falls back to `DEFAULT_WORD_LIST` in `src/utils/mnemonicCodec.js`) |
| `widgets` | object[] | Widget instances, see [WIDGETS.md](WIDGETS.md) |
| `showIntro` | boolean | Per-election override for the election intro screen |
| `capictiveUrl` | string | Election-level CTA URL to the external Capictive comparison site |
| `showBattleMode` | boolean | Toggle the capibarismo.com "battle mode" CTA (default true) |

### Rounds

For elections with runoffs. `rounds` is an array; the **last** round is the default; the user
can switch on the election intro screen.

```js
rounds: [
  { id: "round1", label: "1ª Vuelta" },
  {
    id: "round2",
    label: "2ª Vuelta",
    allowedCandidates: ["c7", "c9"],       // filter results to runoff candidates
    allowedParties: ["p1", "p7", ...],     // parties still in parliament
    defaultResultType: "presidentialCandidates",
    capictiveUrl: "https://...",           // round-specific CTA (overrides config-level)
    showBattleMode: false,                 // round-specific override
  },
]
```

Round filtering happens after scoring (`filterCandidatesByRound` / `filterPartiesByRound` in
`src/services/resultsService.js`) and matches on compact-format IDs.

### Election-specific CSS & widgets

- `src/elections/<id>.css` is dynamically imported when the election is selected, and
  `<html data-election="<id>">` is set for scoping.
- Election-specific widgets live in `src/elections/<id>/widgets/` and self-register on import
  from the config module (see `peru_2026/widgets/ElectionBanner.jsx` → widget type
  `peru-banner`).

## Vote-data formats

The app understands two JSON formats, detected automatically (compact entries have an `id`
field). Local samples for Peru live in `json_data/`.

### Compact (current — Peru 2026)

Short keys: questions `t1, t2, …`, candidates `c1, …`, parties `p1, …`.

```jsonc
{
  "version": "1.2.3",              // semantic quiz-data version (drives mnemonic checks)
  "quiz": {
    "t1": { "question": "…", "topic": "…" }
  },
  "candidates": {                   // in the pres file
    "c1": {
      "id": "c1",
      "name": "Full Name (Party)",
      "party": { "id": "p1", "name": "Party Name" },
      "votes": {
        "t1": { "vote": 1, "comment": "…", "source": "https://…" }
      }
    }
  },
  "parties": { "p1": { "id": "p1", "name": "…", "votes": { … } } }  // in the party file
}
```

Translation keys are derived from IDs: `quiz.questions.t1`, `quiz.topics.t1`, and entity
comments as `explanations.candidates.c1.t1` / `explanations.parties.p1.t1`.

### Legacy (Chile 2025)

Entities keyed by display name (`"Full Name (Party)"`), each vote carrying its own
`question`, `question_key`, `topic_key`, `comment_key`. Questions are derived by scanning all
candidates' votes.

### Semantics shared by both formats

- `vote`: 1 = agree, 0.5 = neutral, 0 = disagree (numeric strings accepted).
- A `vote` of 0.5 **without** a `source` is treated as "position unknown" and excluded from
  scoring (imputed neutral).
- `version` (compact only) feeds the version-mismatch warnings when restoring shared results.

## Adding a new election

1. Create `src/elections/<id>.js` (copy `peru_2026.js`) and fill the fields above.
2. Add it to `allElections` in `src/elections/index.js`.
3. Optionally add `src/elections/<id>.css` and `src/elections/<id>/widgets/`.
4. Publish the vote-data JSON under `<VITE_ELECTIONS_DATA_URL>/<id>/…` (and `/qa/<id>/…`), and
   election assets (logos: `party_logos/`, candidate photos) in the assets bucket/repo.
   Asset files are probed with multiple extensions (png/jpg/jpeg/svg) using slugified names —
   see `slugifyAssetName` in `ResultsView.jsx`.
5. Add translation keys in Tolgee (election label, `welcome.<id>.*`, quiz/topic keys,
   explanations).
6. Test with `VITE_ELECTION_ID=<id> npm run dev` (use `VITE_USE_LOCAL_DATA=true` with local
   JSON under `public/` before the bucket exists).
