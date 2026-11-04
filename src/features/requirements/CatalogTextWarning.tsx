import { AlertIcon } from "@/components/ui/icons";
import { catalogTextCheck, describeCatalogTextCheck, type CatalogTextCheck } from "@/domain/catalogTextCounting";
import { requirementsNotFull, type CatalogTextReadings } from "@/domain/catalogTextReadings";
import type { ProgramResult } from "@/domain/requirements";

/**
 * Hadi, 2026-11-04 (Hadi's Claude): every program's rail says how many requirements aren't "full" (see
 * `catalogTextReadings`): ⚠ N on a requirement row (its readings) and on a program header (its
 * requirements that hold any). Only APAS-checked programs (`CATALOG_TEXT_COUNTED`) count the readings,
 * and only tentatively ("make it all tentative. this is not hard "human approved" just temporary"); the
 * rest show them without counting. The wording says which.
 */

/** How a program treats its catalog-text readings: counted (tentatively) or only shown, and how it was checked. */
export interface CatalogTextMode {
  counted: boolean;
  check?: CatalogTextCheck;
}

/** A program result's mode: counted as evaluated (`catalogTextCounted`), with its APAS check if any. */
export const catalogTextMode = (result: ProgramResult): CatalogTextMode => ({
  counted: result.catalogTextCounted,
  check: catalogTextCheck(result.program.id),
});

const TEMPORARY = "a temporary choice while more APAS audits are checked";

function modeLine({ counted, check }: CatalogTextMode): string {
  if (!counted) return " For this program they're only shown, not counted in your progress.";
  return ` For this program they count in your progress, tentatively: ${TEMPORARY}.` + (check ? ` ${describeCatalogTextCheck(check)}.` : "");
}

/** Screen-reader label of a requirement row's ⚠ N. */
export const requirementLabel = (count: number) => `${count} part${count === 1 ? "" : "s"} read from catalog text`;

/** Screen-reader label of a program header's ⚠ N: "1 requirement of 5 includes …", "2 requirements of 5 include …". */
export const programLabel = (notFull: number, total: number) =>
  `${notFull} requirement${notFull === 1 ? "" : "s"} of ${total} include${notFull === 1 ? "s" : ""} parts read from catalog text`;

export function requirementWarning({ count, cantCheck }: CatalogTextReadings, mode: CatalogTextMode): string {
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
    modeLine(mode)
  );
}

export function programWarning(notFull: number, total: number, mode: CatalogTextMode): string {
  return (
    `${programLabel(notFull, total)}, not UMN's structured data. ` +
    `planu.mn may have misread them. APAS or your advisor has the final word.` +
    modeLine(mode)
  );
}

/** The visible line of a C2/C3 box. */
export const catalogTextBoxLabel = (counted: boolean) =>
  counted ? "Read from catalog text · counted in progress (tentative)" : "Read from catalog text · not counted in progress";

/**
 * The heading of a C2/C3 box. Counted (an APAS-checked program): says so, tentatively, with the tooltip
 * on why and a visible line that planu.mn isn't UMN's official audit (Hadi, 2026-11-03). Shown only:
 * exactly as before counting existed, with `shownTitle` as its tooltip.
 */
export function CatalogTextLabel({ mode, what, shownTitle }: { mode: CatalogTextMode; what: string; shownTitle: string }) {
  if (!mode.counted)
    return (
      <p className="text-text-tertiary" title={shownTitle}>
        {catalogTextBoxLabel(false)}
      </p>
    );
  return (
    <>
      <p
        className="text-text-tertiary"
        title={
          `planu.mn read ${what} from the catalog's wording. For this program it counts these readings in your progress, tentatively: ${TEMPORARY}.` +
          (mode.check ? ` ${describeCatalogTextCheck(mode.check)}.` : " This program hasn't been checked against an APAS audit.") +
          ` The wording can still be misread, and the catalog can change. Lines marked "can't check" add nothing. APAS or your advisor has the final word.`
        }
      >
        {catalogTextBoxLabel(true)}
      </p>
      <p className="text-text-tertiary">
        planu.mn is a student-made planner, not UMN&apos;s official degree audit. Run APAS or ask your advisor before relying on this.
      </p>
    </>
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

/** A program header's ⚠ N: how many of its requirements aren't full, whether or not it counts them. */
export function ProgramCatalogTextBadge({ result }: { result: ProgramResult }) {
  const { notFull, total } = requirementsNotFull(result);
  return <CatalogTextBadge n={notFull} label={programLabel(notFull, total)} title={programWarning(notFull, total, catalogTextMode(result))} />;
}
