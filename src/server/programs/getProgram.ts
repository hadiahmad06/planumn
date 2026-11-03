import "server-only";
import type { Program } from "@/domain/requirements";
import { findCoursesByGroupIds } from "@/server/catalog/courses";
import { fetchCourseDogCourses, fetchProgramVersions, type CourseDogCourse } from "./coursedog";
import { coursesByRequestedId, isCourseDogId } from "./deprecatedIds";
import { collectGroupIds, normalizeProgram, pickCurrentVersion, samplePlanUrl } from "./normalize";

/** Program requirements with every listed course resolved to the catalog where possible. */
export async function getProgram(programGroupId: string): Promise<Program | null> {
  const raw = pickCurrentVersion(await fetchProgramVersions(programGroupId));
  if (!raw) return null;

  const groupIds = collectGroupIds(raw);
  const inCatalog = findCoursesByGroupIds(groupIds);
  // 7-digit CourseDog ids, and the older 20-character ids some programs still use (C1c).
  const missing = groupIds.filter((id) => !inCatalog.has(id) && isCourseDogId(id));
  let byRequested = new Map<string, CourseDogCourse>();
  try {
    byRequested = coursesByRequestedId(await fetchCourseDogCourses(missing), missing);
  } catch {
    // Names for not-in-catalog courses are a nicety; the rail still works without them.
  }
  // Old ids resolve to the course's current group id, which may be in the catalog.
  const renamed = findCoursesByGroupIds([...byRequested.values()].map((c) => c.courseGroupId));

  const program = normalizeProgram(raw, (groupId) => {
    const c = inCatalog.get(groupId) ?? renamed.get(byRequested.get(groupId)?.courseGroupId ?? "");
    if (c) return { groupId, courseId: c.id, code: `${c.dept} ${c.number}`, title: c.title, credits: c.credits };
    const d = byRequested.get(groupId);
    if (!d) return { groupId, courseId: null, code: null, title: null, credits: null };
    const hours = d.credits?.creditHours;
    return {
      groupId,
      courseId: null,
      code: `${d.subjectCode} ${d.courseNumber}`,
      title: d.name,
      credits: hours?.min != null ? { min: hours.min, max: hours.max ?? hours.min } : null,
    };
  });
  const samplePlan = samplePlanUrl(raw); // B17
  return samplePlan ? { ...program, samplePlanUrl: samplePlan } : program;
}
