import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/features/marketing/SiteChrome";
export const metadata = { title: "Privacy | planu.mn" };
/** Written by Michael's Codex. Describes implemented behavior; not a human-authored specification. */
export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          Your plans and your data.
        </h1>
        <p className="mb-10 mt-4 text-text-secondary">
          Privacy notice for the Planumn rebuild. Updated October 26, 2026.
        </p>
        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Accounts and saved plans
            </h2>
            <p>
              Supabase provides authentication and cloud storage. When you sign
              in, your account uses your email and authentication information.
              Cloud plans contain their title, course IDs, semesters, lock
              states, selected programs, ownership/access fields, and
              save/deletion timestamps. Authentication cookies keep you signed
              in.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Planning without an account
            </h2>
            <p>
              Your autosave and display preferences are stored in your browser.
              Anyone using the same browser profile may be able to open that
              autosave. Clearing browser site data removes the local copy.
              Browser autosaves do not automatically appear on another device.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">Transcript uploads</h2>
            <p>
              When you import a PDF, it is sent to the Planumn server and parsed
              in memory. The application does not save the uploaded PDF or raw
              transcript text. The resulting plan includes matched course IDs
              and semesters, not your name, student ID, grades or GPA. Review
              the match results before opening the plan; unmatched courses and
              transfer credits need manual attention.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">Page-view analytics</h2>
            <p>
              Vercel Web Analytics measures page views and general usage. Before
              sending a page URL, the app removes query strings and fragments
              and replaces saved-plan IDs with a generic path. Plan contents,
              transcript text and account email are not added to analytics
              events. Hosting and service providers may process operational
              request information under their own policies.
            </p>
            <p className="mt-2">
              <a
                className="text-accent underline"
                href="https://vercel.com/docs/analytics/privacy-policy"
              >
                Vercel Analytics privacy information
              </a>{" "}
              ·{" "}
              <a
                className="text-accent underline"
                href="https://supabase.com/privacy"
              >
                Supabase privacy policy
              </a>
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Deleting plans and accounts
            </h2>
            <p>
              Cloud plans moved to the recycle bin are scheduled for deletion
              after 30 days and can be recovered before that deadline. You can
              permanently remove individual deleted plans or clear the bin
              earlier. Automatic removal after the deadline depends on the
              configured backend cleanup. Clearing local browser data removes
              browser autosaves.
            </p>
            <p className="mt-2">
              Account deletion is available in Settings when enabled by the
              project operators. It requires your current password and explicit
              confirmation, then removes owned plans and the authentication
              account. If it is unavailable,{" "}
              <Link href="/info/contact" className="text-accent underline">
                contact us
              </Link>{" "}
              for a deletion request. Provider-managed logs and backups may have
              separate retention.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">Course data</h2>
            <p>
              Historical catalog and grade data come from the 2025 dataset
              derived from{" "}
              <a className="text-accent underline" href="https://umn.lol">
                GopherGrades
              </a>
              . They currently cover data through Fall 2024 and may be
              incomplete. Planumn is independently run and is not an official
              University degree audit.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold">Questions</h2>
            <p>
              Use the{" "}
              <Link href="/info/contact" className="text-accent underline">
                contact page
              </Link>{" "}
              for privacy or data requests. Do not send passwords or full
              transcripts by email.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
