import { Suspense } from "react";
import { NewPlan } from "./NewPlan";

/**
 * New empty plan. Owned by Michael's Codex (adds the "overwrite autosave?" prompt, A17).
 * Scaffold version: just opens the editor on an empty plan. Suspense because the plan's
 * start term depends on today's date, so it must render per request.
 */
export default function NewPlanPage() {
  return (
    <Suspense fallback={null}>
      <NewPlan />
    </Suspense>
  );
}
