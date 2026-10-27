"use client";

import { courseCode, type CourseDetails, type CourseId, type CourseSummary } from "@/domain/course";
import type { Plan, PlannedCourse } from "@/domain/plan";
import { academicYear, seasonOf, termLabel, toTermCode, type Season, type TermCode } from "@/domain/terms";
import { usePreviewStore } from "@/features/preview/store";
import { moveLabel, moveTargets, moveTo } from "./moveCourse";
import { planActions } from "./store";

export interface CourseAction {
  label: string;
  run: () => void;
  danger?: boolean;
  /** Draw a separator before this item. */
  separated?: boolean;
}

const SEASONS: Season[] = ["fall", "spring", "summer"];

/** Everything you can do to a planned course (A31). Shared by the right-click and mobile menus. */
export function courseActions(
  term: TermCode,
  planned: PlannedCourse,
  course: CourseSummary | CourseDetails | undefined,
  hiddenSeasons: Season[] = [],
): CourseAction[] {
  const id: CourseId = planned.id;
  const locked = planned.lock === "locked";
  const year = academicYear(term);
  const season = seasonOf(term);
  const termFor = (s: Season, y = year) => toTermCode({ year: s === "fall" ? y : y + 1, season: s });
  const actions: CourseAction[] = [{ label: "Details", run: () => usePreviewStore.getState().openPreview(id) }];

  if (!locked) {
    // The ‹ › arrows' moves first: snap to the nearest term the course is offered in.
    const targets = moveTargets(term, id, hiddenSeasons);
    const code = course ? courseCode(course) : "Course";
    const snaps = (["earlier", "later"] as const).flatMap((dir) => {
      const target = targets[dir];
      return target ? [{ term: target.term, label: moveLabel(dir, target), run: () => moveTo(term, id, target, code) }] : [];
    });
    // Then the fixed moves (other seasons this year, same season a year earlier / later), minus repeats.
    // Hidden seasons are skipped: moving there would make the course vanish from view (review of #22).
    const fixed = [...SEASONS.filter((s) => s !== season && !hiddenSeasons.includes(s)).map((s) => termFor(s)), termFor(season, year - 1), termFor(season, year + 1)]
      .filter((t) => !snaps.some((m) => m.term === t))
      .map((t) => ({ label: `Move to ${termLabel(t)}`, run: () => planActions.moveCourseToTerm(term, id, t) }));
    [...snaps.map(({ label, run }) => ({ label, run })), ...fixed].forEach((a, i) => actions.push({ ...a, separated: i === 0 }));
  }
  actions.push({
    label: locked ? "Unlock" : "Lock (already taken)",
    run: () => planActions.setLock(term, id, locked ? "unlocked" : "locked"),
    separated: true,
  });
  if (course)
    actions.push({
      label: "Copy course code",
      run: () => {
        const code = courseCode(course);
        // Clipboard can fail (insecure context, permission); fall back to a prompt the user can copy from.
        navigator.clipboard?.writeText(code).catch(() => window.prompt("Copy the course code:", code));
        if (!navigator.clipboard) window.prompt("Copy the course code:", code);
      },
    });
  const url = course && "catalogUrl" in course ? course.catalogUrl : null;
  if (url) actions.push({ label: "Open in UMN catalog", run: () => window.open(url, "_blank", "noopener") });
  if (!locked) actions.push({ label: "Remove from plan", run: () => planActions.removeCourse(term, id), danger: true, separated: true });
  return actions;
}

/** "Add to <semester>" choices for a course that isn't in the plan yet (mobile tap-to-add, A32). */
export function addCourseActions(courseId: CourseId, plan: Plan | null, hiddenSeasons: Season[]): CourseAction[] {
  const terms = (plan?.semesters ?? []).filter((s) => !hiddenSeasons.includes(seasonOf(s.index))).map((s) => s.index);
  return [
    ...terms.map((t) => ({ label: `Add to ${termLabel(t)}`, run: () => planActions.addCourse(t, courseId) })),
    { label: "Details", run: () => usePreviewStore.getState().openPreview(courseId), separated: terms.length > 0 },
  ];
}
