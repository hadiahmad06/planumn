import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

/** L6 (Hadi's Claude, 2026-11-22): the abuse limits from M2/M3 on #115. */
const URL_ = "http://localhost/api/client-error";
const ok = { route: "/plan/0b9c3e7a-1111-4222-8333-944445555666", digest: "c-0011aabb", message: 'Unexpected token "secret plan" in JSON' };

function post(body: BodyInit | null, init: { origin?: string; type?: string | null; length?: string } = {}) {
  const headers = new Headers({ origin: init.origin ?? "http://localhost" });
  if (init.type !== null) headers.set("content-type", init.type ?? "application/json");
  if (init.length) headers.set("content-length", init.length);
  return POST(new Request(URL_, { method: "POST", headers, body, duplex: "half" } as RequestInit));
}

function stream(bytes: number) {
  const chunk = new Uint8Array(1024).fill(97);
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= bytes) return controller.close();
      sent += chunk.byteLength;
      controller.enqueue(chunk);
    },
  });
}

describe("POST /api/client-error", () => {
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs a valid report once, as a route pattern with quoted text scrubbed", async () => {
    expect((await post(JSON.stringify(ok))).status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0][0]);
    expect(line).toContain('"route":"/plan/[planId]"');
    expect(line).not.toContain("0b9c3e7a");
    expect(line).not.toContain("secret plan");
    expect(line).toContain('"digest":"c-0011aabb"');
  });

  it("rejects other origins, non-JSON content types, empty and malformed bodies", async () => {
    expect((await post(JSON.stringify(ok), { origin: "https://evil.example" })).status).toBe(403);
    expect((await post(JSON.stringify(ok), { type: "text/plain" })).status).toBe(415);
    expect((await post(JSON.stringify(ok), { type: null })).status).toBe(415);
    expect((await post("")).status).toBe(400);
    expect((await post("{")).status).toBe(400);
    expect((await post(JSON.stringify({ ...ok, route: "plan" }))).status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });

  it("only accepts client references as digests (no forged server digests)", async () => {
    for (const digest of ["2502068178", "c-0011aabbcc", "c-XYZ00000", ""])
      expect((await post(JSON.stringify({ ...ok, digest }))).status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });

  it("caps bodies at 8 KB of bytes: Content-Length first, then while reading a chunked body", async () => {
    expect((await post(JSON.stringify(ok), { length: String(9000) })).status).toBe(413);
    // Chunked (no Content-Length), 100 MB offered: stops at the cap without reading it all.
    const big = stream(100 * 1024 * 1024);
    expect((await post(big)).status).toBe(413);
    // 8 KB of characters but ~24 KB of bytes (€ is 3 bytes in UTF-8).
    expect((await post(JSON.stringify({ ...ok, message: "€".repeat(7900) }))).status).toBe(413);
    expect(log).not.toHaveBeenCalled();
  });

  it("CLIENT_ERROR_REPORTS=off answers 204 without logging", async () => {
    vi.stubEnv("CLIENT_ERROR_REPORTS", "off");
    expect((await post(JSON.stringify(ok))).status).toBe(204);
    expect(log).not.toHaveBeenCalled();
  });
});
