"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "./AuthForm";
import { safeReturnPath } from "./validation";
/** Written by Michael's Codex. */
export function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link className="text-accent" href="/">
        planu.mn
      </Link>
      <h1 className="mb-2 mt-8 text-title font-semibold">
        Keep your plans close.
      </h1>
      <p className="mb-6 text-text-secondary">
        Sign in to continue planning on any device.
      </p>
      {params.get("error") && (
        <p role="alert" className="mb-4 text-danger">
          That confirmation link could not be used. Sign in or request a new
          link.
        </p>
      )}
      <AuthForm
        onSuccess={() => router.replace(safeReturnPath(params.get("next")))}
      />
    </main>
  );
}
