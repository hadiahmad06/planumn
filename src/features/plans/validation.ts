import type { Plan } from "@/domain/plan";
/** Written by Michael's Codex. Accept only the 2025 persisted row format. */
export function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Plan;
  return (
    (p.id === null || typeof p.id === "string") &&
    (p.user_id === null || typeof p.user_id === "string") &&
    typeof p.title === "string" &&
    p.title.length <= 300 &&
    Array.isArray(p.programs) &&
    p.programs.length <= 50 &&
    p.programs.every((id) => typeof id === "string" && id.length <= 100) &&
    Array.isArray(p.can_view) &&
    p.can_view.every((id) => typeof id === "string") &&
    typeof p.created_at === "string" &&
    Number.isFinite(Date.parse(p.created_at)) &&
    typeof p.last_updated === "string" &&
    Number.isFinite(Date.parse(p.last_updated)) &&
    (p.deletion_scheduled_at === null ||
      (typeof p.deletion_scheduled_at === "string" &&
        Number.isFinite(Date.parse(p.deletion_scheduled_at)))) &&
    Array.isArray(p.semesters) &&
    p.semesters.length <= 150 &&
    p.semesters.every(
      (s) =>
        s &&
        /^1\d{2}[359]$/.test(s.index) &&
        Array.isArray(s.courses) &&
        s.courses.length <= 100 &&
        s.courses.every(
          (c) =>
            c &&
            Number.isSafeInteger(c.id) &&
            c.id > 0 &&
            ["locked", "unlocked", "autofilled"].includes(c.lock),
        ),
    )
  );
}
