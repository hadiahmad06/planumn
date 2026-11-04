/**
 * Phase C (Hadi's Claude): programs whose catalog-text readings (C2 credit constraints, C3 course
 * patterns) were **checked against real APAS audits**.
 *
 * Hadi, 2026-11-03: readings count once C4 agrees with APAS. Superseded by Hadi, 2026-11-04: "we should
 * count them, but be clear about how many of the requirements are full, maybe put a little warning icon
 * with a number". Readings now count for **every** program (`evaluateProgram`), each requirement holding
 * one shows a warning with the count (`catalogTextReadings`), and this list only drives the wording: a
 * listed program's tooltips add that its readings agreed with a real APAS audit.
 *
 * A program is listed only after `node scripts/apas-compare.ts` reports it "eligible" on a real audit:
 * with the readings counted, no requirement disagrees with APAS, and every reading is checked (the pair
 * nearest to the rule holding it agrees, `uncheckedReadings`). Each entry records the date of the latest
 * check and how many distinct audits agreed, so the wording matches the evidence.
 */
export interface CatalogTextCheck {
  /** Date of the latest agreeing check. */
  checkedOn: string;
  /** Distinct real APAS audits that agreed. */
  audits: number;
}

export const CATALOG_TEXT_COUNTED: Readonly<Record<string, CatalogTextCheck>> = {
  // Electrical Engineering B.E.E.: Technical Elective Program (22 from Core Department Electives, 34 in all,
  // the 4xxx/5xxx EE pattern, the 12-credit cap) paired with APAS's requirement of the same name and agreed,
  // on one audit (both sides "not met", so the met side isn't tested yet).
  "026421707": { checkedOn: "2026-11-03", audits: 1 },
};

/** How a program's catalog-text readings were checked against APAS, or undefined if never. */
export const catalogTextCheck = (programId: string): CatalogTextCheck | undefined =>
  Object.hasOwn(CATALOG_TEXT_COUNTED, programId) ? CATALOG_TEXT_COUNTED[programId] : undefined;

/** "agreed with a real APAS audit (checked 2026-11-03)", "agreed with 2 real APAS audits (…)". */
export const describeCatalogTextCheck = ({ checkedOn, audits }: CatalogTextCheck) =>
  `agreed with ${audits === 1 ? "a real APAS audit" : `${audits} real APAS audits`} (checked ${checkedOn})`;
