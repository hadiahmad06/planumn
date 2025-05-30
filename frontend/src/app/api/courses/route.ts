import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Id is required" },
      { status: 400 }
    );
  }

  try {
    const db = await open({
      filename: path.join(process.cwd(), "public", "ProcessedData.db"),
      driver: sqlite3.Database,
    });

    const course = await db.get(
      `SELECT id, campus, dept_abbr, course_num, class_desc, total_students, total_grades, onestop, onestop_desc, cred_min, cred_max, srt_vals
       FROM classdistribution
       WHERE id = ?`,
      [id]
    );

    await db.close();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 