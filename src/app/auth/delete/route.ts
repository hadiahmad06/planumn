import { createClient } from "@supabase/supabase-js";
import { authConfig } from "@/features/auth/config";
import { serverSupabase } from "@/server/supabase/server";
/** Written by Michael's Codex. No schema/RLS changes; admin credentials stay server-only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const config = authConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceKey)
    return Response.json(
      {
        error:
          "Account deletion is unavailable. Contact ahmad287@umn.edu for help.",
      },
      { status: 503 },
    );
  try {
    const client = await serverSupabase();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user?.email)
      return Response.json({ error: "Please sign in again." }, { status: 401 });
    const body = await request.json();
    if (
      body.confirmation !== "Delete all my data" ||
      typeof body.password !== "string" ||
      !body.password
    )
      return Response.json(
        { error: "Enter your current password and confirmation text." },
        { status: 400 },
      );
    const verifier = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const verified = await verifier.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });
    if (verified.error || verified.data.user?.id !== user.id)
      return Response.json(
        { error: "Your password could not be verified." },
        { status: 401 },
      );
    const admin = createClient(config.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const plans = await admin.from("plans").delete().eq("user_id", user.id);
    if (plans.error)
      return Response.json(
        {
          error:
            "Plans could not be removed. Your account has not been deleted.",
        },
        { status: 500 },
      );
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error)
      return Response.json(
        {
          error:
            "Your plans were removed, but account deletion failed. Contact support before retrying.",
        },
        { status: 500 },
      );
    await client.auth.signOut({ scope: "global" });
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Account deletion failed. Please try again." },
      { status: 500 },
    );
  }
}
