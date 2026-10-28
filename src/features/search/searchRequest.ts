"use client";

import { create } from "zustand";
import type { SearchFilters } from "@/domain/searchFilters";

/**
 * C3 (Hadi's Claude): lets another panel open the top-bar search with filters set, e.g. the rail's
 * "Find APEC 3xxx courses". `id` changes on every request so asking twice re-applies.
 */
interface SearchRequestState {
  request: { id: number; filters: SearchFilters } | null;
  openSearch: (filters: SearchFilters) => void;
}

export const useSearchRequest = create<SearchRequestState>((set) => ({
  request: null,
  openSearch: (filters) => set((s) => ({ request: { id: (s.request?.id ?? 0) + 1, filters } })),
}));
