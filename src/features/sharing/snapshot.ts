import { createEmptyPlan, type Plan, type LockState } from "@/domain/plan";
import { isPlan } from "@/features/plans/validation";

/** Written by Michael's Codex. Versioned, bounded snapshot links contain no cloud identifiers or ACLs. */
export const MAX_SHARE_CHARS = 12000;
const LOCKS: LockState[] = ["unlocked", "locked", "autofilled"];
const invalid = () =>
  new Error(
    "This sharing link is incomplete or invalid. Ask the sender for a new link.",
  );
export function encodeSnapshot(plan: Plan): string {
  if (!isPlan(plan)) throw invalid();
  const compact = [
    plan.title,
    plan.programs,
    plan.semesters.map((semester) => [
      semester.index,
      semester.courses.map((course) => [course.id, LOCKS.indexOf(course.lock)]),
      // B2 (Ishaan's Claude): optional third element, only when the semester has placeholders.
      ...(semester.placeholders?.length
        ? [
            semester.placeholders.map((p) =>
              p.libEd ? [p.label, p.credits, p.libEd] : [p.label, p.credits],
            ),
          ]
        : []),
    ]),
  ];
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  const token =
    "v1." +
    btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  if (token.length > MAX_SHARE_CHARS)
    throw new Error(
      "This plan is too large for a snapshot link. Export a PDF to share it instead.",
    );
  return token;
}
export function decodeSnapshot(token: string, now = new Date()): Plan {
  try {
    if (token.length > MAX_SHARE_CHARS || !/^v1\.[A-Za-z0-9_-]+$/.test(token))
      throw invalid();
    const raw = atob(token.slice(3).replace(/-/g, "+").replace(/_/g, "/"));
    const data: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(raw, (character) => character.charCodeAt(0)),
      ),
    );
    if (!Array.isArray(data) || data.length !== 3 || !Array.isArray(data[2]))
      throw invalid();
    const semesters = data[2].map((term: unknown) => {
      if (
        !Array.isArray(term) ||
        (term.length !== 2 && term.length !== 3) ||
        !Array.isArray(term[1]) ||
        (term.length === 3 && !Array.isArray(term[2]))
      )
        throw invalid();
      // B2 (Ishaan's Claude): placeholders get fresh keys; isPlan validates the rest.
      const placeholders =
        term.length === 3
          ? (term[2] as unknown[]).map((entry, i) => {
              if (!Array.isArray(entry) || entry.length < 2 || entry.length > 3)
                throw invalid();
              return {
                key: `p${i + 1}`,
                label: entry[0],
                credits: entry[1],
                ...(entry.length === 3 ? { libEd: entry[2] } : {}),
              };
            })
          : undefined;
      return {
        ...(placeholders ? { placeholders } : {}),
        index: term[0],
        courses: term[1].map((course: unknown) => {
          if (
            !Array.isArray(course) ||
            course.length !== 2 ||
            !Number.isInteger(course[1]) ||
            course[1] < 0 ||
            course[1] >= LOCKS.length
          )
            throw invalid();
          return { id: course[0], lock: LOCKS[course[1]] };
        }),
      };
    });
    const plan = {
      ...createEmptyPlan(now),
      title: data[0],
      programs: data[1],
      semesters,
    };
    if (
      !isPlan(plan) ||
      new Set(plan.semesters.map((s) => s.index)).size !== plan.semesters.length
    )
      throw invalid();
    return plan;
  } catch {
    throw invalid();
  }
}
/** Explicit copy action always creates a new row; never reuse a sender's ownership or lifecycle fields. */
export function copySnapshot(plan: Plan, now = new Date()): Plan {
  const snapshot = decodeSnapshot(encodeSnapshot(plan), now);
  return {
    ...snapshot,
    title: `${(snapshot.title || "Untitled plan").slice(0, 290)} (copy)`,
  };
}
