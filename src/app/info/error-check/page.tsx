import type { Metadata } from "next";
import { ErrorCheck } from "@/features/errors/ErrorCheck";

/**
 * L6 (Hadi's Claude, 2026-11-22): a page that throws on purpose, so the error page and the
 * `/api/client-error` log line can be checked on any deployment (and by the e2e suite). Not linked
 * from anywhere and not indexed. It only crashes the visitor's own tab.
 */
export const metadata: Metadata = { title: "Error check | planu.mn", robots: { index: false, follow: false } };

export default function Page() {
  return <ErrorCheck other="/plan/error-check" />;
}
