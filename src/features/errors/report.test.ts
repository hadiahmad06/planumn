import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_REFERENCE,
  MAX_REPORTS_PER_DOCUMENT,
  clientErrorReport,
  crashReference,
  resetReportState,
  sendClientErrorReport,
} from "./report";

/**
 * L6 (Hadi's Claude, 2026-11-22): the blocking finding on #115 at 2366ac0. The reporting state lives
 * for the whole document, which a client-side navigation keeps, so it is keyed on the crash.
 */
describe("client crash references and reports", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    resetReportState();
    vi.stubGlobal("window", {});
    fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const crash = (error: unknown, pathname: string) => {
    const reference = crashReference(error, pathname);
    return { reference, sent: sendClientErrorReport(clientErrorReport(error, pathname, reference)) };
  };

  it("M3: the same crash re-rendering or failing again after Try again keeps its reference and sends one report", () => {
    const error = new Error("boom");
    const first = crash(error, "/info/error-check");
    expect(first.reference).toMatch(CLIENT_REFERENCE);
    expect(first.sent).toBe(true);
    // A new Error object with the same message (the component threw again after "Try again").
    const again = crash(new Error("boom"), "/info/error-check");
    expect(again).toEqual({ reference: first.reference, sent: false });
    expect(crashReference(error, "/info/error-check?from=x#share")).toBe(first.reference);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a crash on another route (client-side navigation, same document) gets its own reference and report", () => {
    const a = crash(new Error("boom"), "/info/error-check");
    const b = crash(new Error("boom"), "/plan/error-check");
    expect(b.reference).not.toBe(a.reference);
    expect(b.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(bodies).toMatchObject([
      { route: "/info/error-check", digest: a.reference },
      { route: "/plan/error-check", digest: b.reference },
    ]);
  });

  it("a different message on the same route is a different crash", () => {
    const a = crash(new Error("first"), "/plan/x");
    const b = crash(new Error("second"), "/plan/x");
    expect(b.reference).not.toBe(a.reference);
    expect(b.sent).toBe(true);
  });

  it(`sends at most ${MAX_REPORTS_PER_DOCUMENT} reports per document`, () => {
    const sent = Array.from({ length: MAX_REPORTS_PER_DOCUMENT + 3 }, (_, i) => crash(new Error(`e${i}`), `/r${i}`).sent);
    expect(sent.filter(Boolean)).toHaveLength(MAX_REPORTS_PER_DOCUMENT);
    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_DOCUMENT);
  });

  it("caches nothing during the server render (no window), so requests never share a reference", () => {
    vi.stubGlobal("window", undefined);
    const error = new Error("boom");
    expect(crashReference(error, "/x")).not.toBe(crashReference(error, "/x"));
  });

  it("never throws when fetch is unavailable", () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("offline");
    });
    expect(crash(new Error("boom"), "/x").sent).toBe(true);
  });
});
