import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/server/supabase/server";
import { safeReturnPath } from "@/features/auth/validation";
/** Written by Michael's Codex. PKCE confirmation; redirect targets stay on this origin. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const client = await serverSupabase();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(
          new URL(
            safeReturnPath(request.nextUrl.searchParams.get("next")),
            request.url,
          ),
        );
    } catch {
      /* A failed or expired link returns to sign-in with a visible message. */
    }
  }
  return NextResponse.redirect(
    new URL("/auth?error=confirmation", request.url),
  );
}
