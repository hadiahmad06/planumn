import type { Plan } from "@/domain/plan";
/** Written by Michael's Codex. A first cloud insert gives reloads a stable destination. */
export function savedPlanPath(
  previous: Plan | null,
  current: Plan | null,
  pathname: string,
) {
  return !previous?.id &&
    current?.id &&
    current.user_id &&
    ["/plan/new", "/plan/import", "/plan/autosave"].includes(pathname)
    ? `/plan/${encodeURIComponent(current.id)}`
    : null;
}
