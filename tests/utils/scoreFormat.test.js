import { describe, it, expect } from "vitest";
import { formatScore } from "../../src/utils/scoreFormat";

describe("formatScore", () => {
  it("formats numeric scores as percentages", () => {
    expect(formatScore(87)).toBe("87%");
    expect(formatScore(0)).toBe("0%");
    expect(formatScore("55")).toBe("55%");
  });

  it("shows a dash when there is no score", () => {
    expect(formatScore(null)).toBe("—");
    expect(formatScore(undefined)).toBe("—");
    expect(formatScore("")).toBe("—");
    expect(formatScore(NaN)).toBe("—");
  });
});
