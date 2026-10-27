"use client";
/** Written by Michael's Codex. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="space-y-4 p-8">
      <h1 className="text-xl font-semibold">The plan could not be displayed</h1>
      <p>Your stored plan has been kept. Try loading it again.</p>
      <button className="text-accent underline" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
