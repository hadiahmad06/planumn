import type { CourseDogCourse } from "./coursedog";

/**
 * Phase C/C1c (Hadi's Claude). Programs still reference some courses by an old 20-character CourseDog
 * id; the course now has a 7-digit group id and keeps the old one as `deprecatedCourseGroupId`
 * (e.g. CEGE 5218: `aT7UWrjzP4lvMr3krIMi` → `8283131`). CourseDog's course search accepts either.
 * Maps each requested id to the course it names.
 */
export function coursesByRequestedId(found: CourseDogCourse[], requested: string[]): Map<string, CourseDogCourse> {
  const wanted = new Set(requested);
  const out = new Map<string, CourseDogCourse>();
  for (const c of found) {
    for (const id of [c.courseGroupId, c.deprecatedCourseGroupId]) if (id && wanted.has(id) && !out.has(id)) out.set(id, c);
  }
  return out;
}

/** CourseDog course ids: 7 digits, or the older 20-character form. Anything else isn't looked up. */
export const isCourseDogId = (id: string) => /^(\d{7}|[A-Za-z0-9]{20})$/.test(id);

/** Only the older 20-character form (C1c). The B14 minor finder looks these up; it needs catalog ids only. */
export const isOldCourseDogId = (id: string) => /^[A-Za-z0-9]{20}$/.test(id) && !/^\d+$/.test(id);
