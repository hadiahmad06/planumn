import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const number = searchParams.get("number");

  if (!subject || !number) {
    return NextResponse.json(
      { error: "Subject and number are required" },
      { status: 400 }
    );
  }

  try {
    const db = await open({
      filename: path.join(process.cwd(), "public", "CourseInfo.db"),
      driver: sqlite3.Database,
    });

    const course = await db.get(
      `SELECT dept, number, title, credits
       FROM courses
       WHERE dept = ? AND number = ?`,
      [subject, number]
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