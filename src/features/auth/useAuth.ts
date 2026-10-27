"use client";
import { useEffect } from "react";
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { browserSupabase } from "./client";
/** Written by Michael's Codex. One browser subscription shared across features. */
export const useAuthStore = create<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>(() => ({ user: null, loading: true, error: null }));
let started = false;
function startAuth() {
  if (started) return;
  started = true;
  try {
    const client = browserSupabase();
    client.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      });
    });
    void client.auth
      .getUser()
      .then(({ data, error }) => {
        useAuthStore.setState({
          user: data.user,
          loading: false,
          error:
            error && error.name !== "AuthSessionMissingError"
              ? "Your session could not be checked. Please sign in again."
              : null,
        });
      })
      .catch(() =>
        useAuthStore.setState({
          user: null,
          loading: false,
          error: "Your session could not be checked. Please sign in again.",
        }),
      );
  } catch (error) {
    useAuthStore.setState({
      loading: false,
      error: error instanceof Error ? error.message : "Sign-in is unavailable.",
    });
  }
}
export function useAuth() {
  const state = useAuthStore();
  useEffect(startAuth, []);
  return state;
}
