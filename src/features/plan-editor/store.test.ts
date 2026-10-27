import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import { useDisplaySettings } from "./displaySettings";
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

  it("clears when its season is hidden", () => {
    useDisplaySettings.getState().setHiddenSeasons(["fall"]);
    expect(useEditorUi.getState().selectedTerm).toBeNull();
    useDisplaySettings.getState().setHiddenSeasons([]);
  });

  it("survives autosave metadata patches (re-review of #22)", () => {
    usePlanStore.getState().patchMeta({ id: "saved", user_id: "owner" });
    expect(useEditorUi.getState().selectedTerm).toBe("1269");
  });

  it("survives unrelated edits", () => {
    planActions.addCourse("1269", 77);
    planActions.removeSemester("1275");
    expect(useEditorUi.getState().selectedTerm).toBe("1269");
  });
});
