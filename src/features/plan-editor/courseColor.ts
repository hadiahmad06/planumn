import { courseLevel, type CourseSummary } from "@/domain/course";
import type { ColorKey } from "./displaySettings";

const STRIPES = ["--stripe-1", "--stripe-2", "--stripe-3", "--stripe-4", "--stripe-5", "--stripe-6"];

/** Department buckets from the 2026 redesign; other departments get a stable hashed stripe. */
const DEPT_BUCKET: Record<string, number> = {
  CSCI: 0, MATH: 0, STAT: 0, EE: 0, CSE: 0,
  MUS: 1, HSEM: 1, ENGL: 1, HIST: 1, PHIL: 1, ARTH: 1, ARTS: 1, TH: 1,
  PHYS: 2, CHEM: 2, BIOL: 2, PSY: 2, ESCI: 2, AST: 2, GCD: 2,
};

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** CSS color for a course card's stripe. */
export function stripeColor(course: Pick<CourseSummary, "dept" | "number"> | undefined, key: ColorKey): string {
  if (!course || key === "none") return "var(--stripe-neutral)";
  if (key === "level") {
    const level = courseLevel(course.number);
    return `var(${STRIPES[Math.min(Math.max(level / 1000 - 1, 0), STRIPES.length - 1)]})`;
  }
  return `var(${STRIPES[DEPT_BUCKET[course.dept] ?? hash(course.dept) % STRIPES.length]})`;
}
