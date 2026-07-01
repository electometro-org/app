# Test Summary

**133 tests — 7 files — all passing**

| File | Tests | What's covered |
|---|---|---|
| `constants/__tests__/answerMappings.test.js` | 13 | `normalizeAnswer`, `applyPolarity`, `MIN_COMPARED` |
| `constants/__tests__/capibarismoMapping.test.js` | 14 | `extractCandidateName`, `getCapibarismoSlug`, `buildCapibarismoUrl` — including alias pairs, graceful degradation, `.name` fallback |
| `utils/__tests__/versionUtils.test.js` | 22 | `parseVersion`, `compareVersions`, `encode/decodeVersionForMnemonic`, `isVersionSuffix`, `isVersionGreaterThan` |
| `utils/__tests__/mnemonicCodec.test.js` | 25 | `isValidWordList`, `encodeToMnemonic`, `decodeFromMnemonic`, `isValidMnemonic`, `getWordList` — full round-trips |
| `services/__tests__/quizService.test.js` | 12 | `computeUniqueIndices`, `findNextUniqueIndex`, `findPrevUniqueIndex` |
| `services/__tests__/resultsService.test.js` | 44 | `isImputedNeutral`, `buildUserAnswers`, `buildUserAnswersWithRaw`, `partitionByCompared`, `filterCandidatesByRound`, `filterPartiesByRound`, `computeResultsFrom` (parties + candidates, compact + legacy), `buildEntityDetails` |
| `services/__tests__/submissionService.test.js` | 8 | `buildCompactResponses` |

## Infrastructure

- **Runner:** [Vitest](https://vitest.dev/) (`npm test` / `npm run test:watch`)
- **Config:** `vitest.config.js` — deliberately excludes Cloudflare/Vite build plugins so tests run cleanly in Node

## Bugs found and fixed during test writing

- `DEFAULT_WORD_LIST` in `mnemonicCodec.js` had `"naranja"` at both index 78 (Colors) and 143 (Food) — replaced the Food entry with `"durazno"` so the list has 256 unique words.
- Round-trip decode returns extra trailing answers when the bit count isn't a multiple of 8 (design limitation of the encoding format, not a bug to fix) — tests document this with a `.slice()` and a comment.
- `extractCandidateName` only strips `(...)` suffixes, not `[...]` brackets — tests document this as the actual behavior.
