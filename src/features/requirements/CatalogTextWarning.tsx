import { AlertIcon } from "@/components/ui/icons";
import { describeCatalogTextCheck, type CatalogTextCheck } from "@/domain/catalogTextCounting";
import type { CatalogTextReadings } from "@/domain/catalogTextReadings";

/**
 * Hadi, 2026-11-04 (Hadi's Claude): catalog-text readings count toward progress everywhere, so the rail
 * says how many requirements aren't "full" (see `catalogTextReadings`): ⚠ N on a requirement row (its
 * readings) and on a program header (its requirements that hold any).
 */

const checkedLine = (check: CatalogTextCheck | undefined) => (check ? ` For this program, these readings ${describeCatalogTextCheck(check)}.` : "");

export function requirementWarning({ count, cantCheck }: CatalogTextReadings, check?: CatalogTextCheck): string {
  const one = count === 1;
  const unchecked = !cantCheck
    ? ""
    : one
      ? " planu.mn can't check it, so it adds nothing to your progress."
      : ` ${cantCheck} of them planu.mn can't check, so ${cantCheck === 1 ? "that one adds" : "those add"} nothing to your progress.`;
  return (
    `${count} part${one ? "" : "s"} of this requirement ${one ? "was" : "were"} read from catalog text, not UMN's structured data. ` +
    `planu.mn may have misread ${one ? "it" : "them"}. APAS or your advisor has the final word.` +
    unchecked +
    checkedLine(check)
  );
}

export function programWarning(notFull: number, total: number, check?: CatalogTextCheck): string {
  return (
    `${notFull} of ${total} requirement${total === 1 ? "" : "s"} include${notFull === 1 ? "s" : ""} parts read from catalog text, not UMN's structured data. ` +
    `planu.mn may have misread them, and they count in your progress. APAS or your advisor has the final word.` +
    checkedLine(check)
  );
}

/** A small ⚠ N: `label` is what screen readers hear, `title` the hover tooltip. Renders nothing for 0. */
export function CatalogTextBadge({ n, label, title }: { n: number; label: string; title: string }) {
  if (n <= 0) return null;
  return (
    <span role="img" aria-label={label} title={title} className="inline-flex shrink-0 items-center gap-0.5 text-micro font-medium text-warning">
      <AlertIcon size={12} />
      {n}
    </span>
  );
}
