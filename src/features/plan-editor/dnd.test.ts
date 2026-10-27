import { describe, expect, it } from "vitest";
import { resolveDrop } from "./dnd";

const len = () => 3;

describe("resolveDrop", () => {
  it("adds a search result where it was dropped", () => {
    expect(resolveDrop({ type: "external", source: "search", courseId: 9 }, { type: "planned", term: "1273", index: 1, courseId: 4 }, len))
      .toEqual({ kind: "add", term: "1273", index: 1, courseId: 9 });
    expect(resolveDrop({ type: "external", source: "requirement", courseId: 9 }, { type: "semester", term: "1273" }, len))
      .toEqual({ kind: "add", term: "1273", index: 3, courseId: 9 });
  });

  it("moves planned courses onto a card or a semester", () => {
    expect(resolveDrop({ type: "planned", term: "1269", index: 0, courseId: 1 }, { type: "semester", term: "1273" }, len))
      .toEqual({ kind: "move", from: { term: "1269", index: 0 }, to: { term: "1273", index: 3 } });
    expect(resolveDrop({ type: "planned", term: "1269", index: 0, courseId: 1 }, { type: "semester", term: "1269" }, len))
      .toEqual({ kind: "move", from: { term: "1269", index: 0 }, to: { term: "1269", index: 2 } });
  });

  it("cancels drops released over an overlay (review of #19)", () => {
    expect(resolveDrop({ type: "external", source: "search", courseId: 9 }, { type: "cancel" }, len)).toBeNull();
  });

  it("ignores drops outside any target", () => {
    expect(resolveDrop({ type: "planned", term: "1269", index: 0, courseId: 1 }, undefined, len)).toBeNull();
  });
});
