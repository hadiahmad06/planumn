import { notFound } from "next/navigation";
import { ApasImport } from "@/features/apas/ApasImport";
import { apasImportEnabled } from "@/features/apas/flag";

/**
 * Written by Ishaan's Claude. APAS import via the browser extension (B1 step 1).
 * A2 (#100), Hadi's Claude: a 404 while the APAS import flag is off (the extension isn't published), so
 * the deployed site neither offers nor announces an import that can't work. See `flag.ts`.
 */
export default function Page() {
  if (!apasImportEnabled()) notFound();
  return <ApasImport />;
}
