"use client";
import { createBrowserClient } from "@supabase/ssr";
import { authConfig } from "./config";
/** Written by Michael's Codex. Cookie sessions shared with server routes. */
export function browserSupabase() {
  const config = authConfig();
  if (!config)
    throw new Error("Sign-in is unavailable. Please try again later.");
  return createBrowserClient(config.url, config.key);
}
