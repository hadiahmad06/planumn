import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Recovers a user-owned plan by removing the scheduled deletion date.
 *
 * This route expects a JSON body containing a `planId` field.
 * It verifies that the requester is authenticated and owns the plan.
 *
 * @param {NextResponse} req - The incoming HTTP POST request containing the `planId` in the JSON body.
 * @returns {Promise<NextResponse>} A JSON response containing:
 * - `{ success: true }` with status 200 on success
 * - `{ error: "Unauthorized" }` with status 401 if the user is not authenticated
 * - `{ error: string }` with status 500 if a Supabase error occurs
 */
export async function POST(req: Request): Promise<NextResponse> {
const supabase = await createClient()
  const { data: { user }, } = await supabase.auth.getUser();

  // user not authenticated
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // parses planId from request body
  const { planId } = await req.json();

  // attempts to remove scheduled deletion date
  const { error } = await supabase
    .from("plans")
    .update({ deletion_scheduled_at: null })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}