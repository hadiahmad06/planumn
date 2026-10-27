/**
 * Where the course that opened a preview is on screen, so the panel can open away from it (Hadi,
 * 2026-10-27). Written by Hadi's Claude. Previews are opened from many places (plan cards, search,
 * requirement chips, health panel), so instead of passing a position through every caller this
 * remembers the last pointer position, or the focused element after keyboard use.
 */
import type { AnchorBox } from "./geometry";

let lastPointer: { x: number; y: number } | null = null;
let lastInput: "pointer" | "keyboard" = "pointer";
let installed = false;

export function trackPreviewAnchor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const onPointer = (e: PointerEvent) => {
    lastPointer = { x: e.clientX, y: e.clientY };
    lastInput = "pointer";
  };
  window.addEventListener("pointermove", onPointer, { passive: true, capture: true });
  window.addEventListener("pointerdown", onPointer, { passive: true, capture: true });
  window.addEventListener("keydown", () => (lastInput = "keyboard"), { passive: true, capture: true });
}

/**
 * The box a new preview should stay off: the course element under the pointer (or the focused element
 * after keyboard use), else just the pointer point. Defaults to the top-left (panel opens bottom-right).
 */
export function previewAnchor(): AnchorBox | { x: number; y: number } {
  const box = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  };
  const el = document.activeElement;
  if (lastInput === "keyboard" && el instanceof HTMLElement && el !== document.body) return box(el);
  if (!lastPointer) return { x: 0, y: 0 };
  const hit = document.elementFromPoint(lastPointer.x, lastPointer.y)?.closest("button, a, li, [role='button'], [role='option']");
  return hit ? box(hit) : lastPointer;
}
