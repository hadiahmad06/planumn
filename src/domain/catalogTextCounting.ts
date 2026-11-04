/**
 * Phase C (Hadi's Claude): programs whose catalog-text readings (C2 credit constraints, C3 course
 * patterns) **count toward progress, tentatively**. Every other program shows them without counting.
 *
 * Hadi, 2026-11-03: readings count once C4 agrees with APAS. Hadi, 2026-11-04: "we should count them, but
 * be clear about how many of the requirements are full, maybe put a little warning icon with a number",
 * then "lets count whatever you seem fit for now, but make it all tentative. this is not hard "human
 * approved" just temporary" and "i told you in a rewinded message to only count for APAS-checked
 * programs". So: only the programs listed here count (`evaluateProgram`), the counting is labelled
 * tentative and temporary, and every program's requirements show ⚠ N (`catalogTextReadings`). This
 * supersedes the brief "count everywhere" reading of 2026-11-04.
 *
 * A program is listed by hand after `node scripts/apas-compare.ts` compares it with a real audit. The
 * check is program-wide, not per requirement: a listed program can hold readings in requirements APAS
 * never paired (EE's integrated B.E.E./M.S. requirements), so the wording never says a requirement
 * agreed with APAS. Each entry records the date of the latest check and how many distinct audits.
 */
export interface CatalogTextCheck {
  /** Date of the latest check. */
  checkedOn: string;
  /** Distinct real APAS audits the program's readings were checked against. */
  audits: number;
}

export const CATALOG_TEXT_COUNTED: Readonly<Record<string, CatalogTextCheck>> = {
  // Electrical Engineering B.E.E.: Technical Elective Program (22 from Core Department Electives, 34 in all,
  // the 4xxx/5xxx EE pattern, the 12-credit cap) paired with APAS's requirement of the same name and agreed,
  // on one audit (both sides "not met", so the met side isn't tested yet). Other EE requirements holding
  // readings, such as the integrated B.E.E./M.S. ones, weren't paired with APAS.
  "026421707": { checkedOn: "2026-11-03", audits: 1 },
};

/** How a program's catalog-text readings were checked against APAS, or undefined if never. */
export const catalogTextCheck = (programId: string): CatalogTextCheck | undefined =>
  Object.hasOwn(CATALOG_TEXT_COUNTED, programId) ? CATALOG_TEXT_COUNTED[programId] : undefined;

/** Does this program count its catalog-text readings (tentatively) by default? Only APAS-checked ones do. */
export const countsCatalogText = (programId: string) => catalogTextCheck(programId) !== undefined;

/**
 * "planu.mn checked this program's readings against one real APAS audit (2026-11-03); that check may not
 * have covered every requirement". Program-wide on purpose: it never claims that a given requirement agreed.
 */
export const describeCatalogTextCheck = ({ checkedOn, audits }: CatalogTextCheck) =>
  `planu.mn checked this program's readings against ${audits === 1 ? "one real APAS audit" : `${audits} real APAS audits`} (${checkedOn}); ` +
  `that check may not have covered every requirement`;
