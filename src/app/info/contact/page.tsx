import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/features/marketing/SiteChrome";
export const metadata = { title: "Contact | planu.mn" };
/** Written by Michael's Codex. Contact details carried from the 2025 app. */
export default function Page() {
  const people = [
    {
      name: "Hadi Ahmad",
      email: "ahmad287@umn.edu",
      github: "hadiahmad06",
      linkedin: "hadiahmad06",
    },
    {
      name: "Michael Zewdie",
      email: "zewdi021@umn.edu",
      github: "Michael-Zewdie",
      linkedin: "michaelzewdie06",
    },
  ];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          Made on campus.
          <br />
          Open to your ideas.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-text-secondary">
          Questions, course data corrections, or an idea for making planning
          easier? Get in touch. For a bug report, include what you were trying
          to do and what happened. Please leave student IDs, passwords and
          transcripts out of your email.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {people.map((person) => (
            <section
              key={person.name}
              className="border-t-2 border-accent pt-5"
            >
              <h2 className="text-xl font-semibold">{person.name}</h2>
              <div className="mt-4 flex flex-col items-start gap-3 text-accent">
                <a className="underline" href={`mailto:${person.email}`}>
                  {person.email}
                </a>
                <a
                  className="underline"
                  href={`https://github.com/${person.github}`}
                >
                  GitHub
                </a>
                <a
                  className="underline"
                  href={`https://www.linkedin.com/in/${person.linkedin}`}
                >
                  LinkedIn
                </a>
              </div>
            </section>
          ))}
        </div>
        <p className="mt-12 text-sm text-text-secondary">
          For details on saved plans, transcript uploads, and deletion, read our{" "}
          <Link href="/info/privacy" className="text-accent underline">
            privacy notice
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
