import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfig } from "@/features/auth/config";
/** Written by Michael's Codex. Routes authorize independently of proxy. */
export async function serverSupabase() {
  const config = authConfig();
  if (!config) throw new Error("Account services are not configured.");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          cookieStore.set(name, value, options);
      },
    },
  });
}
