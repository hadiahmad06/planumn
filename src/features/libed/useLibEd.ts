"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { CourseId } from "@/domain/course";
import type { LibEdLookup } from "@/domain/libed";

/**
 * Client cache of Twin Cities Lib Ed codes per course (B3). Written by Ishaan's Claude.
 * `codes[id]`: string[] = designations, null = the UMN catalog has no record, absent = not loaded yet.
 */
interface LibEdState {
  codes: LibEdLookup;
  error: string | null;
}

export const useLibEdStore = create<LibEdState>()(() => ({ codes: {}, error: null }));

const inFlight = new Set<CourseId>();
const BATCH = 200;

export async function loadLibEd(ids: CourseId[]): Promise<void> {
  const { codes } = useLibEdStore.getState();
  const todo = [...new Set(ids)].filter((id) => codes[id] === undefined && !inFlight.has(id));
  if (todo.length === 0) return;
  todo.forEach((id) => inFlight.add(id));
  try {
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      const res = await fetch(`/api/libed?ids=${chunk.join(",")}`);
      const body = await res.json().catch(() => ({ error: `Lib Ed lookup failed (${res.status}).` }));
      if (!res.ok) throw new Error(body.error ?? `Lib Ed lookup failed (${res.status}).`);
      useLibEdStore.setState((s) => ({ codes: { ...s.codes, ...(body as LibEdLookup) }, error: null }));
    }
  } catch (e) {
    useLibEdStore.setState({ error: e instanceof Error ? e.message : "Lib Ed lookup failed." });
  } finally {
    todo.forEach((id) => inFlight.delete(id));
  }
}

/** Loads (once) and returns the Lib Ed lookup for the given course ids. */
export function useLibEd(ids: CourseId[]) {
  const key = [...new Set(ids)].sort((a, b) => a - b).join(",");
  useEffect(() => {
    if (key) void loadLibEd(key.split(",").map(Number));
  }, [key]);
  const codes = useLibEdStore((s) => s.codes);
  const error = useLibEdStore((s) => s.error);
  return { codes, error, retry: () => key && void loadLibEd(key.split(",").map(Number)) };
}
