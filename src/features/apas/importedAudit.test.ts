// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { ApasAudit } from "@/domain/apas";
import { useAuthStore } from "@/features/auth/useAuth";
import { addImportedAudit, clearImportedAudits, importedAuditFor, useImportedAudit } from "./importedAudit";
import { ParsedAudit } from "./ParsedAudit";
import { parseApasHtml } from "./parseReport";
import { APAS_PROTOCOL } from "./protocol";
import { useApasImport } from "./useApasImport";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Synthetic fixture; never a real report. Its program code (0000000271) maps to no planu.mn program.
const html = readFileSync(path.resolve(__dirname, "__fixtures__/apas-audit-fake.html"), "utf8");
const audit = parseApasHtml(html)!;
// Two more synthetic reports for the same student: a major (CS B.S., 019627107) and a minor
// (Accounting, 0004MIN02), as APAS shows one program per report.
const major: ApasAudit = { ...audit, program: { code: "1019600271", title: "Computer Science BSCompSc" } };
const minor: ApasAudit = { ...audit, program: { code: "2000400000", title: "Accounting Minor" }, courses: audit.courses.slice(0, 3) };
const held = () => useImportedAudit.getState().audits;
const keys = () => held().map((a) => a.key);
const user = (id: string) => ({ id }) as User;
const signedIn = (u: User | null) => useAuthStore.setState({ user: u, loading: false, error: null });

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: true, error: null });
  clearImportedAudits();
});

describe("several imported audits, one per program (B1 multi-audit)", () => {
  it("holds a major's and a minor's report side by side, keyed by their planu.mn programs", () => {
    addImportedAudit(major);
    addImportedAudit(minor);
    expect(keys()).toEqual(["019627107", "0004MIN02"]);
    expect(importedAuditFor(held(), "019627107")).toBe(major);
    expect(importedAuditFor(held(), "0004MIN02")).toBe(minor);
    expect(importedAuditFor(held(), "026421707")).toBeNull();
  });

  it("replaces the report for a program imported again, in its place", () => {
    addImportedAudit(major);
    addImportedAudit(minor);
    const newer = { ...major, preparedOn: "12/20/2026 04:30 PM" };
    addImportedAudit(newer);
    expect(keys()).toEqual(["019627107", "0004MIN02"]);
    expect(importedAuditFor(held(), "019627107")).toBe(newer);
  });

  it("keys a report with no planu.mn program by its APAS code, and never pairs it with a program", () => {
    addImportedAudit(audit);
    addImportedAudit(major);
    expect(keys()).toEqual(["apas:0000000271", "019627107"]);
    expect(held()[0].programId).toBeNull();
  });
});

describe("imported audits and the signed-in account (review fix, #89)", () => {
  const holdTwo = () => {
    addImportedAudit(major);
    addImportedAudit(minor);
  };

  it("clears every report on sign-out, so the next account never sees them (A → sign-out → B)", () => {
    signedIn(user("A"));
    holdTwo();
    signedIn(null);
    expect(held()).toEqual([]);
    signedIn(user("B"));
    expect(held()).toEqual([]);
  });

  it("clears when the account switches without a sign-out in between", () => {
    signedIn(user("A"));
    holdTwo();
    signedIn(user("B"));
    expect(held()).toEqual([]);
  });

  it("clears when a guest's reports are followed by a sign-in", () => {
    signedIn(null);
    holdTwo();
    signedIn(user("B"));
    expect(held()).toEqual([]);
  });

  it("keeps them when auth only finishes loading, or the same user's session refreshes", () => {
    holdTwo();
    signedIn(user("A")); // loading → A: who was already signed in, not a change
    expect(keys()).toEqual(["019627107", "0004MIN02"]);
    signedIn(user("A")); // token refresh
    expect(keys()).toEqual(["019627107", "0004MIN02"]);
  });
});

describe("failed or new imports never leave an old audit current (review fix, #89)", () => {
  let container: HTMLElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("a parsed report joins the reports already held", () => {
    addImportedAudit(major);
    act(() => root.render(createElement(ParsedAudit, { html })));
    expect(keys()).toEqual(["019627107", "apas:0000000271"]);
  });

  it("a page that isn't an audit clears every held report", () => {
    addImportedAudit(major);
    addImportedAudit(minor);
    act(() => root.render(createElement(ParsedAudit, { html: "<html><body><h1>Request an APAS</h1></body></html>" })));
    expect(held()).toEqual([]);
  });

  it("starting another import keeps the held reports; a cancelled import and Discard clear them all", async () => {
    let hook!: ReturnType<typeof useApasImport>;
    const Probe = () => {
      hook = useApasImport();
      return null;
    };
    act(() => root.render(createElement(Probe)));

    let nonce = "";
    const onStart = (e: MessageEvent) => {
      if (e.data?.type === APAS_PROTOCOL.START) nonce = e.data.nonce;
    };
    window.addEventListener("message", onStart);
    addImportedAudit(major);
    act(() => hook.start());
    expect(keys()).toEqual(["019627107"]);
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    window.removeEventListener("message", onStart);
    expect(nonce).not.toBe("");

    addImportedAudit(minor);
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { source: APAS_PROTOCOL.EXTENSION_SOURCE, type: APAS_PROTOCOL.STATUS, nonce, status: "cancelled" },
          origin: window.location.origin,
          source: window as unknown as MessageEventSource,
        }),
      );
    });
    expect(hook.state.phase).toBe("error");
    expect(held()).toEqual([]);

    addImportedAudit(major);
    addImportedAudit(minor);
    act(() => hook.discard());
    expect(held()).toEqual([]);
  });
});
