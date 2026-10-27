import { describe, expect, it } from "vitest";
import { checkPrereqs, extractPrereqText, parsePrereqs } from "./prereqs";

const has = (...codes: string[]) => (code: string) => codes.includes(code);

describe("extractPrereqText", () => {
  it("finds the prereq clause", () => {
    expect(extractPrereqText("Recursion, higher-order functions. prereq: (CSci 1913 or CSci 1933) and CSci 2011")).toBe("(CSci 1913 or CSci 1933) and CSci 2011");
    expect(extractPrereqText("No prerequisites listed here")).toBeNull();
    expect(extractPrereqText(null)).toBeNull();
  });
});

describe("parsePrereqs (real catalog text)", () => {
  it("CSCI 2041: (CSci 1913 or CSci 1933) and CSci 2011", () => {
    expect(parsePrereqs("(CSci 1913 or CSci 1933) and CSci 2011", "CSCI")).toEqual({
      kind: "and",
      children: [
        { kind: "or", children: [{ kind: "course", code: "CSCI 1913" }, { kind: "course", code: "CSCI 1933" }] },
        { kind: "course", code: "CSCI 2011" },
      ],
    });
  });

  it("CSCI 4061: bare numbers inherit the course's department; ';' separates and-clauses", () => {
    const node = parsePrereqs("2021 or EE 2361; CS upper div, CompE upper div., EE upper div., EE grad, ITI upper div., or dept. permission; no cr for grads in CSci.", "CSCI")!;
    expect(node.kind).toBe("and");
    expect(checkPrereqs(node, has("CSCI 2021")).met).toBe(true);
    expect(checkPrereqs(node, has("EE 2361")).met).toBe(true);
    expect(checkPrereqs(node, has()).met).toBe(false);
  });

  it("returns null when no course is mentioned", () => {
    expect(parsePrereqs("CS upper div, CS grad, or dept. permission", "CSCI")).toBeNull();
  });

  it("handles slash lists", () => {
    const node = parsePrereqs("MATH 1271/1371", "MATH")!;
    expect(checkPrereqs(node, has("MATH 1371")).met).toBe(true);
  });
});

describe("checkPrereqs", () => {
  it("explains what's missing", () => {
    const node = parsePrereqs("(CSci 1913 or CSci 1933) and CSci 2011", "CSCI")!;
    expect(checkPrereqs(node, has("CSCI 2011"))).toEqual({ met: false, missing: "CSCI 1913 or CSCI 1933", hasOtherPaths: false });
    expect(checkPrereqs(node, has("CSCI 1933"))).toMatchObject({ met: false, missing: "CSCI 2011" });
    expect(checkPrereqs(node, has("CSCI 1933", "CSCI 2011")).met).toBe(true);
  });

  it("notes when consent or standing is another way in (CSCI 4041)", () => {
    const node = parsePrereqs("[(CSCI 1913 or CSCI 1933) and CSCI 2011] or instr consent or grad standing", "CSCI")!;
    expect(checkPrereqs(node, has())).toEqual({ met: false, missing: "(CSCI 1913 or CSCI 1933) and CSCI 2011", hasOtherPaths: true });
  });
});
