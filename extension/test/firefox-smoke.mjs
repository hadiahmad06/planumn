// Firefox smoke test for the APAS import extension's bridge. Written by Ishaan's Claude.
// Checks, in a real Firefox, that the bridge content script loads on /plan/apas and that the page
// accepts its messages (origin + event.source === window). It never opens UMN sites.
//
//   npm run build && npx next start -p 3000          # terminal 1: the app
//   node extension/build.mjs --dev                   # dev build (allows localhost)
//   firefox --headless --marionette --no-remote --profile "$(mktemp -d)"   # terminal 2
//   node extension/test/firefox-smoke.mjs            # terminal 3
//
// Talks to Firefox over Marionette (port 2828), installs a temporary copy of extension/dist/firefox,
// grants its host permissions (what the toolbar popup's button does) and probes the page.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ID = "apas-import@planu.mn";
const PAGE = "http://localhost:3000/plan/apas";

// Temporary copy: Firefox before 140 rejects data_collection_permissions, so drop the store-only keys.
const ext = mkdtempSync(path.join(tmpdir(), "planumn-ext-"));
cpSync(path.join(here, "..", "dist", "firefox"), ext, { recursive: true });
const manifestPath = path.join(ext, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
delete manifest.browser_specific_settings.gecko.strict_min_version;
delete manifest.browser_specific_settings.gecko.data_collection_permissions;
writeFileSync(manifestPath, JSON.stringify(manifest));

const sock = net.connect(2828, "127.0.0.1");
let buf = "";
let nextId = 0;
const pending = new Map();
let greeted;
const greeting = new Promise((resolve) => (greeted = resolve));
sock.on("data", (chunk) => {
  buf += chunk.toString("utf8");
  for (;;) {
    const colon = buf.indexOf(":");
    if (colon < 0) return;
    const len = Number(buf.slice(0, colon));
    if (buf.length < colon + 1 + len) return;
    const msg = JSON.parse(buf.slice(colon + 1, colon + 1 + len));
    buf = buf.slice(colon + 1 + len);
    if (!Array.isArray(msg)) greeted(msg);
    else pending.get(msg[1])?.(msg[2], msg[3]);
  }
});
const cmd = (name, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (err, res) => (err ? reject(new Error(JSON.stringify(err))) : resolve(res?.value ?? res)));
    const body = JSON.stringify([0, id, name, params]);
    sock.write(`${Buffer.byteLength(body)}:${body}`);
  });
const asyncScript = (script) => cmd("WebDriver:ExecuteAsyncScript", { script, args: [] });

await greeting;
await cmd("WebDriver:NewSession", { capabilities: {} });
await cmd("Addon:Install", { path: ext, temporary: true });

await cmd("Marionette:SetContext", { value: "chrome" });
await asyncScript(`
  const done = arguments[arguments.length - 1];
  const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
  const policy = WebExtensionPolicy.getByID(${JSON.stringify(ID)});
  ExtensionPermissions.add(${JSON.stringify(ID)}, { permissions: [], origins: ${JSON.stringify(manifest.host_permissions)} }, policy.extension)
    .then(() => done(true), (e) => done(String(e)));
`);
await cmd("Marionette:SetContext", { value: "content" });

await cmd("WebDriver:Navigate", { url: PAGE });
await new Promise((r) => setTimeout(r, 2500));
const result = await asyncScript(`
  const done = arguments[arguments.length - 1];
  const seen = [];
  window.addEventListener("message", (e) => {
    if (e.data && e.data.source === "planumn-extension")
      seen.push({ type: e.data.type, origin: e.origin, sourceIsWindow: e.source === window });
  });
  window.postMessage({ source: "planumn-page", type: "planumn:apas:hello" }, location.origin);
  setTimeout(() => done({ seen, ui: document.querySelector("section[aria-live]")?.innerText ?? "" }), 1500);
`);
await cmd("WebDriver:DeleteSession");
sock.end();

const ready = result.seen.find((m) => m.type === "planumn:apas:ready");
const ok = Boolean(ready && ready.sourceIsWindow && ready.origin === new URL(PAGE).origin && result.ui.includes("Import from APAS"));
console.log(JSON.stringify(result, null, 2));
console.log(ok ? "PASS: bridge loaded and the page accepted its messages" : "FAIL");
process.exit(ok ? 0 : 1);
