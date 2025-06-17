import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      { error: "ids parameter is required" },
      { status: 400 }
    );
  }

  // Parse comma-separated IDs
  const ids = idsParam.split(",").map((s) => s.trim()).filter((s) => s);
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No valid ids provided" },
      { status: 400 }
    );
  }

  try {
    const db = await open({
      filename: path.join(process.cwd(), "public", "ProcessedData.db"),
      driver: sqlite3.Database,
    });

    // Build placeholders for IN clause
    const placeholders = ids.map(() => "?").join(",");
    const query = `
      SELECT id, cred_min, cred_max
      FROM classdistribution
      WHERE id IN (${placeholders})
    `;

    // Execute query for all matching courses
    const courses = await db.all(query, ids);

    await db.close();

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}