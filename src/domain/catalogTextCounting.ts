/**
 * Phase C (Hadi's Claude, 2026-11-03): programs whose catalog-text readings (C2 credit constraints, C3
 * course patterns) count toward progress. Hadi, 2026-11-03: they count once C4 agrees with APAS.
 *
 * A program is listed only after `node scripts/apas-compare.ts` reports it "eligible" on a real audit:
 * with the readings counted, no requirement disagrees with APAS, and every requirement that holds a
 * counted reading pairs with an APAS requirement (so the reading was actually checked). Each entry is the
 * date of that check. Everywhere else the readings stay shown, not counted.
 */
export const CATALOG_TEXT_COUNTED: Readonly<Record<string, string>> = {
  // Electrical Engineering B.E.E.: Technical Elective Program (22 from Core Department Electives, 34 in all,
  // the 4xxx/5xxx EE pattern, the 12-credit cap) paired with APAS's requirement of the same name and agreed.
  "026421707": "2026-11-03",
};

export const countsCatalogText = (programId: string) => Object.hasOwn(CATALOG_TEXT_COUNTED, programId);
