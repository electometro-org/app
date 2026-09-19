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
