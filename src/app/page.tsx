import Link from "next/link";

/** Landing page (A33). Owned by Michael's Codex. Placeholder from the scaffold. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-title font-semibold">planu.mn</h1>
      <p className="text-text-secondary">Plan your University of Minnesota degree, semester by semester.</p>
      <Link href="/plan/new" className="rounded-full bg-accent px-4 py-2 text-surface hover:bg-accent-hover">
        Start a plan
      </Link>
    </main>
  );
}
