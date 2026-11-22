import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SERVER_ERROR_CHECK_MESSAGE } from "@/features/errors/checks";
import { clientErrorReportsEnabled } from "@/server/errors/errorLog";

/**
 * L6 (Hadi's Claude, 2026-11-22, N2 on #115): a Server Component that always throws, to check that a
 * server error shows its digest and is logged once (by `onRequestError`, not again by the error page).
 * Off with `CLIENT_ERROR_REPORTS=off`, like `/api/client-error`.
 */
export const metadata: Metadata = { title: "Server error check | planu.mn", robots: { index: false, follow: false } };

async function Throws(): Promise<React.ReactNode> {
  await connection();
  if (!clientErrorReportsEnabled()) notFound();
  throw new Error(SERVER_ERROR_CHECK_MESSAGE);
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Checking…</p>}>
      <Throws />
    </Suspense>
  );
}
