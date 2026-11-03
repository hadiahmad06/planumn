"use client";
import { create } from "zustand";
/** Written by Michael's Codex. */
export const useSaveState = create<{
  status: "idle" | "pending" | "saving" | "saved" | "error";
  savedAt: string | null;
  local: boolean;
  error: string | null;
  retry: () => void;
}>(() => ({
  status: "idle",
  savedAt: null,
  local: true,
  error: null,
  retry: () => {},
}));
