import type { Metadata } from "next";
import { SharedPlan } from "@/features/sharing/SharedPlan";
/** Written by Michael's Codex. Snapshot fragments are read by the client only. */
export const metadata: Metadata = {
  title: "Shared plan snapshot | planu.mn",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return <SharedPlan />;
}
