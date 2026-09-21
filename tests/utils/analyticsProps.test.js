import { describe, it, expect } from "vitest";
import { sanitizeEventProps } from "../../src/utils/analyticsProps";

describe("sanitizeEventProps", () => {
  it("keeps strings and finite numbers", () => {
    expect(sanitizeEventProps({ a: "x", b: 2, c: 0 })).toEqual({ a: "x", b: 2, c: 0 });
  });

  it("converts booleans to strings", () => {
    expect(sanitizeEventProps({ ok: true, no: false })).toEqual({ ok: "true", no: "false" });
  });

  it("drops null, undefined, NaN, objects and arrays", () => {
    expect(sanitizeEventProps({ a: null, b: undefined, c: NaN, d: { x: 1 }, e: [1], f: "ok" })).toEqual({ f: "ok" });
  });

  it("truncates very long strings", () => {
    expect(sanitizeEventProps({ s: "a".repeat(500) }).s).toHaveLength(200);
  });

  it("returns an empty object for non-objects", () => {
    expect(sanitizeEventProps(null)).toEqual({});
    expect(sanitizeEventProps("nope")).toEqual({});
  });
});
