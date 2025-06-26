import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Plan } from "@/types/plan";

/**
 * Handles POST requests to insert or upsert a plan into the Supabase `plans` table.
 * 
 * - If a plan ID is provided, the function performs an upsert (update or insert).
 * - If no ID is provided, it performs a new insert with an auto-generated ID.
 * - Ignores user-supplied `user_id` to prevent spoofing.
 * 
 * @param {NextRequest} req - The incoming request containing the plan data in the body.
 * @returns {Promise<NextResponse>} A JSON response containing the plan ID and `last_updated` timestamp, or an error message and appropriate status code.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  try {

    // user not authenticated
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // parses plan from request body
    const body = await req.json() as Plan;

    // TODO: validate body with Zod in production
    // minor check for now
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let data, error;

    if (body.id) { 
      // existing plan → upsert (replace)

      const { user_id, ...rest } = body; // ignore user_id in body, to prevent spoofing
      ({ data, error } = await supabase
        .from("plans")
        .upsert({ ...rest, user_id: user.id }, { onConflict: "id" })
        .select("id, last_updated")
        .single());
    } else { 
      // new plan → insert (let DB generate id)

      const { id, user_id, created_at, ...rest } = body; // removes null id and created_at from body
      ({ data, error } = await supabase
        .from("plans")
        .insert({ ...rest, user_id: user.id })
        .select("id, last_updated")
        .single());
    }

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No data returned from Supabase" }, { status: 500 });
    }
    
    // return plan ID for client-side redirects
    // return last_updated to handle potential race conditions
    return NextResponse.json({ id: data.id, last_updated: data.last_updated }, { status: 200 });

  } catch (err: any) {
    console.error("Server error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Retrieves a specific plan if it belongs to or is shared with the authenticated user.
 *
 * @param req - HTTP GET request with `planId` passed as a search param.
 * @returns JSON response with plan data if authorized, or error.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // user not authenticated
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // extracts plan id from request parameters
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  // attempts to fetch plan data with access control: either owner or shared user
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .or(`user_id.eq.${user.id},can_view.cs.[\"${user.id}\"]`)
    .single();

  if (!data) {
    return NextResponse.json({ error: "You do not have access to this plan." }, { status: 403 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan: data });
}