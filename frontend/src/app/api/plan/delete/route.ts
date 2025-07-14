import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Deletes a user-owned plan by marking it for deletion.
 *
 * This route expects a JSON body containing a `planId` field.
 * It verifies that the requester is authenticated and owns the plan.
 * It uses a Supabase RPC function to determine the deletion date (30 days from now)
 * to avoid client-side timestamp manipulation.
 *
 * @param {NextResponse} req - The incoming HTTP DELETE request containing the `planId` in the JSON body.
 * @returns {Promise<NextResponse>} A JSON response containing:
 * - `{ success: true }` with status 200 on success
 * - `{ error: "Unauthorized" }` with status 401 if the user is not authenticated
 * - `{ error: string }` with status 500 if a Supabase error occurs
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();

  // user not authenticated
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // parses plan id from request body
  const { planId, force } = await req.json();

  // creates deletion date from supabase time to avoid spoofed date/time
  const { data: deletionDate, error: rpcError } = await supabase.rpc('now_plus_30_days');
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // attempt to mark plan for deletion
  const { error } = await supabase
    .from("plans")
    .update({ deletion_scheduled_at: deletionDate })
    .eq("id", planId)
    .eq("user_id", user.id); // verifies ownership

  if (force) {
    await supabase
        .from("plans")
        .delete()
        .eq("id", planId)
        .eq("user_id", user.id);

  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}