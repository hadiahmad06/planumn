import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestError } from "./instrumentation";

/** L6 (Hadi's Claude, 2026-11-22): N1 on #115, one line per crash. */
const request = { path: "/plan/abc?q=secret", method: "GET", headers: { cookie: "session=secret" } };
const context = (routeType: string, renderSource?: string) =>
  ({ routerKind: "App Router", routePath: "/plan/[planId]", routeType, renderSource, revalidateReason: undefined, renderType: "dynamic" }) as never;

describe("onRequestError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs Server Component and route handler errors with the route pattern and digest only", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await onRequestError(Object.assign(new Error("boom"), { digest: "123" }), request, context("render", "react-server-components"));
    await onRequestError(new Error("api"), request, context("route"));
    expect(log).toHaveBeenCalledTimes(2);
    const line = String(log.mock.calls[0][0]);
    expect(line).toContain('"route":"/plan/[planId]"');
    expect(line).toContain('"digest":"123"');
    expect(line).not.toContain("secret");
    expect(String(log.mock.calls[1][0])).toContain('"source":"api"');
  });

  it("leaves client components failing in the HTML render to the error page's report", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await onRequestError(new Error("ssr"), request, context("render", "server-rendering"));
    expect(log).not.toHaveBeenCalled();
  });
});
