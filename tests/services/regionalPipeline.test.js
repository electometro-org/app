import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { buildRegionalQuestions, toVotesData, listRegions } from "../../src/services/regionalService";
import { buildUserAnswers, buildEntityDetails, computeResultsFrom, isImputedNeutral } from "../../src/services/resultsService";

const file = "tmp/combined_votes_peru_regions_2026_compact.json";

describe.skipIf(!existsSync(file))("regional data end to end", () => {
  const data = existsSync(file) ? JSON.parse(readFileSync(file, "utf-8")) : null;

  it("scores every region's candidates from its own questions", () => {
    for (const { id } of listRegions(data)) {
      const questions = buildRegionalQuestions(data.regions[id]);
      const answers = questions.map(() => "answers.agreeCapitalized");
      const userAnswers = buildUserAnswers(questions, answers, questions.map(() => 1));
      const votes = toVotesData(data, id);
      const results = computeResultsFrom(votes, "candidates", userAnswers, { isImputedNeutral });
      expect(results).toHaveLength(Object.keys(data.regions[id].candidates).length);
      expect(results.every(r => typeof r.party === "string")).toBe(true);
      expect(results.some(r => r.compared_questions > 0)).toBe(true);

      const first = votes.candidates[results[0].id];
      const details = buildEntityDetails(first, {}, "presidential", votes);
      expect(details.details.every(d => d.question_key === null && d.question)).toBe(true);
    }
  });
});

describe.skipIf(!existsSync(file))("regional mnemonic round trip on real data", () => {
  it("restores region, answers and weights for every region", async () => {
    const { encodeToMnemonic, decodeFromMnemonic, isValidMnemonic } = await import("../../src/utils/mnemonicCodec");
    const { default: config } = await import("../../src/elections/peru_regional_2026");
    const data = JSON.parse(readFileSync(file, "utf-8"));
    const choices = ["answers.agreeCapitalized", "answers.neutralCapitalized", "answers.disagreeCapitalized", null];

    for (const { id } of listRegions(data)) {
      const questions = buildRegionalQuestions(data.regions[id]);
      const answers = questions.map((_, i) => choices[i % 4]);
      const weights = questions.map((_, i) => (answers[i] && i % 3 === 0 ? 2 : 1));

      const phrase = encodeToMnemonic(answers, weights, config.mnemonicWordList, data.version, { regionId: id });
      expect(isValidMnemonic(phrase, config.mnemonicWordList)).toBe(true);

      const decoded = decodeFromMnemonic(phrase, config.mnemonicWordList, { withRegion: true });
      expect(decoded.regionId).toBe(id);
      expect(decoded.version).toBe(data.version);
      expect(decoded.answers.slice(0, questions.length)).toEqual(answers);
      expect(decoded.weights.slice(0, questions.length)).toEqual(weights);
    }
  });
});
