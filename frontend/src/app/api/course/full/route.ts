import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids: string[] = body.ids;
    const column = body.from === "cd" ? "courseGroupId" : "id";

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const db = await open({
      filename: path.join(process.cwd(), "public", "ProcessedData.db"),
      driver: sqlite3.Database,
    });

    const placeholders = ids.map(() => '?').join(', ');
    const query = `
      SELECT id, campus, dept_abbr, course_num, class_desc, total_students, total_grades, onestop, onestop_desc, cred_min, cred_max, srt_vals, courseGroupId
      FROM classdistribution
      WHERE ${column} IN (${placeholders})
    `;
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