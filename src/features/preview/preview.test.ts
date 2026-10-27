import { beforeEach, describe, expect, it } from "vitest";
import { usePreviewStore } from "./store";
import { clampPanel } from "./geometry";

beforeEach(() => usePreviewStore.setState({ pinned: [], hovered: null }));
describe("course comparison panels", () => {
  it("keeps several courses open, focuses without duplicating, and closes only the target", () => {
    const store = usePreviewStore.getState();
    store.openPreview(77);
    store.openPreview(87);
    store.openPreview(77);
    expect(usePreviewStore.getState().pinned).toEqual([87, 77]);
    store.closePreview(77);
    expect(usePreviewStore.getState().pinned).toEqual([87]);
  });
  it("leaving a hovered course never closes a pinned course", () => {
    const store = usePreviewStore.getState();
    store.openPreview(77);
    store.hoverPreview(87);
    store.hoverPreview(null);
    expect(usePreviewStore.getState()).toMatchObject({
      pinned: [77],
      hovered: null,
    });
  });
  it("clamps dragging and viewport changes on all sides", () => {
    expect(clampPanel(-20, -10, 360, 500, 1000, 800)).toEqual({ x: 8, y: 8 });
    expect(clampPanel(2000, 2000, 360, 500, 1000, 800)).toEqual({
      x: 632,
      y: 292,
    });
    expect(clampPanel(100, 100, 304, 600, 320, 616)).toEqual({ x: 8, y: 8 });
  });
});
