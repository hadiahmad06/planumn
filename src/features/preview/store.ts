"use client";

import { create } from "zustand";
import type { CourseId } from "@/domain/course";

/**
 * Course preview state. Owned by Michael's Codex (A11–A12). Initial version by Hadi's Claude.
 *
 * Contract other features rely on (keep these three calls working):
 *   - `openPreview(id)`   click on a course anywhere → persistent preview panel
 *   - `hoverPreview(id)`  hover → temporary preview; `hoverPreview(null)` on leave
 *   - `closePreview(id)`
 */
interface PreviewState {
  /** Persistent panels, most recently opened last. */
  pinned: CourseId[];
  hovered: CourseId | null;
  openPreview: (id: CourseId) => void;
  closePreview: (id: CourseId) => void;
  hoverPreview: (id: CourseId | null) => void;
}

export const usePreviewStore = create<PreviewState>()((set) => ({
  pinned: [],
  hovered: null,
  openPreview: (id) => set((s) => ({ pinned: [...s.pinned.filter((p) => p !== id), id] })),
  closePreview: (id) => set((s) => ({ pinned: s.pinned.filter((p) => p !== id) })),
  hoverPreview: (id) => set({ hovered: id }),
}));
