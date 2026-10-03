# ADR 0004: Regional Election Text via Region-Namespaced Translation Keys

## Status

Accepted. Supersedes decision #2 of [ADR 0003](0003-regional-elections.md) (regional question/topic/
comment text rendered inline, bypassing Tolgee) and resolves the "not translatable" tradeoff it listed.

## Context

ADR 0003 shipped regional elections with question, topic and candidate-explanation text read straight
from the compact JSON (`inlineText` mode in `regionalService.js`/`resultsService.js`), deliberately
bypassing Tolgee. That was reasonable for a first cut, but it meant regional content could never be
translated into Quechua or Aymara — switching language only ever changed interface chrome, never the
quiz itself, unlike the presidential flow, which has always had Quechua/Aymara quiz text via
`quiz.questions.<id>` / `quiz.topics.<id>` / `explanations.<entityType>.<id>.<topicId>` Tolgee keys,
populated by `external/peru-assets/app/scripts/merge_i18n_keys_from_json_with_qa.py` in CI.

Presidential and regional use the same compact-JSON-to-Tolgee machinery conceptually, but the data
shapes differ: presidential ids (`c1`, `p1`, `t1`) are globally unique; regional ids are **not** — the
same quiz id (e.g. `PE1`) can appear in multiple regions (and, in this data, happens to share identical
wording today, but nothing guarantees that going forward), and candidate ids are reused across regions
for **entirely different people** (region `r1`'s `c1` and region `r2`'s `c1` are different candidates,
confirmed against real submitted data — their comments for the same topic differ). A flat key scheme
copied from the presidential shape would therefore silently merge or overwrite one region's text with
another's the first time two regions' data diverged.

## Decision

1. **Namespace every regional key by region id:** `quiz.questions.<regionId>.<id>`,
   `quiz.topics.<regionId>.<id>`, `explanations.candidates.<regionId>.<candidateId>.<topicId>`. No
   `explanations.parties.*` for regional (regional candidates carry a party *name*, not a translated
   explanation, in this data).
2. **Extend, don't replace, the existing pipeline.** `merge_i18n_keys_from_json_with_qa.py` gains
   `generate_regional_i18n_structure()`, reading an optional
   `combined_votes_peru_regions_2026_compact.json` alongside the two presidential files it already
   requires; its output is deep-merged into the same `i18n_structure` dict before the single write to
   `es-qa.json`. Missing regional data is a warning, not a failure — the presidential pipeline must not
   break because a regional file hasn't been published yet. The regional file's own `version` is
   tracked separately as `data.version.qaRegional` (distinct from `data.version.qa`, since the two data
   files now change independently).
3. **Extractor becomes shape-agnostic.** Rather than add a second fixed-depth loop per key family to
   `tolgee-extractor.js` (doubling the national/regional branching for every future shape), it now
   recursively walks each of the four roots (`quiz.questions`, `quiz.topics`,
   `explanations.parties`, `explanations.candidates`) and emits one key per string leaf found, however
   deep. National (1–2 levels) and regional (2–3 levels) keys fall out of the same walk with no
   shape-sniffing.
4. **The JSON text always travels as the Tolgee default value** (`t(key, jsonText)`, never `t(key)`
   alone) at every regional render site (`QuizView`, `TopicImportanceView`, `ResultsView`). This was
   inconsistently applied before (some sites used `t(key) === key` to detect a missing key, which is
   unreliable — confirmed earlier in this project to misfire depending on Tolgee dev-tooling); it is now
   uniform. The practical effect: deploying the app-code change and running the key-extraction pipeline
   are **order-independent** — a region's quiz is always readable in Spanish immediately, and upgrades
   to a real translation whenever Tolgee has one, with no "raw key visible" window either way.

## Consequences

Positive:

- Regional quiz content becomes translatable into Quechua and Aymara on the same infrastructure the
  presidential flow already uses — no new translation tooling.
- The region-namespaced scheme is proven against real data: region `r1`'s candidate `c1` and region
  `r2`'s candidate `c1` are different people with genuinely different `PE1` comments in the current
  dataset, which a flat key would have corrupted on the very first merge.
- `buildEntityDetails`'s `inlineText` branch is gone; there is now exactly one way regional and
  presidential entity details build their translation keys (same function, region id threaded through
  instead of a mode flag).

Tradeoffs / open items:

- Regional candidate ids repeat heavily across regions (by design — they're per-region sequence
  numbers), so this generates one Tolgee key set per region even where wording is identical today
  (e.g. all three regions' `PE1` question text). This trades a larger key count for correctness against
  future divergence; deduplicating shared-and-identical ids was considered and rejected as fragile
  (a region editing its `PE1` wording would then need to notice it's no longer safe to share).
- `generate_regional_i18n_structure()` requires the regional compact JSON to already be live in the
  `electometro-org.github.io` data repo at the path the script expects
  (`json/latest/combined_votes_peru_regions_2026_compact.json`); it does not read from this app repo's
  `tmp/` scratch copies.
- Getting newly added keys into Tolgee durably still requires the real `tolgee push` step (the
  `update-upload-translations` job in `release-qa.yml`, or a manual CLI push) — editing `es-qa.json`
  locally without pushing is temporary, since the daily `pull-qa-translations.yml` cron overwrites it
  from Tolgee's actual state (this was already true for every other key family; it now also applies to
  regional keys).
- Quechua/Aymara translations for regional content are not automated by any of this — only the key
  *plumbing* is. Someone still has to translate them in Tolgee.

## Follow-up Work

- Run the extended pipeline once against the current regional dataset and push the resulting keys to
  Tolgee, so translators can start on Quechua/Aymara regional content.
- Consider whether `data.version.qaRegional` should also be read anywhere app-side (today only
  `data.version.qa`/`data.version.production` are consumed by the promote script; the regional version
  is tracked for operator visibility, not currently wired into any automated check).
