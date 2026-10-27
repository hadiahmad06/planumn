"use client";

import { useEffect, useState } from "react";
import type { CourseSummary } from "@/domain/course";
import { filtersToParams, hasFilters, type SearchFilters } from "@/domain/searchFilters";
import { useCourseCache } from "@/features/catalog/courseCache";

export interface SearchState {
  /** The query and filters these results are for (query string form). */
  key: string;
  results: CourseSummary[];
  loading: boolean;
  error: string | null;
}

const EMPTY: SearchState = { key: "", results: [], loading: false, error: null };

/** Debounced catalog search against GET /api/courses/search, with optional B8 filters. */
export function useCourseSearch(query: string, filters: SearchFilters = {}, delayMs = 150): SearchState & { settled: boolean } {
  const [state, setState] = useState<SearchState>(EMPTY);
  const q = query.trim();
  const params = filtersToParams(filters);
  if (q) params.set("q", q);
  const key = q || hasFilters(filters) ? params.toString() : "";

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch(`/api/courses/search?${key}`, { signal: controller.signal });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error((body as { error?: string } | null)?.error ?? `Search failed (${res.status}).`);
        const results = body as CourseSummary[];
        useCourseCache.getState().putSummaries(results);
        setState({ key, results, loading: false, error: null });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ key, results: [], loading: false, error: (e as Error).message });
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, delayMs]);

  return key ? { ...state, settled: state.key === key && !state.loading } : { ...EMPTY, settled: true };
}
