import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.user_id) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let data, error;
    if (body.id) {
      // existing plan → upsert (replace)
      const { ...rest } = body;
      ({ data, error } = await supabase
        .from("plans")
        .upsert(rest, { onConflict: "id" })
        .select("id, last_updated")
        .single());
    } else {
      // removes null id from body
      const { id, created_at, ...rest } = body;
      // new plan → insert (let DB generate id)
      ({ data, error } = await supabase
        .from("plans")
        .insert(rest)
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

    return NextResponse.json({ id: data.id, last_updated: data.last_updated }, { status: 200 });

  } catch (err: any) {
    console.error("Server error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}