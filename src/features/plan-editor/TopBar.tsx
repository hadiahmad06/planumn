import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
import { SearchBox } from "@/features/search/SearchBox";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-canvas/95 px-4 backdrop-blur">
      <Link href="/" className="shrink-0 text-label font-semibold text-accent">
        planu.mn
      </Link>
      <div className="flex flex-1 justify-center">
        <SearchBox />
      </div>
      <UserMenu />
    </header>
  );
}
