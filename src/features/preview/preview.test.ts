import { beforeEach, describe, expect, it } from "vitest";
import { usePreviewStore } from "./store";
import { clampPanel, farthestCorner, TOP_INSET } from "./geometry";

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
  it("opens a preview in the corner farthest from the course that opened it", () => {
    // 1200×800 viewport, 400×300 panel.
    expect(farthestCorner({ x: 100, y: 100 }, 400, 300, 1200, 800)).toEqual({ x: 792, y: 492 }); // top-left course → bottom-right
    expect(farthestCorner({ x: 1100, y: 700 }, 400, 300, 1200, 800)).toEqual({ x: 8, y: TOP_INSET }); // bottom-right → top-left, below the top bar
    expect(farthestCorner({ x: 1100, y: 100 }, 400, 300, 1200, 800)).toEqual({ x: 8, y: 492 }); // top-right (search) → bottom-left
    expect(farthestCorner({ x: 100, y: 700 }, 400, 300, 1200, 800)).toEqual({ x: 792, y: TOP_INSET });
  });
  it("stacks further panels toward the centre and stays on screen", () => {
    expect(farthestCorner({ x: 100, y: 100 }, 400, 300, 1200, 800, 2)).toEqual({ x: 744, y: 444 });
    expect(farthestCorner({ x: 100, y: 100 }, 560, 900, 600, 800)).toEqual({ x: 32, y: 8 }); // taller than the viewport: clamped
  });
  it("picks the corner that covers the least of the hovered course (narrow window)", () => {
    // 1024×768 window, 560×376 panel, card just left of centre in the top half (the case from the browser
    // check). No corner avoids it entirely; bottom-right covers only its bottom 16 px.
    expect(farthestCorner({ left: 333, top: 363, right: 523, bottom: 400 }, 560, 376, 1024, 768)).toEqual({ x: 456, y: 384 });
    // With room to spare, the course isn't covered at all.
    expect(farthestCorner({ left: 333, top: 363, right: 523, bottom: 400 }, 400, 300, 1440, 900)).toEqual({ x: 1032, y: 592 });
  });
});
