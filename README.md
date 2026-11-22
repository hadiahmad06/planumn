# planu.mn v2

Plan your University of Minnesota degree, semester by semester. Rebuild of the 2025 [planu.mn](https://planu.mn) (on `main`).

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + tests
```

`node scripts/check-2025-plans.ts <plans-export.json>` checks an export of the Supabase `plans` table (read-only; how to export is at the top of the script).

Requires Node ≥ 22.13. Course data: `data/catalog.db` (from [GopherGrades](https://umn.lol)). Docs: `docs/human/` (decisions), `docs/agent/` (agent notes, architecture).

Team: Hadi Ahmad ([@hadiahmad06](https://github.com/hadiahmad06)), Michael Zewdie ([@michael-zewdie](https://github.com/michael-zewdie)).
