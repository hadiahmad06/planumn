# APAS import (B1): browser extension research

> Written by **Ishaan's Claude** (Claude Code, Opus 5.5), 2026-10-27. Docs only, with no code.
> Revised 2026-10-27 after Hadi's Claude's review on #28 (raw-HTML handling, AMO "none", bridge scope, stale tab, manifest fallback).
> Scope comes from Hadi's decision in `docs/human/roadmap.md` (#27): a Chrome/Firefox extension opens APAS, **stops at the UMN login page**, the student signs in themselves, and the extension hands the raw report to planu.mn. Fetch and hand-off come first; the parser comes later.
> Each claim is marked **[doc]** (checked against vendor documentation, linked at the end) or **[unverified]** (my inference, still to test). I did not log into any UMN system and used no UMN credentials.

## 1. Summary

| Question | Recommendation |
|---|---|
| Open APAS | `tabs.create({ url: APAS_URL })` from a click on planu.mn → the extension. The tab goes through UMN SSO/Duo on its own, and the extension never sees the login form. |
| Detect "logged in" | A **content script that matches only the APAS report host**. It can only run once the browser is back on that host, i.e. after SSO. Then it waits for the report DOM to appear. No need to watch the login pages. |
| Read the report | The same content script reads the rendered report from the DOM (`document.documentElement.outerHTML`, or the report container) **in the student's own tab**, so no extension-side fetch with cookies is needed. |
| Hand-off to planu.mn | **One design for both browsers:** a content script on the planu.mn import route only (e.g. `https://planu.mn/plan/*`) bridges `window.postMessage` ↔ `runtime.sendMessage`. Chrome's `externally_connectable` is a possible later addition but **doesn't work in Firefox**. |
| Permissions | `host_permissions` for the APAS host and `planu.mn` only, plus `tabs` is probably not needed (see §4). No `cookies`, `webRequest`, `<all_urls>` or `scripting`. |
| Store review | Chrome: single purpose, a justification per permission, privacy policy plus a Limited Use statement. Firefox (AMO): `data_collection_permissions` is **mandatory for new add-ons**, and source must be submitted if the build is bundled or minified. |

## 2. Where APAS lives (needs a human to confirm)

- **[doc]** UMN One Stop: students reach APAS from MyU → Academics → APAS. One Stop's "Run an APAS report" button points at **`https://umn.uachieve.com`** (uAchieve, CollegeSource's degree-audit product). A report can be shown on screen, with expandable sections, or as a PDF (Advanced Settings → PDF). "Run Declared Programs" and "What-if" both put a report in a "completed requests" list → "View APAS".
- **[unverified]** The exact report URL path, whether a report is server-rendered HTML or loaded by script, and whether the SSO hop goes through `login.umn.edu` (Shibboleth) + Duo. **Needs Hadi or Michael:** while logged in, note the URL bar at each step (landing → run → completed list → report) and save 3–5 report pages ("Save page as… complete"). That's the same request as the parser item on #16.
- **[unverified]** Running a report is asynchronous: "the report may take a few seconds to load" ([doc]). So the extension either (a) opens the *completed requests* list and lets the student pick a report, or (b) clicks "Run Declared Programs" for them. **(a) is simpler and safer** (no automated form submission), so I recommend it for v1.

## 3. The flow, end to end

```
planu.mn tab                    extension (service worker / event page)          APAS tab (umn.uachieve.com)
─────────────                   ──────────────────────────────────────          ─────────────────────────────
[Import from APAS] click
  │ window.postMessage({type:"planumn:apas:start", nonce})
  ▼
bridge content script ─runtime.sendMessage─▶ checks sender.tab.url origin = planu.mn
                                             remembers {planumnTabId, nonce}
                                             tabs.create({url: APAS_URL})  ──────▶  redirects to UMN login (not our host:
                                                                                     no script runs, we see nothing)
                                                                                     student signs in + Duo
                                                                                     ◀── back on uachieve host
                                                                                     apas content script runs (host match)
                                                                                     waits for report DOM (MutationObserver)
                                                                                     shows "Send this report to planu.mn?" bar
                                                                                     student clicks Send
                                             ◀──runtime.sendMessage({html, url, capturedAt})
                                             validates sender.tab.id = the tab it opened
                                             tabs.sendMessage(planumnTabId, {nonce, html…})
bridge content script ◀──────────────────────
  │ window.postMessage({type:"planumn:apas:report", nonce, html}, "https://planu.mn")
  ▼
planu.mn page checks event.origin, event.source === window, nonce → keeps raw HTML in tab memory only → (later) client-side parser
```

