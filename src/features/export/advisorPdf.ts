import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { courseCode, formatCredits, type CourseSummary } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { groupByYear } from "@/domain/planOps";
import {
  academicYearLabel,
  seasonOf,
  termLabel,
  toTermCode,
  type Season,
} from "@/domain/terms";

export interface AdvisorExportOptions {
  programNames?: string[];
  audits?: { name: string; filled: number; units: number }[];
}
export interface AdvisorPdf {
  bytes: Uint8Array;
  pages: number;
  missingCourses: number;
}
const WIDTH = 841.89;
const HEIGHT = 595.28;
const MARGIN = 30;
const BOTTOM = 65;
const GAP = 12;
const COLUMN = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
const LINE = 11;
const SEASONS: Season[] = ["fall", "spring", "summer"];

/** Written by Michael's Codex. Standard PDF fonts cannot represent every Unicode glyph. */
function printable(value: string, font: PDFFont) {
  return [...value.replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, " ")]
    .map((character) => {
      try {
        font.encodeText(character);
        return character;
      } catch {
        return "?";
      }
    })
    .join("")
    .trim();
}
function fit(value: string, font: PDFFont, size: number, width: number) {
  const text = printable(value, font);
  if (font.widthOfTextAtSize(text, size) <= width) return text;
  let end = text.length;
  while (
    end > 0 &&
    font.widthOfTextAtSize(`${text.slice(0, end)}...`, size) > width
  )
    end--;
  return `${text.slice(0, end).trimEnd()}...`;
}
function lines(value: string, font: PDFFont, size: number, width: number) {
  const result: string[] = [];
  let current = "";
  for (const word of printable(value, font).split(" ")) {
    if (!current || font.widthOfTextAtSize(`${current} ${word}`, size) <= width)
      current = current ? `${current} ${word}` : word;
    else {
      result.push(fit(current, font, size, width));
      current = word;
    }
  }
  if (current) result.push(fit(current, font, size, width));
  return result;
}

export function advisorFileName(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `planumn-${slug || "plan"}.pdf`;
}

/**
 * Written by Michael's Codex. A4 landscape, normally one page for a four-year plan.
 * Dense or long plans continue onto labelled pages rather than dropping courses or shrinking text.
 * Input is a snapshot; neither the plan nor the catalog is mutated, uploaded, or persisted here.
 */
