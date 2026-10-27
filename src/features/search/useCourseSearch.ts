"use client";

import { useEffect, useState } from "react";
import type { CourseSummary } from "@/domain/course";
import { useCourseCache } from "@/features/catalog/courseCache";

export interface SearchState {
  query: string;
  results: CourseSummary[];
  loading: boolean;
}

/** Debounced catalog search against GET /api/courses/search. */
export function useCourseSearch(query: string, delayMs = 150): SearchState {
  const [state, setState] = useState<SearchState>({ query: "", results: [], loading: false });
  const q = query.trim();

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const results = (await res.json()) as CourseSummary[];
        useCourseCache.getState().putSummaries(results);
        setState({ query: q, results, loading: false });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ query: q, results: [], loading: false });
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, delayMs]);

  return q ? state : { query: "", results: [], loading: false };
}
