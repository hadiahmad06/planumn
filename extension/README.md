# planu.mn APAS import extension (B1 step 1)

> Written by **Ishaan's Claude** (Claude Code, Opus 5.5), 2026-10-27. Design: `docs/agent/apas-research.md` (#28).

Fetch and hand-off only. The extension opens APAS, lets the student sign in to UMN **themselves**, and when the student clicks **Send**, it hands the raw report page to their planu.mn tab. There's no parser yet (B1 step 2, which needs sample reports).

## Flow

```
planu.mn /plan/apas  ──postMessage──▶  bridge.js (content script, /plan/* only)
                                         │ runtime.sendMessage {kind:"start", nonce}
                                         ▼
                                       background.js ── tabs.create(umn.uachieve.com) ──▶ UMN SSO + Duo (extension sees nothing)
                                                                                           ▼
                                       background.js ◀── {kind:"report"} ── apas.js (content script, umn.uachieve.com only)
                                         │ checks: sender is the tab it opened · planu.mn tab still on /plan/*
                                         ▼                                     student clicks "Send this report"
bridge.js ──postMessage {report, nonce}──▶ planu.mn page (keeps it in memory only)
```

- **Files:** `src/protocol.js` (constants shared with `src/features/apas/protocol.ts`; a test keeps them in sync), `src/background.js`, `src/bridge.js`, `src/apas.js`, `src/popup.html` and `src/popup.js` (lets you grant site access, which Firefox requires).
- **Stored:** only the pending import (`nonce`, two tab ids, start time, and during audit automation the step plus the ids of audits that already existed) in `storage.session`. Never the report.
- **Audit automation** (Hadi's Claude, Hadi's decision 2026-10-27; `src/automation.js`): after sign-in, the bar offers **Run my audit automatically** or **I'll pick a report**. Automatic: note the existing audits on *View Previous APAS*, open *Request New APAS*, click **Run Declared Programs**, wait on the list for an audit that wasn't there before (a degree program first), open it, and send it. **Stop** is always shown; giving up after 4 minutes falls back to the manual Send.
- **Permissions:** `storage`, plus host access to `https://umn.uachieve.com/*` and `https://planu.mn/plan/*`. No `tabs`, `cookies`, `scripting` or `<all_urls>`.

## Build and load

```bash
node extension/build.mjs --dev    # dev: also allows http://localhost:3000/plan/*
node extension/build.mjs --dev --port 3220   # dev on another port (added by Hadi's Claude)
node extension/build.mjs          # store builds (planu.mn only)
```

Output goes to `extension/dist/chrome` and `extension/dist/firefox` (gitignored).

- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `extension/dist/chrome`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `extension/dist/firefox/manifest.json`. Then click the toolbar icon → **Allow access**, because Firefox MV3 host access is opt-in.
- Run planu.mn (`npm run dev`), open `http://localhost:3000/plan/apas` and click **Import from APAS**.

## Firefox smoke test

`extension/test/firefox-smoke.mjs` loads the dev build into a real (headless) Firefox over Marionette and checks that the bridge loads on `/plan/apas` and that the page accepts its messages. It never opens UMN sites. The steps are at the top of the file.

Result on Firefox 130 (2026-10-27, Ishaan's Claude): **PASS**. The bridge's `postMessage` reaches the page with `event.source === window` and the page's origin, so the page-side checks hold in Firefox as well as Chrome.

Dev-build note: Firefox match patterns can't contain a port (`http://localhost:3000/plan/*` never matches there), so the dev build uses `http://localhost/plan/*`. A port-less pattern matches every port in both browsers. The background still accepts `start` only from the exact `http://localhost:3000` origin.

## Comparing planu.mn with a real APAS report (Phase C/C4)

> Added by **Hadi's Claude**, 2026-11-03.

In the app: import the audit on `/plan/apas`, then open the plan (or any plan with that program) **in the same tab**. The requirements rail shows "APAS says: …" on requirements it could pair by name, and the number of disagreements under the program name. Nothing is stored, so a reload, signing out or in, a new or failed import, or Discard clears it. planu.mn's side uses the plan's courses that are also on the audit, so a course on the audit that the plan lacks shows as a disagreement.

From the command line, for a report saved with **Save a copy (.html)**:

```bash
npm run dev                                                   # another terminal; the script uses its API
node scripts/apas-compare.ts ~/Downloads/apas-report-2026-11-03.html 019627107   # CourseDog program id (CS B.S.)
node scripts/apas-compare.ts apas-report-2026-11-03.html 019627107 --base http://localhost:3220   # dev server on another port
```

It prints each pair (agree, disagree or unchecked), the APAS requirements with no planu.mn match and the planu.mn requirements with no APAS match. The report is read from disk and parsed locally. Only course codes and catalog ids go to the local dev server, and nothing is written. **Never commit a real report or paste its output into a PR**: summarize mismatches by requirement name instead.

## Not verified yet
- The APAS landing URL: we open the `umn.uachieve.com` root, which One Stop links to. Real report URLs and markup are still needed from a human.
- Not yet tested end to end in a real browser against APAS: that needs a UMN login, which agents don't do. Hadi or Michael need to run it once.
- The full start → APAS tab → Send flow in Firefox (the smoke test stops before opening UMN).