Design notes:
- **Explicit consent on the APAS page.** [unverified, recommended] Show a small injected "Send to planu.mn" bar instead of sending automatically. It makes the data flow visible, which fits Hadi's goal that "the user … trust the feature", and it supports the "prominent disclosure" rules in §6.
- **Don't keep the service worker waiting.** Login plus Duo can take minutes. **[doc]** Chrome MV3 service workers stop when idle. **[unverified]** Don't hold an open `sendResponse` or port across the login. Store `{planumnTabId, nonce, apasTabId}` in `chrome.storage.session` and continue when the APAS content script reports in.
- **Nonce.** planu.mn generates it per import and only accepts a report carrying it. That blocks stray or replayed messages.
- **Close the APAS tab** after the student sends the report, or offer to. The extension never stores the report itself.
- **Where the raw HTML goes (privacy promise).** The report stays **in the planu.mn tab's memory only**. It is never written to `localStorage`, IndexedDB or `chrome.storage`, and **never sent to the planu.mn server or Supabase**. The parser runs client-side and keeps only courses, terms and grades-as-taken. Name, student ID, GPA and advisor fields are dropped before anything goes into the plan. Only the resulting plan is saved, through the normal autosave the student already uses. That also keeps the AMO declaration simple (§6).
- **Stale target tab.** Before `tabs.sendMessage(planumnTabId, …)`, the background checks that the tab still exists and is still on the planu.mn import route. The `planu.mn` host permission lets it read that tab's URL without the `tabs` permission [unverified]. If the tab is gone or has navigated away, the extension drops the report and shows "Reopen the import on planu.mn" instead of sending it anywhere.

## 4. Mechanics per step

### Opening the tab
- `tabs.create({ url })` works with no special permission in both browsers. [unverified for MV3 Firefox; the API is in the base set]

### Detecting that the student finished SSO
- **[doc]** Content scripts declared with `matches` only run on matching hosts. If the APAS content script matches only the uAchieve host, it can't run on the login pages and only starts once SSO has redirected back. That signal is all we need, and the extension never touches `login.umn.edu`.
- Alternative: `tabs.onUpdated` watching the URL. **[unverified]** In Chrome, `tab.url` is only visible with the `tabs` permission or host permission for that URL, and Firefox supports a `filter: { urls }` argument. That's more moving parts, so I don't recommend it.
- In-page readiness: the report may render after load, so use `MutationObserver` until a report container exists. The selector depends on the real pages (§2).

### Reading the report
- **Recommended:** read the DOM in the student's tab from the content script. It's the same origin as APAS and uses the session the student just created, with no cookie handling.
- **Avoid:** `fetch()` from the service worker with the student's cookies. **[unverified]** Whether third-party or SameSite cookies get attached to extension-origin requests differs between browsers, and it would need broader permissions. It's also harder to explain in review.
- **PDF path:** if only a PDF is available, the content script could fetch the PDF URL from the page's own origin and send the bytes as base64. The transcript-PDF parser from #25 might be reusable. [unverified]
- **Size:** **[doc]** Chrome messages are JSON-serialized, max 64 MiB. Firefox uses structured clone. A full HTML report should be far below that. [unverified: real report size]

### Hand-off to planu.mn
| Option | Chrome | Firefox | Notes |
|---|---|---|---|
| `externally_connectable` (`matches: ["https://planu.mn/*"]`) → page calls `chrome.runtime.sendMessage(EXT_ID, …)` → `runtime.onMessageExternal` | **[doc]** Supported. The page needs the extension ID, and Chrome's docs check `sender.url` | **[doc] Not supported** for web pages (MDN: "In Firefox, neither API is supported", bug 1319168) | Chrome only. The page also needs a different extension ID per store. |
| **Content-script bridge** on the import route only (e.g. `https://planu.mn/plan/*`) with `window.postMessage` | works | works | **Recommended.** One code path. The page must check `event.origin === "https://planu.mn"` and `event.source === window`, and the content script must check `event.source === window` and the message `type`. Treat every message as untrusted (MDN/Chrome both say to validate content-script input). |

Dev and staging: add `http://localhost:3000/*` (and the Vercel preview host, if wanted) to the planu.mn match list **only in a dev build** of the manifest, never in the store build.

### Detecting whether the extension is installed
- The bridge content script can set `document.documentElement.dataset.planumnExt = "1"` or post a `planumn:apas:hello`. planu.mn shows "Install the extension" otherwise. [unverified, standard pattern]

## 5. Minimal manifest (sketch, not code to commit)

