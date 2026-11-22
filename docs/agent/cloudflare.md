# Hosting on Cloudflare Workers

> Written by **Hadi's Claude**, 2026-11-22. Hadi chose to move hosting from Vercel to Cloudflare (free plan).

"Cloudflare D1" below is Cloudflare's SQLite database, not decision D1 in `delegation-plan.md`.

## How it works

- **Build:** [vinext](https://github.com/cloudflare/vinext) rebuilds the unchanged `src/app` on Vite and runs it in a Worker. `npm run build:vinext` writes `dist/` (gitignored), including `dist/server/wrangler.json`, which is the config that actually deploys. `next build` still works and CI runs both builds, so Vercel keeps serving until the DNS cutover.
- **Config:** `vite.config.ts`, `wrangler.jsonc` (Worker `planumn`, `nodejs_compat`, `keep_vars`, the Cloudflare D1 binding) and `postcss.config.mjs` (Tailwind for Vite, because vinext ignores `turbopack.rules`). They hold **no** tokens or account ids.
- **Course catalog:** in a Worker it reads the Cloudflare D1 database `planumn-catalog` (binding `CATALOG_DB`). Everywhere else (Vitest, `next dev`/`next start`) it reads `data/catalog.db` with `node:sqlite`. `src/server/catalog/db.ts` picks one and exposes the same async `all()`.
  - Every query must run on both. That means at most 100 bound parameters (Cloudflare D1's limit), so lists go in as one JSON string through `json_each(?)`, and each statement stays under 100 KB.
  - `src/server/catalog/d1Schema.ts` defines the tables the app reads (`CATALOG_TABLES`) and the derived data (`DERIVED_SQL`):
    - `course_terms`: one row per course with its offered terms.
    - Five indexes. The 2025 catalog has none, so without them every join would scan whole tables, and on the free plan every row a query scans counts against 5 million rows read per day.
- **Loading the catalog:** `npm run export:d1` writes `.wrangler/catalog-d1.sql` (about 30 MB) from `data/catalog.db`. The script drops the foreign keys, because two GopherGrades rows name a department that isn't in the data and Cloudflare D1 always enforces foreign keys. Load it with:
  - `npx wrangler d1 execute planumn-catalog --local --file .wrangler/catalog-d1.sql`
  - `--remote` instead of `--local` for production.

  The file drops and recreates its tables, so after a catalog rebuild you just export and load again. No redeploy is needed.
- **Caching:** `"use cache"` (CourseDog programs, Lib Ed, minors) uses vinext's in-memory cache, one per Worker isolate. There is no KV and no shared cache (`vinext init --cdn-cache=none --data-cache=none --image-optimization=none`). That keeps the free plan simple, but a fresh isolate fetches CourseDog again.
- **Secrets:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are build variables, and also runtime text variables, in Cloudflare. `SUPABASE_SERVICE_ROLE_KEY` is a runtime secret, set by Hadi in the dashboard. Agents never handle it.
- **Hadi's rule:** no Cloudflare tokens, MCP config or account-specific setup in this repo. API access for agents is a network secret on Hadi's own cloud environment (host `api.cloudflare.com`).

## Checked locally (2026-11-22)

`wrangler dev` on the vinext build, with the catalog loaded into a local Cloudflare D1:

- **Course API:** search, course details, by-code lookup, departments and instructors return the same data as before.
- **Transcript import:** behaves the same as under `next start`.
- **Browser tests:** all 8 smoke tests pass (`E2E_BASE_URL=http://localhost:8787`).
- **Home page:** renders the same as under Next.js.
- **Size:** about 1.1 MB gzipped, under the free plan's 3 MB Worker limit.
- **Unit tests:** all pass on the `node:sqlite` path.

Not yet run on Cloudflare itself: signed-in Supabase flows, and the latency and rows read in production.

## Known gaps

- **Search scans titles:** each title search still reads every Twin Cities course (about 11,000 rows), which is about 450 searches a day per 5 million rows. Course-code searches use the index. If usage gets near the limit, move title search to FTS5 or an in-memory index per isolate.
- **Experimental vinext feature:** vinext reports `cacheComponents` as experimental. `partialPrefetching` is a Next.js-only setting.
- **Vercel Analytics:** it only collects data on Vercel. Remove it at cutover, or replace it with Cloudflare Web Analytics.

## Setup and cutover

These are the dashboard steps Hadi was given on 2026-11-22: API token, the `planumn-catalog` database, Workers Builds connected to GitHub, variables, then DNS. In summary:

- **Workers Builds:**
  - Build command: `npm run build:vinext`
  - Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`
  - Non-production branch deploy command: `npx wrangler versions upload --config dist/server/wrangler.json`
- **DNS cutover:** delete the `planu.mn` and `www` A records that point to Vercel, then add both as Custom Domains on the Worker. Then remove the `*.planu.mn` A records and the `_domainconnect` CNAME, which are Vercel leftovers. Keep the CAA and TXT records.
