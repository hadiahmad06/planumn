import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Course, PlanNullable } from "@/types/plan";
import { normalizeSemesters } from "@/types/planHandlers";


export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Convert uploaded File to a Buffer, then feed into pdf2json
  const buffer = Buffer.from(await file.arrayBuffer());

  const rawText: string = await new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (err) => reject(err.parserError));
    parser.on("pdfParser_dataReady", (pdfData) => {
      // pdfData.Pages is an array of pages. Each page.Texts is an array of text chunks.
      // We decode each chunk, join into one string per page, then join pages with newline.
      const text = pdfData.Pages?.map((page: any) => {
        return (
          page.Texts
            ?.map((t: any) => t.R?.map((r: any) => decodeURIComponent(r.T)).join(""))
            .join(" ")
        );
      }).join("\n")
      ?? "";
      resolve(text);
    });
    parser.parseBuffer(buffer);
  });

  const db = await open({
    filename: path.join(process.cwd(), "public", "ProcessedData.db"),
    driver: sqlite3.Database,
  });

  // Match all semester headers (e.g. "Fall Semester 2022") along with their index
  const semRegex = /(Fall|Spring|Summer)\s+Semester\s+(\d{4})/g;
  let match;
  const semesters: Record<string, number[]> = {};
  const indices: { name: string; index: number }[] = [];

  while ((match = semRegex.exec(rawText)) !== null) {
    const season = match[1];
    const year = match[2];
    const yearShort = year.slice(2);
    const seasonCode = season === "Fall" ? "9" : season === "Spring" ? "3" : season === "Summer" ? "5" : "0";
    const semIndex = `1${yearShort}${seasonCode}`;
    indices.push({ name: semIndex, index: match.index });
    semesters[semIndex] = [];
  }

  // Sort indices by position (should already be in order, but ensure)
  indices.sort((a, b) => a.index - b.index);

  // For each semester, extract text from its index up to the next semester or end
  for (let i = 0; i < indices.length; i++) {
    const semIndex = indices[i].name;
    const startPos = indices[i].index;
    const endPos = i + 1 < indices.length ? indices[i + 1].index : rawText.length;
    const semBlock = rawText.substring(startPos, endPos);

    // Within this block, find all course codes like "PHYS 1401V"
    const courseRegex = /\b([A-Z]{2,}\s+\d{4}[A-Z]?)\b/g;
    let courseMatch;
    while ((courseMatch = courseRegex.exec(semBlock)) !== null) {
      const [dept_abbr, course_num] = courseMatch[1].split(/\s+/);
      try {
        const result = await db.get(
          `SELECT id FROM classdistribution WHERE dept_abbr = ? AND course_num = ?`,
          [dept_abbr, course_num]
        ) as Course;

        if (result?.id) {
          semesters[semIndex].push(result.id);
        }
      } catch (err) {
        console.error("DB lookup failed for:", courseMatch[1], err);
      }
    }
  }

  await db.close();
  const formatted = {
    id: null,
    user_id: null,
    created_at: new Date(),
    last_updated: new Date(),
    deletion_scheduled_at: null,
    can_view: [],
    title: "",
    programs: [], // will update this once we have major data
    semesters: normalizeSemesters(
        Object.entries(semesters).map(
          ([index, ids]) => ({ index, courses: ids.map((id) => ({ id, lock: "locked" })),})
        )
    ),
  } as PlanNullable;

  return NextResponse.json(formatted);
};