```jsonc
{
  "manifest_version": 3,
  "name": "planu.mn APAS import",
  "permissions": ["storage"],                       // chrome.storage.session for the pending import
  "host_permissions": ["https://umn.uachieve.com/*", "https://planu.mn/*"],
  "background": { "service_worker": "bg.js", "scripts": ["bg.js"] },   // Chrome uses service_worker, Firefox uses scripts [unverified: test on current Chrome; fallback = per-browser manifest generated at build time]
  "content_scripts": [
    { "matches": ["https://planu.mn/plan/*"], "js": ["bridge.js"] },   // import route only, not the whole site
    { "matches": ["https://umn.uachieve.com/*"], "js": ["apas.js"] }
  ],
  "browser_specific_settings": {
    "gecko": {
      "id": "apas@planu.mn",
      "data_collection_permissions": { "required": ["none"] }   // only if the in-memory rule in §3 holds; see §6
    }
  }
}
```
- No `tabs` permission: `tabs.create` and `tabs.sendMessage` to a known tab id don't need it. [unverified: confirm on both browsers]
- **[doc] Firefox MV3 host permissions are optional by default.** The user can grant or revoke them, and from Firefox 127 the install prompt lists them. The extension must check `permissions.contains` and call `permissions.request` **from a user action** (e.g. the import click relayed from planu.mn, or the extension's popup) if access is missing. **[unverified]** Whether a click relayed through `postMessage` counts as a user gesture for `permissions.request`. If not, the extension popup or options page has to ask.
- **[doc]** Chrome shows host permissions in its install prompt. Narrow hosts make a less scary prompt.

## 6. Store review requirements

### Chrome Web Store
- **[doc] Limited Use:** collect and transmit only what the single purpose needs, use it only for that purpose, no ads, no sale, no transfer to data brokers, and humans read it only with explicit consent. The extension's website (planu.mn) must have an **affirmative statement that the data use complies with the Limited Use requirements**, e.g. in the privacy page from #26.
- **[doc]** If the data counts as "web browsing activity", that collection must be prominently described on the listing and in the UI. The "Send to planu.mn" bar (§3) covers the UI side.
- **[unverified]** The dashboard asks for a single-purpose statement, a justification for each permission and host, and the data-use disclosure checkboxes. Developer registration has a one-time fee. Review time varies, and narrow host permissions usually review faster.

### Firefox (AMO)
- **[doc] `browser_specific_settings.gecko.data_collection_permissions` is required for new extensions** (enforced since 2025-11-03). Submissions without it are blocked and not signed. Even an add-on that collects nothing must declare `"none"`. The disclosure shows in the install dialog, on the listing and in about:addons.
- **[doc]** Mozilla counts as *transmission* data "handled outside the add-on or the local browser". If `"none"` is required, nothing may be collected without consent. The categories are `personallyIdentifyingInfo`, `healthInfo`, `financialAndPaymentInfo`, `authenticationInfo`, `personalCommunications`, `locationInfo`, `browsingActivity`, `websiteContent`, `websiteActivity`, `searchTerms`, `bookmarksInfo`, plus optional `technicalAndInteraction`.
- **Our answer is probably `"required": ["none"]`.** [unverified, inference] The extension only moves the report between two of the student's own tabs, and under the §3 rule it never leaves the browser, so nothing is "handled outside the local browser". This holds **only** as long as planu.mn never uploads the raw report. If we ever send the report (or the name and ID in it) to our server, the honest declaration becomes `personallyIdentifyingInfo` + `websiteContent`. Confirm with an AMO reviewer, or on Mozilla's add-ons discourse, before the first submission.
- **[unverified]** If the build bundles or minifies code, AMO requires the source plus build instructions. Plain unbundled JS avoids that.

## 7. Risks and open questions

1. **uAchieve markup is unknown** until we have real pages, and it may change without notice. Keep the extension dumb: it captures raw HTML, and the planu.mn parser does the work, so the extension rarely needs a store re-review. (This matches Hadi's order: parser second.)
2. **Is reading APAS with an extension OK under UMN policy?** [unverified] The student is reading their own record in their own session, but a human (Hadi or Michael) should check UMN's acceptable-use guidance, and maybe ask One Stop, before a public launch.
3. **What-if reports**: the same flow works if the student opens a What-if report instead. The content script just captures whatever report is on screen.
4. **Multiple campuses or programs:** **[doc]** a report shows one program at a time. v1 can capture one report per import, and planu.mn can merge several.
5. **Safari:** out of scope, but Safari supports `externally_connectable` for web pages ([doc] MDN), so the bridge design would carry over.

## 8. What I need from humans

- [ ] The real APAS URLs at each step and 3–5 saved report pages (HTML and one PDF), with student IDs and names removed or replaced.
- [ ] Who owns the store accounts (Chrome Web Store developer account, AMO account) and the extension ID / gecko id.
- [ ] A UMN policy check (§7.2).

## Sources
- Chrome: [`externally_connectable`](https://developer.chrome.com/docs/extensions/reference/manifest/externally-connectable), [Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) (JSON serialization, 64 MiB limit, `onMessageExternal`), [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- MDN: [`externally_connectable`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/externally_connectable) (Firefox: not supported for web pages, bug 1319168), [`host_permissions`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions) (optional by default in Firefox MV3; install prompt from Firefox 127)
- Firefox data collection: [Extension Workshop: built-in data consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/) (transmission definition, category list, `none`), [Mozilla discourse](https://discourse.mozilla.org/t/the-data-collection-permissions-property-is-reserved/145449), [heise](https://heise.de/-10914352), [SecurityWeek](https://www.securityweek.com/new-firefox-extensions-required-to-disclose-data-collection-practices/amp/)
- UMN: [One Stop APAS page](https://onestop.umn.edu/node/106) (MyU → Academics → APAS; `umn.uachieve.com`; PDF option; completed requests)
