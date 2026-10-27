import "server-only";
import type { CourseSummary } from "@/domain/course";

export interface CourseRow {
  id: number;
  dept_abbr: string;
  course_num: string;
  class_desc: string;
  cred_min: number | null;
  cred_max: number | null;
}

export function toSummary(r: CourseRow): CourseSummary {
  const min = r.cred_min ?? r.cred_max ?? 0;
  return {
    id: r.id,
    dept: r.dept_abbr,
    number: r.course_num,
    title: r.class_desc,
    credits: { min, max: r.cred_max ?? min },
  };
}

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
