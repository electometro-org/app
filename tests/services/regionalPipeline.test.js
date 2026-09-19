import { describe, it, expect } from "vitest";
import { buildRegionalQuestions, toVotesData, listRegions } from "../../src/services/regionalService";
import { buildUserAnswers, buildEntityDetails, computeResultsFrom, isImputedNeutral } from "../../src/services/resultsService";
import { encodeToMnemonic, decodeFromMnemonic, isValidMnemonic } from "../../src/utils/mnemonicCodec";
import config from "../../src/elections/peru_regional_2026";

const vote = (v, source = "https://example.org/plan.pdf") => ({ vote: v, comment: "c", source });

const data = {
  version: "1.0.0",
  regions: {
    r1: {
      id: "r1",
      name: "Región Uno",
      quiz: {
        PE1: { id: "PE1", topic: "Salud pública", question: "Q1" },
        L1: { id: "L1", topic: "Transporte", question: "Q2" },
        L2: { id: "L2", topic: "Empleo", question: "Q3" },
      },
      candidates: {
        c1: { id: "c1", name: "Ana Uno", party: { name: "Partido A" }, votes: { PE1: vote(1), L1: vote(0), L2: vote(0.5, "") } },
        c2: { id: "c2", name: "Beto Dos", party: { name: "Partido B" }, votes: { PE1: vote(0), L1: vote(1) } },
      },
    },
    r2: {
      id: "r2",
      name: "Región Dos",
      quiz: {
        PE1: { id: "PE1", topic: "Salud pública", question: "Q1" },
        AR1: { id: "AR1", topic: "Agua", question: "Q4" },
      },
      candidates: {
        c1: { id: "c1", name: "Carla Tres", party: { name: "Partido C" }, votes: { PE1: vote(1), AR1: vote(1) } },
      },
    },
  },
};

describe("regional pipeline", () => {
  it("scores each region's candidates from its own questions", () => {
    for (const { id } of listRegions(data)) {
      const questions = buildRegionalQuestions(data.regions[id]);
      const answers = questions.map(() => "answers.agreeCapitalized");
      const userAnswers = buildUserAnswers(questions, answers, questions.map(() => 1));
      const results = computeResultsFrom(toVotesData(data, id), "candidates", userAnswers, { isImputedNeutral });

      expect(results).toHaveLength(Object.keys(data.regions[id].candidates).length);
      expect(results.every(r => typeof r.party === "string")).toBe(true);
      expect(results.some(r => r.compared_questions > 0)).toBe(true);
    }
  });

  it("ranks the candidate closest to the user first", () => {
    const questions = buildRegionalQuestions(data.regions.r1);
    const userAnswers = buildUserAnswers(
      questions,
      ["answers.agreeCapitalized", "answers.disagreeCapitalized", null],
      [1, 1, 1]
    );
    const [top] = computeResultsFrom(toVotesData(data, "r1"), "candidates", userAnswers, { isImputedNeutral });
    expect(top.name).toBe("Ana Uno");
    expect(top.similarity_score).toBe(100);
  });

  it("builds entity details with inline texts and no translation keys", () => {
    const votes = toVotesData(data, "r1");
    const details = buildEntityDetails(votes.candidates.c1, {}, "presidential", votes);
    expect(details.details.map(d => d.question)).toEqual(["Q1", "Q2", "Q3"]);
    expect(details.details.every(d => d.question_key === null && d.topic_key === null && d.comment_key === null)).toBe(true);
    expect(details.details[0].tema).toBe("Salud pública");
  });
});

describe("regional mnemonic round trip", () => {
  const choices = ["answers.agreeCapitalized", "answers.neutralCapitalized", "answers.disagreeCapitalized", null];

  it("restores region, answers, weights and version for every region", () => {
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
