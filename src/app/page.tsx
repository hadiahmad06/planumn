import { SiteHeader, SiteFooter } from "@/features/marketing/SiteChrome";
import { LandingActions } from "@/features/marketing/LandingActions";
import { PlanIllustration } from "@/features/marketing/PlanIllustration";
import { DemoVideo } from "@/features/marketing/DemoVideo";
/** Written by Michael's Codex. */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-12 pb-12 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">
              Your degree.
              <br />A plan you can see.
            </h1>
            <p className="mb-8 mt-6 max-w-lg text-lg leading-relaxed text-text-secondary">
              Make room for your major, your interests, and everything that
              comes next. Map your University of Minnesota courses, semester by
              semester.
            </p>
            <LandingActions />
            <DemoVideo />
          </div>
          <PlanIllustration />
        </section>
        <section
          className="grid gap-8 border-y border-border py-10 md:grid-cols-3"
          aria-label="Planning tools"
        >
          <div>
            <h2 className="text-lg font-semibold">See all four years.</h2>
            <p className="mt-2 leading-relaxed text-text-secondary">
              Move courses between semesters and see how the credits add up.
              Keep your whole plan in view.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Get to know a course.</h2>
            <p className="mt-2 leading-relaxed text-text-secondary">
              Compare descriptions, credits, past grades and offering history
              before adding a course.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Pick up where you left off.
            </h2>
            <p className="mt-2 leading-relaxed text-text-secondary">
              Start without an account using browser autosave, or sign in to
              keep your plans across devices.
            </p>
          </div>
        </section>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Planumn is an independent student project, not an official UMN degree
          audit. Catalog and grade data currently run through Fall 2024. Confirm
          requirements and future offerings with your advisor and the University
          catalog.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
