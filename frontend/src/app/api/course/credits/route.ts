import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const { ids } = await request.json();

if (!ids || !Array.isArray(ids) || ids.length === 0) {
  return NextResponse.json(
    { error: "ids parameter is required" },
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