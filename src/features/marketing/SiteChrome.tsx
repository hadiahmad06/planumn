import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
import { DataCredit } from "./DataCredit";
/** Written by Michael's Codex. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight text-accent"
      >
        planu.mn
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-5">
        <Link
          className="hidden text-sm text-text-secondary hover:text-accent sm:block"
          href="/info/contact"
        >
          Contact
        </Link>
        <UserMenu />
      </nav>
    </header>
  );
}
/** Data credit line: Hadi's Claude (D2, #98). */
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 max-w-6xl border-t border-border px-6 py-8 text-sm text-text-secondary">
      <div className="flex flex-wrap justify-between gap-5">
        <p>Built by UMN students. Independently run.</p>
        <nav aria-label="Footer navigation" className="flex gap-6">
          <Link href="/info/contact" className="hover:text-accent">
            Contact
          </Link>
          <Link href="/info/privacy" className="hover:text-accent">
            Privacy
          </Link>
          <a
            href="https://github.com/hadiahmad06/planumn"
            className="hover:text-accent"
          >
            GitHub
          </a>
        </nav>
      </div>
      <p className="mt-4 text-xs leading-relaxed">
        <DataCredit linkClassName="underline underline-offset-2 hover:text-accent" />
      </p>
    </footer>
  );
}
