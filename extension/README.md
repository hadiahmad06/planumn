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
- **Stored:** only the pending import (`nonce`, two tab ids, start time) in `storage.session`. Never the report.
- **Permissions:** `storage`, plus host access to `https://umn.uachieve.com/*` and `https://planu.mn/plan/*`. No `tabs`, `cookies`, `scripting` or `<all_urls>`.

## Build and load

```bash
node extension/build.mjs --dev    # dev: also allows http://localhost:3000/plan/*
node extension/build.mjs          # store builds (planu.mn only)
```

Output goes to `extension/dist/chrome` and `extension/dist/firefox` (gitignored).

- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `extension/dist/chrome`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `extension/dist/firefox/manifest.json`. Then click the toolbar icon → **Allow access**, because Firefox MV3 host access is opt-in.
- Run planu.mn (`npm run dev`), open `http://localhost:3000/plan/apas` and click **Import from APAS**.

## Not verified yet
- The APAS landing URL: we open the `umn.uachieve.com` root, which One Stop links to. Real report URLs and markup are still needed from a human.
- Not yet tested end to end in a real browser against APAS: that needs a UMN login, which agents don't do. Hadi or Michael need to run it once.
- Whether Firefox's content-script `postMessage` shows up as `event.source === window` on the page. I believe it does, but it needs checking on Firefox 140+.
