/** Written by Michael's Codex. Keep the entire panel inside the visible viewport. */
export function clampPanel(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return {
    x: Math.max(8, Math.min(x, viewportWidth - width - 8)),
    y: Math.max(8, Math.min(y, viewportHeight - height - 8)),
  };
}

/** Height of the app's top bar (TopBar, h-14) plus a gap, so top-corner panels don't cover search. */
export const TOP_INSET = 64;

export interface AnchorBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where a preview opens (Hadi, 2026-10-27): in the viewport corner where it covers the least of the
 * course that opened it (`anchor`: that element's box, or a point), and among equals the corner
 * farthest from it. `stack` nudges each further panel toward the centre so several stay visible.
 * Written by Hadi's Claude.
 */
export function farthestCorner(anchor: AnchorBox | { x: number; y: number }, width: number, height: number, viewportWidth: number, viewportHeight: number, stack = 0) {
  const box: AnchorBox = "x" in anchor ? { left: anchor.x, top: anchor.y, right: anchor.x, bottom: anchor.y } : anchor;
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  const nudge = stack * 24;
  const corners = [
    { x: 8 + nudge, y: TOP_INSET + nudge },
    { x: viewportWidth - width - 8 - nudge, y: TOP_INSET + nudge },
    { x: 8 + nudge, y: viewportHeight - height - 8 - nudge },
    { x: viewportWidth - width - 8 - nudge, y: viewportHeight - height - 8 - nudge },
  ].map((c) => {
    const p = clampPanel(c.x, c.y, width, height, viewportWidth, viewportHeight);
    // Short viewports: keep below the top bar when the panel fits there.
    return { x: p.x, y: Math.max(p.y, Math.min(TOP_INSET, viewportHeight - height - 8)) };
  });
  const score = (c: { x: number; y: number }) => {
    const w = Math.max(0, Math.min(c.x + width, box.right) - Math.max(c.x, box.left));
    const h = Math.max(0, Math.min(c.y + height, box.bottom) - Math.max(c.y, box.top));
    const covered = box.right === box.left || box.bottom === box.top ? (w > 0 || (c.x <= cx && cx <= c.x + width)) && (h > 0 || (c.y <= cy && cy <= c.y + height)) ? 1 : 0 : w * h;
    const distance = Math.hypot(c.x + width / 2 - cx, c.y + height / 2 - cy);
    return { covered, distance };
  };
  return corners.reduce((best, c) => {
    const a = score(c);
    const b = score(best);
    return a.covered < b.covered || (a.covered === b.covered && a.distance > b.distance) ? c : best;
  });
}
