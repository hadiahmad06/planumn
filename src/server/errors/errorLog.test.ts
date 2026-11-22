import { afterEach, describe, expect, it, vi } from "vitest";
import {
  errorDigest,
  errorLogEntry,
  errorLogLine,
  errorMessage,
  logServerError,
  MAX_MESSAGE,
  MAX_STACK_LINES,
  routeOnly,
} from "./errorLog";
import { clientErrorReport, serverDigest } from "@/features/errors/report";

/** L6 (Hadi's Claude, 2026-11-22). */
describe("error log lines", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps only source, route, digest, message and stack", () => {
    const entry = errorLogEntry({ source: "render", route: "/plan/[id]", digest: "123", message: "boom", stack: "Error: boom\n at x" });
    expect(Object.keys(entry).sort()).toEqual(["digest", "message", "route", "source", "stack"]);
    expect(errorLogLine(entry)).toBe(
      '[planumn:error] {"source":"render","route":"/plan/[id]","message":"boom","digest":"123","stack":"Error: boom\\n at x"}',
    );
  });

  it("drops query strings and fragments from routes", () => {
    expect(routeOnly("/api/courses/search?q=csci&ids=1,2")).toBe("/api/courses/search");
    expect(routeOnly("/share#v1.secret-plan")).toBe("/share");
    expect(routeOnly("")).toBe("/");
  });

  it("scrubs email addresses and caps message and stack", () => {
    const entry = errorLogEntry({
      source: "api",
      route: "/auth/delete",
      message: `User student@umn.edu not found ${"x".repeat(1000)}`,
      stack: Array.from({ length: 40 }, (_, i) => `at frame ${i}`).join("\n"),
    });
    expect(entry.message).not.toContain("student@umn.edu");
    expect(entry.message).toContain("[email]");
    expect(entry.message.length).toBeLessThanOrEqual(MAX_MESSAGE + 1);
    expect(entry.stack!.split("\n")).toHaveLength(MAX_STACK_LINES);
  });

  it("reads messages and digests from anything thrown", () => {
    expect(errorMessage(new Error("a"))).toBe("a");
    expect(errorMessage("b")).toBe("b");
    expect(errorMessage({ message: "supabase", details: "row data" })).toBe("supabase");
    expect(errorMessage(42)).toBe("Non-Error value thrown");
    expect(errorDigest(Object.assign(new Error("x"), { digest: "999" }))).toBe("999");
    expect(errorDigest(new Error("x"))).toBeUndefined();
  });

  it("logServerError writes one prefixed line and nothing else from the error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logServerError("/api/programs/[id]", Object.assign(new Error("CourseDog programs 1: 500"), { plan: { title: "secret" } }));
    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0] as string;
    expect(line.startsWith("[planumn:error] ")).toBe(true);
    expect(line).not.toContain("secret");
    expect(JSON.parse(line.slice("[planumn:error] ".length))).toMatchObject({
      source: "api",
      route: "/api/programs/[id]",
      message: "CourseDog programs 1: 500",
    });
  });
});

describe("client error reports", () => {
  it("send the pathname, reference, message and stack only", () => {
    const report = clientErrorReport(new Error("render failed"), "/plan/abc?x=1#v1.snap", "c-0011aabb");
    expect(report.route).toBe("/plan/abc");
    expect(report.digest).toBe("c-0011aabb");
    expect(report.message).toBe("render failed");
    expect(Object.keys(report).sort()).toEqual(["digest", "message", "route", "stack"]);
  });

  it("know when the server already has the error", () => {
    expect(serverDigest(Object.assign(new Error("x"), { digest: "42" }))).toBe("42");
    expect(serverDigest(new Error("x"))).toBeUndefined();
  });
});
