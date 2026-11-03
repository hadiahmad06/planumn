/** Written by Michael's Codex. Public catalog observations only; no plan/account/audit identity. */
export interface CatalogItem {
  key: string;
  label: string;
  summary: string;
  fingerprint: string;
}
export interface CatalogCheck {
  items: CatalogItem[];
  unavailable: string[];
  checkedAt: string;
}
export interface CatalogHistory {
  version: 1;
  items: Record<string, { item: CatalogItem; checkedAt: string }>;
}
export const HISTORY_KEY = "planumn:catalog-history:v1";
export const MAX_HISTORY = 1000;
export const emptyHistory = (): CatalogHistory => ({ version: 1, items: {} });
function validItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CatalogItem;
  return (
    typeof item.key === "string" &&
    /^(course:\d+|program:[A-Za-z0-9]{1,40})$/.test(item.key) &&
    typeof item.label === "string" &&
    item.label.length <= 300 &&
    typeof item.summary === "string" &&
    item.summary.length <= 1000 &&
    typeof item.fingerprint === "string" &&
    /^[a-f0-9]{64}$/.test(item.fingerprint)
  );
}
export function readHistory(raw: string | null): CatalogHistory {
  if (!raw) return emptyHistory();
  try {
    if (raw.length > 1_500_000) throw new Error();
    const parsed = JSON.parse(raw) as CatalogHistory;
    if (
      parsed.version !== 1 ||
      !parsed.items ||
      typeof parsed.items !== "object" ||
      Array.isArray(parsed.items) ||
      Object.keys(parsed.items).length > MAX_HISTORY
    )
      throw new Error();
    for (const [key, row] of Object.entries(parsed.items))
      if (
        !row ||
        !validItem(row.item) ||
        key !== row.item.key ||
        typeof row.checkedAt !== "string" ||
        !Number.isFinite(Date.parse(row.checkedAt))
      )
        throw new Error();
    return parsed;
  } catch {
    throw new Error(
      "Catalog check history could not be read. Reset this feature's history to start a new reference.",
    );
  }
}
export function compareCatalog(history: CatalogHistory, check: CatalogCheck) {
  const changed: {
    before: CatalogItem;
    after: CatalogItem;
    lastChecked: string;
  }[] = [];
  let firstSeen = 0;
  for (const item of check.items) {
    const old = history.items[item.key];
    if (!old) firstSeen++;
    else if (old.item.fingerprint !== item.fingerprint)
      changed.push({
        before: old.item,
        after: item,
        lastChecked: old.checkedAt,
      });
  }
  return { changed, firstSeen };
}
/** Only acknowledged successful observations replace references; unavailable items keep their old reference. */
export function rememberCatalog(
  history: CatalogHistory,
  check: CatalogCheck,
): CatalogHistory {
  const items = { ...history.items };
  for (const item of check.items)
    if (!items[item.key] || items[item.key].checkedAt <= check.checkedAt)
      items[item.key] = { item, checkedAt: check.checkedAt };
  const sorted = Object.entries(items).sort((a, b) =>
    b[1].checkedAt.localeCompare(a[1].checkedAt),
  );
  return {
    version: 1,
    items: Object.fromEntries(sorted.slice(0, MAX_HISTORY)),
  };
}
