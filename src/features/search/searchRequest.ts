"use client";

import { create } from "zustand";
import type { SearchFilters } from "@/domain/searchFilters";

/**
 * Lets another feature open the top-bar search with filters already set (Phase C/C3, Hadi's Claude):
 * the requirements rail's "Find EE 4xxx courses" link. `SearchBox` keeps its filters in local state and
 * takes each new request once (`seq` changes), replacing its query and filters.
 */
interface SearchRequestState {
  request: { filters: SearchFilters; seq: number } | null;
}

export const useSearchRequest = create<SearchRequestState>()(() => ({ request: null }));

export function openSearchWith(filters: SearchFilters) {
  useSearchRequest.setState((s) => ({ request: { filters, seq: (s.request?.seq ?? 0) + 1 } }));
}
