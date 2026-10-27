/**
 * Background (Chrome service worker / Firefox event page). Written by Ishaan's Claude.
 * Opens APAS for an import started on planu.mn, then forwards the report the student chose to send
 * back to that planu.mn tab. Nothing is stored except the pending import's tab ids and nonce.
 */
/* global PLANUMN_APAS, importScripts */
if (typeof importScripts === "function") importScripts("protocol.js"); // Chrome service worker

const ext = globalThis.browser ?? globalThis.chrome;
const P = PLANUMN_APAS;
// Filled in by build.mjs: the planu.mn origins this build talks to.
const PLANUMN_ORIGINS = __PLANUMN_ORIGINS__;

const PENDING_KEY = "pendingImport";

function isPlanumnImportUrl(url) {
  try {
    const u = new URL(url);
    return PLANUMN_ORIGINS.includes(u.origin) && u.pathname.startsWith(P.PLANUMN_PATH_PREFIX);
  } catch {
    return false;
  }
}

function isApasUrl(url) {
  try {
    return new URL(url).origin === P.APAS_ORIGIN;
  } catch {
    return false;
  }
}

// storage.session survives the service worker stopping while the student is in SSO/Duo.
const getPending = async () => (await ext.storage.session.get(PENDING_KEY))[PENDING_KEY] ?? null;
const setPending = (pending) => ext.storage.session.set({ [PENDING_KEY]: pending });
const clearPending = () => ext.storage.session.remove(PENDING_KEY);

function toPage(tabId, message) {
  return ext.tabs.sendMessage(tabId, { ...message, source: P.EXTENSION_SOURCE });
}

async function start(nonce, sender) {
  if (typeof nonce !== "string" || nonce.length < 16) return { ok: false, error: "bad-nonce" };
  const apasTab = await ext.tabs.create({ url: P.APAS_URL, active: true });
  await setPending({ nonce, planumnTabId: sender.tab.id, apasTabId: apasTab.id, startedAt: Date.now() });
  return { ok: true };
}

/** Is the planu.mn tab that started the import still open on the import route? */
async function planumnTabStillThere(tabId) {
  try {
    const tab = await ext.tabs.get(tabId);
    return Boolean(tab.url && isPlanumnImportUrl(tab.url));
  } catch {
    return false;
  }
}

async function deliver(report, sender) {
  const pending = await getPending();
  if (!pending || sender.tab.id !== pending.apasTabId) return { ok: false, error: "no-import" };
  if (!(await planumnTabStillThere(pending.planumnTabId))) {
    await clearPending();
    return { ok: false, error: "stale-tab" };
  }
  const html = typeof report?.html === "string" ? report.html : "";
  if (!html || html.length > P.MAX_REPORT_BYTES) return { ok: false, error: "bad-report" };
  await toPage(pending.planumnTabId, {
    type: P.REPORT,
    nonce: pending.nonce,
    report: { html, url: sender.url, title: String(report.title ?? ""), capturedAt: new Date().toISOString() },
  });
  await clearPending();
  await ext.tabs.update(pending.planumnTabId, { active: true }).catch(() => {});
  return { ok: true };
}

async function handle(message, sender) {
  if (!sender.tab || !sender.url) return { ok: false, error: "no-tab" };
  if (message?.kind === "start" && isPlanumnImportUrl(sender.url)) return start(message.nonce, sender);
  if (isApasUrl(sender.url)) {
    if (message?.kind === "isImportTab") {
      const pending = await getPending();
      return { ok: true, importing: Boolean(pending && pending.apasTabId === sender.tab.id) };
    }
    if (message?.kind === "report") return deliver(message.report, sender);
  }
  return { ok: false, error: "rejected" };
}

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handle(message, sender).then(sendResponse, () => sendResponse({ ok: false, error: "failed" }));
  return true; // respond asynchronously (works on Chrome and Firefox)
});

// If the student closes the APAS tab, tell planu.mn so it stops waiting.
ext.tabs.onRemoved.addListener(async (tabId) => {
  const pending = await getPending();
  if (!pending || pending.apasTabId !== tabId) return;
  await clearPending();
  if (await planumnTabStillThere(pending.planumnTabId))
    await toPage(pending.planumnTabId, { type: P.STATUS, nonce: pending.nonce, status: "cancelled" }).catch(() => {});
});
