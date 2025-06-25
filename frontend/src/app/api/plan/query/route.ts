import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";



/**
 * Fetches plans associated with the currently authenticated user.
 *
 * This function:
 * - Retrieves the current authenticated user using Supabase auth.
 * - Queries the `plans` table for records where `user_id` matches the authenticated user.
 * 
 * @returns {Promise<NextResponse>} A JSON response containing the user's plans or an error message:
 * - 401 if user is not authenticated.
 * - 500 if a database query error occurs.
 * - 403 if no plans are found or access is denied.
 */
export async function GET(): Promise<NextResponse> {
const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();

  // user not authenticated
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // attempts to query plans with matching user_id
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No plans found, or access denied"}, { status: 403 })
  }

  return NextResponse.json(data);
}