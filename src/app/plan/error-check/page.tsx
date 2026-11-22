import type { Metadata } from "next";
import { ErrorCheck } from "@/features/errors/ErrorCheck";

/** L6 (Hadi's Claude, 2026-11-22, M1 on #115): `/info/error-check`, but under `/plan`'s own error boundary. */
export const metadata: Metadata = { title: "Error check | planu.mn", robots: { index: false, follow: false } };

export default function Page() {
  return <ErrorCheck />;
}
