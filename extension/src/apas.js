/**
 * Content script on the APAS host only (umn.uachieve.com). Written by Ishaan's Claude; audit
 * automation added by Hadi's Claude (Hadi's decision, 2026-10-27).
 * It can't run on the UMN login pages, so running at all means the student finished SSO.
 * In the tab the extension opened, it shows a bar. The student chooses: run a new audit automatically
 * (request it, wait for it, open it and send it), or open a report and click Send themselves.
 */
/* global PLANUMN_APAS, PLANUMN_AUTO */
(async () => {
  const ext = globalThis.browser ?? globalThis.chrome;
  const P = PLANUMN_APAS;
  const A = PLANUMN_AUTO;

  const status = await ext.runtime.sendMessage({ kind: "isImportTab" }).catch(() => null);
  if (!status?.importing) return; // an APAS tab the student opened themselves: do nothing

  const host = document.createElement("div");
  host.id = "planumn-apas-bar";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .bar { position: fixed; z-index: 2147483647; left: 16px; right: 16px; bottom: 16px; display: flex; gap: 12px;
             align-items: center; padding: 12px 16px; border-radius: 10px; background: #fff; color: #1a1a1a;
             font: 14px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.18); border: 1px solid #ddd; flex-wrap: wrap; }
      .msg { flex: 1; min-width: 240px; }
      button { font: inherit; padding: 6px 14px; border-radius: 6px; border: 1px solid #7a0019; cursor: pointer; }
      .primary { background: #7a0019; color: #fff; }
      .secondary { background: #fff; color: #7a0019; }
      button[disabled] { opacity: .6; cursor: default; }
    </style>
    <div class="bar" role="region" aria-label="planu.mn import" aria-live="polite">
      <span class="msg"></span>
      <span class="buttons"></span>
    </div>`;
  const msg = root.querySelector(".msg");
  const buttons = root.querySelector(".buttons");
  document.documentElement.appendChild(host);

  function show(text, actions = []) {
    msg.textContent = text;
    buttons.replaceChildren(
      ...actions.map(({ label, kind = "secondary", onClick }) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = kind;
        b.textContent = label;
        b.addEventListener("click", onClick);
        return b;
      }),
    );
  }

  const setAuto = (auto) => ext.runtime.sendMessage({ kind: "autoState", auto }).catch(() => null);
  const go = (path) => window.location.assign(new URL(path, window.location.origin).href);

  async function send() {
    show("Sending to planu.mn…");
    const html = document.documentElement.outerHTML;
    if (html.length > P.MAX_REPORT_BYTES) {
      show("This page is too large to send. Open a single APAS report and try again.", [{ label: "Send again", kind: "primary", onClick: send }]);
      return;
    }
    const res = await ext.runtime
      .sendMessage({ kind: "report", report: { html, title: document.title } })
      .catch(() => ({ ok: false, error: "failed" }));
    if (res?.ok) show("Sent. You can close this tab and go back to planu.mn.");
    else if (res?.error === "stale-tab" || res?.error === "no-import")
      show("The planu.mn import page was closed or changed. Reopen the import on planu.mn.");
    else show("Couldn't send the report.", [{ label: "Try again", kind: "primary", onClick: send }]);
  }

  function manual() {
    show("planu.mn import: open the APAS report you want, then send this page to planu.mn. Nothing is sent until you click Send.", [
      { label: "Send this report to planu.mn", kind: "primary", onClick: send },
      { label: "Not now", onClick: () => host.remove() },
    ]);
  }

  async function stop(text) {
    await setAuto(null);
    show(text ?? "Stopped. Open a report and send it yourself, or close this tab.", [
      { label: "Send this page", kind: "primary", onClick: send },
      { label: "Not now", onClick: () => host.remove() },
    ]);
  }
  const stopButton = { label: "Stop", onClick: () => void stop() };

  /** Completed audits on the list page, newest first: [{ id, program, href }]. */
  function completedAudits() {
    return [...document.querySelectorAll("#JobQueueRun tbody tr")].flatMap((tr) => {
      const a = tr.querySelector('a[href*="read.html"]');
      const id = a ? A.auditId(a.getAttribute("href")) : null;
      return id ? [{ id, program: a.textContent.trim(), href: a.href }] : [];
    });
  }

  async function automate(auto) {
    const kind = A.pageKind(window.location.pathname, Boolean(document.querySelector("#audit")));

    // 1. Note the audits that already exist, so the new one can be told apart without trusting clocks.
    if (auto.phase === "baseline") {
      if (kind !== "list") return go(A.LIST_PATH);
      await setAuto({ phase: "run", baseline: completedAudits().map((r) => r.id) });
      return go(A.CREATE_PATH);
    }

    // 2. Request New APAS → Run Declared Programs.
    if (auto.phase === "run") {
      if (kind !== "create") return go(A.CREATE_PATH);
      const run = document.querySelector("#runAudit");
      if (!run) return stop("Couldn't find APAS's Run Declared Programs button. Run it yourself, open the audit, and click Send.");
      show("Running your audit (Run Declared Programs)…", [stopButton]);
      await setAuto({ ...auto, phase: "wait", startedAt: Date.now() });
      run.click();
      // If APAS doesn't move on by itself, go to the list where finished audits appear.
      setTimeout(() => go(`${A.LIST_PATH}?autoPoll=true`), 10000);
      return;
    }

    // 3. Wait on the list until an audit we haven't seen appears, then open it.
    if (auto.phase === "wait") {
      if (kind !== "list") return go(`${A.LIST_PATH}?autoPoll=true`);
      const check = async () => {
        const pick = A.pickNewAudit(completedAudits(), auto.baseline);
        if (pick) {
          show("Your audit is ready. Opening it…", [stopButton]);
          await setAuto({ ...auto, phase: "open", target: pick.href });
          window.location.assign(pick.href);
          return true;
        }
        if (Date.now() - (auto.startedAt ?? Date.now()) > A.WAIT_MS) {
          await stop("APAS is taking longer than usual. When your audit finishes, open it and click Send.");
          return true;
        }
        return false;
      };
      if (await check()) return;
      show("Waiting for APAS to finish your audit. This usually takes under a minute.", [stopButton]);
      const timer = setInterval(async () => {
        if (await check()) clearInterval(timer);
      }, 2000);
      // The list refreshes itself; reload anyway in case it stopped polling.
      setTimeout(() => window.location.reload(), A.RELOAD_MS * 3);
      return;
    }

    // 4. On the new audit: send it.
    if (auto.phase === "open") {
      if (kind !== "audit") return auto.target ? window.location.assign(auto.target) : stop();
      await setAuto(null);
      return send();
    }
    return stop();
  }

  if (status.auto) {
    void automate(status.auto);
    return;
  }
  show("planu.mn import: run a fresh audit and send it automatically, or open a report yourself and send it.", [
    {
      label: "Run my audit automatically",
      kind: "primary",
      onClick: async () => {
        show("Starting…", [stopButton]);
        const auto = { phase: "baseline" };
        await setAuto(auto);
        void automate(auto);
      },
    },
    { label: "I'll pick a report", onClick: manual },
  ]);
})();
