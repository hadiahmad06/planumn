import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
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
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 flex max-w-6xl flex-wrap justify-between gap-5 border-t border-border px-6 py-8 text-sm text-text-secondary">
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
    </footer>
  );
}
