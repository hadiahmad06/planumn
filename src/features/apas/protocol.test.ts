import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { APAS_PROTOCOL, newNonce, pageMessage, readExtensionMessage } from "./protocol";

const win = {};
const self = { origin: "https://planu.mn", window: win };
const nonce = "0123456789abcdef0123456789abcdef";
const fromExt = (data: Record<string, unknown>, over: Partial<{ origin: string; source: unknown }> = {}) => ({
  data: { source: APAS_PROTOCOL.EXTENSION_SOURCE, ...data },
  origin: over.origin ?? self.origin,
  source: "source" in over ? over.source : win,
});
const report = { html: "<html>APAS</html>", url: "https://umn.uachieve.com/audit/123", title: "APAS", capturedAt: "2026-10-27T02:00:00Z" };

describe("APAS protocol: page and extension stay in sync", () => {
  it("extension/src/protocol.js has the same constants", () => {
    const file = readFileSync(path.resolve(__dirname, "../../../extension/src/protocol.js"), "utf8");
    const ctx: { PLANUMN_APAS?: unknown } = {};
    runInNewContext(file, ctx);
    expect(ctx.PLANUMN_APAS).toEqual(APAS_PROTOCOL);
  });
});

describe("readExtensionMessage", () => {
  it("accepts READY without a nonce", () => {
    expect(readExtensionMessage(fromExt({ type: APAS_PROTOCOL.READY, version: "0.1.0" }), self, null)).toEqual({
      type: APAS_PROTOCOL.READY,
      version: "0.1.0",
    });
  });

  it("accepts a report from APAS carrying our nonce", () => {
    const msg = readExtensionMessage(fromExt({ type: APAS_PROTOCOL.REPORT, nonce, report }), self, nonce);
    expect(msg).toEqual({ type: APAS_PROTOCOL.REPORT, nonce, report });
  });

  it("rejects other windows, other origins and page-posted look-alikes", () => {
    const ok = { type: APAS_PROTOCOL.REPORT, nonce, report };
    expect(readExtensionMessage(fromExt(ok, { source: {} }), self, nonce)).toBeNull();
    expect(readExtensionMessage(fromExt(ok, { origin: "https://evil.example" }), self, nonce)).toBeNull();
    expect(readExtensionMessage({ ...fromExt(ok), data: { ...ok, source: APAS_PROTOCOL.PAGE_SOURCE } }, self, nonce)).toBeNull();
  });

  it("rejects a wrong or missing nonce", () => {
    const msg = fromExt({ type: APAS_PROTOCOL.REPORT, nonce: "f".repeat(32), report });
    expect(readExtensionMessage(msg, self, nonce)).toBeNull();
    expect(readExtensionMessage(fromExt({ type: APAS_PROTOCOL.REPORT, nonce, report }), self, null)).toBeNull();
  });

  it("rejects reports not from the APAS host, empty, or oversized", () => {
    const bad = (r: Record<string, unknown>) => readExtensionMessage(fromExt({ type: APAS_PROTOCOL.REPORT, nonce, report: r }), self, nonce);
    expect(bad({ ...report, url: "https://login.umn.edu/idp" })).toBeNull();
    expect(bad({ ...report, url: "not a url" })).toBeNull();
    expect(bad({ ...report, html: "" })).toBeNull();
    expect(bad({ ...report, html: "x".repeat(APAS_PROTOCOL.MAX_REPORT_BYTES + 1) })).toBeNull();
  });

  it("only passes known statuses", () => {
    expect(readExtensionMessage(fromExt({ type: APAS_PROTOCOL.STATUS, nonce, status: "cancelled" }), self, nonce)).toMatchObject({ status: "cancelled" });
    expect(readExtensionMessage(fromExt({ type: APAS_PROTOCOL.STATUS, nonce, status: "pwned" }), self, nonce)).toBeNull();
  });
});

it("makes 128-bit nonces and tagged page messages", () => {
  const a = newNonce();
  expect(a).toMatch(/^[0-9a-f]{32}$/);
  expect(newNonce()).not.toBe(a);
  expect(pageMessage(APAS_PROTOCOL.START, a)).toEqual({ source: APAS_PROTOCOL.PAGE_SOURCE, type: APAS_PROTOCOL.START, nonce: a });
});
