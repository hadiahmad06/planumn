import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const db = await open({
    filename: path.join(process.cwd(), "public", "CourseInfo.db"),
    driver: sqlite3.Database,
  });

  const results = await db.all(
    `SELECT dept, number, title, credits
     FROM csci_courses
     WHERE LOWER(dept) LIKE ? OR LOWER(number) LIKE ? OR LOWER(title) LIKE ?
     LIMIT 20`,
    [`%${q}%`, `%${q}%`, `%${q}%`]
  );

  return NextResponse.json(results);
}