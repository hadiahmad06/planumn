import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import { planActions, useEditorUi, usePlanStore } from "./store";

describe("selected semester (review of #22)", () => {
  beforeEach(() => {
    usePlanStore.getState().loadPlan(createEmptyPlan(new Date(2026, 3, 1)));
    useEditorUi.getState().selectTerm("1269");
  });

  it("clears when the selected semester is removed", () => {
    planActions.removeSemester("1269");
    expect(useEditorUi.getState().selectedTerm).toBeNull();
  });

  it("clears when its whole year is removed", () => {
    planActions.removeYear(2026);
    expect(useEditorUi.getState().selectedTerm).toBeNull();
  });

  it("clears when another plan loads", () => {
    usePlanStore.getState().loadPlan(createEmptyPlan(new Date(2026, 3, 1)));
    expect(useEditorUi.getState().selectedTerm).toBeNull();
  });

  it("survives unrelated edits", () => {
    planActions.addCourse("1269", 77);
    planActions.removeSemester("1275");
    expect(useEditorUi.getState().selectedTerm).toBe("1269");
  });
});
