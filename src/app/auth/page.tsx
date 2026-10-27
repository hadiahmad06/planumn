import { Suspense } from "react";
import { SignInPage } from "@/features/auth/SignInPage";
/** Written by Michael's Codex. */
export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading sign-in…</p>}>
      <SignInPage />
    </Suspense>
  );
}
