import { describe, expect, it } from "vitest";
import { equivalentCodes } from "./course";

describe("equivalentCodes", () => {
  it("lets honors and writing-intensive versions satisfy the base course", () => {
    expect(equivalentCodes("CSCI 1933H")).toEqual(["CSCI 1933H", "CSCI 1933"]);
    expect(equivalentCodes("PHYS 1401V")).toEqual(["PHYS 1401V", "PHYS 1401"]);
    expect(equivalentCodes("PHYS 1301W")).toEqual(["PHYS 1301W", "PHYS 1301"]);
    expect(equivalentCodes("CSCI 2041")).toEqual(["CSCI 2041"]);
  });
});
