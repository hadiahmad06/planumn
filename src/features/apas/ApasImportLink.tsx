import type { ReactNode } from "react";
import { apasImportEnabled } from "./flag";

/**
 * A2 (#100), Hadi's Claude: the one link to `/plan/apas`. Renders nothing when the APAS import flag is
 * off (`flag.ts`), so every entry point is hidden by the same switch. A test checks that no other file
 * links to `/plan/apas`.
 *
 * A plain <a>, not <Link> (Ishaan's Claude, #36 follow-up): the extension's bridge only loads on a full
 * page load of /plan/*, which a client-side navigation skips.
 */
export function ApasImportLink({ className, children }: { className?: string; children?: ReactNode }) {
  if (!apasImportEnabled()) return null;
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation on purpose (see above)
    <a href="/plan/apas" className={className}>
      {children}
    </a>
  );
}
