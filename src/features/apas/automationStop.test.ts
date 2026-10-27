import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";

// Runs the real extension/src/apas.js in a VM with a minimal fake APAS list page, mocked extension
// messaging and manual timers. Regression for the review finding from Michael's Codex on #72.
const src = (f: string) => readFileSync(path.resolve(__dirname, "../../../extension/src", f), "utf8");

interface FakeEl {
  textContent: string;
  children: FakeEl[];
  listeners: Record<string, () => unknown>;
  [k: string]: unknown;
}
function el(): FakeEl {
  const e: FakeEl = {
    textContent: "",
    children: [],
    listeners: {},
    addEventListener(type: string, fn: () => unknown) {
      e.listeners[type] = fn;
    },
    replaceChildren(...kids: FakeEl[]) {
      e.children = kids;
    },
    remove() {},
  };
  return e;
}

it("Stop cancels the waiting step: no later save, no navigation (review fix, #72)", async () => {
  const msg = el();
  const buttons = el();
  const host = el();
  host.attachShadow = () => ({
    set innerHTML(_: string) {},
    querySelector: (sel: string) => (sel === ".msg" ? msg : buttons),
  });
  const rows: { id: string; program: string }[] = [];
  const saved: unknown[] = [];
  const navigations: string[] = [];
  let reloads = 0;
  const intervals: (() => unknown)[] = [];
  const timeouts: (() => unknown)[] = [];

  const ctx = {
    URL,
    chrome: {
      runtime: {
        sendMessage: async (m: { kind: string; auto?: unknown }) => {
          if (m.kind === "isImportTab") return { ok: true, importing: true, auto: { phase: "wait", baseline: ["old"], startedAt: Date.now() } };
          if (m.kind === "autoState") saved.push(m.auto);
          return { ok: true };
        },
      },
    },
    document: {
      createElement: (tag: string) => (tag === "div" ? host : el()),
      documentElement: { appendChild() {}, outerHTML: "<html></html>" },
      querySelector: () => null,
      querySelectorAll: () =>
        rows.map((r) => ({
          querySelector: () => ({
            getAttribute: () => `read.html?id=${r.id}`,
            textContent: r.program,
            href: `https://umn.uachieve.com/selfservice/audit/read.html?id=${r.id}`,
          }),
        })),
    },
    window: {
      location: {
        pathname: "/selfservice/audit/list.html",
        origin: "https://umn.uachieve.com",
        assign: (u: string) => navigations.push(u),
        reload: () => reloads++,
      },
    },
    setTimeout: (fn: () => unknown) => (timeouts.push(fn), timeouts.length),
    setInterval: (fn: () => unknown) => (intervals.push(fn), 1000 + intervals.length),
    clearTimeout: () => {},
    clearInterval: () => {},
  };
  const flush = async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
  };

  runInNewContext(`${src("protocol.js")}\n${src("automation.js")}\n${src("apas.js")}`, ctx);
  await flush();
  expect(msg.textContent).toMatch(/Waiting for APAS/);

  const stopButton = buttons.children.find((b) => b.textContent === "Stop")!;
  await stopButton.listeners.click();
  await flush();
  expect(saved.at(-1)).toBeNull();

  // A fresh degree audit appears, then every timer the script scheduled fires.
  rows.push({ id: "new", program: "1019600271" });
  for (const fn of [...intervals, ...timeouts]) await fn();
  await flush();

  expect(saved).toEqual([null]);
  expect(navigations).toEqual([]);
  expect(reloads).toBe(0);
});
