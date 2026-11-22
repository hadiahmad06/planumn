"use client";

import type { CourseId } from "@/domain/course";
import { snapMove, type SnapTarget } from "@/domain/moveSnap";
import { termLabel, type Season, type TermCode } from "@/domain/terms";
import { useCourseCache } from "@/features/catalog/courseCache";
import { planActions, usePlanStore } from "./store";

/** Polite screen-reader announcement; one shared live region, created on first use. */
export function announce(text: string) {
  let el = document.getElementById("planumn-announcer");
  if (!el) {
    el = document.createElement("div");
    el.id = "planumn-announcer";
    el.setAttribute("role", "status");
    el.className = "sr-only";
    document.body.appendChild(el);
  }
  el.textContent = "";
  const region = el;
  requestAnimationFrame(() => (region.textContent = text));
}

/** Where the ‹ › arrows would send this course right now (null = nowhere to go). */
export function moveTargets(term: TermCode, id: CourseId, hiddenSeasons: readonly Season[]) {
  const plan = usePlanStore.getState().plan;
  const offered = useCourseCache.getState().courses[id]?.termsOffered;
  if (!plan) return { earlier: null, later: null };
  return {
    earlier: snapMove(plan, term, id, "earlier", offered, hiddenSeasons),
    later: snapMove(plan, term, id, "later", offered, hiddenSeasons),
  };
}

/** Short enough for a menu item at phone width; `moveFullLabel` keeps the whole note. */
export function moveLabel(direction: "earlier" | "later", target: SnapTarget | null): string {
  if (!target) return direction === "earlier" ? "No earlier offered term in your plan" : "No later offered term in your plan";
  const note = target.offeringKnown ? "" : target.limitedShort ? ` · ${target.limitedShort}` : target.limitedNote ? ` · ${target.limitedNote}, a guess` : " (offering pattern unknown)";
  return `Move ${direction} to ${termLabel(target.term)}${note}`;
}

/** For `aria-label`: the same move with the full limited-history note. */
export function moveFullLabel(direction: "earlier" | "later", target: SnapTarget | null): string {
  if (!target?.limitedNote) return moveLabel(direction, target);
  return `Move ${direction} to ${termLabel(target.term)} (${target.limitedNote}, a guess)`;
}

/** Move, announce, and keep keyboard focus on the moved card in its new semester. */
export function moveTo(from: TermCode, id: CourseId, target: SnapTarget, code: string) {
  planActions.moveCourseToTerm(from, id, target.term);
  announce(`${code} moved to ${termLabel(target.term)}`);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-course-card="${target.term}:${id}"]`)?.focus()),
  );
}
