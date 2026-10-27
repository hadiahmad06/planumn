import "server-only";
import type { CourseOption, Program } from "@/domain/requirements";
import { findCoursesByGroupIds } from "@/server/catalog/courses";
import { fetchCourseDogCourses, fetchProgramVersions } from "./coursedog";
import { collectGroupIds, normalizeProgram, pickCurrentVersion } from "./normalize";

/** Program requirements with every listed course resolved to the catalog where possible. */
export async function getProgram(programGroupId: string): Promise<Program | null> {
  const raw = pickCurrentVersion(await fetchProgramVersions(programGroupId));
  if (!raw) return null;

  const groupIds = collectGroupIds(raw);
  const inCatalog = findCoursesByGroupIds(groupIds);
  // CourseDog's own ids are 7 digits; anything else (course sets, etc.) can't be looked up.
  const missing = groupIds.filter((id) => !inCatalog.has(id) && /^\d{7}$/.test(id));
  const external = new Map<string, CourseOption>();
  try {
    for (const c of await fetchCourseDogCourses(missing)) {
      const hours = c.credits?.creditHours;
      external.set(c.courseGroupId, {
        groupId: c.courseGroupId,
        courseId: null,
        code: `${c.subjectCode} ${c.courseNumber}`,
        title: c.name,
        credits: hours?.min != null ? { min: hours.min, max: hours.max ?? hours.min } : null,
      });
    }
  } catch {
    // Names for not-in-catalog courses are a nicety; the rail still works without them.
  }

  return normalizeProgram(raw, (groupId) => {
    const c = inCatalog.get(groupId);
    if (c) return { groupId, courseId: c.id, code: `${c.dept} ${c.number}`, title: c.title, credits: c.credits };
    return external.get(groupId) ?? { groupId, courseId: null, code: null, title: null, credits: null };
  });
}
