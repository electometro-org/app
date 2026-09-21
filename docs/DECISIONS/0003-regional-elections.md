# ADR 0003: Regional Elections — Per-Region Data, Separate Storage, Fluid Quiz Layout

## Status

Accepted. Extends the election registry described in
[ADR 0001](0001-initial-architecture.md) and the hook composition from
[ADR 0002](0002-architecture-refactor.md).

## Context

Peru's 2026 regional elections need the same voting-advice flow as the national one, with three
differences: the voter chooses a region first, the questions and candidates are specific to that region
(quiz ids even differ between regions), and results are candidates only. The UX review of the same
release also asked for a more compact, branded quiz screen that fits small phones without scrolling.

## Decision

1. **One election, one data file, region as state.** A single election config (`peru_regional_2026`,
   spreading `peru_2026`) reads one JSON file with a `regions` map. The chosen region lives in
   `useElectionFlow`; `useQuiz`, `useResultsComputation` and `useMnemonicRestore` receive it. Pure
   loading/shaping logic is in `services/regionalService.js` (cached fetch, region list, question and
   votes shaping); the region picker reads it through `hooks/useRegionalData`.
2. **Reuse the candidate ranking.** Regional votes are shaped like the presidential votes file and scored
   by the existing pipeline (`presidentialCandidates` result type). `buildEntityDetails` gets an
   `inlineText` mode because question/topic/comment texts come from the file, not Tolgee.
3. **Region inside the mnemonic.** An optional leading word encodes the region (`r<N>` → word *N*).
   `encodeToMnemonic`/`decodeFromMnemonic` take an options object, so national phrases are unchanged.
   Restoring loads the region's questions itself and marks them loaded (`loadedRegionId`) so the normal
   loader does not reset the restored answers.
4. **Separate storage.** Submissions carry an optional `region_id`. The Worker (and the fallback route)
   routes them to a dedicated table created by `db/regional.sql`, which clones the answers table and
   reuses its validation triggers; the rate-limit function counts both tables. Alternatives considered:
   a `region_id` column on the existing table (rejected: mixes quiz ids and analytics across elections)
   and per-election tables chosen by config (rejected: the deploy dropdown would then have to configure
   the Worker too).
5. **Opt-in layout flags instead of forking the quiz view.** `regional`, `styleId`, `inlineProgress`,
   `topicHeader` and `quizTopLine` switch on the new behaviour per election; other elections keep the
   classic layout. `styleId` lets the regional election reuse `peru_2026.css` (whose rules are scoped by
   `data-election`).
6. **Fluid, tunable quiz screen.** Sizes use `clamp()` on viewport height/width with a phone-friendly base
   and a steeper scale from 768px up, multiplied by `--q-*` CSS variables so designers can tune values
   live in the browser. The progress bar is rendered in-flow under the card because docked widgets
   only reserve space and sit at fixed grid coordinates.

## Consequences

Positive:

- One deploy dropdown (`election_id`) switches the whole app; no per-election Worker configuration.
- National elections and their saved links are unaffected (all changes are optional parameters or flags).
- Layout tuning does not require code changes, and every value has a documented variable.

Tradeoffs / open items:

- Regional question and topic texts are **not translatable** (inline data); switching to Quechua or
  Aymara translates only the interface.
- Saved results are positional: **any quiz change in the data file must bump `version`**.
- Region numbers are limited to 255 by the one-word encoding.
- `db/regional.sql` is not re-runnable and must run before a Worker that sends `region_id`.
- Long questions and topics adapt instead of being cut off: the question box grows with its text, the
  card header shrinks the topic to one line (down to 11px, then stacks words), and the question text
  shrinks (down to 12px) only as far as needed to fit the screen height. Even so, the longest questions
  (Piura has the longest, 295 characters) still scroll on small screens. Measured on the longest question of
  each region (extra scroll): 320×568 ≈ 130–160px, 360×640 ≈ 55–90px, 393×851 ≈ 1px, 768×1024 and
  1024×768 ≈ 8px; none at 1366×768, 1440×900 and 1920×1080, and no question is clipped at any size. An
  earlier version of this ADR listed smaller phone numbers because a fixed-height phone rule was clipping
  long questions and hiding the height; size sweeps must check clipping and include the region with the
  longest text. Levers: `--q-question-scale`, `--q-option-scale`, `--q-top-offset`, the logo (hidden by
  default) and the card padding.
- The privacy notice can cover the intro's Start button on ≈360×640 screens.
- Only Spanish and the regional election were verified end to end.

## Follow-up Work

- Decide how to handle the remaining small-screen overflow (e.g. shrinking the header block on short
  screens) and re-run the size matrix after any spacing change.
- Translate the new interface keys (`regions.*`, `welcome.peru_regional_2026.*`, short election names)
  in Quechua and Aymara, and promote them QA → prod.
- Normalize party names in the regional data file (spelling variants each need their own logo file).
