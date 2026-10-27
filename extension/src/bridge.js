/**
 * Content script on the planu.mn import route only. Written by Ishaan's Claude.
 * Relays window.postMessage from the page to the extension and back. Firefox doesn't support
 * externally_connectable for web pages, so this one bridge serves both browsers.
 */
/* global PLANUMN_APAS */
(() => {
  const ext = globalThis.browser ?? globalThis.chrome;
  const P = PLANUMN_APAS;
  const origin = window.location.origin;

  const toPage = (message) => window.postMessage({ ...message, source: P.EXTENSION_SOURCE }, origin);

  window.addEventListener("message", (event) => {
    // Only messages the page itself posted to this window.
    if (event.source !== window || event.origin !== origin) return;
    const data = event.data;
    if (!data || data.source !== P.PAGE_SOURCE) return;

    if (data.type === P.HELLO) {
      toPage({ type: P.READY, version: ext.runtime.getManifest().version });
    } else if (data.type === P.START && typeof data.nonce === "string") {
      ext.runtime
        .sendMessage({ kind: "start", nonce: data.nonce })
        .then((res) => toPage({ type: P.STATUS, nonce: data.nonce, status: res?.ok ? "opened" : "error" }))
        .catch(() => toPage({ type: P.STATUS, nonce: data.nonce, status: "error" }));
    }
  });

  // Reports and status updates from the background, for this tab.
  ext.runtime.onMessage.addListener((message) => {
    if (message?.source !== P.EXTENSION_SOURCE) return;
    if (message.type === P.REPORT || message.type === P.STATUS) toPage(message);
  });

  // Let the page know the extension is installed even before it says hello.
  toPage({ type: P.READY, version: ext.runtime.getManifest().version });
})();
