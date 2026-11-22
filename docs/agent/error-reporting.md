# Error reporting (L6): where to look in Vercel

> Written by **Hadi's Claude**, 2026-11-22 (L6, #114). Default from #16: Vercel's built-in logs plus a React error boundary, no new vendor. Updated the same day for the review on #115.

## What gets logged

Every error becomes **one line on stderr**, prefixed `[planumn:error]` and followed by JSON with these fields and no others:

| Field | Meaning |
|---|---|
| `source` | `render` (Server Component / server action / proxy, via `onRequestError`), `api` (a route handler: thrown, or caught and turned into a 5xx) or `client` (a client component crash reported by the error page) |
| `route` | The route pattern (`/plan/[planId]`, `/api/programs/[id]`). Client pathnames are turned into patterns too (a UUID after `/plan/` → `[planId]`, other UUIDs and 4+ digit segments → `[id]`). Never a query string or `#` fragment (search terms, share snapshots) |
| `digest` | Next.js's digest for server errors, or the page's own `c-xxxxxxxx` reference for client crashes. Either way it is the **reference the student sees** on the error page |
| `message` | The error message, at most 500 characters, email-shaped text replaced with `[email]`. In client reports, everything from the first to the last quote on a line becomes `"[text]"` (V8 quotes its input in `JSON.parse` errors, which could be a plan) |
| `stack` | At most 15 lines / 3000 characters, same scrubbing. Client stacks point into minified chunks |

The line is JSON with U+2028/U+2029 escaped too, so a message can't break it into two lines.

Never logged: request headers, cookies, bodies, plans, course lists, names, emails, APAS data. Code: `src/server/errors/errorLog.ts` (the only writer), `src/instrumentation.ts`, `POST /api/client-error`, `src/features/errors/`.

## One crash, one line, one reference

- **Server Component, action, route handler or proxy error:** one `render`/`api` line from `onRequestError`. The error page shows Next's digest and does **not** report again from the browser.
- **Client component crash:** one `client` line, sent by the error page, under the `c-…` reference the page shows. At most one report per page load; a second crash after "Try again" shows the same reference.
- **Client component that also throws while the server renders its HTML** (`renderSource: "server-rendering"`): the server copy is **not** logged (`shouldLogRequestError`), because the browser throws again and reports it under the reference the student sees (N1 on #115). Trade-off: a client component that fails only on the server and recovers in the browser leaves no line. The student sees nothing wrong in that case.
- Every boundary reports: `src/app/error.tsx`, `src/app/plan/error.tsx` (plan copy, same `ErrorScreen`) and `src/app/global-error.tsx`.

## Where to look

1. Vercel dashboard → the planumn project → **Logs** (runtime logs). Filter by level **Error**, or search `planumn:error`.
2. A student quotes a reference from the error page → search the logs for it (it's the `digest` field).
3. CLI: `vercel logs <deployment-url>` streams the same lines live.
4. To check reporting on a deployment: open `/info/error-check` (or `/plan/error-check` for the plan boundary) and press **Throw a test error**; a `source: "client"` line should appear within seconds. `/info/error-check/server` throws in a Server Component; its page shows a numeric digest and one `source: "render"` line appears.

## Limits on `/api/client-error`, and what Hadi sets up

The endpoint has to be open (any visitor's browser sends to it), so it limits what one request can do:
- same origin (stops other sites' pages, not curl), `Content-Type: application/json` (else 415)
- at most 8 KB of bytes: `Content-Length` checked first, then the body is read with a stream reader that stops at 8 KB (chunked bodies too), else 413; an empty body is 400
- `digest` must look like `c-` + 8 hex digits, so a line can't claim a server digest; `route` must start with `/`

**Kill switch:** set `CLIENT_ERROR_REPORTS=off` in the Vercel project's environment variables and redeploy (env changes apply to new deployments). The endpoint then answers 204 and logs nothing, and `/info/error-check/server` returns 404.

**For Hadi: a Vercel Firewall rate limit (no code).** An in-memory limit in a serverless function doesn't hold, so the per-IP limit belongs in the firewall. In the Vercel dashboard → planumn → **Firewall** → add a custom rule (names as of writing; check Vercel's Firewall docs if the UI differs):
- **If** Request Path *equals* `/api/client-error` **and** Method *equals* `POST`
- **Then** Rate Limit: fixed window, **60 s**, **10 requests**, keyed on **IP**, action **429 / deny**
- A second rule for Request Path *starts with* `/info/error-check/server`, 5 requests per 60 s per IP, keeps the server check from being used to flood the log.

Runtime log retention on Vercel is short and depends on the plan (check the current limits in Vercel's docs), so look soon after a report or add a log drain later.

## Known gaps

- Next.js also prints its own `⨯ Error: …` line for server errors, with the raw (unscrubbed) message. That's Next's default output, not ours; server messages in this app are CourseDog/Supabase statuses, not student data.
- Until the Firewall rule above is set, anyone can add lines to the log with curl (one ≤ 8 KB line per request, `source: "client"`, never with a server digest).
- `global-error.tsx` (root layout failure) was build-checked but not triggered in a test: nothing in the root layout can be made to throw from outside.
- Browser errors that don't crash a render (event handlers, rejected promises) don't reach an error boundary and aren't reported.
