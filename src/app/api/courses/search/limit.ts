export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

/** `limit` must be a whole number; values outside 1–100 are clamped. Returns null if invalid. */
export function parseLimit(raw: string | null): number | null {
  if (raw === null || raw === "") return DEFAULT_LIMIT;
  if (!/^-?\d+$/.test(raw.trim())) return null;
  return Math.min(Math.max(Number(raw), 1), MAX_LIMIT);
}
