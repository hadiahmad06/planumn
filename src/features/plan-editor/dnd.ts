import type { CourseId } from "@/domain/course";
import type { CourseSlot } from "@/domain/planOps";
import type { TermCode } from "@/domain/terms";

/**
 * One drag-and-drop vocabulary for the whole plan view. Drag sources: planned courses (schedule),
 * search results, and (A27) requirement rows. Drop targets: semesters and the planned courses in them.
 */
export type DragData =
  | { type: "planned"; term: TermCode; index: number; courseId: CourseId }
  | { type: "external"; source: "search" | "requirement"; courseId: CourseId };

export type DropData = { type: "semester"; term: TermCode } | { type: "planned"; term: TermCode; index: number; courseId: CourseId };

export const plannedId = (term: TermCode, courseId: CourseId) => `pc:${term}:${courseId}`;
export const semesterId = (term: TermCode) => `sem:${term}`;
export const externalId = (source: string, courseId: CourseId) => `${source}:${courseId}`;

export type DropAction =
  | { kind: "move"; from: CourseSlot; to: CourseSlot }
  | { kind: "add"; term: TermCode; index: number; courseId: CourseId }
  | null;

/** Turn a finished drag into a plan edit. `semesterLength` = course count of the target semester. */
export function resolveDrop(active: DragData | undefined, over: DropData | undefined, semesterLength: (term: TermCode) => number): DropAction {
  if (!active || !over) return null;
  const to: CourseSlot =
    over.type === "semester" ? { term: over.term, index: semesterLength(over.term) } : { term: over.term, index: over.index };
  if (active.type === "planned") {
    // Dropping on the semester background of its own semester means "move to the end".
    if (over.type === "semester" && over.term === active.term) to.index = Math.max(semesterLength(over.term) - 1, 0);
    return { kind: "move", from: { term: active.term, index: active.index }, to };
  }
  return { kind: "add", term: to.term, index: to.index, courseId: active.courseId };
}
