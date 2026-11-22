/**
 * A2 (#100), Hadi's Claude: the build-time switch for everything that depends on the APAS extension,
 * which isn't published yet (B2 waits on the UMN policy check and store review).
 *
 * `NEXT_PUBLIC_APAS_IMPORT`: `1` (or `true`) turns it on, `0` (or `false`) turns it off. Unset, it is
 * **on under `next dev` and off in every other build** (`next build`, Vercel previews, tests), so the
 * deployed site never shows an import that can't work and local development needs no setup.
 *
 * Off means: `/plan/apas` returns 404, no link to it renders (My Plans, transcript import, the B21
 * reminder in Catalog updates) and the rail shows no "APAS says". Requirement progress never reads it.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` and `process.env.NODE_ENV` at build time, in server and
 * browser code alike, so both read the same value. They must stay written out literally here: a
 * dynamic lookup (`process.env[name]`) is not inlined.
 */
export const APAS_IMPORT_ENV = "NEXT_PUBLIC_APAS_IMPORT";

/** The flag's value for a raw env value and `NODE_ENV` (pure, for tests). */
export function apasImportFlag(value: string | undefined, nodeEnv: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return nodeEnv === "development";
}

/** True when APAS import, its links and "APAS says" are on in this build. */
export function apasImportEnabled(): boolean {
  return apasImportFlag(process.env.NEXT_PUBLIC_APAS_IMPORT, process.env.NODE_ENV);
}
