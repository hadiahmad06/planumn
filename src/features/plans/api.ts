import "server-only";
import { serverSupabase } from "@/server/supabase/server";
import { authConfig } from "@/features/auth/config";
import { RepositoryError, SupabasePlanRepository } from "./serverRepository";
/** Written by Michael's Codex. Per-request auth; responses never cached. */
export async function planApi(
  request: Request,
  action: (repo: SupabasePlanRepository) => Promise<unknown>,
) {
  try {
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      throw new RepositoryError("Invalid request origin.", 403);
    if (!authConfig())
      throw new RepositoryError(
        "Cloud saving is unavailable. Please try again later.",
        503,
      );
    const client = await serverSupabase();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user)
      throw new RepositoryError("Sign in to access your plans.", 401);
    return Response.json(
      await action(new SupabasePlanRepository(client, user.id)),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof RepositoryError
            ? error.message
            : "The request could not be completed. Please try again.",
      },
      {
        status: error instanceof RepositoryError ? error.status : 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
