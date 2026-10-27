/**
 * Content script on the APAS host only (umn.uachieve.com). Written by Ishaan's Claude.
 * It can't run on the UMN login pages, so running at all means the student finished SSO.
 * In the tab the extension opened, it shows a bar; nothing is read until the student clicks Send.
 */
/* global PLANUMN_APAS */
(async () => {
  const ext = globalThis.browser ?? globalThis.chrome;
  const P = PLANUMN_APAS;

  const status = await ext.runtime.sendMessage({ kind: "isImportTab" }).catch(() => null);
  if (!status?.importing) return; // an APAS tab the student opened themselves: do nothing

  const host = document.createElement("div");
  host.id = "planumn-apas-bar";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .bar { position: fixed; z-index: 2147483647; left: 16px; right: 16px; bottom: 16px; display: flex; gap: 12px;
             align-items: center; padding: 12px 16px; border-radius: 10px; background: #fff; color: #1a1a1a;
             font: 14px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.18); border: 1px solid #ddd; }
      .msg { flex: 1; }
      button { font: inherit; padding: 6px 14px; border-radius: 6px; border: 1px solid #7a0019; cursor: pointer; }
      .send { background: #7a0019; color: #fff; }
      .dismiss { background: #fff; color: #7a0019; }
      button[disabled] { opacity: .6; cursor: default; }
    </style>
    <div class="bar" role="region" aria-label="planu.mn import">
      <span class="msg">planu.mn import: open the APAS report you want, then send this page to planu.mn. Nothing is sent until you click Send.</span>
      <button class="send" type="button">Send this report to planu.mn</button>
      <button class="dismiss" type="button">Not now</button>
    </div>`;
  const msg = root.querySelector(".msg");
  const send = root.querySelector(".send");
  root.querySelector(".dismiss").addEventListener("click", () => host.remove());

  send.addEventListener("click", async () => {
    send.disabled = true;
    msg.textContent = "Sending to planu.mn…";
    const html = document.documentElement.outerHTML;
    if (html.length > P.MAX_REPORT_BYTES) {
      msg.textContent = "This page is too large to send. Open a single APAS report and try again.";
      send.disabled = false;
      return;
    }
    const res = await ext.runtime
      .sendMessage({ kind: "report", report: { html, title: document.title } })
      .catch(() => ({ ok: false, error: "failed" }));
    if (res?.ok) {
      msg.textContent = "Sent. You can close this tab and go back to planu.mn.";
      send.remove();
    } else if (res?.error === "stale-tab" || res?.error === "no-import") {
      msg.textContent = "The planu.mn import page was closed or changed. Reopen the import on planu.mn.";
      send.remove();
    } else {
      msg.textContent = "Couldn't send the report. Try again.";
      send.disabled = false;
    }
  });

  document.documentElement.appendChild(host);
})();