export async function createAdvisorPdf(
  plan: Plan,
  courses: Record<number, CourseSummary>,
  options: AdvisorExportOptions = {},
): Promise<AdvisorPdf> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(plan.title || "Untitled plan");
  document.setAuthor("planu.mn");
  document.setCreator("planu.mn advisor export");
  const entries = plan.semesters.flatMap((semester) => semester.courses);
  const missingCourses = entries.filter((entry) => !courses[entry.id]).length;
  const totals = entries.reduce(
    (total, entry) => ({
      min: total.min + (courses[entry.id]?.credits.min ?? 0),
      max: total.max + (courses[entry.id]?.credits.max ?? 0),
    }),
    { min: 0, max: 0 },
  );
  const headerPrograms = options.programNames?.length
    ? `Programs: ${options.programNames.join("; ")}`
    : "No programs selected";
  const programLines = lines(headerPrograms, regular, 9, WIDTH - MARGIN * 2);
  const auditLines = options.audits?.length
    ? lines(
        `Unofficial planned checks: ${options.audits.map((audit) => `${audit.name} ${audit.filled}/${audit.units}`).join("; ")}`,
        regular,
        8,
        WIDTH - MARGIN * 2,
      )
    : [];
  // newPage assigns this before it draws a header, and is called before any body rows.
  let page!: PDFPage;
  let cursor = 0;
  let pageTop = 0;
  function text(
    value: string,
    x: number,
    y: number,
    size = 9,
    strong = false,
    width = WIDTH - MARGIN * 2,
  ) {
    const font = strong ? bold : regular;
    page.drawText(fit(value, font, size, width), {
      x,
      y,
      size,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });
  }
  function newPage() {
    page = document.addPage([WIDTH, HEIGHT]);
    text("planu.mn / Advising plan", MARGIN, HEIGHT - MARGIN, 10, true);
    text(plan.title || "Untitled plan", MARGIN, HEIGHT - 59, 21, true);
    text(
      `${entries.length} course entries | ${formatCredits(totals)} scheduled credits${missingCourses ? " + unknown credits" : ""} | Saved ${plan.last_updated.slice(0, 10)}`,
      MARGIN,
      HEIGHT - 77,
      9,
    );
    let headerY = HEIGHT - 94;
    for (const line of programLines.slice(0, 3)) {
      text(line, MARGIN, headerY, 9);
      headerY -= 12;
    }
    if (programLines.length > 3) {
      text(
        "Additional programs are listed in the full plan.",
        MARGIN,
        headerY,
        8,
      );
      headerY -= 12;
    }
    for (const line of auditLines.slice(0, 2)) {
      text(line, MARGIN, headerY, 8);
      headerY -= 11;
    }
    if (plan.programs.length && !options.audits?.length) {
      text(
        "Program checks are not included in this snapshot. Review your official APAS report.",
        MARGIN,
        headerY,
        8,
      );
      headerY -= 11;
    }
    cursor = headerY - 12;
    pageTop = cursor;
  }
  newPage();
  const groups = groupByYear(plan.semesters);
  if (!groups.length)
    text("No semesters in this plan.", MARGIN, cursor - 20, 10);
  const maxRows = Math.max(1, Math.floor((pageTop - BOTTOM - 36) / LINE));
  for (const group of groups) {
    const semesters = SEASONS.map((season) =>
      group.semesters.find((semester) => seasonOf(semester.index) === season),
    );
    const rows = Math.max(
      1,
      ...semesters.map((semester) => semester?.courses.length ?? 0),
    );
    const segments = Math.ceil(rows / maxRows);
    for (let segment = 0; segment < segments; segment++) {
      const count = Math.min(maxRows, rows - segment * maxRows);
      const height = 36 + count * LINE;
      if (cursor - height < BOTTOM) newPage();
      text(
        `${academicYearLabel(group.startYear)}${segment ? " (continued)" : ""}`,
        MARGIN,
        cursor - 9,
        10,
        true,
      );
      page.drawLine({
        start: { x: MARGIN, y: cursor - 15 },
        end: { x: WIDTH - MARGIN, y: cursor - 15 },
        thickness: 0.6,
        color: rgb(0.7, 0.7, 0.7),
      });
      for (let column = 0; column < SEASONS.length; column++) {
        const x = MARGIN + column * (COLUMN + GAP);
        const semester = semesters[column];
        const term = toTermCode({
          year:
            SEASONS[column] === "fall" ? group.startYear : group.startYear + 1,
          season: SEASONS[column],
        });
        const semTotal = semester?.courses.reduce(
          (sum, entry) => ({
            min: sum.min + (courses[entry.id]?.credits.min ?? 0),
            max: sum.max + (courses[entry.id]?.credits.max ?? 0),
          }),
          { min: 0, max: 0 },
        ) ?? { min: 0, max: 0 };
        text(
          `${termLabel(term)}${segment ? " (cont.)" : ""}`,
          x,
          cursor - 28,
          9,
          true,
          COLUMN - 62,
        );
        const unknown = semester?.courses.some((entry) => !courses[entry.id]);
        const label = semester
          ? `${formatCredits(semTotal)}${unknown ? " + ?" : ""} cr`
          : "Not in plan";
        text(label, x + COLUMN - 58, cursor - 28, 8, false, 58);
        const slice =
          semester?.courses.slice(segment * maxRows, (segment + 1) * maxRows) ??
          [];
        if (!slice.length)
          text(
            segment ? "" : semester ? "No courses planned" : "",
            x,
            cursor - 42,
            8,
            false,
            COLUMN,
          );
        slice.forEach((entry, index) => {
          const course = courses[entry.id];
          const y = cursor - 42 - index * LINE;
          text(
            `${course ? courseCode(course) : `ID ${entry.id}`}${entry.lock === "locked" ? " *" : ""}`,
            x,
            y,
            8.5,
            true,
            68,
          );
          text(
            course?.title || "Catalog details unavailable",
            x + 72,
            y,
            8,
            false,
            COLUMN - 102,
          );
          text(
            course ? formatCredits(course.credits) : "?",
            x + COLUMN - 26,
            y,
            8,
            false,
            26,
          );
        });
      }
      cursor -= height + 8;
    }
  }
  const pages = document.getPages();
  pages.forEach((current, index) => {
    page = current;
    text(
      "Planning aid, not an official degree audit. Confirm requirements and offerings with your advisor. Catalog data through Fall 2024.",
      MARGIN,
      39,
      7.5,
    );
    text(
      `Scheduled credits may include retakes. * Locked course. ? Unavailable catalog credits.${missingCourses ? ` ${missingCourses} course entries need catalog review.` : ""}`,
      MARGIN,
      27,
      7.5,
      false,
      WIDTH - MARGIN * 2 - 60,
    );
    text(
      `${index + 1} / ${pages.length}`,
      WIDTH - MARGIN - 35,
      27,
      8,
      false,
      35,
    );
  });
  return { bytes: await document.save(), pages: pages.length, missingCourses };
}
