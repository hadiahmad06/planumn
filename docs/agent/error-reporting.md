# Error reporting (L6): where to look in Vercel

> Written by **Hadi's Claude**, 2026-11-22 (L6, #114). Default from #16: Vercel's built-in logs plus a React error boundary, no new vendor.

## What gets logged

Every error becomes **one line on stderr**, prefixed `[planumn:error]` and followed by JSON with these fields and no others:

| Field | Meaning |
|---|---|
| `source` | `render` (Server Component / server action / proxy, via `onRequestError`), `api` (a route handler: thrown, or caught and turned into a 5xx) or `client` (a client component crash reported by the error page) |
| `route` | The route pattern (`/plan/[planId]`, `/api/programs/[id]`), or for client crashes the pathname. Never a query string or `#` fragment (search terms, share snapshots) |
| `digest` | Next.js's digest for server errors, or the page's own `c-xxxxxxxx` reference for client crashes. Either way it is the **reference the student sees** on the error page |
| `message` | The error message, at most 500 characters, email-shaped text replaced with `[email]` |
| `stack` | At most 15 lines / 3000 characters, same scrubbing. Client stacks point into minified chunks |

Never logged: request headers, cookies, bodies, plans, course lists, names, emails, APAS data. Code: `src/server/errors/errorLog.ts` (the only writer), `src/instrumentation.ts`, `POST /api/client-error`, `src/features/errors/`.

## Where to look

1. Vercel dashboard → the planumn project → **Logs** (runtime logs). Filter by level **Error**, or search `planumn:error`.
2. A student quotes a reference from the error page → search the logs for it (it's the `digest` field).
3. CLI: `vercel logs <deployment-url>` streams the same lines live.
4. To check reporting on a deployment, open `/info/error-check` and press **Throw a test error**: a `source: "client"` line for `/info/error-check` should appear within seconds.

Runtime log retention on Vercel is short and depends on the plan (check the current limits in Vercel's docs), so look soon after a report or add a log drain later.

## Known gaps

- Next.js also prints its own `⨯ Error: …` line for server errors, with the raw (unscrubbed) message. That's Next's default output, not ours; server messages in this app are CourseDog/Supabase statuses, not student data.
- `/api/client-error` has no rate limit, so anyone can add lines to the log. Bodies are capped at 8 KB and only four string fields are read.
- `global-error.tsx` (root layout failure) was build-checked but not triggered in a test: nothing in the root layout can be made to throw from outside.
- Browser errors that don't crash a render (event handlers, rejected promises) don't reach an error boundary and aren't reported.
