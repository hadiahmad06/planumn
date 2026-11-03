import { Suspense } from "react";
import { PlanLoader } from "@/features/plans/PlanLoader";
/** Written by Michael's Codex. Async params are resolved inside Suspense. */
async function Loaded({ params }: { params: Promise<{ planId: string }> }) {
  return <PlanLoader key={(await params).planId} id={(await params).planId} />;
}
export default function Page(props: { params: Promise<{ planId: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Loading your plan…</p>}>
      <Loaded {...props} />
    </Suspense>
  );
}
