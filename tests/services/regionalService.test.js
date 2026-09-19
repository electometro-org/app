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

  it("builds inline-text questions for a region", () => {
    const qs = buildRegionalQuestions(data.regions.r1);
    expect(qs).toHaveLength(2);
    expect(qs[1]).toMatchObject({
      id: "L1",
      question: "Q2",
      tema: "Transporte",
      question_key: null,
      topic_key: "regional.topics.transporte",
      inlineText: true,
    });
  });

  it("exposes a region as presidential-style votes data", () => {
    const votes = toVotesData(data, "r2");
    expect(votes.version).toBe("1.0.0");
    expect(votes.candidates.c1.name).toBe("A");
    expect(toVotesData(data, "nope")).toBeNull();
  });
});
