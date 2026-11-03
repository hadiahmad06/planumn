import { describe, expect, it } from "vitest";
import { safeReturnPath, validPassword } from "./validation";
describe("account validation", () => {
  it("preserves the 2025 signup requirements", () => {
    expect(validPassword("Example1!")).toBe(true);
    for (const password of ["example1!", "Example!!", "Example11", "Ex1!"])
      expect(validPassword(password)).toBe(false);
  });
  it("rejects external and backslash redirect targets", () => {
    for (const path of [
      null,
      "https://example.com",
      "//example.com",
      "/\\example.com",
      "/\n/example.com",
    ])
      expect(safeReturnPath(path)).toBe("/plans");
    expect(safeReturnPath("/plan/new")).toBe("/plan/new");
  });
});
