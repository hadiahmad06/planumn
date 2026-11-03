// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/features/auth/useAuth";
import { setImportedAudit, useImportedAudit } from "./importedAudit";
import { ParsedAudit } from "./ParsedAudit";
import { parseApasHtml } from "./parseReport";
import { APAS_PROTOCOL } from "./protocol";
import { useApasImport } from "./useApasImport";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Synthetic fixture; never a real report.
const html = readFileSync(path.resolve(__dirname, "__fixtures__/apas-audit-fake.html"), "utf8");
const audit = parseApasHtml(html)!;
const current = () => useImportedAudit.getState().audit;
const user = (id: string) => ({ id }) as User;
const signedIn = (u: User | null) => useAuthStore.setState({ user: u, loading: false, error: null });

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: true, error: null });
  setImportedAudit(null);
});

describe("imported audit and the signed-in account (review fix, #89)", () => {
  it("clears on sign-out, so the next account never sees it (A → sign-out → B)", () => {
    signedIn(user("A"));
    setImportedAudit(audit);
    signedIn(null);
    expect(current()).toBeNull();
    signedIn(user("B"));
    expect(current()).toBeNull();
  });

  it("clears when the account switches without a sign-out in between", () => {
    signedIn(user("A"));
    setImportedAudit(audit);
    signedIn(user("B"));
    expect(current()).toBeNull();
  });

  it("clears when a guest's audit is followed by a sign-in", () => {
    signedIn(null);
    setImportedAudit(audit);
    signedIn(user("B"));
    expect(current()).toBeNull();
  });

  it("keeps it when auth only finishes loading, or the same user's session refreshes", () => {
    setImportedAudit(audit);
    signedIn(user("A")); // loading → A: who was already signed in, not a change
    expect(current()).toBe(audit);
    signedIn(user("A")); // token refresh
    expect(current()).toBe(audit);
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

  it("a page that isn't an audit clears the previous one", () => {
    setImportedAudit(audit);
    act(() => root.render(createElement(ParsedAudit, { html: "<html><body><h1>Request an APAS</h1></body></html>" })));
    expect(current()).toBeNull();
  });

  it("starting an import, a cancelled import and Discard each clear it", async () => {
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
    setImportedAudit(audit);
    act(() => hook.start());
    expect(current()).toBeNull();
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    window.removeEventListener("message", onStart);
    expect(nonce).not.toBe("");

    setImportedAudit(audit);
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
    expect(current()).toBeNull();

    setImportedAudit(audit);
    act(() => hook.discard());
    expect(current()).toBeNull();
  });
});
