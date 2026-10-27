import { describe, expect, it } from "vitest";
import { academicYear, defaultStartTerm, nextTerm, parseTerm, previousTerm, termLabel, termRange, toTermCode } from "./terms";

describe("terms", () => {
  it("parses and formats UMN term codes", () => {
    expect(parseTerm("1259")).toEqual({ year: 2025, season: "fall" });
    expect(toTermCode({ year: 2026, season: "spring" })).toBe("1263");
    expect(termLabel("1265")).toBe("Summer 2026");
    expect(() => parseTerm("1254")).toThrow();
  });

  it("walks Fall → Spring → Summer → Fall", () => {
    expect(nextTerm("1259")).toBe("1263");
    expect(nextTerm("1263")).toBe("1265");
    expect(nextTerm("1265")).toBe("1269");
    expect(previousTerm("1263")).toBe("1259");
    expect(previousTerm("1259")).toBe("1255");
  });

  it("groups Fall with the following Spring and Summer", () => {
    expect(academicYear("1259")).toBe(2025);
    expect(academicYear("1263")).toBe(2025);
    expect(academicYear("1265")).toBe(2025);
    expect(academicYear("1269")).toBe(2026);
  });

  it("builds a 4-year range of 12 terms", () => {
    const r = termRange("1269", 4);
    expect(r).toHaveLength(12);
    expect(r[0]).toBe("1269");
    expect(r[11]).toBe("1305");
  });

  it("starts new plans on this calendar year's Fall", () => {
    expect(defaultStartTerm(new Date(2026, 3, 1))).toBe("1269");
    expect(defaultStartTerm(new Date(2026, 9, 26))).toBe("1269");
  });
});
