import { createEmptyPlan, normalizeSemesters, type Plan } from "@/domain/plan";
/** Written by Michael's Codex. Never retains names, identifiers, grades or raw text. */
export function transcriptCourses(text: string) {
  if (!/university\s+of\s+minnesota/i.test(text))
    throw new Error(
      "Upload a University of Minnesota unofficial transcript with selectable text.",
    );
  const headers = [
    ...text.matchAll(/\b(Fall|Spring|Summer)\s+Semester\s+(20\d{2})\b/gi),
  ];
  if (!headers.length)
    throw new Error(
      "No semester headings were found. Use an unofficial transcript PDF with selectable text.",
    );
  const terms = new Map<string, { dept: string; number: string }[]>();
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const season = { fall: "9", spring: "3", summer: "5" }[
      header[1].toLowerCase()
    ];
    const term = `1${header[2].slice(2)}${season}`;
    const block = text.slice(
      header.index! + header[0].length,
      headers[i + 1]?.index ?? text.length,
    );
    const codes = [...block.matchAll(/\b([A-Z]{2,8})\s+(\d{4}[A-Z]?)\b/g)].map(
      (match) => ({ dept: match[1], number: match[2] }),
    );
    terms.set(term, [...(terms.get(term) ?? []), ...codes]);
  }
  return terms;
}
export interface TranscriptResult {
  plan: Plan;
  matched: number;
  unmatched: string[];
}
export function transcriptPlan(
  terms: ReturnType<typeof transcriptCourses>,
  ids: Map<string, number>,
  now = new Date(),
): TranscriptResult {
  const plan = createEmptyPlan(now);
  const unmatched = new Set<string>();
  let matched = 0;
  const imported = [...terms].map(([index, codes]) => {
    const courses = new Map<number, { id: number; lock: "locked" }>();
    for (const code of codes) {
      const key = `${code.dept} ${code.number}`;
      const id = ids.get(key);
      if (id) courses.set(id, { id, lock: "locked" });
      else unmatched.add(key);
    }
    matched += courses.size;
    return { index, courses: [...courses.values()] };
  });
  if (!matched)
    throw new Error(
      "No transcript courses matched the Twin Cities catalog. The catalog currently ends at Fall 2024.",
    );
  return {
    plan: {
      ...plan,
      title: "Imported transcript",
      semesters: normalizeSemesters([...imported, ...plan.semesters]),
    },
    matched,
    unmatched: [...unmatched].sort(),
  };
}
