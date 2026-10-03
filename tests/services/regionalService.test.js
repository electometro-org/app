import { describe, it, expect } from "vitest";
import {
  buildRegionalQuestions,
  listRegions,
  regionIdFromNumber,
  regionNumber,
  slugifyTopic,
  toVotesData,
} from "../../src/services/regionalService";

const data = {
  version: "1.0.0",
  regions: {
    r2: {
      id: "r2",
      name: "Piura",
      quiz: { PE1: { id: "PE1", topic: "Salud pública", question: "Q1" } },
      candidates: { c1: { id: "c1", name: "A", party: { name: "P" }, votes: {} } },
    },
    r1: {
      id: "r1",
      name: "Áncash",
      quiz: {
        PE1: { id: "PE1", topic: "Salud pública", question: "Q1" },
        L1: { id: "L1", topic: "Transporte", question: "Q2" },
      },
      candidates: {},
    },
  },
};

describe("regionalService", () => {
  it("slugifies topics without accents or punctuation", () => {
    expect(slugifyTopic("Salud pública")).toBe("salud-publica");
    expect(slugifyTopic("  Hospitales de la Solidaridad ")).toBe("hospitales-de-la-solidaridad");
  });

  it("converts region ids to numbers and back", () => {
    expect(regionNumber("r12")).toBe(12);
    expect(regionNumber("x1")).toBeNull();
    expect(regionIdFromNumber(12)).toBe("r12");
    expect(regionIdFromNumber(-1)).toBeNull();
  });

  it("lists regions sorted by name with counts", () => {
    const list = listRegions(data);
    expect(list.map(r => r.name)).toEqual(["Áncash", "Piura"]);
    expect(list[0]).toMatchObject({ id: "r1", questionCount: 2, candidateCount: 0 });
  });

  it("builds questions with Tolgee keys namespaced by region", () => {
    const qs = buildRegionalQuestions(data.regions.r1);
    expect(qs).toHaveLength(2);
    expect(qs[1]).toMatchObject({
      id: "L1",
      question: "Q2",
      tema: "Transporte",
      question_key: "quiz.questions.r1.L1",
      topic_key: "quiz.topics.r1.L1",
    });
  });

  it("namespaces keys by region so a shared id can differ per region", () => {
    // PE1 exists in both r1 and r2 with the same text here, but the keys must still differ:
    // nothing stops a future data update from giving PE1 different wording per region.
    const r1Qs = buildRegionalQuestions(data.regions.r1);
    const r2Qs = buildRegionalQuestions(data.regions.r2);
    expect(r1Qs.find(q => q.id === "PE1").question_key).toBe("quiz.questions.r1.PE1");
    expect(r2Qs.find(q => q.id === "PE1").question_key).toBe("quiz.questions.r2.PE1");
  });

  it("exposes a region as presidential-style votes data, carrying its regionId", () => {
    const votes = toVotesData(data, "r2");
    expect(votes.version).toBe("1.0.0");
    expect(votes.regionId).toBe("r2");
    expect(votes.candidates.c1.name).toBe("A");
    expect(toVotesData(data, "nope")).toBeNull();
  });
});
